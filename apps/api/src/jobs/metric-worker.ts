import { prisma } from "@mydad/database";

/**
 * Metric Worker — Recalculates computed metrics from normalized data
 *
 * Triggered after data sync or on schedule.
 * For each active KpiConfig, computes the current value from NormalizedData.
 */

interface MetricJobPayload {
  organizationId: string;
  kpiConfigId?: string; // If provided, recalculate only this KPI
}

export async function processMetricJob(payload: MetricJobPayload): Promise<void> {
  const { organizationId, kpiConfigId } = payload;

  console.log(`[metric-worker] Computing metrics for org ${organizationId}`);

  // Load active KPI configs
  const kpiConfigs = await prisma.kpiConfig.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(kpiConfigId ? { id: kpiConfigId } : {}),
    },
  });

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); // Start of quarter
  const periodEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0); // End of quarter

  for (const kpi of kpiConfigs) {
    try {
      let value: number | null = null;

      // Try to get value from NormalizedData
      if (kpi.dataSourceRef) {
        const normalizedData = await prisma.normalizedData.findFirst({
          where: {
            organizationId,
            metricKey: kpi.dataSourceRef,
          },
          orderBy: { periodEnd: "desc" },
        });

        if (normalizedData?.numericValue !== null && normalizedData?.numericValue !== undefined) {
          value = normalizedData.numericValue;
        }
      }

      // Try formula evaluation if no direct data source
      if (value === null && kpi.formula) {
        value = await evaluateFormula(kpi.formula, organizationId);
      }

      if (value === null) continue;

      // Get previous period value for trend calculation
      const previousMetric = await prisma.computedMetric.findFirst({
        where: {
          organizationId,
          kpiConfigId: kpi.id,
          periodEnd: { lt: periodStart },
        },
        orderBy: { periodEnd: "desc" },
      });

      const previousValue = previousMetric?.value ?? null;
      const trend = previousValue !== null && previousValue !== 0
        ? ((value - previousValue) / Math.abs(previousValue)) * 100
        : null;

      // Upsert computed metric
      await prisma.computedMetric.upsert({
        where: {
          organizationId_kpiConfigId_periodStart_periodEnd: {
            organizationId,
            kpiConfigId: kpi.id,
            periodStart,
            periodEnd,
          },
        },
        update: {
          value,
          previousValue,
          trend,
          computedAt: now,
        },
        create: {
          organizationId,
          kpiConfigId: kpi.id,
          value,
          previousValue,
          trend,
          periodStart,
          periodEnd,
          computedAt: now,
        },
      });

      console.log(`[metric-worker] KPI ${kpi.code}: ${value} (trend: ${trend?.toFixed(1)}%)`);
    } catch (err) {
      console.error(`[metric-worker] Error computing KPI ${kpi.code}:`, err);
    }
  }

  // After metrics are computed, check HOSMONY requirements
  await checkHosmonyRequirements(organizationId);

  console.log(`[metric-worker] Completed metrics for org ${organizationId}`);
}

/**
 * Evaluate a formula referencing other KPIs or normalized data
 * Supports simple references like "revenue / employee_count"
 */
async function evaluateFormula(formula: string, organizationId: string): Promise<number | null> {
  // Simple formula evaluator — extract metric references and compute
  const metricRefs = formula.match(/[a-z_]+/g) || [];
  const values: Record<string, number> = {};

  for (const ref of metricRefs) {
    const data = await prisma.normalizedData.findFirst({
      where: { organizationId, metricKey: ref },
      orderBy: { periodEnd: "desc" },
    });
    if (data?.numericValue !== null && data?.numericValue !== undefined) {
      values[ref] = data.numericValue;
    }
  }

  try {
    // Replace metric names with values and evaluate
    let expr = formula;
    for (const [key, val] of Object.entries(values)) {
      expr = expr.replace(new RegExp(key, "g"), val.toString());
    }
    // Safe evaluation for simple arithmetic
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === "number" && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * Check HOSMONY requirements based on computed metrics
 * Auto-validates KPI-type requirements when thresholds are met
 */
async function checkHosmonyRequirements(organizationId: string): Promise<void> {
  const journey = await prisma.hosmonyJourney.findUnique({
    where: { organizationId },
  });

  if (!journey) return;

  // Get all KPI-type requirements for current and target levels
  const requirements = await prisma.orgRequirement.findMany({
    where: {
      organizationId,
      status: { in: ["NOT_STARTED", "IN_PROGRESS", "NOT_MET"] },
      requirement: { type: "KPI" },
    },
    include: { requirement: true },
  });

  for (const orgReq of requirements) {
    const rule = orgReq.requirement.validationRule as any;
    if (!rule?.kpiCode) continue;

    // Find the latest computed metric for this KPI
    const kpiConfig = await prisma.kpiConfig.findFirst({
      where: { organizationId, code: rule.kpiCode },
    });

    if (!kpiConfig) continue;

    const metric = await prisma.computedMetric.findFirst({
      where: { organizationId, kpiConfigId: kpiConfig.id },
      orderBy: { periodEnd: "desc" },
    });

    if (!metric) continue;

    let isMet = false;
    const currentValue = metric.value;

    if (rule.operator === "exists") {
      isMet = true;
    } else if (rule.operator === ">=" && rule.threshold !== undefined) {
      isMet = currentValue >= rule.threshold;
    } else if (rule.operator === ">" && rule.threshold !== undefined) {
      isMet = currentValue > rule.threshold;
    } else if (rule.operator === "<=" && rule.threshold !== undefined) {
      isMet = currentValue <= rule.threshold;
    } else if (rule.operator === "<=_trend" && metric.trend !== null && rule.threshold !== undefined) {
      isMet = metric.trend <= rule.threshold;
    }

    await prisma.orgRequirement.update({
      where: { id: orgReq.id },
      data: {
        status: isMet ? "MET" : "NOT_MET",
        currentValue,
        targetValue: rule.threshold ?? null,
        lastCheckedAt: new Date(),
      },
    });
  }

  // Recalculate journey progress
  const allReqs = await prisma.orgRequirement.findMany({
    where: { organizationId },
    include: { requirement: true },
  });

  const mandatoryReqs = allReqs.filter((r) => r.requirement.isMandatory);
  const metReqs = mandatoryReqs.filter((r) => r.status === "MET" || r.status === "WAIVED");
  const progressPercent = mandatoryReqs.length > 0
    ? (metReqs.length / mandatoryReqs.length) * 100
    : 0;

  // Calculate overall score (weighted)
  const totalWeight = allReqs.reduce((sum, r) => sum + r.requirement.weight, 0);
  const metWeight = allReqs
    .filter((r) => r.status === "MET" || r.status === "WAIVED")
    .reduce((sum, r) => sum + r.requirement.weight, 0);
  const overallScore = totalWeight > 0 ? (metWeight / totalWeight) * 100 : 0;

  await prisma.hosmonyJourney.update({
    where: { id: journey.id },
    data: {
      progressPercent,
      overallScore,
      lastAssessedAt: new Date(),
    },
  });
}

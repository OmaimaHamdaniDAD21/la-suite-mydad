import { prisma } from "@mydad/database";

/**
 * Sync Worker — Processes data synchronization jobs
 *
 * In production, this would use BullMQ:
 *   const worker = new Worker('sync', processSync, { connection: redis })
 *
 * For now, provides the processing logic that can be called directly
 * or integrated with BullMQ later.
 */

interface SyncJobPayload {
  syncJobId: string;
  dataSourceId: string;
  organizationId: string;
}

export async function processSyncJob(payload: SyncJobPayload): Promise<void> {
  const { syncJobId, dataSourceId, organizationId } = payload;

  // Mark job as running
  await prisma.syncJob.update({
    where: { id: syncJobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  try {
    // Load data source config
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: dataSourceId },
    });

    if (!dataSource) {
      throw new Error(`DataSource ${dataSourceId} not found`);
    }

    const fieldMapping = dataSource.fieldMapping as Record<string, string> | null;

    // Fetch raw data based on source type
    let rawRecords: Record<string, unknown>[] = [];

    switch (dataSource.type) {
      case "API":
        // In production: fetch from external API using connectionConfig
        rawRecords = [];
        break;
      case "FILE_UPLOAD":
        // In production: parse uploaded file from S3/MinIO
        rawRecords = [];
        break;
      case "WEBHOOK":
        // Process queued webhook payloads
        const unprocessed = await prisma.rawData.findMany({
          where: { dataSourceId, isProcessed: false },
          take: 1000,
        });
        rawRecords = unprocessed.map((r) => r.payload as Record<string, unknown>);
        break;
      case "MANUAL":
        // Manual entries are already in NormalizedData
        break;
      default:
        break;
    }

    let recordsSuccess = 0;
    let recordsFailed = 0;
    const errors: Array<{ index: number; error: string }> = [];

    // Process each record
    for (let i = 0; i < rawRecords.length; i++) {
      try {
        const record = rawRecords[i];

        // Store raw data
        const rawData = await prisma.rawData.create({
          data: {
            organizationId,
            dataSourceId,
            category: dataSource.category,
            payload: record as any,
            sourceRef: (record as any).id?.toString() || `sync-${syncJobId}-${i}`,
          },
        });

        // Normalize data using field mapping
        if (fieldMapping) {
          for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
            const value = (record as any)[sourceField];
            if (value !== undefined && value !== null) {
              const numericValue = typeof value === "number" ? value : parseFloat(value);

              await prisma.normalizedData.upsert({
                where: {
                  organizationId_metricKey_periodStart_periodEnd: {
                    organizationId,
                    metricKey: targetField,
                    periodStart: new Date(new Date().getFullYear(), 0, 1),
                    periodEnd: new Date(new Date().getFullYear(), 11, 31),
                  },
                },
                update: {
                  numericValue: isNaN(numericValue) ? null : numericValue,
                  textValue: typeof value === "string" ? value : null,
                  source: dataSource.name,
                },
                create: {
                  organizationId,
                  category: dataSource.category,
                  metricKey: targetField,
                  numericValue: isNaN(numericValue) ? null : numericValue,
                  textValue: typeof value === "string" ? value : null,
                  periodStart: new Date(new Date().getFullYear(), 0, 1),
                  periodEnd: new Date(new Date().getFullYear(), 11, 31),
                  source: dataSource.name,
                  confidence: 0.8,
                },
              });
            }
          }
        }

        // Mark raw data as processed
        await prisma.rawData.update({
          where: { id: rawData.id },
          data: { isProcessed: true, processedAt: new Date() },
        });

        recordsSuccess++;
      } catch (err) {
        recordsFailed++;
        errors.push({ index: i, error: (err as Error).message });
      }
    }

    // Update data source last sync
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: recordsFailed === 0 ? "SUCCESS" : "FAILED",
      },
    });

    // Complete the sync job
    await prisma.syncJob.update({
      where: { id: syncJobId },
      data: {
        status: recordsFailed === 0 ? "SUCCESS" : "FAILED",
        recordsTotal: rawRecords.length,
        recordsSuccess,
        recordsFailed,
        errorLog: errors.length > 0 ? errors as any : null,
        completedAt: new Date(),
      },
    });

    console.log(`[sync-worker] Job ${syncJobId} completed: ${recordsSuccess} success, ${recordsFailed} failed`);
  } catch (err) {
    await prisma.syncJob.update({
      where: { id: syncJobId },
      data: {
        status: "FAILED",
        errorLog: { error: (err as Error).message } as any,
        completedAt: new Date(),
      },
    });
    console.error(`[sync-worker] Job ${syncJobId} failed:`, err);
  }
}

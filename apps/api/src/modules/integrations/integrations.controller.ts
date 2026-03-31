import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { AppError } from "../../middleware/error-handler";
import { randomUUID } from "crypto";

// ═══ WEBHOOKS ═══

export async function listWebhooks(req: Request, res: Response, next: NextFunction) {
  try {
    const { orgId } = req.params;

    const webhooks = await prisma.webhook.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ webhooks });
  } catch (err) {
    next(err);
  }
}

export async function createWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const { orgId } = req.params;
    const { direction, outboundUrl, outboundEvents, outboundHeaders } = req.body;

    const data: any = {
      organizationId: orgId,
      direction: direction || "inbound",
    };

    if (direction === "inbound") {
      data.inboundUrl = randomUUID();
      data.inboundSecret = randomUUID();
    } else {
      if (!outboundUrl) throw new AppError(400, "outboundUrl is required for outbound webhooks");
      data.outboundUrl = outboundUrl;
      data.outboundEvents = outboundEvents || [];
      data.outboundHeaders = outboundHeaders || {};
    }

    const webhook = await prisma.webhook.create({ data });

    res.status(201).json({ webhook });
  } catch (err) {
    next(err);
  }
}

export async function updateWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { outboundUrl, outboundEvents, outboundHeaders, isActive } = req.body;

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(outboundUrl !== undefined && { outboundUrl }),
        ...(outboundEvents !== undefined && { outboundEvents }),
        ...(outboundHeaders !== undefined && { outboundHeaders }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ webhook });
  } catch (err) {
    next(err);
  }
}

export async function deleteWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.webhook.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

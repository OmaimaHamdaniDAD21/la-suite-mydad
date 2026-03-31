import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const orgIdAndIdParams = z.object({ orgId: z.string().uuid(), id: z.string().uuid() });
const idParams = z.object({ id: z.string().uuid() });

const assetStatusEnum = z.enum([
  "DRAFT",
  "SUBMITTED",
  "VALIDATED",
  "PUBLISHED",
  "SUSPENDED",
  "ARCHIVED",
]);

export const assetsController = {
  // ─── List org assets ──────────────────────────────────────
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const { status, category, page = "1", limit = "20" } = req.query;

      const where: Record<string, unknown> = { organizationId: orgId };
      if (status) {
        assetStatusEnum.parse(status);
        where.status = status;
      }
      if (category) where.category = category;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

      const [assets, total] = await Promise.all([
        prisma.hosmonicAsset.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.hosmonicAsset.count({ where }),
      ]);

      res.json({ data: assets, total, page: pageNum, limit: limitNum });
    } catch (err) {
      next(err);
    }
  },

  // ─── Create asset ─────────────────────────────────────────
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          category: z.string().min(1),
          impactMetrics: z.record(z.unknown()),
          hosmonyAlignment: z.record(z.unknown()).optional(),
          requiredLevel: z.number().int().min(1).max(10).default(5),
          tags: z.array(z.string()).optional(),
          thumbnailUrl: z.string().url().optional(),
          detailUrl: z.string().url().optional(),
        })
        .parse(req.body);

      const asset = await prisma.hosmonicAsset.create({
        data: {
          organizationId: orgId,
          ...body,
          impactMetrics: body.impactMetrics as any,
          hosmonyAlignment: body.hosmonyAlignment as any,
        },
      });

      res.status(201).json(asset);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update asset ─────────────────────────────────────────
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          category: z.string().min(1).optional(),
          impactMetrics: z.record(z.unknown()).optional(),
          hosmonyAlignment: z.record(z.unknown()).optional(),
          tags: z.array(z.string()).optional(),
          thumbnailUrl: z.string().url().optional(),
          detailUrl: z.string().url().optional(),
        })
        .parse(req.body);

      const existing = await prisma.hosmonicAsset.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Asset not found", "NOT_FOUND");

      if (existing.status !== "DRAFT" && existing.status !== "SUBMITTED") {
        throw new AppError(400, "Can only edit assets in DRAFT or SUBMITTED status", "INVALID_STATUS");
      }

      const asset = await prisma.hosmonicAsset.update({
        where: { id },
        data: {
          ...body,
          impactMetrics: body.impactMetrics as any,
          hosmonyAlignment: body.hosmonyAlignment as any,
        },
      });

      res.json(asset);
    } catch (err) {
      next(err);
    }
  },

  // ─── Submit for validation ────────────────────────────────
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);

      const existing = await prisma.hosmonicAsset.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Asset not found", "NOT_FOUND");

      if (existing.status !== "DRAFT") {
        throw new AppError(400, "Only DRAFT assets can be submitted for validation", "INVALID_STATUS");
      }

      const asset = await prisma.hosmonicAsset.update({
        where: { id },
        data: { status: "SUBMITTED" },
      });

      res.json(asset);
    } catch (err) {
      next(err);
    }
  },

  // ─── Validate asset (requires HOSMONY level >= 5) ────────
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);

      const asset = await prisma.hosmonicAsset.findUnique({ where: { id } });
      if (!asset) throw new AppError(404, "Asset not found", "NOT_FOUND");

      if (asset.status !== "SUBMITTED") {
        throw new AppError(400, "Only SUBMITTED assets can be validated", "INVALID_STATUS");
      }

      // Check org's HOSMONY journey currentLevel >= 5
      const journey = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: asset.organizationId },
        include: { currentLevel: true },
      });

      if (!journey) {
        throw new AppError(400, "Organization has no HOSMONY journey. Cannot validate asset.", "NO_JOURNEY");
      }

      const currentLevel = journey.currentLevel.level;
      if (currentLevel < 5) {
        throw new AppError(
          403,
          `Organization HOSMONY level is ${currentLevel}. Level 5 or higher is required to validate assets.`,
          "INSUFFICIENT_LEVEL"
        );
      }

      const updated = await prisma.hosmonicAsset.update({
        where: { id },
        data: {
          status: "VALIDATED",
          validatedAt: new Date(),
          validatedBy: req.user!.userId,
        },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  // ─── Publish to marketplace ───────────────────────────────
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);

      const asset = await prisma.hosmonicAsset.findUnique({ where: { id } });
      if (!asset) throw new AppError(404, "Asset not found", "NOT_FOUND");

      if (asset.status !== "VALIDATED") {
        throw new AppError(400, "Only VALIDATED assets can be published to marketplace", "INVALID_STATUS");
      }

      const updated = await prisma.hosmonicAsset.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          isPublished: true,
          publishedAt: new Date(),
          visibility: "public",
        },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  // ─── Public marketplace listing ───────────────────────────
  async marketplaceListing(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, tags, page = "1", limit = "20", search } = req.query;

      const where: Record<string, unknown> = {
        isPublished: true,
        status: "PUBLISHED",
      };
      if (category) where.category = category;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

      // Fetch all published assets matching basic filters
      let assets = await prisma.hosmonicAsset.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          impactMetrics: true,
          tags: true,
          thumbnailUrl: true,
          viewCount: true,
          interestCount: true,
          publishedAt: true,
          requiredLevel: true,
        },
      });

      // Filter by tags if provided (JSON array stored in tags field)
      if (tags) {
        const tagList = (tags as string).split(",").map((t) => t.trim().toLowerCase());
        assets = assets.filter((a) => {
          const assetTags = (a.tags as string[] | null) ?? [];
          return tagList.some((t) => assetTags.map((at) => at.toLowerCase()).includes(t));
        });
      }

      // Filter by search text
      if (search) {
        const searchLower = (search as string).toLowerCase();
        assets = assets.filter(
          (a) =>
            a.name.toLowerCase().includes(searchLower) ||
            (a.description && a.description.toLowerCase().includes(searchLower))
        );
      }

      const total = assets.length;
      const paginated = assets.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({ data: paginated, total, page: pageNum, limit: limitNum });
    } catch (err) {
      next(err);
    }
  },

  // ─── Marketplace asset detail ─────────────────────────────
  async marketplaceDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);

      const asset = await prisma.hosmonicAsset.findUnique({ where: { id } });
      if (!asset || !asset.isPublished || asset.status !== "PUBLISHED") {
        throw new AppError(404, "Asset not found in marketplace", "NOT_FOUND");
      }

      // Increment view count
      await prisma.hosmonicAsset.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      res.json({ ...asset, viewCount: asset.viewCount + 1 });
    } catch (err) {
      next(err);
    }
  },

  // ─── Express interest in marketplace asset ────────────────
  async expressInterest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);
      const body = z
        .object({
          message: z.string().optional(),
          contactEmail: z.string().email().optional(),
        })
        .parse(req.body);

      const asset = await prisma.hosmonicAsset.findUnique({ where: { id } });
      if (!asset || !asset.isPublished || asset.status !== "PUBLISHED") {
        throw new AppError(404, "Asset not found in marketplace", "NOT_FOUND");
      }

      // Increment interest count
      const updated = await prisma.hosmonicAsset.update({
        where: { id },
        data: { interestCount: { increment: 1 } },
      });

      res.json({
        message: "Interest registered successfully",
        assetId: id,
        interestCount: updated.interestCount,
        contact: body,
      });
    } catch (err) {
      next(err);
    }
  },
};

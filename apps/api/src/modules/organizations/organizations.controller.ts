import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";

export const organizationsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const memberships = await prisma.userOrganization.findMany({
        where: { userId: req.user!.userId },
        include: { organization: true },
      });
      res.json(memberships.map((m) => ({
        ...m.organization,
        role: m.role,
        isDefault: m.isDefault,
      })));
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const org = await prisma.organization.findUnique({
        where: { id },
        include: { _count: { select: { members: true, clients: true } } },
      });
      if (!org) throw new AppError(404, "Organization not found", "NOT_FOUND");
      res.json(org);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const data = z.object({
        name: z.string().min(1).optional(),
        siret: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        logoUrl: z.string().url().optional(),
      }).parse(req.body);
      const org = await prisma.organization.update({ where: { id }, data });
      res.json(org);
    } catch (err) { next(err); }
  },

  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const members = await prisma.userOrganization.findMany({
        where: { organizationId: id },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } } },
      });
      res.json(members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      })));
    } catch (err) { next(err); }
  },

  async listClients(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const clients = await prisma.organization.findMany({
        where: { parentId: id, type: "ENTREPRISE" },
        include: { _count: { select: { members: true } } },
      });
      res.json(clients);
    } catch (err) { next(err); }
  },

  async addClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const data = z.object({
        name: z.string().min(1),
        siret: z.string().optional(),
        city: z.string().optional(),
      }).parse(req.body);

      const cabinet = await prisma.organization.findUnique({ where: { id } });
      if (!cabinet || cabinet.type !== "CABINET") {
        throw new AppError(400, "Organization is not a cabinet", "NOT_CABINET");
      }

      const client = await prisma.organization.create({
        data: {
          name: data.name,
          type: "ENTREPRISE",
          siret: data.siret,
          city: data.city,
          parentId: id,
        },
      });

      // Create org config for client
      await prisma.orgConfig.create({
        data: { organizationId: client.id, globalSettings: {} },
      });

      res.status(201).json(client);
    } catch (err) { next(err); }
  },
};

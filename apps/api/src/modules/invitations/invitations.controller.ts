import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { invitationSchema, acceptInvitationSchema } from "@mydad/shared";
import { z } from "zod";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";

export const invitationsController = {
  async send(req: Request, res: Response, next: NextFunction) {
    try {
      const data = invitationSchema.parse(req.body);

      // Check if user already has a pending invite
      const existing = await prisma.invitation.findFirst({
        where: { email: data.email, organizationId: data.organizationId, status: "PENDING" },
      });
      if (existing) {
        throw new AppError(409, "Invitation already pending for this email", "INVITE_EXISTS");
      }

      const invitation = await prisma.invitation.create({
        data: {
          email: data.email,
          role: data.role,
          organizationId: data.organizationId,
          senderId: req.user!.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      await logAudit({
        action: "INVITE",
        entityType: "invitation",
        entityId: invitation.id,
        userId: req.user!.userId,
        organizationId: data.organizationId,
        details: { email: data.email, role: data.role },
      });

      // TODO: Send email with invitation link

      res.status(201).json(invitation);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const invitations = await prisma.invitation.findMany({
        where: { senderId: req.user!.userId },
        orderBy: { createdAt: "desc" },
      });
      res.json(invitations);
    } catch (err) { next(err); }
  },

  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = z.object({ token: z.string().uuid() }).parse(req.params);
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { organization: true },
      });

      if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
        throw new AppError(400, "Invalid or expired invitation", "INVALID_INVITE");
      }

      res.json({
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization.name,
      });
    } catch (err) { next(err); }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = z.object({ token: z.string().uuid() }).parse(req.params);
      const data = acceptInvitationSchema.parse({ ...req.body, token });

      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { organization: true },
      });

      if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
        throw new AppError(400, "Invalid or expired invitation", "INVALID_INVITE");
      }

      const passwordHash = await hashPassword(data.password);

      const result = await prisma.$transaction(async (tx) => {
        // Check if user already exists
        let user = await tx.user.findUnique({ where: { email: invitation.email } });

        if (!user) {
          user = await tx.user.create({
            data: {
              email: invitation.email,
              passwordHash,
              firstName: data.firstName,
              lastName: data.lastName,
              emailVerified: true,
            },
          });
        }

        // Create membership
        await tx.userOrganization.create({
          data: {
            userId: user.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
            isDefault: false,
          },
        });

        // Mark invitation as accepted
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });

        return user;
      });

      res.json({ message: "Invitation accepted", userId: result.id });
    } catch (err) { next(err); }
  },

  async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      await prisma.invitation.update({
        where: { id },
        data: { status: "REVOKED" },
      });
      res.json({ message: "Invitation revoked" });
    } catch (err) { next(err); }
  },
};

import { prisma } from "@mydad/database";
import { hashPassword, verifyPassword } from "../../utils/password";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokens";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";
import type { RegisterInput, LoginInput, AuthResponse } from "@mydad/shared";

export const authService = {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, "Email already registered", "EMAIL_EXISTS");
    }

    const passwordHash = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      // Create organization
      const org = await tx.organization.create({
        data: {
          name: data.organizationName,
          type: data.organizationType,
        },
      });

      // Create org config
      await tx.orgConfig.create({
        data: { organizationId: org.id, globalSettings: {} },
      });

      // Determine role based on org type
      const role = data.organizationType === "CABINET" ? "EXPERT_COMPTABLE" as const : "DIRIGEANT" as const;

      // Create membership
      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role,
          isDefault: true,
        },
      });

      // Create refresh token
      const refreshTokenValue = generateRefreshToken();
      await tx.refreshToken.create({
        data: {
          token: refreshTokenValue,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        organizationId: org.id,
        role,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          currentMembership: {
            organizationId: org.id,
            organizationName: org.name,
            organizationType: org.type,
            role,
          },
          memberships: [{
            organizationId: org.id,
            organizationName: org.name,
            organizationType: org.type,
            role,
            isDefault: true,
          }],
        },
        tokens: {
          accessToken,
          refreshToken: refreshTokenValue,
        },
      };
    });

    await logAudit({
      action: "CREATE",
      entityType: "user",
      entityId: result.user.id,
      userId: result.user.id,
    });

    return result;
  },

  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        memberships: {
          include: { organization: true },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const defaultMembership = user.memberships.find((m) => m.isDefault) || user.memberships[0];
    if (!defaultMembership) {
      throw new AppError(403, "No organization membership found", "NO_MEMBERSHIP");
    }

    // Create refresh token
    const refreshTokenValue = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: defaultMembership.organizationId,
      role: defaultMembership.role,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAudit({
      action: "LOGIN",
      entityType: "user",
      entityId: user.id,
      userId: user.id,
      organizationId: defaultMembership.organizationId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        currentMembership: {
          organizationId: defaultMembership.organizationId,
          organizationName: defaultMembership.organization.name,
          organizationType: defaultMembership.organization.type,
          role: defaultMembership.role,
        },
        memberships: user.memberships.map((m) => ({
          organizationId: m.organizationId,
          organizationName: m.organization.name,
          organizationType: m.organization.type,
          role: m.role,
          isDefault: m.isDefault,
        })),
      },
      tokens: {
        accessToken,
        refreshToken: refreshTokenValue,
      },
    };
  },

  async refresh(refreshTokenValue: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: {
        user: {
          include: {
            memberships: {
              include: { organization: true },
            },
          },
        },
      },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError(401, "Invalid or expired refresh token", "INVALID_REFRESH");
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const defaultMembership = stored.user.memberships.find((m) => m.isDefault) || stored.user.memberships[0];
    if (!defaultMembership) {
      throw new AppError(403, "No organization membership", "NO_MEMBERSHIP");
    }

    // Issue new tokens
    const newRefreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = generateAccessToken({
      userId: stored.user.id,
      email: stored.user.email,
      organizationId: defaultMembership.organizationId,
      role: defaultMembership.role,
    });

    return {
      tokens: { accessToken, refreshToken: newRefreshToken },
    };
  },

  async logout(refreshTokenValue: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshTokenValue, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal if email exists

    // TODO: Generate reset token and send email
    // For now, just log it
  },

  async resetPassword(token: string, newPassword: string) {
    // TODO: Implement with reset token table
    throw new AppError(501, "Not implemented yet", "NOT_IMPLEMENTED");
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new AppError(404, "User not found", "NOT_FOUND");
    }

    const defaultMembership = user.memberships.find((m) => m.isDefault) || user.memberships[0];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      currentMembership: defaultMembership
        ? {
            organizationId: defaultMembership.organizationId,
            organizationName: defaultMembership.organization.name,
            organizationType: defaultMembership.organization.type,
            role: defaultMembership.role,
          }
        : null,
      memberships: user.memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        organizationType: m.organization.type,
        role: m.role,
        isDefault: m.isDefault,
      })),
    };
  },

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };
  },
};

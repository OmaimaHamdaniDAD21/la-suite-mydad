import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@mydad/shared";
import { z } from "zod";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json(result);
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
      const result = await authService.refresh(refreshToken);
      res.json(result);
    } catch (err) { next(err); }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
      await authService.logout(refreshToken);
      res.json({ message: "Logged out" });
    } catch (err) { next(err); }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(data.email);
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(data.token, data.password);
      res.json({ message: "Password reset successfully" });
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json(user);
    } catch (err) { next(err); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        avatarUrl: z.string().url().optional(),
      }).parse(req.body);
      const user = await authService.updateProfile(req.user!.userId, data);
      res.json(user);
    } catch (err) { next(err); }
  },
};

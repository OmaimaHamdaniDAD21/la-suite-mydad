import { Router } from "express";
import { authController } from "./auth.controller";
import { authGuard } from "../../middleware/auth.guard";

export const authRoutes = Router();

authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authGuard, authController.logout);
authRoutes.post("/forgot-password", authController.forgotPassword);
authRoutes.post("/reset-password", authController.resetPassword);
authRoutes.get("/me", authGuard, authController.me);
authRoutes.put("/me", authGuard, authController.updateProfile);

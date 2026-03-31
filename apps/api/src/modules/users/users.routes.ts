import { Router } from "express";
import { authGuard } from "../../middleware/auth.guard";

export const userRoutes = Router();

userRoutes.use(authGuard);

// User routes will be expanded later

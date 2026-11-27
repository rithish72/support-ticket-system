import { Router } from "express";
import { getMe, login, logout, register } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rate-limit.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginBody, registerBody } from "../validators/auth.validator";

const router = Router();

router.post("/register", authLimiter, validate({ body: registerBody }), register);
router.post("/login", authLimiter, validate({ body: loginBody }), login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

export default router;

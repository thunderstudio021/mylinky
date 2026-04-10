import { Router } from "express";
import authRoutes from "./auth.js";
import usersRoutes from "./users.js";
import postsRoutes from "./posts.js";
import creatorsRoutes from "./creators.js";
import subscriptionsRoutes from "./subscriptions.js";
import paymentsRoutes from "./payments.js";
import adminRoutes from "./admin.js";
import messagesRoutes from "./messages.js";
import notificationsRoutes from "./notifications.js";
import withdrawalsRoutes from "./withdrawals.js";
import bannersRoutes from "./banners.js";

export const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/posts", postsRoutes);
router.use("/creators", creatorsRoutes);
router.use("/subscriptions", subscriptionsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/admin", adminRoutes);
router.use("/messages", messagesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/withdrawals", withdrawalsRoutes);
router.use("/banners", bannersRoutes);

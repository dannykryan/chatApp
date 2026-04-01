import express from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import friendsRoutes from "./friends.routes.js";
import roomsRoutes from "./rooms.routes.js";

const router = express.Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(friendsRoutes);
router.use(roomsRoutes);

export default router;

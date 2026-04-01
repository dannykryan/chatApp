import express from "express";
import prisma from "../lib/prisma.js";
import { FriendStatus } from "@prisma/client";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Route to handle friend requests and relationships
router.post("/friends/add", verifyToken, async (req, res) => {
  try {
    const { friendUsername } = req.body;

    if (!friendUsername) {
      return res.status(400).json({ error: "Friend username is required" });
    }

    const receiver = await prisma.user.findUnique({
      where: { username: friendUsername },
    });

    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if a relationship already exists in either direction
    const existing = await prisma.friends.findFirst({
      where: {
        OR: [
          { userId1: req.user.userId, userId2: receiver.id },
          { userId1: receiver.id, userId2: req.user.userId },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Friend request already exists" });
    }

    const created = await prisma.friends.create({
      data: {
        userId1: req.user.userId,
        userId2: receiver.id,
        status: FriendStatus.PENDING,
      },
    });

    const io = req.app.get("io");
    io.to(`user:${req.user.userId}`).emit("friendRequestUpdated", {
      userId1: created.userId1,
      userId2: created.userId2,
      status: created.status,
    });
    io.to(`user:${receiver.id}`).emit("friendRequestUpdated", {
      userId1: created.userId1,
      userId2: created.userId2,
      status: created.status,
    });

    res.json({ message: "Friend request sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Additional routes for accepting/rejecting friend requests, removing friends, etc. can be added here
router.post("/friends/respond", verifyToken, async (req, res) => {
  try {
    const { senderId, friendRequestResponse } = req.body;

    if (!senderId || friendRequestResponse === undefined) {
      return res
        .status(400)
        .json({ error: "Sender ID and action are required" });
    }

    // Sender is userId1, current user is userId2
    const friendRecord = await prisma.friends.findFirst({
      where: {
        userId1: senderId,
        userId2: req.user.userId,
        status: FriendStatus.PENDING,
      },
    });

    if (!friendRecord) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    const io = req.app.get("io");

    if (friendRequestResponse === true) {
      const updated = await prisma.friends.update({
        where: {
          userId1_userId2: {
            userId1: friendRecord.userId1,
            userId2: friendRecord.userId2,
          },
        },
        data: { status: FriendStatus.FRIENDS },
      });

      io.to(`user:${updated.userId1}`).emit("friendRequestUpdated", updated);
      io.to(`user:${updated.userId2}`).emit("friendRequestUpdated", updated);

      return res.json({ message: "Friend request accepted" });
    }

    if (friendRequestResponse === false) {
      const deleted = await prisma.friends.delete({
        where: {
          userId1_userId2: {
            userId1: friendRecord.userId1,
            userId2: friendRecord.userId2,
          },
        },
      });

      io.to(`user:${deleted.userId1}`).emit("friendRequestUpdated", {
        userId1: deleted.userId1,
        userId2: deleted.userId2,
        status: "NONE",
      });
      io.to(`user:${deleted.userId2}`).emit("friendRequestUpdated", {
        userId1: deleted.userId1,
        userId2: deleted.userId2,
        status: "NONE",
      });

      return res.json({ message: "Friend request declined" });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Route to check if a user is a friend
router.get("/friends/status/:friendUsername", verifyToken, async (req, res) => {
  try {
    const { friendUsername } = req.params;

    if (!friendUsername) {
      return res.status(400).json({ error: "Friend username is required" });
    }

    const friend = await prisma.user.findUnique({
      where: { username: friendUsername },
    });

    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendRecord = await prisma.friends.findFirst({
      where: {
        OR: [
          { userId1: req.user.userId, userId2: friend.id },
          { userId1: friend.id, userId2: req.user.userId },
        ],
      },
    });

    if (!friendRecord) {
      return res.json({ status: "NONE" });
    }

    res.json({
      status: friendRecord.status,
      userId1: friendRecord.userId1,
      userId2: friendRecord.userId2,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to remove a friend
router.delete("/friends/remove", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Friend username is required" });
    }

    const friend = await prisma.user.findUnique({
      where: { username },
    });

    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.friends.deleteMany({
      where: {
        OR: [
          { userId1: req.user.userId, userId2: friend.id },
          { userId1: friend.id, userId2: req.user.userId },
        ],
      },
    });

    const io = req.app.get("io");
    const payload = {
      userId1: req.user.userId,
      userId2: friend.id,
      status: "NONE",
    };

    io.to(`user:${req.user.userId}`).emit("friendRequestUpdated", payload);
    io.to(`user:${friend.id}`).emit("friendRequestUpdated", payload);

    res.json({ message: "Friend removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
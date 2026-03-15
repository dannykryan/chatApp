import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { FriendRequestStatus } from "@prisma/client";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const saltRounds = 10;

router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    if (!user) {
      return res.status(500).json({ error: "User creation failed" });
    }

    res
      .status(201)
      .json({ message: "User registered successfully", user: user.id });
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid email/username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    // Compare password with the hashed password stored in the database
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: "Invalid email/username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      username: user.username,
      profilePictureUrl: user.profilePictureUrl,
    });
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/friends/add", verifyToken, async (req, res) => {
  try {
    const { friendUsername } = req.body;

    if (!friendUsername) {
      return res.status(400).json({ error: "Friend username is required" });
    }

    // Find the receiver user by username
    const receiver = await prisma.user.findUnique({
      where: { username: friendUsername },
    });

    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if a request already exists in either direction
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: req.user.userId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: req.user.userId },
        ],
      },
    });

    if (existingRequest) {
      return res.status(409).json({ error: "Friend request already exists" });
    }

    const created = await prisma.friendRequest.create({
      data: {
        senderId: req.user.userId,
        receiverId: receiver.id,
        status: FriendRequestStatus.PENDING,
      },
    });

    const io = req.app.get("io");
    io.to(`user:${req.user.userId}`).emit("friendRequestUpdated", {
      senderId: created.senderId,
      receiverId: created.receiverId,
      status: created.status,
    });
    io.to(`user:${receiver.id}`).emit("friendRequestUpdated", {
      senderId: created.senderId,
      receiverId: created.receiverId,
      status: created.status,
    });

    res.json({ message: "Friend request sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Additional routes for accepting/rejecting friend requests, removing friends, etc. can be added here
router.post("/friends/respond", verifyToken, async (req, res) => {
  console.log("Received friend request response:", req.body);

  try {
    const { senderId, friendRequestResponse } = req.body;

    if (!senderId || friendRequestResponse === undefined) {
      return res
        .status(400)
        .json({ error: "Sender ID and action are required" });
    }

    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId: req.user.userId,
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    const io = req.app.get("io");

    if (friendRequestResponse === true) {
      const updated = await prisma.friendRequest.update({
        where: { id: friendRequest.id },
        data: { status: FriendRequestStatus.ACCEPTED },
      });

      io.to(`user:${updated.senderId}`).emit("friendRequestUpdated", updated);
      io.to(`user:${updated.receiverId}`).emit("friendRequestUpdated", updated);

      return res.json({ message: "Friend request accepted" });
    }

    if (friendRequestResponse === false) {
      const deleted = await prisma.friendRequest.delete({
        where: { id: friendRequest.id },
      });

      io.to(`user:${deleted.senderId}`).emit("friendRequestUpdated", {
        senderId: deleted.senderId,
        receiverId: deleted.receiverId,
        status: "NONE",
      });
      io.to(`user:${deleted.receiverId}`).emit("friendRequestUpdated", {
        senderId: deleted.senderId,
        receiverId: deleted.receiverId,
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

    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: req.user.userId, receiverId: friend.id },
          { senderId: friend.id, receiverId: req.user.userId },
        ],
      },
    });

    if (!friendRequest) {
      return res.json({ status: "NONE" });
    }

    res.json({
      status: friendRequest.status,
      senderId: friendRequest.senderId,
      receiverId: friendRequest.receiverId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to remove a friend
router.delete("/friends/remove", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    console.log("Request body:", req.body);
    if (!username) {
      return res.status(400).json({ error: "Friend username is required" });
    }

    const friend = await prisma.user.findUnique({
      where: { username },
    });
    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }
    const deleted = await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: req.user.userId, receiverId: friend.id },
          { senderId: friend.id, receiverId: req.user.userId },
        ],
      },
    });

    const io = req.app.get("io");
    const payload = {
      senderId: req.user.userId,
      receiverId: friend.id,
      status: "NONE",
    };

    io.to(`user:${req.user.userId}`).emit("friendRequestUpdated", payload);
    io.to(`user:${friend.id}`).emit("friendRequestUpdated", payload);

    res.json({ message: "Friend removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/auth/logout", verifyToken, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        isOnline: false,
        lastOnline: new Date(),
      },
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/me", verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        profilePictureUrl: true,
        bio: true,
        lastOnline: true,
        createdAt: true,
        updatedAt: true,
        spotifyDisplayName: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/user/me", verifyToken, async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.userId },
    });

    res.json({ message: "User account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
        bio: true,
        lastOnline: true,
        isOnline: true,
        spotifyDisplayName: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    await prisma.user.delete({
      where: { username },
    });

    res.json({ message: "User account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

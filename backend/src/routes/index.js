import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { FriendStatus } from "@prisma/client";
import { verifyToken } from "../middleware/verifyToken.js";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const saltRounds = 10;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY, // service key here, NOT the anon key
);

// Store file in memory as a buffer rather than writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

router.post(
  "/user/me/avatar",
  verifyToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `UserAvatars/${req.user.userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("Images")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from("Images")
        .getPublicUrl(fileName);

      // Save the new URL to the user's profile in Prisma
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { profilePictureUrl: urlData.publicUrl },
      });

      res.json({ profilePictureUrl: urlData.publicUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

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
      id: user.id,
      username: user.username,
      profilePictureUrl: user.profilePictureUrl,
      isOnline: user.isOnline,
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
        isOnline: true,
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

router.put("/user/me", verifyToken, async (req, res) => {
  try {
    const { username, email, bio } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { username, email, bio },
      select: {
        id: true,
        username: true,
        email: true,
        profilePictureUrl: true,
        bio: true,
        lastOnline: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
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

// Get all rooms for the current user
router.get("/rooms", verifyToken, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: { userId: req.user.userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
                isOnline: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Attach unread count to each room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const member = room.members.find((m) => m.userId === req.user.userId);
        const unreadCount = await prisma.message.count({
          where: {
            roomId: room.id,
            sentAt: { gt: member?.lastReadAt ?? new Date(0) },
            senderId: { not: req.user.userId },
            isDeleted: false,
          },
        });
        return { ...room, unreadCount };
      }),
    );

    res.json(roomsWithUnread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single room by ID
router.get("/rooms/:roomId", verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
                isOnline: true,
                lastOnline: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check user is a member
    const isMember = room.members.some((m) => m.userId === req.user.userId);
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this room" });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a room (paginated)
router.get("/rooms/:roomId/messages", verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { cursor, limit = 50 } = req.query;

    // Check user is a member
    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: req.user.userId } },
    });

    if (!member) {
      return res
        .status(403)
        .json({ error: "You are not a member of this room" });
    }

    // Update lastReadAt when user fetches messages
    await prisma.roomMember.update({
      where: { roomId_userId: { roomId, userId: req.user.userId } },
      data: { lastReadAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: {
        roomId,
        isDeleted: false,
        ...(cursor && { sentAt: { lt: new Date(cursor) } }),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { sentAt: "desc" },
      take: Number(limit),
    });

    // Return in ascending order for display
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/rooms/:roomId/messages", verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, replyToId } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Check user is a member
    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: req.user.userId } },
    });

    if (!member) {
      return res
        .status(403)
        .json({ error: "You are not a member of this room" });
    }

    // If replying, check the parent message exists in the same room
    if (replyToId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: replyToId },
      });

      if (!parentMessage || parentMessage.roomId !== roomId) {
        return res
          .status(404)
          .json({ error: "Reply target not found in this room" });
      }
    }

    const message = await prisma.message.create({
      data: {
        roomId,
        senderId: req.user.userId,
        content: content.trim(),
        ...(replyToId && { replyToId }),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Emit the new message to all users in the room via Socket.IO
    const io = req.app.get("io");
    io.to(`room:${roomId}`).emit("message:new", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

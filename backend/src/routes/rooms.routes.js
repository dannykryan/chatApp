import express from "express";
import prisma from "../lib/prisma.js";
import { verifyToken } from "../middleware/verifyToken.js";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// Store uploaded image in memory as a buffer rather than writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

router.post(
  "/rooms/:roomId/avatar",
  verifyToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { roomId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { id: true },
      });

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const member = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId: req.user.userId } },
      });

      if (!member) {
        return res
          .status(403)
          .json({ error: "You are not a member of this room" });
      }

      const fileExt = req.file.originalname.split(".").pop() || "jpg";
      const fileName = `RoomAvatars/${roomId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("Images")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("Images")
        .getPublicUrl(fileName);

      await prisma.room.update({
        where: { id: roomId },
        data: { imageUrl: urlData.publicUrl },
      });

      const io = req.app.get("io");
      io.to(`room:${roomId}`).emit("room:updated", {
        roomId,
        imageUrl: urlData.publicUrl,
      });

      return res.json({ imageUrl: urlData.publicUrl });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
);

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
                isSystem: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
                isSystem: true,
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

// Create a new room (group or DM)
router.post("/rooms", verifyToken, async (req, res) => {
  try {
    const { name, type, memberIds, memberUsername } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    if (type === "DIRECT_MESSAGE") {
      if (!memberUsername) {
        return res
          .status(400)
          .json({ error: "memberUsername is required for DMs" });
      }
      // Find the target user
      const targetUser = await prisma.user.findUnique({
        where: { username: memberUsername },
      });
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      // Check for existing DM room (must have exactly these two members)
      const existingRoom = await prisma.room.findFirst({
        where: {
          type: "DIRECT_MESSAGE",
          members: {
            every: {
              userId: { in: [req.user.userId, targetUser.id] },
            },
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
                  isSystem: true,
                },
              },
            },
          },
        },
      });
      if (existingRoom) {
        return res
          .status(409)
          .json({ error: "DM room already exists", room: existingRoom });
      }
      // Create the DM room
      const room = await prisma.room.create({
        data: {
          type: "DIRECT_MESSAGE",
          members: {
            create: [{ userId: req.user.userId }, { userId: targetUser.id }],
          },
        },
      });
      // Fetch the full room with members and user info
      const fullRoom = await prisma.room.findUnique({
        where: { id: room.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profilePictureUrl: true,
                  isOnline: true,
                  isSystem: true,
                },
              },
            },
          },
        },
      });

      // Emit 'dm:new' to both users (after room creation, only for DMs)
      const io = req.app.get("io");
      io.to(`user:${req.user.userId}`).emit("dm:new", fullRoom);
      io.to(`user:${targetUser.id}`).emit("dm:new", fullRoom);

      return res.status(201).json(fullRoom);
    }

    // For group/public rooms
    if (
      !name ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({
          error: "Name and memberIds are required for group/public rooms",
        });
    }

    // Create the group/public room
    const room = await prisma.room.create({
      data: {
        name,
        type,
        members: {
          create: memberIds.map((userId) => ({ userId })),
        },
      },
    });
    // Fetch the full room with members and user info
    const fullRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
                isOnline: true,
                isSystem: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json(fullRoom);
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
            isSystem: true,
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
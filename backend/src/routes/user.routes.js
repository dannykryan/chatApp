import express from "express";
import prisma from "../lib/prisma.js";
import { verifyToken } from "../middleware/verifyToken.js";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

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


// Route to handle user profile updates, including avatar uploads
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

// Route to get user's profile information
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


// Route to delete user's account
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


// Route to update user's profile information (username, email, bio)
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


// Route to get another user's profile by username
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

// Route to delete a user by username (admin use only, no auth for simplicity)
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
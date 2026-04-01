import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const saltRounds = 10;

router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, profilePictureUrl } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Check if username exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already taken" });
    }

    // Email format validation (optional, frontend should do this too)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        profilePictureUrl,
      },
    });

    if (!user) {
      return res.status(500).json({ error: "User creation failed" });
    }

    // Find the system account and set up welcome DM
    const systemUser = await prisma.user.findFirst({
      where: { username: "chatapp_team" },
    });

    if (systemUser) {
      // Make chatapp_team friends with the new user automatically
      await prisma.friends.create({
        data: {
          userId1: systemUser.id,
          userId2: user.id,
          status: "FRIENDS",
        },
      });

      // Create a DM room between chatapp_team and the new user
      const welcomeDM = await prisma.room.create({
        data: {
          type: "DIRECT_MESSAGE",
          isPublic: false,
          createdById: systemUser.id,
          members: {
            create: [{ userId: systemUser.id }, { userId: user.id }],
          },
        },
      });

      // Send the welcome message
      await prisma.message.create({
        data: {
          roomId: welcomeDM.id,
          senderId: systemUser.id,
          content: `Hey ${username}, welcome to ChatApp! 👋 We're the ChatApp Team. Feel free to look around — if you have any feedback or run into any issues, let us know. Enjoy! 🚀`,
        },
      });
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

export default router;
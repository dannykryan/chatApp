import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";

const saltRounds = 10;

// POST /api/auth/register
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

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    // Compare password with the hashed password stored in the database
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ token, username: user.username });
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

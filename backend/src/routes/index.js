import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../db/supabase.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";

const saltRounds = 10;
// const myPlaintextPassword = 's0/\/\P4$$w0rD';
// const someOtherPlaintextPassword = 'not_bacon';

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Allfields required" });
    }

    const passwordHash = await bcrypt.hashSync(password, saltRounds);

    const { data, error } = await supabase
      .from("users")
      .insert([{ username, email, password_hash: passwordHash }])
      .select() // Return the inserted data
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res
      .status(201)
      .json({ message: "User registered successfully", user: data.id });
  } catch (error) {
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

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compareSync(
      password,
      user.password_hash,
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
    res.status(500).json({ error: error.message });
  }
});

export default router;
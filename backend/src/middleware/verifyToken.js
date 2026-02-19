import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(400).json({ error: "No token provided" });
    }

    // Format: "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(400).json({ error: "Invalid token format" })
    }

    //Verify Token signature
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    next();

  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token"});
  }
};
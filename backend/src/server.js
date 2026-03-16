import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./lib/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const PORT = process.env.PORT || 4000;

const JWT_SECRET = process.env.JWT_SECRET;

const expressServer = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

const io = new Server(expressServer, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

io.on("connection", async (socket) => {
  console.log("Socket connected:", socket.id);

  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log("No token provided, disconnecting");
      socket.disconnect(true);
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Socket authenticated for userId:", decoded.userId);

    const userId = decoded.userId;

    socket.join(`user:${userId}`);

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastOnline: new Date() },
    });

    // Notify everyone first
    io.emit("userOnline", { userId });

    const onlineUsers = await prisma.user.findMany({
      where: { isOnline: true },
      select: { id: true },
    });

    socket.emit("presence:init", {
      userIds: onlineUsers.map((u) => u.id),
    });

    // Handle late presence requests
    socket.on("presence:request", async () => {
      console.log("presence:request received from", userId);
      const onlineUsers = await prisma.user.findMany({
        where: { isOnline: true },
        select: { id: true },
      });
      socket.emit("presence:init", {
        userIds: onlineUsers.map((u) => u.id),
      });
    });

    socket.on("disconnect", async () => {
      console.log("User going offline:", userId);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastOnline: new Date() },
      });
      io.emit("userOffline", { userId });
    });
  } catch (err) {
    console.log("Socket auth error:", err.message);
    socket.disconnect(true);
  }
});

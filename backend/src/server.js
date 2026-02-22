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

io.on("connect", async (socket) => {
  // JWT verification
  const token = socket.handshake.auth.token; // Get the token from the client's handshake auth data
  if (!token) {
    console.log("No token provided, disconnecting");
    socket.disconnect();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // Attach user info to socket

    // Mark user as online
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isOnline: true, lastOnline: new Date() }
    });

    socket.broadcast.emit("userOnline", { userId: decoded.userId });

    console.log(
      `User ${decoded.username} connected with socket ID: ${socket.id}`,
    ); // Log the username and socket ID of the connected user
  } catch (error) {
    console.log("Invalid token, disconnecting");
    socket.disconnect();
    return;
  }

  // socket.emit will emit to THIS specific client
  socket.emit("welcomeMessage", "Welcome to the chat app!");

  // io.emit will emit to ALL connected clients
  io.emit("newClient", socket.id);

  socket.on("messageFromClientToServer", (newMessage) => {
    // io.emit('helloAll', newMessage) // Emit the message to all clients
    io.emit("MessageFromServerToAllClients", newMessage); // Log the message received from the client
  });

  socket.on("chatMessage", ({ username, text }) => {
    const senderUsername = socket.user?.username || username;
    io.emit("chatMessage", `${senderUsername}: ${text}`);
  });

  socket.on("disconnect", async () => {
    if (socket.user) {
      await prisma.user.update({
        where: { id: socket.user.userId },
        data: { isOnline: false, lastOnline: new Date() },
      });
      socket.broadcast.emit("userOffline", { userId: socket.user.userId });
      console.log(`User ${socket.user.username} disconnected`);
    }
  });
});

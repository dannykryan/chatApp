import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";

const expressServer = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

const io = new Server(expressServer, {
  cors: {
    origin: "*",
  },
});

// 'on' is a regular javascript/node event listener
// it listens for the 'connection' event which is emitted when a client connects to the server
io.on("connect", (socket) => {

  console.log("handshake", socket.handshake);
  // JWT verification
  const token = socket.handshake.auth.token; // Get the token from the client's handshake auth data
  if (!token) {
    console.log("No token provided, disconnecting");
    socket.disconnect();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // Atach user info to socket
    console.log(`User ${decoded.username} connected with socket ID: ${socket.id}`); // Log the username and socket ID of the connected user
  } catch(error) {
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
});

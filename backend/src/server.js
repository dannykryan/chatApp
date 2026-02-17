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
  // JWT verification
  const token = socket.handshake.auth.token; // Get the token from the client's handshake auth data
  if (!token) {
    console.log("No token provided, disconnecting");
    socket.disconnect();
    return;
  }
  // the first argument of the emit, is the event name, the second argument is the data we want to send to the client
  // You can use any word except what is reserved for Socket.IO (like 'connect', 'disconnect', etc.) see https://socket.io/docs/v4/emit-cheatsheet
  console.log("A user connected: ", socket.id); // Log when a user connects

  // socket.emit will emit to THIS specific client
  socket.emit("welcome", "Welcome to the chat app!");

  // io.emit will emit to ALL connected clients
  io.emit("newClient", socket.id);

  // We can get the secret and the query parameters from the handshake object passed by the client
  console.log("handshake:", socket.handshake);

  // if using auth, we could socket.disconnect() if the secret is wrong, for example
  // let {auth: {secret}, query: {meaningOfLife}} = socket.handshake
  // if (secret !== "This is a secret") {
  //     socket.disconnect()
  // } else {
  //     console.log('The meaning of life is:', meaningOfLife) // Log the meaning of life from the query parameters
  // }

  socket.on("messageFromClientToServer", (newMessage) => {
    // io.emit('helloAll', newMessage) // Emit the message to all clients
    io.emit("MessageFromServerToAllClients", newMessage); // Log the message received from the client
  });
});

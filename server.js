const express = require('express');
const app = express() // Create the Express application
app.use(express.static('public')) // Serve static files from the 'public' directory
const expressServer = app.listen(3000) // Start the server on port 3000, save as a variable

const socketio = require('socket.io') // Import Socket.IO
const io = socketio(expressServer, {

}) // Attach Socket.IO to the server

// 'on' is a regular javascript/node event listener
// it listens for the 'connection' event which is emitted when a client connects to the server
io.on ('connect', socket => {
    console.log('A user connected: ', socket.id) // Log when a user connects
    // the first argument of the emit, is the event aneme, the second argument is the data we want to send to the client
    socket.emit('welcome', 'Welcome to the chat app!') // Send a welcome message to the connected client
})
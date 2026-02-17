const app = require('./app')
const http = require('http')
const expressServer = app.listen(3000, () => {
    console.log('Server is listening on port 3000') // Log when the server starts
}) // Start the server on port 3000, save as a variable

const socketio = require('socket.io') // Import Socket.IO
const io = socketio(expressServer, {

}) // Attach Socket.IO to the server

// 'on' is a regular javascript/node event listener
// it listens for the 'connection' event which is emitted when a client connects to the server
io.on ('connect', socket => {
    // the first argument of the emit, is the event aneme, the second argument is the data we want to send to the client
        // You can use any word except what is reserved for Socket.IO (like 'connect', 'disconnect', etc.) see https://socket.io/docs/v4/emit-cheatsheet
    console.log('A user connected: ', socket.id) // Log when a user connects
    // socket.emit will emit to THIS specific client
    // socket.emit('welcome', 'Welcome to the chat app!')
    // io.emit will emit to ALL connected clients
    // io.emit('newClient', socket.id)

    // socket.on('welcomeReceived', data => {
    //     console.log(data) // Log the message received from the client
    // })

    // We can get the secret and the query parameters from the handshake object passed by the client
    // console.log(socket.handshake)

    // if using auth, we could socket.disconnect() if the secret is wrong, for example
    // let {auth: {secret}, query: {meaningOfLife}} = socket.handshake
    // if (secret !== "This is a secret") {
    //     socket.disconnect()
    // } else {
    //     console.log('The meaning of life is:', meaningOfLife) // Log the meaning of life from the query parameters
    // }

    socket.on('messageFromClientToServer', newMessage => {
        // io.emit('helloAll', newMessage) // Emit the message to all clients
        io.emit('MessageFromServerToAllClients', newMessage) // Log the message received from the client
    })
})


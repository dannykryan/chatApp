// io() connects to the Socket.IO server at the specified URL
const socket = io('http://localhost:3000', {
    // options can be passed here if needed, see https://socket.io/docs/v4/client-options/
    auth: {
        secret: "This is a secret",
    },
    query: {
        meaningOfLife: 42,
    }
})

// Just like on the server, our socket has an 'on' method and an 'emit' method
socket.on('welcome', data => {
    console.log(data) // Log the welcome message received from the server
    // once welcome is emitted from the server, re run this callback
    socket.emit('welcomeReceived', 'Client says: Thank you for the welcome message!')
})

socket.on('helloAll', data => {
    console.log('Message from server to all clients:', data) // Log the helloAll message received from the server
})

socket.on('newCLient', data => {
    console.log(data, 'has joined the chat!') // Log the new client message received from the server
})
// io() connects to the Socket.IO server at the specified URL
const socket = io('http://localhost:3000')

// Just like on the server, our socket has an 'on' method and an 'emit' method
socket.on('welcome', data => {
    console.log(data) // Log the welcome message received from the server
})
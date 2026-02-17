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

socket.on('newClient', data => {
    console.log(data, 'has joined the chat!') // Log the new client message received from the server
})

socket.on('MessageFromServerToAllClients', newMessage => {
    const newMessageElement = document.createElement('li') // Create a new list item element for the message
    newMessageElement.textContent = newMessage // Set the text content of the new message element to the data received from the server
    document.getElementById('messages-container').appendChild(newMessageElement) // Append the new message element to the messages container
})

document.getElementById('messages-form').addEventListener('submit', e => {
    e.preventDefault() // Prevent the default form submission behavior
    const newMessage = document.getElementById('user-message').value // Get the value of the message input field
    document.getElementById('user-message').value = '' // Clear the message input field
    // This socket is sending an event to the server...
    socket.emit('messageFromClientToServer', newMessage) // Emit the new message to the server

})
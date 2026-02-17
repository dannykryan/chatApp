const express = require('express');
const app = express() // Create the Express application
app.use(express.static('public')) // Serve static files from the 'public' directory

module.exports = app
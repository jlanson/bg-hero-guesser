const express = require('express')
const { initializeWebSocket } = require('./websocket'); 
const http = require('http');
const app = express()
const port = 5000

const roomRoutes = require('./routes/roomRoutes');

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('api/rooms',roomRoutes);

// Create an HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

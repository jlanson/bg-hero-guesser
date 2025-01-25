const { WebSocketServer } = require('ws');

const rooms = new Map(); // Map of roomId -> Set of WebSocket connections

// Function to initialize WebSocket server
const initializeWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('Received:', message);

      if (message.action === 'join-room') {
        const { roomId, userName } = message;

        // Add the client to the room
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(ws);

        // Notify other clients in the room
        broadcastToRoom(rooms, roomId, {
          message: `${userName} joined the room.`,
          type: 'user-joined',
        }, ws);
      }

      if (message.action === 'send-message') {
        const { roomId, userName, content } = message;

        // Broadcast the message to the room
        broadcastToRoom(rooms, roomId, {
          message: content,
          userName,
          type: 'message',
        });
      }
    });

    ws.on('close', () => {
      for (const [roomId, clients] of rooms) {
        if (clients.has(ws)) {
          clients.delete(ws);

          broadcastToRoom(rooms, roomId, {
            message: 'A user has disconnected.',
            type: 'user-left',
          });

          if (clients.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
      console.log('WebSocket connection closed');
    });
  });

  console.log('WebSocket server initialized');
};

const broadcastToRoom = (rooms, roomId, message) => {
    const clients = rooms.get(roomId) || new Set();
  
    clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  };
  

module.exports = { initializeWebSocket };

const { WebSocketServer } = require('ws');
const { db } = require('./firebase');

const rooms = new Map(); // Map of roomId -> Set of WebSocket connections

// Function to initialize WebSocket server
const initializeWebSocket = (server) => {
  const wss = server;

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data) => {
      const message = JSON.parse(data);
      console.log('Received:', message);

      if (message.action === 'join-room') {
        const { roomId, username } = message;
        console.log(username);
        // Add the client to the room
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(ws);

        // Notify other clients in the room
        broadcastToRoom(rooms, roomId, {
          message: `${username} joined the room.`,
          type: 'user-joined',
          username: username,
        }, ws);
      }

      if(message.action === 'game-start'){
        const {roomId} = message;

        const roomRef = doc(db, 'rooms', roomId);
        const roomSnapshot = await getDoc(roomRef);
        if(roomSnapshot.exists()){
          let turnPlayer = roomSnapshot.data().turnPlayer;
          if(turnPlayer === -1){
            turnPlayer = Math.floor(Math.random() * roomSnapshot.data().players.length);
            await updateDoc(roomRef, {turnPlayer});
          }

        broadcastToRoom(rooms, roomId, {
          message: 'Game has started',
          type: 'game-start',
          turnPlayer: turnPlayer,
        });
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

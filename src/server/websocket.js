const { WebSocketServer } = require('ws');
const db = require('./firebase/firebase');

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

      if(message.action === 'start-game'){
        const {roomId} = message;
        // const roomRef = doc(db, 'rooms', roomId);
        // const roomSnapshot = await getDoc(roomRef);
        const roomRef = db.collection('rooms').doc(roomId);
        const roomSnapshot = await roomRef.get();
        console.log(roomSnapshot.data());
        if(roomSnapshot.exists){
          let turnPlayer = roomSnapshot.data().turnPlayer;
          console.log(turnPlayer);
          if(turnPlayer === -1){
            turnPlayer = Math.floor(Math.random() * roomSnapshot.data().players.length);
            console.log(turnPlayer);
            await roomRef.update({turnPlayer: turnPlayer, chooser: turnPlayer});
          }

          console.log(turnPlayer)
          broadcastToRoom(rooms, message.roomId, {
            message: 'Game has started',
            type: 'game-start',
            turnPlayer: turnPlayer,
          });
        }
      }

      if(message.action === 'change-username'){
        const {roomId, oldUsername, newUsername} = message;
        const roomRef = db.collection('rooms').doc(roomId);
        const roomSnapshot = await roomRef.get();
        let {players, moderator} = roomSnapshot.data();
        const playerIndex = players.indexOf(oldUsername);
        players[playerIndex] = newUsername;
        console.log(oldUsername, moderator);
        if(oldUsername === moderator){
          moderator = newUsername;
          await roomRef.update({moderator: newUsername, players: players});
        }else{
          await roomRef.update({players: players});
        }
        
        broadcastToRoom(rooms, roomId, {
          type: 'change-username',
          players: players,
          username: message.newUsername,
          moderator,
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

      if(message.action === 'next-turn'){
        const roomRef = db.collection('rooms').doc(message.roomId);
        const roomSnapshot = await roomRef.get();
        let {turnPlayer, players, messages} = roomSnapshot.data();
        
        let turnPlayerIndex = (turnPlayer + 1) % players.length;
        messages.push({player: players[turnPlayer], message: message.message});
        console.log(messages);

        if(message.message === 'Hero chosen!'){
          await roomRef.update({turnPlayer: turnPlayerIndex, messages: messages, chosenHero: message.chosenHero});
        }else if(message.message === 'Hero guessed!'){

          if(message.guessedHero === roomSnapshot.data().chosenHero){
            messages.push({player: players[turnPlayer], message: 'Hero guessed correctly!'});
          }else{
            messages.push({player: players[turnPlayer], message: 'Hero guessed incorrectly!'});
          }
        
        }else{
          await roomRef.update({turnPlayer: turnPlayerIndex, messages: messages});
        }

        broadcastToRoom(rooms, message.roomId, {
          type: 'next-turn',
          turnPlayer: turnPlayerIndex,
          messages: messages,
        });
      }

      if(message.action === 'send-question' || message.action === 'send-response'){
        const roomRef = db.collection('rooms').doc(message.roomId);
        const roomSnapshot = await roomRef.get();
        let {turnPlayer, players, messages} = roomSnapshot.data();
        
        let turnPlayerIndex = (turnPlayer + 1) % players.length;
        messages.push({player: players[turnPlayer], message: 'A hero has been chosen!'});
        console.log(messages);
        await roomRef.update({turnPlayer: turnPlayerIndex, messages: messages});
        broadcastToRoom(rooms, message.roomId, {
          type: 'next-turn',
          turnPlayer: turnPlayerIndex,
          messages: messages,
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

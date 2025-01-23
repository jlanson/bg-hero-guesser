const { db } = require('../firebase/firebase');


const setupRoom = async (req, res) => {
    try{

        const playerRef = await addDoc(collection(db, 'players'), {
            name: 'Unknown1',
            score: 0
        });

        const roomRef = await addDoc(collection(db, 'rooms'), {
          createdAt: new Date(),
          players: [playerRef.id],
          status: 'waiting'
        });

        return roomRef.id;
      } catch (error) {
        console.error('Error creating room:', error);
        throw error;
      }
};

const getRoomById = async (req, res) => {
    const roomId = req.params.id;
    try {
        const roomData = await getRoomDetails(roomId);
        if (!roomData) {
            return res.status(404).json({ error: 'Room not found' });
        }
        return res.status(200).json(roomData);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getRoomById, setupRoom };
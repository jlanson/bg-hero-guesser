'use client'

import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { deletePlayerFromRoom, deleteRoom } from '../helpers';
import { db } from '../firebase/firebase';
import { useRouter } from 'next/navigation';

interface RoomProps {
    roomId: string;
}

interface RoomData {
    id: string;
    guesses: string[];
    players: string[];
    status: string;
    moderator: string;
}

const defaultRoomData: RoomData = {
    id: '',
    guesses: [],
    players: [],
    status: '',
    moderator: '',
};

const Room: React.FC<RoomProps> = ({ roomId }) => {
    const router = useRouter();
    const [roomData, setRoomData] = useState<RoomData>(defaultRoomData);
    const [loading, setLoading] = useState<boolean>(true);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
  
    const [socket, setSocket] = useState<WebSocket | null>(null);
    console.log(socket);
    console.log(gameStarted);

    useEffect(() => {
      // Connect to the WebSocket server
      const ws = new WebSocket('ws://localhost:5000'); // Replace with your server URL
      setSocket(ws);
  
      ws.onopen = () => {
        console.log('WebSocket connected');
        // Send a join-room message to the server
        ws.send(JSON.stringify({ action: 'join-room', roomId, username: localStorage.getItem('bgHeroPlayerName') }));
      };
  
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message from server:', data);
        
        if(data.type === 'user-joined'){
          setRoomData((prev) => {
            return {
              ...prev,
              players: [...prev.players, data.username]
            };
          });
        }

        if(data.type === 'game-start'){
          setRoomData((prev) => {
            return {
              ...prev,
              turnPlayer: data.turnPlayer,
            };
          });
        }
      };
  
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      window.addEventListener('beforeunload', () => {
        if(roomId){
          const username = localStorage.getItem('bgHeroPlayerName');
          if(username){
            deletePlayerFromRoom(roomId, username);
          }
        }
      });
  
      return () => {
        ws.close();
      };
    }, [roomId]);
      
    useEffect(() => {
      const fetchRoom = async () => {
        if(roomId){
          try {
            console.log(roomId);
            const roomDoc = doc(db, "rooms", roomId);
            const response = await getDoc(roomDoc);
    
            if (response.exists()) {
              const roomData: RoomData = response.data() as RoomData;
              setRoomData(roomData);
            } else {
              console.error("Room not found!");
            }
          } catch (error) {
            console.error("Error fetching room:", error);
          } finally {
            setLoading(false);
          }
        }
      };
      console.log(roomId);
      fetchRoom();
    }, [roomId]);

    const handleDeleteRoom = async () => {
        try {
            await deleteRoom(roomId);
            router.push('/');
        } catch (error) {
            console.error('Failed to delete room:', error);
        }
    }

    const renderContent = () => {
        if (loading) {
            return <p>Loading...</p>;
        }
    
        if (!roomData) {
            return <p>Room not found!</p>;
        }
    
        return (
            <div>
                <h1>Room ID: {roomId.substring(0, 6)}</h1>
                <h2>Players: {`${roomData?.players.join(', ')}`}</h2>


                {roomData.moderator === localStorage.getItem('bgHeroPlayerName') && (
                  <div>
                    <button onClick={() => setGameStarted(true)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Start Game </button>
                    <br />
                    <button 
                      onClick={handleDeleteRoom}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">End Game </button>
                  </div>)}
            </div>
        );
    }

    return (
        <div>
            {renderContent()}
        </div>
    );
};

export default Room;
'use client'

import { doc, getDoc } from 'firebase/firestore';
import React, { use, useEffect, useState } from 'react';
import { db } from '../firebase/firebase';

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

const Room: React.FC<RoomProps> = ({ roomId }) => {
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
  
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
      // Connect to the WebSocket server
      const ws = new WebSocket('ws://localhost:5000'); // Replace with your server URL
      setSocket(ws);
  
      ws.onopen = () => {
        console.log('WebSocket connected');
        // Send a join-room message to the server
        ws.send(JSON.stringify({ action: 'join-room', roomId, userName: 'Guest123' }));
      };
  
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message from server:', data);
  
        // // Update the messages
        // if (data.type === 'message' || data.type === 'user-joined' || data.type === 'user-left') {
        //   setMessages((prev) => [...prev, data.message]);
        // }
      };
  
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
  
      return () => {
        ws.close();
      };
    }, [roomId]);
  
    const sendMessage = (content: string) => {
      if (socket) {
        socket.send(JSON.stringify({ action: 'send-message', roomId, userName: localStorage.getItem('bgHeroPlayerName'), content }));
      }
    };
    
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
                <h2>Players: {roomData?.players}</h2>
                {roomData.moderator === localStorage.getItem('bgHeroPlayerName') && (
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Start Game </button>)}
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
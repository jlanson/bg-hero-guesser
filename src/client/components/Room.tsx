'use client'

import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { deletePlayerFromRoom, deleteRoom } from '../helpers';
import { db } from '../firebase/firebase';
import { useRouter } from 'next/navigation';
import Game from './Game';
import { Dialog } from 'radix-ui';

interface RoomProps {
    roomId: string;
}

interface RoomData {
    id: string;
    guesses: string[];
    players: string[];
    status: string;
    moderator: string;
    chooser: number;
}

const defaultRoomData: RoomData = {
    id: '',
    guesses: [],
    players: [],
    status: '',
    moderator: '',
    chooser: -1,
};

const Room: React.FC<RoomProps> = ({ roomId }) => {
    const router = useRouter();
    const [roomData, setRoomData] = useState<RoomData>(defaultRoomData);
    const [loading, setLoading] = useState<boolean>(true);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [turnPlayerIndex, setTurnPlayerIndex] = useState<number>(-1);
    const [chooserIndex, setChooserIndex] = useState<number>(-1);
    const [username, setUsername] = useState<string>('');
    const [usernameValue, setUsernameValue] = useState<string>('');

    const [openUsernameModal, setOpenUsernameModal] = useState<boolean>(false);
  
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
      // Connect to the WebSocket server
      const ws: WebSocket = new WebSocket('ws://bg-hero-guesser.onrender.com');
      setSocket(ws);
      if(window !== undefined){
        setUsername(localStorage.getItem('bgHeroPlayerName') || '');
        setUsernameValue(localStorage.getItem('bgHeroPlayerName') || '');
      }
  
      return () => {
        ws.close();
      };
    }, [roomId]);

    if(socket){
      socket.onopen = () => {

        console.log('WebSocket connected');
        // Send a join-room message to the server
        socket.send(JSON.stringify({ action: 'join-room', roomId, username: username}));
      };
  
      socket.onmessage = (event) => {
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
          setTurnPlayerIndex(data.turnPlayer);
          setChooserIndex(data.turnPlayer);
          setGameStarted(true);
        }

        if(data.type === 'change-username'){
          setRoomData((prev) => {
            return {
              ...prev,
              players: data.players,
              moderator: data.moderator
            };
          })
        }
      };
  
      socket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      window.addEventListener('beforeunload', () => {
        if(roomId && window !== undefined){
          const username = localStorage.getItem('bgHeroPlayerName');
          if(username){
            deletePlayerFromRoom(roomId, username);
          }
        }
      });
    }
      
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

    const handleGameStart = () => {
      if(roomData.players.length <= 1){
        alert('Need at least 2 players to start the game!');
        return;
      }
      if(socket && window !== undefined){
        socket.send(JSON.stringify({ action: 'start-game', roomId, username: localStorage.getItem('bgHeroPlayerName') }));
      }
    }
    
    const renderChangeUsernameButton = () => {
      return (
        <Dialog.Root open={openUsernameModal}>
          <Dialog.Trigger asChild>
            <button className="Button violet" onClick={()=>setOpenUsernameModal(true)}>Change username</button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="UsernameDialogOverlay" />
            <Dialog.Content className="UsernameDialogContent">
              <Dialog.Title className="UsernameDialogTitle">Change your username:</Dialog.Title>
              <br />
              <div className="username-container">
                <input  
                  className ="Input" 
                  type="text" 
                  value={usernameValue}
                  onChange={(e) => setUsernameValue(e.target.value)}
                  onKeyDown={(e)=>{
                    if(e.key === 'Enter'){
                      if(window !== undefined){
                        if(socket){
                          const oldUsername = localStorage.getItem('bgHeroPlayerName');
                          socket.send(JSON.stringify({ action: 'change-username', roomId, oldUsername, newUsername: usernameValue }));
                        }
                        localStorage.setItem('bgHeroPlayerName', usernameValue);
                        setUsername(usernameValue);
                        setOpenUsernameModal(false);
                      }
                    }
                  }}/>
              </div>
              <Dialog.Close asChild>
                <button className="IconButton" aria-label="Close">
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )
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
                <h2>Your username: {username} {renderChangeUsernameButton()}</h2>
                <h2>Players: {`${roomData?.players.join(', ')}`}</h2>

                {roomData.moderator === username && (
                  <div>
                    <button onClick={handleGameStart}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Start Game </button>
                    <br />
                    <button 
                      onClick={handleDeleteRoom}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">End Game </button>
                  </div>)}
                  {gameStarted && socket !== null && (
                    <div>
                      <Game ws={socket} username={username} roomId={roomId} players={roomData.players} turnPlayer={turnPlayerIndex} chooser={chooserIndex}/>
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
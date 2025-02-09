'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom, getOrCreateGuestId, checkIfRoomExists, joinNewPlayer } from '../helpers';

const Lobby: React.FC = () => {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [roomId, setRoomId] = useState('');

    const handleCreateRoom = async () => {
        if(window !== undefined){
            try {
                setIsCreating(true);
                let userName = localStorage.getItem('bgHeroPlayerName');
    
                if (!userName) {
                    userName = await getOrCreateGuestId();
                }

                const roomId = await createRoom(userName);
                router.push(`/room/${roomId}`);
            } catch (error) {
                console.error('Failed to create room:', error);
                setIsCreating(false);
            }
        }
    };

    const handleJoinRoom = async (roomId: string) => {
        if(window !== undefined){
            let userName = localStorage.getItem('bgHeroPlayerName');
            if (!userName) {
                userName = await getOrCreateGuestId();
            }
    
            joinNewPlayer(roomId, userName);
    
            const roomExists = await checkIfRoomExists(roomId);
            
            if (roomExists) {
                router.push(`/room/${roomId}`);
            } else {
                alert('Room does not exist');
            }
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Welcome to the Lobby</h1>
            <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                {isCreating ? 'Creating...' : 'Create a Room'}
            </button>
            <h2 className="text-xl font-bold mt-4">OR</h2>
            <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                type="text"
                placeholder="Enter Room ID"
                className="border border-gray-300 p-2 rounded mt-4"></input>
            <button
                onClick={() => handleJoinRoom(roomId)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            >Join Room!</button>
        </div>
    );
};

export default Lobby;
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom } from '../helpers/createRoom';

const Lobby: React.FC = () => {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateRoom = async () => {
        try {
            setIsCreating(true);
            const roomId = await createRoom();
            router.push(`/room/${roomId}`);
        } catch (error) {
            console.error('Failed to create room:', error);
            setIsCreating(false);
        }
    };

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
        </div>
    );
};

export default Lobby;
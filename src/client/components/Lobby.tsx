'use client'

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom, getOrCreateGuestId } from '../helpers';

const Lobby: React.FC = () => {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateRoom = async () => {
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
import React from 'react';

interface RoomProps {
    roomId: string;
}

const Room: React.FC<RoomProps> = ({ roomId }) => {
    return (
        <div>
            <h1>Room ID: {roomId}</h1>
            {/* Additional room content goes here */}
        </div>
    );
};

export default Room;
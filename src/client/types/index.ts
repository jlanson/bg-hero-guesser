// src/types/index.ts

export interface Room {
    id: string;
    name: string;
    participants: number;
}

export interface Lobby {
    rooms: Room[];
}
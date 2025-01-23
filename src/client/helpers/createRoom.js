import { db } from '../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const createRoom = async () => {
  try {
    const roomRef = await addDoc(collection(db, 'rooms'), {
      createdAt: new Date(),
      players: [],
      status: 'waiting'
    });
    return roomRef.id;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};
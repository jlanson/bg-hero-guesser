import { db } from '../firebase/firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, FieldValue, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import generateUniqueId from 'generate-unique-id';

export const createRoom = async (username: string) => {
  try {

    let roomId = generateUniqueId({length: 6, useLetters: true});

    while(true){
      const response = await checkIfRoomExists(roomId);
      if(!response){
        break;
      }
      roomId = generateUniqueId({length: 6, useLetters: true});
    }

    const roomRef = doc(db, 'rooms', roomId); // Use `doc` to specify the custom ID

    await setDoc(roomRef, {
      id: roomId, // Include the roomId in the document data if needed
      createdAt: new Date(),
      players: [username],
      guesses: [],
      status: 'waiting',
      moderator: username
    });
    
    return roomRef.id;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const getOrCreateGuestId = async () =>{
  const guestId = localStorage.getItem('bgHeroPlayerName');
  if (guestId) {
    return guestId;
  } else {
    const heroRef = await getDocs(collection(db, 'heroes'));
    const heroes = heroRef.docs.map(doc => doc.data());
    const randomHero = heroes[Math.floor(Math.random() * heroes.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    
    const userName = `${randomHero.name}-${randomNumber}`;
    localStorage.setItem('bgHeroPlayerName', userName);
    return userName;
  }
}

export const checkIfRoomExists = async (roomId: string) => {
  try {
    const roomDoc = doc(db, "rooms", roomId);
    const response = await getDoc(roomDoc);
    return response.exists();
  } catch (error) {
    console.error('Error checking room:', error);
    throw error;
  }
}

export const joinNewPlayer = async (roomId: string, username: string) => { 
  console.log(roomId);
  try {
    const roomDoc = doc(db, "rooms", roomId);
    await updateDoc(roomDoc, {
      players: arrayUnion(username)
    });
  } catch (error) {
    console.error('Error joining player:', error);
    throw error;
  }
}

export const deletePlayerFromRoom = async (roomId: string, username: string) => {
  try {
    const roomDoc = doc(db, "rooms", roomId);
    await updateDoc(roomDoc, {
      players: arrayRemove(username)
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
}

export const deleteRoom = async (roomId: string) => {
  try {
    const roomDoc = doc(db, "rooms", roomId);
    await deleteDoc(roomDoc);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}

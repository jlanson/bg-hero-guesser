import { db } from '../firebase/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const createRoom = async (username: String) => {
  try {
    const roomRef = await addDoc(collection(db, 'rooms'), {
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

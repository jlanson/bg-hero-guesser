'use client'

import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";   
import { getAllHeroData } from "../helpers"; 
import "./styles.css"

interface Hero {
  name: string;
  image: string;
  hpName: string;
  hpDescription: string;
}
interface HeroData {
  name: string;
  image: string;
  heroPowerName: string;
  heroPowerDescription: string;
}

interface GameProps {
  ws: WebSocket;
  username: string;
  roomId: string;
  players: string[];
  turnPlayer: number;
  chooser: number;
}

interface Message {
  message: string;
  player: string;
}

const Game: React.FC<GameProps> = ({ws, username, players, roomId, turnPlayer, chooser}) => {

  console.log('username', username)
  const [turnPlayerIndex, setTurnPlayerIndex] = useState<number>(turnPlayer);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [firstTurn, setFirstTurn] = useState<boolean>(true);
  const [chooserIndex] = useState<number>(chooser);
  const [question, setQuestion] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chosenHero, setChosenHero] = useState<string>('');
  const [hoveredHero, setHoveredHero] = useState<Hero | null>(null);

  useEffect(() => {
    console.log('Sending start-game message');
    ws.send(JSON.stringify({ action: 'start-game', roomId, username: username }));
  }, [ws]);

  useEffect(() => {
    const fetchHeroes = async () => {
      const heroes = await getAllHeroData();
      const formattedHeroes: Hero[] = heroes.map((hero: HeroData) => {
        return {
          name: hero.name,
          image: hero.image,
          hpName: hero.heroPowerName,
          hpDescription: hero.heroPowerDescription,
        };
      });
      setHeroes(formattedHeroes);
    };
    fetchHeroes();
  }, []);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Message from server:', data);

    if (data.type === 'next-turn'){
      if(firstTurn){
        setFirstTurn(false);
      }
      setTurnPlayerIndex(data.turnPlayer);
      console.log(messages, data.messages);
      setMessages(data.messages);
    }else if (data.type === 'send-question'){
      setTurnPlayerIndex(data.turnPlayer);
      setMessages((prev) => [...prev, { message: data.question, player: data.username }]);
    }else if(data.type === 'send-response'){
      setTurnPlayerIndex(data.turnPlayer);
      setMessages((prev) => [...prev, { message: data.question, player: data.username }]);
    }
  }

  const onHeroClick = (heroName: string) => {
    setFirstTurn(false);
    ws.send(JSON.stringify({ action: 'next-turn', roomId, username, message: 'Hero chosen!', chosenHero: heroName }));
    setChosenHero(heroName);
  }

  const onHeroGuess = (heroName: string) => {
    ws.send(JSON.stringify({ action: 'next-turn', roomId, username, message: 'Hero guessed!', guessedHero: heroName }));
  }

  const onQuestionSend = () => {
    ws.send(JSON.stringify({ action: 'next-turn', roomId, username, message: question }));
    setQuestion('');
  }

  const onResponseSend = (response: string) => {
    ws.send(JSON.stringify({ action: 'next-turn', roomId, username, message: response }));
  }

  const isTurnPlayer = () => {
    console.log(players[turnPlayerIndex], username);
    return players[turnPlayerIndex] === username;
  }

  const isChooserPlayer = () => {
    return players[chooserIndex] === username;
  }

  const renderChooseHeroModal = (mode: string | null) => {
    let handleClick = null;
    let message = 'Heroes Reference';
    if(mode === 'choose'){
      handleClick = onHeroClick;
      message = 'Choose a hero';
    }
    if (mode === 'guess') {
      handleClick = onHeroGuess;
      message = 'Guess the hero';
    }

    return (
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button className="Button violet">{message}</button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="HeroDialogOverlay" />
          <Dialog.Content className="HeroDialogContent">
            <Dialog.Title className="HeroDialogTitle">{message}</Dialog.Title>
            <br />
            <div className="dialog-layout">
              <div className="scrollable-hero-container">
                <div className="hero-container">
                  {heroes.map(hero => 
                    <div 
                      key={hero.name} 
                      className="hero" 
                      onClick={handleClick ? () => handleClick(hero.name) : () => {}}
                      onMouseEnter={() => setHoveredHero({name: hero.name, image: hero.image,  hpName: hero.hpName, hpDescription: hero.hpDescription})}
                      onMouseLeave={() => setHoveredHero(null)}
                      >
                      <img src={hero.image} alt={hero.name} className="hero-image"/>
                      <h2 className="hero-name">{hero.name}</h2>

                                    
                    </div>
                  )}
                </div>
              </div>
            </div>
            {renderHeroInfo(hoveredHero || null)}  
            <Dialog.Close asChild>
              <button className="IconButton" aria-label="Close"> Close
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  const renderHeroInfo = (hero: Hero | null) => {
    let name = 'Hover over a hero to see their information!';
    let hpName = '';
    let hpDescription = '';
    if(hero){
      name = hero.name;
      hpName = hero.hpName;
      hpDescription = hero.hpDescription;
    }
    return (
      <div className="hero-info-box">
        <h3 className="hero-info-title">{name}</h3>

        <div className="hero-info-abilities">
          <p className="hp-title">{hpName}</p>
          <p className="hp-description" dangerouslySetInnerHTML={{ __html: hpDescription }}></p>
        </div>
      </div>)
  }

  const renderQuestion = () => {
    return (
      <div>
        <input type="text" className="question-box" value={question} 
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about the hero"/>
        <button onClick={onQuestionSend}>Send</button>
      </div>
    )
  }

  const renderResponse = () => {
    return (
      <div>
        <button className="response-button" onClick={() => onResponseSend('yes')}>Yes</button>
        <button className="response-button" onClick={() => onResponseSend('no')}>No</button>
        <button className="response-button" onClick={() => onResponseSend('rephrase')}>Don&apos;t know</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Game {!firstTurn && renderChooseHeroModal(null)}</h1>
      {isTurnPlayer() ? <p>It&apos;s your turn</p> : <p>It&apos;s {players[turnPlayerIndex]}&apos;s turn</p>}
      {isTurnPlayer() && firstTurn && renderChooseHeroModal('choose')}
      {isChooserPlayer() &&  !firstTurn && <p>You chose: {chosenHero} </p>}
      {isTurnPlayer() && !isChooserPlayer() && renderQuestion()}
      {isTurnPlayer() && !isChooserPlayer() && renderChooseHeroModal('guess')}
      {isTurnPlayer() && !firstTurn && isChooserPlayer() && renderResponse()}
      {!isTurnPlayer() && <p>Waiting on response... </p>}
      <div className="message-container">
        <h3 className="message-header">Messages</h3>
        {messages && messages.map((message, index) => {
          return (
            <div key={index}>
              <p><b>{message.player}</b>: {message.message}</p>
            </div>
          );
        })}
      </div>

    </div>
  )
} 

export default Game;


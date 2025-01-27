export const gameStart = (socket, game) => {
  socket.emit('gameStart', game);
}
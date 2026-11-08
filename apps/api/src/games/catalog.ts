/** Games available to every tenant. Placeholder list until the client picks games. */
export const GAME_CATALOG = [
  { key: 'quiz', name: 'Team Quiz', minPlayers: 1, maxPlayers: 50 },
  { key: 'tic-tac-toe', name: 'Tic-Tac-Toe', minPlayers: 2, maxPlayers: 2 },
  { key: 'word-chain', name: 'Word Chain', minPlayers: 2, maxPlayers: 8 },
] as const;

export type GameKey = (typeof GAME_CATALOG)[number]['key'];

export function findGame(key: string) {
  return GAME_CATALOG.find((g) => g.key === key);
}

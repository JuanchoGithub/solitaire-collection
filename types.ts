export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
}

export enum Rank {
  ACE = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
}

export interface CardType {
  id: number;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export type DragInfo = {
  cards: CardType[];
  source: 'tableau' | 'waste' | 'foundation';
  sourcePileIndex: number;
} | null;

export type GameState = {
  stock: CardType[];
  waste: CardType[];
  foundations: CardType[][];
  tableau: CardType[][];
  moves: number;
};
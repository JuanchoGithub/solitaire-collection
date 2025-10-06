import React from 'react';

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

export interface CardThemeProps {
  card: CardType;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  width: number;
  height: number;
  isShaking?: boolean;
  isPressed?: boolean;
  isHinted?: boolean;
}

export interface BoardThemeProps {
  children: React.ReactNode;
  shuffleClass: string;
}

export interface Theme {
    Card: React.FC<CardThemeProps>;
    Board: React.FC<BoardThemeProps>;
    CardBack: React.FC<any>;
}

import type { CardType } from '../../types';

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


import type { CardType } from '../../types';

export type SpiderSuitCount = 1 | 2 | 4;

export type DragInfo = {
  cards: CardType[];
  sourcePileIndex: number;
} | null;

export type GameState = {
  stock: CardType[];
  tableau: CardType[][];
  completedSets: number;
  moves: number;
};

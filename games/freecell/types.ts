
import type { CardType } from '../../types';

export type DragInfo = {
  cards: CardType[];
  source: 'tableau' | 'freecell';
  sourceIndex: number;
} | null;

export type GameState = {
  freecells: (CardType | null)[];
  foundations: CardType[][];
  tableau: CardType[][];
  moves: number;
};

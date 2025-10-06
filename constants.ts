import { Suit, Rank } from './types';

export const SUITS: Suit[] = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
export const RANKS: Rank[] = [
  Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
  Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING
];

export const RANK_VALUE_MAP: { [key in Rank]: number } = {
  [Rank.ACE]: 1,
  [Rank.TWO]: 2,
  [Rank.THREE]: 3,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 5,
  [Rank.SIX]: 6,
  [Rank.SEVEN]: 7,
  [Rank.EIGHT]: 8,
  [Rank.NINE]: 9,
  [Rank.TEN]: 10,
  [Rank.JACK]: 11,
  [Rank.QUEEN]: 12,
  [Rank.KING]: 13,
};

export const SUIT_COLOR_MAP: { [key in Suit]: 'red' | 'black' } = {
  [Suit.HEARTS]: 'red',
  [Suit.DIAMONDS]: 'red',
  [Suit.CLUBS]: 'black',
  [Suit.SPADES]: 'black',
};

export const SUIT_SYMBOL_MAP: { [key in Suit]: string } = {
    [Suit.HEARTS]: '♥',
    [Suit.DIAMONDS]: '♦',
    [Suit.CLUBS]: '♣',
    [Suit.SPADES]: '♠',
};

export const CARD_ASPECT_RATIO = 1.4; // height / width

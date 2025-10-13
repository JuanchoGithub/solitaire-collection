
import type { CardType } from '../../types';
import { SUITS, RANKS } from '../../constants';

// Seedable PRNG
export const mulberry32 = (a: number) => {
    return () => {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export const generateShuffledDeck = (seed: number = Date.now()): CardType[] => {
    const random = mulberry32(seed);
    let cardId = 0;
    // Generate standard deck
    const deck: CardType[] = SUITS.flatMap(suit =>
        RANKS.map(rank => ({
            id: cardId++,
            suit,
            rank,
            faceUp: false
        }))
    );
    
    // Shuffle using Fisher-Yates with seeded RNG
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
};

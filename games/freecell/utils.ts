
import type { CardType } from '../../types';
import { Suit, Rank } from '../../types';
import { RANKS } from '../../constants';

// Based on Microsoft's LCG: state = (state * 214013 + 2531011) & max_int32
function* randomGenerator(seed: number): Generator<number> {
    const max_int32 = 0x7FFFFFFF; // (1 << 31) - 1
    seed = seed & max_int32;
    while (true) {
        seed = (seed * 214013 + 2531011) & max_int32;
        yield seed >> 16;
    }
}

// MS Freecell shuffling algorithm
function deal(seed: number): number[] {
    const nc = 52;
    // Deck: 51 (KS) to 0 (AC)
    const cards = Array.from({ length: nc }, (_, i) => nc - 1 - i);
    const rnd = randomGenerator(seed);

    for (let i = 0; i < nc; i++) {
        const current_length = nc - i;
        const r = rnd.next().value;
        const j = (nc - 1) - (r % current_length);
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}

function cardIdToCard(cardId: number): { suit: Suit, rank: Rank } {
    // Python script suits = "CDHS", which matches this order
    const pySuits = [Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES];
    
    // The python script uses "A23456789TJQK"
    // Our RANKS constant is ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    // So the RANKS constant aligns perfectly.
    const rank = RANKS[Math.floor(cardId / 4)];
    const suit = pySuits[cardId % 4];
    return { suit, rank };
}

export const generateSolvableDeal = (): { tableau: CardType[][], seed: number } => {
    let seed: number;
    while (true) {
        seed = Math.floor(Math.random() * 32000) + 1;
        if (seed !== 11982) { // Skip the known unsolvable deal
            break;
        }
    }

    const deckIds = deal(seed);
    const deck: CardType[] = deckIds.map((cardId) => ({
        id: cardId, // Use the card's value (0-51) as its unique ID for React keys
        ...cardIdToCard(cardId),
        faceUp: true,
    }));

    const tableau: CardType[][] = Array.from({ length: 8 }, () => []);
    for (let i = 0; i < 52; i++) {
        tableau[i % 8].push(deck[i]);
    }

    return { tableau, seed };
};

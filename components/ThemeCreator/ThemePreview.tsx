
import React from 'react';
import type { JsonTheme } from '../../themes/json/types';
import { createThemeFromJson } from '../../themes/json/loader';
import type { CardType } from '../../types';
import { Suit, Rank } from '../../types';
import EmptyPile from '../EmptyPile';

interface ThemePreviewProps {
  theme: JsonTheme;
}

const previewCards: CardType[] = [
    { id: -1, suit: Suit.HEARTS, rank: Rank.ACE, faceUp: true },
    { id: -2, suit: Suit.DIAMONDS, rank: Rank.KING, faceUp: true },
    { id: -3, suit: Suit.SPADES, rank: Rank.QUEEN, faceUp: true },
    { id: -4, suit: Suit.CLUBS, rank: Rank.JACK, faceUp: true },
    { id: -5, suit: Suit.SPADES, rank: Rank.SEVEN, faceUp: true },
    { id: -6, suit: Suit.DIAMONDS, rank: Rank.SIX, faceUp: true },
    { id: -7, suit: Suit.CLUBS, rank: Rank.FIVE, faceUp: true },
    { id: -8, suit: Suit.HEARTS, rank: Rank.FOUR, faceUp: false },
    { id: -9, suit: Suit.SPADES, rank: Rank.THREE, faceUp: false },
    { id: -10, suit: Suit.CLUBS, rank: Rank.TWO, faceUp: false },
];


const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
    const { Board, Card } = createThemeFromJson(theme);
    const cardWidth = 80;
    const cardHeight = cardWidth * 1.4;

    return (
        <div className="w-full h-full p-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            <Board shuffleClass="">
                <div className="absolute inset-0 flex items-center justify-center scale-90">
                    <div className="grid grid-cols-4 grid-rows-2 gap-4">
                        {/* Individual Cards */}
                        <Card card={previewCards[0]} width={cardWidth} height={cardHeight} />
                        <Card card={previewCards[1]} width={cardWidth} height={cardHeight} />
                        <Card card={previewCards[2]} width={cardWidth} height={cardHeight} />
                        <Card card={previewCards[3]} width={cardWidth} height={cardHeight} />

                        {/* Card with Pips */}
                        <Card card={previewCards[4]} width={cardWidth} height={cardHeight} />

                        {/* Empty Pile */}
                        <EmptyPile width={cardWidth} height={cardHeight} />

                        {/* Face-up stack */}
                        <div className="relative" style={{ width: cardWidth, height: cardHeight + (25 * 1) }}>
                            <Card card={previewCards[5]} width={cardWidth} height={cardHeight} style={{ position: 'absolute', top: 0, left: 0 }} />
                            <Card card={previewCards[6]} width={cardWidth} height={cardHeight} style={{ position: 'absolute', top: 25, left: 0 }} />
                        </div>

                        {/* Face-down stack */}
                        <div className="relative" style={{ width: cardWidth, height: cardHeight + (10 * 2) }}>
                            <Card card={previewCards[7]} width={cardWidth} height={cardHeight} style={{ position: 'absolute', top: 0, left: 0 }} />
                            <Card card={previewCards[8]} width={cardWidth} height={cardHeight} style={{ position: 'absolute', top: 10, left: 0 }} />
                            <Card card={previewCards[9]} width={cardWidth} height={cardHeight} style={{ position: 'absolute', top: 20, left: 0 }} />
                        </div>
                    </div>
                </div>
            </Board>
        </div>
    );
};

export default ThemePreview;

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
    { id: -1, suit: Suit.DIAMONDS, rank: Rank.KING, faceUp: true },
    { id: -2, suit: Suit.SPADES, rank: Rank.QUEEN, faceUp: true },
    { id: -3, suit: Suit.HEARTS, rank: Rank.JACK, faceUp: true },
    { id: -4, suit: Suit.CLUBS, rank: Rank.ACE, faceUp: false },
    { id: -5, suit: Suit.SPADES, rank: Rank.TWO, faceUp: false },
    { id: -6, suit: Suit.SPADES, rank: Rank.SEVEN, faceUp: true },
];

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
    const { Board, Card } = createThemeFromJson(theme);
    const cardWidth = 80;
    const cardHeight = cardWidth * 1.4;

    return (
        <div className="w-full h-full p-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            <Board shuffleClass="">
                <div className="absolute inset-0 flex items-center justify-center scale-90">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="relative" style={{ width: cardWidth, height: cardHeight }}>
                            <EmptyPile width={cardWidth} height={cardHeight} />
                        </div>
                        <div style={{ width: cardWidth, height: cardHeight }}>
                           <Card card={previewCards[3]} width={cardWidth} height={cardHeight} />
                        </div>
                         <EmptyPile width={cardWidth} height={cardHeight} />
                         <Card card={previewCards[5]} width={cardWidth} height={cardHeight} />
                        <div className="relative col-span-2" style={{ width: cardWidth, height: cardHeight + (25 * 2) }}>
                             <Card
                                card={previewCards[0]}
                                width={cardWidth}
                                height={cardHeight}
                                style={{ position: 'absolute', top: 0, left: 0 }}
                            />
                            <Card
                                card={previewCards[1]}
                                width={cardWidth}
                                height={cardHeight}
                                style={{ position: 'absolute', top: 25, left: 0 }}
                            />
                            <Card
                                card={previewCards[2]}
                                width={cardWidth}
                                height={cardHeight}
                                style={{ position: 'absolute', top: 50, left: 0 }}
                            />
                        </div>
                    </div>
                </div>
            </Board>
        </div>
    );
};

export default ThemePreview;
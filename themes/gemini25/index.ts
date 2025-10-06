import GeminiCard from './GeminiCard';
import GeminiBoard from './GeminiBoard';
import GeminiCardBack from './GeminiCardBack';

export const GeminiTheme = {
    Card: GeminiCard,
    Board: GeminiBoard,
    CardBack: GeminiCardBack
};

export type Theme = typeof GeminiTheme;

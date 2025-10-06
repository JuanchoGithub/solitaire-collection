import { ClassicTheme } from './classic';
import { FullyTheme } from './fully';
import { GeminiTheme } from './gemini25';

export const THEMES = {
    classic: { name: 'Classic', theme: ClassicTheme },
    fully: { name: 'Fully Illustrated', theme: FullyTheme },
    gemini: { name: 'Gemini 2.5', theme: GeminiTheme },
};

export type ThemeKey = keyof typeof THEMES;

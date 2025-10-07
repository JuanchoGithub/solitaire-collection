
import { ClassicTheme } from './classic';
import { FullyTheme } from './fully';
import { GeminiTheme } from './gemini25';
import { createThemeFromJson } from './json/loader';
import defaultJsonTheme from './json/default';

export const BASE_THEMES = {
    classic: { name: 'Classic', theme: ClassicTheme },
    fully: { name: 'Fully Illustrated', theme: FullyTheme },
    gemini: { name: 'Gemini 2.5', theme: GeminiTheme },
    datadriven: { name: 'Data Driven (JSON)', theme: createThemeFromJson(defaultJsonTheme) },
};

export type BaseThemeKey = keyof typeof BASE_THEMES;
export type ThemeKey = BaseThemeKey | 'custom';

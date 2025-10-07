import React from 'react';
import type { Theme, CardThemeProps, BoardThemeProps } from '../../types';
import type { JsonTheme } from './types';
import JsonBoardComponent from './JsonBoard';
import JsonCardComponent from './JsonCard';
import JsonCardBackComponent from './JsonCardBack';

export const createThemeFromJson = (themeData: JsonTheme): Theme => {
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file, resolving multiple parsing errors.
    const Board: React.FC<BoardThemeProps> = (props) => React.createElement(JsonBoardComponent, { ...props, theme: themeData.board });
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file, resolving multiple parsing errors.
    const CardBack: React.FC = (props) => React.createElement(JsonCardBackComponent, { ...props, theme: themeData.cardBack });
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file, resolving multiple parsing errors.
    const Card: React.FC<CardThemeProps> = (props) => React.createElement(JsonCardComponent, { ...props, theme: themeData.card, cardBackTheme: themeData.cardBack });

    return {
        Board,
        Card,
        CardBack,
    };
};

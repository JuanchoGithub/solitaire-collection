
import React from 'react';
import type { BoardThemeProps } from '../../types';
import type { JsonTheme } from './types';

interface JsonBoardProps extends BoardThemeProps {
  theme: JsonTheme['board'];
}

const JsonBoard: React.FC<JsonBoardProps> = ({ children, shuffleClass, theme }) => {
    const boardStyle: React.CSSProperties = {
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: '"Quicksand", sans-serif'
    };
    return (
        <div style={boardStyle} className={`h-screen w-full overflow-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default JsonBoard;
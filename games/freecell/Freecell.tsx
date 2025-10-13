

import React from 'react';
import type { Theme } from '../../types';
import { useFreecell } from './useFreecell';
import FreecellGameBoard from '../../components/FreecellGameBoard';
import { useResponsiveLayout } from '../../hooks/useCardDrag';

interface FreecellProps {
    theme: Theme;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
    gameMode: 'random' | 'solvable';
}

const Freecell: React.FC<FreecellProps> = ({ theme, onTitleClick, onSettingsClick, gameMenuButtonRef, gameMode }) => {
    const { layout } = useResponsiveLayout();
    const controller = useFreecell({ theme, gameMode });
    return <FreecellGameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} gameMenuButtonRef={gameMenuButtonRef} layout={layout} />;
};

export default Freecell;

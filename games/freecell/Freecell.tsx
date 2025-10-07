

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
}

const Freecell: React.FC<FreecellProps> = ({ theme, onTitleClick, onSettingsClick, gameMenuButtonRef }) => {
    const { layout } = useResponsiveLayout();
    const controller = useFreecell({ theme });
    return <FreecellGameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} gameMenuButtonRef={gameMenuButtonRef} layout={layout} />;
};

export default Freecell;

import React from 'react';
import type { Theme } from '../../types';
import { useKlondike } from './useKlondike';
import GameBoard from '../../components/GameBoard';
import { useResponsiveLayout } from '../../hooks/useCardDrag';

interface KlondikeProps {
    theme: Theme;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
}

const Klondike: React.FC<KlondikeProps> = ({ theme, onTitleClick, onSettingsClick, gameMenuButtonRef }) => {
    const { layout } = useResponsiveLayout();
    const controller = useKlondike({ theme, layout });
    return <GameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} gameMenuButtonRef={gameMenuButtonRef} layout={layout} />;
};

export default Klondike;
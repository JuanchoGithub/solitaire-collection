
import React from 'react';
import type { Theme } from '../../types';
import { useKlondike } from './useKlondike';
import GameBoard from '../../components/GameBoard';

interface KlondikeProps {
    theme: Theme;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
}

const Klondike: React.FC<KlondikeProps> = ({ theme, onTitleClick, onSettingsClick, gameMenuButtonRef }) => {
    const controller = useKlondike({ theme });
    return <GameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} gameMenuButtonRef={gameMenuButtonRef} />;
};

export default Klondike;

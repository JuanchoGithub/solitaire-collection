
import React from 'react';
import type { Theme } from '../../types';
import { useKlondike } from './useKlondike';
import GameBoard from '../../components/GameBoard';

interface KlondikeProps {
    theme: Theme;
    onTitleClick: () => void;
    onSettingsClick: () => void;
}

const Klondike: React.FC<KlondikeProps> = ({ theme, onTitleClick, onSettingsClick }) => {
    const controller = useKlondike({ theme });
    return <GameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} />;
};

export default Klondike;

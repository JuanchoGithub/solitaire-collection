
import React from 'react';
import type { Theme } from '../../types';
import { useKlondike } from './useKlondike';
import GameBoard from '../../components/GameBoard';

interface KlondikeProps {
    theme: Theme;
}

const Klondike: React.FC<KlondikeProps> = ({ theme }) => {
    const controller = useKlondike({ theme });
    return <GameBoard controller={controller} />;
};

export default Klondike;

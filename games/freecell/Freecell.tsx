
import React from 'react';
import type { Theme } from '../../types';
import { useFreecell } from './useFreecell';
import FreecellGameBoard from '../../components/FreecellGameBoard';

interface FreecellProps {
    theme: Theme;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
}

const Freecell: React.FC<FreecellProps> = ({ theme, onTitleClick, onSettingsClick, gameMenuButtonRef }) => {
    const controller = useFreecell({ theme });
    return <FreecellGameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} gameMenuButtonRef={gameMenuButtonRef} />;
};

export default Freecell;

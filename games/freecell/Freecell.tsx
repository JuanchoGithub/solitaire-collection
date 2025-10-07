
import React from 'react';
import type { Theme } from '../../types';
import { useFreecell } from './useFreecell';
import FreecellGameBoard from '../../components/FreecellGameBoard';

interface FreecellProps {
    theme: Theme;
    onTitleClick: () => void;
    onSettingsClick: () => void;
}

const Freecell: React.FC<FreecellProps> = ({ theme, onTitleClick, onSettingsClick }) => {
    const controller = useFreecell({ theme });
    return <FreecellGameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} />;
};

export default Freecell;

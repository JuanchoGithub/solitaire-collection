

import React from 'react';
import type { Theme } from '../../types';
import { useSpider } from './useSpider';
import SpiderGameBoard from '../../components/SpiderGameBoard';
import type { SpiderSuitCount } from './types';
import { useResponsiveLayout } from '../../hooks/useCardDrag';

interface SpiderProps {
    theme: Theme;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    suitCount: SpiderSuitCount;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
}

const Spider: React.FC<SpiderProps> = ({ theme, onTitleClick, onSettingsClick, suitCount, gameMenuButtonRef }) => {
    const { layout } = useResponsiveLayout();
    const controller = useSpider({ theme, suitCount });
    return <SpiderGameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} gameMenuButtonRef={gameMenuButtonRef} layout={layout} />;
};

export default Spider;
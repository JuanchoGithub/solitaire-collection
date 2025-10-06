
import React from 'react';
import type { Theme } from '../../types';
import { useSpider } from './useSpider';
import SpiderGameBoard from '../../components/SpiderGameBoard';
import type { SpiderSuitCount } from './types';

interface SpiderProps {
    theme: Theme;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    suitCount: SpiderSuitCount;
}

const Spider: React.FC<SpiderProps> = ({ theme, onTitleClick, onSettingsClick, suitCount }) => {
    const controller = useSpider({ theme, suitCount });
    return <SpiderGameBoard controller={controller} onTitleClick={onTitleClick} onSettingsClick={onSettingsClick} />;
};

export default Spider;

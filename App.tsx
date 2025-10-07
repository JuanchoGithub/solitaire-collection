
import React, { useState, useCallback } from 'react';
import Spider from './games/spider/Spider';
import Klondike from './games/klondike/Klondike';
import Freecell from './games/freecell/Freecell';
import GameSelectionModal from './components/GameSelectionModal';
import SettingsModal from './components/SettingsModal';
import { THEMES, ThemeKey } from './themes';
import type { SpiderSuitCount } from './games/spider/types';

const App: React.FC = () => {
    const [currentGame, setCurrentGame] = useState<'spider' | 'klondike' | 'freecell'>('spider');
    const [spiderSuitCount, setSpiderSuitCount] = useState<SpiderSuitCount>(1);
    const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [themeKey, setThemeKey] = useState<ThemeKey>('gemini');

    const handleSelectGame = useCallback((selection: 'klondike' | 'freecell' | { game: 'spider', suits: SpiderSuitCount }) => {
        if (selection === 'klondike') {
            if (currentGame !== 'klondike') {
                setCurrentGame('klondike');
            }
        } else if (selection === 'freecell') {
            if (currentGame !== 'freecell') {
                setCurrentGame('freecell');
            }
        } else {
            if (currentGame !== 'spider' || spiderSuitCount !== selection.suits) {
                setSpiderSuitCount(selection.suits);
                setCurrentGame('spider');
            }
        }
        setIsGameMenuOpen(false);
    }, [currentGame, spiderSuitCount]);

    const handleOpenGameMenu = useCallback(() => setIsGameMenuOpen(true), []);
    const handleCloseGameMenu = useCallback(() => setIsGameMenuOpen(false), []);
    
    const handleOpenSettings = useCallback(() => setIsSettingsModalOpen(true), []);
    const handleCloseSettings = useCallback(() => setIsSettingsModalOpen(false), []);
    const handleSelectTheme = useCallback((key: ThemeKey) => setThemeKey(key), []);

    const theme = THEMES[themeKey].theme;

    let gameElement;
    switch(currentGame) {
        case 'spider':
            // The key ensures that changing the suit count forces a remount and thus a new game.
            gameElement = <Spider key={`spider-${spiderSuitCount}`} theme={theme} onTitleClick={handleOpenGameMenu} onSettingsClick={handleOpenSettings} suitCount={spiderSuitCount} />;
            break;
        case 'klondike':
            gameElement = <Klondike key="klondike" theme={theme} onTitleClick={handleOpenGameMenu} onSettingsClick={handleOpenSettings} />;
            break;
        case 'freecell':
            gameElement = <Freecell key="freecell" theme={theme} onTitleClick={handleOpenGameMenu} onSettingsClick={handleOpenSettings} />;
            break;
        default:
            gameElement = <Spider key={`spider-${spiderSuitCount}`} theme={theme} onTitleClick={handleOpenGameMenu} onSettingsClick={handleOpenSettings} suitCount={spiderSuitCount} />;
            break;
    }

    return (
        <>
            {gameElement}
            {isGameMenuOpen && (
                <GameSelectionModal 
                    onClose={handleCloseGameMenu}
                    onSelectGame={handleSelectGame}
                    activeGame={currentGame}
                    activeSpiderSuitCount={spiderSuitCount}
                />
            )}
            {isSettingsModalOpen && (
                <SettingsModal
                    onClose={handleCloseSettings}
                    onSelectTheme={handleSelectTheme}
                    activeThemeKey={themeKey}
                />
            )}
        </>
    );
};

export default App;

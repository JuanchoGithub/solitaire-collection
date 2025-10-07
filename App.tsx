
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Spider from './games/spider/Spider';
import Klondike from './games/klondike/Klondike';
import Freecell from './games/freecell/Freecell';
import GameSelectionModal from './components/GameSelectionModal';
import SettingsModal from './components/SettingsModal';
import ThemeCreatorModal from './components/ThemeCreator/ThemeCreatorModal';
import { BASE_THEMES, ThemeKey } from './themes';
import type { JsonTheme } from './themes/json/types';
import { createThemeFromJson } from './themes/json/loader';
import type { SpiderSuitCount } from './games/spider/types';

type KlondikeMode = 'random' | 'winnable';

const App: React.FC = () => {
    const [currentGame, setCurrentGame] = useState<'spider' | 'klondike' | 'freecell'>('spider');
    const [spiderSuitCount, setSpiderSuitCount] = useState<SpiderSuitCount>(1);
    const [klondikeMode, setKlondikeMode] = useState<KlondikeMode>('random');
    const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isThemeCreatorOpen, setIsThemeCreatorOpen] = useState(false);
    
    const [themes, setThemes] = useState(BASE_THEMES);
    const [userThemeData, setUserThemeData] = useState<JsonTheme | null>(null);
    const [themeKey, setThemeKey] = useState<ThemeKey>('gemini');
    
    const gameMenuButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const savedThemeJson = localStorage.getItem('user-custom-theme');
        if (savedThemeJson) {
            const themeData = JSON.parse(savedThemeJson);
            setUserThemeData(themeData);
            const userTheme = createThemeFromJson(themeData);
            setThemes(prev => ({
                ...prev,
                custom: { name: themeData.name || 'My Theme', theme: userTheme }
            }));
        }

        const savedThemeKey = localStorage.getItem('active-theme-key') as ThemeKey;
        if (savedThemeKey) {
            // Ensure the saved key is valid, especially for 'custom' theme which might not exist on a fresh start
            if (savedThemeKey === 'custom' && !savedThemeJson) {
                setThemeKey('gemini');
            } else {
                setThemeKey(savedThemeKey);
            }
        }
    }, []);

    const handleSelectGame = useCallback((selection: { game: 'klondike', mode: KlondikeMode } | 'freecell' | { game: 'spider', suits: SpiderSuitCount }) => {
        if (selection === 'freecell') {
            if (currentGame !== 'freecell') {
                setCurrentGame('freecell');
            }
        } else if (selection.game === 'klondike') {
            if (currentGame !== 'klondike' || klondikeMode !== selection.mode) {
                setKlondikeMode(selection.mode);
                setCurrentGame('klondike');
            }
        } else { // spider
            if (currentGame !== 'spider' || spiderSuitCount !== selection.suits) {
                setSpiderSuitCount(selection.suits);
                setCurrentGame('spider');
            }
        }
        setIsGameMenuOpen(false);
    }, [currentGame, spiderSuitCount, klondikeMode]);

    const handleOpenGameMenu = useCallback(() => setIsGameMenuOpen(true), []);
    const handleCloseGameMenu = useCallback(() => setIsGameMenuOpen(false), []);
    
    const handleOpenSettings = useCallback(() => setIsSettingsModalOpen(true), []);
    const handleCloseSettings = useCallback(() => setIsSettingsModalOpen(false), []);
    const handleSelectTheme = useCallback((key: ThemeKey) => {
        setThemeKey(key);
        localStorage.setItem('active-theme-key', key);
    }, []);

    const handleOpenThemeCreator = useCallback(() => {
        setIsSettingsModalOpen(false);
        setIsThemeCreatorOpen(true);
    }, []);

    const handleSaveUserTheme = useCallback((themeData: JsonTheme) => {
        const userTheme = createThemeFromJson(themeData);
        localStorage.setItem('user-custom-theme', JSON.stringify(themeData));
        setUserThemeData(themeData);
        setThemes(prev => ({
            ...prev,
            custom: { name: themeData.name || 'My Theme', theme: userTheme }
        }));
        handleSelectTheme('custom');
        setIsThemeCreatorOpen(false);
    }, [handleSelectTheme]);

    const theme = themes[themeKey]?.theme || themes.gemini.theme;
    
    const commonProps = {
        theme,
        onTitleClick: handleOpenGameMenu,
        onSettingsClick: handleOpenSettings,
        gameMenuButtonRef,
    };

    let gameElement;
    switch(currentGame) {
        case 'spider':
            gameElement = <Spider key={`spider-${spiderSuitCount}`} {...commonProps} suitCount={spiderSuitCount} />;
            break;
        case 'klondike':
            gameElement = <Klondike key={`klondike-${klondikeMode}`} {...commonProps} gameMode={klondikeMode} />;
            break;
        case 'freecell':
            gameElement = <Freecell key="freecell" {...commonProps} />;
            break;
        default:
            gameElement = <Spider key={`spider-${spiderSuitCount}`} {...commonProps} suitCount={spiderSuitCount} />;
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
                    activeKlondikeMode={klondikeMode}
                    buttonRef={gameMenuButtonRef}
                />
            )}
            {isSettingsModalOpen && (
                <SettingsModal
                    onClose={handleCloseSettings}
                    onSelectTheme={handleSelectTheme}
                    activeThemeKey={themeKey}
                    themes={themes}
                    onOpenThemeCreator={handleOpenThemeCreator}
                />
            )}
            {isThemeCreatorOpen && (
                <ThemeCreatorModal
                    onClose={() => setIsThemeCreatorOpen(false)}
                    onSave={handleSaveUserTheme}
                    initialTheme={userThemeData}
                />
            )}
        </>
    );
};

export default App;

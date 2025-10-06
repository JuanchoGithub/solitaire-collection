import React from 'react';
import Klondike from './games/klondike/Klondike';
import { FullyTheme } from './themes/fully';

const App: React.FC = () => {
    // In a more advanced setup, one could select themes and games from a UI.
    // For now, we'll hardcode the Fully theme for the Klondike game.
    // The structure now allows for adding more games and themes easily.
    return (
        <Klondike theme={FullyTheme} />
    );
};

export default App;

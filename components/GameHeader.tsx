import React from 'react';

interface GameHeaderProps {
    title: string;
    time: number;
    moves: number;
    isDealing: boolean;
    onTitleClick: () => void;
    onPauseClick: () => void;
    formatTime: (time: number) => string;
    children?: React.ReactNode;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
    layout: 'portrait' | 'landscape';
}

const GameHeader: React.FC<GameHeaderProps> = ({
    title, time, moves, isDealing, onTitleClick, onPauseClick, formatTime, children, gameMenuButtonRef, layout
}) => {
    return (
        <header className={`flex flex-wrap justify-between items-center gap-4 py-2 relative z-[210]`}>
            <button
                ref={gameMenuButtonRef}
                onClick={onTitleClick}
                className="text-xl sm:text-2xl font-title tracking-wider cursor-pointer hover:text-green-300 transition-colors flex items-center gap-2"
                style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)'}}
            >
                {title}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            {children}

            <div className="flex items-center gap-x-3 sm:gap-x-4 text-base sm:text-lg font-semibold">
                 <button onClick={onPauseClick} disabled={isDealing} className="text-yellow-400 hover:text-yellow-300 disabled:text-gray-500/80 disabled:cursor-not-allowed" aria-label="Pause game">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 6a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                   </svg>
                </button>
                <div className="flex items-center gap-2 tabular-nums">
                    {layout === 'landscape' && <span className="text-white/80">Time:</span>}
                    <span className="font-mono w-[5ch] text-left">{formatTime(time)}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                    {layout === 'landscape' && <span className="text-white/80">Moves:</span>}
                    <span className="font-mono min-w-[3ch] sm:min-w-[4ch] text-left">{moves}</span>
                </div>
            </div>
        </header>
    );
};

export default GameHeader;
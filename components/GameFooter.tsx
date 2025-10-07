import React from 'react';

interface GameFooterProps {
  onNewGame: () => void;
  onUndo: () => void;
  onHint: () => void;
  onRules: () => void;
  onSettings: () => void;
  isUndoDisabled: boolean;
  isHintDisabled?: boolean;
  isDealing: boolean;
  children?: React.ReactNode;
}

const GameFooter: React.FC<GameFooterProps> = ({
  onNewGame,
  onUndo,
  onHint,
  onRules,
  onSettings,
  isUndoDisabled,
  isHintDisabled,
  isDealing,
  children,
}) => {
  const buttonClasses = "bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const iconButtonClasses = "bg-green-700 hover:bg-green-600 text-white font-bold p-2 rounded-lg transition duration-200 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <footer className={`w-full px-4 pt-2 pb-4 bg-black/20 flex-shrink-0 transition-opacity duration-300 ${isDealing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-7xl mx-auto w-full flex justify-center items-center gap-4">
        <button onClick={onNewGame} className={buttonClasses.replace('bg-green-700 hover:bg-green-600', 'bg-blue-600 hover:bg-blue-500')}>New Game</button>
        <button onClick={onUndo} disabled={isUndoDisabled} className={buttonClasses}>Undo</button>
        <button onClick={onHint} disabled={isHintDisabled} className={buttonClasses}>Hint</button>
        <button onClick={onRules} className={buttonClasses}>Rules</button>
        {children}
        <button onClick={onSettings} className={iconButtonClasses} aria-label="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </footer>
  );
};

export default GameFooter;

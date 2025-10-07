
import React, { useState, useRef, useEffect } from 'react';

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
  layout: 'portrait' | 'landscape';
  stockContent?: React.ReactNode;
  completedSetsContent?: React.ReactNode;
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
  layout,
  stockContent,
  completedSetsContent,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !menuButtonRef.current?.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  const landscapeButtonClasses = "flex items-center gap-2 bg-green-700/80 hover:bg-green-600/90 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-500/80 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm";
  const landscapeIconButtonClasses = "flex items-center justify-center bg-green-700/80 hover:bg-green-600/90 text-white font-bold p-2 rounded-lg transition duration-200 disabled:bg-gray-500/80 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm";

  if (layout === 'portrait') {
    const portraitButtonClasses = "flex flex-col items-center justify-center text-white text-xs font-semibold gap-1 disabled:opacity-50 transition-opacity";
    return (
      <footer className={`w-full px-2 pt-2 pb-safe-bottom bg-black/30 backdrop-blur-sm flex-shrink-0 transition-opacity duration-300 ${isDealing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="w-1/4">{stockContent}</div>

          <div className="flex justify-center items-center gap-4">
            <button onClick={onUndo} disabled={isUndoDisabled} className={portraitButtonClasses}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 010 10H6" /></svg>
              <span>Undo</span>
            </button>
            <button onClick={onNewGame} className={`${portraitButtonClasses} w-16 h-16 rounded-full bg-blue-600 shadow-lg text-sm`}>New Game</button>
            <button onClick={onHint} disabled={isHintDisabled} className={portraitButtonClasses}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              <span>Hint</span>
            </button>
          </div>
          
          <div className="w-1/4 flex justify-end items-center relative">
              {completedSetsContent}
              <button ref={menuButtonRef} onClick={() => setIsMenuOpen(prev => !prev)} className={portraitButtonClasses}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                <span>More</span>
              </button>
              {isMenuOpen && (
                <div ref={menuRef} className="absolute bottom-full right-0 mb-2 w-48 bg-white/90 backdrop-blur-md rounded-lg shadow-xl animate-fade-in-up origin-bottom-right">
                    <div className="p-2 space-y-1">
                        {children}
                        <button onClick={onRules} className="w-full text-left p-3 rounded-lg text-base font-semibold transition-colors bg-gray-100 hover:bg-green-100 text-gray-700">Rules</button>
                        <button onClick={onSettings} className="w-full text-left p-3 rounded-lg text-base font-semibold transition-colors bg-gray-100 hover:bg-green-100 text-gray-700">Settings</button>
                    </div>
                </div>
              )}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`w-full px-4 pt-2 pb-4 bg-black/20 flex-shrink-0 transition-opacity duration-300 ${isDealing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="max-w-7xl mx-auto w-full flex justify-center items-center gap-4">
        <button onClick={onNewGame} className={landscapeButtonClasses.replace('bg-green-700/80 hover:bg-green-600/90', 'bg-blue-600/80 hover:bg-blue-500/90')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5V4H4zm0 12v5h5v-5H4zM15 4v5h5V4h-5zm0 12v5h5v-5h-5z" /></svg>
          <span>New Game</span>
        </button>
        <button onClick={onUndo} disabled={isUndoDisabled} className={landscapeButtonClasses}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 010 10H6" /></svg>
          <span>Undo</span>
        </button>
        <button onClick={onHint} disabled={isHintDisabled} className={landscapeButtonClasses}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          <span>Hint</span>
        </button>
        <button onClick={onRules} className={landscapeButtonClasses}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          <span>Rules</span>
        </button>
        {children}
        <button onClick={onSettings} className={landscapeIconButtonClasses} aria-label="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
       <style>{`
        .pb-safe-bottom {
          padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out forwards;
        }
      `}</style>
    </footer>
  );
};

export default GameFooter;
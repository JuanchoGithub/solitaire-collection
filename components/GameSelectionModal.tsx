
import React, { useState, useEffect } from 'react';
import type { SpiderSuitCount } from '../games/spider/types';

interface GameSelectionModalProps {
  onClose: () => void;
  onSelectGame: (selection: 'klondike' | 'freecell' | { game: 'spider', suits: SpiderSuitCount }) => void;
  activeGame: 'spider' | 'klondike' | 'freecell';
  activeSpiderSuitCount: SpiderSuitCount;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const GameSelectionModal: React.FC<GameSelectionModalProps> = ({ onClose, onSelectGame, activeGame, activeSpiderSuitCount, buttonRef }) => {
  const [position, setPosition] = useState<{ top: number, left: number } | null>(null);

  useEffect(() => {
    if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + 8, left: rect.left });
    }
  }, [buttonRef]);
  
  const buttonBaseClasses = "w-full text-left p-3 rounded-lg text-base font-semibold transition-all duration-200 ease-in-out transform";
  const activeButtonClasses = "bg-green-600 text-white shadow-md scale-105";
  const inactiveButtonClasses = "bg-gray-200 hover:bg-green-200 hover:text-green-800 text-gray-700";
  
  if (!position) return null;

  return (
    <div className="absolute inset-0 z-50" onClick={onClose}>
      <div 
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        className="absolute bg-white rounded-xl shadow-2xl p-2 w-72 text-gray-800 animate-fade-in-down origin-top-left"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-green-700 mb-2 px-2 pt-1">Select a Game</h2>
        
        <div className="space-y-1">
            <button
                onClick={() => onSelectGame({ game: 'spider', suits: 1 })}
                className={`${buttonBaseClasses} ${activeGame === 'spider' && activeSpiderSuitCount === 1 ? activeButtonClasses : inactiveButtonClasses}`}
            >
                Spider (1 Suit - Easy)
            </button>
            <button
                onClick={() => onSelectGame({ game: 'spider', suits: 2 })}
                className={`${buttonBaseClasses} ${activeGame === 'spider' && activeSpiderSuitCount === 2 ? activeButtonClasses : inactiveButtonClasses}`}
            >
                Spider (2 Suits - Medium)
            </button>
            <button
                onClick={() => onSelectGame({ game: 'spider', suits: 4 })}
                className={`${buttonBaseClasses} ${activeGame === 'spider' && activeSpiderSuitCount === 4 ? activeButtonClasses : inactiveButtonClasses}`}
            >
                Spider (4 Suits - Hard)
            </button>
             <div className="border-t border-gray-200 my-2"></div>
            <button
                onClick={() => onSelectGame('klondike')}
                className={`${buttonBaseClasses} ${activeGame === 'klondike' ? activeButtonClasses : inactiveButtonClasses}`}
            >
                Klondike (Turn 3)
            </button>
            <button
                onClick={() => onSelectGame('freecell')}
                className={`${buttonBaseClasses} ${activeGame === 'freecell' ? activeButtonClasses : inactiveButtonClasses}`}
            >
                Freecell
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GameSelectionModal;

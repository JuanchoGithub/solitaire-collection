import React from 'react';
import type { SpiderSuitCount } from '../games/spider/types';

interface GameSelectionModalProps {
  onClose: () => void;
  onSelectGame: (selection: 'klondike' | { game: 'spider', suits: SpiderSuitCount }) => void;
  activeGame: 'spider' | 'klondike';
  activeSpiderSuitCount: SpiderSuitCount;
}

const GameSelectionModal: React.FC<GameSelectionModalProps> = ({ onClose, onSelectGame, activeGame, activeSpiderSuitCount }) => {
  
  const buttonBaseClasses = "w-full text-left p-4 rounded-lg text-lg font-semibold transition-all duration-200 ease-in-out transform";
  const activeButtonClasses = "bg-green-600 text-white shadow-lg scale-105";
  const inactiveButtonClasses = "bg-gray-200 hover:bg-green-200 hover:text-green-800 text-gray-700";

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-gray-800 animate-fade-in-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-green-700">Select a Game</h2>
            <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-bold transition-colors"
            aria-label="Close game selection"
            >&times;</button>
        </div>
        
        <div className="space-y-4">
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
             <div className="border-t border-gray-200 my-4"></div>
            <button
                onClick={() => onSelectGame('klondike')}
                className={`${buttonBaseClasses} ${activeGame === 'klondike' ? activeButtonClasses : inactiveButtonClasses}`}
            >
                Klondike (Turn 3)
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GameSelectionModal;

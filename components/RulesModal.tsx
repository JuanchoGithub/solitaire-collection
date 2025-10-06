
import React from 'react';

interface RulesModalProps {
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 text-left max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-800 animate-fade-in-down"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-green-700">How to Play Spider Solitaire</h2>
            <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-bold transition-colors"
            aria-label="Close rules"
            >&times;</button>
        </div>
        
        <div className="space-y-4">
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Objective</h3>
                <p>The goal is to build 8 sequences of cards from King down to Ace within the tableau. Once a full sequence is completed, it is removed from the game. The game is won when all cards have been cleared.</p>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">The Layout</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>The Tableau:</strong> Ten piles of cards that make up the main playing area. The first four piles have six cards, and the last six have five cards. Only the top card of each pile is face-up.</li>
                    <li><strong>The Stock:</strong> The pile of face-down cards remaining after setting up the tableau. These are dealt in sets of 10.</li>
                    <li><strong>Completed Sets:</strong> An area where completed King-to-Ace sequences are placed after being removed from the tableau.</li>
                </ul>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Gameplay Rules</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li>
                        <strong>Moving Cards:</strong> You can place a card onto another tableau pile if it is one rank lower. In multi-suit versions, the color doesn't matter for moving single cards, but this version uses one suit for simplicity.
                    </li>
                    <li>
                        <strong>Moving Stacks:</strong> You can move a sequence of face-up cards as a group if they are all of the same suit and in descending order (e.g., 8♠, 7♠, 6♠).
                    </li>
                    <li>
                        <strong>Revealing Cards:</strong> When you move the top face-up card from a tableau pile, the face-down card beneath it is turned over.
                    </li>
                     <li>
                        <strong>Empty Tableau Piles:</strong> Any card or valid sequence can be moved into an empty tableau pile.
                    </li>
                    <li>
                        <strong>Using the Stock:</strong> Click the Stock pile to deal one new face-up card to the bottom of each of the 10 tableau piles. <strong>You can only do this when there are no empty tableau piles.</strong>
                    </li>
                     <li>
                        <strong>Completing a Set:</strong> When you successfully arrange a full sequence from King down to Ace (K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2, A), it will automatically be removed from the tableau and placed in the completed sets area.
                    </li>
                </ul>
            </div>
            
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Winning the Game</h3>
                <p>You win when you have successfully completed and removed all 8 sequences, clearing the entire board.</p>
            </div>
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

export default RulesModal;

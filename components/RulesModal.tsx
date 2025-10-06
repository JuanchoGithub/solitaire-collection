import React from 'react';
import { SUIT_SYMBOL_MAP, SUIT_COLOR_MAP } from '../constants';
import { Suit } from '../types';

interface RulesModalProps {
  onClose: () => void;
}

const SuitSpan: React.FC<{ suit: Suit }> = ({ suit }) => {
    const color = SUIT_COLOR_MAP[suit] === 'red' ? 'text-red-500' : 'text-black';
    return <span className={`font-bold ${color}`}>{SUIT_SYMBOL_MAP[suit]}</span>
}


const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 text-left max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-800 animate-fade-in-down"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-green-700">How to Play Solitaire</h2>
            <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-bold transition-colors"
            aria-label="Close rules"
            >&times;</button>
        </div>
        
        <div className="space-y-4">
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Objective</h3>
                <p>The goal is to move all 52 cards from the deck into the four <strong>Foundation</strong> piles, one for each suit, in ascending order from Ace to King.</p>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">The Layout</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>The Tableau:</strong> Seven piles of cards that make up the main playing area. The first pile has one card, the second has two, and so on. Only the top card of each pile is face-up.</li>
                    <li><strong>The Stock:</strong> The pile of face-down cards remaining after setting up the tableau.</li>
                    <li><strong>The Waste:</strong> The pile of face-up cards next to the stock. Cards are dealt from the stock to the waste.</li>
                    <li><strong>The Foundations:</strong> Four empty piles at the top. This is where you will build up your suits, starting with the Aces.</li>
                </ul>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Gameplay Rules</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li>
                        <strong>Moving cards to the Tableau:</strong> You can place a card onto a tableau pile if it is one rank lower and of the opposite color.
                        <br />
                        <em>Example: You can place a red 6 (<SuitSpan suit={Suit.HEARTS} /> or <SuitSpan suit={Suit.DIAMONDS} />) on top of a black 7 (<SuitSpan suit={Suit.CLUBS} /> or <SuitSpan suit={Suit.SPADES} />).</em>
                    </li>
                    <li>
                        <strong>Moving stacks of cards:</strong> You can also move an entire face-up stack of cards from one tableau pile to another, following the same rule.
                    </li>
                    <li>
                        <strong>Revealing cards:</strong> When you move the top face-up card from a tableau pile, the face-down card beneath it is turned over.
                    </li>
                     <li>
                        <strong>Empty Tableau Piles:</strong> Only a <strong>King</strong> can be moved into an empty tableau pile.
                    </li>
                    <li>
                        <strong>Using the Stock:</strong> Click the Stock pile to deal one or three cards to the Waste pile, depending on the current "Turn" setting. The top card of the Waste is available to be played.
                    </li>
                     <li>
                        <strong>Resetting the Stock:</strong> When the stock is empty, click its empty space to move all cards from the waste back into the stock. You can go through the deck as many times as you need.
                    </li>
                    <li>
                        <strong>Building the Foundations:</strong> You can move a card to its corresponding foundation pile if it is the next in sequence. The foundations must start with an <strong>Ace</strong> and build up to the King.
                        <br />
                        <em>Example: The <SuitSpan suit={Suit.SPADES} /> pile must be built in the order A<SuitSpan suit={Suit.SPADES} />, 2<SuitSpan suit={Suit.SPADES} />, 3<SuitSpan suit={Suit.SPADES} />, and so on up to K<SuitSpan suit={Suit.SPADES} />.</em>
                    </li>
                </ul>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Game Controls</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Turn 1 / Turn 3:</strong> Toggles how many cards are dealt from the Stock. 'Turn 1' is easier, while 'Turn 3' offers a traditional challenge.</li>
                    <li><strong>Undo:</strong> Reverts your last move. You can undo multiple actions all the way to the start of the game.</li>
                    <li><strong>Timer & Pause:</strong> The timer tracks your game length. Press the pause icon (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 6a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" /></svg>) to halt the game and timer.</li>
                    <li><strong>Moves:</strong> Counts the number of successful card moves you've made during the game.</li>
                </ul>
            </div>

             <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Winning the Game</h3>
                <p>You win when all 52 cards have been successfully moved to the four foundation piles.</p>
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

import React from 'react';

interface RulesModalProps {
  onClose: () => void;
  game: 'spider' | 'klondike' | 'freecell';
}

const SpiderRules: React.FC = () => (
    <>
        <h2 className="text-3xl font-bold text-green-700">How to Play Spider Solitaire</h2>
        <div className="space-y-4 mt-4">
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Objective</h3>
                <p>The goal is to build 8 sequences of cards from King down to Ace within the tableau. Once a full sequence is completed, it is removed from the game. The game is won when all cards have been cleared.</p>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">The Layout</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>The Tableau:</strong> Ten piles of cards. The first four piles have six cards, and the last six have five. Only the top card of each pile is face-up.</li>
                    <li><strong>The Stock:</strong> Deals 10 cards at a time, one to each tableau pile.</li>
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Gameplay Rules</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li>You can move a card or a valid sequence onto a card that is one rank higher (e.g., a 7 can be placed on an 8).</li>
                    <li>A valid sequence is a group of cards of the same suit in descending order (e.g., 8♠, 7♠, 6♠). Only valid sequences can be moved together.</li>
                    <li>Any card or valid sequence can be moved into an empty tableau pile.</li>
                    <li>Click the Stock pile to deal cards. You can only do this when there are no empty tableau piles.</li>
                    <li>When you complete a King-to-Ace sequence of the same suit, it's automatically removed.</li>
                </ul>
            </div>
        </div>
    </>
);

const KlondikeRules: React.FC = () => (
    <>
        <h2 className="text-3xl font-bold text-green-700">How to Play Klondike Solitaire</h2>
        <div className="space-y-4 mt-4">
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Objective</h3>
                <p>The goal is to move all 52 cards to the four Foundation piles, building each suit up from Ace to King.</p>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">The Layout</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>The Tableau:</strong> Seven piles of cards, with the top card face-up.</li>
                    <li><strong>The Stock:</strong> The remaining deck of cards, face-down.</li>
                    <li><strong>The Waste:</strong> Cards are turned over from the Stock into the Waste pile. The top card is playable.</li>
                    <li><strong>The Foundations:</strong> Four empty piles where you will build your suits.</li>
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Gameplay Rules</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Tableau:</strong> Build sequences down in alternating colors (e.g., a red 7 on a black 8). You can move single cards or valid groups.</li>
                    <li><strong>Foundations:</strong> Build sequences up by suit, starting with the Ace (e.g., A♥, 2♥, 3♥...).</li>
                    <li>Only a King (or a sequence starting with a King) can be moved to an empty tableau pile.</li>
                    <li>Click the Stock to deal cards to the Waste pile (this version deals 3 at a time).</li>
                    <li>When the stock is empty, click it to reset the Waste pile back into the Stock.</li>
                </ul>
            </div>
        </div>
    </>
);

const FreecellRules: React.FC = () => (
     <>
        <h2 className="text-3xl font-bold text-green-700">How to Play Freecell Solitaire</h2>
        <div className="space-y-4 mt-4">
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Objective</h3>
                <p>The goal is to move all 52 cards to the four Foundation piles, building each suit up from Ace to King.</p>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">The Layout</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>The Tableau:</strong> Eight piles of cards, all dealt face-up.</li>
                    <li><strong>The Freecells:</strong> Four empty slots at the top left. Each can hold one card.</li>
                    <li><strong>The Foundations:</strong> Four empty piles at the top right where you will build your suits.</li>
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">Gameplay Rules</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Tableau:</strong> Build sequences down in alternating colors (e.g., a red 7 on a black 8).</li>
                    <li><strong>Foundations:</strong> Build sequences up by suit, starting with the Ace.</li>
                    <li>Any card can be moved to an empty tableau pile or an empty Freecell.</li>
                    <li>A card from a Freecell can be moved back to the Tableau or to a Foundation.</li>
                    <li><strong>Moving Stacks:</strong> You can move a valid, ordered stack of cards between tableau piles. The number of cards you can move at once is determined by the number of empty Freecells and empty Tableau piles you have. More empty spaces means you can move larger stacks.</li>
                </ul>
            </div>
        </div>
    </>
);


const RulesModal: React.FC<RulesModalProps> = ({ onClose, game }) => {
  const gameRules = {
    spider: <SpiderRules />,
    klondike: <KlondikeRules />,
    freecell: <FreecellRules />,
  };
    
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 text-left max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-800 animate-fade-in-down"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-4">
            {gameRules[game]}
            <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-bold transition-colors self-start -mt-2"
            aria-label="Close rules"
            >&times;</button>
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

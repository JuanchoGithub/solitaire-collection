
import React from 'react';

interface RulesModalProps {
  onClose: () => void;
  game: 'spider' | 'klondike' | 'freecell';
}

// --- Reusable Diagram Components ---

const Diagram: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-green-100/50 border-2 border-green-200 rounded-lg p-4 relative aspect-[1.6/1] w-full my-4 ${className}`}>
        {children}
    </div>
);

const Zone: React.FC<{ children: React.ReactNode, gridPosition: string, label?: string, labelPosition?: 'top' | 'bottom' | 'left' | 'right' }> = ({ children, gridPosition, label, labelPosition = 'bottom' }) => {
    const labelClasses = {
        top: 'bottom-full mb-1 left-1/2 -translate-x-1/2',
        bottom: 'top-full mt-1 left-1/2 -translate-x-1/2',
        left: 'right-full mr-2 top-1/2 -translate-y-1/2',
        right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    };
    return (
        <div className="relative" style={{ gridArea: gridPosition }}>
            {label && <div className={`absolute whitespace-nowrap text-xs sm:text-sm font-semibold text-green-800 ${labelClasses[labelPosition]}`}>{label}</div>}
            <div className="w-full h-full bg-black/5 rounded-md border border-dashed border-green-600/30 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

const CardStack: React.FC<{ count: number, faceUpCount?: number, className?: string }> = ({ count, faceUpCount = 0, className }) => (
    <div className={`relative w-10 h-14 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className={`absolute w-full h-full rounded border-2 ${i < count - faceUpCount ? 'bg-blue-400 border-blue-600' : 'bg-white border-gray-400'}`} style={{ top: `${i * 3}px` }}></div>
        ))}
    </div>
);

const MiniCard: React.FC<{ rank: string, isRed?: boolean, className?: string, children?: React.ReactNode }> = ({ rank, isRed, className, children }) => (
    <div className={`relative w-10 h-14 rounded border-2 bg-white flex items-center justify-center font-bold text-lg ${isRed ? 'border-red-500 text-red-500' : 'border-black text-black'} ${className}`}>
        {rank}
        {children}
    </div>
);

const Arrow: React.FC<{ from: string, to: string, text?: string }> = ({ from, to, text }) => (
     <div className="absolute inset-0 overflow-visible">
        <svg width="100%" height="100%" className="overflow-visible">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#15803d" />
                </marker>
            </defs>
            <path d={`M ${from} Q ${(parseFloat(from.split(' ')[0]) + parseFloat(to.split(' ')[0]))/2} ${Math.min(parseFloat(from.split(' ')[1]), parseFloat(to.split(' ')[1])) - 40}, ${to}`} stroke="#15803d" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="6, 4" />
        </svg>
        {text && <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 px-2 py-1 rounded text-green-900 text-xs sm:text-sm font-semibold">{text}</div>}
    </div>
);

// --- Game Specific Rules Components ---

const SpiderRules: React.FC = () => (
    <>
        <h2 className="text-3xl font-bold text-green-700 mb-2">How to Play Spider Solitaire</h2>
        <p className="text-sm text-gray-600 mb-4">Named for the eight "legs" (foundations) you must build, Spider is a challenging and popular solitaire variant that requires strategic thinking.</p>
        
        <div>
            <h3 className="text-xl font-semibold mb-2 text-green-800">The Layout</h3>
            <Diagram>
                <div className="grid grid-cols-10 gap-2 h-full">
                    <Zone gridPosition="1 / 1 / 2 / 11" label="The Tableau">
                        <div className="flex justify-around items-start w-full px-2 pt-2">
                            {Array.from({length: 10}).map((_, i) => <CardStack key={i} count={i < 4 ? 6 : 5} faceUpCount={1} />)}
                        </div>
                    </Zone>
                </div>
                 <div className="absolute bottom-2 right-2"><Zone gridPosition="" label="The Stock"><CardStack count={5} /></Zone></div>
            </Diagram>
            <p className="text-sm text-gray-700">The game starts with 10 tableau piles. The remaining 50 cards form the stock, which is used to deal new cards during play.</p>
        </div>

        <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2 text-green-800">Gameplay Rules</h3>
            <Diagram className="flex items-center justify-center gap-8">
                 <MiniCard rank="8" />
                 <MiniCard rank="7" />
                 <Arrow from="150 50" to="205 50" />
            </Diagram>
            <p className="text-sm text-gray-700"><strong>Build Sequences:</strong> You can move a card onto another card that is one rank higher (e.g., a 7 onto an 8). You can only move a full sequence of cards if they are all of the same suit.</p>
            
            <Diagram>
                 <div className="flex justify-around items-start">
                    <CardStack count={2} faceUpCount={2} />
                    <div className="relative">
                        <CardStack count={5} faceUpCount={1} />
                        <Arrow from="50 50" to="200 50" text="Deal 10 Cards"/>
                    </div>
                 </div>
                 <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-xs sm:text-sm text-green-900 font-medium bg-yellow-200/50 px-2 py-1 rounded">Click the stock to deal one new card to each tableau pile. You cannot do this if any piles are empty.</p>
            </Diagram>

            <p className="text-sm text-gray-700 mt-4"><strong>Objective:</strong> The goal is to create 8 complete sequences of the same suit, from King down to Ace. When a sequence is complete, it's removed from the board. Win by clearing all cards!</p>
        </div>
    </>
);

const KlondikeRules: React.FC = () => (
    <>
        <h2 className="text-3xl font-bold text-green-700 mb-2">How to Play Klondike Solitaire</h2>
        <p className="text-sm text-gray-600 mb-4">This is the classic solitaire game most people are familiar with, often simply called "Patience." It rose to worldwide fame after being included with Microsoft Windows.</p>
        
        <div>
            <h3 className="text-xl font-semibold mb-2 text-green-800">The Layout</h3>
            <Diagram>
                <div className="grid grid-rows-2 grid-cols-7 gap-2 h-full">
                    <Zone gridPosition="1 / 1 / 2 / 2" label="Stock"><CardStack count={24} /></Zone>
                    <Zone gridPosition="1 / 2 / 2 / 3" label="Waste"><MiniCard rank="5" isRed /></Zone>
                    {/* FIX: Add empty children to Zone component */}
                    <Zone gridPosition="1 / 4 / 2 / 8" label="Foundations"><></></Zone>
                    <Zone gridPosition="2 / 1 / 3 / 8" label="Tableau">
                         <div className="flex justify-around items-start w-full px-2 pt-2">
                             {Array.from({length: 7}).map((_, i) => <CardStack key={i} count={i+1} faceUpCount={1} />)}
                        </div>
                    </Zone>
                </div>
            </Diagram>
        </div>
        
        <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2 text-green-800">Gameplay Rules</h3>
            <Diagram className="flex items-center justify-center gap-8">
                <MiniCard rank="8" />
                <MiniCard rank="7" isRed />
                <Arrow from="50 50" to="105 50" />
            </Diagram>
            <p className="text-sm text-gray-700"><strong>Tableau:</strong> Build sequences downward in alternating colors (e.g., a red 7 on a black 8).</p>
            
            <Diagram className="flex items-center justify-center gap-8">
                <MiniCard rank="A" />
                <MiniCard rank="2" />
                <Arrow from="150 50" to="55 50" />
            </Diagram>
            <p className="text-sm text-gray-700"><strong>Foundations:</strong> Build sequences upward by suit, starting with the Ace (A, 2, 3, etc.).</p>

             <p className="text-sm text-gray-700 mt-4"><strong>Objective:</strong> The goal is to move all 52 cards to the four foundation piles. The game is won when all foundations are built from Ace to King.</p>
        </div>
    </>
);


const FreecellRules: React.FC = () => (
     <>
        <h2 className="text-3xl font-bold text-green-700 mb-2">How to Play Freecell Solitaire</h2>
        <p className="text-sm text-gray-600 mb-4">Invented for computers, Freecell is a unique game where almost every deal is solvable. All cards are dealt face-up, making it a game of pure skill.</p>
        
        <div>
            <h3 className="text-xl font-semibold mb-2 text-green-800">The Layout</h3>
            <Diagram>
                 <div className="grid grid-rows-2 grid-cols-8 gap-2 h-full">
                    {/* FIX: Add empty children to Zone component */}
                    <Zone gridPosition="1 / 1 / 2 / 5" label="Freecells"><></></Zone>
                    {/* FIX: Add empty children to Zone component */}
                    <Zone gridPosition="1 / 5 / 2 / 9" label="Foundations"><></></Zone>
                    <Zone gridPosition="2 / 1 / 3 / 9" label="Tableau">
                        <div className="flex justify-around items-start w-full px-2 pt-2">
                             {Array.from({length: 8}).map((_, i) => <CardStack key={i} count={i < 4 ? 7 : 6} faceUpCount={i < 4 ? 7 : 6} />)}
                        </div>
                    </Zone>
                </div>
            </Diagram>
        </div>

        <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2 text-green-800">Gameplay Rules</h3>
            <Diagram className="flex items-center justify-center gap-8">
                 <MiniCard rank="J" />
                 <div className="relative">
                    <div className="w-10 h-14 rounded border-2 bg-black/5 border-dashed border-green-600/30" />
                    <p className="absolute -bottom-5 text-center w-full text-xs font-semibold text-green-800">Freecell</p>
                 </div>
                 <Arrow from="50 50" to="105 50" />
            </Diagram>
            <p className="text-sm text-gray-700"><strong>Freecells:</strong> These are temporary holding spots. Any single card can be moved to an empty freecell to help you access other cards.</p>
            
            <h4 className="text-lg font-semibold text-green-800 mt-6 mb-2">Moving Stacks (The "Supermove")</h4>
            <p className="text-sm text-gray-700">
                Officially, the core rule of Freecell is that you can only move <strong>one card at a time</strong>. To move a stack, you would need to manually shuffle cards one-by-one using empty cells as temporary storage.
            </p>
            <p className="text-sm text-gray-700 mt-2">
                As a convenient shortcut, this game calculates if that sequence of moves is possible and lets you move the whole stack in one go. The number of cards you can move depends on the number of available empty spaces, as shown below.
            </p>
            
            <Diagram>
                <div className="grid grid-cols-3 grid-rows-2 gap-4 place-items-center">
                    <CardStack count={3} faceUpCount={3} />
                    <div className="relative">
                        <div className="w-10 h-14" />
                        <Arrow from="-20 50" to="70 50" />
                    </div>
                    <CardStack count={2} faceUpCount={2} />
                    <div className="text-center">
                        <p className="text-sm font-bold text-green-900">1 Empty Freecell</p>
                        <p className="text-xs text-gray-600">(Can move 2 cards)</p>
                    </div>
                    <div />
                    <div className="text-center">
                        <p className="text-sm font-bold text-green-900">1 Empty Tableau</p>
                         <p className="text-xs text-gray-600">(Doubles move size)</p>
                    </div>
                </div>
            </Diagram>

             <p className="text-sm text-gray-700 mt-4"><strong>Objective:</strong> Just like Klondike, the goal is to move all 52 cards to the four foundation piles, building each suit from Ace to King.</p>
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
        <div className="flex justify-between items-start mb-4">
            <div className="flex-grow pr-4">
                {gameRules[game]}
            </div>
            <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-bold transition-colors sticky top-0"
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


import React from 'react';

interface WinModalProps {
  onPlayAgain: () => void;
}

const WinModal: React.FC<WinModalProps> = ({ onPlayAgain }) => {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center animate-fade-in-down">
        <h2 className="text-4xl font-bold text-green-600 mb-4">Congratulations!</h2>
        <p className="text-lg text-gray-700 mb-6">You've won the game!</p>
        <button
          onClick={onPlayAgain}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
        >
          Play Again
        </button>
      </div>
      <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WinModal;

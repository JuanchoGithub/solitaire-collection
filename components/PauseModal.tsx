import React from 'react';

interface PauseModalProps {
  onResume: () => void;
}

const PauseModal: React.FC<PauseModalProps> = ({ onResume }) => {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center animate-fade-in-down">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Game Paused</h2>
        <button
          onClick={onResume}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
        >
          Resume
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

export default PauseModal;

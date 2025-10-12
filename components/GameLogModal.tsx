
import React, { useState } from 'react';

interface GameLogModalProps {
  onClose: () => void;
  log: string[];
}

const GameLogModal: React.FC<GameLogModalProps> = ({ onClose, log }) => {
  const [copyText, setCopyText] = useState('Copy Log');

  const handleCopy = () => {
    navigator.clipboard.writeText(log.join('\n')).then(() => {
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy Log'), 2000);
    });
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 text-left max-w-2xl w-full h-[80vh] flex flex-col text-gray-800 animate-fade-in-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-3xl font-bold text-green-700">Game Log</h2>
            <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-bold transition-colors sticky top-0"
            aria-label="Close log"
            >&times;</button>
        </div>
        <div className="flex-grow bg-gray-100 rounded-lg p-4 overflow-y-auto mb-4">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {log.map((entry, index) => (
                    <div key={index} className="pb-1">{index === 0 ? '' : `${index}: `}{entry}</div>
                ))}
            </pre>
        </div>
        <div className="flex justify-end">
             <button
                onClick={handleCopy}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors w-32"
            >
                {copyText}
            </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default GameLogModal;

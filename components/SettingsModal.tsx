import React from 'react';
import { THEMES, ThemeKey } from '../themes';

interface SettingsModalProps {
  onClose: () => void;
  onSelectTheme: (themeKey: ThemeKey) => void;
  activeThemeKey: ThemeKey;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSelectTheme, activeThemeKey }) => {
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
            <h2 className="text-3xl font-bold text-green-700">Settings</h2>
            <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-bold transition-colors"
            aria-label="Close settings"
            >&times;</button>
        </div>
        
        <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-600">Card Theme</h3>
            <div className="space-y-4">
                {(Object.keys(THEMES) as ThemeKey[]).map(key => (
                    <button
                        key={key}
                        onClick={() => onSelectTheme(key)}
                        className={`${buttonBaseClasses} ${activeThemeKey === key ? activeButtonClasses : inactiveButtonClasses}`}
                    >
                        {THEMES[key].name}
                    </button>
                ))}
            </div>
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

export default SettingsModal;

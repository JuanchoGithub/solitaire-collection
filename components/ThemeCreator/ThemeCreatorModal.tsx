
import React, { useState } from 'react';
import type { JsonTheme } from '../../themes/json/types';
import defaultJsonTheme from '../../themes/json/default';
import ThemeControlPanel from './ThemeControlPanel';
import ThemePreview from './ThemePreview';

interface ThemeCreatorModalProps {
  onClose: () => void;
  onSave: (theme: JsonTheme) => void;
  initialTheme?: JsonTheme | null;
}

const ThemeCreatorModal: React.FC<ThemeCreatorModalProps> = ({ onClose, onSave, initialTheme }) => {
    const [theme, setTheme] = useState<JsonTheme>(
        () => JSON.parse(JSON.stringify(initialTheme || defaultJsonTheme))
    );

    const handleSave = () => {
        onSave(theme);
    };

    const handleReset = () => {
        setTheme(JSON.parse(JSON.stringify(defaultJsonTheme)));
    };

    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(theme, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `${theme.name.replace(/\s+/g, '-')}.json`;
        link.click();
    };

    return (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] text-gray-800 animate-fade-in-down flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-2xl font-bold text-green-700">Theme Creator</h2>
                     <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-3xl font-bold transition-colors"
                        aria-label="Close theme creator"
                    >&times;</button>
                </header>
                <main className="flex-grow flex p-4 overflow-hidden">
                    <div className="w-2/5">
                        <ThemeControlPanel theme={theme} setTheme={setTheme} />
                    </div>
                    <div className="w-3/5 pl-4">
                        <ThemePreview theme={theme} />
                    </div>
                </main>
                 <footer className="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-xl gap-4">
                    <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Reset to Default</button>
                    <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold">Export JSON</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-lg">Save & Apply</button>
                </footer>
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

export default ThemeCreatorModal;

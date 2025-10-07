import React, { useState, useEffect, useRef } from 'react';

interface IconPickerProps {
  targetElement: HTMLElement;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const ASCII_ICONS = ['+', '*', '●', '■', '◆', '▲', '▼', '★', '✤', '❖', '※', '§', '†', '‡'];
const EMOJI_ICONS = ['❤️', '♦️', '♣️', '♠️', '🌸', '☀️', '⭐', '💀', '🎲', '🚀', '👻', '💎', '👑', '⚓', '⚛️', '⚡'];


const IconPicker: React.FC<IconPickerProps> = ({ targetElement, onSelect, onClose }) => {
    const [activeTab, setActiveTab] = useState<'ascii' | 'emoji'>('ascii');
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const pickerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const rect = targetElement.getBoundingClientRect();
        setPosition({ top: rect.bottom + 8, left: rect.left });

        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [targetElement, onClose]);

    const handleSelect = (icon: string) => {
        onSelect(icon);
        onClose();
    };
    
    const tabButtonBase = "px-4 py-2 text-sm font-semibold transition-colors w-full rounded-t-lg";
    const activeTabButton = "bg-white text-green-700";
    const inactiveTabButton = "bg-gray-100 hover:bg-gray-200 text-gray-600";
    
    return (
        <div 
            ref={pickerRef}
            className="absolute z-50 bg-white rounded-lg shadow-2xl border w-64 animate-fade-in-down"
            style={{ top: position.top, left: position.left }}
        >
            <div className="flex">
                <button 
                    onClick={() => setActiveTab('ascii')}
                    className={`${tabButtonBase} ${activeTab === 'ascii' ? activeTabButton : inactiveTabButton}`}
                >
                    ASCII
                </button>
                <button 
                    onClick={() => setActiveTab('emoji')}
                    className={`${tabButtonBase} ${activeTab === 'emoji' ? activeTabButton : inactiveTabButton}`}
                >
                    Emoji
                </button>
            </div>
            <div className="p-2 grid grid-cols-5 gap-1">
                {(activeTab === 'ascii' ? ASCII_ICONS : EMOJI_ICONS).map(icon => (
                    <button 
                        key={icon}
                        onClick={() => handleSelect(icon)}
                        className="flex items-center justify-center text-2xl h-12 w-12 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        {icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default IconPicker;

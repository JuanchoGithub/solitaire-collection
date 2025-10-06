import React from 'react';
import type { CardType } from '../../types';
import { SUIT_COLOR_MAP, SUIT_SYMBOL_MAP } from '../../constants';

export const SuitIcon: React.FC<{ suit: CardType['suit']; className?: string }> = ({ suit, className }) => {
    const symbol = SUIT_SYMBOL_MAP[suit];
    const color = SUIT_COLOR_MAP[suit] === 'red' ? '#ef4444' : '#111827';
    return (
        <svg viewBox="0 0 10 10" className={className} fill={color} preserveAspectRatio="xMidYMid meet"><text x="5" y="8" textAnchor="middle" fontSize="10">{symbol}</text></svg>
    );
};

export const KingArt: React.FC<{ suit: CardType['suit'] }> = ({ suit }) => {
    const color = SUIT_COLOR_MAP[suit] === 'red' ? '#ef4444' : '#111827';
    return (
        <svg viewBox="0 0 60 90" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <g stroke={color} strokeWidth="2" fill="none">
                {/* Crown */}
                <path d="M 15 25 L 20 15 L 30 20 L 40 15 L 45 25" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="20" cy="15" r="2" fill={color} />
                <circle cx="30" cy="20" r="2" fill={color} />
                <circle cx="40" cy="15" r="2" fill={color} />
                {/* Face */}
                <circle cx="30" cy="40" r="15" fill="rgba(0,0,0,0.05)" />
                <circle cx="25" cy="38" r="2" fill={color} />
                <circle cx="35" cy="38" r="2" fill={color} />
                {/* Moustache */}
                <path d="M 20 48 Q 30 45, 40 48" strokeWidth="1.5" />
                {/* Beard */}
                <path d="M 18 50 Q 30 70, 42 50" strokeWidth="1.5" strokeLinejoin="round" />
            </g>
        </svg>
    );
};

export const QueenArt: React.FC<{ suit: CardType['suit'] }> = ({ suit }) => {
    const color = SUIT_COLOR_MAP[suit] === 'red' ? '#ef4444' : '#111827';
    return (
        <svg viewBox="0 0 60 90" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <g stroke={color} strokeWidth="2" fill="none">
                {/* Crown */}
                <path d="M 18 25 C 25 15, 35 15, 42 25" strokeLinecap="round" />
                <circle cx="18" cy="25" r="2" fill={color} />
                <circle cx="30" cy="16" r="2" fill={color} />
                <circle cx="42" cy="25" r="2" fill={color} />
                {/* Face */}
                <circle cx="30" cy="42" r="14" fill="rgba(0,0,0,0.05)" />
                {/* Eyes */}
                <path d="M 23 40 C 25 38, 27 38, 29 40" />
                <path d="M 31 40 C 33 38, 35 38, 37 40" />
                {/* Mouth */}
                <path d="M 28 50 Q 30 52, 32 50" />
                {/* Hair */}
                <path d="M 16 35 C 10 50, 18 65, 25 60" />
                <path d="M 44 35 C 50 50, 42 65, 35 60" />
            </g>
        </svg>
    );
};

export const JackArt: React.FC<{ suit: CardType['suit'] }> = ({ suit }) => {
    const color = SUIT_COLOR_MAP[suit] === 'red' ? '#ef4444' : '#111827';
    return (
        <svg viewBox="0 0 60 90" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <g stroke={color} strokeWidth="2" fill="none">
                {/* Hat */}
                <path d="M 20 25 C 25 20, 35 20, 40 25 L 30 15 Z" fill="rgba(0,0,0,0.05)" strokeLinejoin="round"/>
                {/* Face */}
                <circle cx="30" cy="45" r="15" fill="rgba(0,0,0,0.05)" />
                <circle cx="25" cy="43" r="1.5" fill={color} />
                <circle cx="35" cy="43" r="1.5" fill={color} />
                {/* Mouth */}
                <path d="M 28 53 C 30 55, 32 55, 34 53" />
                {/* Hair */}
                 <path d="M 15 40 C 18 30, 25 30, 30 35" />
                 <path d="M 45 40 C 42 30, 35 30, 30 35" />
            </g>
        </svg>
    );
};

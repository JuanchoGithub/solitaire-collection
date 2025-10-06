import React from 'react';
import type { CardType } from '../../types';
import { SUIT_COLOR_MAP, SUIT_SYMBOL_MAP } from '../../constants';
import ClassicCardBack from './ClassicCardBack';

interface CardProps {
  card: CardType;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  width: number;
  height: number;
  isShaking?: boolean;
  isPressed?: boolean;
  isHinted?: boolean;
}

const SuitIcon: React.FC<{ suit: CardType['suit']; className: string }> = ({ suit, className }) => {
    const symbol = SUIT_SYMBOL_MAP[suit];
    const color = SUIT_COLOR_MAP[suit] === 'red' ? '#ef4444' : '#000000';
    return (
        <svg viewBox="0 0 10 10" className={className} fill={color}><text x="5" y="8" textAnchor="middle" fontSize="10">{symbol}</text></svg>
    );
};

const ClassicCard: React.FC<CardProps> = ({ card, onMouseDown, style, isDragging, width, height, isShaking, isPressed, isHinted }) => {
  const { suit, rank, faceUp } = card;

  if (!faceUp) {
    return (
      <div
        data-card-id={card.id}
        style={{ width: `${width}px`, height: `${height}px`, ...style }}
        className={`rounded-lg shadow-md cursor-pointer ${isHinted ? 'card-hint' : ''}`}
        onMouseDown={onMouseDown}
      >
        <ClassicCardBack />
      </div>
    );
  }

  const colorClass = SUIT_COLOR_MAP[suit] === 'red' ? 'text-red-500' : 'text-black';
  const visibilityClass = isDragging ? 'invisible' : '';
  const fontSize = width < 80 ? 'text-lg' : 'text-xl';
  const shakeClass = isShaking ? 'card-shake' : '';
  const pressedClass = isPressed ? 'card-pressed' : '';
  const hintClass = isHinted ? 'card-hint' : '';

  return (
    <div
      data-card-id={card.id}
      onMouseDown={onMouseDown}
      style={{ width: `${width}px`, height: `${height}px`, ...style }}
      className={`bg-white rounded-lg shadow-md flex flex-col justify-between relative select-none cursor-grab active:cursor-grabbing ${colorClass} ${visibilityClass} ${shakeClass} ${pressedClass} ${hintClass} transition-transform duration-100 ease-out`}
    >
      {/* Top Left Rank */}
      <div className="absolute top-1 left-2">
        <div className={`font-bold ${fontSize} leading-none`}>{rank}</div>
      </div>
      {/* Top Right Suit */}
      <div className="absolute top-1 right-2">
        <SuitIcon suit={suit} className="w-5 h-5" />
      </div>

      {/* Center Suit */}
      <div className="flex-grow flex items-center justify-center p-2">
        <SuitIcon suit={suit} className="w-10 h-10" />
      </div>
      
      {/* Bottom Left Suit */}
      <div className="absolute bottom-1 left-2 transform rotate-180">
        <SuitIcon suit={suit} className="w-5 h-5" />
      </div>
      {/* Bottom Right Rank */}
      <div className="absolute bottom-1 right-2 transform rotate-180">
         <div className={`font-bold ${fontSize} leading-none`}>{rank}</div>
      </div>
    </div>
  );
};

export default ClassicCard;

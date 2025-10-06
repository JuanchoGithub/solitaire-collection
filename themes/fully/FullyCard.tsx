import React from 'react';
import type { CardType } from '../../types';
import { Rank } from '../../types';
import { SUIT_COLOR_MAP, RANK_VALUE_MAP } from '../../constants';
import FullyCardBack from './FullyCardBack';
import { SuitIcon, KingArt, QueenArt, JackArt } from './CardArt';

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

const Pips: React.FC<{ rank: Rank, suit: CardType['suit'] }> = ({ rank, suit }) => {
    const rankValue = RANK_VALUE_MAP[rank];
    if (rankValue > 10 || rankValue < 2) return null;

    const pip = <SuitIcon suit={suit} className="w-full h-full" />;

    const getPipStyle = (y: number, x: number, rotated = false): React.CSSProperties => ({
        position: 'absolute',
        top: `${y * 100}%`,
        left: `${x * 100}%`,
        width: '20%',
        height: '15%',
        transform: `translate(-50%, -50%) ${rotated ? 'rotate(180deg)' : ''}`,
    });

    const layouts: { [key: number]: React.CSSProperties[] } = {
        2: [getPipStyle(0.25, 0.5), getPipStyle(0.75, 0.5, true)],
        3: [getPipStyle(0.2, 0.5), getPipStyle(0.5, 0.5), getPipStyle(0.8, 0.5, true)],
        4: [getPipStyle(0.2, 0.25), getPipStyle(0.2, 0.75), getPipStyle(0.8, 0.25, true), getPipStyle(0.8, 0.75, true)],
        5: [getPipStyle(0.2, 0.25), getPipStyle(0.2, 0.75), getPipStyle(0.5, 0.5), getPipStyle(0.8, 0.25, true), getPipStyle(0.8, 0.75, true)],
        6: [getPipStyle(0.2, 0.25), getPipStyle(0.2, 0.75), getPipStyle(0.5, 0.25), getPipStyle(0.5, 0.75), getPipStyle(0.8, 0.25, true), getPipStyle(0.8, 0.75, true)],
        7: [getPipStyle(0.2, 0.25), getPipStyle(0.2, 0.75), getPipStyle(0.35, 0.5), getPipStyle(0.5, 0.25), getPipStyle(0.5, 0.75), getPipStyle(0.8, 0.25, true), getPipStyle(0.8, 0.75, true)],
        8: [getPipStyle(0.2, 0.25), getPipStyle(0.2, 0.75), getPipStyle(0.35, 0.5), getPipStyle(0.65, 0.5, true), getPipStyle(0.5, 0.25), getPipStyle(0.5, 0.75), getPipStyle(0.8, 0.25, true), getPipStyle(0.8, 0.75, true)],
        9: [getPipStyle(0.2, 0.25), getPipStyle(0.2, 0.75), getPipStyle(0.35, 0.25), getPipStyle(0.35, 0.75), getPipStyle(0.5, 0.5), getPipStyle(0.65, 0.25, true), getPipStyle(0.65, 0.75, true), getPipStyle(0.8, 0.25, true), getPipStyle(0.8, 0.75, true)],
       10: [getPipStyle(0.2, 0.25), getPipStyle(0.2, 0.75), getPipStyle(0.35, 0.25), getPipStyle(0.35, 0.75), getPipStyle(0.28, 0.5), getPipStyle(0.72, 0.5, true), getPipStyle(0.65, 0.25, true), getPipStyle(0.65, 0.75, true), getPipStyle(0.8, 0.25, true), getPipStyle(0.8, 0.75, true)],
    };

    return (
        <div className="absolute inset-0 w-full h-full p-[12%]">
            <div className="relative w-full h-full">
                {layouts[rankValue].map((style, i) => (
                    <div key={i} style={style}>
                        {pip}
                    </div>
                ))}
            </div>
        </div>
    );
};

const FullyCard: React.FC<CardProps> = ({ card, onMouseDown, style, isDragging, width, height, isShaking, isPressed, isHinted }) => {
  const { suit, rank, faceUp } = card;

  if (!faceUp) {
    return (
      <div
        data-card-id={card.id}
        style={{ width: `${width}px`, height: `${height}px`, ...style }}
        className={`rounded-lg shadow-md cursor-pointer ${isHinted ? 'card-hint' : ''}`}
        onMouseDown={onMouseDown}
      >
        <FullyCardBack />
      </div>
    );
  }

  const colorClass = SUIT_COLOR_MAP[suit] === 'red' ? 'text-red-600' : 'text-gray-900';
  const visibilityClass = isDragging ? 'invisible' : '';
  const fontSize = width < 80 ? 'text-base' : 'text-lg';
  const shakeClass = isShaking ? 'card-shake' : '';
  const pressedClass = isPressed ? 'card-pressed' : '';
  const hintClass = isHinted ? 'card-hint' : '';
  const rankValue = RANK_VALUE_MAP[rank];
  const isFaceCard = rankValue > 10;

  const CornerInfo: React.FC<{className?: string}> = ({className}) => (
    <div className={`absolute text-center ${className} w-7`}>
        <div className={`font-bold ${fontSize} leading-none`}>{rank}</div>
        <SuitIcon suit={suit} className="w-4 h-4 mx-auto mt-0.5" />
    </div>
  );

  const FaceCardArt: React.FC = () => {
    let ArtComponent;
    if (rank === Rank.KING) ArtComponent = KingArt;
    else if (rank === Rank.QUEEN) ArtComponent = QueenArt;
    else if (rank === Rank.JACK) ArtComponent = JackArt;
    else return null;

    return <ArtComponent suit={suit} />;
  };


  return (
    <div
      data-card-id={card.id}
      onMouseDown={onMouseDown}
      style={{ width: `${width}px`, height: `${height}px`, ...style }}
      className={`bg-gray-50 rounded-lg shadow-md flex flex-col relative select-none cursor-grab active:cursor-grabbing ${colorClass} ${visibilityClass} ${shakeClass} ${pressedClass} ${hintClass} transition-transform duration-100 ease-out border-2 border-gray-300`}
    >
      <CornerInfo className="top-1 left-1" />
      
      <div className="flex-grow flex items-center justify-center p-[15%]">
        {rank === Rank.ACE && <SuitIcon suit={suit} className="w-3/5 h-3/5" />}
        {rankValue > 1 && rankValue < 11 && <Pips rank={rank} suit={suit} />}
        {isFaceCard && <FaceCardArt />}
      </div>
      
      <CornerInfo className="bottom-1 right-1 transform rotate-180" />
    </div>
  );
};

export default FullyCard;

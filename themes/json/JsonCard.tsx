
import React from 'react';
import type { CardThemeProps, CardType } from '../../types';
import { Rank } from '../../types';
import { SUIT_COLOR_MAP, RANK_VALUE_MAP } from '../../constants';
import JsonCardBack from './JsonCardBack';
import type { JsonTheme, PipsProps, FaceCardArtConfig } from './types';

interface JsonCardProps extends CardThemeProps {
  theme: JsonTheme['card'];
  cardBackTheme: JsonTheme['cardBack'];
}

const SuitIcon: React.FC<{ symbol: string; suit: CardType['suit']; className?: string; style?: React.CSSProperties; redColor: string; blackColor: string; }> = ({ symbol, suit, className, style, redColor, blackColor }) => {
    const color = SUIT_COLOR_MAP[suit] === 'red' ? redColor : blackColor;
    return (
        <svg viewBox="0 0 10 10" className={className} style={style} fill={color}><text x="5" y="8" textAnchor="middle" fontSize="10">{symbol}</text></svg>
    );
};

// Adapted from FullyCard.tsx to be data-driven
const Pips: React.FC<PipsProps> = ({ rank, suit, redColor, blackColor, pipSize, suitIcons }) => {
    const rankValue = RANK_VALUE_MAP[rank];
    if (rankValue > 10 || rankValue < 2) return null;

    const pip = <SuitIcon symbol={suitIcons[suit]} suit={suit} redColor={redColor} blackColor={blackColor} className="w-full h-full" />;
    const getPipStyle = (y: number, x: number, rotated = false): React.CSSProperties => ({
        position: 'absolute', top: `${y * 100}%`, left: `${x * 100}%`,
        width: pipSize, height: pipSize,
        transform: `translate(-50%, -50%) ${rotated ? 'rotate(180deg)' : ''}`,
    });
    const layouts: { [key: number]: React.CSSProperties[] } = {
        2: [getPipStyle(0.15, 0.5), getPipStyle(0.85, 0.5, true)],
        3: [getPipStyle(0.15, 0.5), getPipStyle(0.5, 0.5), getPipStyle(0.85, 0.5, true)],
        4: [getPipStyle(0.15, 0.25), getPipStyle(0.15, 0.75), getPipStyle(0.85, 0.25, true), getPipStyle(0.85, 0.75, true)],
        5: [getPipStyle(0.15, 0.25), getPipStyle(0.15, 0.75), getPipStyle(0.5, 0.5), getPipStyle(0.85, 0.25, true), getPipStyle(0.85, 0.75, true)],
        6: [getPipStyle(0.15, 0.25), getPipStyle(0.15, 0.75), getPipStyle(0.5, 0.25), getPipStyle(0.5, 0.75), getPipStyle(0.85, 0.25, true), getPipStyle(0.85, 0.75, true)],
        7: [getPipStyle(0.15, 0.25), getPipStyle(0.15, 0.75), getPipStyle(0.325, 0.5), getPipStyle(0.5, 0.25), getPipStyle(0.5, 0.75), getPipStyle(0.85, 0.25, true), getPipStyle(0.85, 0.75, true)],
        8: [getPipStyle(0.15, 0.25), getPipStyle(0.15, 0.75), getPipStyle(0.325, 0.5), getPipStyle(0.675, 0.5, true), getPipStyle(0.5, 0.25), getPipStyle(0.5, 0.75), getPipStyle(0.85, 0.25, true), getPipStyle(0.85, 0.75, true)],
        9: [getPipStyle(0.15, 0.25), getPipStyle(0.15, 0.75), getPipStyle(0.325, 0.25), getPipStyle(0.325, 0.75), getPipStyle(0.5, 0.5), getPipStyle(0.675, 0.25, true), getPipStyle(0.675, 0.75, true), getPipStyle(0.85, 0.25, true), getPipStyle(0.85, 0.75, true)],
       10: [getPipStyle(0.15, 0.25), getPipStyle(0.15, 0.75), getPipStyle(0.325, 0.25), getPipStyle(0.325, 0.75), getPipStyle(0.23, 0.5), getPipStyle(0.77, 0.5, true), getPipStyle(0.675, 0.25, true), getPipStyle(0.675, 0.75, true), getPipStyle(0.85, 0.25, true), getPipStyle(0.85, 0.75, true)],
    };

    return (
        <div className="relative w-full h-full p-4">
            {layouts[rankValue].map((style, i) => <div key={i} style={style}>{pip}</div>)}
        </div>
    );
};

const FaceCardArt: React.FC<{ rank: Rank.JACK | Rank.QUEEN | Rank.KING, theme: JsonTheme['card'] }> = ({ rank, theme }) => {
    const config = theme.faceCardArt[rank];
    if (!config || config.type === 'none') return null;

    const artStyle: React.CSSProperties = {
        position: 'absolute',
        top: config.position.y,
        left: config.position.x,
        width: config.size.width,
        height: config.size.height,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    if (config.type === 'svg') {
        return <div style={artStyle} dangerouslySetInnerHTML={{ __html: config.content }} />;
    }

    // emoji or ascii
    return (
        <div style={artStyle}>
            <span style={{ fontSize: `min(${config.size.width}, ${config.size.height})`, lineHeight: 1 }}>{config.content}</span>
        </div>
    );
};

const JsonCard: React.FC<JsonCardProps> = ({ card, onMouseDown, style, isDragging, width, height, isShaking, isPressed, isHinted, theme, cardBackTheme }) => {
  const { suit, rank, faceUp } = card;

  if (!faceUp) {
    return (
      <div
        data-card-id={card.id}
        style={{ width: `${width}px`, height: `${height}px`, ...style }}
        className={`rounded-lg shadow-md cursor-pointer ${isHinted ? 'card-hint' : ''}`}
        onMouseDown={onMouseDown}
      >
        <JsonCardBack theme={cardBackTheme} />
      </div>
    );
  }

  const color = SUIT_COLOR_MAP[suit] === 'red' ? theme.redColor : theme.blackColor;
  const visibilityClass = isDragging ? 'invisible' : '';
  const shakeClass = isShaking ? 'card-shake' : '';
  const pressedClass = isPressed ? 'card-pressed' : '';
  const hintClass = isHinted ? 'card-hint' : '';
  
  const cardStyle: React.CSSProperties = {
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: theme.backgroundColor,
      borderRadius: theme.cornerRadius,
      boxShadow: theme.shadow,
      color: color,
      fontFamily: theme.fontFamily,
      borderWidth: theme.borderWidth,
      borderStyle: theme.borderStyle,
      borderColor: theme.borderColor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      userSelect: 'none',
      ...style,
  };
  
  const rankValue = RANK_VALUE_MAP[rank];

  const Corner: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
      const isTop = position === 'top';
      const cornerStyle: React.CSSProperties = {
          position: 'absolute',
          padding: theme.cornerPadding,
          display: 'flex',
          flexDirection: theme.cornerLayout === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          gap: '0.125rem',
          ...(isTop ? { top: 0, left: 0 } : { bottom: 0, right: 0, transform: 'rotate(180deg)' })
      };
      
      return (
        <div style={cornerStyle}>
            <div className={`font-bold leading-none text-center`} style={{ fontSize: theme.rankFontSize }}>{rank}</div>
            {theme.cornerLayout !== 'none' && (
                <SuitIcon symbol={theme.suitIcons[suit]} suit={suit} redColor={theme.redColor} blackColor={theme.blackColor} style={{ width: theme.cornerSuitSize, height: theme.cornerSuitSize }} />
            )}
        </div>
      );
  };
  
  const renderCenterContent = () => {
    if (rank === Rank.JACK || rank === Rank.QUEEN || rank === Rank.KING) {
        const faceArt = <FaceCardArt rank={rank} theme={theme} />;
        if (faceArt) return faceArt;
    }
    if (theme.pipsLayout === 'standard' && rankValue > 1 && rankValue < 11) {
        return (
            <div className="w-full h-full" style={{ transform: `scale(${theme.pipsGridScale})` }}>
                <Pips rank={rank} suit={suit} redColor={theme.redColor} blackColor={theme.blackColor} pipSize={theme.standardPipSize} suitIcons={theme.suitIcons} />
            </div>
        );
    }
    // Fallback for single layout, Ace, or face cards with no art
    return (
        <div style={{
            position: 'absolute',
            top: theme.pipsPosition.y,
            left: theme.pipsPosition.x,
            width: theme.pipsSize,
            height: theme.pipsSize,
            transform: 'translate(-50%, -50%)',
        }}>
            <SuitIcon symbol={theme.suitIcons[suit]} suit={suit} redColor={theme.redColor} blackColor={theme.blackColor} className="w-full h-full" />
        </div>
    );
  };

  return (
    <div
      data-card-id={card.id}
      onMouseDown={onMouseDown}
      style={cardStyle}
      className={`cursor-grab active:cursor-grabbing ${visibilityClass} ${shakeClass} ${pressedClass} ${hintClass} transition-transform duration-100 ease-out`}
    >
      {theme.showTopCorner && <Corner position="top" />}

      <div className="flex-grow flex items-center justify-center p-2 relative">
          {renderCenterContent()}
      </div>
      
      {theme.showBottomCorner && <Corner position="bottom" />}
    </div>
  );
};

export default JsonCard;

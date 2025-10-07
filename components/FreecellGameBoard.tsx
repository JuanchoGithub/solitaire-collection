
import React from 'react';
import type { FreecellController } from '../games/freecell/useFreecell';
import EmptyPile from './EmptyPile';
import WinModal from './WinModal';
import RulesModal from './RulesModal';
import PauseModal from './PauseModal';
import GameHeader from './GameHeader';
import GameFooter from './GameFooter';
import { Suit, Rank } from '../types';
import { SUITS, SUIT_COLOR_MAP, SUIT_SYMBOL_MAP } from '../constants';


interface FreecellGameBoardProps {
    controller: FreecellController;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
    layout: 'portrait' | 'landscape';
}

const FreecellGameBoard: React.FC<FreecellGameBoardProps> = ({ controller, onTitleClick, onSettingsClick, gameMenuButtonRef, layout }) => {
    const {
        Board, Card, freecells, foundations, tableau, history, isWon, isRulesModalOpen, pressedStack, hint, moves, time, isPaused, autoplayMode,
        cardSize, shuffleClass, isDealing, dealAnimationCards, animationData, returnAnimationData, dragGhost, dragSourceInfo, hiddenCardIds, foundationFx,
        initializeGame, handleUndo, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleReturnAnimationEnd, handleAnimationEnd, handleAutoplayModeToggle,
        mainContainerRef, foundationRefs, tableauRefs, freecellRefs, initialDeckRef, formatTime
    } = controller;
    
    return (
        <Board shuffleClass={shuffleClass}>
             {isWon && <WinModal onPlayAgain={initializeGame} />}
             {isRulesModalOpen && <RulesModal game="freecell" onClose={() => setIsRulesModalOpen(false)} />}
             {isPaused && <PauseModal onResume={() => setIsPaused(false)} />}

             {dealAnimationCards.map(({ card, key, style }) => (
                <div key={key} className="deal-card" style={style}>
                    <Card card={card} width={cardSize.width} height={cardSize.height} />
                </div>
             ))}
            
            {animationData && (
                <div
                    className="auto-move-card"
                    style={{
                        position: 'fixed',
                        width: `${animationData.fromRect.width}px`,
                        height: `${animationData.fromRect.height}px`,
                        top: `${animationData.fromRect.top}px`,
                        left: `${animationData.fromRect.left}px`,
                        zIndex: 100,
                        '--translateX': `${animationData.toRect.left - animationData.fromRect.left}px`,
                        '--translateY': `${animationData.toRect.top - animationData.fromRect.top}px`,
                    } as React.CSSProperties}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <Card card={animationData.cards[0]} width={cardSize.width} height={cardSize.height}/>
                </div>
            )}

            {isDealing && (
                <div 
                    ref={initialDeckRef}
                    className="initial-deck-visual"
                    style={{ 
                        position: 'fixed',
                        width: cardSize.width, 
                        height: cardSize.height,
                        bottom: '2rem', 
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                >
                    <Card card={{ id: -1, suit: Suit.SPADES, rank: Rank.ACE, faceUp: false }} width={cardSize.width} height={cardSize.height} />
                </div>
            )}
            
            {dragGhost && (
                <div style={{
                    position: 'fixed',
                    top: dragGhost.y,
                    left: dragGhost.x,
                    zIndex: 1000,
                    pointerEvents: 'none',
                    transform: 'scale(1.05) rotate(3deg)',
                    filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.14)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.12))',
                }}>
                    <div style={{ position: 'relative', width: cardSize.width, height: cardSize.height }}>
                        {dragGhost.cards.map((card, index) => (
                            <Card 
                                key={card.id}
                                card={card} 
                                width={cardSize.width} 
                                height={cardSize.height}
                                style={{
                                    position: 'absolute',
                                    top: `${index * cardSize.faceUpStackOffset}px`,
                                    left: 0,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {returnAnimationData && (
                <div
                    className="return-animation"
                    style={{
                        position: 'fixed',
                        top: `${returnAnimationData.from.y}px`,
                        left: `${returnAnimationData.from.x}px`,
                        zIndex: 1000,
                        pointerEvents: 'none',
                        '--translateX': `${returnAnimationData.toRect.left - returnAnimationData.from.x}px`,
                        '--translateY': `${returnAnimationData.toRect.top - returnAnimationData.from.y}px`,
                    } as React.CSSProperties}
                    onAnimationEnd={handleReturnAnimationEnd}
                >
                     <div style={{ position: 'relative', width: cardSize.width, height: cardSize.height }}>
                        {returnAnimationData.cards.map((card, index) => (
                            <Card 
                                key={card.id}
                                card={card} 
                                width={cardSize.width} 
                                height={cardSize.height}
                                style={{
                                    position: 'absolute',
                                    top: `${index * cardSize.faceUpStackOffset}px`,
                                    left: 0,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto w-full flex-shrink-0">
                <GameHeader
                    title="Freecell"
                    time={time}
                    moves={moves}
                    isDealing={isDealing}
                    onTitleClick={onTitleClick}
                    onPauseClick={() => setIsPaused(true)}
                    formatTime={formatTime}
                    gameMenuButtonRef={gameMenuButtonRef}
                    layout={layout}
                >
                    <div className="flex-grow"></div>
                </GameHeader>
            </div>
            
            <div className="w-full flex-1 overflow-y-auto min-h-0">
                <main ref={mainContainerRef} className="max-w-7xl mx-auto w-full pt-4 pb-4">
                     <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mb-8">
                        <div className="flex gap-3">
                            {freecells.map((card, i) => {
                                const isPressed = !!pressedStack && pressedStack.source === 'freecell' && pressedStack.sourcePileIndex === i;
                                return (
                                    <div key={i} ref={el => { freecellRefs.current[i] = el; }}>
                                        {card ? 
                                            <Card 
                                                card={card}
                                                onMouseDown={e => handleMouseDown(e, 'freecell', i, 0)}
                                                isDragging={dragSourceInfo?.source === 'freecell' && dragSourceInfo.sourcePileIndex === i}
                                                isPressed={isPressed}
                                                isHinted={hint?.type === 'card' && hint.cardId === card.id}
                                                width={cardSize.width} height={cardSize.height}
                                            /> : 
                                            <EmptyPile width={cardSize.width} height={cardSize.height} />
                                        }
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-3">
                            {foundations.map((pile, i) => {
                                const topCard = pile[pile.length - 1];
                                return (
                                    <div key={i} ref={el => { foundationRefs.current[i] = el; }} className="relative" style={{ width: cardSize.width, height: cardSize.height }}>
                                        <EmptyPile width={cardSize.width} height={cardSize.height}>
                                            <div className={`text-5xl ${SUIT_COLOR_MAP[SUITS[i]] === 'red' ? 'text-red-400/60' : 'text-white/30'} font-thin`}>
                                                {SUIT_SYMBOL_MAP[SUITS[i]]}
                                            </div>
                                        </EmptyPile>
                                        {topCard && 
                                            <div className="absolute top-0 left-0">
                                                <Card card={topCard} width={cardSize.width} height={cardSize.height} isHinted={hint?.type === 'card' && hint.cardId === topCard.id} />
                                            </div>
                                        }
                                        {foundationFx?.index === i && (
                                            <div className="absolute inset-0 pointer-events-none z-10">
                                                {Array.from({ length: 8 }).map((_, j) => {
                                                    const angle = (j / 8) * 2 * Math.PI;
                                                    const radius = 50 + Math.random() * 30;
                                                    const color = ['#fde047', '#f9a8d4', '#a7f3d0'][j % 3];
                                                    return (
                                                        <div 
                                                            key={`star-${j}`} 
                                                            className="cute-star"
                                                            style={{
                                                                '--tx': `${Math.cos(angle) * radius}px`,
                                                                '--ty': `${Math.sin(angle) * radius}px`,
                                                                '--color': color,
                                                                'animationDelay': `${Math.random() * 0.2}s`,
                                                            } as React.CSSProperties}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                     </div>

                    <div className="flex flex-nowrap gap-3 justify-center">
                        {tableau.map((pile, pileIndex) => {
                            const pileHeight = pile.length > 0 ? (pile.length - 1) * cardSize.faceUpStackOffset + cardSize.height : cardSize.height;
                            const areAllCardsInPileDragging = dragSourceInfo?.source === 'tableau' && dragSourceInfo.sourcePileIndex === pileIndex && dragSourceInfo.cards.length === pile.length;

                            return (
                                <div key={pileIndex} className="relative" ref={el => { tableauRefs.current[pileIndex] = el; }} data-pile-id={`tableau-${pileIndex}`}>
                                    {(pile.length === 0 || areAllCardsInPileDragging) ? <EmptyPile width={cardSize.width} height={cardSize.height}/> :
                                        pile.map((card, cardIndex) => {
                                            const isCardDragging = !!dragSourceInfo?.cards.some(c => c.id === card.id);
                                            const isCardPressed = !!pressedStack && pressedStack.source === 'tableau' && pressedStack.sourcePileIndex === pileIndex && cardIndex >= pressedStack.sourceCardIndex;

                                            return (hiddenCardIds.includes(card.id)) ?
                                            <div key={card.id} style={{ position: 'absolute', top: `${cardIndex * cardSize.faceUpStackOffset}px`, left: 0, width: cardSize.width, height: cardSize.height }} /> :
                                            (
                                                <Card
                                                    key={card.id}
                                                    card={card}
                                                    onMouseDown={(e) => handleMouseDown(e, 'tableau', pileIndex, cardIndex)}
                                                    width={cardSize.width} height={cardSize.height}
                                                    style={{ position: 'absolute', top: `${cardIndex * cardSize.faceUpStackOffset}px`, left: 0, zIndex: cardIndex + (isCardPressed ? 20 : 0) }}
                                                    isDragging={isCardDragging}
                                                    isPressed={isCardPressed}
                                                    isHinted={hint?.type === 'card' && hint.cardId === card.id}
                                                />
                                            );
                                        })
                                    }
                                     <div style={{ height: `${pileHeight}px`, width: `${cardSize.width}px` }}></div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
            <GameFooter
                onNewGame={initializeGame}
                onUndo={handleUndo}
                onHint={handleHint}
                onRules={() => setIsRulesModalOpen(true)}
                onSettings={onSettingsClick}
                isUndoDisabled={history.length === 0}
                isHintDisabled={isDealing || isPaused || !!animationData}
                isDealing={isDealing}
                layout={layout}
            >
                <div className="relative group">
                    <button onClick={handleAutoplayModeToggle} className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
                        Autoplay: <span className="capitalize">{autoplayMode}</span>
                    </button>
                    <div className="absolute bottom-full mb-2 w-60 bg-black/80 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center left-1/2 -translate-x-1/2 z-20">
                        { autoplayMode === 'off' && 'Off: No automatic moves.' }
                        { autoplayMode === 'auto' && 'Auto: Automatically moves cards to the foundations.' }
                        { autoplayMode === 'win' && 'Finishes the game automatically.' }
                    </div>
                </div>
            </GameFooter>
            <style>{`
                @keyframes deal-card-fly {
                    from { top: var(--from-top); left: var(--from-left); transform: rotate(0deg) scale(1); opacity: 1; }
                    to { top: var(--to-top); left: var(--to-left); transform: rotate(360deg) scale(1); opacity: 1; }
                }
                .deal-card { position: fixed; z-index: 200; opacity: 0; animation: deal-card-fly 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

                @keyframes shuffle-and-fade {
                    0%   { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 1; }
                    17%  { transform: translateX(-50%) scale(1.05) translateY(-20px) rotate(0deg); }
                    33%  { transform: translateX(-75%) scale(1.05) translateY(-20px) rotate(-10deg); }
                    50%  { transform: translateX(-25%) scale(1.05) translateY(-20px) rotate(10deg); }
                    67%  { transform: translateX(-50%) scale(1.05) translateY(-20px) rotate(0deg); }
                    83%  { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 1; }
                    100% { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 0; }
                }
                .perform-shuffle .initial-deck-visual { animation: shuffle-and-fade 0.8s ease-in-out forwards; }

                @keyframes return-card {
                    from { transform: translate(0, 0) scale(1.05) rotate(3deg); }
                    to { transform: translate(var(--translateX), var(--translateY)) scale(1) rotate(0deg); }
                }
                .return-animation { animation: return-card 0.3s ease-in-out forwards; }

                @keyframes auto-move {
                    0% { 
                        transform: translate(0, 0) scale(1) rotate(0); 
                        animation-timing-function: cubic-bezier(0.3, 0, 0.8, 0.5);
                    }
                    40% { 
                        transform: translate(calc(var(--translateX) * 0.4), calc(var(--translateY) * 0.4 - 40px)) scale(1.1) rotate(8deg); 
                        animation-timing-function: cubic-bezier(0.2, 0.5, 0.7, 1);
                    }
                    100% { 
                        transform: translate(var(--translateX), var(--translateY)) scale(1) rotate(0); 
                    }
                }
                .auto-move-card {
                    animation: auto-move 0.3s ease-out forwards;
                }
                
                .card-pressed {
                    transform: translateY(-8px) translateX(4px) rotate(3deg) scale(1.03);
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2);
                }
                @keyframes pulse-gold {
                    0% { box-shadow: 0 0 8px 3px rgba(255, 215, 0, 0.6); transform: scale(1.0) translateY(0); }
                    50% { box-shadow: 0 0 16px 6px rgba(255, 215, 0, 0.8); transform: scale(1.08) translateY(-4px); }
                    100% { box-shadow: 0 0 8px 3px rgba(255, 215, 0, 0.6); transform: scale(1.0) translateY(0); }
                }
                .card-hint {
                    animation: pulse-gold 1.5s infinite ease-in-out;
                }
                 @keyframes pop-out {
                    0% { transform: translate(0, 0) scale(0.5); opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(1.5); opacity: 0; }
                }
                .cute-star {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 14px;
                    height: 14px;
                    margin: -7px 0 0 -7px;
                    background: var(--color, #FFD700);
                    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                    animation: pop-out 0.7s ease-out forwards;
                    filter: drop-shadow(0 0 3px var(--color, #FFD700));
                }
            `}</style>
        </Board>
    );
};

export default FreecellGameBoard;

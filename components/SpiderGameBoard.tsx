


import React from 'react';
import type { SpiderController } from '../games/spider/useSpider';
import EmptyPile from './EmptyPile';
import WinModal from './WinModal';
import RulesModal from './RulesModal';
import PauseModal from './PauseModal';
import GameHeader from './GameHeader';
import GameFooter from './GameFooter';
import { Suit, Rank } from '../types';

interface SpiderGameBoardProps {
    controller: SpiderController;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
    layout: 'portrait' | 'landscape';
}

const SpiderGameBoard: React.FC<SpiderGameBoardProps> = ({ controller, onTitleClick, onSettingsClick, gameMenuButtonRef, layout }) => {
    const {
        Board, Card, stock, tableau, completedSets, history, isWon, isRulesModalOpen, shakeStock, pressedStack, hint, moves, time, isPaused, suitCount,
        cardSize, shuffleClass, isDealing, isAnimating, dealAnimationCards, animationData, returnAnimationData, stockAnimationData, completedSetAnimation, dragGhost, dragSourceInfo, hiddenCardIds,
        initializeGame, handleUndo, handleStockClick, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleAnimationEnd, handleReturnAnimationEnd,
        mainContainerRef, stockRef, tableauRefs, initialDeckRef, completedSetsRef, formatTime
    } = controller;

    const titleText = `Spider (${suitCount} Suit${suitCount > 1 ? 's' : ''})`;
    const tableauWidth = cardSize.width * 10 + 8 * 9; // 10 cards, 9 gaps of 8px (gap-2)

    return (
        <Board shuffleClass={shuffleClass}>
             {isWon && <WinModal onPlayAgain={initializeGame} />}
             {isRulesModalOpen && <RulesModal game="spider" onClose={() => setIsRulesModalOpen(false)} />}
             {isPaused && <PauseModal onResume={() => setIsPaused(false)} />}

             {dealAnimationCards.map(({ card, key, style }) => (
                <div key={key} className="deal-card" style={style}>
                    <Card card={card} width={cardSize.width} height={cardSize.height} />
                </div>
             ))}

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
            
            {stockAnimationData && stockRef.current && stockAnimationData.cards.map((cards, pileIndex) => {
                const card = cards[0];
                const toEl = tableauRefs.current[pileIndex];
                if (!toEl || !card) return null;
                
                const fromRect = stockRef.current.getBoundingClientRect();
                const toRect = toEl.getBoundingClientRect();
                const pile = tableau[pileIndex];
                const topOffset = pile.reduce((acc, c, idx) => {
                    if (idx === 0) return 0;
                    const prevCard = pile[idx - 1];
                    return acc + (prevCard.faceUp ? cardSize.faceUpStackOffset : cardSize.faceDownStackOffset);
                }, 0) + (pile.length > 0 ? cardSize.faceUpStackOffset : 0);


                return (
                    <div key={card.id} className="stock-deal-card" style={{
                        top: `${fromRect.top}px`,
                        left: `${fromRect.left}px`,
                        '--translateX': `${toRect.left - fromRect.left}px`,
                        '--translateY': `${toRect.top + topOffset - fromRect.top}px`,
                        '--delay': `${pileIndex * 25}ms`,
                         width: cardSize.width, height: cardSize.height,
                    } as React.CSSProperties}>
                        <Card card={card} width={cardSize.width} height={cardSize.height} />
                    </div>
                );
            })}
            
            {completedSetAnimation && completedSetAnimation.toRect && completedSetAnimation.cards.map((card, i) => {
                const fromRect = completedSetAnimation.fromRects[i];
                const toRect = completedSetAnimation.toRect;
                if (!fromRect) return null;
                return (
                    <div key={card.id} className="completed-set-card" style={{
                         position: 'fixed',
                         top: `${fromRect.top}px`,
                         left: `${fromRect.left}px`,
                         '--translateX': `${toRect.left + (completedSets * cardSize.width/4) - fromRect.left}px`,
                         '--translateY': `${toRect.top - fromRect.top}px`,
                         '--delay': `${i * 20}ms`,
                         width: cardSize.width, height: cardSize.height,
                         zIndex: 100 + i,
                    } as React.CSSProperties}>
                         <Card card={card} width={cardSize.width} height={cardSize.height} />
                    </div>
                )
            })}
            
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
                    <div style={{ position: 'relative', width: cardSize.width, height: cardSize.height }}>
                        {animationData.cards.map((card, index) => (
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
                    title={titleText}
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
                     <div style={{ width: `${tableauWidth}px` }} className="mx-auto">
                        <div className={`flex justify-between items-start gap-4 mb-4 transition-opacity duration-300 ${isDealing ? 'opacity-0' : 'opacity-100'}`}>
                            <div ref={stockRef} onClick={handleStockClick} className={`relative cursor-pointer ${shakeStock ? 'card-shake' : ''} ${hint?.type === 'stock' ? 'stock-hint' : ''}`}>
                                {stock.length > 0 ? (
                                    <>
                                        {Array.from({ length: Math.ceil(stock.length / 10) }).map((_, i) => (
                                            <div key={i} style={{ position: 'absolute', left: `${i * 10}px`, top: 0 }}>
                                                <Card card={{ id: -1 - i, suit: Suit.SPADES, rank: Rank.ACE, faceUp: false }} width={cardSize.width} height={cardSize.height} />
                                            </div>
                                        ))}
                                        <div style={{width: cardSize.width + (Math.ceil(stock.length/10)-1)*10, height: cardSize.height}} />
                                    </>
                                ) : <EmptyPile width={cardSize.width} height={cardSize.height} />}
                            </div>
                            <div ref={completedSetsRef} className="relative">
                                {completedSets > 0 ? (
                                    <>
                                        {Array.from({length: completedSets}).map((_, i) => (
                                            <div key={i} style={{ position: 'absolute', right: `${i * cardSize.width/4}px`, top: 0 }}>
                                                <Card card={{id: -100-i, suit: Suit.SPADES, rank: Rank.KING, faceUp: true}} width={cardSize.width} height={cardSize.height} />
                                            </div>
                                        ))}
                                        <div style={{width: cardSize.width + (completedSets-1)*(cardSize.width/4), height: cardSize.height}} />
                                    </>
                                ) : <EmptyPile width={cardSize.width} height={cardSize.height} />}
                            </div>
                        </div>
                        <div className="flex flex-nowrap gap-2">
                            {tableau.map((pile, pileIndex) => {
                                const pileHeight = pile.length > 0 ? 
                                    (pile.findIndex(c => c.faceUp) !== -1 ? (pile.findIndex(c => c.faceUp) * cardSize.faceDownStackOffset) : (pile.length - 1) * cardSize.faceDownStackOffset) +
                                    (pile.filter(c=>c.faceUp).length * cardSize.faceUpStackOffset) + 
                                    cardSize.height - cardSize.faceUpStackOffset
                                    : cardSize.height;
                                
                                return (
                                    <div key={pileIndex} className="relative" ref={el => { tableauRefs.current[pileIndex] = el; }} data-pile-id={`tableau-${pileIndex}`}>
                                        <EmptyPile width={cardSize.width} height={cardSize.height}/>
                                        <div style={{ position: 'absolute', top: 0, left: 0 }}>
                                        {pile.map((card, cardIndex) => {
                                                const isCardDragging = !!dragSourceInfo?.cards.some(c => c.id === card.id);
                                                const isCardPressed = !!pressedStack && 
                                                    pressedStack.sourcePileIndex === pileIndex &&
                                                    cardIndex >= pressedStack.sourceCardIndex;
                                                
                                                const topOffset = pile.slice(0, cardIndex).reduce((acc, c) => acc + (c.faceUp ? cardSize.faceUpStackOffset : cardSize.faceDownStackOffset), 0);
                                                
                                                return (hiddenCardIds.includes(card.id)) ?
                                                <div key={card.id} style={{ position: 'absolute', top: `${topOffset}px`, left: 0, width: cardSize.width, height: cardSize.height }} /> :
                                                <Card
                                                    key={card.id}
                                                    card={card}
                                                    onMouseDown={(e) => handleMouseDown(e, 'tableau', pileIndex, cardIndex)}
                                                    width={cardSize.width} height={cardSize.height}
                                                    style={{ position: 'absolute', top: `${topOffset}px`, left: 0, zIndex: cardIndex + (isCardPressed ? 20 : 0) }}
                                                    isDragging={isCardDragging}
                                                    isPressed={isCardPressed}
                                                    isHinted={hint?.type === 'card' && hint.cardId === card.id}
                                                />
                                            })
                                        }
                                        </div>
                                        <div style={{ height: `${pileHeight}px`, width: `${cardSize.width}px` }}></div>
                                    </div>
                                );
                            })}
                        </div>
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
                isHintDisabled={isDealing || isPaused || isAnimating}
                isDealing={isDealing}
                layout={layout}
            />
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
                
                @keyframes auto-move {
                    0% { transform: translate(0, 0) scale(1) rotate(0); animation-timing-function: cubic-bezier(0.3, 0, 0.8, 0.5); }
                    40% { transform: translate(calc(var(--translateX) * 0.4), calc(var(--translateY) * 0.4 - 40px)) scale(1.1) rotate(8deg); animation-timing-function: cubic-bezier(0.2, 0.5, 0.7, 1); }
                    100% { transform: translate(var(--translateX), var(--translateY)) scale(1) rotate(0); }
                }
                .auto-move-card { animation: auto-move 0.5s ease-out forwards; }
                
                @keyframes stock-deal-fly {
                    from { transform: translate(0,0) rotateY(180deg); }
                    to { transform: translate(var(--translateX), var(--translateY)) rotateY(0deg); }
                }
                .stock-deal-card { position: fixed; z-index: 150; animation: stock-deal-fly 0.5s ease-out forwards; animation-delay: var(--delay); }

                @keyframes completed-set-fly {
                     from { transform: translate(0,0) scale(1); opacity: 1; }
                     to { transform: translate(var(--translateX), var(--translateY)) scale(0.8); opacity: 1; }
                }
                .completed-set-card { animation: completed-set-fly 0.5s ease-in-out forwards; animation-delay: var(--delay); }
                
                @keyframes return-card {
                    from { transform: translate(0, 0) scale(1.05) rotate(3deg); }
                    to { transform: translate(var(--translateX), var(--translateY)) scale(1) rotate(0deg); }
                }
                .return-animation { animation: return-card 0.3s ease-in-out forwards; }

                @keyframes card-shake {
                    10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); }
                    30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); }
                }
                .card-shake { animation: card-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
                .card-pressed { transform: translateY(-8px) translateX(4px) rotate(3deg) scale(1.03); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2); }
                
                @keyframes pulse-gold {
                    0% { box-shadow: 0 0 8px 3px rgba(255, 215, 0, 0.6); transform: scale(1.0) translateY(0); }
                    50% { box-shadow: 0 0 16px 6px rgba(255, 215, 0, 0.8); transform: scale(1.08) translateY(-4px); }
                    100% { box-shadow: 0 0 8px 3px rgba(255, 215, 0, 0.6); transform: scale(1.0) translateY(0); }
                }
                .card-hint { animation: pulse-gold 1.5s infinite ease-in-out; }
                .stock-hint {
                    border-radius: 0.5rem;
                    animation: pulse-gold 1.5s infinite ease-in-out;
                }
            `}</style>
        </Board>
    );
};

export default SpiderGameBoard;

import React from 'react';
import type { SpiderController } from '../games/spider/useSpider';
import EmptyPile from './EmptyPile';
import WinModal from './WinModal';
import RulesModal from './RulesModal';
import PauseModal from './PauseModal';
import { Suit, Rank } from '../types';

interface SpiderGameBoardProps {
    controller: SpiderController;
    onTitleClick: () => void;
    onSettingsClick: () => void;
}

const SpiderGameBoard: React.FC<SpiderGameBoardProps> = ({ controller, onTitleClick, onSettingsClick }) => {
    const {
        Board, Card, stock, tableau, completedSets, history, isWon, isRulesModalOpen, shakeStock, pressedStack, hint, moves, time, isPaused, suitCount,
        cardSize, shuffleClass, isDealing, dealAnimationCards, animationData, returnAnimationData, stockAnimationData, completedSetAnimation, dragGhost, dragSourceInfo, hiddenCardIds,
        initializeGame, handleUndo, handleStockClick, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleAnimationEnd, handleReturnAnimationEnd,
        mainContainerRef, stockRef, tableauRefs, initialDeckRef, completedSetsRef, formatTime
    } = controller;
    
    const buttonClasses = "bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed";
    const iconButtonClasses = "bg-green-700 hover:bg-green-600 text-white font-bold p-2 rounded-lg transition duration-200 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed";

    const titleText = `Spider (${suitCount} Suit${suitCount > 1 ? 's' : ''})`;

    return (
        <Board shuffleClass={shuffleClass}>
             {isWon && <WinModal onPlayAgain={initializeGame} />}
             {isRulesModalOpen && <RulesModal onClose={() => setIsRulesModalOpen(false)} />}
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

            <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
                <header className={`flex flex-wrap justify-between items-center gap-4 mb-4 transition-opacity duration-300 ${isDealing ? 'opacity-0' : 'opacity-100'}`}>
                    <h1 onClick={onTitleClick} className="text-3xl sm:text-4xl font-bold tracking-wider cursor-pointer hover:text-green-300 transition-colors">{titleText}</h1>
                     <div className="flex-grow flex justify-center items-center flex-wrap gap-x-6 gap-y-2">
                        <button onClick={handleUndo} disabled={history.length === 0} className={buttonClasses}>Undo</button>
                        <div className="flex items-center gap-2 text-lg font-semibold tabular-nums">
                            <span>Time: <span className="font-mono">{formatTime(time)}</span></span>
                            <button onClick={() => setIsPaused(true)} className="text-yellow-400 hover:text-yellow-300" aria-label="Pause game">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 6a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                               </svg>
                            </button>
                            <span>Moves: {moves}</span>
                        </div>
                    </div>
                    <div className="w-24 hidden sm:block"></div>
                </header>
                
                <main ref={mainContainerRef} className="pt-4 flex-grow">
                     <div className="flex flex-nowrap gap-2 justify-center">
                        {tableau.map((pile, pileIndex) => {
                            const pileHeight = pile.length > 0 ? 
                                (pile.findIndex(c => c.faceUp) !== -1 ? (pile.findIndex(c => c.faceUp) * cardSize.faceDownStackOffset) : (pile.length - 1) * cardSize.faceDownStackOffset) +
                                (pile.filter(c=>c.faceUp).length * cardSize.faceUpStackOffset) + 
                                cardSize.height - cardSize.faceUpStackOffset
                                : cardSize.height;
                            
                            return (
                                <div key={pileIndex} className="relative" ref={el => { tableauRefs.current[pileIndex] = el; }}>
                                    <EmptyPile width={cardSize.width} height={cardSize.height}/>
                                    <div style={{ position: 'absolute', top: 0, left: 0 }}>
                                    {pile.map((card, cardIndex) => {
                                            const isCardDragging = !!dragSourceInfo && dragSourceInfo.cards.some(c => c.id === card.id);
                                            const isCardPressed = !!pressedStack && 
                                                pressedStack.sourcePileIndex === pileIndex &&
                                                cardIndex >= pressedStack.sourceCardIndex;
                                            
                                            const topOffset = pile.slice(0, cardIndex).reduce((acc, c) => acc + (c.faceUp ? cardSize.faceUpStackOffset : cardSize.faceDownStackOffset), 0);
                                            
                                            return (hiddenCardIds.includes(card.id)) ?
                                            <div key={card.id} style={{ position: 'absolute', top: `${topOffset}px`, left: 0, width: cardSize.width, height: cardSize.height }} /> :
                                            <Card
                                                key={card.id}
                                                card={card}
                                                onMouseDown={(e) => handleMouseDown(e, pileIndex, cardIndex)}
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
                </main>
            </div>
             <footer className={`w-full flex justify-between items-center gap-4 mt-auto p-4 transition-opacity duration-300 ${isDealing ? 'opacity-0' : 'opacity-100'}`}>
                <div className="flex gap-4">
                    <button onClick={initializeGame} className={buttonClasses.replace('bg-green-700 hover:bg-green-600', 'bg-blue-600 hover:bg-blue-500')}>New Game</button>
                    <button onClick={handleHint} className={buttonClasses}>Hint</button>
                    <button onClick={() => setIsRulesModalOpen(true)} className={buttonClasses}>Rules</button>
                    <button onClick={onSettingsClick} className={iconButtonClasses} aria-label="Settings">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                       </svg>
                    </button>
                </div>
                
                <div className="flex items-center gap-4">
                     <div ref={stockRef} onClick={handleStockClick} className={`relative cursor-pointer ${shakeStock ? 'card-shake' : ''} ${hint?.type === 'stock' ? 'stock-hint' : ''}`}>
                        {stock.length > 0 ? (
                            Array.from({ length: Math.ceil(stock.length / 10) }).map((_, i) => (
                                <div key={i} style={{ position: 'absolute', right: `${i * 10}px`, bottom: 0 }}>
                                    <Card card={{ id: -1 - i, suit: Suit.SPADES, rank: Rank.ACE, faceUp: false }} width={cardSize.width} height={cardSize.height} />
                                </div>
                            ))
                        ) : <EmptyPile width={cardSize.width} height={cardSize.height} />}
                        <div style={{width: cardSize.width + (Math.ceil(stock.length/10)-1)*10, height: cardSize.height}} />
                    </div>
                    <div ref={completedSetsRef} className="relative">
                        {completedSets > 0 ? (
                            Array.from({length: completedSets}).map((_, i) => (
                                <div key={i} style={{ position: 'absolute', left: `${i * cardSize.width/4}px`, bottom: 0 }}>
                                    <Card card={{id: -100-i, suit: Suit.SPADES, rank: Rank.KING, faceUp: true}} width={cardSize.width} height={cardSize.height} />
                                </div>
                            ))
                        ) : <EmptyPile width={cardSize.width} height={cardSize.height} />}
                        <div style={{width: cardSize.width + (completedSets-1)*(cardSize.width/4), height: cardSize.height}} />
                    </div>
                </div>
            </footer>
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

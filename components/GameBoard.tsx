
import React from 'react';
import type { KlondikeController } from '../games/klondike/useKlondike';
import EmptyPile from './EmptyPile';
import WinModal from './WinModal';
import RulesModal from './RulesModal';
import PauseModal from './PauseModal';
import GameHeader from './GameHeader';
import GameFooter from './GameFooter';
import { Suit, Rank } from '../types';
import { SUITS, SUIT_COLOR_MAP, SUIT_SYMBOL_MAP } from '../constants';


interface GameBoardProps {
    controller: KlondikeController;
    onTitleClick: () => void;
    onSettingsClick: () => void;
    gameMenuButtonRef: React.RefObject<HTMLButtonElement>;
    layout: 'portrait' | 'landscape';
}

const GameBoard: React.FC<GameBoardProps> = ({ controller, onTitleClick, onSettingsClick, gameMenuButtonRef, layout }) => {
    const {
        Board, Card, stock, waste, foundations, tableau, history, isWon, isRulesModalOpen, shakeCardId, pressedStack, hint, moves, time, isPaused, turnMode, autoplayMode,
        cardSize, shuffleClass, isDealing, dealAnimationCards, animationData, returnAnimationData, stockAnimationData, dragGhost, dragSourceInfo, hiddenCardIds, foundationFx,
        initializeGame, handleUndo, handleTurnModeToggle, handleAutoplayModeToggle, handleStockClick, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleAnimationEnd, handleReturnAnimationEnd,
        mainContainerRef, stockRef, wasteRef, foundationRefs, tableauRefs, initialDeckRef, formatTime
    } = controller;
    
    const renderCommonOverlays = () => (
        <>
            {isWon && <WinModal onPlayAgain={initializeGame} />}
            {isRulesModalOpen && <RulesModal game="klondike" onClose={() => setIsRulesModalOpen(false)} />}
            {isPaused && <PauseModal onResume={() => setIsPaused(false)} />}
        </>
    );

    const renderCommonAnimations = () => (
        <>
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
            
            {stockAnimationData?.type === 'turn' && stockAnimationData.cards.map((card, i) => {
                const fromRect = stockRef.current?.getBoundingClientRect();
                const toRect = wasteRef.current?.getBoundingClientRect();
                if (!fromRect || !toRect) return null;

                const drawnCardsCount = stockAnimationData.cards.length;
                const cardDrawIndex = drawnCardsCount - 1 - i; 

                const wasteCountAfter = stockAnimationData.wasteCountBefore + drawnCardsCount;
                const visibleWasteCount = Math.min(3, wasteCountAfter);

                const finalVisibleIndex = visibleWasteCount - 1 - cardDrawIndex;

                const offset = finalVisibleIndex >= 0 ? finalVisibleIndex * 12 : 0;
                
                const translateX = toRect.left + offset - fromRect.left;
                const translateY = toRect.top - fromRect.top;

                return (
                    <div key={card.id} className="stock-turn-card" style={{
                        top: `${fromRect.top}px`,
                        left: `${fromRect.left}px`,
                        '--translateX': `${translateX}px`,
                        '--translateY': `${translateY}px`,
                        '--delay': `${i * 75}ms`,
                         width: cardSize.width, height: cardSize.height,
                    } as React.CSSProperties}>
                        <div className="card-flipper">
                            <div className="flipper-back">
                                <Card card={card} width={cardSize.width} height={cardSize.height} />
                            </div>
                            <div className="flipper-front">
                                <Card card={{...card, faceUp: true}} width={cardSize.width} height={cardSize.height} />
                            </div>
                        </div>
                    </div>
                );
            })}

            {stockAnimationData?.type === 'reset' && stockAnimationData.cards.map((card, i) => {
                const fromRect = wasteRef.current?.getBoundingClientRect();
                const toRect = stockRef.current?.getBoundingClientRect();
                if (!fromRect || !toRect) return null;

                const numWasteCards = stockAnimationData.cards.length;
                const cardIndexInWaste = numWasteCards - 1 - i;
                const stackIndex = Math.min(2, cardIndexInWaste);
                const offset = stackIndex * 12;

                const translateX = toRect.left - (fromRect.left + offset);
                const translateY = toRect.top - fromRect.top;

                return (
                    <div key={card.id} className="waste-reset-card" style={{
                        top: `${fromRect.top}px`,
                        left: `${fromRect.left + offset}px`,
                        '--translateX': `${translateX}px`,
                        '--translateY': `${translateY}px`,
                        '--delay': `${(numWasteCards - 1 - i) * 20}ms`,
                         width: cardSize.width, height: cardSize.height,
                    } as React.CSSProperties}>
                        <div className="card-flipper">
                             <div className="flipper-back">
                                <Card card={{...card, faceUp: false}} width={cardSize.width} height={cardSize.height} />
                            </div>
                            <div className="flipper-front">
                                <Card card={card} width={cardSize.width} height={cardSize.height} />
                            </div>
                        </div>
                    </div>
                );
            })}


             {animationData && (
                 <div
                    className={animationData ? 'auto-move-card' : ''}
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
        </>
    );

    const renderTableau = () => (
        <div className={`flex flex-nowrap justify-center ${layout === 'landscape' ? 'gap-4' : 'gap-2'}`}>
            {tableau.map((pile, pileIndex) => {
                const cardTops = pile.reduce((acc: number[], _card, index) => {
                    if (index === 0) acc.push(0);
                    else {
                        const prevCard = pile[index-1];
                        acc.push(acc[index-1] + (prevCard.faceUp ? cardSize.faceUpStackOffset : cardSize.faceDownStackOffset));
                    }
                    return acc;
                }, []);
                const pileHeight = pile.length > 0 ? cardTops[pile.length - 1] + cardSize.height : cardSize.height;
                const areAllCardsInPileDragging = 
                    dragSourceInfo?.source === 'tableau' && 
                    dragSourceInfo.sourcePileIndex === pileIndex && 
                    dragSourceInfo.cards.length === pile.length;

                return (
                    <div key={pileIndex} className="relative" ref={el => { tableauRefs.current[pileIndex] = el; }} data-pile-id={`tableau-${pileIndex}`}>
                        {(pile.length === 0 || areAllCardsInPileDragging) ? <EmptyPile width={cardSize.width} height={cardSize.height}/> :
                            pile.map((card, cardIndex) => {
                                const isCardDragging = !!dragSourceInfo?.cards.some(c => c.id === card.id);
                                const isCardPressed = !!pressedStack && 
                                    pressedStack.source === 'tableau' && 
                                    pressedStack.sourcePileIndex === pileIndex &&
                                    cardIndex >= pressedStack.sourceCardIndex;
                                
                                return (hiddenCardIds.includes(card.id)) ?
                                <div key={card.id} style={{ position: 'absolute', top: `${cardTops[cardIndex]}px`, left: 0, width: cardSize.width, height: cardSize.height }} /> :
                                <Card
                                    key={card.id}
                                    card={card}
                                    onMouseDown={(e) => handleMouseDown(e, 'tableau', pileIndex, cardIndex)}
                                    width={cardSize.width} height={cardSize.height}
                                    style={{ position: 'absolute', top: `${cardTops[cardIndex]}px`, left: 0, zIndex: cardIndex + (isCardPressed ? 20 : 0) }}
                                    isDragging={isCardDragging}
                                    isShaking={shakeCardId === card.id}
                                    isPressed={isCardPressed}
                                    isHinted={hint?.type === 'card' && hint.cardId === card.id}
                                />
                            })
                        }
                        <div style={{ height: `${pileHeight}px`, width: `${cardSize.width}px` }}></div>
                    </div>
                );
            })}
        </div>
    );

    const renderFoundations = () => (
        <div className={`flex ${layout === 'landscape' ? 'gap-4' : 'gap-2'}`}>
            {foundations.map((pile, i) => {
                const isTopCardDragging = dragSourceInfo?.source === 'foundation' && dragSourceInfo.sourcePileIndex === i;
                const isTopCardPressed = !!pressedStack && pressedStack.source === 'foundation' && pressedStack.sourcePileIndex === i;
                const topCard = pile[pile.length - 1];
                return (
                    <div key={i} ref={el => { foundationRefs.current[i] = el; }} className="relative" style={{ width: cardSize.width, height: cardSize.height }}>
                        {(pile.length === 0 || (pile.length === 1 && isTopCardDragging)) &&
                            <EmptyPile width={cardSize.width} height={cardSize.height}>
                                <div className={`text-5xl ${SUIT_COLOR_MAP[SUITS[i]] === 'red' ? 'text-red-400/60' : 'text-white/30'} font-thin`}>
                                    {SUIT_SYMBOL_MAP[SUITS[i]]}
                                </div>
                            </EmptyPile>
                        }
                        {pile.length > 1 && isTopCardDragging &&
                            <Card card={pile[pile.length - 2]} width={cardSize.width} height={cardSize.height}/>
                        }

                        {topCard && 
                            <div className="absolute top-0 left-0">
                                <Card 
                                    card={topCard} 
                                    onMouseDown={(e) => handleMouseDown(e, 'foundation', i, pile.length - 1)} 
                                    width={cardSize.width} 
                                    height={cardSize.height}
                                    isDragging={isTopCardDragging}
                                    isPressed={isTopCardPressed}
                                    isHinted={hint?.type === 'card' && hint.cardId === topCard.id}
                                />
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
                                {Array.from({ length: 5 }).map((_, j) => {
                                    const angle = (Math.random() - 0.5) * (Math.PI / 2);
                                    const radius = 40 + Math.random() * 30;
                                    return (
                                        <div
                                            key={`heart-${j}`}
                                            className="heart-particle"
                                            style={{
                                                '--tx': `${Math.sin(angle) * radius}px`,
                                                '--ty': `${-Math.cos(angle) * radius}px`,
                                                'animationDelay': `${Math.random() * 0.25}s`,
                                            } as React.CSSProperties}
                                        >
                                            ♥
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
    
    return (
        <Board shuffleClass={shuffleClass}>
             {renderCommonOverlays()}
             {renderCommonAnimations()}

             <div className="max-w-7xl mx-auto w-full flex-shrink-0 px-2 sm:px-4">
                <GameHeader
                    title="Klondike"
                    time={time}
                    moves={moves}
                    isDealing={isDealing}
                    onTitleClick={onTitleClick}
                    onPauseClick={() => setIsPaused(true)}
                    formatTime={formatTime}
                    gameMenuButtonRef={gameMenuButtonRef}
                    layout={layout}
                >
                    {layout === 'landscape' && (
                        <div className="flex-grow flex justify-center items-center flex-wrap gap-x-6 gap-y-2">
                            <div className="relative group">
                                <button onClick={handleTurnModeToggle} className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">Turn: {turnMode}</button>
                                <div className="absolute top-full mt-2 w-48 bg-black/80 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center left-1/2 -translate-x-1/2 z-20">
                                    Toggle between drawing 1 or 3 cards from the stock.
                                </div>
                            </div>
                        </div>
                    )}
                </GameHeader>
            </div>
            
            {layout === 'landscape' ? (
                <div className="w-full flex-1 overflow-y-auto min-h-0">
                    <main ref={mainContainerRef} className="max-w-7xl mx-auto w-full pt-4 pb-4 px-2 sm:px-4">
                        <div className="flex flex-wrap justify-between gap-4 mb-8">
                            <div className="flex gap-4">
                                <div ref={stockRef} onClick={handleStockClick} className={`cursor-pointer ${hint?.type === 'stock' ? 'stock-hint' : ''}`}>
                                    {stock.length > 0 ? <Card card={stock[stock.length - 1]} width={cardSize.width} height={cardSize.height} /> : <EmptyPile width={cardSize.width} height={cardSize.height}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5V4H4zm0 12v5h5v-5H4zM15 4v5h5V4h-5zm0 12v5h5v-5h-5z" /></svg>
                                    </EmptyPile>}
                                </div>
                                <div ref={wasteRef} className="relative" style={{ width: cardSize.width, height: cardSize.height }}>
                                    <EmptyPile width={cardSize.width} height={cardSize.height}/>
                                    {(() => {
                                        const stationaryWasteCards = waste.filter(c => !hiddenCardIds.includes(c.id));
                                        const displayableWaste = stationaryWasteCards.slice(0, 3);
                                        const trueTopCard = waste[0];

                                        return displayableWaste.map((card, index) => {
                                            const isInteractive = card.id === trueTopCard?.id;
                                            const offset = (displayableWaste.length - 1 - index) * 12;
                                            const isPressed = !!pressedStack && pressedStack.source === 'waste' && pressedStack.sourcePileIndex === 0;

                                            return (
                                                <div key={card.id} className="absolute top-0" style={{left: `${offset}px`}}>
                                                    <Card 
                                                        card={card} 
                                                        onMouseDown={(e) => isInteractive && handleMouseDown(e, 'waste', 0, 0)}
                                                        width={cardSize.width} 
                                                        height={cardSize.height}
                                                        isDragging={isInteractive && dragSourceInfo?.source === 'waste'}
                                                        isPressed={isPressed}
                                                        isHinted={hint?.type === 'card' && hint.cardId === card.id}
                                                    />
                                                </div>
                                            );
                                        }).reverse();
                                    })()}
                                </div>
                            </div>
                            {renderFoundations()}
                        </div>
                        {renderTableau()}
                    </main>
                </div>
            ) : ( // Portrait Layout
                <main ref={mainContainerRef} className="w-full flex-1 min-h-0 flex flex-col pt-2 pb-4 px-2">
                    <div className="flex justify-between">
                        <div className="flex gap-2">
                            <div ref={stockRef} onClick={handleStockClick} className={`cursor-pointer ${hint?.type === 'stock' ? 'stock-hint' : ''}`}>
                                {stock.length > 0 ? <Card card={stock[stock.length - 1]} width={cardSize.width} height={cardSize.height} /> : <EmptyPile width={cardSize.width} height={cardSize.height} />}
                            </div>
                            <div ref={wasteRef} className="relative" style={{ width: cardSize.width, height: cardSize.height }}>
                                <EmptyPile width={cardSize.width} height={cardSize.height}/>
                                {waste.slice(0,1).map(card => (
                                    <div key={card.id} className="absolute top-0 left-0">
                                        <Card 
                                            card={card} 
                                            onMouseDown={(e) => handleMouseDown(e, 'waste', 0, 0)}
                                            width={cardSize.width} 
                                            height={cardSize.height}
                                            isDragging={dragSourceInfo?.source === 'waste'}
                                            isPressed={!!pressedStack && pressedStack.source === 'waste'}
                                            isHinted={hint?.type === 'card' && hint.cardId === card.id}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {renderFoundations()}
                    </div>
                    <div className="flex-1 w-full overflow-x-auto overflow-y-hidden min-h-0 pt-4">
                        {renderTableau()}
                    </div>
                </main>
            )}

            <GameFooter
                layout={layout}
                onNewGame={initializeGame}
                onUndo={handleUndo}
                onHint={handleHint}
                onRules={() => setIsRulesModalOpen(true)}
                onSettings={onSettingsClick}
                isUndoDisabled={history.length === 0}
                isHintDisabled={isDealing || isPaused || !!stockAnimationData || !!animationData}
                isDealing={isDealing}
            >
                <div className="relative group">
                    <button onClick={handleAutoplayModeToggle} className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
                        Autoplay: <span className="capitalize">{autoplayMode}</span>
                    </button>
                    <div className="absolute bottom-full mb-2 w-60 bg-black/80 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center left-1/2 -translate-x-1/2 z-20">
                        { autoplayMode === 'off' && 'Off: No automatic moves.' }
                        { autoplayMode === 'obvious' && 'Obvious: Automatically moves cards to the foundations.' }
                        { autoplayMode === 'won' && 'Finishes the game automatically when all cards are face up.' }
                    </div>
                </div>
            </GameFooter>
            <style>{`
                @keyframes deal-card-fly {
                    from {
                        top: var(--from-top);
                        left: var(--from-left);
                        transform: rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    to {
                        top: var(--to-top);
                        left: var(--to-left);
                        transform: rotate(360deg) scale(1);
                        opacity: 1;
                    }
                }
                .deal-card {
                    position: fixed;
                    z-index: 200;
                    opacity: 0;
                    animation: deal-card-fly 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }

                @keyframes shuffle-and-fade {
                    0%   { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 1; }
                    17%  { transform: translateX(-50%) scale(1.05) translateY(-20px) rotate(0deg); }
                    33%  { transform: translateX(-75%) scale(1.05) translateY(-20px) rotate(-10deg); }
                    50%  { transform: translateX(-25%) scale(1.05) translateY(-20px) rotate(10deg); }
                    67%  { transform: translateX(-50%) scale(1.05) translateY(-20px) rotate(0deg); }
                    83%  { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 1; }
                    100% { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 0; }
                }
                .perform-shuffle .initial-deck-visual {
                    animation: shuffle-and-fade 0.8s ease-in-out forwards;
                }
                
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
                
                @keyframes return-card {
                    from {
                        transform: translate(0, 0) scale(1.05) rotate(3deg);
                    }
                    to {
                        transform: translate(var(--translateX), var(--translateY)) scale(1) rotate(0deg);
                    }
                }
                .return-animation {
                    animation: return-card 0.3s ease-in-out forwards;
                }

                @keyframes card-shake {
                    10%, 90% { transform: translateX(-1px); }
                    20%, 80% { transform: translateX(2px); }
                    30%, 50%, 70% { transform: translateX(-4px); }
                    40%, 60% { transform: translateX(4px); }
                }
                .card-shake {
                    animation: card-shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
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
                .stock-hint > div {
                    animation: pulse-gold 1.5s infinite ease-in-out;
                    border-radius: 0.5rem;
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

                @keyframes heart-celebrate {
                    0% {
                        transform: translate(0, 0) scale(0.6);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(var(--tx), var(--ty)) scale(1.3);
                        opacity: 0;
                    }
                }
                .heart-particle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    font-size: 2rem;
                    font-weight: bold;
                    color: #ef4444;
                    text-shadow: 0 0 5px rgba(255,255,255,0.7);
                    animation: heart-celebrate 0.8s ease-out forwards;
                }


                @keyframes stock-turn-move {
                    from {
                        transform: translate(0, 0) rotate(5deg) scale(1.05);
                        z-index: 201;
                    }
                    to {
                        transform: translate(var(--translateX), var(--translateY)) rotate(0deg) scale(1);
                        z-index: 200;
                    }
                }
                @keyframes stock-turn-flip {
                    from { transform: rotateY(0deg); }
                    to { transform: rotateY(180deg); }
                }
                .stock-turn-card {
                    position: fixed;
                    animation: stock-turn-move 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    animation-delay: var(--delay);
                }
                .stock-turn-card .card-flipper {
                    animation: stock-turn-flip 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    animation-delay: var(--delay);
                }
                
                @keyframes waste-reset-move {
                    from {
                        transform: translate(0, 0) rotate(-5deg) scale(1.05);
                        z-index: 201;
                    }
                    to {
                        transform: translate(var(--translateX), var(--translateY)) rotate(0deg) scale(1);
                        z-index: 200;
                    }
                }
                @keyframes waste-reset-flip {
                    from { transform: rotateY(180deg); }
                    to { transform: rotateY(0deg); }
                }
                .waste-reset-card {
                    position: fixed;
                    animation: waste-reset-move 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    animation-delay: var(--delay);
                }
                .waste-reset-card .card-flipper {
                    animation: waste-reset-flip 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    animation-delay: var(--delay);
                }

                .card-flipper {
                    width: 100%; height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                }
                .flipper-front, .flipper-back {
                    position: absolute; width: 100%; height: 100%;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                }
                .flipper-front {
                    transform: rotateY(180deg);
                }
            `}</style>
        </Board>
    );
};

export default GameBoard;

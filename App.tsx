import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardType, DragInfo, GameState } from './types';
import { Suit, Rank } from './types';
import { SUITS, RANKS, RANK_VALUE_MAP, SUIT_COLOR_MAP, CARD_ASPECT_RATIO, SUIT_SYMBOL_MAP } from './constants';
import Card from './components/Card';
import EmptyPile from './components/EmptyPile';
import WinModal from './components/WinModal';
import RulesModal from './components/RulesModal';
import PauseModal from './components/PauseModal';


type AnimationState = {
  card: CardType;
  fromRect: DOMRect;
  toRect: DOMRect;
  destinationType: 'tableau' | 'foundation';
  destinationIndex: number;
  source: 'tableau' | 'waste';
  sourcePileIndex: number;
  sourceCardIndex: number;
} | null;

type DragGhostState = {
    cards: CardType[];
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
} | null;

type InteractionState = {
    startX: number;
    startY: number;
    cards: CardType[];
    source: 'tableau' | 'waste' | 'foundation';
    sourcePileIndex: number;
    sourceCardIndex: number;
    element: HTMLDivElement;
} | null;


const App: React.FC = () => {
    // Core Game State
    const [stock, setStock] = useState<CardType[]>([]);
    const [waste, setWaste] = useState<CardType[]>([]);
    const [foundations, setFoundations] = useState<CardType[][]>([[], [], [], []]);
    const [tableau, setTableau] = useState<CardType[][]>([[], [], [], [], [], [], []]);
    const [history, setHistory] = useState<GameState[]>([]);

    // UI & Interaction State
    const [dragSourceInfo, setDragSourceInfo] = useState<DragInfo>(null);
    const [dragGhost, setDragGhost] = useState<DragGhostState>(null);
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    const [isWon, setIsWon] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [shakeCardId, setShakeCardId] = useState<number | null>(null);
    const [pressedStack, setPressedStack] = useState<{ source: 'tableau' | 'waste' | 'foundation', sourcePileIndex: number, sourceCardIndex: number } | null>(null);

    // Gameplay Stats & Settings
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [turnMode, setTurnMode] = useState<1 | 3>(3);

    // Responsive Sizing
    const [cardSize, setCardSize] = useState({ width: 100, height: 140, faceUpStackOffset: 28, faceDownStackOffset: 12 });
    const mainContainerRef = useRef<HTMLElement>(null);

    // Animation state
    const [animationData, setAnimationData] = useState<AnimationState>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hiddenForAnimation, setHiddenForAnimation] = useState<CardType | null>(null);
    const animationEndHandled = useRef(false);

    // Refs for positions
    const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);
    const wasteRef = useRef<HTMLDivElement | null>(null);

    const updateCardSize = useCallback(() => {
        if (!mainContainerRef.current) return;

        const containerWidth = mainContainerRef.current.clientWidth;
        const numPiles = 7;
        const gap = 16;
        const minCardWidth = 60;
        const maxCardWidth = 100;

        const totalGapWidth = (numPiles - 1) * gap;
        let newCardWidth = (containerWidth - totalGapWidth) / numPiles;
        
        newCardWidth = Math.max(minCardWidth, Math.min(newCardWidth, maxCardWidth));
        const newCardHeight = newCardWidth * CARD_ASPECT_RATIO;

        setCardSize({
            width: newCardWidth,
            height: newCardHeight,
            faceUpStackOffset: newCardHeight / 5.0,
            faceDownStackOffset: newCardHeight / 12,
        });
    }, []);

    useEffect(() => {
        updateCardSize();
        window.addEventListener('resize', updateCardSize);
        return () => window.removeEventListener('resize', updateCardSize);
    }, [updateCardSize]);


    const initializeGame = useCallback(() => {
        let cardId = 0;
        const fullDeck = SUITS.flatMap(suit => 
            RANKS.map(rank => ({ 
                id: cardId++, 
                suit, 
                rank, 
                faceUp: false 
            }))
        );

        for (let i = fullDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }

        const newTableau: CardType[][] = Array.from({ length: 7 }, (_, i) => fullDeck.splice(0, i + 1));
        
        newTableau.forEach((pile, pileIndex) => {
            if (pile.length > 0) {
                const lastCardIndex = pile.length - 1;
                newTableau[pileIndex][lastCardIndex] = { ...pile[lastCardIndex], faceUp: true };
            }
        });

        setTableau(newTableau);
        setStock(fullDeck);
        setWaste([]);
        setFoundations([[], [], [], []]);
        setIsWon(false);
        setDragSourceInfo(null);
        setDragGhost(null);
        setInteractionState(null);
        setIsRulesModalOpen(false);
        setAnimationData(null);
        setIsAnimating(false);
        setHiddenForAnimation(null);
        setPressedStack(null);
        setMoves(0);
        setTime(0);
        setHistory([]);
        setIsPaused(false);
    }, []);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    useEffect(() => {
        if (foundations.flat().length === 52) {
            setIsWon(true);
        }
    }, [foundations]);

    useEffect(() => {
        if (isPaused || isWon || isAnimating) {
            return;
        }
        const timerId = setInterval(() => {
            setTime(prevTime => prevTime + 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [isPaused, isWon, isAnimating]);

    const saveStateToHistory = () => {
        setHistory(prev => [...prev, { stock, waste, foundations, tableau, moves }]);
    };
    
    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setStock(lastState.stock);
        setWaste(lastState.waste);
        setFoundations(lastState.foundations);
        setTableau(lastState.tableau);
        setMoves(lastState.moves);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleTurnModeToggle = () => {
        setTurnMode(prev => (prev === 1 ? 3 : 1));
    };

    const handleStockClick = () => {
        if (isAnimating || isPaused) return;
        if (stock.length === 0 && waste.length === 0) return;

        saveStateToHistory();
        setMoves(prev => prev + 1);

        if (stock.length > 0) {
            const cardsToDraw = Math.min(stock.length, turnMode);
            const drawnCards = stock.slice(-cardsToDraw).map(c => ({ ...c, faceUp: true })).reverse();
            setWaste(prevWaste => [...drawnCards, ...prevWaste]);
            setStock(prevStock => prevStock.slice(0, prevStock.length - cardsToDraw));
        } else {
            const newStock = [...waste].reverse().map(c => ({ ...c, faceUp: false }));
            setStock(newStock);
            setWaste([]);
        }
    };
    
    // Custom Click and Drag Logic
    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        cards: CardType[],
        source: 'tableau' | 'waste' | 'foundation',
        sourcePileIndex: number,
        sourceCardIndex: number
    ) => {
        if (isAnimating || isPaused || e.button !== 0 || (cards.length > 0 && !cards[0].faceUp)) return;
        e.preventDefault();

        if (cards.length > 0) {
            setPressedStack({ source, sourcePileIndex, sourceCardIndex });
        }

        setInteractionState({
            startX: e.clientX,
            startY: e.clientY,
            cards,
            source,
            sourcePileIndex,
            sourceCardIndex,
            element: e.currentTarget,
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!interactionState) return;

        if (dragGhost) {
            setDragGhost(g => {
                if (!g) return null;
                return {
                    ...g,
                    x: e.clientX - g.offsetX,
                    y: e.clientY - g.offsetY,
                };
            });
            return;
        }

        const dist = Math.hypot(e.clientX - interactionState.startX, e.clientY - interactionState.startY);
        const DRAG_THRESHOLD = 5;

        if (dist > DRAG_THRESHOLD) {
            setPressedStack(null);
            const { cards, source, sourcePileIndex } = interactionState;
            setDragSourceInfo({ cards, source, sourcePileIndex });

            const rect = interactionState.element.getBoundingClientRect();
            const offsetX = interactionState.startX - rect.left;
            const offsetY = interactionState.startY - rect.top;

            setDragGhost({
                cards,
                x: e.clientX - offsetX,
                y: e.clientY - offsetY,
                offsetX,
                offsetY,
            });
        }
    }, [interactionState, dragGhost]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!interactionState) return;
        setPressedStack(null);

        // --- DRAG-AND-DROP LOGIC ---
        if (dragGhost && dragSourceInfo) {
            const findDropTarget = (x: number, y: number): { type: 'tableau' | 'foundation', index: number } | null => {
                for (let i = 0; i < foundationRefs.current.length; i++) {
                    const el = foundationRefs.current[i];
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
                            return { type: 'foundation', index: i };
                        }
                    }
                }
                for (let i = tableauRefs.current.length - 1; i >= 0; i--) {
                    const el = tableauRefs.current[i];
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
                            return { type: 'tableau', index: i };
                        }
                    }
                }
                return null;
            };

            const target = findDropTarget(e.clientX, e.clientY);
            if (target) {
                const { cards, source, sourcePileIndex } = dragSourceInfo;
                const movedCard = cards[0];

                if (target.type === 'foundation') {
                    if (source !== 'foundation' && cards.length === 1) {
                        const targetFoundation = foundations[target.index];
                        const topFoundationCard = targetFoundation[targetFoundation.length - 1] ?? null;
                        if (movedCard.suit === SUITS[target.index] &&
                            ((!topFoundationCard && movedCard.rank === Rank.ACE) ||
                                (topFoundationCard && RANK_VALUE_MAP[movedCard.rank] === RANK_VALUE_MAP[topFoundationCard.rank] + 1))) {
                            saveStateToHistory();
                            setMoves(m => m + 1);
                            const newFoundations = foundations.map((pile, i) => i === target.index ? [...pile, movedCard] : pile);
                            setFoundations(newFoundations);

                            if (source === 'waste') setWaste(prev => prev.slice(1));
                            else if (source === 'tableau') {
                                setTableau(prev => {
                                    const newTableau = prev.map(p => [...p]);
                                    const sourcePile = newTableau[sourcePileIndex];
                                    sourcePile.pop();
                                    if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
                                        sourcePile[sourcePile.length - 1] = { ...sourcePile[sourcePile.length - 1], faceUp: true };
                                    }
                                    return newTableau;
                                });
                            }
                        }
                    }
                } else if (target.type === 'tableau') {
                    const targetPile = tableau[target.index];
                    const topTableauCard = targetPile[targetPile.length - 1] ?? null;
                    if ((!topTableauCard && movedCard.rank === Rank.KING) ||
                        (topTableauCard && topTableauCard.faceUp &&
                            SUIT_COLOR_MAP[movedCard.suit] !== SUIT_COLOR_MAP[topTableauCard.suit] &&
                            RANK_VALUE_MAP[movedCard.rank] === RANK_VALUE_MAP[topTableauCard.rank] - 1)) {
                        saveStateToHistory();
                        setMoves(m => m + 1);
                        if (source === 'waste') {
                            setWaste(prev => prev.slice(1));
                            setTableau(prev => prev.map((p, i) => i === target.index ? [...p, ...cards] : p));
                        } else if (source === 'foundation') {
                            setFoundations(prev => prev.map((p, i) => i === sourcePileIndex ? p.slice(0, -1) : p));
                            setTableau(prev => prev.map((p, i) => i === target.index ? [...p, ...cards] : p));
                        } else { // source is tableau
                            setTableau(prev => {
                                const newTableau = prev.map(p => [...p]);
                                const sourcePile = newTableau[sourcePileIndex];
                                const movedStack = sourcePile.splice(sourcePile.length - cards.length, cards.length);
                                newTableau[target.index].push(...movedStack);

                                if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
                                    sourcePile[sourcePile.length - 1] = { ...sourcePile[sourcePile.length - 1], faceUp: true };
                                }
                                return newTableau;
                            });
                        }
                    }
                }
            }
        // --- CLICK (AUTO-MOVE) LOGIC ---
        } else {
            const { cards, source, sourcePileIndex, sourceCardIndex, element } = interactionState;
            const card = cards[0];

            if (source === 'foundation') {
                // No auto-move from foundation
            } else {
                 const isTopCard = source === 'waste' || (source === 'tableau' && sourceCardIndex === tableau[sourcePileIndex].length - 1);
                if (!isTopCard) {
                    const blockingCard = tableau[sourcePileIndex][sourceCardIndex + 1];
                    if (blockingCard) {
                        setShakeCardId(blockingCard.id);
                        setTimeout(() => setShakeCardId(null), 400);
                    }
                } else {
                    for (let i = 0; i < foundations.length; i++) {
                        const pile = foundations[i];
                        const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
                        if (card.suit === SUITS[i] && (
                            (!topCard && card.rank === Rank.ACE) ||
                            (topCard && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] + 1)
                        )) {
                            const toRect = foundationRefs.current[i]?.getBoundingClientRect();
                            if (toRect) {
                                animationEndHandled.current = false;
                                setHiddenForAnimation(card);
                                setAnimationData({ card, fromRect: element.getBoundingClientRect(), toRect, destinationType: 'foundation', destinationIndex: i, source, sourcePileIndex, sourceCardIndex });
                                setTimeout(() => setIsAnimating(true), 10);
                                setInteractionState(null);
                                setDragGhost(null);
                                setDragSourceInfo(null);
                                return;
                            }
                        }
                    }

                    for (let i = 0; i < tableau.length; i++) {
                        if (source === 'tableau' && sourcePileIndex === i) continue;
                        const pile = tableau[i];
                        const topCard = pile.length > 0 ? pile[pile.length - 1] : null;

                        if ((!topCard && card.rank === Rank.KING) || (topCard && topCard.faceUp &&
                            SUIT_COLOR_MAP[card.suit] !== SUIT_COLOR_MAP[topCard.suit] &&
                            RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] - 1)) {

                            const toEl = tableauRefs.current[i];
                            if (toEl) {
                                const parentRect = toEl.getBoundingClientRect();
                                const topOffset = pile.reduce((acc, c, idx) => {
                                    if (idx === 0) return 0;
                                    const prevCard = pile[idx - 1];
                                    return acc + (prevCard.faceUp ? cardSize.faceUpStackOffset : cardSize.faceDownStackOffset);
                                }, 0);

                                const toRect = new DOMRect(parentRect.x, parentRect.y + topOffset, parentRect.width, parentRect.height);

                                animationEndHandled.current = false;
                                setHiddenForAnimation(card);
                                setAnimationData({ card, fromRect: element.getBoundingClientRect(), toRect, destinationType: 'tableau', destinationIndex: i, source, sourcePileIndex, sourceCardIndex });
                                setTimeout(() => setIsAnimating(true), 10);
                                setInteractionState(null);
                                setDragGhost(null);
                                setDragSourceInfo(null);
                                return;
                            }
                        }
                    }
                }
            }
        }
        
        // Cleanup for both paths
        setInteractionState(null);
        setDragGhost(null);
        setDragSourceInfo(null);

    }, [interactionState, dragGhost, dragSourceInfo, foundations, tableau, isPaused, cardSize.faceDownStackOffset, cardSize.faceUpStackOffset]);
    
    useEffect(() => {
        if (interactionState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [interactionState, handleMouseMove, handleMouseUp]);

    const handleAnimationEnd = () => {
        if (!animationData || animationEndHandled.current) return;
        animationEndHandled.current = true;
        
        saveStateToHistory();
        setMoves(m => m + 1);

        const { card, destinationType, destinationIndex, source, sourcePileIndex } = animationData;

        if (destinationType === 'foundation') {
            setFoundations(prev => prev.map((p, i) => i === destinationIndex ? [...p, card] : p));
            if (source === 'waste') {
                setWaste(prev => prev.slice(1));
            } else {
                setTableau(prev => {
                    const newTableau = prev.map(p => [...p]);
                    const sourcePile = newTableau[sourcePileIndex];
                    sourcePile.pop();
                    if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
                       sourcePile[sourcePile.length - 1] = { ...sourcePile[sourcePile.length - 1], faceUp: true };
                    }
                    return newTableau;
                });
            }
        } else {
            if (source === 'waste') {
                setWaste(prev => prev.slice(1));
                setTableau(prev => prev.map((p, i) => i === destinationIndex ? [...p, card] : p));
            } else {
                setTableau(prev => {
                    const newTableau = prev.map(p => [...p]);
                    const sourcePile = newTableau[sourcePileIndex];
                    sourcePile.pop();
                    if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
                        sourcePile[sourcePile.length - 1] = { ...sourcePile[sourcePile.length - 1], faceUp: true };
                    }
                    newTableau[destinationIndex].push(card);
                    return newTableau;
                });
            }
        }

        setAnimationData(null);
        setIsAnimating(false);
        setHiddenForAnimation(null);
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };
    
    const buttonClasses = "bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed";


    return (
        <div className="bg-green-800 min-h-screen text-white p-4 font-sans overflow-x-hidden relative flex flex-col">
             {isWon && <WinModal onPlayAgain={initializeGame} />}
             {isRulesModalOpen && <RulesModal onClose={() => setIsRulesModalOpen(false)} />}
             {isPaused && <PauseModal onResume={() => setIsPaused(false)} />}

             {animationData && (
                 <div
                    className={isAnimating ? 'auto-move-card' : ''}
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
                    <Card card={animationData.card} width={cardSize.width} height={cardSize.height}/>
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

            <div className="max-w-7xl mx-auto w-full">
                <header className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-wider">Klondike</h1>

                    <div className="flex-grow flex justify-center items-center flex-wrap gap-x-6 gap-y-2">
                        <div className="relative group">
                             <button onClick={handleTurnModeToggle} className={buttonClasses}>Turn: {turnMode}</button>
                             <div className="absolute top-full mt-2 w-48 bg-black/80 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center left-1/2 -translate-x-1/2 z-20">
                                Toggle between drawing 1 or 3 cards from the stock.
                            </div>
                        </div>
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
                    <div className="flex flex-wrap justify-between gap-4 mb-8">
                        <div className="flex gap-4">
                            <div onClick={handleStockClick} className="cursor-pointer">
                                {stock.length > 0 ? <Card card={stock[stock.length - 1]} width={cardSize.width} height={cardSize.height} /> : <EmptyPile width={cardSize.width} height={cardSize.height}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5V4H4zm0 12v5h5v-5H4zM15 4v5h5V4h-5zm0 12v5h5v-5h-5z" /></svg>
                                </EmptyPile>}
                            </div>
                            <div ref={wasteRef} className="relative" style={{ width: cardSize.width, height: cardSize.height }}>
                                <EmptyPile width={cardSize.width} height={cardSize.height}/>
                                {waste.length > 0 && Array.from({ length: Math.min(waste.length, 3) }).map((_, i) => {
                                    const card = waste[i];
                                    const isTopCard = i === 0;
                                    const offset = (Math.min(2, waste.length-1) - i) * 12;

                                    return (hiddenForAnimation?.id !== card.id && (
                                        <div key={card.id} className="absolute top-0" style={{left: `${offset}px`}}>
                                            <Card 
                                                card={card} 
                                                onMouseDown={(e) => isTopCard && handleMouseDown(e, [card], 'waste', 0, 0)}
                                                width={cardSize.width} 
                                                height={cardSize.height}
                                                isDragging={isTopCard && dragSourceInfo?.source === 'waste'}
                                                isPressed={isTopCard && pressedStack?.source === 'waste'}
                                            />
                                        </div>
                                    ));
                                }).reverse()}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {foundations.map((pile, i) => {
                                const isTopCardDragging = dragSourceInfo?.source === 'foundation' && dragSourceInfo.sourcePileIndex === i;
                                const isTopCardPressed = !!pressedStack && pressedStack.source === 'foundation' && pressedStack.sourcePileIndex === i;
                                return (
                                    <div key={i} ref={el => { foundationRefs.current[i] = el; }} className="relative" style={{ width: cardSize.width, height: cardSize.height }}>
                                        {/* Background rendering */}
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

                                        {/* Top card rendering */}
                                        {pile.length > 0 && 
                                            <div className="absolute top-0 left-0">
                                                <Card 
                                                    card={pile[pile.length - 1]} 
                                                    onMouseDown={(e) => handleMouseDown(e, [pile[pile.length - 1]], 'foundation', i, pile.length - 1)} 
                                                    width={cardSize.width} 
                                                    height={cardSize.height}
                                                    isDragging={isTopCardDragging}
                                                    isPressed={isTopCardPressed}
                                                />
                                            </div>
                                        }
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-nowrap gap-4 justify-center">
                        {tableau.map((pile, pileIndex) => {
                             const cardTops = pile.reduce<number[]>((acc, _card, index) => {
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
                                <div key={pileIndex} className="relative" ref={el => { tableauRefs.current[pileIndex] = el; }}>
                                    {(pile.length === 0 || areAllCardsInPileDragging) ? <EmptyPile width={cardSize.width} height={cardSize.height}/> :
                                        pile.map((card, cardIndex) => {
                                            const isCardDragging = !!dragSourceInfo && dragSourceInfo.cards.some(c => c.id === card.id);
                                            const isCardPressed = !!pressedStack && 
                                                pressedStack.source === 'tableau' && 
                                                pressedStack.sourcePileIndex === pileIndex &&
                                                cardIndex >= pressedStack.sourceCardIndex;
                                            
                                            return (hiddenForAnimation?.id === card.id) ?
                                            <div key={card.id} style={{ position: 'absolute', top: `${cardTops[cardIndex]}px`, left: 0, width: cardSize.width, height: cardSize.height }} /> :
                                            <Card
                                                key={card.id}
                                                card={card}
                                                onMouseDown={(e) => handleMouseDown(e, pile.slice(cardIndex), 'tableau', pileIndex, cardIndex)}
                                                width={cardSize.width} height={cardSize.height}
                                                style={{ position: 'absolute', top: `${cardTops[cardIndex]}px`, left: 0, zIndex: cardIndex + (isCardPressed ? 20 : 0) }}
                                                isDragging={isCardDragging}
                                                isShaking={shakeCardId === card.id}
                                                isPressed={isCardPressed}
                                            />
                                        })
                                    }
                                    <div style={{ height: `${pileHeight}px`, width: `${cardSize.width}px` }}></div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
             <footer className="w-full flex justify-center items-center gap-4 mt-auto pt-4">
                <button onClick={() => setIsRulesModalOpen(true)} className={buttonClasses}>Rules</button>
                <button onClick={initializeGame} className={buttonClasses.replace('bg-green-700 hover:bg-green-600', 'bg-green-600 hover:bg-green-50al')}>New Game</button>
            </footer>
            <style>{`
                @keyframes auto-move {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    15% { transform: translate(0, -15px) scale(1.05) rotate(3deg); }
                    85% { transform: translate(var(--translateX), calc(var(--translateY) - 15px)) scale(1.05) rotate(3deg); }
                    100% { transform: translate(var(--translateX), var(--translateY)) scale(1) rotate(0deg); }
                }
                .auto-move-card {
                    animation: auto-move 0.4s ease-in-out forwards;
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
            `}</style>
        </div>
    );
};

export default App;
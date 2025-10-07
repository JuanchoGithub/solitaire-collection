
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardType, Theme } from '../../types';
import { Suit, Rank } from '../../types';
import type { GameState, SpiderSuitCount, DragInfo } from './types';
import { SUITS, RANKS, RANK_VALUE_MAP, CARD_ASPECT_RATIO } from '../../constants';

type AnimationState = {
  cards: CardType[];
  fromRect: DOMRect;
  toRect: DOMRect;
  destinationType: 'tableau';
  destinationIndex: number;
  source: 'tableau';
  sourcePileIndex: number;
  sourceCardIndex: number;
} | null;

type ReturnAnimationData = {
    cards: CardType[];
    from: { x: number; y: number };
    toRect: DOMRect;
} | null;

type StockAnimationData = {
    cards: CardType[][]; // An array of 10 cards to be dealt
} | null;

type CompletedSetAnimationData = {
    cards: CardType[];
    fromRects: DOMRect[];
    toRect: DOMRect;
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
    sourcePileIndex: number;
    sourceCardIndex: number;
    element: HTMLDivElement;
} | null;

type HintState = { type: 'card'; cardId: number } | { type: 'stock' } | null;

interface UseSpiderProps {
    theme: Theme;
    suitCount: SpiderSuitCount;
}

export const useSpider = ({ theme, suitCount }: UseSpiderProps) => {
    const { Board, Card } = theme;

    // Core Game State
    const [stock, setStock] = useState<CardType[]>([]);
    const [tableau, setTableau] = useState<CardType[][]>(Array.from({ length: 10 }, () => []));
    const [completedSets, setCompletedSets] = useState(0);
    const [history, setHistory] = useState<GameState[]>([]);

    // UI & Interaction State
    const [dragSourceInfo, setDragSourceInfo] = useState<DragInfo | null>(null);
    const [dragGhost, setDragGhost] = useState<DragGhostState | null>(null);
    const [interactionState, setInteractionState] = useState<InteractionState | null>(null);
    const [isWon, setIsWon] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [shakeStock, setShakeStock] = useState(false);
    const [pressedStack, setPressedStack] = useState<{ sourcePileIndex: number, sourceCardIndex: number } | null>(null);
    const [hint, setHint] = useState<HintState | null>(null);
    const [allHints, setAllHints] = useState<HintState[]>([]);
    const [hintIndex, setHintIndex] = useState<number>(-1);

    // Gameplay Stats
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Responsive Sizing
    const [cardSize, setCardSize] = useState({ width: 80, height: 112, faceUpStackOffset: 22, faceDownStackOffset: 10 });
    const mainContainerRef = useRef<HTMLElement>(null);

    // Animation state
    const [isDealing, setIsDealing] = useState(true);
    const [dealAnimationCards, setDealAnimationCards] = useState<{ card: CardType; style: React.CSSProperties; key: number }[]>([]);
    const [shuffleClass, setShuffleClass] = useState('');
    const [animationData, setAnimationData] = useState<AnimationState | null>(null);
    const [returnAnimationData, setReturnAnimationData] = useState<ReturnAnimationData | null>(null);
    const [stockAnimationData, setStockAnimationData] = useState<StockAnimationData | null>(null);
    const [completedSetAnimation, setCompletedSetAnimation] = useState<CompletedSetAnimationData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hiddenCardIds, setHiddenCardIds] = useState<number[]>([]);
    const animationEndHandled = useRef(false);
    const hintTimeoutRef = useRef<number | null>(null);

    // Refs for positions
    const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);
    const stockRef = useRef<HTMLDivElement | null>(null);
    const initialDeckRef = useRef<HTMLDivElement | null>(null);
    const completedSetsRef = useRef<HTMLDivElement | null>(null);

    const updateCardSize = useCallback(() => {
        if (!mainContainerRef.current) return;

        const containerWidth = mainContainerRef.current.clientWidth;
        const numPiles = 10;
        const gap = 8;
        const minCardWidth = 50;
        const maxCardWidth = 85;

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
        setIsWon(false);
        setDragGhost(null);
        setDragSourceInfo(null);
        setInteractionState(null);
        setIsRulesModalOpen(false);
        setAnimationData(null);
        setReturnAnimationData(null);
        setStockAnimationData(null);
        setCompletedSetAnimation(null);
        setIsAnimating(false);
        setHiddenCardIds([]);
        setPressedStack(null);
        setHint(null);
        setMoves(0);
        setTime(0);
        setHistory([]);
        setIsPaused(false);
        setCompletedSets(0);

        setTableau(Array.from({ length: 10 }, () => []));
        setStock([]);
        setDealAnimationCards([]);
        setShuffleClass('');

        setIsDealing(true);
    }, []);
    
    useEffect(() => {
        initializeGame();
    }, [initializeGame, suitCount]);

    useEffect(() => {
        if (isDealing && mainContainerRef.current && stockRef.current && tableauRefs.current.every(ref => ref) && initialDeckRef.current) {
            let cardId = 0;
            let fullDeck: CardType[] = [];
            
            const suitsToUse = [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS].slice(0, suitCount);
            const setsPerSuit = 8 / suitCount; // 1 suit -> 8 sets, 2 suits -> 4 sets, 4 suits -> 2 sets
            for (let i = 0; i < setsPerSuit; i++) {
                for (const suit of suitsToUse) {
                    fullDeck.push(...RANKS.map(rank => ({ id: cardId++, suit, rank, faceUp: false })));
                }
            }

            for (let i = fullDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
            }
            
            const deckForState = [...fullDeck];
            setShuffleClass('perform-shuffle');
            const dealStartTime = 800;
            const flyingCards: typeof dealAnimationCards = [];
            let dealDelay = 0;
            const dealStagger = 20;
            const fromRect = initialDeckRef.current.getBoundingClientRect();

            const finalTableau: CardType[][] = Array.from({ length: 10 }, () => []);
            // Deal 54 cards to tableau
            for(let i=0; i < 54; i++) {
                const card = deckForState.pop();
                if (card) {
                    finalTableau[i % 10].push(card);
                }
            }
            const finalStock = deckForState;

            finalTableau.forEach((pile, pileIndex) => {
                pile.forEach((card, cardIndex) => {
                    const toEl = tableauRefs.current[pileIndex];
                    if (toEl) {
                        const toRect = toEl.getBoundingClientRect();
                        const topOffset = cardIndex * cardSize.faceDownStackOffset;
                        flyingCards.push({
                            card: card,
                            key: card.id,
                            style: {
                                '--from-top': `${fromRect.top}px`,
                                '--from-left': `${fromRect.left}px`,
                                '--to-top': `${toRect.top + topOffset}px`,
                                '--to-left': `${toRect.left}px`,
                                animationDelay: `${dealStartTime + dealDelay}ms`,
                            } as React.CSSProperties
                        });
                        dealDelay += dealStagger;
                    }
                });
            });

            const toStockRect = stockRef.current.getBoundingClientRect();
            finalStock.forEach(card => {
                 flyingCards.push({
                    card,
                    key: card.id,
                    style: {
                        '--from-top': `${fromRect.top}px`,
                        '--from-left': `${fromRect.left}px`,
                        '--to-top': `${toStockRect.top}px`,
                        '--to-left': `${toStockRect.left}px`,
                        animationDelay: `${dealStartTime + dealDelay}ms`,
                    } as React.CSSProperties
                });
                dealDelay += dealStagger / 10;
            });
            
            setDealAnimationCards(flyingCards);

            setTimeout(() => {
                finalTableau.forEach(pile => {
                    if (pile.length > 0) pile[pile.length - 1].faceUp = true;
                });
                setTableau(finalTableau);
                setStock(finalStock);
                setIsDealing(false);
                setDealAnimationCards([]);
                setShuffleClass('');
                setTime(0);
            }, dealStartTime + dealDelay + 400);
        }
    }, [isDealing, cardSize.width, suitCount]);

    useEffect(() => {
        if (completedSets === 8) {
            setIsWon(true);
        }
    }, [completedSets]);

    useEffect(() => {
        if (isPaused || isWon || isAnimating || isDealing || stockAnimationData || completedSetAnimation) {
            return;
        }
        const timerId = setInterval(() => setTime(prevTime => prevTime + 1), 1000);
        return () => clearInterval(timerId);
    }, [isPaused, isWon, isAnimating, isDealing, stockAnimationData, completedSetAnimation]);
    
    const saveStateToHistory = () => {
        setHistory(prev => [...prev, { stock, tableau, moves, completedSets }]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setStock(lastState.stock);
        setTableau(lastState.tableau);
        setMoves(lastState.moves);
        setCompletedSets(lastState.completedSets);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleStockClick = () => {
        if (isAnimating || isPaused || isDealing || stock.length === 0) return;
        
        if (tableau.some(p => p.length === 0)) {
            setShakeStock(true);
            setTimeout(() => setShakeStock(false), 500);
            return;
        }
        
        setHint(null);
        saveStateToHistory();
        setMoves(prev => prev + 1);

        const cardsToDeal = stock.slice(-10).map(c => ({ ...c, faceUp: true }));
        const newStock = stock.slice(0, -10);
        setStock(newStock);

        const cardsByPile: CardType[][] = Array.from({ length: 10 }, () => []);
        cardsToDeal.forEach((card, i) => cardsByPile[i].push(card));

        setHiddenCardIds(cardsToDeal.map(c => c.id));
        setStockAnimationData({ cards: cardsByPile });
        setIsAnimating(true);

        setTimeout(() => {
            const newTableau = [...tableau];
            cardsToDeal.forEach((card, i) => newTableau[i].push(card));
            setTableau(newTableau);

            setStockAnimationData(null);
            setIsAnimating(false);
            setHiddenCardIds([]);
            
            setTimeout(() => {
                const updatedTableau = [...newTableau]; // Use the tableau state right after dealing
                for (let i = 0; i < 10; i++) {
                    checkForCompletedSet(i, updatedTableau);
                }
            }, 50);

        }, 500); // Animation duration
    };

    const findAllHints = useCallback((): HintState[] => {
        const hints: { type: 'card'; cardId: number }[] = [];
        const hintedCardIds = new Set<number>();
        const addHint = (card: CardType, isPriority: boolean) => {
            if (!hintedCardIds.has(card.id)) {
                const hint = { type: 'card' as const, cardId: card.id };
                if (isPriority) {
                    hints.unshift(hint);
                } else {
                    hints.push(hint);
                }
                hintedCardIds.add(card.id);
            }
        };
        
        for (let sourcePileIndex = 0; sourcePileIndex < tableau.length; sourcePileIndex++) {
            const sourcePile = tableau[sourcePileIndex];
            if (sourcePile.length === 0) continue;

            for (let cardIndex = 0; cardIndex < sourcePile.length; cardIndex++) {
                if (!sourcePile[cardIndex].faceUp) continue;

                let isValidStack = true;
                for (let i = cardIndex; i < sourcePile.length - 1; i++) {
                    if (
                        RANK_VALUE_MAP[sourcePile[i+1].rank] !== RANK_VALUE_MAP[sourcePile[i].rank] - 1 ||
                        sourcePile[i+1].suit !== sourcePile[i].suit
                    ) {
                        isValidStack = false;
                        break;
                    }
                }

                if (isValidStack) {
                    const cardToMove = sourcePile[cardIndex];
                    for (let destPileIndex = 0; destPileIndex < tableau.length; destPileIndex++) {
                        if (sourcePileIndex === destPileIndex) continue;

                        const destPile = tableau[destPileIndex];
                        const topDestCard = destPile[destPile.length - 1];

                        if (!topDestCard || RANK_VALUE_MAP[cardToMove.rank] === RANK_VALUE_MAP[topDestCard.rank] - 1) {
                            const isPriority = cardIndex > 0 && !sourcePile[cardIndex - 1].faceUp;
                            addHint(cardToMove, isPriority);
                        }
                    }
                }
            }
        }
        
        if (hints.length > 0) {
            return hints;
        }

        if (stock.length > 0 && !tableau.some(p => p.length === 0)) {
            return [{ type: 'stock' }];
        }

        return [];
    }, [tableau, stock]);

    const handleHint = useCallback(() => {
        if (hintTimeoutRef.current) {
            clearTimeout(hintTimeoutRef.current);
        }

        let currentHints = allHints;
        let currentIdx = hintIndex;

        if (currentIdx === -1 || currentHints.length === 0) {
            currentHints = findAllHints();
            setAllHints(currentHints);
            currentIdx = 0;
        } else {
            currentIdx = (currentIdx + 1) % (currentHints.length || 1);
        }
        
        setHintIndex(currentIdx);

        if (currentHints.length > 0) {
            const foundHint = currentHints[currentIdx];
            setHint(foundHint);
            hintTimeoutRef.current = window.setTimeout(() => {
                setHint(null);
                setHintIndex(-1);
                setAllHints([]);
            }, 3000);
        } else {
            setHint(null);
            setHintIndex(-1);
            setAllHints([]);
        }
    }, [allHints, hintIndex, findAllHints]);

    const checkForCompletedSet = useCallback((pileIndex: number, currentTableau: CardType[][]) => {
        const pile = currentTableau[pileIndex];
        if (pile.length < 13) return false;
        
        const last13 = pile.slice(-13);
        const firstCardSuit = last13[0].suit;

        if (last13.every(c => c.faceUp && c.suit === firstCardSuit) && last13[0].rank === Rank.KING) {
            let isSet = true;
            for (let i = 0; i < 12; i++) {
                if (RANK_VALUE_MAP[last13[i+1].rank] !== RANK_VALUE_MAP[last13[i].rank] - 1) {
                    isSet = false;
                    break;
                }
            }

            if (isSet) {
                const fromRects: DOMRect[] = [];
                for (let i = 0; i < 13; i++) {
                    const cardEl = document.querySelector(`[data-card-id="${last13[i].id}"]`);
                    if (cardEl) fromRects.push(cardEl.getBoundingClientRect());
                }
                const toRect = completedSetsRef.current?.getBoundingClientRect();

                if(fromRects.length === 13 && toRect) {
                    setHiddenCardIds(ids => [...ids, ...last13.map(c => c.id)]);
                    setCompletedSetAnimation({ cards: last13, fromRects, toRect });
                    setIsAnimating(true);

                    setTimeout(() => {
                        setTableau(prev => {
                            const newTableau = prev.map(p => [...p]);
                            newTableau[pileIndex] = newTableau[pileIndex].slice(0, -13);
                            if(newTableau[pileIndex].length > 0) {
                                newTableau[pileIndex][newTableau[pileIndex].length - 1].faceUp = true;
                            }
                            return newTableau;
                        });
                        setCompletedSets(c => c + 1);
                        
                        setHiddenCardIds(ids => ids.filter(id => !last13.some(c => c.id === id)));
                        setCompletedSetAnimation(null);
                        setIsAnimating(false);
                    }, 500);
                    return true;
                }
            }
        }
        return false;
    }, []);

    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        sourcePileIndex: number,
        sourceCardIndex: number
    ) => {
        if (isAnimating || isPaused || e.button !== 0 || isDealing) return;
        const pile = tableau[sourcePileIndex];
        const card = pile[sourceCardIndex];
        if (!card || !card.faceUp) return;

        // A stack is only movable if it's a valid sequence of same-suit cards running to the end of the pile.
        // Check if the sequence from the clicked card to the end is valid.
        for (let i = sourceCardIndex; i < pile.length - 1; i++) {
            if (
                !pile[i+1].faceUp || 
                RANK_VALUE_MAP[pile[i+1].rank] !== RANK_VALUE_MAP[pile[i].rank] - 1 ||
                pile[i+1].suit !== pile[i].suit
            ) {
                // The clicked card is part of a stack that is blocked. Do not allow drag.
                return;
            }
        }
    
        // If the loop completes, the entire stack from the clicked card to the end is valid.
        const cardsToDrag = pile.slice(sourceCardIndex);

        e.preventDefault();
        setPressedStack({ sourcePileIndex, sourceCardIndex });
        setHint(null);

        setInteractionState({
            startX: e.clientX,
            startY: e.clientY,
            cards: cardsToDrag,
            sourcePileIndex,
            sourceCardIndex,
            element: e.currentTarget,
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!interactionState) return;

        if (dragGhost) {
            setDragGhost(g => g ? { ...g, x: e.clientX - g.offsetX, y: e.clientY - g.offsetY } : null);
            return;
        }

        const dist = Math.hypot(e.clientX - interactionState.startX, e.clientY - interactionState.startY);
        if (dist > 5) {
            setPressedStack(null);
            setDragSourceInfo({
                cards: interactionState.cards,
                sourcePileIndex: interactionState.sourcePileIndex,
            });
            const rect = interactionState.element.getBoundingClientRect();
            const offsetX = interactionState.startX - rect.left;
            const offsetY = interactionState.startY - rect.top;

            setDragGhost({
                cards: interactionState.cards,
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
        
        let moveMade = false;
        const wasDrag = !!dragGhost;

        if (dragGhost) {
            const target = tableauRefs.current.findIndex((el, i) => {
                if (!el || i === interactionState.sourcePileIndex) return false;
                const rect = el.getBoundingClientRect();
                const pile = tableau[i];
                const lastCard = pile[pile.length - 1];
                const lastCardRect = lastCard ? document.querySelector(`[data-card-id="${lastCard.id}"]`)?.getBoundingClientRect() : null;

                // For empty piles, target the whole pile. For non-empty, target only the last card.
                const targetRect = lastCardRect || rect;

                return e.clientX > targetRect.left && e.clientX < targetRect.right && e.clientY > targetRect.top && e.clientY < targetRect.bottom;
            });

            if (target !== -1) {
                const { cards, sourcePileIndex, sourceCardIndex } = interactionState;
                const movedCard = cards[0];
                const targetPile = tableau[target];
                const topTableauCard = targetPile[targetPile.length - 1] ?? null;

                if (!topTableauCard || RANK_VALUE_MAP[movedCard.rank] === RANK_VALUE_MAP[topTableauCard.rank] - 1) {
                    moveMade = true;
                    saveStateToHistory();
                    setMoves(m => m + 1);
                    
                    const newTableau = tableau.map(p => [...p]);
                    const sourcePile = newTableau[sourcePileIndex];
                    const movedStack = sourcePile.splice(sourceCardIndex, cards.length);
                    newTableau[target].push(...movedStack);

                    if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
                        sourcePile[sourcePile.length - 1].faceUp = true;
                    }
                    setTableau(newTableau);
                    setTimeout(() => {
                       checkForCompletedSet(target, newTableau);
                    }, 50);
                }
            }

            if (!moveMade) {
                setReturnAnimationData({
                    cards: dragGhost.cards,
                    from: { x: dragGhost.x, y: dragGhost.y },
                    toRect: interactionState.element.getBoundingClientRect(),
                });
            }
        } else { // Click-to-move logic
            const { cards, sourcePileIndex, sourceCardIndex, element } = interactionState;
            const sourcePile = tableau[sourcePileIndex];
            const cardToMove = cards[0];
            const potentialMoves: { destPileIndex: number; uncoversCard: boolean }[] = [];

            for (let destPileIndex = 0; destPileIndex < tableau.length; destPileIndex++) {
                if (destPileIndex === sourcePileIndex) continue;
                const destPile = tableau[destPileIndex];
                const topDestCard = destPile[destPile.length - 1];
                if (!topDestCard || RANK_VALUE_MAP[cardToMove.rank] === RANK_VALUE_MAP[topDestCard.rank] - 1) {
                    const uncoversCard = (sourceCardIndex > 0) && !sourcePile[sourceCardIndex - 1].faceUp;
                    potentialMoves.push({ destPileIndex, uncoversCard });
                }
            }
            
            if (potentialMoves.length > 0) {
                const bestMove = potentialMoves.find(m => m.uncoversCard) || potentialMoves[0];
                const { destPileIndex } = bestMove;
                const toEl = tableauRefs.current[destPileIndex];

                if (toEl) {
                    const parentRect = toEl.getBoundingClientRect();
                    const destPile = tableau[destPileIndex];
                    const topOffset = destPile.reduce((acc, c) => acc + (c.faceUp ? cardSize.faceUpStackOffset : cardSize.faceDownStackOffset), 0);
                    const toRect = new DOMRect(parentRect.x, parentRect.y + topOffset, parentRect.width, parentRect.height);
                    
                    animationEndHandled.current = false;
                    setHiddenCardIds(cards.map(c => c.id));
                    setAnimationData({
                        cards,
                        fromRect: element.getBoundingClientRect(),
                        toRect,
                        destinationType: 'tableau',
                        destinationIndex: destPileIndex,
                        source: 'tableau',
                        sourcePileIndex,
                        sourceCardIndex,
                    });
                    setTimeout(() => setIsAnimating(true), 10);
                    
                    setInteractionState(null);
                    setDragGhost(null);
                    setDragSourceInfo(null);
                    return;
                }
            }
        }
        
        setInteractionState(null);
        setDragGhost(null);
        if (!wasDrag || moveMade) {
            setDragSourceInfo(null);
        }

    }, [interactionState, dragGhost, tableau, checkForCompletedSet, cardSize.faceUpStackOffset, cardSize.faceDownStackOffset]);
    
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

        const { cards, destinationIndex, sourcePileIndex, sourceCardIndex } = animationData;

        const newTableau = tableau.map(p => [...p]);
        const sourcePile = newTableau[sourcePileIndex];
        const movedStack = sourcePile.splice(sourceCardIndex, cards.length);
        newTableau[destinationIndex].push(...movedStack);

        if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
            sourcePile[sourcePile.length - 1].faceUp = true;
        }

        setTableau(newTableau);
        setTimeout(() => {
            checkForCompletedSet(destinationIndex, newTableau);
        }, 50);

        setAnimationData(null);
        setIsAnimating(false);
        setHiddenCardIds([]);
    };

    const handleReturnAnimationEnd = () => {
        setReturnAnimationData(null);
        setDragSourceInfo(null);
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return {
        // State
        stock, tableau, completedSets, history, isWon, isRulesModalOpen, shakeStock, pressedStack, hint, moves, time, isPaused, suitCount,
        // UI State
        cardSize, shuffleClass, isDealing,
        // Animations
        dealAnimationCards, animationData, returnAnimationData, stockAnimationData, completedSetAnimation, dragGhost, dragSourceInfo, hiddenCardIds,
        // Handlers
        initializeGame, handleUndo, handleStockClick, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleAnimationEnd, handleReturnAnimationEnd,
        // Refs
        mainContainerRef, stockRef, tableauRefs, initialDeckRef, completedSetsRef,
        // Theme Components
        Board, Card,
        // Helpers
        formatTime,
    };
};

export type SpiderController = ReturnType<typeof useSpider>;

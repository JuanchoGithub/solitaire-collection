import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardType, Theme } from '../../types';
import { Suit, Rank } from '../../types';
import type { GameState, SpiderSuitCount } from './types';
import { SUITS, RANKS, RANK_VALUE_MAP, CARD_ASPECT_RATIO } from '../../constants';
import { useCardDrag } from '../../hooks/useCardDrag';


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

type StockAnimationData = {
    cards: CardType[][]; // An array of 10 cards to be dealt
} | null;

type CompletedSetAnimationData = {
    cards: CardType[];
    fromRects: DOMRect[];
    toRect: DOMRect;
} | null;

type HintState = { type: 'card'; cardId: number } | { type: 'stock' } | null;

type DragSource = 'tableau';
type DropTarget = 'tableau';

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
    const [isWon, setIsWon] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [shakeStock, setShakeStock] = useState(false);
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
    
    // Card Drag Engine
    const { dragSourceInfo, dragGhost, returnAnimationData, pressedStack, handleMouseDown, handleReturnAnimationEnd } = useCardDrag<DragSource, DropTarget>({
        isInteractionDisabled: isAnimating || isPaused || isDealing,
        onDragStart: () => setHint(null),
        getDraggableCards: (source, sourcePileIndex, sourceCardIndex) => {
            const pile = tableau[sourcePileIndex];
            const card = pile[sourceCardIndex];
            if (!card || !card.faceUp) return null;

            for (let i = sourceCardIndex; i < pile.length - 1; i++) {
                if (!pile[i+1].faceUp || RANK_VALUE_MAP[pile[i+1].rank] !== RANK_VALUE_MAP[pile[i].rank] - 1 || pile[i+1].suit !== pile[i].suit) {
                    return null;
                }
            }
            return pile.slice(sourceCardIndex);
        },
        findDropTarget: (x, y) => {
            const targetIndex = tableauRefs.current.findIndex((el) => {
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                const pile = tableau[tableauRefs.current.indexOf(el)];
                const lastCard = pile[pile.length - 1];
                const lastCardRect = lastCard ? document.querySelector(`[data-card-id="${lastCard.id}"]`)?.getBoundingClientRect() : null;
                const targetRect = lastCardRect || rect;
                return x > targetRect.left && x < targetRect.right && y > targetRect.top && y < targetRect.bottom;
            });
            return targetIndex !== -1 ? { type: 'tableau', index: targetIndex } : null;
        },
        onDrop: (dragInfo, target) => {
            if (dragInfo.sourcePileIndex === target.index) return false;

            const { cards, sourcePileIndex, sourceCardIndex } = dragInfo;
            const movedCard = cards[0];
            const targetPile = tableau[target.index];
            const topTableauCard = targetPile[targetPile.length - 1] ?? null;

            if (!topTableauCard || RANK_VALUE_MAP[movedCard.rank] === RANK_VALUE_MAP[topTableauCard.rank] - 1) {
                saveStateToHistory();
                setMoves(m => m + 1);
                
                const newTableau = tableau.map(p => [...p]);
                const sourcePile = newTableau[sourcePileIndex];
                const movedStack = sourcePile.splice(sourceCardIndex, cards.length);
                newTableau[target.index].push(...movedStack);

                if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
                    sourcePile[sourcePile.length - 1].faceUp = true;
                }
                setTableau(newTableau);
                setTimeout(() => checkForCompletedSet(target.index, newTableau), 50);
                return true;
            }
            return false;
        },
        onClick: (source, sourcePileIndex, sourceCardIndex, cards, element) => {
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
                        cards, fromRect: element.getBoundingClientRect(), toRect,
                        destinationType: 'tableau', destinationIndex: destPileIndex,
                        source: 'tableau', sourcePileIndex, sourceCardIndex,
                    });
                    setTimeout(() => setIsAnimating(true), 10);
                }
            }
        },
    });

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
        setCardSize({ width: newCardWidth, height: newCardHeight, faceUpStackOffset: newCardHeight / 5.0, faceDownStackOffset: newCardHeight / 12 });
    }, []);

    useEffect(() => {
        updateCardSize();
        window.addEventListener('resize', updateCardSize);
        return () => window.removeEventListener('resize', updateCardSize);
    }, [updateCardSize]);

    const initializeGame = useCallback(() => {
        setIsWon(false);
        setIsRulesModalOpen(false);
        setAnimationData(null);
        setStockAnimationData(null);
        setCompletedSetAnimation(null);
        setIsAnimating(false);
        setHiddenCardIds([]);
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
            const suitsToUse = SUITS.slice(0, suitCount);
            const setsPerSuit = 8 / suitCount;
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
            for(let i=0; i < 54; i++) {
                const card = deckForState.pop();
                if (card) finalTableau[i % 10].push(card);
            }
            const finalStock = deckForState;
            finalTableau.forEach((pile, pileIndex) => {
                pile.forEach((card, cardIndex) => {
                    const toEl = tableauRefs.current[pileIndex];
                    if (toEl) {
                        const toRect = toEl.getBoundingClientRect();
                        const topOffset = cardIndex * cardSize.faceDownStackOffset;
                        flyingCards.push({
                            card: card, key: card.id, style: {
                                '--from-top': `${fromRect.top}px`, '--from-left': `${fromRect.left}px`,
                                '--to-top': `${toRect.top + topOffset}px`, '--to-left': `${toRect.left}px`,
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
                    card, key: card.id, style: {
                        '--from-top': `${fromRect.top}px`, '--from-left': `${fromRect.left}px`,
                        '--to-top': `${toStockRect.top}px`, '--to-left': `${toStockRect.left}px`,
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
    }, [isDealing, cardSize.width, cardSize.faceDownStackOffset, suitCount]);

    useEffect(() => {
        if (completedSets === 8) setIsWon(true);
    }, [completedSets]);

    useEffect(() => {
        if (isPaused || isWon || isAnimating || isDealing || stockAnimationData || completedSetAnimation) return;
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
                const updatedTableau = [...newTableau];
                for (let i = 0; i < 10; i++) {
                    checkForCompletedSet(i, updatedTableau);
                }
            }, 50);
        }, 500);
    };

    const findAllHints = useCallback((): HintState[] => {
        const hints: { type: 'card'; cardId: number }[] = [];
        const hintedCardIds = new Set<number>();
        const addHint = (card: CardType, isPriority: boolean) => {
            if (!hintedCardIds.has(card.id)) {
                const hint = { type: 'card' as const, cardId: card.id };
                if (isPriority) hints.unshift(hint);
                else hints.push(hint);
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
                    if (RANK_VALUE_MAP[sourcePile[i+1].rank] !== RANK_VALUE_MAP[sourcePile[i].rank] - 1 || sourcePile[i+1].suit !== sourcePile[i].suit) {
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
        if (hints.length > 0) return hints;
        if (stock.length > 0 && !tableau.some(p => p.length === 0)) return [{ type: 'stock' }];
        return [];
    }, [tableau, stock]);

    const handleHint = useCallback(() => {
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
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
    }, [completedSetsRef]);

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
        setTimeout(() => checkForCompletedSet(destinationIndex, newTableau), 50);
        setAnimationData(null);
        setIsAnimating(false);
        setHiddenCardIds([]);
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return {
        stock, tableau, completedSets, history, isWon, isRulesModalOpen, shakeStock, pressedStack, hint, moves, time, isPaused, suitCount,
        cardSize, shuffleClass, isDealing, isAnimating,
        dealAnimationCards, animationData, returnAnimationData, stockAnimationData, completedSetAnimation, dragGhost, dragSourceInfo, hiddenCardIds,
        initializeGame, handleUndo, handleStockClick, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleAnimationEnd, handleReturnAnimationEnd,
        mainContainerRef, stockRef, tableauRefs, initialDeckRef, completedSetsRef,
        Board, Card,
        formatTime,
    };
};

export type SpiderController = ReturnType<typeof useSpider>;
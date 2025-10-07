
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardType, Theme } from '../../types';
import { Suit, Rank } from '../../types';
import type { GameState } from './types';
import { SUITS, RANKS, RANK_VALUE_MAP, SUIT_COLOR_MAP, CARD_ASPECT_RATIO, SUIT_SYMBOL_MAP } from '../../constants';
import { useCardDrag } from '../../hooks/useCardDrag';

type AnimationState = {
  cards: CardType[];
  fromRect: DOMRect;
  toRect: DOMRect;
  destinationType: 'tableau' | 'foundation';
  destinationIndex: number;
  source: 'tableau' | 'waste' | 'foundation';
  sourcePileIndex: number;
  sourceCardIndex: number;
} | null;

type StockAnimationData = {
    type: 'turn';
    cards: CardType[];
    wasteCountBefore: number;
} | {
    type: 'reset';
    cards: CardType[];
} | null;

type HintState = { type: 'card'; cardId: number } | { type: 'stock' } | null;

type DragSource = 'tableau' | 'waste' | 'foundation';
type DropTarget = 'tableau' | 'foundation';

type KlondikeMode = 'random' | 'winnable';

const generateWinnableDeal = (): { tableau: CardType[][]; stock: CardType[] } => {
    let cardId = 0;
    // 1. Start with a solved state, where all cards are on the foundations
    const tempFoundations: CardType[][] = SUITS.map(suit =>
        RANKS.map(rank => ({ id: cardId++, suit, rank, faceUp: true }))
    );
    const tempTableau: CardType[][] = Array.from({ length: 7 }, () => []);

    // 2. Perform a series of reverse moves to shuffle cards from foundations to the tableau
    // This creates a complex, but solvable, board state.
    for (let i = 0; i < 150; i++) {
        const availableFoundations = tempFoundations.map((p, i) => i).filter(i => tempFoundations[i].length > 0);
        if (availableFoundations.length === 0) break;

        const fIndex = availableFoundations[Math.floor(Math.random() * availableFoundations.length)];
        const cardToMove = tempFoundations[fIndex][tempFoundations[fIndex].length - 1];

        const validTableauSpots = [];
        for (let tIndex = 0; tIndex < 7; tIndex++) {
            const pile = tempTableau[tIndex];
            if (pile.length === 0) {
                if (cardToMove.rank === Rank.KING) validTableauSpots.push(tIndex);
            } else {
                const topCard = pile[pile.length - 1];
                if (SUIT_COLOR_MAP[cardToMove.suit] !== SUIT_COLOR_MAP[topCard.suit] && RANK_VALUE_MAP[cardToMove.rank] === RANK_VALUE_MAP[topCard.rank] - 1) {
                    validTableauSpots.push(tIndex);
                }
            }
        }

        if (validTableauSpots.length > 0) {
            const destIndex = validTableauSpots[Math.floor(Math.random() * validTableauSpots.length)];
            tempTableau[destIndex].push(tempFoundations[fIndex].pop()!);
        }
    }

    // 3. Collect all cards from this solvable state into a single deck
    const allCards: CardType[] = [...tempTableau.flat(), ...tempFoundations.flat()];
    
    // Shuffle them to obscure the obvious solution path
    for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }

    // 4. Deal these "winnable" cards into a standard Klondike starting layout
    const deckForState = [...allCards];
    const finalTableau: CardType[][] = Array.from({ length: 7 }, (_, i) => deckForState.splice(0, i + 1));
    finalTableau.forEach(pile => {
        pile.forEach((card, index) => card.faceUp = (index === pile.length - 1));
    });

    const finalStock = deckForState.map(c => ({ ...c, faceUp: false }));

    return { tableau: finalTableau, stock: finalStock };
};


interface UseKlondikeProps {
    theme: Theme;
    layout: 'portrait' | 'landscape';
    gameMode: KlondikeMode;
}

export const useKlondike = ({ theme, layout, gameMode }: UseKlondikeProps) => {
    const { Board, Card } = theme;

    // Core Game State
    const [stock, setStock] = useState<CardType[]>([]);
    const [waste, setWaste] = useState<CardType[]>([]);
    const [foundations, setFoundations] = useState<CardType[][]>([[], [], [], []]);
    const [tableau, setTableau] = useState<CardType[][]>([[], [], [], [], [], [], []]);
    const [history, setHistory] = useState<GameState[]>([]);

    // UI & Interaction State
    const [isWon, setIsWon] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [shakeCardId, setShakeCardId] = useState<number | null>(null);
    const [hint, setHint] = useState<HintState>(null);
    const [allHints, setAllHints] = useState<HintState[]>([]);
    const [hintIndex, setHintIndex] = useState<number>(-1);


    // Gameplay Stats & Settings
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [turnMode, setTurnMode] = useState<1 | 3>(3);
    const [autoplayMode, setAutoplayMode] = useState<'off' | 'obvious' | 'won'>('obvious');
    const [recentlyMovedFromFoundation, setRecentlyMovedFromFoundation] = useState<number | null>(null);

    // Responsive Sizing
    const [cardSize, setCardSize] = useState({ width: 100, height: 140, faceUpStackOffset: 28, faceDownStackOffset: 12 });
    const mainContainerRef = useRef<HTMLElement>(null);

    // Animation state
    const [isDealing, setIsDealing] = useState(true);
    const [dealAnimationCards, setDealAnimationCards] = useState<{ card: CardType; style: React.CSSProperties; key: number }[]>([]);
    const [shuffleClass, setShuffleClass] = useState('');
    const [animationData, setAnimationData] = useState<AnimationState>(null);
    const [stockAnimationData, setStockAnimationData] = useState<StockAnimationData>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hiddenCardIds, setHiddenCardIds] = useState<number[]>([]);
    const [foundationFx, setFoundationFx] = useState<{ index: number; suit: Suit } | null>(null);
    const animationEndHandled = useRef(false);
    const hintTimeoutRef = useRef<number | null>(null);

    // Refs for positions
    const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);
    const wasteRef = useRef<HTMLDivElement | null>(null);
    const stockRef = useRef<HTMLDivElement | null>(null);
    const initialDeckRef = useRef<HTMLDivElement | null>(null);

    // Card Drag Engine
    const { dragSourceInfo, dragGhost, returnAnimationData, pressedStack, handleMouseDown, handleReturnAnimationEnd } = useCardDrag<DragSource, DropTarget>({
        isInteractionDisabled: isAnimating || isPaused || isDealing || !!stockAnimationData,
        onDragStart: () => setHint(null),
        getDraggableCards: (source, sourcePileIndex, sourceCardIndex) => {
            let cards: CardType[] = [];
            if (source === 'tableau') {
                const pile = tableau[sourcePileIndex];
                if (!pile[sourceCardIndex]?.faceUp) return null;
                cards = pile.slice(sourceCardIndex);
            } else if (source === 'waste') {
                if (waste.length > 0) cards = [waste[0]];
            } else if (source === 'foundation') {
                const pile = foundations[sourcePileIndex];
                if (pile.length > 0) cards = [pile[pile.length - 1]];
            }
            return cards.length > 0 ? cards : null;
        },
        findDropTarget: (x, y) => {
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
        },
        onDrop: (dragInfo, target) => {
            const { cards, source, sourcePileIndex, sourceCardIndex } = dragInfo;
            const movedCard = cards[0];
            let moveMade = false;

            if (target.type === 'foundation') {
                if (source !== 'foundation' && cards.length === 1) {
                    const targetFoundation = foundations[target.index];
                    const topFoundationCard = targetFoundation[targetFoundation.length - 1] ?? null;
                    if (movedCard.suit === SUITS[target.index] &&
                        ((!topFoundationCard && movedCard.rank === Rank.ACE) ||
                            (topFoundationCard && RANK_VALUE_MAP[movedCard.rank] === RANK_VALUE_MAP[topFoundationCard.rank] + 1))) {
                        moveMade = true;
                        setRecentlyMovedFromFoundation(null);
                        saveStateToHistory();
                        setMoves(m => m + 1);
                        setFoundations(f => f.map((pile, i) => i === target.index ? [...pile, movedCard] : pile));

                        if (source === 'waste') setWaste(w => w.slice(1));
                        else if (source === 'tableau') {
                            setTableau(t => {
                                const newTableau = t.map(p => [...p]);
                                const sPile = newTableau[sourcePileIndex];
                                sPile.pop();
                                if (sPile.length > 0 && !sPile[sPile.length - 1].faceUp) {
                                    sPile[sPile.length - 1] = { ...sPile[sPile.length - 1], faceUp: true };
                                }
                                return newTableau;
                            });
                        }
                         setFoundationFx({ index: target.index, suit: movedCard.suit });
                         setTimeout(() => setFoundationFx(null), 1000);
                    }
                }
            } else if (target.type === 'tableau') {
                const targetPile = tableau[target.index];
                const topTableauCard = targetPile[targetPile.length - 1] ?? null;
                if ((!topTableauCard && movedCard.rank === Rank.KING) ||
                    (topTableauCard?.faceUp && SUIT_COLOR_MAP[movedCard.suit] !== SUIT_COLOR_MAP[topTableauCard.suit] && RANK_VALUE_MAP[movedCard.rank] === RANK_VALUE_MAP[topTableauCard.rank] - 1)) {
                    moveMade = true;
                    if (source === 'foundation') setRecentlyMovedFromFoundation(movedCard.id);
                    else setRecentlyMovedFromFoundation(null);
                    
                    saveStateToHistory();
                    setMoves(m => m + 1);
                    if (source === 'waste') {
                        setWaste(w => w.slice(1));
                        setTableau(t => t.map((p, i) => i === target.index ? [...p, ...cards] : p));
                    } else if (source === 'foundation') {
                        setFoundations(f => f.map((p, i) => i === sourcePileIndex ? p.slice(0, -1) : p));
                        setTableau(t => t.map((p, i) => i === target.index ? [...p, ...cards] : p));
                    } else { // tableau
                        setTableau(t => {
                            const newTableau = t.map(p => [...p]);
                            const sPile = newTableau[sourcePileIndex];
                            const movedStack = sPile.splice(sourceCardIndex, cards.length);
                            newTableau[target.index].push(...movedStack);

                            if (sPile.length > 0 && !sPile[sPile.length - 1].faceUp) {
                                sPile[sPile.length - 1] = { ...sPile[sPile.length - 1], faceUp: true };
                            }
                            return newTableau;
                        });
                    }
                }
            }
            return moveMade;
        },
        onClick: (source, sourcePileIndex, sourceCardIndex, cards, element) => {
            const card = cards[0];
            if (source === 'foundation') return;

            const triggerAnimation = (destinationType: 'tableau' | 'foundation', destinationIndex: number, toRect: DOMRect) => {
                animationEndHandled.current = false;
                setHiddenCardIds(cards.map(c => c.id));
                setAnimationData({ cards, fromRect: element.getBoundingClientRect(), toRect, destinationType, destinationIndex, source, sourcePileIndex, sourceCardIndex });
                setIsAnimating(true);
            };

            // Priority 1: Move to foundation (only single cards)
            if (cards.length === 1) {
                for (let i = 0; i < foundations.length; i++) {
                    const pile = foundations[i];
                    const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
                    if (card.suit === SUITS[i] && (
                        (!topCard && card.rank === Rank.ACE) ||
                        (topCard && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] + 1)
                    )) {
                        const toRect = foundationRefs.current[i]?.getBoundingClientRect();
                        if (toRect) {
                            triggerAnimation('foundation', i, toRect);
                            return;
                        }
                    }
                }
            }

            // Priority 2: Move to tableau
            for (let i = 0; i < tableau.length; i++) {
                if (source === 'tableau' && sourcePileIndex === i) continue;

                const destPile = tableau[i];
                const topDestCard = destPile[destPile.length - 1];

                if ((!topDestCard && card.rank === Rank.KING) || 
                    (topDestCard?.faceUp && SUIT_COLOR_MAP[card.suit] !== SUIT_COLOR_MAP[topDestCard.suit] && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topDestCard.rank] - 1)) {
                    
                    const toEl = tableauRefs.current[i];
                    if (toEl) {
                        const parentRect = toEl.getBoundingClientRect();
                        const cardTops = destPile.reduce((acc: number[], _card, index) => {
                            if (index === 0) acc.push(0);
                            else {
                                const prevCard = destPile[index-1];
                                acc.push(acc[index-1] + (prevCard.faceUp ? cardSize.faceUpStackOffset : cardSize.faceDownStackOffset));
                            }
                            return acc;
                        }, []);
                        const topOffset = destPile.length > 0 ? cardTops[destPile.length - 1] + (destPile[destPile.length - 1].faceUp ? cardSize.faceUpStackOffset : cardSize.faceDownStackOffset) : 0;
                        const toRect = new DOMRect(parentRect.x, parentRect.y + topOffset, parentRect.width, parentRect.height);

                        triggerAnimation('tableau', i, toRect);
                        return;
                    }
                }
            }
        },
    });

    const updateCardSize = useCallback(() => {
        if (!mainContainerRef.current) return;
        const containerWidth = mainContainerRef.current.clientWidth;
        const numPiles = 7;
    
        if (layout === 'portrait') {
            const gap = 8;
            const totalGapWidth = (numPiles) * gap; // Use numPiles for outer padding
            const newCardWidth = (containerWidth - totalGapWidth) / numPiles;
            const newCardHeight = newCardWidth * CARD_ASPECT_RATIO;
            setCardSize({ width: newCardWidth, height: newCardHeight, faceUpStackOffset: newCardHeight / 5.0, faceDownStackOffset: newCardHeight / 12 });
        } else { // landscape
            const gap = 16;
            const minCardWidth = 60;
            const maxCardWidth = 100;
            const totalGapWidth = (numPiles - 1) * gap;
            let newCardWidth = (containerWidth - totalGapWidth) / numPiles;
            newCardWidth = Math.max(minCardWidth, Math.min(newCardWidth, maxCardWidth));
            const newCardHeight = newCardWidth * CARD_ASPECT_RATIO;
            setCardSize({ width: newCardWidth, height: newCardHeight, faceUpStackOffset: newCardHeight / 5.0, faceDownStackOffset: newCardHeight / 12 });
        }
    }, [layout]);

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
        setIsAnimating(false);
        setHiddenCardIds([]);
        setHint(null);
        setMoves(0);
        setTime(0);
        setHistory([]);
        setIsPaused(false);
        setRecentlyMovedFromFoundation(null);
        setTableau(Array.from({ length: 7 }, () => []));
        setStock([]);
        setWaste([]);
        setFoundations([[], [], [], []]);
        setDealAnimationCards([]);
        setShuffleClass('');
        setIsDealing(true);
    }, []);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    useEffect(() => {
        if (isDealing && mainContainerRef.current && stockRef.current && tableauRefs.current.every(ref => ref) && initialDeckRef.current) {
            let finalTableau: CardType[][];
            let finalStock: CardType[];

            if (gameMode === 'winnable') {
                const deal = generateWinnableDeal();
                finalTableau = deal.tableau;
                finalStock = deal.stock;
            } else {
                let cardId = 0;
                const fullDeck = SUITS.flatMap(suit => RANKS.map(rank => ({ id: cardId++, suit, rank, faceUp: false })));
                for (let i = fullDeck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
                }
                const deckForState = [...fullDeck];
                finalTableau = Array.from({ length: 7 }, (_, i) => deckForState.splice(0, i + 1));
                finalStock = deckForState;
                finalTableau.forEach((pile) => {
                    if (pile.length > 0) {
                        pile[pile.length - 1].faceUp = true;
                    }
                });
            }
            
            setShuffleClass('perform-shuffle');
            const dealStartTime = 800;
            const flyingCards: typeof dealAnimationCards = [];
            let dealDelay = 0;
            const dealStagger = 25;
            const fromRect = initialDeckRef.current.getBoundingClientRect();
            if (!fromRect) return;

            finalTableau.forEach((pile, pileIndex) => {
                pile.forEach((card, cardIndex) => {
                    const animatedCard = { ...card };
                    const toEl = tableauRefs.current[pileIndex];
                    if (toEl) {
                        const toRect = toEl.getBoundingClientRect();
                        const topOffset = cardIndex * cardSize.faceDownStackOffset;
                        flyingCards.push({
                            card: animatedCard, key: card.id, style: {
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
                dealDelay += dealStagger / 5;
            });
            setDealAnimationCards(flyingCards);
            setTimeout(() => {
                setTableau(finalTableau);
                setStock(finalStock);
                setIsDealing(false);
                setDealAnimationCards([]);
                setShuffleClass('');
                setTime(0);
            }, dealStartTime + dealDelay + 400);
        }
    }, [isDealing, cardSize.width, cardSize.faceDownStackOffset, layout, gameMode]);


    useEffect(() => {
        if (foundations.flat().length === 52) setIsWon(true);
    }, [foundations]);

    useEffect(() => {
        if (isPaused || isWon || isAnimating || isDealing || stockAnimationData) return;
        const timerId = setInterval(() => setTime(prevTime => prevTime + 1), 1000);
        return () => clearInterval(timerId);
    }, [isPaused, isWon, isAnimating, isDealing, stockAnimationData]);

    // Autoplay Logic
    useEffect(() => {
        if (autoplayMode === 'off' || isPaused || isAnimating || isDealing || dragGhost || isWon || stockAnimationData) return;
        const executeAutoMove = (card: CardType, source: 'waste' | 'tableau', sourcePileIndex: number, sourceCardIndex: number, destinationType: 'foundation', destinationIndex: number) => {
            const fromEl = document.querySelector(`[data-card-id="${card.id}"]`);
            if (!fromEl) return false;
            let toEl, toRect;
            if (destinationType === 'foundation') {
                toEl = foundationRefs.current[destinationIndex];
                if (toEl) toRect = toEl.getBoundingClientRect();
            } else return false;
            if (fromEl && toRect) {
                animationEndHandled.current = false;
                setHiddenCardIds([card.id]);
                setAnimationData({ cards: [card], fromRect: fromEl.getBoundingClientRect(), toRect, destinationType, destinationIndex, source, sourcePileIndex, sourceCardIndex });
                setTimeout(() => setIsAnimating(true), 10);
                return true;
            }
            return false;
        };
        const findAndExecuteFoundationMove = (): boolean => {
            const topWasteCard = waste[0];
            if (topWasteCard && topWasteCard.id !== recentlyMovedFromFoundation) {
                const foundationIndex = SUITS.indexOf(topWasteCard.suit);
                const targetPile = foundations[foundationIndex];
                const topCard = targetPile[targetPile.length - 1];
                if ((!topCard && topWasteCard.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[topWasteCard.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                    if (executeAutoMove(topWasteCard, 'waste', 0, 0, 'foundation', foundationIndex)) return true;
                }
            }
            for (let i = 0; i < tableau.length; i++) {
                const pile = tableau[i];
                const topTableauCard = pile[pile.length - 1];
                if (topTableauCard?.faceUp && topTableauCard.id !== recentlyMovedFromFoundation) {
                    const foundationIndex = SUITS.indexOf(topTableauCard.suit);
                    const targetPile = foundations[foundationIndex];
                    const topCard = targetPile[targetPile.length - 1];
                    if ((!topCard && topTableauCard.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[topTableauCard.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                        if (executeAutoMove(topTableauCard, 'tableau', i, pile.length - 1, 'foundation', foundationIndex)) return true;
                    }
                }
            }
            return false;
        };
        const isGameWinnable = stock.length === 0 && waste.length === 0 && tableau.flat().every(c => c.faceUp);
        if (autoplayMode === 'obvious') {
            const timeoutId = setTimeout(findAndExecuteFoundationMove, 50);
            return () => clearTimeout(timeoutId);
        } else if (autoplayMode === 'won' && isGameWinnable) {
            const timeoutId = setTimeout(findAndExecuteFoundationMove, 25);
            return () => clearTimeout(timeoutId);
        }
    }, [autoplayMode, tableau, waste, foundations, stock, isPaused, isAnimating, isDealing, dragGhost, isWon, stockAnimationData, recentlyMovedFromFoundation]);

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
        setRecentlyMovedFromFoundation(null);
    };

    const handleTurnModeToggle = () => setTurnMode(prev => (prev === 1 ? 3 : 1));
    const handleAutoplayModeToggle = () => setAutoplayMode(prev => prev === 'off' ? 'obvious' : prev === 'obvious' ? 'won' : 'off');

    const handleStockClick = () => {
        if (isAnimating || isPaused || isDealing || stockAnimationData) return;
        if (stock.length === 0 && waste.length === 0) return;
        setHint(null);
        setRecentlyMovedFromFoundation(null);
        saveStateToHistory();
        setMoves(prev => prev + 1);
        if (stock.length > 0) {
            const cardsToDraw = Math.min(stock.length, turnMode);
            const drawnCards = stock.slice(-cardsToDraw);
            const turnedCards = drawnCards.map(c => ({...c, faceUp: true}));
            setHiddenCardIds(turnedCards.map(c => c.id));
            setStock(prev => prev.slice(0, prev.length - cardsToDraw));
            setWaste(prev => [...turnedCards, ...prev]);
            setStockAnimationData({ type: 'turn', cards: [...drawnCards].reverse(), wasteCountBefore: waste.length });
            setTimeout(() => {
                setStockAnimationData(null);
                setHiddenCardIds([]);
            }, 500 + (drawnCards.length - 1) * 75);
        } else {
            const cardsToReset = [...waste];
            if (cardsToReset.length === 0) return;
            setWaste([]);
            setStockAnimationData({ type: 'reset', cards: cardsToReset });
            setTimeout(() => {
                const newStock = cardsToReset.map(c => ({ ...c, faceUp: false }));
                setStock(newStock);
                setStockAnimationData(null);
            }, 500 + (cardsToReset.length - 1) * 20);
        }
    };

    const findAllHints = useCallback((): HintState[] => {
        const getHintsForPriority = (priority: number): HintState[] => {
            const hints: HintState[] = [];
            const hintedCardIds = new Set<number>();
            const addHint = (cardId: number) => {
                if (!hintedCardIds.has(cardId)) {
                    hints.push({ type: 'card', cardId });
                    hintedCardIds.add(cardId);
                }
            };
            if (priority === 1) { // Move to foundation
                const topWasteCard = waste[0];
                if (topWasteCard) {
                    const foundationIndex = SUITS.indexOf(topWasteCard.suit);
                    const targetPile = foundations[foundationIndex];
                    const topCard = targetPile[targetPile.length - 1];
                    if ((!topCard && topWasteCard.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[topWasteCard.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                        addHint(topWasteCard.id);
                    }
                }
                for (const pile of tableau) {
                    const topTableauCard = pile[pile.length - 1];
                    if (topTableauCard?.faceUp) {
                        const foundationIndex = SUITS.indexOf(topTableauCard.suit);
                        const targetPile = foundations[foundationIndex];
                        const topCard = targetPile[targetPile.length - 1];
                        if ((!topCard && topTableauCard.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[topTableauCard.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                            addHint(topTableauCard.id);
                        }
                    }
                }
                return hints;
            }
            if (priority === 2) { // Uncover a face-down card
                for (const sourcePile of tableau) {
                    const firstFaceUpIndex = sourcePile.findIndex(c => c.faceUp);
                    if (firstFaceUpIndex > 0) {
                        for (let i = firstFaceUpIndex; i < sourcePile.length; i++) {
                            const cardToMove = sourcePile[i];
                            for (const destPile of tableau) {
                                if (sourcePile === destPile) continue;
                                const topDestCard = destPile[destPile.length - 1];
                                if ((!topDestCard && cardToMove.rank === Rank.KING) || (topDestCard?.faceUp && SUIT_COLOR_MAP[cardToMove.suit] !== SUIT_COLOR_MAP[topDestCard.suit] && RANK_VALUE_MAP[cardToMove.rank] === RANK_VALUE_MAP[topDestCard.rank] - 1)) {
                                    addHint(cardToMove.id);
                                }
                            }
                        }
                    }
                }
                return hints;
            }
            if (priority === 3) { // Move from waste to tableau
                const topWasteCard = waste[0];
                if (topWasteCard) {
                     for (const pile of tableau) {
                        const topCard = pile[pile.length - 1];
                        if ((!topCard && topWasteCard.rank === Rank.KING) || (topCard?.faceUp && SUIT_COLOR_MAP[topWasteCard.suit] !== SUIT_COLOR_MAP[topCard.suit] && RANK_VALUE_MAP[topWasteCard.rank] === RANK_VALUE_MAP[topCard.rank] - 1)) {
                             addHint(topWasteCard.id);
                        }
                    }
                }
                return hints;
            }
            if (priority === 4) { // Any other tableau move
                for (const sourcePile of tableau) {
                   const firstFaceUpIndex = sourcePile.findIndex(c => c.faceUp);
                    if (firstFaceUpIndex !== -1) {
                       for (let i = firstFaceUpIndex; i < sourcePile.length; i++) {
                           const cardToMove = sourcePile[i];
                           for (const destPile of tableau) {
                               if (sourcePile === destPile) continue;
                               const topDestCard = destPile[destPile.length - 1];
                                if ((!topDestCard && cardToMove.rank === Rank.KING) || (topDestCard?.faceUp && SUIT_COLOR_MAP[cardToMove.suit] !== SUIT_COLOR_MAP[topDestCard.suit] && RANK_VALUE_MAP[cardToMove.rank] === RANK_VALUE_MAP[topDestCard.rank] - 1)) {
                                   addHint(cardToMove.id);
                               }
                           }
                       }
                   }
               }
               return hints;
            }
            return [];
        };
        for (let priority = 1; priority <= 4; priority++) {
            const hints = getHintsForPriority(priority);
            if (hints.length > 0) return hints;
        }
        if (stock.length > 0 || waste.length > 0) return [{ type: 'stock' }];
        return [];
    }, [stock, waste, tableau, foundations]);

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
    
    const handleAnimationEnd = () => {
        if (!animationData || animationEndHandled.current) return;
        animationEndHandled.current = true;
        saveStateToHistory();
        setMoves(m => m + 1);
        const { cards, destinationType, destinationIndex, source, sourcePileIndex, sourceCardIndex } = animationData;
        
        // This logic is similar to onDrop, but for animated moves
        if (destinationType === 'foundation') {
            const card = cards[0]; // Foundations only take one card at a time in auto-moves
            setFoundations(f => f.map((pile, i) => i === destinationIndex ? [...pile, card] : pile));
            setFoundationFx({ index: destinationIndex, suit: card.suit });
            setTimeout(() => setFoundationFx(null), 1000);

            if (source === 'waste') setWaste(w => w.slice(1));
            else if (source === 'tableau') {
                setTableau(t => {
                    const newTableau = t.map(p => [...p]);
                    const sPile = newTableau[sourcePileIndex];
                    sPile.pop();
                    if (sPile.length > 0 && !sPile[sPile.length - 1].faceUp) {
                       sPile[sPile.length - 1] = { ...sPile[sPile.length - 1], faceUp: true };
                    }
                    return newTableau;
                });
            }
        } else if (destinationType === 'tableau') {
            if (source === 'waste') {
                setWaste(w => w.slice(cards.length));
                setTableau(t => t.map((p, i) => i === destinationIndex ? [...p, ...cards] : p));
            } else if (source === 'foundation') {
                setFoundations(f => f.map((p, i) => i === sourcePileIndex ? p.slice(0, -1) : p));
                setTableau(t => t.map((p, i) => i === destinationIndex ? [...p, ...cards] : p));
            } else { // tableau to tableau
                setTableau(t => {
                    const newTableau = t.map(p => [...p]);
                    const sPile = newTableau[sourcePileIndex];
                    const movedStack = sPile.splice(sourceCardIndex, cards.length);
                    newTableau[destinationIndex].push(...movedStack);

                    if (sPile.length > 0 && !sPile[sPile.length - 1].faceUp) {
                        sPile[sPile.length - 1] = { ...sPile[sPile.length - 1], faceUp: true };
                    }
                    return newTableau;
                });
            }
        }

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
        stock, waste, foundations, tableau, history, isWon, isRulesModalOpen, shakeCardId, pressedStack, hint, moves, time, isPaused, turnMode, autoplayMode,
        cardSize, shuffleClass, isDealing,
        dealAnimationCards, animationData, returnAnimationData, stockAnimationData, dragGhost, dragSourceInfo, hiddenCardIds, foundationFx,
        initializeGame, handleUndo, handleTurnModeToggle, handleAutoplayModeToggle, handleStockClick, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleAnimationEnd, handleReturnAnimationEnd,
        mainContainerRef, stockRef, wasteRef, foundationRefs, tableauRefs, initialDeckRef,
        Board, Card,
        formatTime,
    };
};

export type KlondikeController = ReturnType<typeof useKlondike>;

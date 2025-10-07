
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardType, Theme } from '../../types';
import { Suit, Rank } from '../../types';
import type { GameState } from './types';
import { SUITS, RANKS, RANK_VALUE_MAP, SUIT_COLOR_MAP, CARD_ASPECT_RATIO, SUIT_SYMBOL_MAP } from '../../constants';
import { useCardDrag } from '../../hooks/useCardDrag';

type AnimationState = {
  card: CardType;
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


interface UseKlondikeProps {
    theme: Theme;
}

export const useKlondike = ({ theme }: UseKlondikeProps) => {
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
            const { cards, source, sourcePileIndex } = dragInfo;
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
                            const movedStack = sPile.splice(sPile.length - cards.length, cards.length);
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

            const isTopCard = source === 'waste' || (source === 'tableau' && sourceCardIndex === tableau[sourcePileIndex].length - 1);
            if (!isTopCard) {
                const blockingCard = tableau[sourcePileIndex][sourceCardIndex + 1];
                if (blockingCard) {
                    setShakeCardId(blockingCard.id);
                    setTimeout(() => setShakeCardId(null), 400);
                }
                return;
            }

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
                        setRecentlyMovedFromFoundation(null);
                        setHiddenCardIds([card.id]);
                        setAnimationData({ card, fromRect: element.getBoundingClientRect(), toRect, destinationType: 'foundation', destinationIndex: i, source, sourcePileIndex, sourceCardIndex });
                        setTimeout(() => setIsAnimating(true), 10);
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
        const gap = 16;
        const minCardWidth = 60;
        const maxCardWidth = 100;
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
            let cardId = 0;
            const fullDeck = SUITS.flatMap(suit => RANKS.map(rank => ({ id: cardId++, suit, rank, faceUp: false })));
            for (let i = fullDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
            }
            const deckForState = [...fullDeck];
            setShuffleClass('perform-shuffle');
            const dealStartTime = 800;
            const flyingCards: typeof dealAnimationCards = [];
            let dealDelay = 0;
            const dealStagger = 25;
            const fromRect = initialDeckRef.current.getBoundingClientRect();
            if (!fromRect) return;
            const finalTableau: CardType[][] = Array.from({ length: 7 }, (_, i) => deckForState.splice(0, i + 1));
            const finalStock = deckForState;
            finalTableau.forEach((pile, pileIndex) => {
                pile.forEach((card, cardIndex) => {
                    const isLastCardInPile = cardIndex === pile.length - 1;
                    const animatedCard = { ...card, faceUp: isLastCardInPile };
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
    }, [isDealing, cardSize.width, cardSize.faceDownStackOffset]);


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
                setAnimationData({ card, fromRect: fromEl.getBoundingClientRect(), toRect, destinationType, destinationIndex, source, sourcePileIndex, sourceCardIndex });
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
            const timeoutId = setTimeout(findAndExecuteFoundationMove, 100);
            return () => clearTimeout(timeoutId);
        } else if (autoplayMode === 'won' && isGameWinnable) {
            const timeoutId = setTimeout(findAndExecuteFoundationMove, 50);
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
        const { card, destinationType, destinationIndex, source, sourcePileIndex } = animationData;
        if (destinationType === 'foundation') {
            setFoundationFx({ index: destinationIndex, suit: card.suit });
            setTimeout(() => setFoundationFx(null), 1000);
            setFoundations(prev => prev.map((p, i) => i === destinationIndex ? [...p, card] : p));
            if (source === 'waste') setWaste(prev => prev.slice(1));
            else {
                setTableau(prev => {
                    const newTableau = prev.map(p => [...p]);
                    const sPile = newTableau[sourcePileIndex];
                    sPile.pop();
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

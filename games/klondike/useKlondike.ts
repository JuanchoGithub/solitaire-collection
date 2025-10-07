
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardType, Theme } from '../../types';
import { Suit, Rank } from '../../types';
import type { DragInfo, GameState } from './types';
import { SUITS, RANKS, RANK_VALUE_MAP, SUIT_COLOR_MAP, CARD_ASPECT_RATIO, SUIT_SYMBOL_MAP } from '../../constants';

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

type ReturnAnimationData = {
    cards: CardType[];
    from: { x: number; y: number };
    toRect: DOMRect;
} | null;

type StockAnimationData = {
    type: 'turn';
    cards: CardType[];
    wasteCountBefore: number;
} | {
    type: 'reset';
    cards: CardType[];
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

type HintState = { type: 'card'; cardId: number } | { type: 'stock' } | null;


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
    const [dragSourceInfo, setDragSourceInfo] = useState<DragInfo>(null);
    const [dragGhost, setDragGhost] = useState<DragGhostState>(null);
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    const [isWon, setIsWon] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [shakeCardId, setShakeCardId] = useState<number | null>(null);
    const [pressedStack, setPressedStack] = useState<{ source: 'tableau' | 'waste' | 'foundation', sourcePileIndex: number, sourceCardIndex: number } | null>(null);
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
    const [returnAnimationData, setReturnAnimationData] = useState<ReturnAnimationData>(null);
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
        setIsWon(false);
        setDragSourceInfo(null);
        setDragGhost(null);
        setInteractionState(null);
        setIsRulesModalOpen(false);
        setAnimationData(null);
        setReturnAnimationData(null);
        setStockAnimationData(null);
        setIsAnimating(false);
        setHiddenCardIds([]);
        setPressedStack(null);
        setHint(null);
        setMoves(0);
        setTime(0);
        setHistory([]);
        setIsPaused(false);
        setRecentlyMovedFromFoundation(null);

        // Reset game state for new deal
        setTableau(Array.from({ length: 7 }, () => []));
        setStock([]);
        setWaste([]);
        setFoundations([[], [], [], []]);
        setDealAnimationCards([]);
        setShuffleClass('');

        // Start dealing animation
        setIsDealing(true);
    }, []);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    useEffect(() => {
        if (isDealing && mainContainerRef.current && stockRef.current && tableauRefs.current.every(ref => ref) && initialDeckRef.current) {
            // 1. Create and shuffle deck
            let cardId = 0;
            const fullDeck = SUITS.flatMap(suit => RANKS.map(rank => ({ id: cardId++, suit, rank, faceUp: false })));
            for (let i = fullDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
            }
            const deckForState = [...fullDeck];

            // 2. Shuffle Animation
            setShuffleClass('perform-shuffle');
            
            const dealStartTime = 800; // after shuffle animation (0.8s)
            
            // 3. Prepare dealing animation data
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
                            card: animatedCard,
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
                dealDelay += dealStagger / 5;
            });

            setDealAnimationCards(flyingCards);

            // 4. Finalize game state after animation
            setTimeout(() => {
                finalTableau.forEach(pile => {
                    if (pile.length > 0) {
                        pile[pile.length - 1].faceUp = true;
                    }
                });
                setTableau(finalTableau);
                setStock(finalStock);
                setIsDealing(false);
                setDealAnimationCards([]);
                setShuffleClass('');
                setTime(0);
            }, dealStartTime + dealDelay + 400); // 400ms is anim duration
        }
    }, [isDealing, cardSize.width]);


    useEffect(() => {
        if (foundations.flat().length === 52) {
            setIsWon(true);
        }
    }, [foundations]);

    useEffect(() => {
        if (isPaused || isWon || isAnimating || isDealing || stockAnimationData) {
            return;
        }
        const timerId = setInterval(() => {
            setTime(prevTime => prevTime + 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [isPaused, isWon, isAnimating, isDealing, stockAnimationData]);

    // Autoplay Logic
    useEffect(() => {
        if (autoplayMode === 'off' || isPaused || isAnimating || isDealing || interactionState || isWon || stockAnimationData) {
            return;
        }

        const executeAutoMove = (card: CardType, source: 'waste' | 'tableau' | 'foundation', sourcePileIndex: number, sourceCardIndex: number, destinationType: 'foundation' | 'tableau', destinationIndex: number) => {
            const fromEl = document.querySelector(`[data-card-id="${card.id}"]`);
            if (!fromEl) return false;

            let toEl;
            let toRect;

            if (destinationType === 'foundation') {
                toEl = foundationRefs.current[destinationIndex];
                if (toEl) toRect = toEl.getBoundingClientRect();
            } else {
                return false; // Not implemented for non-foundation moves
            }
            
            if (fromEl && toRect) {
                animationEndHandled.current = false;
                setHiddenCardIds([card.id]);
                setAnimationData({ card, fromRect: fromEl.getBoundingClientRect(), toRect, destinationType, destinationIndex, source, sourcePileIndex, sourceCardIndex });
                setTimeout(() => setIsAnimating(true), 10);
                return true; // Move initiated
            }
            return false;
        };

        const findAndExecuteFoundationMove = (): boolean => {
            // Check waste card first
            const topWasteCard = waste[0];
            if (topWasteCard && topWasteCard.id !== recentlyMovedFromFoundation) {
                const foundationIndex = SUITS.indexOf(topWasteCard.suit);
                const targetPile = foundations[foundationIndex];
                const topCard = targetPile[targetPile.length - 1];
                if ((!topCard && topWasteCard.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[topWasteCard.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                    if (executeAutoMove(topWasteCard, 'waste', 0, 0, 'foundation', foundationIndex)) {
                        return true;
                    }
                }
            }

            // Check tableau cards
            for (let i = 0; i < tableau.length; i++) {
                const pile = tableau[i];
                const topTableauCard = pile[pile.length - 1];
                if (topTableauCard?.faceUp && topTableauCard.id !== recentlyMovedFromFoundation) {
                    const foundationIndex = SUITS.indexOf(topTableauCard.suit);
                    const targetPile = foundations[foundationIndex];
                    const topCard = targetPile[targetPile.length - 1];
                    if ((!topCard && topTableauCard.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[topTableauCard.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                        if (executeAutoMove(topTableauCard, 'tableau', i, pile.length - 1, 'foundation', foundationIndex)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        
        const isGameWinnable = stock.length === 0 && tableau.flat().every(c => c.faceUp);

        if (autoplayMode === 'obvious') {
            const timeoutId = setTimeout(findAndExecuteFoundationMove, 100);
            return () => clearTimeout(timeoutId);
        } else if (autoplayMode === 'won' && isGameWinnable) {
            const timeoutId = setTimeout(findAndExecuteFoundationMove, 50);
            return () => clearTimeout(timeoutId);
        }

    }, [autoplayMode, tableau, waste, foundations, stock, isPaused, isAnimating, isDealing, interactionState, isWon, cardSize, stockAnimationData, recentlyMovedFromFoundation]);

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

    const handleTurnModeToggle = () => {
        setTurnMode(prev => (prev === 1 ? 3 : 1));
    };

    const handleAutoplayModeToggle = () => {
        setAutoplayMode(prev => {
            if (prev === 'off') return 'obvious';
            if (prev === 'obvious') return 'won';
            return 'off';
        });
    };

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

            // Hide cards in waste pile while they animate
            setHiddenCardIds(turnedCards.map(c => c.id));

            // Update state immediately
            setStock(prev => prev.slice(0, prev.length - cardsToDraw));
            setWaste(prev => [...turnedCards, ...prev]);

            // Set animation data. Reverse the cards for the animation so they appear to be dealt off the top correctly.
            setStockAnimationData({ type: 'turn', cards: [...drawnCards].reverse(), wasteCountBefore: waste.length });
            
            // After animation, unhide cards.
            setTimeout(() => {
                setStockAnimationData(null);
                setHiddenCardIds([]);
            }, 500 + (drawnCards.length - 1) * 75); // animation duration + total delay
        
        } else {
            const cardsToReset = [...waste];
            if (cardsToReset.length === 0) return;
            setWaste([]); // Clear waste immediately
            setStockAnimationData({ type: 'reset', cards: cardsToReset });

            setTimeout(() => {
                // The waste pile becomes the new stock. The order is preserved to maintain the card sequence cycle.
                const newStock = cardsToReset.map(c => ({ ...c, faceUp: false }));
                setStock(newStock);
                setStockAnimationData(null);
            }, 500 + (cardsToReset.length - 1) * 20); // smaller delay for faster reset animation
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
            if (hints.length > 0) {
                return hints;
            }
        }

        if (stock.length > 0 || waste.length > 0) {
            return [{ type: 'stock' }];
        }

        return [];
    }, [stock, waste, tableau, foundations]);

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
    
    // Custom Click and Drag Logic
    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        cards: CardType[],
        source: 'tableau' | 'waste' | 'foundation',
        sourcePileIndex: number,
        sourceCardIndex: number
    ) => {
        if (isAnimating || isPaused || e.button !== 0 || (cards.length > 0 && !cards[0].faceUp) || isDealing || stockAnimationData) return;
        e.preventDefault();

        if (cards.length > 0) {
            setPressedStack({ source, sourcePileIndex, sourceCardIndex });
        }
        setHint(null);

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

        let wasDrag = false;
        let moveMadeOnDrag = false;

        // --- DRAG-AND-DROP LOGIC ---
        if (dragGhost && dragSourceInfo) {
            wasDrag = true;
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
                            moveMadeOnDrag = true;
                            setRecentlyMovedFromFoundation(null);
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
                             setFoundationFx({ index: target.index, suit: movedCard.suit });
                             setTimeout(() => setFoundationFx(null), 1000);
                        }
                    }
                } else if (target.type === 'tableau') {
                    const targetPile = tableau[target.index];
                    const topTableauCard = targetPile[targetPile.length - 1] ?? null;
                    if ((!topTableauCard && movedCard.rank === Rank.KING) ||
                        (topTableauCard && topTableauCard.faceUp &&
                            SUIT_COLOR_MAP[movedCard.suit] !== SUIT_COLOR_MAP[topTableauCard.suit] &&
                            RANK_VALUE_MAP[movedCard.rank] === RANK_VALUE_MAP[topTableauCard.rank] - 1)) {
                        
                        moveMadeOnDrag = true;
                        if (source === 'foundation') {
                           setRecentlyMovedFromFoundation(movedCard.id);
                        } else {
                           setRecentlyMovedFromFoundation(null);
                        }
                        
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

            if (!moveMadeOnDrag) {
                let toRect;
                const { source, sourcePileIndex, cards } = dragSourceInfo;
                
                // The condition causing the card to unmount is when all cards in a tableau pile are dragged.
                // In this case, we use the stable parent pile element as the animation target.
                const sourcePile = source === 'tableau' ? tableau[sourcePileIndex] : undefined;

                if (source === 'tableau' && sourcePile && cards.length === sourcePile.length) {
                    const pileEl = tableauRefs.current[sourcePileIndex];
                    // If the ref is available, use its rect. Fallback to the potentially detached element's rect.
                    toRect = pileEl ? pileEl.getBoundingClientRect() : interactionState.element.getBoundingClientRect();
                } else {
                    // For all other cases (waste, foundation, partial tableau stack), the original element is still mounted.
                    toRect = interactionState.element.getBoundingClientRect();
                }

                setReturnAnimationData({
                    cards: dragGhost.cards,
                    from: { x: dragGhost.x, y: dragGhost.y },
                    toRect,
                });
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
                                setRecentlyMovedFromFoundation(null);
                                setHiddenCardIds([card.id]);
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
                                setRecentlyMovedFromFoundation(null);
                                setHiddenCardIds([card.id]);
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
        
        // Unified cleanup for both paths
        setInteractionState(null);
        setDragGhost(null);
        if (!wasDrag || moveMadeOnDrag) {
            setDragSourceInfo(null);
        }

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
            setFoundationFx({ index: destinationIndex, suit: card.suit });
            setTimeout(() => setFoundationFx(null), 1000);
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
        stock, waste, foundations, tableau, history, isWon, isRulesModalOpen, shakeCardId, pressedStack, hint, moves, time, isPaused, turnMode, autoplayMode,
        // UI State
        cardSize, shuffleClass, isDealing,
        // Animations
        dealAnimationCards, animationData, returnAnimationData, stockAnimationData, dragGhost, dragSourceInfo, hiddenCardIds, foundationFx,
        // Handlers
        initializeGame, handleUndo, handleTurnModeToggle, handleAutoplayModeToggle, handleStockClick, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleAnimationEnd, handleReturnAnimationEnd,
        // Refs
        mainContainerRef, stockRef, wasteRef, foundationRefs, tableauRefs, initialDeckRef,
        // Theme Components
        Board, Card,
        // Helpers
        formatTime,
    };
};

export type KlondikeController = ReturnType<typeof useKlondike>;

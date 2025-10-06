

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
            
            const dealStartTime = 1200; // after shuffle animation (1.2s)
            
            // 3. Prepare dealing animation data
            const flyingCards: typeof dealAnimationCards = [];
            let dealDelay = 0;
            const dealStagger = 40;

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
            }, dealStartTime + dealDelay + 500); // 500ms is anim duration
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
    
    const buttonClasses = "bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed";


    return (
        <div className={`bg-green-800 min-h-screen text-white p-4 font-sans overflow-x-hidden relative flex flex-col ${shuffleClass}`}>
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
            
            {stockAnimationData?.type === 'turn' && stockAnimationData.cards.map((card, i) => {
                const fromRect = stockRef.current?.getBoundingClientRect();
                const toRect = wasteRef.current?.getBoundingClientRect();
                if (!fromRect || !toRect) return null;

                const drawnCardsCount = stockAnimationData.cards.length;
                // This is the index from last-drawn (0) to first-drawn (drawnCardsCount - 1)
                const cardDrawIndex = drawnCardsCount - 1 - i; 

                const wasteCountAfter = stockAnimationData.wasteCountBefore + drawnCardsCount;
                const visibleWasteCount = Math.min(3, wasteCountAfter);

                // The card's final position in the visible stack (0 is bottom-most, visibleWasteCount-1 is top-most)
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

            <div className="max-w-7xl mx-auto w-full">
                <header className={`flex flex-wrap justify-between items-center gap-4 mb-4 transition-opacity duration-300 ${isDealing ? 'opacity-0' : 'opacity-100'}`}>
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
                            <div ref={stockRef} onClick={handleStockClick} className={`cursor-pointer ${hint?.type === 'stock' ? 'stock-hint' : ''}`}>
                                {stock.length > 0 ? <Card card={stock[stock.length - 1]} width={cardSize.width} height={cardSize.height} /> : <EmptyPile width={cardSize.width} height={cardSize.height}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5V4H4zm0 12v5h5v-5H4zM15 4v5h5V4h-5zm0 12v5h5v-5h-5z" /></svg>
                                </EmptyPile>}
                            </div>
                            <div ref={wasteRef} className="relative" style={{ width: cardSize.width, height: cardSize.height }}>
                                <EmptyPile width={cardSize.width} height={cardSize.height}/>
                                {(() => {
                                    // These are the cards that are *not* currently part of an animation
                                    const stationaryWasteCards = waste.filter(c => !hiddenCardIds.includes(c.id));
                                    // We only want to display up to 3 cards
                                    const displayableWaste = stationaryWasteCards.slice(0, 3);

                                    // The true top card of the entire waste pile.
                                    const trueTopCard = waste[0];

                                    return displayableWaste.map((card, index) => {
                                        // A card is interactive only if it's the true top card of the waste pile
                                        // AND it's not currently being animated (which is guaranteed by the filter above).
                                        const isInteractive = card.id === trueTopCard?.id;
                                        
                                        // The visual offset depends on the card's position in the displayed stack.
                                        const offset = (displayableWaste.length - 1 - index) * 12;

                                        return (
                                            <div key={card.id} className="absolute top-0" style={{left: `${offset}px`}}>
                                                <Card 
                                                    card={card} 
                                                    onMouseDown={(e) => isInteractive && handleMouseDown(e, [card], 'waste', 0, 0)}
                                                    width={cardSize.width} 
                                                    height={cardSize.height}
                                                    isDragging={isInteractive && dragSourceInfo?.source === 'waste'}
                                                    isPressed={isInteractive && pressedStack?.source === 'waste'}
                                                    isHinted={hint?.type === 'card' && hint.cardId === card.id}
                                                />
                                            </div>
                                        );
                                    }).reverse(); // Render from bottom to top
                                })()}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {foundations.map((pile, i) => {
                                const isTopCardDragging = dragSourceInfo?.source === 'foundation' && dragSourceInfo.sourcePileIndex === i;
                                const isTopCardPressed = !!pressedStack && pressedStack.source === 'foundation' && pressedStack.sourcePileIndex === i;
                                const topCard = pile[pile.length - 1];
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
                                                    card={topCard} 
                                                    onMouseDown={(e) => handleMouseDown(e, [topCard], 'foundation', i, pile.length - 1)} 
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
                                                {/* Cute Stars */}
                                                {Array.from({ length: 8 }).map((_, j) => {
                                                    const angle = (j / 8) * 2 * Math.PI;
                                                    const radius = 50 + Math.random() * 30;
                                                    const color = ['#fde047', '#f9a8d4', '#a7f3d0'][j % 3]; // Cute pastel colors
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
                                                {/* Cute Hearts */}
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
                    </div>

                    <div className="flex flex-nowrap gap-4 justify-center">
                        {tableau.map((pile, pileIndex) => {
// FIX: Explicitly type the accumulator in the reduce function to resolve the TypeScript error.
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
                                <div key={pileIndex} className="relative" ref={el => { tableauRefs.current[pileIndex] = el; }}>
                                    {(pile.length === 0 || areAllCardsInPileDragging) ? <EmptyPile width={cardSize.width} height={cardSize.height}/> :
                                        pile.map((card, cardIndex) => {
                                            const isCardDragging = !!dragSourceInfo && dragSourceInfo.cards.some(c => c.id === card.id);
                                            const isCardPressed = !!pressedStack && 
                                                pressedStack.source === 'tableau' && 
                                                pressedStack.sourcePileIndex === pileIndex &&
                                                cardIndex >= pressedStack.sourceCardIndex;
                                            
                                            return (hiddenCardIds.includes(card.id)) ?
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
                                                isHinted={hint?.type === 'card' && hint.cardId === card.id}
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
             <footer className={`w-full flex justify-center items-center gap-4 mt-auto pt-4 transition-opacity duration-300 ${isDealing ? 'opacity-0' : 'opacity-100'}`}>
                <button onClick={initializeGame} className={buttonClasses.replace('bg-green-700 hover:bg-green-600', 'bg-blue-600 hover:bg-blue-500')}>New Game</button>
                <button onClick={handleHint} disabled={isAnimating || isDealing || isPaused || !!stockAnimationData} className={buttonClasses}>Hint</button>
                <button onClick={() => setIsRulesModalOpen(true)} className={buttonClasses}>Rules</button>
                <div className="relative group">
                    <button onClick={handleAutoplayModeToggle} className={buttonClasses}>
                        Autoplay: <span className="capitalize">{autoplayMode}</span>
                    </button>
                    <div className="absolute bottom-full mb-2 w-60 bg-black/80 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center left-1/2 -translate-x-1/2 z-20">
                        { autoplayMode === 'off' && 'Off: No automatic moves.' }
                        { autoplayMode === 'obvious' && 'Obvious: Automatically moves cards to the foundations.' }
                        { autoplayMode === 'won' && 'Finishes the game automatically when all cards are face up.' }
                    </div>
                </div>
            </footer>
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
                    animation: deal-card-fly 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
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
                    animation: shuffle-and-fade 1.2s ease-in-out forwards;
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
                    animation: auto-move 0.5s ease-out forwards;
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
                .stock-hint > div { /* Target the inner card or empty pile */
                    animation: pulse-gold 1.5s infinite ease-in-out;
                    border-radius: 0.5rem; /* Ensure shadow follows rounded corners */
                }

                /* Cuter Foundation Card Effect */
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


                /* Stock/Waste Animation Styles */
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
        </div>
    );
};

export default App;
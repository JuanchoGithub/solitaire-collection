
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardType, Theme } from '../../types';
import { Suit, Rank } from '../../types';
import type { GameState } from './types';
import { SUITS, RANKS, RANK_VALUE_MAP, CARD_ASPECT_RATIO, SUIT_COLOR_MAP, SUIT_SYMBOL_MAP } from '../../constants';
import { useCardDrag } from '../../hooks/useCardDrag';

type AnimationState = {
    cards: CardType[];
    fromRect: DOMRect;
    toRect: DOMRect;
    destinationType: 'tableau' | 'foundation' | 'freecell';
    destinationIndex: number;
    source: 'tableau' | 'freecell';
    sourceIndex: number;
} | null;

type HintState = { type: 'card'; cardId: number } | null;

type DragSource = 'tableau' | 'freecell';
type DropTarget = 'tableau' | 'foundation' | 'freecell';

interface UseFreecellProps {
    theme: Theme;
}

export const useFreecell = ({ theme }: UseFreecellProps) => {
    const { Board, Card } = theme;

    // Core Game State
    const [freecells, setFreecells] = useState<(CardType | null)[]>(Array(4).fill(null));
    const [foundations, setFoundations] = useState<CardType[][]>([[], [], [], []]);
    const [tableau, setTableau] = useState<CardType[][]>(Array.from({ length: 8 }, () => []));
    const [history, setHistory] = useState<GameState[]>([]);

    // UI & Interaction State
    const [isWon, setIsWon] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [hint, setHint] = useState<HintState>(null);
    const [allHints, setAllHints] = useState<HintState[]>([]);
    const [hintIndex, setHintIndex] = useState<number>(-1);
    
    // Gameplay Stats
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [autoplayMode, setAutoplayMode] = useState<'off' | 'auto' | 'win'>('auto');

    // Responsive Sizing
    const [cardSize, setCardSize] = useState({ width: 90, height: 126, faceUpStackOffset: 25 });
    const mainContainerRef = useRef<HTMLElement>(null);

    // Animation state
    const [isDealing, setIsDealing] = useState(true);
    const [dealAnimationCards, setDealAnimationCards] = useState<{ card: CardType; style: React.CSSProperties; key: number }[]>([]);
    const [shuffleClass, setShuffleClass] = useState('');
    const [animationData, setAnimationData] = useState<AnimationState>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hiddenCardIds, setHiddenCardIds] = useState<number[]>([]);
    const [foundationFx, setFoundationFx] = useState<{ index: number; suit: Suit } | null>(null);
    const animationEndHandled = useRef(false);
    const hintTimeoutRef = useRef<number | null>(null);


    // Refs for positions
    const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);
    const freecellRefs = useRef<(HTMLDivElement | null)[]>([]);
    const initialDeckRef = useRef<HTMLDivElement | null>(null);

    // Card Drag Engine
    const { dragSourceInfo, dragGhost, returnAnimationData, pressedStack, handleMouseDown, handleReturnAnimationEnd } = useCardDrag<DragSource, DropTarget>({
        isInteractionDisabled: isAnimating || isPaused || isDealing,
        onDragStart: () => {
            setHint(null);
            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        },
        getDraggableCards: (source, sourceIndex, sourceCardIndex) => {
            if (source === 'tableau') {
                const pile = tableau[sourceIndex];
                const clickedCard = pile[sourceCardIndex];
                if (!clickedCard) return null;

                const stack = pile.slice(sourceCardIndex);
                for (let i = 0; i < stack.length - 1; i++) {
                    if (SUIT_COLOR_MAP[stack[i].suit] === SUIT_COLOR_MAP[stack[i+1].suit] || RANK_VALUE_MAP[stack[i].rank] !== RANK_VALUE_MAP[stack[i+1].rank] + 1) {
                        return null; // Invalid stack
                    }
                }
                const emptyFreecells = freecells.filter(c => c === null).length;
                const emptyTableaus = tableau.filter(p => p.length === 0).length;
                const maxMoveSize = (1 + emptyFreecells) * (2 ** emptyTableaus);
                if (stack.length > maxMoveSize) return null;
                return stack;

            } else { // 'freecell'
                const card = freecells[sourceIndex];
                return card ? [card] : null;
            }
        },
        findDropTarget: (x, y) => {
            for (let i = 0; i < 4; i++) {
                const fRect = foundationRefs.current[i]?.getBoundingClientRect();
                if (fRect && x > fRect.left && x < fRect.right && y > fRect.top && y < fRect.bottom) return { type: 'foundation', index: i };
                const cRect = freecellRefs.current[i]?.getBoundingClientRect();
                if (cRect && x > cRect.left && x < cRect.right && y > cRect.top && y < cRect.bottom) return { type: 'freecell', index: i };
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
            const card = cards[0];
            let moveMade = false;
            
            const executeMove = (destType: DropTarget, destIndex: number) => {
                saveStateToHistory();
                setMoves(m => m + 1);
                if (source === 'tableau') setTableau(prev => prev.map((p, i) => i === sourcePileIndex ? p.slice(0, -cards.length) : p));
                else setFreecells(prev => prev.map((c, i) => i === sourcePileIndex ? null : c));

                if (destType === 'tableau') setTableau(prev => prev.map((p, i) => i === destIndex ? [...p, ...cards] : p));
                else if (destType === 'foundation') {
                    setFoundations(prev => prev.map((p, i) => i === destIndex ? [...p, ...cards] : p));
                    setFoundationFx({ index: destIndex, suit: cards[0].suit });
                    setTimeout(() => setFoundationFx(null), 1000);
                } else setFreecells(prev => prev.map((c, i) => i === destIndex ? cards[0] : c));
                moveMade = true;
            };

            if (target.type === 'foundation' && cards.length === 1) {
                const fPile = foundations[target.index];
                const topCard = fPile[fPile.length - 1];
                if (card.suit === SUITS[target.index] && ((!topCard && card.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] + 1))) {
                    executeMove('foundation', target.index);
                }
            } else if (target.type === 'freecell' && cards.length === 1 && freecells[target.index] === null) {
                executeMove('freecell', target.index);
            } else if (target.type === 'tableau') {
                const tPile = tableau[target.index];
                const topCard = tPile[tPile.length - 1];
                if ((!topCard) || (SUIT_COLOR_MAP[card.suit] !== SUIT_COLOR_MAP[topCard.suit] && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] - 1)) {
                    executeMove('tableau', target.index);
                }
            }
            return moveMade;
        },
        onClick: (source, sourceIndex, sourceCardIndex, cards, element) => {
            if (cards.length !== 1) return;
            setHint(null);
            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
            const card = cards[0];
            
            const triggerAnimation = (destinationType: 'foundation' | 'tableau' | 'freecell', destinationIndex: number, toRect: DOMRect) => {
                animationEndHandled.current = false;
                setHiddenCardIds(cards.map(c => c.id));
                setAnimationData({ cards, fromRect: element.getBoundingClientRect(), toRect, destinationType, destinationIndex, source, sourceIndex });
                setIsAnimating(true);
            };

            // Priority 1: Move to Foundation
            const fIndex = SUITS.indexOf(card.suit);
            const fPile = foundations[fIndex];
            const topFoundationCard = fPile[fPile.length - 1];
            if ((!topFoundationCard && card.rank === Rank.ACE) || (topFoundationCard && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topFoundationCard.rank] + 1)) {
                const toRect = foundationRefs.current[fIndex]?.getBoundingClientRect();
                if (toRect) {
                    triggerAnimation('foundation', fIndex, toRect);
                    return;
                }
            }
            
            // Priority 2: Move to another Tableau pile (building on a card)
            for (let i = 0; i < tableau.length; i++) {
                if (source === 'tableau' && sourceIndex === i) continue;
                const destPile = tableau[i];
                const topTableauCard = destPile[destPile.length - 1];
                if (topTableauCard && SUIT_COLOR_MAP[card.suit] !== SUIT_COLOR_MAP[topTableauCard.suit] && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topTableauCard.rank] - 1) {
                    const toEl = tableauRefs.current[i];
                    if (toEl) {
                        const parentRect = toEl.getBoundingClientRect();
                        const topOffset = destPile.length * cardSize.faceUpStackOffset;
                        const toRect = new DOMRect(parentRect.x, parentRect.y + topOffset, cardSize.width, cardSize.height);
                        triggerAnimation('tableau', i, toRect);
                        return;
                    }
                }
            }
            
            // Priority 3: Move to an empty Tableau pile
            const emptyTableauIndex = tableau.findIndex((p, i) => p.length === 0 && !(source === 'tableau' && sourceIndex === i));
            if (emptyTableauIndex !== -1) {
                const toEl = tableauRefs.current[emptyTableauIndex];
                if (toEl) {
                    const toRect = toEl.getBoundingClientRect();
                    triggerAnimation('tableau', emptyTableauIndex, toRect);
                    return;
                }
            }

            // Priority 4 (Last Resort): Move to an empty freecell (if from tableau)
            if (source === 'tableau') {
                const emptyCellIndex = freecells.findIndex(c => c === null);
                if (emptyCellIndex !== -1) {
                    const toRect = freecellRefs.current[emptyCellIndex]?.getBoundingClientRect();
                    if (toRect) {
                        triggerAnimation('freecell', emptyCellIndex, toRect);
                        return;
                    }
                }
            }
        },
    });

     const updateCardSize = useCallback(() => {
        if (!mainContainerRef.current) return;
        const containerWidth = mainContainerRef.current.clientWidth;
        const numPiles = 8;
        const gap = 12;
        const minCardWidth = 60;
        const maxCardWidth = 95;
        const totalGapWidth = (numPiles - 1) * gap;
        let newCardWidth = (containerWidth - totalGapWidth) / numPiles;
        newCardWidth = Math.max(minCardWidth, Math.min(newCardWidth, maxCardWidth));
        const newCardHeight = newCardWidth * CARD_ASPECT_RATIO;
        setCardSize({ width: newCardWidth, height: newCardHeight, faceUpStackOffset: newCardHeight / 5.0 });
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
        setIsAnimating(false);
        setHiddenCardIds([]);
        setHint(null);
        setMoves(0);
        setTime(0);
        setHistory([]);
        setIsPaused(false);
        setTableau(Array.from({ length: 8 }, () => []));
        setFreecells(Array(4).fill(null));
        setFoundations([[], [], [], []]);
        setDealAnimationCards([]);
        setShuffleClass('');
        setIsDealing(true);
    }, []);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    useEffect(() => {
        if (isDealing && mainContainerRef.current && tableauRefs.current.every(ref => ref) && initialDeckRef.current) {
            let cardId = 0;
            const fullDeck = SUITS.flatMap(suit => RANKS.map(rank => ({ id: cardId++, suit, rank, faceUp: true })));
            for (let i = fullDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
            }
            const deckForState = [...fullDeck];
            setShuffleClass('perform-shuffle');
            const dealStartTime = 800;
            const flyingCards: typeof dealAnimationCards = [];
            let dealDelay = 0;
            const dealStagger = 15;
            const fromRect = initialDeckRef.current.getBoundingClientRect();
            const finalTableau: CardType[][] = Array.from({ length: 8 }, () => []);
            deckForState.forEach((card, i) => finalTableau[i % 8].push(card));
            finalTableau.forEach((pile, pileIndex) => {
                pile.forEach((card, cardIndex) => {
                    const toEl = tableauRefs.current[pileIndex];
                    if (toEl) {
                        const toRect = toEl.getBoundingClientRect();
                        const topOffset = cardIndex * cardSize.faceUpStackOffset;
                        flyingCards.push({
                            card, key: card.id, style: {
                                '--from-top': `${fromRect.top}px`, '--from-left': `${fromRect.left}px`,
                                '--to-top': `${toRect.top + topOffset}px`, '--to-left': `${toRect.left}px`,
                                animationDelay: `${dealStartTime + dealDelay}ms`,
                            } as React.CSSProperties
                        });
                        dealDelay += dealStagger;
                    }
                });
            });
            setDealAnimationCards(flyingCards);
            setTimeout(() => {
                setTableau(finalTableau);
                setIsDealing(false);
                setDealAnimationCards([]);
                setShuffleClass('');
                setTime(0);
            }, dealStartTime + dealDelay + 400);
        }
    }, [isDealing, cardSize.width, cardSize.faceUpStackOffset]);

    useEffect(() => {
        if (foundations.flat().length === 52) setIsWon(true);
    }, [foundations]);

     useEffect(() => {
        if (isPaused || isWon || isAnimating || isDealing) return;
        const timerId = setInterval(() => setTime(prevTime => prevTime + 1), 1000);
        return () => clearInterval(timerId);
    }, [isPaused, isWon, isAnimating, isDealing]);

    // Autoplay Logic
    useEffect(() => {
        if (autoplayMode === 'off' || isPaused || isAnimating || isDealing || dragGhost || isWon) return;
        const executeAutoMove = (card: CardType, source: 'freecell' | 'tableau', sourceIndex: number, destinationType: 'foundation', destinationIndex: number) => {
            const sourceEl = document.querySelector(`[data-card-id="${card.id}"]`);
            const destEl = foundationRefs.current[destinationIndex];
            if (!sourceEl || !destEl) return false;
            animationEndHandled.current = false;
            setHiddenCardIds([card.id]);
            setAnimationData({
                cards: [card], fromRect: sourceEl.getBoundingClientRect(), toRect: destEl.getBoundingClientRect(),
                destinationType, destinationIndex, source, sourceIndex
            });
            setIsAnimating(true);
            return true;
        };
        const findAndExecuteFoundationMove = (): boolean => {
            for (let i = 0; i < freecells.length; i++) {
                const card = freecells[i];
                if (card) {
                    const fIndex = SUITS.indexOf(card.suit);
                    const fPile = foundations[fIndex];
                    const topCard = fPile.length > 0 ? fPile[fPile.length - 1] : null;
                    if ((!topCard && card.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                        if (executeAutoMove(card, 'freecell', i, 'foundation', fIndex)) return true;
                    }
                }
            }
            for (let i = 0; i < tableau.length; i++) {
                const pile = tableau[i];
                const card = pile.length > 0 ? pile[pile.length - 1] : null;
                if (card) {
                    const fIndex = SUITS.indexOf(card.suit);
                    const fPile = foundations[fIndex];
                    const topCard = fPile.length > 0 ? fPile[fPile.length - 1] : null;
                    if ((!topCard && card.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                        if (executeAutoMove(card, 'tableau', i, 'foundation', fIndex)) return true;
                    }
                }
            }
            return false;
        };
        if (autoplayMode === 'auto') {
            const timeoutId = setTimeout(findAndExecuteFoundationMove, 50);
            return () => clearTimeout(timeoutId);
        } else if (autoplayMode === 'win') {
            const intervalId = setInterval(() => { if (!findAndExecuteFoundationMove()) clearInterval(intervalId); }, 50);
            return () => clearInterval(intervalId);
        }
    }, [autoplayMode, tableau, freecells, foundations, isPaused, isAnimating, isDealing, dragGhost, isWon]);

    const saveStateToHistory = () => {
        setHistory(prev => [...prev, { freecells, foundations, tableau, moves }]);
    };
    
    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setFreecells(lastState.freecells);
        setFoundations(lastState.foundations);
        setTableau(lastState.tableau);
        setMoves(lastState.moves);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleAutoplayModeToggle = () => setAutoplayMode(prev => prev === 'off' ? 'auto' : prev === 'auto' ? 'win' : 'off');

    const findAllHints = useCallback((): HintState[] => {
        const hints: { hint: HintState, priority: number }[] = [];
        const hintedCardIds = new Set<number>();

        const addHint = (cardId: number, priority: number) => {
            if (!hintedCardIds.has(cardId)) {
                hints.push({ hint: { type: 'card', cardId }, priority });
                hintedCardIds.add(cardId);
            }
        };

        // --- Find all possible moves ---
        
        // 1. Tableau/Freecell to Foundation (Priority 0)
        let foundationChanged = true;
        const tempFoundations = foundations.map(p => [...p]);
        while (foundationChanged) {
            foundationChanged = false;
            const checkAndAddFoundationMove = (card: CardType) => {
                const fIndex = SUITS.indexOf(card.suit);
                const fPile = tempFoundations[fIndex];
                const topCard = fPile[fPile.length - 1];
                if ((!topCard && card.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] + 1)) {
                    if (!tempFoundations.flat().some(c => c.id === card.id)) {
                        addHint(card.id, 0);
                        fPile.push(card);
                        foundationChanged = true;
                    }
                }
            };
            freecells.forEach(card => card && checkAndAddFoundationMove(card));
            tableau.forEach(pile => pile.length > 0 && checkAndAddFoundationMove(pile[pile.length - 1]));
        }

        // 2. Other moves (Priorities 1 and 2)
        const emptyFreecells = freecells.filter(c => c === null).length;
        
        // From Tableau
        for (let sourcePileIndex = 0; sourcePileIndex < tableau.length; sourcePileIndex++) {
            const sourcePile = tableau[sourcePileIndex];
            if (sourcePile.length === 0) continue;

            for (let cardIndex = sourcePile.length - 1; cardIndex >= 0; cardIndex--) {
                const stack = sourcePile.slice(cardIndex);
                let isStackValid = true;
                for(let k = 0; k < stack.length - 1; k++) {
                    if(SUIT_COLOR_MAP[stack[k].suit] === SUIT_COLOR_MAP[stack[k+1].suit] || RANK_VALUE_MAP[stack[k].rank] !== RANK_VALUE_MAP[stack[k+1].rank] + 1) {
                        isStackValid = false;
                        break;
                    }
                }
                if (!isStackValid) continue;

                const cardToMove = stack[0];

                // To other Tableau piles
                for (let destPileIndex = 0; destPileIndex < tableau.length; destPileIndex++) {
                     if (sourcePileIndex === destPileIndex) continue;
                    const destPile = tableau[destPileIndex];
                    const emptyTableaus = tableau.filter(p => p.length === 0).length;
                    const emptyTableausForMove = destPile.length === 0 ? Math.max(0, emptyTableaus - 1) : emptyTableaus;
                    const maxMoveSize = (1 + emptyFreecells) * (2 ** emptyTableausForMove);
                    
                    if (stack.length > maxMoveSize) continue;

                    const topDestCard = destPile[destPile.length - 1];
                    if (!topDestCard || (SUIT_COLOR_MAP[cardToMove.suit] !== SUIT_COLOR_MAP[topDestCard.suit] && RANK_VALUE_MAP[cardToMove.rank] === RANK_VALUE_MAP[topDestCard.rank] - 1)) {
                        addHint(cardToMove.id, 1);
                    }
                }

                // To Freecell (only top card of a stack)
                if (stack.length === 1 && emptyFreecells > 0) {
                     addHint(cardToMove.id, 2);
                }
            }
        }

        // From Freecells to Tableau
        for (const card of freecells) {
            if (card) {
                for (const pile of tableau) {
                    const topCard = pile[pile.length - 1];
                     if (!topCard || (SUIT_COLOR_MAP[card.suit] !== SUIT_COLOR_MAP[topCard.suit] && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] - 1)) {
                        addHint(card.id, 1);
                    }
                }
            }
        }

        return hints.sort((a, b) => a.priority - b.priority).map(item => item.hint!);

    }, [freecells, foundations, tableau]);

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
        const { cards, destinationType, destinationIndex, source, sourceIndex } = animationData;
        
        if (source === 'tableau') {
            setTableau(prev => prev.map((p, i) => i === sourceIndex ? p.slice(0, p.length - cards.length) : p));
        } else { // source === 'freecell'
            setFreecells(prev => prev.map((c, i) => i === sourceIndex ? null : c));
        }
        
        if (destinationType === 'foundation') {
            setFoundations(prev => prev.map((p, i) => i === destinationIndex ? [...p, ...cards] : p));
            setFoundationFx({ index: destinationIndex, suit: cards[0].suit });
            setTimeout(() => setFoundationFx(null), 1000);
        } else if (destinationType === 'freecell') {
            setFreecells(prev => prev.map((c, i) => i === destinationIndex ? cards[0] : c));
        } else if (destinationType === 'tableau') {
            setTableau(prev => prev.map((p, i) => i === destinationIndex ? [...p, ...cards] : p));
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
        freecells, foundations, tableau, history, isWon, isRulesModalOpen, pressedStack, hint, moves, time, isPaused, autoplayMode,
        cardSize, shuffleClass, isDealing,
        dealAnimationCards, animationData, returnAnimationData, dragGhost, dragSourceInfo, hiddenCardIds, foundationFx,
        initializeGame, handleUndo, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleReturnAnimationEnd, handleAnimationEnd, handleAutoplayModeToggle,
        mainContainerRef, foundationRefs, tableauRefs, freecellRefs, initialDeckRef,
        Board, Card,
        formatTime,
    };
};

export type FreecellController = ReturnType<typeof useFreecell>;

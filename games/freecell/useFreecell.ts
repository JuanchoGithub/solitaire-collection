
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardType, Theme } from '../../types';
import { Suit, Rank } from '../../types';
import type { GameState, DragInfo } from './types';
import { SUITS, RANKS, RANK_VALUE_MAP, CARD_ASPECT_RATIO, SUIT_COLOR_MAP, SUIT_SYMBOL_MAP } from '../../constants';

type AnimationState = {
    cards: CardType[];
    fromRect: DOMRect;
    toRect: DOMRect;
    destinationType: 'tableau' | 'foundation' | 'freecell';
    destinationIndex: number;
} | null;

type ReturnAnimationData = {
    cards: CardType[];
    from: { x: number; y: number };
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
    source: 'tableau' | 'freecell';
    sourceIndex: number;
    element: HTMLDivElement;
} | null;

type HintState = { type: 'card'; cardId: number } | null;


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
    const [dragSourceInfo, setDragSourceInfo] = useState<DragInfo>(null);
    const [dragGhost, setDragGhost] = useState<DragGhostState>(null);
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    const [isWon, setIsWon] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    // FIX: Update pressedStack state to include optional cardIndex for tableau stacks.
    const [pressedStack, setPressedStack] = useState<{ source: 'tableau' | 'freecell', sourceIndex: number, cardIndex?: number } | null>(null);
    const [hint, setHint] = useState<HintState>(null);
    const [allHints, setAllHints] = useState<HintState[]>([]);
    const [hintIndex, setHintIndex] = useState<number>(-1);
    
    // Gameplay Stats
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Responsive Sizing
    const [cardSize, setCardSize] = useState({ width: 90, height: 126, faceUpStackOffset: 25 });
    const mainContainerRef = useRef<HTMLElement>(null);

    // Animation state
    const [isDealing, setIsDealing] = useState(true);
    const [dealAnimationCards, setDealAnimationCards] = useState<{ card: CardType; style: React.CSSProperties; key: number }[]>([]);
    const [shuffleClass, setShuffleClass] = useState('');
    const [animationData, setAnimationData] = useState<AnimationState>(null);
    const [returnAnimationData, setReturnAnimationData] = useState<ReturnAnimationData>(null);
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

        setCardSize({
            width: newCardWidth,
            height: newCardHeight,
            faceUpStackOffset: newCardHeight / 5.0,
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
        setIsAnimating(false);
        setHiddenCardIds([]);
        setPressedStack(null);
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
            deckForState.forEach((card, i) => {
                finalTableau[i % 8].push(card);
            });

            finalTableau.forEach((pile, pileIndex) => {
                pile.forEach((card, cardIndex) => {
                    const toEl = tableauRefs.current[pileIndex];
                    if (toEl) {
                        const toRect = toEl.getBoundingClientRect();
                        const topOffset = cardIndex * cardSize.faceUpStackOffset;
                        flyingCards.push({
                            card,
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

            setDealAnimationCards(flyingCards);

            setTimeout(() => {
                setTableau(finalTableau);
                setIsDealing(false);
                setDealAnimationCards([]);
                setShuffleClass('');
                setTime(0);
            }, dealStartTime + dealDelay + 400);
        }
    }, [isDealing, cardSize.width]);

    useEffect(() => {
        if (foundations.flat().length === 52) {
            setIsWon(true);
        }
    }, [foundations]);

     useEffect(() => {
        if (isPaused || isWon || isAnimating || isDealing) {
            return;
        }
        const timerId = setInterval(() => {
            setTime(prevTime => prevTime + 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [isPaused, isWon, isAnimating, isDealing]);


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

    const handleHint = useCallback(() => {
        // Simple hint logic for now: find any valid move.
        // TODO: A more advanced hint system could be implemented.
        for (const [cellIndex, card] of freecells.entries()) {
            if (card) {
                // Check foundations
                const fIndex = SUITS.indexOf(card.suit);
                const fTop = foundations[fIndex][foundations[fIndex].length - 1];
                if ((!fTop && card.rank === Rank.ACE) || (fTop && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[fTop.rank] + 1)) {
                    setHint({ type: 'card', cardId: card.id });
                    setTimeout(() => setHint(null), 2000);
                    return;
                }
            }
        }

        for (const [pileIndex, pile] of tableau.entries()) {
            const card = pile[pile.length - 1];
            if (card) {
                 // Check foundations
                const fIndex = SUITS.indexOf(card.suit);
                const fTop = foundations[fIndex][foundations[fIndex].length - 1];
                if ((!fTop && card.rank === Rank.ACE) || (fTop && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[fTop.rank] + 1)) {
                    setHint({ type: 'card', cardId: card.id });
                    setTimeout(() => setHint(null), 2000);
                    return;
                }
            }
        }
    }, [freecells, foundations, tableau]);

    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        cards: CardType[],
        source: 'tableau' | 'freecell',
        sourceIndex: number
    ) => {
        if (isAnimating || isPaused || e.button !== 0 || isDealing) return;
        e.preventDefault();

        let cardIndexInPile: number | undefined;
        if (source === 'tableau') {
            const pile = tableau[sourceIndex];
            const clickedCardIndex = pile.findIndex(c => c.id === cards[0].id);
            cardIndexInPile = clickedCardIndex;

            // Check if stack is valid
            for (let i = clickedCardIndex; i < pile.length - 1; i++) {
                if (SUIT_COLOR_MAP[pile[i].suit] === SUIT_COLOR_MAP[pile[i+1].suit] || RANK_VALUE_MAP[pile[i].rank] !== RANK_VALUE_MAP[pile[i+1].rank] + 1) {
                    return; // Invalid stack
                }
            }

            // Check if stack size is movable
            const emptyFreecells = freecells.filter(c => c === null).length;
            const emptyTableaus = tableau.filter(p => p.length === 0).length;
            const maxMoveSize = (1 + emptyFreecells) * (2 ** emptyTableaus);

            if (cards.length > maxMoveSize) {
                return; // Stack too large to move
            }
        }

        setPressedStack({ source, sourceIndex, cardIndex: cardIndexInPile });
        setHint(null);
        setInteractionState({
            startX: e.clientX,
            startY: e.clientY,
            cards,
            source,
            sourceIndex,
            element: e.currentTarget,
        });
    };
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!interactionState) return;

        if (dragGhost) {
            setDragGhost(g => g ? { ...g, x: e.clientX - g.offsetX, y: e.clientY - g.offsetY } : null);
            return;
        }

        if (Math.hypot(e.clientX - interactionState.startX, e.clientY - interactionState.startY) > 5) {
            setPressedStack(null);
            setDragSourceInfo({ cards: interactionState.cards, source: interactionState.source, sourceIndex: interactionState.sourceIndex });
            const rect = interactionState.element.getBoundingClientRect();
            setDragGhost({
                cards: interactionState.cards,
                x: e.clientX - (interactionState.startX - rect.left),
                y: e.clientY - (interactionState.startY - rect.top),
                offsetX: interactionState.startX - rect.left,
                offsetY: interactionState.startY - rect.top,
            });
        }
    }, [interactionState, dragGhost]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!interactionState) return;
        setPressedStack(null);
        const { cards, source, sourceIndex } = interactionState;

        const moveCards = (
            destType: 'tableau' | 'foundation' | 'freecell',
            destIndex: number
        ) => {
            saveStateToHistory();
            setMoves(m => m + 1);

            // Remove from source
            if (source === 'tableau') {
                setTableau(prev => prev.map((p, i) => i === sourceIndex ? p.slice(0, -cards.length) : p));
            } else { // freecell
                setFreecells(prev => prev.map((c, i) => i === sourceIndex ? null : c));
            }

            // Add to destination
            if (destType === 'tableau') {
                setTableau(prev => prev.map((p, i) => i === destIndex ? [...p, ...cards] : p));
            } else if (destType === 'foundation') {
                setFoundations(prev => prev.map((p, i) => i === destIndex ? [...p, ...cards] : p));
                setFoundationFx({ index: destIndex, suit: cards[0].suit });
                setTimeout(() => setFoundationFx(null), 1000);
            } else { // freecell
                setFreecells(prev => prev.map((c, i) => i === destIndex ? cards[0] : c));
            }
        };

        if (dragGhost) {
            const findDropTarget = (x: number, y: number): { type: 'tableau' | 'foundation' | 'freecell', index: number } | null => {
                for (let i = 0; i < 4; i++) {
                    const fRect = foundationRefs.current[i]?.getBoundingClientRect();
                    if (fRect && x > fRect.left && x < fRect.right && y > fRect.top && y < fRect.bottom) return { type: 'foundation', index: i };
                    const cRect = freecellRefs.current[i]?.getBoundingClientRect();
                    if (cRect && x > cRect.left && x < cRect.right && y > cRect.top && y < cRect.bottom) return { type: 'freecell', index: i };
                }
                for (let i = tableauRefs.current.length - 1; i >= 0; i--) {
                    const tRect = tableauRefs.current[i]?.getBoundingClientRect();
                    if (tRect && x > tRect.left && x < tRect.right && y > tRect.top && y < tRect.bottom) return { type: 'tableau', index: i };
                }
                return null;
            };

            const target = findDropTarget(e.clientX, e.clientY);
            let moveMade = false;

            if (target) {
                const card = cards[0];
                if (target.type === 'foundation' && cards.length === 1) {
                    const fPile = foundations[target.index];
                    const topCard = fPile[fPile.length - 1];
                    if (card.suit === SUITS[target.index] && ((!topCard && card.rank === Rank.ACE) || (topCard && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] + 1))) {
                        moveCards('foundation', target.index);
                        moveMade = true;
                    }
                } else if (target.type === 'freecell' && cards.length === 1 && freecells[target.index] === null) {
                    moveCards('freecell', target.index);
                    moveMade = true;
                } else if (target.type === 'tableau') {
                    const tPile = tableau[target.index];
                    const topCard = tPile[tPile.length - 1];
                    if ((!topCard) || (SUIT_COLOR_MAP[card.suit] !== SUIT_COLOR_MAP[topCard.suit] && RANK_VALUE_MAP[card.rank] === RANK_VALUE_MAP[topCard.rank] - 1)) {
                        moveCards('tableau', target.index);
                        moveMade = true;
                    }
                }
            }
            if (!moveMade) {
                 setReturnAnimationData({ cards, from: { x: dragGhost.x, y: dragGhost.y }, toRect: interactionState.element.getBoundingClientRect() });
            }
        }
        
        setInteractionState(null);
        setDragGhost(null);
        setDragSourceInfo(null);
    }, [interactionState, dragGhost, tableau, foundations, freecells]);
    
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
        freecells, foundations, tableau, history, isWon, isRulesModalOpen, pressedStack, hint, moves, time, isPaused,
        // UI State
        cardSize, shuffleClass, isDealing,
        // Animations
        dealAnimationCards, animationData, returnAnimationData, dragGhost, dragSourceInfo, hiddenCardIds, foundationFx,
        // Handlers
        initializeGame, handleUndo, handleHint, setIsRulesModalOpen, setIsPaused, handleMouseDown, handleReturnAnimationEnd,
        // Refs
        mainContainerRef, foundationRefs, tableauRefs, freecellRefs, initialDeckRef,
        // Theme Components
        Board, Card,
        // Helpers
        formatTime,
    };
};

export type FreecellController = ReturnType<typeof useFreecell>;

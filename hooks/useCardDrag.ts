import React, { useState, useCallback, useEffect } from 'react';
import type { CardType } from '../types';

type LayoutMode = 'landscape' | 'portrait';

export const useResponsiveLayout = () => {
    const [layout, setLayout] = useState<LayoutMode>('landscape');

    useEffect(() => {
        const checkLayout = () => {
            const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            const isTall = window.innerHeight / window.innerWidth > 1.1;
            
            if ((isTouchDevice && isTall) || window.innerWidth < 640) {
                setLayout('portrait');
            } else {
                setLayout('landscape');
            }
        };

        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    return { layout };
};


export type DragInfo<S extends string> = {
  cards: CardType[];
  source: S;
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

type InteractionState<S extends string> = {
    startX: number;
    startY: number;
    cards: CardType[];
    source: S;
    sourcePileIndex: number;
    sourceCardIndex: number;
    element: HTMLDivElement;
    initialRect: DOMRect;
} | null;

type ReturnAnimationData = {
    cards: CardType[];
    from: { x: number; y: number };
    toRect: DOMRect;
} | null;

type PressedStack<S extends string> = { 
    source: S;
    sourcePileIndex: number;
    sourceCardIndex: number;
} | null;

interface UseCardDragProps<S extends string, T extends string> {
    isInteractionDisabled: boolean;
    getDraggableCards: (source: S, sourcePileIndex: number, sourceCardIndex: number) => CardType[] | null;
    findDropTarget: (x: number, y: number) => { type: T; index: number } | null;
    onDrop: (dragInfo: NonNullable<DragInfo<S>>, target: { type: T; index: number }) => boolean;
    onClick?: (source: S, sourcePileIndex: number, sourceCardIndex: number, cards: CardType[], element: HTMLElement) => void;
    onDragStart?: () => void;
}

export const useCardDrag = <S extends string, T extends string>({
    isInteractionDisabled,
    getDraggableCards,
    findDropTarget,
    onDrop,
    onClick,
    onDragStart,
}: UseCardDragProps<S, T>) => {
    const [dragSourceInfo, setDragSourceInfo] = useState<DragInfo<S>>(null);
    const [dragGhost, setDragGhost] = useState<DragGhostState>(null);
    const [interactionState, setInteractionState] = useState<InteractionState<S>>(null);
    const [returnAnimationData, setReturnAnimationData] = useState<ReturnAnimationData>(null);
    const [pressedStack, setPressedStack] = useState<PressedStack<S>>(null);

    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        source: S,
        sourcePileIndex: number,
        sourceCardIndex: number
    ) => {
        if (isInteractionDisabled || e.button !== 0) return;
        
        const draggableCards = getDraggableCards(source, sourcePileIndex, sourceCardIndex);
        if (!draggableCards || draggableCards.length === 0) return;
        
        e.preventDefault();
        const initialRect = e.currentTarget.getBoundingClientRect();
        setPressedStack({ source, sourcePileIndex, sourceCardIndex });
        setInteractionState({
            startX: e.clientX,
            startY: e.clientY,
            cards: draggableCards,
            source,
            sourcePileIndex,
            sourceCardIndex,
            element: e.currentTarget,
            initialRect,
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!interactionState) return;

        if (dragGhost) {
            setDragGhost(g => g ? { ...g, x: e.clientX - g.offsetX, y: e.clientY - g.offsetY } : null);
            return;
        }

        if (Math.hypot(e.clientX - interactionState.startX, e.clientY - interactionState.startY) > 5) {
            if(onDragStart) onDragStart();
            setPressedStack(null);
            const { cards, source, sourcePileIndex, sourceCardIndex } = interactionState;
            setDragSourceInfo({ cards, source, sourcePileIndex, sourceCardIndex });
            const rect = interactionState.element.getBoundingClientRect();
            setDragGhost({
                cards,
                x: e.clientX - (interactionState.startX - rect.left),
                y: e.clientY - (interactionState.startY - rect.top),
                offsetX: interactionState.startX - rect.left,
                offsetY: interactionState.startY - rect.top,
            });
        }
    }, [interactionState, dragGhost, onDragStart]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!interactionState) return;
        setPressedStack(null);
        
        const wasDrag = !!dragGhost;
        let moveMade = false;
        
        if (wasDrag && dragGhost) { // Drag-and-drop
            const target = findDropTarget(e.clientX, e.clientY);
            const currentDragInfo = {
                cards: interactionState.cards,
                source: interactionState.source,
                sourcePileIndex: interactionState.sourcePileIndex,
                sourceCardIndex: interactionState.sourceCardIndex
            };
            
            if (target && onDrop(currentDragInfo, target)) {
                moveMade = true;
            }
            
            if (!moveMade) {
                const toRect = interactionState.initialRect;
                setReturnAnimationData({
                    cards: dragGhost.cards,
                    from: { x: dragGhost.x, y: dragGhost.y },
                    toRect,
                });
            }
        } else if (onClick) { // Click
            onClick(interactionState.source, interactionState.sourcePileIndex, interactionState.sourceCardIndex, interactionState.cards, interactionState.element);
        }
        
        setInteractionState(null);
        setDragGhost(null);
        if (!wasDrag || moveMade) {
            setDragSourceInfo(null);
        }
    }, [interactionState, dragGhost, findDropTarget, onDrop, onClick]);

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
    
    return {
        dragSourceInfo,
        dragGhost,
        returnAnimationData,
        pressedStack,
        handleMouseDown,
        handleReturnAnimationEnd,
    };
};
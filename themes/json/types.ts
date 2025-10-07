import type { CardType } from '../../types';

export interface JsonTheme {
  name: string;
  board: {
    backgroundColor: string;
    textColor: string;
  };
  cardBack: {
    backgroundColor: string;
    borderColor: string;
    patternColor: string;
  };
  card: {
    backgroundColor: string;
    cornerRadius: string;
    shadow: string;
    redColor: string;
    blackColor: string;
    fontFamily: string;
    rankFontSize: string;
    
    // New border properties
    borderColor: string;
    borderWidth: string;
    borderStyle: 'solid' | 'dashed' | 'dotted';

    // New center pips properties
    pipsLayout: 'single' | 'standard';
    pipsSize: string; // Size of the single pip icon
    pipsGridScale: string; // Scale of the container for standard pips
    standardPipSize: string; // Size of individual pips in standard layout

    // New corner element properties
    showTopCorner: boolean;
    showBottomCorner: boolean;
    cornerLayout: 'horizontal' | 'vertical' | 'none';
    cornerSuitSize: string;
    cornerPadding: string;
  };
}

// Props for the new internal Pips component in JsonCard.tsx
export interface PipsProps {
    rank: CardType['rank'];
    suit: CardType['suit'];
    redColor: string;
    blackColor: string;
    pipSize: string;
}
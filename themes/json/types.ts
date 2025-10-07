
import type { CardType, Rank } from '../../types';

export interface FaceCardArtConfig {
    type: 'svg' | 'emoji' | 'ascii' | 'none';
    content: string;
    position: { x: string; y: string };
    size: { width: string; height: string };
}

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
    patternType: 'default' | 'svg' | 'ascii' | 'emoji';
    svgContent: string;
    patternCharacter: string;
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
    pipsPosition: { x: string; y: string }; // Position for single pip icon
    pipsGridScale: string; // Scale of the container for standard pips
    standardPipSize: string; // Size of individual pips in standard layout

    // New corner element properties
    showTopCorner: boolean;
    showBottomCorner: boolean;
    cornerLayout: 'horizontal' | 'vertical' | 'none';
    cornerSuitSize: string;
    cornerPadding: string;
    
    // Custom suit icons
    suitIcons: {
        HEARTS: string;
        DIAMONDS: string;
        CLUBS: string;
        SPADES: string;
    };
    
    // Custom face card art
    faceCardArt: {
        [Rank.JACK]: FaceCardArtConfig;
        [Rank.QUEEN]: FaceCardArtConfig;
        [Rank.KING]: FaceCardArtConfig;
    }
  };
}

// Props for the new internal Pips component in JsonCard.tsx
export interface PipsProps {
    rank: CardType['rank'];
    suit: CardType['suit'];
    redColor: string;
    blackColor: string;
    pipSize: string;
    suitIcons: JsonTheme['card']['suitIcons'];
}

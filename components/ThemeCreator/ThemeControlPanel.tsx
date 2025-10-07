
import React, { useState, useEffect } from 'react';
import type { JsonTheme, FaceCardArtConfig } from '../../themes/json/types';
import { Section, ColorInput, TextInput, SelectInput, ToggleInput, TextAreaInput } from './controls';
import IconPicker from './IconPicker';
import { Rank } from '../../types';

interface ThemeControlPanelProps {
  theme: JsonTheme;
  setTheme: React.Dispatch<React.SetStateAction<JsonTheme>>;
}

const shadowOptions = [
    { value: 'none', label: 'None' },
    { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', label: 'Subtle' },
    { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', label: 'Medium' },
    { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', label: 'Large' },
];

const fontOptions = [
    { value: '"Quicksand", sans-serif', label: 'Quicksand' },
    { value: '"Playfair Display", serif', label: 'Playfair Display' },
    { value: 'sans-serif', label: 'Sans-Serif (System)' },
    { value: 'serif', label: 'Serif (System)' },
    { value: 'monospace', label: 'Monospace (System)' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'cursive', label: 'Cursive' },
];

const borderStyleOptions = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];

const pipsLayoutOptions = [
    { value: 'single', label: 'Single Icon' },
    { value: 'standard', label: 'Standard Pips' },
];

const cornerLayoutOptions = [
    { value: 'horizontal', label: 'Horizontal' },
    { value: 'vertical', label: 'Vertical' },
    { value: 'none', label: 'None' },
];

const cardBackPatternOptions = [
    { value: 'default', label: 'Default Pattern' },
    { value: 'ascii', label: 'ASCII Character' },
    { value: 'emoji', label: 'Emoji' },
    { value: 'svg', label: 'Custom SVG' },
];

const faceCardArtTypeOptions = [
    { value: 'none', label: 'None (Pip)' },
    { value: 'ascii', label: 'ASCII Character' },
    { value: 'emoji', label: 'Emoji' },
    { value: 'svg', label: 'Custom SVG' },
];

type PickerState = {
  open: boolean;
  target: HTMLElement | null;
  onSelect: ((icon: string) => void) | null;
}

const FaceCardControls: React.FC<{
    rank: Rank.KING | Rank.QUEEN | Rank.JACK,
    theme: JsonTheme,
    setTheme: React.Dispatch<React.SetStateAction<JsonTheme>>,
    openIconPicker: (e: React.MouseEvent<HTMLButtonElement>, onSelect: (icon: string) => void) => void,
}> = ({ rank, theme, setTheme, openIconPicker }) => {
    
    const config = theme.card.faceCardArt[rank];
    const [svgInput, setSvgInput] = useState(config.type === 'svg' ? config.content : '');
    const [svgError, setSvgError] = useState<string|null>(null);

    useEffect(() => {
        // Sync local SVG input if theme is reset externally
        if (config.type === 'svg') {
            setSvgInput(config.content);
        }
    }, [config.content, config.type]);
    
    const handleFaceCardChange = (key: keyof FaceCardArtConfig, value: any) => {
        setTheme(prev => ({
            ...prev,
            card: { ...prev.card, faceCardArt: { ...prev.card.faceCardArt, [rank]: { ...prev.card.faceCardArt[rank], [key]: value } } }
        }));
    };
    
    const handlePositionChange = (axis: 'x' | 'y', value: string) => { handleFaceCardChange('position', { ...config.position, [axis]: value }); };
    const handleSizeChange = (dim: 'width' | 'height', value: string) => { handleFaceCardChange('size', { ...config.size, [dim]: value }); };

    const handleParseSvg = () => {
        if (!svgInput.trim() && config.type === 'svg') { setSvgError("SVG content cannot be empty."); return; }
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgInput, "image/svg+xml");
        if (doc.querySelector("parsererror")) { setSvgError("Invalid SVG syntax."); } 
        else { setSvgError(null); handleFaceCardChange('content', svgInput); }
    };

    return (
        <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">{rank.charAt(0) + rank.slice(1).toLowerCase()} Art</h4>
            <div className="space-y-4 pl-4 border-l-2">
                <SelectInput label="Art Type" value={config.type} onChange={(v) => handleFaceCardChange('type', v)} options={faceCardArtTypeOptions} />
                {(config.type === 'ascii' || config.type === 'emoji') && (
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-700 font-semibold">Character</span>
                        <button onClick={(e) => openIconPicker(e, (icon) => handleFaceCardChange('content', icon))} className="px-4 py-2 text-2xl rounded-lg bg-gray-200 hover:bg-gray-300">
                            {config.content}
                        </button>
                    </div>
                )}
                {config.type === 'svg' && (
                     <div className="pt-2">
                        <TextAreaInput label="Custom SVG Content" value={svgInput} onChange={setSvgInput} helpText="Paste the full <svg>...</svg> code." rows={3} />
                        <div className="flex items-center justify-between mt-2">
                            {svgError ? <p className="text-xs text-red-500">{svgError}</p> : <div />}
                            <button onClick={handleParseSvg} className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm">Parse SVG</button>
                        </div>
                    </div>
                )}
                {config.type !== 'none' && (
                    <>
                        <TextInput label="Position X" value={config.position.x} onChange={v => handlePositionChange('x', v)} helpText="e.g., 50%, 2rem" />
                        <TextInput label="Position Y" value={config.position.y} onChange={v => handlePositionChange('y', v)} helpText="e.g., 50%, 2rem" />
                        <TextInput label="Width" value={config.size.width} onChange={v => handleSizeChange('width', v)} helpText="e.g., 80%, 5rem" />
                        <TextInput label="Height" value={config.size.height} onChange={v => handleSizeChange('height', v)} helpText="e.g., 80%, 7rem" />
                    </>
                )}
            </div>
        </div>
    );
};


const ThemeControlPanel: React.FC<ThemeControlPanelProps> = ({ theme, setTheme }) => {
  const [cardBackSvg, setCardBackSvg] = useState(theme.cardBack.svgContent);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [pickerState, setPickerState] = useState<PickerState>({ open: false, target: null, onSelect: null });

  const handleThemeChange = <T extends 'board' | 'cardBack' | 'card'>(
    section: T,
    key: keyof JsonTheme[T],
    value: string | boolean | object
  ) => {
    setTheme(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleNameChange = (name: string) => { setTheme(prev => ({ ...prev, name })); };

  const handleSuitIconChange = (suit: 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES', value: string) => {
    handleThemeChange('card', 'suitIcons', { ...theme.card.suitIcons, [suit]: value });
  };
  
  const handlePipsPositionChange = (axis: 'x' | 'y', value: string) => {
      handleThemeChange('card', 'pipsPosition', { ...theme.card.pipsPosition, [axis]: value });
  };

  const handleParseSvg = () => {
    if (!cardBackSvg.trim()) { setSvgError("SVG content cannot be empty."); return; }
    const parser = new DOMParser();
    const doc = parser.parseFromString(cardBackSvg, "image/svg+xml");
    if (doc.querySelector("parsererror")) { setSvgError("Invalid SVG syntax. Please check your code."); } 
    else { setSvgError(null); handleThemeChange('cardBack', 'svgContent', cardBackSvg); }
  };

  const openIconPicker = (e: React.MouseEvent<HTMLButtonElement>, onSelect: (icon: string) => void) => {
    setPickerState({ open: true, target: e.currentTarget, onSelect: onSelect });
  };

  return (
    <div className="h-full overflow-y-auto pr-4">
        <Section title="General">
             <TextInput label="Theme Name" value={theme.name} onChange={handleNameChange} />
        </Section>
        <Section title="Board">
            <ColorInput label="Background Color" value={theme.board.backgroundColor} onChange={(v) => handleThemeChange('board', 'backgroundColor', v)} />
            <ColorInput label="Text Color" value={theme.board.textColor} onChange={(v) => handleThemeChange('board', 'textColor', v)} />
        </Section>
        <Section title="Card Back">
            <ColorInput label="Background Color" value={theme.cardBack.backgroundColor} onChange={(v) => handleThemeChange('cardBack', 'backgroundColor', v)} />
            <ColorInput label="Border Color" value={theme.cardBack.borderColor} onChange={(v) => handleThemeChange('cardBack', 'borderColor', v)} />
            <ColorInput label="Pattern/Art Color" value={theme.cardBack.patternColor} onChange={(v) => handleThemeChange('cardBack', 'patternColor', v)} />
            <SelectInput label="Art Type" value={theme.cardBack.patternType} onChange={(v) => handleThemeChange('cardBack', 'patternType', v)} options={cardBackPatternOptions} />
            
            {(theme.cardBack.patternType === 'ascii' || theme.cardBack.patternType === 'emoji') && (
                <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-700 font-semibold">Character</span>
                    <button onClick={(e) => openIconPicker(e, (icon) => handleThemeChange('cardBack', 'patternCharacter', icon))} className="px-4 py-2 text-2xl rounded-lg bg-gray-200 hover:bg-gray-300">
                        {theme.cardBack.patternCharacter}
                    </button>
                </div>
            )}
            {theme.cardBack.patternType === 'svg' && (
                <div className="pt-2">
                    <TextAreaInput label="Custom SVG Content" value={cardBackSvg} onChange={setCardBackSvg} helpText="Paste the full <svg>...</svg> code." />
                    <div className="flex items-center justify-between mt-2">
                        {svgError ? <p className="text-xs text-red-500">{svgError}</p> : <div/>}
                        <button onClick={handleParseSvg} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold">Parse & Preview</button>
                    </div>
                </div>
            )}
        </Section>
        <Section title="Card Face">
            <ColorInput label="Background Color" value={theme.card.backgroundColor} onChange={(v) => handleThemeChange('card', 'backgroundColor', v)} />
            <ColorInput label="Red Suit Color" value={theme.card.redColor} onChange={(v) => handleThemeChange('card', 'redColor', v)} />
            <ColorInput label="Black Suit Color" value={theme.card.blackColor} onChange={(v) => handleThemeChange('card', 'blackColor', v)} />
             <SelectInput label="Font Family" value={theme.card.fontFamily} onChange={(v) => handleThemeChange('card', 'fontFamily', v)} options={fontOptions} />
            <TextInput label="Corner Radius" value={theme.card.cornerRadius} onChange={(v) => handleThemeChange('card', 'cornerRadius', v)} helpText="e.g., 0.5rem, 8px" />
            <SelectInput label="Shadow" value={theme.card.shadow} onChange={(v) => handleThemeChange('card', 'shadow', v)} options={shadowOptions} />
            
            <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-gray-600 mb-2">Suit Icons</h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                    {(['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'] as const).map(suit => (
                        <div key={suit}>
                            <span className={`text-3xl ${suit === 'HEARTS' || suit === 'DIAMONDS' ? 'text-red-500' : 'text-black'}`}>
                                {{HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠'}[suit]}
                            </span>
                            <button onClick={(e) => openIconPicker(e, (icon) => handleSuitIconChange(suit, icon))} className="mt-1 w-full text-center p-2 rounded-lg text-2xl font-semibold transition-all duration-200 ease-in-out bg-gray-200 hover:bg-gray-300">
                                {theme.card.suitIcons[suit]}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
        <Section title="Card Border">
            <ColorInput label="Border Color" value={theme.card.borderColor} onChange={(v) => handleThemeChange('card', 'borderColor', v)} />
            <TextInput label="Border Width" value={theme.card.borderWidth} onChange={(v) => handleThemeChange('card', 'borderWidth', v)} helpText="e.g., 2px" />
            <SelectInput label="Border Style" value={theme.card.borderStyle} onChange={(v) => handleThemeChange('card', 'borderStyle', v)} options={borderStyleOptions} />
        </Section>
        <Section title="Center Pips">
            <SelectInput label="Layout" value={theme.card.pipsLayout} onChange={(v) => handleThemeChange('card', 'pipsLayout', v)} options={pipsLayoutOptions} />
            {theme.card.pipsLayout === 'single' ? (
                 <>
                    <TextInput label="Single Icon Size" value={theme.card.pipsSize} onChange={(v) => handleThemeChange('card', 'pipsSize', v)} helpText="e.g., 40%, 5rem" />
                    <TextInput label="Icon Position X" value={theme.card.pipsPosition.x} onChange={v => handlePipsPositionChange('x', v)} helpText="e.g., 50%" />
                    <TextInput label="Icon Position Y" value={theme.card.pipsPosition.y} onChange={v => handlePipsPositionChange('y', v)} helpText="e.g., 50%" />
                </>
            ) : (
                <>
                    <TextInput label="Pips Area Scale" value={theme.card.pipsGridScale} onChange={(v) => handleThemeChange('card', 'pipsGridScale', v)} helpText="e.g., 0.8 (80%). Scales the area pips are placed in." />
                    <TextInput label="Standard Pip Size" value={theme.card.standardPipSize} onChange={(v) => handleThemeChange('card', 'standardPipSize', v)} helpText="e.g., 1.2rem, 18px. Size of individual pips." />
                </>
            )}
        </Section>
        <Section title="Face Card Art">
            <div className="space-y-6">
                <FaceCardControls rank={Rank.KING} theme={theme} setTheme={setTheme} openIconPicker={openIconPicker} />
                <FaceCardControls rank={Rank.QUEEN} theme={theme} setTheme={setTheme} openIconPicker={openIconPicker} />
                <FaceCardControls rank={Rank.JACK} theme={theme} setTheme={setTheme} openIconPicker={openIconPicker} />
            </div>
        </Section>
         <Section title="Corner Elements">
            <ToggleInput label="Show Top Corner" value={theme.card.showTopCorner} onChange={(v) => handleThemeChange('card', 'showTopCorner', v)} />
            <ToggleInput label="Show Bottom Corner" value={theme.card.showBottomCorner} onChange={(v) => handleThemeChange('card', 'showBottomCorner', v)} />
            <SelectInput label="Layout" value={theme.card.cornerLayout} onChange={(v) => handleThemeChange('card', 'cornerLayout', v)} options={cornerLayoutOptions} />
            <TextInput label="Rank Font Size" value={theme.card.rankFontSize} onChange={(v) => handleThemeChange('card', 'rankFontSize', v)} helpText="e.g., 1.25rem, 20px" />
            <TextInput label="Suit Size" value={theme.card.cornerSuitSize} onChange={(v) => handleThemeChange('card', 'cornerSuitSize', v)} helpText="e.g., 1rem, 16px" />
            <TextInput label="Padding" value={theme.card.cornerPadding} onChange={(v) => handleThemeChange('card', 'cornerPadding', v)} helpText="e.g., 0.5rem, 8px" />
        </Section>
        {pickerState.open && pickerState.target && pickerState.onSelect && (
            <IconPicker
                targetElement={pickerState.target}
                onSelect={pickerState.onSelect}
                onClose={() => setPickerState({ open: false, target: null, onSelect: null })}
            />
        )}
    </div>
  );
};

export default ThemeControlPanel;

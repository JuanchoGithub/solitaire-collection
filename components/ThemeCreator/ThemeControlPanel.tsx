import React from 'react';
import type { JsonTheme } from '../../themes/json/types';
import { Section, ColorInput, TextInput, SelectInput, ToggleInput } from './controls';

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

const ThemeControlPanel: React.FC<ThemeControlPanelProps> = ({ theme, setTheme }) => {
  const handleThemeChange = <T extends 'board' | 'cardBack' | 'card'>(
    section: T,
    key: keyof JsonTheme[T],
    value: string | boolean
  ) => {
    setTheme(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleNameChange = (name: string) => {
      setTheme(prev => ({ ...prev, name }));
  };

  return (
    <div className="h-full overflow-y-auto pr-4">
        <Section title="General">
             <TextInput
                label="Theme Name"
                value={theme.name}
                onChange={handleNameChange}
             />
        </Section>
        <Section title="Board">
            <ColorInput
                label="Background Color"
                value={theme.board.backgroundColor}
                onChange={(v) => handleThemeChange('board', 'backgroundColor', v)}
            />
            <ColorInput
                label="Text Color"
                value={theme.board.textColor}
                onChange={(v) => handleThemeChange('board', 'textColor', v)}
            />
        </Section>
        <Section title="Card Back">
            <ColorInput
                label="Background Color"
                value={theme.cardBack.backgroundColor}
                onChange={(v) => handleThemeChange('cardBack', 'backgroundColor', v)}
            />
            <ColorInput
                label="Border Color"
                value={theme.cardBack.borderColor}
                onChange={(v) => handleThemeChange('cardBack', 'borderColor', v)}
            />
            <ColorInput
                label="Pattern Color"
                value={theme.cardBack.patternColor}
                onChange={(v) => handleThemeChange('cardBack', 'patternColor', v)}
            />
        </Section>
        <Section title="Card Face">
            <ColorInput
                label="Background Color"
                value={theme.card.backgroundColor}
                onChange={(v) => handleThemeChange('card', 'backgroundColor', v)}
            />
            <ColorInput
                label="Red Suit Color"
                value={theme.card.redColor}
                onChange={(v) => handleThemeChange('card', 'redColor', v)}
            />
            <ColorInput
                label="Black Suit Color"
                value={theme.card.blackColor}
                onChange={(v) => handleThemeChange('card', 'blackColor', v)}
            />
             <SelectInput
                label="Font Family"
                value={theme.card.fontFamily}
                onChange={(v) => handleThemeChange('card', 'fontFamily', v)}
                options={fontOptions}
            />
            <TextInput
                label="Corner Radius"
                value={theme.card.cornerRadius}
                onChange={(v) => handleThemeChange('card', 'cornerRadius', v)}
                helpText="e.g., 0.5rem, 8px"
            />
            <SelectInput
                label="Shadow"
                value={theme.card.shadow}
                onChange={(v) => handleThemeChange('card', 'shadow', v)}
                options={shadowOptions}
            />
        </Section>
        <Section title="Card Border">
            <ColorInput
                label="Border Color"
                value={theme.card.borderColor}
                onChange={(v) => handleThemeChange('card', 'borderColor', v)}
            />
            <TextInput
                label="Border Width"
                value={theme.card.borderWidth}
                onChange={(v) => handleThemeChange('card', 'borderWidth', v)}
                helpText="e.g., 2px"
            />
            <SelectInput
                label="Border Style"
                value={theme.card.borderStyle}
                onChange={(v) => handleThemeChange('card', 'borderStyle', v)}
                options={borderStyleOptions}
            />
        </Section>
        <Section title="Center Pips">
            <SelectInput
                label="Layout"
                value={theme.card.pipsLayout}
                onChange={(v) => handleThemeChange('card', 'pipsLayout', v)}
                options={pipsLayoutOptions}
            />
            <TextInput
                label="Single Icon Size"
                value={theme.card.pipsSize}
                onChange={(v) => handleThemeChange('card', 'pipsSize', v)}
                helpText="e.g., 40%, 5rem"
            />
            <TextInput
                label="Pips Area Scale"
                value={theme.card.pipsGridScale}
                onChange={(v) => handleThemeChange('card', 'pipsGridScale', v)}
                helpText="e.g., 0.8 (80%). Scales the area pips are placed in."
            />
             <TextInput
                label="Standard Pip Size"
                value={theme.card.standardPipSize}
                onChange={(v) => handleThemeChange('card', 'standardPipSize', v)}
                helpText="e.g., 1.2rem, 18px. Size of individual pips."
            />
        </Section>
         <Section title="Corner Elements">
            <ToggleInput
                label="Show Top Corner"
                value={theme.card.showTopCorner}
                onChange={(v) => handleThemeChange('card', 'showTopCorner', v)}
            />
            <ToggleInput
                label="Show Bottom Corner"
                value={theme.card.showBottomCorner}
                onChange={(v) => handleThemeChange('card', 'showBottomCorner', v)}
            />
            <SelectInput
                label="Layout"
                value={theme.card.cornerLayout}
                onChange={(v) => handleThemeChange('card', 'cornerLayout', v)}
                options={cornerLayoutOptions}
            />
            <TextInput
                label="Rank Font Size"
                value={theme.card.rankFontSize}
                onChange={(v) => handleThemeChange('card', 'rankFontSize', v)}
                helpText="e.g., 1.25rem, 20px"
            />
            <TextInput
                label="Suit Size"
                value={theme.card.cornerSuitSize}
                onChange={(v) => handleThemeChange('card', 'cornerSuitSize', v)}
                helpText="e.g., 1rem, 16px"
            />
             <TextInput
                label="Padding"
                value={theme.card.cornerPadding}
                onChange={(v) => handleThemeChange('card', 'cornerPadding', v)}
                helpText="e.g., 0.5rem, 8px"
            />
        </Section>
    </div>
  );
};

export default ThemeControlPanel;
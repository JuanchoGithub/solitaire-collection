import React from 'react';
import type { JsonTheme } from './types';

interface JsonCardBackProps {
    theme: JsonTheme['cardBack'];
}

const JsonCardBack: React.FC<JsonCardBackProps> = ({ theme }) => {
    let svgDataUrl = '';
    if (theme.patternType === 'svg' && theme.svgContent) {
        try {
            // Use window.btoa to avoid nodejs/browser environment issues.
            svgDataUrl = `data:image/svg+xml;base64,${window.btoa(theme.svgContent)}`;
        } catch (e) {
            console.error("Error encoding SVG for card back:", e);
        }
    }

    const showDefaultPattern = theme.patternType === 'default';
    const showCharacter = theme.patternType === 'ascii' || theme.patternType === 'emoji';
    
    return (
        <div 
            className="w-full h-full rounded-lg border-2 p-1"
            style={{
                backgroundColor: theme.backgroundColor,
                borderColor: theme.borderColor,
            }}
        >
            <div 
                className="w-full h-full rounded-md border-2 border-current flex items-center justify-center" 
                style={{ 
                    color: theme.patternColor,
                    opacity: showDefaultPattern ? 0.5 : 1,
                    backgroundImage: svgDataUrl ? `url("${svgDataUrl}")` : 'none',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {showDefaultPattern && (
                    <svg width="60%" height="60%" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 30 15 L 60 45 L 90 15" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
                        <path d="M 30 105 L 60 75 L 90 105" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
                        <path d="M 15 30 L 45 60 L 15 90" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
                        <path d="M 105 30 L 75 60 L 105 90" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
                    </svg>
                )}
                {showCharacter && (
                    <span className="text-6xl select-none" style={{ color: theme.patternColor }}>
                        {theme.patternCharacter}
                    </span>
                )}
            </div>
        </div>
    );
};

export default JsonCardBack;

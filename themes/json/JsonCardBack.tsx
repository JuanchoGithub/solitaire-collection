import React from 'react';
import type { JsonTheme } from './types';

interface JsonCardBackProps {
    theme: JsonTheme['cardBack'];
}

const JsonCardBack: React.FC<JsonCardBackProps> = ({ theme }) => (
    <div 
        className="w-full h-full rounded-lg border-2 p-2"
        style={{
            backgroundColor: theme.backgroundColor,
            borderColor: theme.borderColor,
        }}
    >
        <div className="w-full h-full rounded-md border-2 border-current opacity-50 flex items-center justify-center" style={{ color: theme.patternColor }}>
             <svg width="60%" height="60%" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <path d="M 30 15 L 60 45 L 90 15" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
                <path d="M 30 105 L 60 75 L 90 105" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
                <path d="M 15 30 L 45 60 L 15 90" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
                <path d="M 105 30 L 75 60 L 105 90" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
            </svg>
        </div>
    </div>
);

export default JsonCardBack;

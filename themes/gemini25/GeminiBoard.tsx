
import React from 'react';

interface GeminiBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const GeminiBoard: React.FC<GeminiBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-gradient-to-br from-green-800 to-green-900 h-screen w-full text-white font-sans overflow-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default GeminiBoard;
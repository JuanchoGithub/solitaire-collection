import React from 'react';

interface GeminiBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const GeminiBoard: React.FC<GeminiBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-green-800 h-screen text-white pt-2 px-4 font-sans overflow-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default GeminiBoard;
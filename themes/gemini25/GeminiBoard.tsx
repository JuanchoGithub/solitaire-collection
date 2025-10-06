import React from 'react';

interface GeminiBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const GeminiBoard: React.FC<GeminiBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-green-800 min-h-screen text-white p-4 font-sans overflow-x-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default GeminiBoard;

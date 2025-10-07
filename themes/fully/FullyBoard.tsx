
import React from 'react';

interface FullyBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const FullyBoard: React.FC<FullyBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-gradient-to-br from-green-900 to-slate-800 h-screen w-full text-white font-sans overflow-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default FullyBoard;
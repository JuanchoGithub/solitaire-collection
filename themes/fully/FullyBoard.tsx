import React from 'react';

interface FullyBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const FullyBoard: React.FC<FullyBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-green-900 h-screen w-full text-white pt-2 px-4 font-sans overflow-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default FullyBoard;
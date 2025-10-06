import React from 'react';

interface FullyBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const FullyBoard: React.FC<FullyBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-green-900 min-h-screen text-white p-4 font-sans overflow-x-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default FullyBoard;

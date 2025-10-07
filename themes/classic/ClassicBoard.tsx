import React from 'react';

interface ClassicBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const ClassicBoard: React.FC<ClassicBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-green-800 h-screen text-white pt-2 px-4 font-sans overflow-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default ClassicBoard;

import React from 'react';

interface ClassicBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const ClassicBoard: React.FC<ClassicBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-gradient-to-br from-green-800 to-green-900 h-screen w-full text-white font-sans overflow-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default ClassicBoard;
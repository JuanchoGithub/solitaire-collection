import React from 'react';

interface ClassicBoardProps {
  children: React.ReactNode;
  shuffleClass: string;
}

const ClassicBoard: React.FC<ClassicBoardProps> = ({ children, shuffleClass }) => {
    return (
        <div className={`bg-green-800 min-h-screen text-white p-4 font-sans overflow-x-hidden relative flex flex-col ${shuffleClass}`}>
            {children}
        </div>
    );
};

export default ClassicBoard;

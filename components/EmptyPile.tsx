import React from 'react';

interface EmptyPileProps {
  children?: React.ReactNode;
  width: number;
  height: number;
}

const EmptyPile: React.FC<EmptyPileProps> = ({ children, width, height }) => {
  return (
    <div
      style={{ width: `${width}px`, height: `${height}px` }}
      className="bg-black/10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center"
    >
      {children}
    </div>
  );
};

export default EmptyPile;
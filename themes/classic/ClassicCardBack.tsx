import React from 'react';

const ClassicCardBack: React.FC = () => (
    <div className="w-full h-full bg-blue-600 rounded-lg border-2 border-blue-800 p-2">
        <div className="w-full h-full rounded-md border-2 border-blue-400 opacity-50 flex items-center justify-center">
             <svg width="60%" height="60%" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <path d="M 30 15 L 60 45 L 90 15" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round"/>
                <path d="M 30 105 L 60 75 L 90 105" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round"/>
                <path d="M 15 30 L 45 60 L 15 90" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round"/>
                <path d="M 105 30 L 75 60 L 105 90" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round"/>
            </svg>
        </div>
    </div>
);

export default ClassicCardBack;

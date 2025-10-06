import React from 'react';

const FullyCardBack: React.FC = () => (
    <div className="w-full h-full bg-purple-700 rounded-lg border-2 border-purple-900 p-1">
        <svg width="100%" height="100%" className="rounded-md">
            <defs>
                <pattern id="fully-card-back-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
                    <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fully-card-back-pattern)" className="rounded-md" />
        </svg>
    </div>
);

export default FullyCardBack;

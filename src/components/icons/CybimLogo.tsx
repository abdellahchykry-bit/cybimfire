import type { SVGProps } from 'react';

const CybimLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="cybim-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#25D3D0" />
                <stop offset="100%" stopColor="#2AB5F2" />
            </linearGradient>
        </defs>
        {/* Screen */}
        <rect x="2" y="4" width="20" height="14" rx="3" stroke="url(#cybim-gradient)" strokeWidth="1.5"/>
        {/* Stand */}
        <path d="M9 18L15 18" stroke="url(#cybim-gradient)" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Play Icon */}
        <path d="M10 9L15 12L10 15V9Z" fill="url(#cybim-gradient)"/>
    </svg>
);

export default CybimLogo;

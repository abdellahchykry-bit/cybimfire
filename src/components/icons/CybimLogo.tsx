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
        <rect x="2" y="3" width="20" height="15" rx="4" stroke="url(#cybim-gradient)" strokeWidth="2.5"/>
        {/* Stand */}
        <rect x="7" y="19" width="10" height="2" rx="1" fill="url(#cybim-gradient)"/>
        {/* Play Icon */}
        <path d="M10.5 8.5L15.5 11.5L10.5 14.5V8.5Z" fill="url(#cybim-gradient)"/>
    </svg>
);

export default CybimLogo;

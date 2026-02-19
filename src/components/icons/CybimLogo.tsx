import type { SVGProps } from 'react';

const CybimLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="none"
    {...props}
  >
    <path
      d="M50 2L98 26v48L50 98 2 74V26L50 2z"
      stroke="hsl(var(--primary))"
      strokeWidth={4}
    />
    <path
      d="M2 26l48 24 48-24M50 2v48"
      stroke="hsl(var(--primary))"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <circle cx={50} cy={50} r={8} fill="hsl(var(--primary))" />
    <circle cx={50} cy={50} r={4} fill="hsl(var(--background))" />
  </svg>
);

export default CybimLogo;

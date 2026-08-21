import React from 'react';

/**
 * Google's four-colour "G" mark, used on the sign-in button. Kept as
 * hand-drawn SVG rather than a `lucide-react` icon (U3.1) for the same
 * reason as `GoogleDriveIcon` — it's a brand logo, not a generic UI glyph.
 */
export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.54 5.54 0 0 1-2.4 3.64v3.02h3.86c2.26-2.08 3.58-5.15 3.58-8.85z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.86-3a7.15 7.15 0 0 1-4.08 1.14 7.51 7.51 0 0 1-7.06-5.17H1v3.11A11.99 11.99 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M4.94 14.07a7.19 7.19 0 0 1-.39-2.32c0-.8.14-1.58.39-2.32V6.32H1a12 12 0 0 0 0 10.86l3.94-3.11z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.76 0 3.34.6 4.58 1.78l3.43-3.43A11.86 11.86 0 0 0 12 0 11.99 11.99 0 0 0 1 6.32l3.94 3.11A7.51 7.51 0 0 1 12 4.75z"
    />
  </svg>
);

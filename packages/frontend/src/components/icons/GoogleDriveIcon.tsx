import React from 'react';

/**
 * Google Drive's triangle mark. Kept as hand-drawn SVG rather than a
 * `lucide-react` icon (U3.1) because it's a brand logo, not a generic UI
 * glyph — `lucide-react` has no equivalent. Previously duplicated inline in
 * four files (`DocumentList`, `DocumentUpload`, `PhotoUpload`,
 * `PhotoGallery`, `UserDropdown`); this is the single copy.
 */
export const GoogleDriveIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7.71 3.5L1.15 15l3.43 5.95h6.86l-3.43-5.95L7.71 3.5zm8.58 0l-3.43 5.95 3.43 5.95h6.86L19.72 9.45 16.29 3.5zM12 8.3l-3.43 5.95L12 20.2l3.43-5.95L12 8.3z" />
  </svg>
);

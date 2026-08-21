import React from 'react';

export interface ListRowProps {
  /** Leading glyph slot — typically a `StatusIcon` or a small type icon. */
  icon?: React.ReactNode;
  /** Flexible main content — usually a title line plus optional secondary lines. */
  children: React.ReactNode;
  /** Trailing metadata slot (dates, amounts, counts) — stays visible at rest. */
  meta?: React.ReactNode;
  /**
   * Hover-revealed actions (edit, delete, ...). Hidden at rest via
   * `opacity-0 group-hover:opacity-100`, and always visible when a row is
   * focused via keyboard so actions stay reachable without a mouse.
   */
  actions?: React.ReactNode;
  /** Activating the row (click or Enter/Space when interactive) calls this. */
  onActivate?: () => void;
  /**
   * Renders the row in a quiet danger tone (tinted text, no background or
   * border) instead of the boxed `bg-red-50 border-red-200` treatment the
   * six lists used before `U5.1` — that box broke row alignment (`#38`).
   */
  danger?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * The single row primitive for lists (`U5.1` / `D6`). Flat, `hover:bg-subtle`,
 * a leading icon slot, flexible content, a trailing metadata slot, and an
 * actions slot that only appears on hover/focus — replacing six different
 * per-list card/border/hover treatments with one.
 *
 * Rows carry no border or radius of their own; wrap a set of rows in
 * `ListRowGroup` to get the 1px divider between them.
 */
export const ListRow: React.FC<ListRowProps> = ({
  icon,
  children,
  meta,
  actions,
  onActivate,
  danger = false,
  className = '',
  contentClassName = '',
}) => {
  const interactive = typeof onActivate === 'function';

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`group relative flex items-center gap-3 min-h-9 px-3 py-1.5 transition-colors ${
        interactive ? 'cursor-pointer' : ''
      } hover:bg-subtle focus-visible:outline-none focus-visible:bg-subtle ${className}`}
      onClick={interactive ? onActivate : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate!();
              }
            }
          : undefined
      }
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}

      <div className={`flex-1 min-w-0 ${danger ? 'text-danger-700' : ''} ${contentClassName}`}>{children}</div>

      {meta && (
        <div
          className={`flex-shrink-0 flex items-center gap-3 text-ui-xs ${
            danger ? 'text-danger-600' : 'text-gray-500'
          }`}
        >
          {meta}
        </div>
      )}

      {actions && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
};

export interface ListRowGroupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a set of `ListRow`s with a 1px `border-subtle` divider between
 * them and none around the group itself — the "canvas, not a card" rule
 * from `U1`/`U5`.
 */
export const ListRowGroup: React.FC<ListRowGroupProps> = ({ children, className = '' }) => (
  <div className={`divide-y divide-border-subtle ${className}`}>{children}</div>
);

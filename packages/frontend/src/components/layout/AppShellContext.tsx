import React, { createContext, useContext } from 'react';

export interface AppShellContextValue {
  /**
   * Overrides the label of the current page's breadcrumb with a value only
   * known once page data has loaded (e.g. a project's name). Pass `null` to
   * clear it and fall back to the route's static label.
   */
  setBreadcrumbLabel: (label: string | null) => void;
  /**
   * Renders `node` in the top bar's action slot, to the right of the
   * breadcrumb (e.g. a page-level "+ New" button).
   */
  setPageActions: (node: React.ReactNode | null) => void;
}

const noop = () => {};

/**
 * A no-op default means pages using `useAppShell()` keep working when
 * rendered outside `AppShell` (as most page-level tests do today), instead
 * of needing every test to wrap its subject in a provider.
 */
const defaultValue: AppShellContextValue = {
  setBreadcrumbLabel: noop,
  setPageActions: noop,
};

export const AppShellContext = createContext<AppShellContextValue>(defaultValue);

export const useAppShell = (): AppShellContextValue => useContext(AppShellContext);

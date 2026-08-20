import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatches } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, BookOpen, Building2, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { UserDropdown } from '../UserDropdown';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AppShellContext } from './AppShellContext';

/**
 * Static breadcrumb metadata attached to a route via its `handle` property.
 * `parent` renders one linked ancestor crumb ahead of this route's own
 * label (routes here are a flat list, not nested, so there is no automatic
 * ancestor chain to read from `useMatches()`).
 * `dynamicCrumb: true` means the page itself supplies the label at runtime
 * via `useAppShell().setBreadcrumbLabel(...)` once its data has loaded
 * (e.g. a project's name); `crumbKey` is only used as a fallback before
 * that happens.
 */
export interface RouteHandle {
  crumbKey?: string;
  dynamicCrumb?: boolean;
  parent?: { crumbKey: string; path: string };
}

interface Crumb {
  label: string;
  path?: string;
}

interface NavItemDef {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'appShell.sidebarCollapsed';

const readStoredSidebarCollapsed = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const NAV_ITEMS: NavItemDef[] = [
  {
    to: '/dashboard',
    labelKey: 'nav.projects',
    icon: <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    to: '/work-items-library',
    labelKey: 'nav.workCatalog',
    icon: <BookOpen className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    to: '/suppliers',
    labelKey: 'nav.suppliers',
    icon: <Building2 className="w-4 h-4" strokeWidth={1.5} />,
  },
];

const navLinkClassName = (isActive: boolean) =>
  `flex items-center gap-2 h-7 px-2 rounded-linear text-ui font-medium transition-colors duration-150 ${
    isActive ? 'bg-gray-200/60 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/40'
  }`;

const ShellNav: React.FC<{ onNavigate?: () => void; collapsed?: boolean }> = ({
  onNavigate,
  collapsed = false,
}) => {
  const { t } = useTranslation();

  return (
    <nav aria-label={t('nav.workspaceSection')} className="px-3">
      {!collapsed && (
        <p className="px-2 mb-2 text-ui-xs font-semibold text-gray-500 uppercase tracking-wider">
          {t('nav.workspaceSection')}
        </p>
      )}
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? t(item.labelKey) : undefined}
              className={({ isActive }) =>
                `${navLinkClassName(isActive)} ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              <span className="flex-shrink-0 text-gray-400">{item.icon}</span>
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const AppShell: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const matches = useMatches();
  const [breadcrumbOverride, setBreadcrumbOverride] = useState<string | null>(null);
  const [pageActions, setPageActions] = useState<React.ReactNode | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readStoredSidebarCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed));
    } catch {
      // Ignore write failures (e.g. private browsing); the toggle still
      // works for the current session, it just won't persist.
    }
  }, [isSidebarCollapsed]);

  // Pages own clearing their own breadcrumb override / page actions on
  // unmount (see `useAppShell`). Resetting them here too would race: child
  // effects run before this one, so a reset-on-every-navigation effect would
  // wipe out whatever the newly mounted page had just set in the same commit.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileNavOpen]);

  const setBreadcrumbLabel = useCallback((label: string | null) => {
    setBreadcrumbOverride(label);
  }, []);

  const contextValue = useMemo(
    () => ({ setBreadcrumbLabel, setPageActions }),
    [setBreadcrumbLabel]
  );

  const crumbs = useMemo<Crumb[]>(() => {
    const leaf = matches.at(-1);
    const handle = leaf?.handle as RouteHandle | undefined;
    if (!handle) return [];

    const result: Crumb[] = [];
    if (handle.parent) {
      result.push({ label: t(handle.parent.crumbKey), path: handle.parent.path });
    }

    if (handle.dynamicCrumb) {
      if (breadcrumbOverride) {
        result.push({ label: breadcrumbOverride });
      } else if (handle.crumbKey) {
        result.push({ label: t(handle.crumbKey) });
      }
    } else if (handle.crumbKey) {
      result.push({ label: t(handle.crumbKey) });
    }

    return result;
  }, [matches, t, breadcrumbOverride]);

  useEffect(() => {
    const last = crumbs.at(-1);
    document.title = last ? `${last.label} · ${t('app.name')}` : t('app.name');
  }, [crumbs, t]);

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className="min-h-screen bg-canvas flex">
        {/* Desktop sidebar (U2.2 — hidden below lg, replaced by the drawer) */}
        <aside
          className={`hidden lg:flex lg:flex-col lg:flex-shrink-0 bg-subtle border-r border-border transition-[width] duration-150 ${
            isSidebarCollapsed ? 'lg:w-14' : 'lg:w-60'
          }`}
        >
          <div className={`h-10 flex items-center flex-shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'px-4'}`}>
            <Link to="/dashboard" className="flex items-center gap-2" title={isSidebarCollapsed ? t('app.name') : undefined}>
              <span className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-[11px]">R</span>
              </span>
              {!isSidebarCollapsed && <span className="text-ui font-semibold text-gray-900">{t('app.name')}</span>}
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <ShellNav collapsed={isSidebarCollapsed} />
          </div>
          <div className={`flex-shrink-0 border-t border-border py-2 ${isSidebarCollapsed ? 'px-0' : 'px-3'}`}>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              aria-label={isSidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
              title={isSidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
              className={`flex items-center gap-2 h-7 rounded-linear text-gray-500 hover:text-gray-900 hover:bg-gray-200/40 transition-colors duration-150 ${
                isSidebarCollapsed ? 'w-full justify-center' : 'px-2'
              }`}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              )}
              {!isSidebarCollapsed && <span className="text-ui">{t('nav.collapseSidebar')}</span>}
            </button>
          </div>
        </aside>

        {/* Mobile drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/30 animate-fade-in"
              onClick={() => setIsMobileNavOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-subtle border-r border-border flex flex-col animate-pop-in">
              <div className="h-10 flex items-center justify-between px-4 flex-shrink-0">
                <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileNavOpen(false)}>
                  <span className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[11px]">R</span>
                  </span>
                  <span className="text-ui font-semibold text-gray-900">{t('app.name')}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  aria-label={t('nav.closeMenu')}
                  className="p-1 text-gray-500 hover:text-gray-900 rounded-linear hover:bg-gray-200/60"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3">
                <ShellNav onNavigate={() => setIsMobileNavOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-10 flex-shrink-0 flex items-center gap-3 border-b border-border bg-surface px-3 lg:px-4">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label={t('nav.openMenu')}
              className="p-1 -ml-1 text-gray-500 hover:text-gray-900 rounded-linear hover:bg-subtle lg:hidden"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 flex-1">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <React.Fragment key={`${crumb.label}-${index}`}>
                    {index > 0 && <span className="text-gray-300 flex-shrink-0">/</span>}
                    {crumb.path && !isLast ? (
                      <Link
                        to={crumb.path}
                        className="text-ui text-gray-500 hover:text-gray-900 truncate transition-colors duration-150"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-ui font-medium text-gray-900 truncate">{crumb.label}</span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 flex-shrink-0">
              {pageActions}
              <LanguageSwitcher />
              <UserDropdown />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AppShellContext.Provider>
  );
};

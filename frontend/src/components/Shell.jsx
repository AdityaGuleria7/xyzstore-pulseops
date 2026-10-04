import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  Command,
  FileSpreadsheet,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Package,
  Radar,
  ScanLine,
  Settings,
  ShoppingCart,
  Store,
  Sun,
  Truck,
  X,
  ClipboardList,
  Users,
} from 'lucide-react';
import { DEMO_USERS } from './Login';

const ADMIN_NAV_GROUPS = [
  { label: 'Workspace', items: [['dashboard', 'Overview', LayoutDashboard], ['command', 'Command center', Radar]] },
  { label: 'Fulfillment', items: [['orders', 'Orders', ShoppingCart], ['worker', 'Worker mode', ScanLine], ['staging', 'Dispatch', Truck], ['receiving', 'Receiving', Inbox]] },
  { label: 'Stock', items: [['inventory', 'Inventory', Package]] },
  { label: 'Management', items: [['issues', 'Problem log', AlertTriangle], ['shift', 'Reports', ClipboardList], ['csv', 'Data & imports', FileSpreadsheet]] },
];

const PACKER_NAV_GROUPS = [
  { label: 'My workspace', items: [['worker', 'Worker mode', ScanLine], ['receiving', 'Receiving', Inbox], ['shift', 'Shift report', ClipboardList]] },
];

export default function Shell({
  activeView,
  setActiveView,
  currentUser,
  onSwitchUser,
  onLogout,
  urgent,
  missed,
  serverStatus = 'online',
  children,
  storeSettings = {},
  onSaveStoreSettings,
}) {
  const navGroups = currentUser.role === 'Admin' ? ADMIN_NAV_GROUPS : PACKER_NAV_GROUPS;
  const [dark, setDark] = useState(() => localStorage.getItem('fx.dark') === '1');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('pulseops.sidebar-collapsed') === '1');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const [switchEmail, setSwitchEmail] = useState('');
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [storeName, setStoreName] = useState(storeSettings.storeName || 'XYZStore');
  const [tagline, setTagline] = useState(
    storeSettings.tagline || 'Fulfillment Control Center'
  );
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setStoreName(storeSettings.storeName || 'XYZStore');
    setTagline(storeSettings.tagline || 'Fulfillment Control Center');
  }, [storeSettings.storeName, storeSettings.tagline]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!settingsOpen && !switchAccountOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        setSwitchAccountOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [settingsOpen, switchAccountOpen]);

  const otherUser = DEMO_USERS.find((user) => user.role !== currentUser.role);
  const activeTitle = navGroups.flatMap((group) => group.items).find(([id]) => id === activeView)?.[1] || 'Workspace';

  const toggleDark = () => {
    setDark((value) => {
      const next = !value;
      localStorage.setItem('fx.dark', next ? '1' : '0');
      return next;
    });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const next = !value;
      localStorage.setItem('pulseops.sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  };

  const saveSettings = async () => {
    if (!storeName.trim() || !onSaveStoreSettings) return;
    setSavingSettings(true);
    try {
      await onSaveStoreSettings(storeName.trim(), tagline.trim());
      setSettingsOpen(false);
    } finally {
      setSavingSettings(false);
    }
  };

  const switchAccount = async (event) => {
    event.preventDefault();
    if (!otherUser || !switchEmail.trim() || !switchPassword) return;
    setSwitchingAccount(true);
    try {
      const switched = await onSwitchUser({ role: otherUser.role, email: switchEmail.trim(), password: switchPassword });
      if (switched) {
        setSwitchAccountOpen(false);
        setSwitchEmail('');
        setSwitchPassword('');
      }
    } finally {
      setSwitchingAccount(false);
    }
  };

  return (
    <div
      className={`pulseops-app-shell ${dark ? 'dark ' : ''}min-h-screen bg-slate-50 text-slate-900`}
      data-sidebar-collapsed={sidebarCollapsed}
      data-mobile-nav-open={mobileNavOpen}
    >
      <aside className={`pulseops-sidebar${mobileNavOpen ? ' is-mobile-open' : ''}`} aria-label="Application sidebar">
        <div className="pulseops-sidebar-brand">
            <div className="pulseops-brand-mark flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white">
              PO
            </div>
            <div className="pulseops-brand-copy min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (currentUser.role === 'Admin') setSettingsOpen(true);
                }}
                className="pulseops-brand-title group cursor-pointer text-left"
                title={currentUser.role === 'Admin' ? 'Edit store branding' : undefined}
              >
                <div className="truncate text-sm font-extrabold leading-tight group-hover:text-blue-700">
                  {storeSettings.storeName || 'XYZStore'} · PulseOps
                </div>
                <div className="pulseops-tagline mt-0.5 max-w-[260px] truncate text-[9px] text-slate-400">
                  {storeSettings.tagline || 'Fulfillment Control Center'}
                </div>
              </button>
            </div>
          </div>

        <button type="button" className="pulseops-sidebar-search" onClick={() => window.dispatchEvent(new Event('pulseops:palette'))} title="Search anything (⌘K)" aria-label="Search anything">
          <Search className="h-4 w-4" /><span>Search anything</span><kbd><Command className="h-3 w-3" />K</kbd>
        </button>
        <nav className="pulseops-sidebar-nav" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div className="pulseops-sidebar-group" key={group.label}>
              <div className="pulseops-sidebar-section-label">{group.label}</div>
              {group.items.map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setActiveView(id); setMobileNavOpen(false); }}
                  aria-current={activeView === id ? 'page' : undefined}
                  aria-label={sidebarCollapsed ? label : undefined}
                  className="pulseops-sidebar-link"
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4" /><span>{label}</span>
                  {id === 'staging' && missed > 0 && <span className="pulseops-sidebar-count" aria-label={`${missed} missed pickups`}>{missed}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="pulseops-sidebar-footer">
          <div className={`pulseops-service-status ${serverStatus === 'online' ? 'is-online' : 'is-offline'}`}>
            <span className="pulseops-service-indicator" aria-hidden="true" />
            <span>{serverStatus === 'online' ? 'All systems operational' : 'Reconnecting to service'}</span>
          </div>
          <button
            type="button"
            className="pulseops-sidebar-collapse"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            <span>{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button type="button" className="pulseops-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <div className="pulseops-main-area">
        <header className="pulseops-shell-header sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="pulseops-topbar flex items-center justify-between px-6">
            <div className="pulseops-context">
              <button type="button" className="pulseops-sidebar-toggle" onClick={() => {
                if (window.matchMedia('(max-width: 760px)').matches) setMobileNavOpen((value) => !value);
                else toggleSidebar();
              }} aria-expanded={window.matchMedia('(max-width: 760px)').matches ? mobileNavOpen : !sidebarCollapsed} aria-label={mobileNavOpen ? 'Close navigation' : window.matchMedia('(max-width: 760px)').matches ? 'Open navigation' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title="Toggle navigation">
                {mobileNavOpen ? <X className="h-4 w-4" /> : window.matchMedia('(max-width: 760px)').matches ? <Menu className="h-4 w-4" /> : sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              <span className="pulseops-mobile-brand">
                <span>{storeSettings.storeName || 'XYZStore'}</span>
                <span>PulseOps · {activeTitle}</span>
              </span>
              <span className="pulseops-context-divider" aria-hidden="true" />
              <span className="pulseops-context-label">Workspace</span>
              <span className="pulseops-context-chevron">/</span>
              <span className="pulseops-context-current">{activeTitle}</span>
            </div>
            <div className="pulseops-header-utility flex items-center gap-3">
              {missed > 0 && <span className="pulseops-header-alert"><span />{missed} missed pickup{missed === 1 ? '' : 's'}</span>}
              <button type="button" title={otherUser ? `Switch workspace role to ${otherUser.role}` : 'Current user'} aria-label={otherUser ? `Switch workspace role to ${otherUser.role}` : 'Current user'} onClick={() => otherUser && setSwitchAccountOpen(true)} className="pulseops-user-card">
                <span className="pulseops-user-avatar" aria-hidden="true">{currentUser.initials || ((currentUser.name || 'User').match(/[A-Za-z]/) || ['U'])[0].toUpperCase()}</span>
                <span className="pulseops-user-copy"><span className="pulseops-user-name">{currentUser.name}</span><span className="pulseops-user-meta">{currentUser.role} · Workspace</span></span>
                {otherUser && <ChevronDown className="pulseops-user-chevron h-3.5 w-3.5" aria-hidden="true" />}
              </button>
              {currentUser.role === 'Admin' && <button type="button" title="Store settings" aria-label="Store settings" onClick={() => setSettingsOpen(true)} className="pulseops-utility-button"><Settings className="h-4 w-4" /></button>}
              <button type="button" title={dark ? 'Switch to light appearance' : 'Switch to dark appearance'} aria-label={dark ? 'Switch to light appearance' : 'Switch to dark appearance'} onClick={toggleDark} className="pulseops-utility-button">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
              <button type="button" title="Sign out" aria-label="Sign out" onClick={onLogout} className="pulseops-utility-button"><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
        </header>
        <div className="pulseops-content mx-auto max-w-[1440px]">{children}</div>
      </div>

      {switchAccountOpen && otherUser ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]" onMouseDown={() => setSwitchAccountOpen(false)} role="presentation">
          <section className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="switch-account-title">
            <button type="button" onClick={() => setSwitchAccountOpen(false)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-50" aria-label="Close account switch">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Users className="h-5 w-5 text-slate-700" /></div>
              <div>
                <h2 id="switch-account-title" className="text-lg font-extrabold">Switch to {otherUser.role}</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">Confirm the other workspace account to continue.</p>
              </div>
            </div>
            <form onSubmit={switchAccount} className="mt-5">
              <label htmlFor="switch-account-email" className="field-label">Work email</label>
              <input id="switch-account-email" type="email" value={switchEmail} onChange={(event) => setSwitchEmail(event.target.value)} autoComplete="username" required className="ops-field" />
              <label htmlFor="switch-account-password" className="field-label mt-4">Password</label>
              <input id="switch-account-password" type="password" value={switchPassword} onChange={(event) => setSwitchPassword(event.target.value)} autoComplete="current-password" required className="ops-field" />
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setSwitchAccountOpen(false)} className="ops-secondary">Cancel</button>
                <button type="submit" disabled={switchingAccount || !switchEmail.trim() || !switchPassword} className="ops-primary disabled:opacity-40">{switchingAccount ? 'Verifying…' : 'Switch account'}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {settingsOpen && currentUser.role === 'Admin' ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]"
          onClick={() => setSettingsOpen(false)}
          role="presentation"
        >
        <div
          className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-settings-title"
        >
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="absolute right-4 top-4 cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-50"
              aria-label="Close store settings"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Store className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h2 id="store-settings-title" className="text-lg font-extrabold">Store settings</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Set the name shown across the control tower and printed labels.
                </p>
              </div>
            </div>

            <label className="field-label mt-5">Store name</label>
            <input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              maxLength={80}
              className="ops-field"
              placeholder="Your store name"
            />

            <label className="field-label mt-4">Tagline</label>
            <input
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              maxLength={120}
              className="ops-field"
              placeholder="Fulfillment Control Center"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="ops-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!storeName.trim() || savingSettings}
                onClick={saveSettings}
                className="ops-primary disabled:opacity-40"
              >
                {savingSettings ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

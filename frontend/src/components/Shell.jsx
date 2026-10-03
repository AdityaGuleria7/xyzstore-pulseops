import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  Inbox,
  LayoutDashboard,
  LogOut,
  Moon,
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
} from 'lucide-react';
import { DEMO_USERS } from './Login';

const ADMIN_TABS = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['command', 'Command Center', Radar],
  ['orders', 'Orders & Priority', ShoppingCart],
  ['worker', 'Worker Mode', ScanLine],
  ['inventory', 'Stock & Transfers', Package],
  ['staging', 'Couriers & Staging', Truck],
  ['receiving', 'Receiving', Inbox],
  ['issues', 'Problem Log', AlertTriangle],
  ['shift', 'Shift Report', ClipboardList],
  ['csv', 'CSV Sync', FileSpreadsheet],
];

const PACKER_TABS = [
  ['worker', 'Worker Mode', ScanLine],
  ['receiving', 'Receiving', Inbox],
  ['shift', 'Shift Report', ClipboardList],
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
  const tabs = currentUser.role === 'Admin' ? ADMIN_TABS : PACKER_TABS;
  const [dark, setDark] = useState(() => localStorage.getItem('fx.dark') === '1');
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const otherUser = DEMO_USERS.find((user) => user.role !== currentUser.role);

  const toggleDark = () => {
    setDark((value) => {
      const next = !value;
      localStorage.setItem('fx.dark', next ? '1' : '0');
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

  return (
    <div
      className={`${dark ? 'dark ' : ''}min-h-screen bg-slate-50 text-slate-900`}
    >
      <header className="pulseops-shell-header sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
              XY
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  if (currentUser.role === 'Admin') setSettingsOpen(true);
                }}
                className="group cursor-pointer text-left"
              >
                <div className="text-sm font-extrabold leading-tight group-hover:text-blue-700">
                  {storeSettings.storeName || 'XYZStore'} · PulseOps
                </div>
                <div className="mt-0.5 max-w-[260px] truncate text-[9px] text-slate-400">
                  {storeSettings.tagline || 'Fulfillment Control Center'}
                </div>
              </button>

              <div
                className={`flex items-center gap-1 text-[10px] ${
                  serverStatus === 'online'
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                <Activity className="h-3 w-3" />
                {serverStatus === 'online'
                  ? 'Operational · Real-time Sync'
                  : 'Backend reconnecting'}
              </div>
            </div>
          </div>

          <div className="pulseops-header-utility flex items-center gap-3">
            {missed > 0 && (
              <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 xl:inline">
                {missed} missed pickup
              </span>
            )}

            <button
              type="button"
              title={otherUser ? `Switch to ${otherUser.role}` : 'Current user'}
              onClick={() => otherUser && onSwitchUser(otherUser)}
              className="pulseops-user-card hidden shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors sm:flex"
            >
              <span className="pulseops-user-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold" aria-hidden="true">
                {((currentUser.name || 'User').match(/[A-Za-z]/) || ['U'])[0].toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="pulseops-user-name block max-w-[150px] truncate text-xs font-extrabold leading-tight">
                  {currentUser.name}
                </span>
                <span className="pulseops-user-meta flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em]">
                  <span>{currentUser.role}</span>
                  <span className="pulseops-user-dot h-1.5 w-1.5 rounded-full" aria-hidden="true" />
                  <span>Signed in</span>
                </span>
              </span>
            </button>

            {currentUser.role === 'Admin' && (
              <button
                type="button"
                title="Store settings"
                onClick={() => setSettingsOpen(true)}
                className="cursor-pointer rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              title="Search anything (Ctrl/⌘ + K)"
              aria-label="Open command palette"
              onClick={() => window.dispatchEvent(new Event('pulseops:palette'))}
              className="hidden h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 md:flex"
            >
              <Search className="h-3.5 w-3.5" />Search<kbd className="rounded border border-slate-200 px-1 text-[10px]">⌘K</kbd>
            </button>

            <button
              type="button"
              title="Toggle dark mode"
              onClick={toggleDark}
              className={`cursor-pointer rounded-lg border p-2 ${
                dark
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              title="Sign out"
              onClick={onLogout}
              className="cursor-pointer rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="pulseops-nav mx-auto flex max-w-[1400px] gap-1.5 overflow-x-auto px-5">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              className={`pulseops-nav-button mb-2 flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all ${
                activeView === id
                  ? 'border-blue-600 bg-blue-50 text-slate-950 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px]">{children}</main>

      {settingsOpen && currentUser.role === 'Admin' ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[1px]"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
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
                <h2 className="text-lg font-extrabold">Store settings</h2>
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft, LayoutDashboard, Package, AlertTriangle, ShoppingCart, ArrowUp, ArrowDown, Activity, ScanLine, Truck, Inbox, ClipboardList, FileSpreadsheet } from 'lucide-react';

const PAGES = [
  ['dashboard', 'Dashboard', 'overview kpi pipeline', true],
  ['command', 'Command Center', 'radar wave forecast briefing actions', true],
  ['orders', 'Orders & Priority', 'orders table kanban labels priority', true],
  ['worker', 'Worker Mode', 'pick pack scan', false],
  ['inventory', 'Stock & Transfers', 'stock inventory transfer audit', true],
  ['staging', 'Couriers & Staging', 'courier handover bays boxes', true],
  ['receiving', 'Receiving', 'inbound deliveries put-away', false],
  ['issues', 'Problem Log', 'issues incidents', true],
  ['shift', 'Shift Report', 'report activity', false],
  ['csv', 'CSV Sync', 'export import spreadsheet', true],
];

/** Global Ctrl/Cmd+K palette: jump to any screen, order, SKU or incident. */
export default function CommandPalette({ state, role, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const isAdmin = role === 'Admin';

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === 'Escape') setOpen(false);
    };
    const openIt = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pulseops:palette', openIt);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pulseops:palette', openIt); };
  }, []);
  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pages = PAGES.filter(([, , , adminOnly]) => isAdmin || !adminOnly)
      .filter(([, label, kw]) => !t || `${label} ${kw}`.toLowerCase().includes(t))
      .map(([id, label]) => ({ kind: 'Go to', icon: ({
        dashboard: LayoutDashboard,
        command: Activity,
        orders: ShoppingCart,
        worker: ScanLine,
        inventory: Package,
        staging: Truck,
        receiving: Inbox,
        issues: AlertTriangle,
        shift: ClipboardList,
        csv: FileSpreadsheet,
      })[id] || LayoutDashboard, label, sub: 'Screen', run: () => onNavigate(id) }));
    if (!t || !isAdmin) return pages.slice(0, 8);
    const orders = state.orders.filter((o) => `${o.id} ${o.customer} ${o.product} ${o.sku} ${o.courier || ''}`.toLowerCase().includes(t)).slice(0, 6)
      .map((o) => ({ kind: 'Order', icon: ShoppingCart, label: `${o.id} · ${o.customer}`, sub: `${o.product} ×${o.quantity} · ${o.status}${o.priority === 'priority' ? ' · priority' : ''}`,
        run: () => { sessionStorage.setItem('pulseops.search', o.id); onNavigate('orders'); } }));
    const skus = state.inventory.filter((i) => `${i.sku} ${i.name} ${i.variant} ${i.barcode}`.toLowerCase().includes(t)).slice(0, 4)
      .map((i) => ({ kind: 'Stock', icon: Package, label: `${i.name} (${i.variant})`, sub: `${i.sku} · shelf ${i.quantity} · WH2 ${i.wh2Quantity ?? 0}`, run: () => onNavigate('inventory') }));
    const issues = state.issues.filter((i) => `${i.title} ${i.description} ${i.orderId || ''}`.toLowerCase().includes(t)).slice(0, 3)
      .map((i) => ({ kind: 'Issue', icon: AlertTriangle, label: i.title, sub: `${i.severity} · ${i.status}`, run: () => onNavigate('issues') }));
    return [...pages, ...orders, ...skus, ...issues].slice(0, 14);
  }, [q, state, isAdmin, onNavigate]);

  useEffect(() => { setIdx(0); }, [q]);
  const choose = (r) => { if (r) { setOpen(false); r.run(); } };
  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[idx]); }
  };
  if (!open) return null;
  return (
    <div className="command-palette-overlay fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/55 p-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="command-palette-dialog w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="command-palette-search flex items-center gap-3 border-b border-slate-200 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onInputKey} placeholder={isAdmin ? 'Search orders, SKUs, incidents or jump to a screen…' : 'Jump to a screen…'}
            className="command-palette-input h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" aria-label="Search" />
          <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No matches for “{q}”.</li>}
          {results.map((r, i) => { const Icon = r.icon; return (
            <li key={`${r.kind}-${r.label}-${i}`} role="option" aria-selected={i === idx}>
              <button onMouseEnter={() => setIdx(i)} onClick={() => choose(r)} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === idx ? 'bg-blue-50' : ''}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100"><Icon className="h-4 w-4 text-slate-600" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{r.label}</span><span className="block truncate text-xs text-slate-500">{r.sub}</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{r.kind}</span>
              </button>
            </li>); })}
        </ul>
        <div className="flex items-center gap-4 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
          <span className="ml-auto">Ctrl / ⌘ + K anywhere</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Printer, Flag, Table2, Columns3, Tag, Package, Sparkles, X, Zap, MapPin, ExternalLink, Clock3, ChevronDown, ChevronRight, CircleCheck, Layers3, Search, RotateCcw, LoaderCircle } from 'lucide-react';
import { countdown } from './Dashboard';
import PageHeader from './PageHeader';
import { STAGE_META } from '../utils/ops';

export const COURIER_OPTIONS = [
  { name: 'Royal Mail', cost: 5.9, speed: '3-5 days', pickup: '15:30', cutoff: '15:00' },
  { name: 'FedEx Ground', cost: 8.1, speed: '2-3 days', pickup: '17:00', cutoff: '16:30' },
  { name: 'UPS Next Day', cost: 11.75, speed: 'Next day', pickup: '18:15', cutoff: '18:00' },
  { name: 'DHL Express', cost: 14.9, speed: 'Same day', pickup: '14:30', cutoff: '14:00' },
];

const FLAG_REASONS = ['Missing Stock', 'Damaged Item', 'Address Error', 'Courier Missed'];
const STAGES = STAGE_META.map(s => [s.key, s.label, s.dot, s.soft, s.hex]);
export const stageOf = (o) => o.status === 'pending' ? 'received' : o.status === 'processing' ? (o.courier ? 'picking' : 'processing') : o.status === 'packed' ? 'packing' : o.status === 'staged' ? 'staging' : 'shipped';
const stageName = k => STAGES.find(s => s[0] === k)?.[1] || k;
const stageIndex = k => STAGES.findIndex(s => s[0] === k);
const passed = (cutoff, now) => { const [h, m] = cutoff.split(':').map(Number); return now.getHours() * 60 + now.getMinutes() >= h * 60 + m; };
const Chip = ({ o }) => <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 bg-white text-[10px] font-mono font-semibold">{o.variant}<span className="text-slate-400">×{o.quantity}</span></span>;

function StageSlider({ stage, onJump }) {
  const value = Math.max(0, stageIndex(stage));
  const pct = (value / Math.max(1, STAGES.length - 1)) * 100;
  return <div className="kanban-order-stage-slider" title={`Stage: ${stageName(stage)}`}>
    <div className="kanban-order-stage-track" aria-hidden="true"><div className="kanban-order-stage-fill" style={{ height: `${pct}%`, background: STAGE_META.find(s => s.key === stage)?.hex || '#0f172a' }} /></div>
    <div className="kanban-order-stage-steps">
      {STAGES.map(([key, label, dot, soft, hex], index) => <button key={key} type="button" onClick={() => onJump?.(key)} className={`kanban-order-stage-step ${index <= value ? 'is-passed' : ''} ${index === value ? 'is-current' : ''}`} style={{ '--stage-color': hex }} aria-label={`${stageName(stage)} order: jump to ${label}`} title={label}><span className="kanban-order-stage-dot" /></button>)}
    </div>
    <span className="kanban-order-stage-label">{value + 1}/6</span>
  </div>;
}


export default function Orders({ orders, now, flagged, onLabel, onStage, onPrint, onFlag, onWorker, initialStage = 'all', initialKind = 'all' }) {
  const [view, setView] = useState('table');
  const [q, setQ] = useState(() => { const v = sessionStorage.getItem('pulseops.search') || ''; if (v) sessionStorage.removeItem('pulseops.search'); return v; });
  const [stage, setStage] = useState(initialStage || 'all');
  const [courier, setCourier] = useState('all');
  const [kind, setKind] = useState(initialKind || 'all');
  const [sel, setSel] = useState([]);
  const [labelFor, setLabelFor] = useState(null);
  const [savingCourier, setSavingCourier] = useState('');
  const [labelError, setLabelError] = useState('');
  const [menu, setMenu] = useState(null);
  const [timerNow, setTimerNow] = useState(now);
  const [kanbanStage, setKanbanStage] = useState(stage === 'all' ? 'received' : stage);
  const deadlineWindow = Math.floor(timerNow.getTime() / 60000) * 60000;
  const kanbanColumnRefs = useRef({});
  const labelTriggerRef = useRef(null);
  useEffect(() => { const t = setInterval(() => setTimerNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { setStage(initialStage || 'all'); }, [initialStage]);
  useEffect(() => { setKind(initialKind || 'all'); }, [initialKind]);
  useEffect(() => { if (view === 'kanban') setKanbanStage(stage === 'all' ? (kanbanStage || 'received') : stage); }, [view, stage]);
  useEffect(() => {
    if (!labelFor) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !savingCourier) {
        setLabelFor(null);
        requestAnimationFrame(() => labelTriggerRef.current?.focus());
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [labelFor, savingCourier]);

  const jumpToStage = (key) => {
    setView('kanban');
    setStage('all');
    setKanbanStage(key);
    window.requestAnimationFrame(() => {
      kanbanColumnRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  };

  const rows = useMemo(() => orders.filter(o =>
    (stage === 'all' || stageOf(o) === stage) &&
    (courier === 'all' || o.courier === courier) &&
    (kind === 'all' ||
      (kind === 'priority' ? o.priority === 'priority' && !['shipped', 'delivered', 'cancelled'].includes(o.status) :
        kind === 'at-risk' ? !['shipped', 'delivered', 'cancelled'].includes(o.status) && new Date(o.deadline).getTime() < deadlineWindow + 3600000 :
          flagged.includes(o.id))) &&
    `${o.id} ${o.customer} ${o.product} ${o.variant} ${o.sku} ${o.city} ${o.state} ${o.country}`.toLowerCase().includes(q.toLowerCase())
  ), [orders, q, stage, courier, kind, flagged, deadlineWindow]);

  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const createOrderLabel = async (courierOption) => {
    if (!labelFor || savingCourier) return;
    setSavingCourier(courierOption.name);
    setLabelError('');
    try {
      await onLabel(labelFor.id, courierOption.name, courierOption.cost);
      setLabelFor(null);
      requestAnimationFrame(() => labelTriggerRef.current?.focus());
    } catch {
      setLabelError('The label could not be created. Check the error notification and try again.');
    } finally {
      setSavingCourier('');
    }
  };
  const closeLabelDialog = () => {
    if (savingCourier) return;
    setLabelFor(null);
    requestAnimationFrame(() => labelTriggerRef.current?.focus());
  };
  const act = (o) => {
    const s = stageOf(o);
    if (s === 'received' || s === 'processing') return <button onClick={event => { labelTriggerRef.current = event.currentTarget; setLabelError(''); setLabelFor(o); }} className="orders-row-action inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer hover:bg-slate-800"><Tag className="w-3.5 h-3.5" />Create label</button>;
    if (s === 'picking') return <button onClick={onWorker} className="border border-blue-200 text-blue-700 bg-blue-50/60 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-100">Pick in Worker</button>;
    if (s === 'packing') return <button onClick={() => onStage([o.id])} className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer hover:bg-slate-800"><Package className="w-3.5 h-3.5" />Move to staging</button>;
    if (o.trackingLink) return <a href={o.trackingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">Tracking <ExternalLink className="w-3 h-3" /></a>;
    return <span className="text-[10px] text-slate-400">No action</span>;
  };
  const flag = (o) => <div className="orders-flag-menu-wrap">
    <button
      type="button"
      aria-label={`Flag ${o.id}`}
      aria-haspopup="true"
      aria-expanded={menu === o.id}
      aria-controls={menu === o.id ? `flag-menu-${o.id}` : undefined}
      onClick={() => setMenu(menu === o.id ? null : o.id)}
      className={`orders-flag-trigger p-1.5 text-slate-400 hover:text-red-600 cursor-pointer ${menu === o.id ? 'is-open' : ''}`}
    ><Flag className="w-4 h-4" /></button>
    {menu === o.id && <div id={`flag-menu-${o.id}`} className="orders-flag-menu" role="group" aria-label={`Flag ${o.id} for a problem`}>
      <div className="orders-flag-menu-heading">
        <strong>Flag this order</strong>
        <span>{o.id} · choose a reason</span>
      </div>
      <div className="orders-flag-menu-options">{FLAG_REASONS.map(r => <button type="button" key={r} onClick={() => { onFlag(o, r); setMenu(null); }} className="orders-flag-option"><span className="orders-flag-option-mark" aria-hidden="true" /><span>{r}</span><ChevronRight className="orders-flag-option-arrow" aria-hidden="true" /></button>)}</div>
    </div>}
  </div>;
  const dl = o => { const c = countdown(o.deadline, timerNow); return <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${c.cls}`}><Clock3 className="w-3 h-3" />{c.text}</span>; };
  // Labels can still be created after a courier cutoff; that parcel moves on the next pickup.
  const best = labelFor ? COURIER_OPTIONS.slice().sort((a, b) => a.cost - b.cost)[0] : null;

  const viewButtons = [['table', 'Table', Table2], ['kanban', 'Kanban', Columns3]];
  const selectedStageable = sel.filter(id => { const o = orders.find(item => item.id === id); return o && stageOf(o) === 'packing'; });
  const toggleStageSelection = (stageKey) => {
    const ids = rows.filter(o => stageOf(o) === stageKey).slice(0, 100).map(o => o.id);
    setSel(current => {
      const allSelected = ids.length > 0 && ids.every(id => current.includes(id));
      return allSelected ? current.filter(id => !ids.includes(id)) : Array.from(new Set([...current, ...ids]));
    });
  };

  return <div className="ops-page space-y-5">
    <PageHeader title="Orders & Priority Workflow" />

    <div className="ops-card orders-toolbar">
      <div className="orders-toolbar-top">
        <label className="orders-search-field">
          <Search className="orders-search-icon" aria-hidden="true" />
          <span className="sr-only">Search orders</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search orders, SKU, customer or location" className="ops-field" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="orders-search-clear">×</button>}
        </label>
        <div className="orders-toolbar-top-actions">
          <div className="orders-view-switcher" role="group" aria-label="Orders view">
            {viewButtons.map(([k, l, I]) => <button key={k} type="button" onClick={() => setView(k)} className={`orders-view-toggle inline-flex items-center justify-center gap-2 rounded-lg text-xs font-bold cursor-pointer ${view === k ? 'is-active' : ''}`}><I className="w-4 h-4" />{l}</button>)}
          </div>
          <div className="orders-result-count" aria-live="polite"><strong>{rows.length}</strong><span>matching</span>{sel.length > 0 && <span className="orders-selected-count">{sel.length} selected</span>}{sel.length > 0 && selectedStageable.length !== sel.length && <span className="orders-selection-note">{selectedStageable.length} stageable</span>}</div>
        </div>
      </div>

      <div className="orders-toolbar-bottom">
        <div className="orders-filter-grid">
          <label className="orders-filter-select-wrap"><span className="sr-only">Filter orders by stage</span><select aria-label="Filter orders by stage" value={stage} onChange={e => setStage(e.target.value)} className="orders-filter-select"><option value="all">All stages</option>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><ChevronDown className="orders-filter-chevron" aria-hidden="true" /></label>
          <label className="orders-filter-select-wrap"><span className="sr-only">Filter orders by courier</span><select aria-label="Filter orders by courier" value={courier} onChange={e => setCourier(e.target.value)} className="orders-filter-select"><option value="all">All couriers</option>{COURIER_OPTIONS.map(c => <option key={c.name}>{c.name}</option>)}</select><ChevronDown className="orders-filter-chevron" aria-hidden="true" /></label>
          <label className="orders-filter-select-wrap"><span className="sr-only">Filter orders by type</span><select aria-label="Filter orders by type" value={kind} onChange={e => setKind(e.target.value)} className="orders-filter-select"><option value="all">All orders</option><option value="priority">Priority only</option><option value="at-risk">At-risk deadlines</option><option value="flagged">Flagged only</option></select><ChevronDown className="orders-filter-chevron" aria-hidden="true" /></label>
        </div>
        <div className="orders-toolbar-actions">
          <button type="button" disabled={!sel.length} onClick={() => onPrint(sel)} className="ops-secondary orders-action-button"><Printer className="w-4 h-4" />Print labels <span className="orders-action-count">{sel.length || ''}</span></button>
          <button type="button" disabled={!selectedStageable.length} onClick={async () => { await onStage(selectedStageable); setSel(current => current.filter(id => !selectedStageable.includes(id))); }} className="ops-primary orders-action-button"><Package className="w-4 h-4" />Move to staging <span className="orders-action-count">{selectedStageable.length || ''}</span></button>
          {(q || stage !== 'all' || courier !== 'all' || kind !== 'all') && <button type="button" onClick={() => { setQ(''); setStage('all'); setCourier('all'); setKind('all'); setSel([]); }} className="orders-reset-button"><RotateCcw className="w-3.5 h-3.5" />Reset</button>}
        </div>
      </div>
    </div>

    {view === 'table' ? <div className="ops-card orders-table-wrap overflow-x-auto">
      <div className="mobile-table-scroll-hint"><ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /><span>Scroll sideways to reach order actions</span></div>
      <table className="w-full text-sm orders-table">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{['', 'Order', 'Items', 'Location', 'Stage', 'Courier', 'Deadline', 'Updated', 'Action', ''].map((h, i) => <th key={i} className="px-4 py-3.5 text-left font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.slice(0, 100).map(o => <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60"><td className="px-4 py-3"><input type="checkbox" checked={sel.includes(o.id)} onChange={() => toggle(o.id)} aria-label={`Select ${o.id}`} className="w-4 h-4" /></td><td className="px-4 py-3"><div className="font-mono font-bold text-xs">{o.id}{o.priority === 'priority' && <Zap className="inline w-3.5 h-3.5 ml-1 text-purple-600" />}</div><div className="text-[10px] text-slate-500">{o.customer}</div></td><td className="px-4 py-3"><Chip o={o} /></td><td className="px-4 py-3"><div className="text-[10px] font-semibold">{o.city}</div><div className="text-[10px] text-slate-400">{o.state} · {o.country}</div></td><td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STAGE_META.find(s => s.key === stageOf(o))?.soft || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{stageName(stageOf(o))}</span></td><td className="px-4 py-3 text-[10px] text-slate-600">{o.courier || '—'}</td><td className="px-4 py-3">{dl(o)}</td><td className="px-4 py-3 text-[9px] text-slate-400 whitespace-nowrap">{o.updatedAt ? new Date(o.updatedAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td><td className="orders-table-action-cell px-4 py-3 text-right">{act(o)}</td><td className="px-4 py-3">{flag(o)}</td></tr>)}{!rows.length && <tr><td colSpan={10} className="orders-empty-state px-6 py-14 text-center"><div className="mx-auto max-w-sm"><p className="orders-empty-title text-sm font-semibold">No orders match these filters</p><p className="orders-empty-description mt-1 text-xs">Try a different search or clear the filters to see your full queue.</p><button type="button" onClick={() => { setQ(''); setStage('all'); setCourier('all'); setKind('all'); setSel([]); }} className="ops-secondary mt-4 text-xs">Clear filters</button></div></td></tr>}</tbody>
      </table>
      {rows.length > 100 && <div className="p-3 text-center text-[10px] text-slate-400">Showing 100 of {rows.length}. Narrow the filters to work the rest.</div>}
    </div> : <div className="kanban-layout">
      <div className="kanban-scroll kanban-stage-columns" aria-label="Kanban board with independently scrollable stages">
        {STAGES.map(([k, l, dot, soft, hex]) => {
          const stageRows = rows.filter(o => stageOf(o) === k);
          return <section key={k} id={`kanban-stage-${k}`} ref={el => { kanbanColumnRefs.current[k] = el; }} className={`kanban-stage-column ${kanbanStage === k ? 'is-selected' : ''}`} style={{'--column-accent': hex}}>
            <header className="kanban-stage-column-header">
              <div className="flex items-center gap-2 min-w-0"><span className={`w-2.5 h-2.5 rounded-full ${dot}`} /><span className="font-bold text-sm truncate">{l}</span></div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => toggleStageSelection(k)} className="kanban-stage-select text-[9px] font-bold" title={`Select ${l} orders`}>{stageRows.length && stageRows.slice(0,100).every(o => sel.includes(o.id)) ? 'Clear' : 'Select'}</button>
                <span className="kanban-stage-column-count">{stageRows.length}</span>
              </div>
            </header>
            <div className="kanban-stage-column-body">
              {stageRows.slice(0, 100).map(o => { const c = countdown(o.deadline, timerNow); return <article key={o.id} className={`kanban-order-card ops-order-card bg-white rounded-xl border-t-4 p-4 shadow-[0_1px_2px_rgba(15,23,42,.03)] ${o.priority === 'priority' ? 'border-purple-300 ring-1 ring-purple-50' : 'border-slate-200'} ${sel.includes(o.id) ? 'is-selected' : ''}`} style={{ borderTopColor: hex }}>
                <div className="flex items-start justify-between gap-2"><div className="flex items-start gap-2 min-w-0"><input type="checkbox" checked={sel.includes(o.id)} onChange={() => toggle(o.id)} aria-label={`Select ${o.id}`} className="kanban-order-select mt-0.5 w-3.5 h-3.5 shrink-0" /><div className="min-w-0"><div className="font-mono font-bold text-xs">{o.id}</div><div className="text-[10px] text-slate-500 mt-1 truncate">{o.customer}</div></div></div>{o.priority === 'priority' && <span className="text-[9px] font-bold text-purple-700 inline-flex items-center gap-1 shrink-0"><Zap className="w-3 h-3" />EXPRESS</span>}</div>
                <div className="mt-2"><Chip o={o} /></div>
                <div className="flex items-center gap-1.5 mt-3 text-[9px] text-slate-400"><MapPin className="w-3 h-3" />{o.city}, {o.state} · {o.country}</div>
                <div className="mt-3 flex items-center justify-between gap-2"><span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.cls}`}><Clock3 className="w-3 h-3" />{c.text}</span><span className="text-[9px] font-mono text-slate-400">{new Date(o.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="kanban-order-interaction-row">
                  <StageSlider stage={k} onJump={jumpToStage} />
                  <div className="kanban-order-details">
                    <div className="kanban-order-stage-meta"><CircleCheck className="w-3 h-3" />{stageName(k)}</div>
                    {(o.trackingLink || o.courier) && <div className="kanban-order-tracking"><span className="truncate">{o.courier || 'Courier pending'}</span>{o.trackingLink ? <a href={o.trackingLink} target="_blank" rel="noreferrer">Track <ExternalLink className="w-2.5 h-2.5" /></a> : <span>Tracking pending</span>}</div>}
                    <div className="kanban-order-action">{act(o)}</div>
                  </div>
                </div>
              </article>; })}
              {!stageRows.length && <div className="ops-card p-8 text-center text-xs text-slate-400">No orders in this stage.</div>}
              {stageRows.length > 100 && <div className="text-center text-[10px] text-slate-400 py-2">Showing first 100 of {stageRows.length}</div>}
            </div>
          </section>;
        })}
        {rows.some(o => stageOf(o) === 'shipped') && <div className="sr-only"><Layers3 /></div>}
      </div>
    </div>}

    {labelFor && best && <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center p-4" onClick={closeLabelDialog} role="presentation">
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 relative border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-label-dialog-title"><button type="button" autoFocus aria-label="Close create label dialog" disabled={!!savingCourier} onClick={closeLabelDialog} className="absolute right-4 top-4 p-2 rounded-lg hover:bg-slate-50 cursor-pointer disabled:cursor-wait"><X className="w-4 h-4" /></button><h2 id="create-label-dialog-title" className="text-xl font-extrabold">Create Label · {labelFor.id}</h2><p className="text-xs text-slate-500 mt-1 mb-4">Compare courier cost, speed and pickup. After cutoff, the label is ready for the next pickup.</p>{labelError && <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800" role="alert">{labelError}</p>}<div className="space-y-2">{COURIER_OPTIONS.map(c => { const cutoffPassed = passed(c.cutoff, timerNow); const isBest = c.name === best.name; const isSaving = savingCourier === c.name; return <button key={c.name} type="button" disabled={!!savingCourier} onClick={() => createOrderLabel(c)} aria-busy={isSaving} className={`w-full text-left border rounded-xl p-4 cursor-pointer flex items-center justify-between gap-4 disabled:cursor-wait ${isBest ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'} hover:border-slate-400`}><div><div className="font-bold text-sm flex items-center gap-2">{c.name}{isBest && <span className="text-[9px] text-emerald-700 inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />BEST VALUE</span>}{isSaving && <span className="text-[10px] font-medium text-slate-500 inline-flex items-center gap-1"><LoaderCircle className="w-3 h-3 animate-spin" />Creating</span>}</div><div className="text-[10px] text-slate-500 mt-0.5">{c.speed} · pickup {c.pickup} · cutoff {c.cutoff}{cutoffPassed ? ' · next pickup' : ''}</div></div><div className="text-lg font-mono font-bold">₹{c.cost}</div></button>; })}</div></div>
    </div>}
  </div>;
}

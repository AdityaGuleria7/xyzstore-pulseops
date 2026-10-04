import React, { useMemo, useState } from 'react';
import { Truck, Clock, Package, MapPin, AlertTriangle, Download, Plus, X, Zap, ArrowLeftRight, ClipboardCheck, Search, ScanLine, ImagePlus, Check, CheckCircle2, ShieldCheck, Boxes, PackageCheck, TriangleAlert, Wrench, Route, Tag, ChevronRight } from 'lucide-react';
import { COURIER_OPTIONS } from './Orders';
import { countdown } from './Dashboard';
import CameraScanner from './CameraScanner';
import PageHeader from './PageHeader';
import IssueCategoryLegend from './IssueCategoryLegend';
import { ISSUE_CATEGORY_META } from '../utils/ops';

const MEDIA_BASE = process.env.REACT_APP_BACKEND_URL || (window.location.hostname === 'localhost' && window.location.port === '3000' ? 'http://localhost:8000' : window.location.origin);

export const Btn = 'px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors';
export const Field = 'ops-field';
const isValidTrackingUrl = value => {
  try {
    return ['http:', 'https:'].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
};

export const Modal = ({ title, onClose, children, maxWidth = 'max-w-lg', contentClassName = '' }) => (
  <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center p-4" onClick={onClose}>
    <div className={`bg-white rounded-2xl w-full ${maxWidth} p-6 relative border border-slate-200 shadow-2xl ${contentClassName}`} onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-lg hover:bg-slate-50 text-slate-500"><X className="w-4 h-4" /></button>
      <h2 className="text-xl font-extrabold pr-8">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  </div>
);

const Pill = ({ children, tone = 'slate' }) => {
  const cls = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  }[tone] || 'bg-slate-100 text-slate-600 border-slate-200';
  return <span className={`inline-flex items-center px-2 py-1 rounded-md border text-[10px] font-bold ${cls}`}>{children}</span>;
};

export const StagingView = ({ boxes, bays, orders, now, onHandover, onScanBox, onTrackingUpdate }) => {
  const [trackingBox, setTrackingBox] = useState(null);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingPreview, setTrackingPreview] = useState(false);
  const [open, setOpen] = useState(null);
  const [by, setBy] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanBox, setScanBox] = useState('');
  const [scanBay, setScanBay] = useState(bays[0]?.id || '');
  const staged = boxes.filter(b => b.status === 'waiting_pickup' || b.status === 'missed');
  const ready = c => staged.filter(b => b.courier === c).length;
  const co = COURIER_OPTIONS.find(c => c.name === open);
  const scanTargets = boxes.filter(b => b.status === 'waiting_pickup' || b.status === 'missed');
  const submitScan = (boxId = scanBox) => {
    const box = scanTargets.find(b => b.id.toLowerCase() === String(boxId || '').trim().toLowerCase());
    if (!box || !scanBay || !onScanBox) return;
    onScanBox(box.id, scanBay);
    setScanOpen(false);
    setCameraOpen(false);
    setScanBox('');
  };
  return (
    <div className="ops-page space-y-6">
      <PageHeader title="Courier Pickups & Staging Bays" right={
        <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => { setTrackingBox(boxes[0] || null); setTrackingUrl(boxes[0]?.trackingLink || ''); setTrackingOpen(true); }} className="ops-secondary inline-flex items-center gap-2"><MapPin className="w-4 h-4" />Track shipment</button><button onClick={() => setScanOpen(true)} className="ops-primary inline-flex items-center gap-2"><ScanLine className="w-4 h-4" />Scan box</button></div>
      } />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[COURIER_OPTIONS[3], COURIER_OPTIONS[0], COURIER_OPTIONS[1], COURIER_OPTIONS[2]].map(c => (
          <div key={c.name} className="ops-card p-5">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Truck className="w-5 h-5" /></div><div><div className="font-bold text-base">{c.name}</div><div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.pickup} · {c.speed}</div></div></div>
            <div className="mt-4 border border-slate-200 rounded-lg px-4 py-3 flex justify-between items-center text-xs text-slate-500">Boxes ready<span className="flex items-center gap-1 text-2xl font-extrabold text-slate-900"><Package className="w-4 h-4 text-blue-600" />{ready(c.name)}</span></div>
            <button onClick={() => { setOpen(c.name); setBy(''); }} className="w-full mt-3 ops-primary py-3">Handover checklist</button>
          </div>
        ))}
      </div>
      <h2 className="section-title flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-600" />Staging Bays — {staged.length} boxes staged</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bays.map(bay => {
          const inBay = staged.filter(b => b.location === bay.id);
          return <div key={bay.id} className="ops-card p-5 min-h-[210px]">
            <div className="flex justify-between mb-3"><span className="font-mono font-bold text-xl text-purple-600">{bay.id}</span><span className="text-xs text-slate-500">{inBay.length} boxes</span></div>
            <div className="space-y-2">{inBay.map(b => {
              const o = orders.find(x => x.id === b.orderId); const c = countdown(b.scheduledPickup, now);
              return <div key={b.id} className="flex justify-between items-center border border-slate-200 rounded-lg px-3 py-2.5 gap-2"><div className="min-w-0"><div className="font-mono font-bold text-xs truncate">{b.orderId}{o?.priority === 'priority' && <Zap className="inline w-3.5 h-3.5 ml-1 text-purple-600" />}</div><div className="text-xs text-slate-500 truncate">{b.courier}</div></div><div className="flex items-center gap-2 shrink-0"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.cls}`}>{c.text}</span>{b.scannedIn === false && <span className="text-[9px] font-bold text-red-600">UNSCANNED</span>}</div></div>;
            })}</div>
          </div>;
        })}
      </div>
      <div className="ops-card overflow-hidden"><div className="px-5 py-4 border-b border-slate-100"><b className="text-sm">Pickup manifest</b><p className="text-[11px] text-slate-500 mt-0.5">Seal → assign bay → scan in → courier handover.</p></div><div className="divide-y divide-slate-100">{staged.map(box => <div key={box.id} className="p-4 flex flex-wrap items-center gap-3"><div className="w-24"><b className="font-mono text-xs">{box.id}</b><div className="text-[9px] text-slate-400">{box.orderId}</div></div><div className="flex-1 min-w-[180px]"><b className="text-xs">{box.customer}</b><div className="text-[10px] text-slate-500">{box.contents} · {box.courier}</div></div><Pill tone={box.status === 'missed' ? 'red' : 'amber'}>{box.status === 'missed' ? 'Missed pickup' : `Pickup ${new Date(box.scheduledPickup).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</Pill>{box.scannedIn === false ? <span className="text-[10px] font-bold text-red-600">Unscanned</span> : <span className="text-[10px] text-emerald-600 font-semibold">Scanned in</span>}<button type="button" onClick={() => { setTrackingBox(box); setTrackingUrl(box.trackingLink || ''); setTrackingOpen(true); }} className="ops-secondary inline-flex items-center gap-1.5 text-xs"><MapPin className="w-3.5 h-3.5" />{box.trackingLink ? 'Track' : 'Add tracking'}</button></div>)}</div>{!staged.length && <div className="p-10 text-center text-xs text-slate-400">No boxes awaiting pickup.</div>}</div>
      {boxes.filter(b => b.status === 'picked_up').length > 0 && <div className="ops-card overflow-hidden"><div className="px-5 py-4 border-b border-slate-100"><b className="text-sm">Post-pickup tracking</b><p className="text-[10px] text-slate-500 mt-0.5">View carrier updates or add a shipment tracking link.</p></div><div className="divide-y divide-slate-100">{boxes.filter(b => b.status === 'picked_up').slice(0,20).map(b => <div key={b.id} className="p-4 flex flex-wrap items-center gap-3"><div className="w-24"><b className="font-mono text-xs">{b.orderId}</b><div className="text-[9px] text-slate-400">{b.trackingId || b.id}</div></div><div className="flex-1 min-w-[180px]"><div className="text-xs font-semibold">{b.customer}</div><div className="text-[10px] text-slate-500">{b.courier} · picked up {b.pickedUpAt ? new Date(b.pickedUpAt).toLocaleString() : '—'}</div><div className="text-[9px] text-slate-400 mt-0.5">Last updated {b.updatedAt ? new Date(b.updatedAt).toLocaleString() : '—'}{b.trackingAddedAt ? ` · tracking ${new Date(b.trackingAddedAt).toLocaleString()}` : ''}</div></div><div className="flex items-center gap-2">{b.trackingLink && <a href={b.trackingLink} target="_blank" rel="noreferrer noopener" className="text-[10px] text-blue-600 inline-flex items-center gap-1">Open tracking <ExternalLinkIcon/></a>}<button type="button" onClick={() => { setTrackingBox(b); setTrackingUrl(b.trackingLink || ''); setTrackingOpen(true); }} className="ops-secondary inline-flex items-center gap-1.5 text-xs"><MapPin className="w-3.5 h-3.5" />{b.trackingLink ? 'Track' : 'Add tracking'}</button></div></div>)}</div></div>}
      {open && co && <Modal title={`${open} — Handover Sign-off`} onClose={() => setOpen(null)}>
        <div className="ops-panel space-y-2 text-slate-500">{[['Boxes to hand over', ready(open)], ['Pickup window', co.pickup], ['Service', co.speed]].map(([k, v]) => <div key={String(k)} className="flex justify-between text-sm"><span>{k}</span><b className="text-slate-900">{v}</b></div>)}</div>
        <label className="field-label mt-5">Signed by</label><input autoFocus value={by} onChange={e => setBy(e.target.value)} placeholder="Floor Supervisor" className={Field} />
        <div className="flex justify-end gap-2 mt-5"><button onClick={() => setOpen(null)} className="ops-secondary">Cancel</button><button onClick={() => { onHandover(open, by.trim() || 'Floor Supervisor'); setOpen(null); }} className="ops-primary">Confirm handover</button></div>
      </Modal>}
      {trackingOpen && <Modal title="Track shipment" onClose={() => setTrackingOpen(false)} maxWidth="max-w-6xl" contentClassName="tracking-dialog-modal">
        <div className="tracking-dialog-grid">
          <div className="tracking-dialog-controls">
            <label className="field-label" htmlFor="tracking-shipment">Shipment</label>
            <select id="tracking-shipment" value={trackingBox?.id || ''} onChange={event => { const box = boxes.find(item => item.id === event.target.value) || null; setTrackingBox(box); setTrackingUrl(box?.trackingLink || ''); setTrackingPreview(false); }} className={Field}>
              <option value="">Choose a shipment</option>
              {boxes.map(box => <option key={box.id} value={box.id}>{box.orderId} · {box.courier} · {box.trackingId || box.id}</option>)}
            </select>
            {trackingBox && <div className="tracking-shipment-summary"><span>Order</span><strong>{trackingBox.orderId}</strong><span>Carrier</span><strong>{trackingBox.courier}</strong><span>Tracking ID</span><strong>{trackingBox.trackingId || 'Not provided'}</strong></div>}
            <label className="field-label mt-4" htmlFor="tracking-url">Carrier tracking link</label>
            <input id="tracking-url" type="url" inputMode="url" autoComplete="url" value={trackingUrl} onChange={event => { setTrackingUrl(event.target.value); setTrackingPreview(false); }} placeholder="https://carrier.example/track/..." className={Field} />
            <div className="tracking-location-note"><MapPin aria-hidden="true" /><span>Shipment location comes from the carrier’s tracking page. When the carrier allows embedding, its updates appear here; otherwise use the link to open its site.</span></div>
            <div className="tracking-dialog-actions">
              <button type="button" disabled={!trackingBox || !isValidTrackingUrl(trackingUrl)} onClick={() => setTrackingPreview(true)} className="ops-secondary inline-flex items-center justify-center gap-2"><MapPin className="w-4 h-4" />Show tracking</button>
              <button type="button" disabled={!trackingBox || !onTrackingUpdate || !isValidTrackingUrl(trackingUrl)} onClick={async () => { await onTrackingUpdate(trackingBox.orderId, new URL(trackingUrl.trim()).toString()); setTrackingBox(box => ({ ...box, trackingLink: new URL(trackingUrl.trim()).toString() })); }} className="ops-primary inline-flex items-center justify-center gap-2"><Check className="w-4 h-4" />Save link</button>
            </div>
          </div>
          <div className="tracking-dialog-preview">
            {trackingPreview && isValidTrackingUrl(trackingUrl) ? <><div className="tracking-preview-toolbar"><span><MapPin aria-hidden="true" />Carrier tracking page</span><a href={new URL(trackingUrl.trim()).toString()} target="_blank" rel="noreferrer noopener">Open carrier page <ExternalLinkIcon /></a></div><iframe key={trackingUrl} src={new URL(trackingUrl.trim()).toString()} title={`Carrier tracking for ${trackingBox?.orderId || 'shipment'}`} sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" /></> : <div className="tracking-preview-empty"><div><MapPin aria-hidden="true" /></div><strong>Carrier location updates</strong><span>Select a shipment and paste its tracking URL to view carrier updates here.</span></div>}
          </div>
        </div>
      </Modal>}
      {scanOpen && <Modal title="Scan Box Into Staging Bay" onClose={() => setScanOpen(false)}>
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end"><div><label className="field-label">Box</label><select value={scanBox} onChange={e => setScanBox(e.target.value)} className={Field}><option value="">Select a box</option>{scanTargets.map(b => <option key={b.id} value={b.id}>{b.id} · {b.orderId}</option>)}</select></div><button onClick={() => setCameraOpen(true)} className="ops-secondary inline-flex items-center justify-center gap-2"><CameraIcon />Camera</button></div>
        <label className="field-label mt-4">Staging bay</label><select value={scanBay} onChange={e => setScanBay(e.target.value)} className={Field}>{bays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <div className="flex justify-end gap-2 mt-5"><button onClick={() => setScanOpen(false)} className="ops-secondary">Cancel</button><button disabled={!scanBox} onClick={() => submitScan()} className="ops-primary disabled:opacity-40">Scan in</button></div>
      </Modal>}
      <CameraScanner open={cameraOpen} onClose={() => setCameraOpen(false)} title="Scan Staging Box" hint="Use the box barcode, or type the box ID if automatic detection is unavailable." onDetected={code => { setScanBox(code); setTimeout(() => submitScan(code), 0); }} />
    </div>
  );
};

const CameraIcon = () => <ScanLine className="w-4 h-4" />;
const ExternalLinkIcon = () => <span className="inline-block text-[9px]">↗</span>;

const CATS = { 'Wrong Variant': 'packing', 'Damaged Item': 'packing', 'Courier Late': 'courier', 'Barcode Unreadable': 'system', Discrepancy: 'stock', Other: 'system' };
const SEV = { critical: 'bg-red-50 text-red-700 border-red-200', high: 'bg-orange-50 text-orange-700 border-orange-200', medium: 'bg-amber-50 text-amber-800 border-amber-200', low: 'bg-slate-50 text-slate-600 border-slate-200' };
const STAT = { open: 'bg-red-50 text-red-600 border-red-200', investigating: 'bg-amber-50 text-amber-700 border-amber-200', resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

const categoryIcon = category => {
  const Icon = category === 'stock' ? Boxes : category === 'courier' ? Route : category === 'packing' ? PackageCheck : category === 'shipping' ? Tag : Wrench;
  return Icon;
};

export const ProblemLog = ({ issues = [], onAdd, onStatus, onExport, user }) => {
  const [show, setShow] = useState(false);
  const [cat, setCat] = useState('Wrong Variant');
  const [sev, setSev] = useState('medium');
  const [desc, setDesc] = useState('');
  const [ord, setOrd] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const categoryEntries = Object.entries(ISSUE_CATEGORY_META);
  const counts = useMemo(() => categoryEntries.reduce((acc, [key]) => {
    acc[key] = issues.filter(i => i.category === key).length;
    return acc;
  }, {}), [issues]);
  const openCount = issues.filter(i => i.status !== 'resolved').length;
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const visibleIssues = useMemo(() => filterCat === 'all' ? issues : issues.filter(i => i.category === filterCat), [issues, filterCat]);
  const selectedMeta = ISSUE_CATEGORY_META[CATS[cat]] || ISSUE_CATEGORY_META.system;

  const save = () => {
    if (!desc.trim()) return;
    onAdd({
      title: cat,
      description: desc.trim(),
      severity: sev,
      category: CATS[cat],
      reportedBy: user,
      orderId: ord.trim() || undefined,
    });
    setShow(false);
    setDesc('');
    setOrd('');
  };

  return <div className="ops-page space-y-5">
    <PageHeader title="Daily Problem Log" right={<div className="flex gap-2"><button onClick={onExport} className="ops-secondary inline-flex items-center gap-2"><Download className="w-4 h-4" />Export</button><button onClick={() => setShow(true)} className="ops-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Log incident</button></div>} />

    <div className="grid grid-cols-3 gap-3">
      <div className="ops-card p-4"><div className="metric-label">Total incidents</div><div className="metric-value">{issues.length}</div><div className="text-[10px] text-slate-400 mt-1">All saved records</div></div>
      <div className="ops-card p-4"><div className="metric-label">Open</div><div className="metric-value text-red-600">{openCount}</div><div className="text-[10px] text-slate-400 mt-1">Needs follow-up</div></div>
      <div className="ops-card p-4"><div className="metric-label">Critical</div><div className="metric-value text-orange-600">{criticalCount}</div><div className="text-[10px] text-slate-400 mt-1">Escalate now</div></div>
    </div>

    <div className="ops-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-extrabold">Incident categories</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Filter the log by operational ownership.</div>
        </div>
        <span className="text-[10px] text-slate-500">{visibleIssues.length} shown</span>
      </div>
      <IssueCategoryLegend counts={counts} active={filterCat} onChange={setFilterCat} />
    </div>

    <div className="space-y-3">
      {visibleIssues.map(i => {
        const meta = ISSUE_CATEGORY_META[i.category] || ISSUE_CATEGORY_META.system;
        const Icon = categoryIcon(i.category);
        return <article key={i.id} className="problem-log-card ops-card overflow-hidden" style={{ '--issue-color': meta.stripe }}>
          <div className="problem-log-card-accent" />
          <div className="p-5">
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
              <div className="flex gap-3 min-w-0 flex-1">
                <div className="problem-log-icon" style={{ background: `${meta.stripe}12`, color: meta.stripe }}><Icon className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400">{i.id}</span>
                    <h3 className="text-base font-extrabold text-slate-900">{i.title || 'Operational issue'}</h3>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border ${meta.classes}`}><span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.stripe }} />{meta.label}</span>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full border capitalize ${SEV[i.severity] || SEV.medium}`}>{i.severity || 'medium'}</span>
                  </div>
                  <p className="problem-log-description">{i.description || 'No description was provided for this incident.'}</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
                    <div className="problem-log-meta"><span>Reported by</span><b>{i.reportedBy || 'System'}</b></div>
                    <div className="problem-log-meta"><span>When</span><b>{i.reportedAt ? new Date(i.reportedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}</b></div>
                    <div className="problem-log-meta"><span>Order</span><b className="font-mono">{i.orderId || '—'}</b></div>
                    <div className="problem-log-meta"><span>Next step</span><b>{i.status === 'resolved' ? 'Closed' : 'Follow-up required'}</b></div>
                  </div>
                  {i.aiSuggestion && <div className="problem-log-guidance"><span className="problem-log-guidance-label">Suggested follow-up</span><span>{i.aiSuggestion}</span></div>}
                </div>
              </div>
              <div className="xl:w-44 shrink-0">
                <label className="field-label">Status</label>
                <select value={i.status || 'open'} onChange={e => onStatus(i.id, e.target.value)} className={`${Field} font-semibold ${STAT[i.status] || STAT.open}`} aria-label={`Update status for ${i.title}`}>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>
        </article>;
      })}
    </div>

    {!visibleIssues.length && <div className="ops-card p-12 text-center"><div className="w-11 h-11 rounded-xl bg-slate-100 mx-auto flex items-center justify-center"><TriangleAlert className="w-5 h-5 text-slate-400" /></div><div className="text-sm font-extrabold mt-3">No incidents to show</div><div className="text-xs text-slate-400 mt-1">Try another category or log a new operational issue.</div></div>}

    {show && <Modal title="Log Incident" onClose={() => setShow(false)}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="field-label">Category</label><select value={cat} onChange={e => setCat(e.target.value)} className={`${Field} category-select`}><option>Wrong Variant</option><option>Damaged Item</option><option>Courier Late</option><option>Barcode Unreadable</option><option>Discrepancy</option><option>Other</option></select></div>
        <div><label className="field-label">Severity</label><select value={sev} onChange={e => setSev(e.target.value)} className={Field}>{['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></div>
      </div>
      <div className="mt-3 p-3 rounded-xl border" style={{ borderColor: selectedMeta.stripe, background: `${selectedMeta.stripe}08` }}><div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: selectedMeta.stripe }}>Category signal</div><div className="text-xs font-semibold text-slate-700 mt-1">This incident will be marked as {selectedMeta.label} in the log.</div></div>
      <label className="field-label mt-4">Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} className={Field} placeholder="Describe what happened, where it occurred, and what is blocked." />
      <label className="field-label mt-4">Order ID <span className="text-slate-400 font-medium">(optional)</span></label><input value={ord} onChange={e => setOrd(e.target.value)} placeholder="XYZ-10001" className={Field} />
      <div className="flex justify-end gap-2 mt-5"><button onClick={() => setShow(false)} className="ops-secondary">Cancel</button><button disabled={!desc.trim()} onClick={save} className="ops-primary disabled:opacity-40">Save incident</button></div>
    </Modal>}
  </div>;
};

export const StockLedger = ({ inventory, activity, onTransfer, onAudit, onVerify }) => {
  const [q, setQ] = useState(''); const [only, setOnly] = useState(false); const [tr, setTr] = useState(null); const [au, setAu] = useState(null); const [verify, setVerify] = useState(null); const [n, setN] = useState(0); const [notes, setNotes] = useState(''); const [photo, setPhoto] = useState(null); const [preview, setPreview] = useState('');
  const needs = i => i.quantity <= i.reorderPoint && (i.wh2Quantity ?? 0) > 0;
  const nNeed = inventory.filter(needs).length;
  const rows = inventory.filter(i => (!only || needs(i)) && `${i.name} ${i.sku} ${i.barcode} ${i.location}`.toLowerCase().includes(q.toLowerCase()));
  const status = i => i.quantity <= 0 ? ['OUT', 'text-red-600 bg-red-50 border-red-200'] : i.quantity <= i.reorderPoint ? ['LOW', 'text-amber-700 bg-amber-50 border-amber-200'] : ['OK', 'text-emerald-700 bg-emerald-50 border-emerald-200'];
  const log = activity.filter(a => ['transfer', 'receive', 'audit', 'verify', 'seal', 'pick'].includes(a.type)).slice(0, 30);
  const choosePhoto = file => { if (!file) return; setPhoto(file); setPreview(URL.createObjectURL(file)); };
  const closeVerify = () => { if (preview) URL.revokeObjectURL(preview); setVerify(null); setPhoto(null); setPreview(''); setNotes(''); };
  const submitVerify = async () => { if (!verify) return; try { await onVerify?.(verify.sku, Number(n), notes, photo); closeVerify(); } catch {} };
  return <div className="ops-page space-y-6">
    <PageHeader title="Stock Ledger & Warehouse Transfers" right={<div className="stock-header-search relative w-full sm:w-[330px] md:w-[360px]"><span className="stock-search-icon absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 -translate-x-0.5 items-center justify-center rounded-lg text-slate-500 pointer-events-none"><Search className="w-4 h-4" /></span><input aria-label="Search inventory" value={q} onChange={e => setQ(e.target.value)} placeholder="Search SKU, name, barcode, shelf..." className={`${Field} pl-12 pr-10 shadow-none`} />{q && <button type="button" onClick={() => setQ('')} aria-label="Clear inventory search" className="stock-search-clear absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">×</button>}</div>} />
    {nNeed > 0 && <div className="ops-alert ops-alert-warning"><span className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" />{nNeed} SKU(s) need a Warehouse 2 → Main transfer before they can be picked.</span><button onClick={() => setOnly(o => !o)} className="font-semibold">{only ? 'Show all' : 'Show only these'}</button></div>}
    <div className="grid lg:grid-cols-[1fr_330px] gap-5"><div className="ops-card overflow-hidden"><div className="mobile-table-scroll-hint"><ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /><span>Scroll sideways to reach audit and verification</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{['Product','Location','Main','WH2','Status','Last updated','Verification',''].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr></thead><tbody>{rows.map(i => { const [s, c] = status(i); return <tr key={i.sku} className={`border-t border-slate-100 ${needs(i) ? 'bg-amber-50/40' : ''}`}><td className="px-4 py-3"><div className="font-bold">{i.name}</div><div className="font-mono text-[10px] text-slate-500">{i.sku} · {i.variant}</div></td><td className="px-4 py-3 text-slate-600"><MapPin className="inline w-3.5 h-3.5 mr-1" />{i.location}</td><td className={`px-4 py-3 font-mono font-bold text-lg ${i.quantity <= 0 ? 'text-red-600' : i.quantity <= i.reorderPoint ? 'text-amber-600' : 'text-emerald-600'}`}>{i.quantity}</td><td className="px-4 py-3 font-mono text-lg text-slate-500">{i.wh2Quantity ?? 0}</td><td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c}`}>{s}</span></td><td className="px-4 py-3 whitespace-nowrap"><div className="text-[10px] font-semibold text-slate-600">{i.lastUpdated ? new Date(i.lastUpdated).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}</div><div className="text-[9px] text-slate-400">{i.lastUpdated ? new Date(i.lastUpdated).toLocaleDateString([], {day:'2-digit',month:'short'}) : ''}</div></td><td className="px-4 py-3">{i.verificationStatus === 'verified' ? <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className="inline-flex items-center gap-1.5 text-emerald-700"><ShieldCheck className="w-3.5 h-3.5" />Verified</span>{i.verificationPhotoUrl && <a href={`${MEDIA_BASE}${i.verificationPhotoUrl}`} target="_blank" rel="noreferrer" className="text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-900">View photo</a>}</div> : <span className="text-[10px] text-slate-400">Needs verify</span>}</td><td className="px-4 py-3 text-right whitespace-nowrap">{needs(i) && <button onClick={() => { setTr(i); setN(Math.min(i.wh2Quantity ?? 0, Math.max(1, i.reorderPoint * 2 - i.quantity))); }} className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 bg-white rounded-lg px-3 py-2 text-xs font-semibold mr-2"> <ArrowLeftRight className="w-3.5 h-3.5" />Transfer</button>}<button onClick={() => { setAu(i); setN(i.quantity); }} className="ops-secondary mr-2">Audit</button><button onClick={() => { setVerify(i); setN(i.quantity); setNotes(i.verificationNotes || ''); setPreview(''); setPhoto(null); }} className="ops-secondary inline-flex items-center gap-1.5"><ImagePlus className="w-3.5 h-3.5" />Verify</button></td></tr>; })}</tbody></table>{!rows.length && <div className="p-10 text-center text-xs text-slate-400">No inventory rows match the current search.</div>}</div></div>
      <div className="ops-card p-5 self-start max-h-[640px] overflow-y-auto"><h2 className="section-title flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-blue-600" />Audit & Movement Log</h2><div className="space-y-3 mt-4">{log.length ? log.map(a => <div key={a.id} className="border border-slate-200 rounded-lg p-3"><div className="text-sm font-semibold">{a.message}</div><div className="text-[10px] text-slate-500 mt-1">{a.actor} · {new Date(a.timestamp).toLocaleTimeString()}</div></div>) : <p className="text-sm text-slate-400">No movements yet.</p>}</div></div></div>
    {tr && <Modal title={`Transfer — ${tr.sku}`} onClose={() => setTr(null)}><div className="flex justify-center items-center gap-6 text-center mb-5"><div><div className="text-3xl font-mono font-bold">{tr.wh2Quantity}</div><div className="text-xs text-slate-500">Warehouse 2</div></div><ArrowLeftRight className="text-amber-600" /><div><div className="text-3xl font-mono font-bold">{tr.quantity}</div><div className="text-xs text-slate-500">Main</div></div></div><label className="field-label">Units to move to Main</label><input type="number" min="1" max={tr.wh2Quantity} value={n} onChange={e => setN(Number(e.target.value))} className={Field} /><div className="flex justify-end gap-2 mt-5"><button onClick={() => setTr(null)} className="ops-secondary">Cancel</button><button disabled={n < 1 || n > (tr.wh2Quantity ?? 0)} onClick={() => { onTransfer(tr.sku, n); setTr(null); }} className="ops-primary disabled:opacity-40">Move stock</button></div></Modal>}
    {au && <Modal title={`Audit — ${au.sku}`} onClose={() => setAu(null)}><p className="text-sm text-slate-500 mb-4">System shows <b className="text-slate-900">{au.quantity}</b> on {au.location}. Enter the physical count to reconcile.</p><input type="number" min="0" value={n} onChange={e => setN(Number(e.target.value))} className={Field} /><div className="flex justify-end gap-2 mt-5"><button onClick={() => setAu(null)} className="ops-secondary">Cancel</button><button disabled={n < 0} onClick={() => { onAudit(au.sku, n); setAu(null); }} className="ops-primary disabled:opacity-40">Save count</button></div></Modal>}
    {verify && <Modal title={`Verify Inventory — ${verify.sku}`} onClose={closeVerify} maxWidth="max-w-xl"><div className="ops-panel space-y-3"><div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Shelf verification with optional photo evidence</div><div className="grid sm:grid-cols-2 gap-3"><div><div className="field-label">SKU</div><div className="font-mono text-sm font-extrabold">{verify.sku}</div></div><div><div className="field-label">Current system count</div><div className="text-sm font-extrabold">{verify.quantity}</div></div></div></div><label className="field-label mt-4">Physical count</label><input type="number" min="0" value={n} onChange={e => setN(Number(e.target.value))} className={Field} /><label className="field-label mt-4">Verification notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={Field} placeholder="Shelf condition, discrepancy reason, count notes..." /><label className="field-label mt-4">Shelf photo</label><div className="mt-2 border border-dashed border-slate-300 rounded-xl p-4"><div className="flex flex-wrap items-center gap-2"><label className="ops-secondary inline-flex items-center gap-2 cursor-pointer"><ImagePlus className="w-4 h-4" />Upload photo<input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => choosePhoto(e.target.files?.[0])} /></label>{photo && <span className="text-[10px] text-slate-500">{photo.name}</span>}</div>{preview && <img src={preview} alt="Inventory verification" className="mt-3 w-full max-h-56 object-cover rounded-lg border border-slate-200" />}</div><div className="flex justify-end gap-2 mt-5"><button onClick={closeVerify} className="ops-secondary">Cancel</button><button disabled={n < 0 || !verify} onClick={submitVerify} className="ops-primary disabled:opacity-40 inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Verify & save</button></div></Modal>}
  </div>;
};

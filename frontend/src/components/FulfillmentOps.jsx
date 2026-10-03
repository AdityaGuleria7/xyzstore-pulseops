import React, { useMemo, useState } from 'react';
import { AlertTriangle, Camera, Check, ChevronDown, Clock3, ExternalLink, FileSpreadsheet, PackageCheck, Printer, Tag, Upload, Boxes, ShieldCheck, Users, ScanLine, MapPin, Truck, X, CalendarDays, Activity, Gauge, UserRound, CheckCircle2 } from 'lucide-react';
import { COURIER_OPTIONS, stageOf } from './Orders';
import { countdown } from './Dashboard';
import CameraScanner from './CameraScanner';
import PageHeader from './PageHeader';

const Pill = ({ children, tone='slate' }) => { const c={green:'bg-emerald-50 text-emerald-700 border-emerald-200',amber:'bg-amber-50 text-amber-800 border-amber-200',red:'bg-red-50 text-red-700 border-red-200',blue:'bg-blue-50 text-blue-700 border-blue-200',purple:'bg-purple-50 text-purple-700 border-purple-200',slate:'bg-slate-100 text-slate-600 border-slate-200'}[tone]; return <span className={`inline-flex items-center px-2 py-1 rounded-md border text-[10px] font-bold ${c||'bg-slate-100 text-slate-600 border-slate-200'}`}>{children}</span>; };
const Field = ({className='',...props}) => <input {...props} className={`ops-field ${className}`}/>;
const Modal = ({title,onClose,children,max='max-w-lg'}) => <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center p-4" onClick={onClose}><div className={`bg-white rounded-2xl w-full ${max} p-6 relative border border-slate-200 shadow-2xl`} onClick={e=>e.stopPropagation()}><button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-lg hover:bg-slate-50"><X className="w-4 h-4"/></button><h2 className="text-xl font-extrabold pr-8">{title}</h2><div className="mt-5">{children}</div></div></div>;

export function BatchOrders(){ return null; }

export function Receiving({ receiving, inventory, onReceive }) {
  const [qtys, setQtys] = useState({});
  const [selectedSku, setSelectedSku] = useState({});
  const open = receiving.filter(r => r.status !== 'received');
  const recent = receiving.filter(r => r.status === 'received').slice(0, 6);
  const totalExpected = receiving.reduce((s, r) => s + Number(r.expectedQty || 0), 0);
  const totalReceived = receiving.reduce((s, r) => s + Number(r.receivedQty || 0), 0);

  const lineItems = (r) => r.items?.length ? r.items : [{
    sku: r.sku,
    product: r.product,
    variant: '',
    expectedQty: Number(r.expectedQty || 0),
    receivedQty: Number(r.receivedQty || 0),
  }];

  const selectedLine = (r) => {
    const items = lineItems(r);
    const preferred = selectedSku[r.id];
    return items.find(x => x.sku === preferred) || items.find(x => Number(x.expectedQty || 0) > Number(x.receivedQty || 0)) || items[0];
  };

  const submitReceive = (r) => {
    const line = selectedLine(r);
    if (!line) return;
    const remaining = Math.max(0, Number(line.expectedQty || 0) - Number(line.receivedQty || 0));
    const requested = Math.max(1, Math.min(remaining || 1, Number(qtys[r.id] || remaining || 1)));
    if (!remaining) return;
    onReceive(r.id, requested, line.sku);
    setQtys(p => ({ ...p, [r.id]: '' }));
  };

  const statusTone = (status) => status === 'exception' ? 'red' : status === 'receiving' ? 'amber' : 'blue';

  return <div className="ops-page space-y-5">
    <PageHeader title="Receiving & Put-away" help="Inbound deliveries, suppliers, line items, quantities, warehouse destination, and put-away status."/>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[['Open deliveries', open.length], ['Units expected', totalExpected], ['Units received', totalReceived]].map(([label, value]) => (
        <div key={label} className="ops-card p-4">
          <div className="metric-label">{label}</div>
          <div className="metric-value">{value}</div>
        </div>
      ))}
    </div>

    <section>
      <div className="section-title flex items-center gap-2 mb-3">
        <PackageCheck className="w-5 h-5 text-blue-600" />
        Inbound ({open.length})
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {open.map(r => {
          const items = lineItems(r);
          const remainingTotal = Math.max(0, Number(r.expectedQty || 0) - Number(r.receivedQty || 0));
          const line = selectedLine(r);
          const lineRemaining = line ? Math.max(0, Number(line.expectedQty || 0) - Number(line.receivedQty || 0)) : 0;
          const value = qtys[r.id] ?? String(lineRemaining || 1);
          const primaryInv = inventory.find(i => i.sku === (line?.sku || r.sku));
          return <article key={r.id} className="receiving-card ops-card">
            <div className="receiving-card-main">
              <div className="receiving-card-head">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="receiving-id">{r.id}</span>
                    <Pill>{r.warehouse || 'Main'}</Pill>
                    <Pill tone={statusTone(r.status)}>{String(r.status || 'pending').toUpperCase()}</Pill>
                  </div>
                  <div className="receiving-meta">{r.supplier} · ETA {new Date(r.eta).toLocaleString([], { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                </div>
                <div className="receiving-total">
                  <div className="receiving-total-value">{remainingTotal}</div>
                  <div className="receiving-total-label">units open</div>
                </div>
              </div>

              <div className="receiving-items" aria-label={`${r.id} inbound items`}>
                {items.map(item => {
                  const remaining = Math.max(0, Number(item.expectedQty || 0) - Number(item.receivedQty || 0));
                  const active = line?.sku === item.sku;
                  const variantText = item.variant ? ` (${item.variant})` : '';
                  return <button
                    type="button"
                    key={item.sku}
                    onClick={() => setSelectedSku(p => ({ ...p, [r.id]: item.sku }))}
                    className={`receiving-item-chip ${active ? 'is-selected' : ''} ${remaining === 0 ? 'is-complete' : ''}`}
                    title={`${item.product}${variantText} · ${remaining} units remaining`}
                  >
                    <span className="receiving-item-dot" />
                    <span className="receiving-item-name">{item.product}{variantText}</span>
                    <span className="receiving-item-qty">+{remaining || item.expectedQty}</span>
                    {remaining === 0 && <Check className="w-3.5 h-3.5" />}
                  </button>;
                })}
              </div>

              <div className="receiving-foot">
                <div className="min-w-0">
                  <div className="receiving-footline">
                    <span>{r.poNumber}</span><span>·</span><span>{r.dock}</span><span>·</span><span>Bin: {primaryInv?.location || 'Assign after receive'}</span>
                  </div>
                  <div className="receiving-updated">Last update {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}</div>
                </div>
                <div className="receiving-action">
                  <span className="receiving-selected-label">{line?.variant || line?.product || r.product}</span>
                  <input type="number" min="1" max={Math.max(1, lineRemaining)} value={value} onChange={e => setQtys(p => ({ ...p, [r.id]: e.target.value }))} className="ops-field receiving-qty-input" aria-label={`Receive quantity for ${r.id}`} />
                  <button disabled={lineRemaining <= 0} onClick={() => submitReceive(r)} className="ops-primary receiving-btn disabled:opacity-30">
                    <PackageCheck className="w-3.5 h-3.5 mr-1" />Receive
                  </button>
                </div>
              </div>
            </div>
          </article>;
        })}
      </div>
    </section>

    <section>
      <h2 className="section-title mb-3">Recently received</h2>
      {recent.length ? <div className="grid md:grid-cols-2 gap-3">{recent.map(r => (
        <div key={r.id} className="receiving-recent ops-card p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold">{r.id}</span><Pill tone="green">RECEIVED</Pill></div>
            <div className="text-xs text-slate-500 mt-1">{r.supplier} · {r.warehouse} · {r.poNumber}</div>
            <div className="text-[9px] text-slate-400 mt-1">Received {r.receivedAt ? new Date(r.receivedAt).toLocaleString() : '—'}</div>
          </div>
          <div className="text-right"><div className="text-lg font-extrabold">{r.receivedQty}</div><div className="text-[9px] text-slate-400">units</div></div>
        </div>
      ))}</div> : <div className="ops-card p-6 text-xs text-slate-400">No deliveries have been received yet.</div>}
    </section>
  </div>;
}

export function LabelCenter({ orders, onLabel }) {
  const candidates=orders.filter(o=>o.status==='pending'); const [selected,setSelected]=useState(candidates[0]?.id||''); const order=orders.find(o=>o.id===selected); const now=new Date(); const eligible=COURIER_OPTIONS.filter(c=>{const [h,m]=c.cutoff.split(':').map(Number);return now.getHours()*60+now.getMinutes()<h*60+m});const cheapest=eligible.slice().sort((a,b)=>a.cost-b.cost)[0]?.name;
  return <div className="ops-page space-y-5"><PageHeader title="Create Label · Courier Comparison" help="Courier cost, speed, pickup window, cutoff, and label assignment."/><div className="ops-card p-5"><label className="field-label">Received order</label><select value={selected} onChange={e=>setSelected(e.target.value)} className="ops-field">{candidates.map(o=><option key={o.id}>{o.id} · {o.customer}</option>)}</select>{order&&<div className="grid lg:grid-cols-4 gap-3 mt-5">{COURIER_OPTIONS.map(c=>{const passed=!eligible.some(x=>x.name===c.name),best=!passed&&c.name===cheapest;return <div key={c.name} className={`border rounded-xl p-4 ${best?'border-emerald-300 bg-emerald-50/40':'border-slate-200'} ${passed?'opacity-50':''}`}><div className="flex justify-between gap-2"><b className="text-sm">{c.name}</b>{best?<Pill tone="green">BEST VALUE</Pill>:passed?<Pill tone="red">Cutoff passed</Pill>:<Pill>Eligible</Pill>}</div><div className="text-[10px] text-slate-500 mt-1">{c.speed} · pickup {c.pickup}</div><div className="grid grid-cols-2 gap-2 mt-4 text-xs"><div><span className="block text-slate-400">Cost</span><b>₹{c.cost}</b></div><div><span className="block text-slate-400">Cutoff</span><b>{c.cutoff}</b></div></div><button disabled={passed} onClick={()=>onLabel(order.id,c.name,c.cost)} className="ops-primary w-full mt-4 disabled:opacity-30"><Tag className="w-3.5 h-3.5 mr-1"/>Create label</button></div>})}</div>}</div></div>;
}

export function WorkerMode({ orders, inventory, onScan, onSeal, stats }) {
  const queue=useMemo(()=>orders.filter(o=>o.status==='processing'&&!!o.courier).sort((a,b)=>(a.priority===b.priority?0:a.priority==='priority'?-1:1)||new Date(a.deadline)-new Date(b.deadline)),[orders]); const [activeId,setActiveId]=useState(queue[0]?.id||''); const [code,setCode]=useState(''); const [cameraOpen,setCameraOpen]=useState(false); const next=queue.find(o=>o.id===activeId)||queue[0];
  if(!next)return <div className="ops-page"><PageHeader title="Worker Mode" help="No open work in the pick queue."/><div className="ops-card p-12 text-center text-slate-400"><Check className="mx-auto w-10 h-10 text-emerald-600 mb-2"/>Pick queue clear</div></div>;
  const inv=inventory.find(i=>i.barcode===next.barcode); const scanned=next.scanned||0; const complete=scanned>=next.quantity; const submit=value=>{const v=String(value||'').trim();if(!v)return;onScan(next,v);setCode('');setCameraOpen(false);};
  return <div className="ops-page space-y-5"><PageHeader title="Worker Mode — Pick & Pack" help="Pick queue, shelf location, variant verification, unit scans, sealing, and staging handoff." right={<Pill tone={next.priority==='priority'?'purple':'slate'}>{next.priority==='priority'?'EXPRESS PRIORITY':'STANDARD'}</Pill>}/><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Units picked',stats.unitsPicked],['Mis-scans caught',stats.misScans],['Boxes sealed',stats.boxesSealed],['Orders handled',stats.ordersHandled]].map(([l,v])=><div key={l} className="ops-card p-4"><div className="metric-label">{l}</div><div className="metric-value">{v}</div></div>)}</div><div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start"><div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg self-start worker-work-card"><div className="flex justify-between gap-3"><div><div className="text-[10px] text-slate-400 font-bold tracking-wider">NEXT ORDER</div><div className="text-2xl font-extrabold mt-1">{next.id}</div><div className="text-xs text-slate-400 mt-1">{next.customer} · {next.city}, {next.state}</div></div><div className="text-right"><div className="text-[10px] text-slate-400">DEADLINE</div><div className="font-bold mt-1">{new Date(next.deadline).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></div></div><div className="grid sm:grid-cols-2 gap-3 mt-6"><div className="bg-white/10 rounded-xl p-4"><div className="text-[10px] text-slate-400 font-bold">SHELF LOCATION</div><div className="text-2xl font-extrabold mt-1">{inv?.location||'VERIFY BIN'}</div></div><div className="bg-white/10 rounded-xl p-4"><div className="text-[10px] text-slate-400 font-bold">VARIANT</div><div className="inline-flex mt-2 px-3 py-1.5 bg-white text-slate-900 rounded-lg font-extrabold">{next.variant}</div></div></div><div className="mt-4 bg-white text-slate-900 rounded-xl p-4"><div className="flex items-center justify-between gap-3"><div><b>{next.product}</b><div className="text-[11px] text-slate-500 mt-1">SKU {next.sku} · {scanned}/{next.quantity} units scanned</div></div>{complete?<button onClick={()=>onSeal(next)} className="bg-emerald-600 text-white rounded-xl px-6 py-3 text-sm font-extrabold"><Boxes className="inline w-5 h-5 mr-2"/>Seal box</button>:<span className="text-[10px] font-bold text-slate-500">Scan every unit</span>}</div>{!complete&&<div className="mt-4"><div className="flex gap-2"><input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit(code)} placeholder="Scan / enter barcode" className="ops-field flex-1 font-mono"/><button onClick={()=>submit(code)} className="ops-primary"><ScanLine className="w-4 h-4 mr-1"/>Scan</button><button onClick={()=>setCameraOpen(true)} className="ops-secondary"><Camera className="w-4 h-4 mr-1"/>Camera</button></div><button onClick={()=>submit(next.barcode)} className="text-[10px] text-slate-500 hover:text-slate-900 mt-2 cursor-pointer">Use demo barcode</button></div>}<div className="mt-4"><div className="flex justify-between text-[10px] text-slate-400"><span>Scan progress</span><span>{scanned}/{next.quantity}</span></div><div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-emerald-500" style={{width:`${Math.min(100,scanned/Math.max(1,next.quantity)*100)}%`}}/></div></div></div></div><div className="ops-card p-4 worker-queue-card"><div className="flex items-center gap-2 text-sm font-bold"><Clock3 className="w-4 h-4 text-sky-600"/>Pick Queue ({queue.length})</div><div className="mt-3 space-y-1">{queue.slice(0,15).map(o=><button key={o.id} onClick={()=>{setActiveId(o.id);setCode('')}} className={`w-full text-left rounded-lg p-2.5 border ${o.id===next.id?'border-slate-900 bg-slate-50':'border-transparent hover:bg-slate-50'} cursor-pointer`}><div className="flex justify-between"><span className="font-mono text-[10px] font-bold">{o.id}</span>{o.priority==='priority'&&<span className="text-[9px] font-bold text-purple-700">EXPRESS</span>}</div><div className="text-[10px] text-slate-500 truncate mt-1">{o.product}</div></button>)}</div></div></div><CameraScanner open={cameraOpen} onClose={()=>setCameraOpen(false)} title="Scan Item Barcode" hint="The server verifies the barcode against the active order." onDetected={submit}/></div>;
}

export function ShiftReport({ stats, activity = [], currentUser, workers = [], canViewAll = false }) {
  const selectable = canViewAll ? workers.filter(w => w.role === 'Packer') : workers.filter(w => w.name === currentUser);
  const fallback = selectable.length ? selectable : [{ id: 'current', name: currentUser, role: 'Packer', shift: '—', presentToday: true }];
  const [selectedId, setSelectedId] = useState(fallback[0]?.id || 'current');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const selected = fallback.find(w => w.id === selectedId) || fallback[0];
  const workerName = selected?.name || currentUser;
  const selectedDay = new Date(`${reportDate}T00:00:00`);

  const mine = activity.filter(a => {
    if (!(a.actor === workerName || a.workerId === selected?.id)) return false;
    const d = new Date(a.timestamp);
    return d.getFullYear() === selectedDay.getFullYear() && d.getMonth() === selectedDay.getMonth() && d.getDate() === selectedDay.getDate();
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const report = selected ? {
    unitsPicked: mine.filter(a => a.type === 'pick').length,
    misScans: mine.filter(a => a.type === 'scan_error').length,
    boxesSealed: mine.filter(a => a.type === 'seal').length,
    ordersHandled: new Set(mine.map(a => a.orderId).filter(Boolean)).size,
  } : stats;
  const productiveEvents = mine.filter(a => ['pick', 'seal'].includes(a.type)).length;
  const firstEvent = mine.length ? new Date(mine[mine.length - 1].timestamp) : null;
  const lastEvent = mine.length ? new Date(mine[0].timestamp) : null;
  const activeMinutes = firstEvent && lastEvent ? Math.max(0, Math.round((lastEvent - firstEvent) / 60000)) : 0;
  const accuracy = report.unitsPicked + report.misScans ? Math.round((report.unitsPicked / (report.unitsPicked + report.misScans)) * 100) : 100;

  const download = () => {
    const rows = mine.map(a => ({ worker: workerName, role: selected?.role || 'Worker', shift: selected?.shift || '', date: reportDate, event: a.type, message: a.message, orderId: a.orderId || '', timestamp: a.timestamp }));
    const header = ['worker', 'role', 'shift', 'date', 'event', 'message', 'orderId', 'timestamp'];
    const esc = value => { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
    const csv = [header.join(','), ...rows.map(r => header.map(k => esc(r[k])).join(','))].join('\n');
    const blobUrl = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = blobUrl; a.download = `shift-report-${workerName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${reportDate}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(blobUrl);
  };

  return <div className="ops-page space-y-5">
    <PageHeader title="Shift Report" help="Select a worker and date to review saved activity, output, accuracy and shift timeline." right={<div className="flex flex-wrap items-center gap-2"><div className="shift-report-date"><CalendarDays className="w-3.5 h-3.5 text-slate-400" /><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} aria-label="Report date" /></div><button onClick={download} className="ops-secondary inline-flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />Export report</button></div>} />

    <div className="shift-report-layout">
      <aside className="ops-card p-4 shift-worker-picker">
        <div className="flex items-center justify-between gap-3 mb-3"><div><div className="text-sm font-extrabold">Choose employee</div><div className="text-[10px] text-slate-400 mt-0.5">{canViewAll ? 'Admin view · all packers' : 'Your assigned shift'}</div></div><Users className="w-4 h-4 text-blue-600" /></div>
        <div className="space-y-2">
          {fallback.map(w => <button key={w.id} type="button" onClick={() => setSelectedId(w.id)} className={`shift-worker-card ${selected?.id === w.id ? 'is-selected' : ''}`}>
            <div className="flex items-center gap-3 min-w-0"><div className="shift-worker-avatar"><UserRound className="w-4 h-4" /></div><div className="min-w-0 text-left"><div className="text-xs font-extrabold truncate">{w.name}</div><div className="text-[9px] text-slate-400 truncate">{w.role} · {w.shift || 'Shift not assigned'}</div></div></div>
            <span className={`shift-worker-presence ${w.presentToday ? 'present' : 'off'}`}>{w.presentToday ? 'Present' : 'Off'}</span>
          </button>)}
        </div>
      </aside>

      <section className="space-y-4 min-w-0">
        <div className="ops-card p-5 shift-profile">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0"><div className="shift-profile-avatar"><UserRound className="w-6 h-6" /></div><div className="min-w-0"><div className="text-xl font-extrabold truncate">{workerName}</div><div className="text-xs text-slate-500 mt-1">{selected?.role || 'Worker'} · {selected?.shift || 'Shift not assigned'} · {selected?.presentToday ? 'Present today' : 'Not present today'}</div><div className="flex flex-wrap items-center gap-2 mt-3"><Pill tone={selected?.presentToday ? 'green' : 'slate'}>{selected?.presentToday ? 'ON SHIFT' : 'OFF SHIFT'}</Pill><span className="shift-date-chip"><CalendarDays className="w-3 h-3" />{selectedDay.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}</span></div></div></div>
            <div className="grid grid-cols-2 gap-2 min-w-[220px]"><div className="ops-panel"><div className="metric-label">Saved events</div><div className="text-xl font-extrabold mt-1">{mine.length}</div></div><div className="ops-panel"><div className="metric-label">Active window</div><div className="text-xl font-extrabold mt-1">{activeMinutes}m</div></div></div>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            ['Units picked', report.unitsPicked, 'pick events', 'text-blue-600', Gauge],
            ['Mis-scans caught', report.misScans, 'blocked errors', 'text-red-600', AlertTriangle],
            ['Boxes sealed', report.boxesSealed, 'handoff ready', 'text-emerald-600', PackageCheck],
            ['Orders handled', report.ordersHandled, 'unique orders', 'text-purple-600', CheckCircle2],
          ].map(([label, value, sub, color, Icon]) => <div key={label} className="ops-card p-4"><div className="flex items-center justify-between gap-2"><span className="metric-label">{label}</span><Icon className={`w-4 h-4 ${color}`} /></div><div className={`metric-value ${color}`}>{value}</div><div className="text-[10px] text-slate-400 mt-1">{sub}</div></div>)}
        </div>

        <div className="grid lg:grid-cols-3 gap-3">
          <div className="ops-card p-4"><div className="metric-label">Scan accuracy</div><div className="text-2xl font-extrabold mt-2">{accuracy}%</div><div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${accuracy}%` }} /></div><div className="text-[10px] text-slate-400 mt-2">Successful units vs mis-scan attempts</div></div>
          <div className="ops-card p-4"><div className="metric-label">Productive events</div><div className="text-2xl font-extrabold mt-2">{productiveEvents}</div><div className="text-[10px] text-slate-400 mt-2">Picks + seals saved for this date</div></div>
          <div className="ops-card p-4"><div className="metric-label">Last activity</div><div className="text-sm font-extrabold mt-2">{lastEvent ? lastEvent.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '—'}</div><div className="text-[10px] text-slate-400 mt-2">Most recent saved event</div></div>
        </div>

        <div className="ops-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3"><div><div className="text-sm font-extrabold">Activity timeline</div><div className="text-[10px] text-slate-400 mt-0.5">Saved events for {workerName} on {selectedDay.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}.</div></div><span className="text-[10px] font-bold text-slate-500">{mine.length} events</span></div>
          <div className="divide-y divide-slate-100">
            {mine.slice(0, 100).map(a => { const isError = a.type === 'scan_error'; const isSeal = a.type === 'seal'; return <div key={a.id} className="shift-event-row"><div className={`shift-event-icon ${isError ? 'error' : isSeal ? 'success' : 'neutral'}`}>{isError ? <AlertTriangle className="w-3.5 h-3.5" /> : isSeal ? <PackageCheck className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}</div><div className="flex-1 min-w-0"><div className="text-xs font-semibold">{a.message || 'Activity recorded'}</div><div className="text-[10px] text-slate-400 mt-0.5">{a.orderId || 'Operations'} · {new Date(a.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</div></div><span className="text-[9px] font-mono text-slate-400 uppercase">{a.type}</span></div>; })}
            {!mine.length && <div className="p-12 text-center"><div className="w-11 h-11 rounded-xl bg-slate-100 mx-auto flex items-center justify-center"><Activity className="w-5 h-5 text-slate-400" /></div><div className="text-sm font-extrabold mt-3">No saved activity</div><div className="text-xs text-slate-400 mt-1">Choose another worker or date to view a saved shift timeline.</div></div>}
          </div>
        </div>
      </section>
    </div>
  </div>;
}

export function CsvSync({ orders, inventory, issues, onImport }) {
  const fileRef=React.useRef(null); const download=(name,rows)=>{const keys=rows.length?Object.keys(rows[0]):[];const csv=[keys.join(','),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`${name}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}; const read=async e=>{const f=e.target.files?.[0];if(!f)return;const text=await f.text();const [header,...rows]=text.split(/\r?\n/).filter(Boolean);const keys=header.split(',').map(x=>x.trim());const items=rows.map(line=>{const vals=line.split(',').map(x=>x.replace(/^"|"$/g,''));return Object.fromEntries(keys.map((k,i)=>[k,vals[i]]))});await onImport(items);e.target.value='';};
  return <div className="ops-page space-y-5"><PageHeader title="CSV / Spreadsheet Sync" help="Export operational datasets and bulk-import inventory without changing the existing spreadsheet workflow."/><div className="grid md:grid-cols-3 gap-3">{[['Orders',orders,'orders'],['Inventory',inventory,'inventory'],['Problem Log',issues,'problem-log']].map(([n,r,f])=><button key={n} onClick={()=>download(f,r)} className="ops-card p-5 text-left hover:border-slate-400 cursor-pointer"><FileSpreadsheet className="w-5 h-5 text-slate-400"/><div className="font-bold text-sm mt-3">{n}</div><div className="text-[10px] text-slate-400 mt-1">{r.length} rows · Export CSV</div></button>)}</div><div className="ops-card p-5"><div className="font-bold text-sm">Import inventory from CSV</div><p className="text-[11px] text-slate-500 mt-1">Expected columns: sku, quantity, location. Existing SKUs are updated; unknown SKUs are ignored.</p><div className="flex gap-2 mt-4"><button onClick={()=>fileRef.current?.click()} className="ops-primary"><Upload className="w-3.5 h-3.5 mr-1"/>Choose CSV</button><button onClick={()=>download('inventory-template',[{sku:'EL-WH-BLK-01',quantity:25,location:'Aisle 1 · Shelf A'}])} className="ops-secondary">Download template</button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={read}/></div><div className="text-[10px] text-slate-400 mt-4 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/>Inventory changes remain logged and undoable.</div></div></div>;
}

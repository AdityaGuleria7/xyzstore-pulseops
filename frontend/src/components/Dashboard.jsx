import React, { useMemo, useState } from 'react';
import { Package, Zap, Clock, Boxes, ArrowRightLeft, Truck, Inbox, Users, BadgeCheck, ShoppingBag, IndianRupee, ChevronDown, ChevronUp, TrendingUp, Globe2, ClipboardList, Timer } from 'lucide-react';
import PageHeader from './PageHeader';
import OrderGeoMap from './OrderGeoMap';
import { STAGE_META } from '../utils/ops';

const STAGES = STAGE_META.map(s => [s.key, s.label, s.dot, s.soft, s.hex]);

export const toStage = (o) => {
  if (o.status === 'pending') return 'received';
  if (o.status === 'processing') return o.courier ? 'picking' : 'processing';
  if (o.status === 'packed') return 'packing';
  if (o.status === 'staged') return 'staging';
  return 'shipped';
};

export const stageLabel = (o) => STAGES.find(([k]) => k === toStage(o))?.[1] || 'Shipped';
export const countdown = (deadline, now) => {
  const ms = new Date(deadline).getTime() - now.getTime();
  const a = Math.abs(ms);
  const t = `${Math.floor(a / 3600000)}h ${String(Math.floor((a % 3600000) / 60000)).padStart(2, '0')}m`;
  if (ms < 0) return { text: `${t} overdue`, cls: 'bg-red-50 text-red-700 border-red-200' };
  if (ms < 7200000) return { text: `${t} left`, cls: 'bg-amber-50 text-amber-800 border-amber-200' };
  return { text: `${t} left`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
};

export default function Dashboard({ orders = [], now, lowStock = 0, onNavigate, stagedCount = 0, inboundCount = 0, transferCount = 0, workers = [] }) {
  const [watchOpen, setWatchOpen] = useState(false);
  const open = useMemo(() => orders.filter(o => !['shipped', 'delivered', 'cancelled'].includes(o.status)), [orders]);
  const todayKey = new Date(now).toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayKey);
  const salesToday = todayOrders.reduce((s, o) => s + Number(o.value || 0), 0);
  const aov = todayOrders.length ? Math.round(salesToday / todayOrders.length) : 0;
  const critical = open.filter(o => new Date(o.deadline).getTime() < now.getTime() + 3600000);
  const watch = [...open].sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
  const late = open.filter(o => new Date(o.deadline).getTime() < now.getTime()).length;
  const onTimePct = open.length ? Math.round((open.length - late) / open.length * 100) : 100;
  const countries = new Set(orders.map(o => o.country).filter(Boolean)).size;
  const totalValue = orders.reduce((s,o) => s + Number(o.value || 0), 0);
  const pipelineCounts = useMemo(() => Object.fromEntries(STAGES.map(([stage]) => [stage, orders.filter(o => toStage(o) === stage).length])), [orders]);
  const present = workers.filter(w => w.presentToday);
  const kpis = [
    ['Orders today', todayOrders.length, 'Created in local day', ShoppingBag, 'text-blue-600'],
    ['Open orders', open.length, 'Not yet shipped', Package, 'text-slate-900'],
    ['Sales today', `₹${salesToday.toLocaleString()}`, `AOV ₹${aov.toLocaleString()}`, IndianRupee, 'text-emerald-600'],
    ['Priority / Express', open.filter(o => o.priority === 'priority').length, 'Fast-track lane', Zap, 'text-purple-600'],
    ['Critical risks', critical.length, '< 1h or overdue', Clock, 'text-red-600'],
    ['On-time open', `${onTimePct}%`, `${late} late`, Timer, 'text-emerald-600'],
    ['Low stock SKUs', lowStock, 'At / below reorder', Boxes, 'text-amber-600'],
    ['Staged boxes', stagedCount, 'Waiting courier', Truck, 'text-purple-600'],
    ['Inbound', inboundCount, 'Deliveries open', Inbox, 'text-blue-600'],
    ['Global markets', countries, `₹${totalValue.toLocaleString()} order value`, Globe2, 'text-indigo-600'],
  ];
  return (
    <div className="ops-page space-y-4">
      <PageHeader title="Operations Dashboard" help="Live workload, sales value, deadline risk, fulfillment flow, global order locations, stock, inbound deliveries, and today's team." right={<div className="dashboard-sync-card" aria-label={`Last sync ${new Date(now).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}`}><div className="dashboard-sync-status"><span className="dashboard-sync-dot"/><span className="dashboard-sync-label">Last sync</span></div><div className="dashboard-sync-time">{new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div><div className="dashboard-sync-date">{new Date(now).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>} />
      <div className="dashboard-kpi-grid grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map(([label, value, sub, Icon, color]) => <div key={label} className="ops-card dashboard-kpi-card p-4"><div className="flex justify-between gap-2"><span className="metric-label">{label}</span><Icon className={`w-4 h-4 ${color}`} /></div><div className={`metric-value text-[26px] mt-2 ${color}`}>{value}</div><div className="text-[10px] text-slate-400 mt-1 truncate">{sub}</div></div>)}
      </div>

      <section className="ops-card pipeline-card p-4">
        <div className="flex items-center justify-between gap-4 mb-3"><div><h2 className="text-sm font-extrabold">Fulfillment Pipeline</h2><p className="text-[10px] text-slate-400 mt-0.5">Select a stage to open the matching live order queue.</p></div><span className="text-[10px] text-slate-400">{orders.length} total</span></div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {STAGES.map(([stage, label, dot, soft, hex]) => <button key={stage} onClick={() => onNavigate?.('orders', { stage })} className={`pipeline-stage-card text-left border rounded-xl px-3 py-3 cursor-pointer group transition-all ${soft}`}><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] font-extrabold"><span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}</span><ChevronDown className="w-3.5 h-3.5 opacity-60 rotate-[-90deg] group-hover:translate-x-0.5" /></div><div className="text-2xl font-extrabold mt-1 text-slate-900">{pipelineCounts[stage]}</div><div className="text-[9px] text-slate-500">{Math.round(pipelineCounts[stage] / Math.max(1, orders.length) * 100)}% of orders</div></button>)}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-4">
        <OrderGeoMap orders={orders} />
        <section className="ops-card team-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="w-4 h-4" /></div><div><h2 className="text-sm font-extrabold">Team today</h2><p className="text-[10px] text-slate-400">Present workers and designated roles</p></div></div><span className="text-xs font-bold">{present.length}/{workers.length}</span></div>
          <div className="space-y-2">{workers.map(w => <div key={w.id} className="team-roster-card border border-slate-200 rounded-xl p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold">{w.name}</div><div className="text-[10px] text-slate-400 mt-0.5">{w.role} · {w.shift}</div></div><span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border ${w.presentToday ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}><BadgeCheck className="w-3 h-3" />{w.presentToday ? 'Present' : 'Off'}</span></div></div>)}{!workers.length && <div className="text-xs text-slate-400 py-6 text-center">Worker roster unavailable.</div>}</div>
          <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={() => onNavigate?.('command')} className="ops-secondary text-[11px]">Command Center</button><button onClick={() => onNavigate?.('shift')} className="ops-secondary text-[11px]">Shift reports</button></div>
        </section>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <section className="ops-card deadline-watch-card p-4">
          <div className="flex items-center justify-between mb-2"><div><h2 className="text-sm font-extrabold">Deadline Watchlist</h2><p className="text-[10px] text-slate-400">Compact by default; expand for the full queue.</p></div><button onClick={() => setWatchOpen(v => !v)} className="text-xs font-semibold text-blue-600 cursor-pointer inline-flex items-center gap-1">{watchOpen ? 'Collapse' : `View ${Math.min(8, watch.length)}`}{watchOpen ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}</button></div>
          <div className="space-y-1.5">{watch.slice(0, watchOpen ? 8 : 3).map(o => { const c = countdown(o.deadline, now); return <div key={o.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-3 py-1.5"><div className="min-w-0"><div className="font-mono text-xs font-bold truncate">{o.id} {o.priority === 'priority' && <Zap className="inline w-3 h-3 text-purple-600"/>}</div><div className="text-[9px] text-slate-500 truncate">{o.customer} · {stageLabel(o)} · {o.city}, {o.state}</div></div><span className={`text-[9px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${c.cls}`}>{c.text}</span></div> })}</div>
          {!watch.length && <div className="p-5 text-center text-xs text-slate-400">No open deadlines.</div>}
        </section>
        <section className="ops-card p-4"><div className="metric-label">Live operations</div><div className="mt-2 grid grid-cols-1 gap-1.5">{[[transferCount,'WH2 transfers needed','inventory',ArrowRightLeft,'text-amber-600'],[stagedCount,'Boxes staged','staging',Truck,'text-purple-600'],[inboundCount,'Inbound deliveries','receiving',Inbox,'text-blue-600']].map(([v,l,target,Icon,c]) => <button key={l} onClick={() => onNavigate?.(target)} className="w-full text-left border border-slate-200 rounded-xl p-2.5 flex items-center justify-between hover:border-blue-300 cursor-pointer"><div><div className="text-lg font-extrabold">{v}</div><div className="text-[10px] text-slate-500">{l}</div></div><Icon className={`w-4 h-4 ${c}`} /></button>)}</div></section>
      </div>
    </div>
  );
}

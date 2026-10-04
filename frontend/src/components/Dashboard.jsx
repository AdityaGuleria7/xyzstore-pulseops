import React, { useMemo, useState } from 'react';
import { Package, Zap, Clock, Boxes, ArrowRightLeft, Truck, Inbox, Users, BadgeCheck, ShoppingBag, IndianRupee, ChevronDown, ChevronUp, Timer } from 'lucide-react';
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

export default function Dashboard({ orders = [], now, lowStock = 0, onNavigate, stagedCount = 0, inboundCount = 0, transferCount = 0, workers = [], userName = '' }) {
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
  const pipelineCounts = useMemo(() => Object.fromEntries(STAGES.map(([stage]) => [stage, orders.filter(o => toStage(o) === stage).length])), [orders]);
  const present = workers.filter(w => w.presentToday);
  const firstName = typeof userName === 'string' ? userName.trim().split(/\s+/)[0] : '';
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const overviewTitle = firstName ? `${greeting}, ${firstName}` : 'Operations overview';
  const overviewDescription = late
    ? `${late} ${late === 1 ? 'order is' : 'orders are'} past the promised deadline. Start with the at-risk queue.`
    : "You're up to date. Here's today's workload and fulfillment flow.";
  const kpis = [
    ['Orders today', todayOrders.length, 'New orders received', ShoppingBag, 'blue'],
    ['Open orders', open.length, 'Still to fulfill', Package, 'slate'],
    ['Sales today', `₹${salesToday.toLocaleString()}`, `Average order ₹${aov.toLocaleString()}`, IndianRupee, 'green'],
    ['Open orders on time', `${onTimePct}%`, late ? `${late} past deadline` : 'No open orders past deadline', Timer, late ? 'amber' : 'green'],
  ];
  const focusItems = [
    [open.filter(o => o.priority === 'priority').length, 'Priority orders', 'orders', Zap, 'violet', { kind: 'priority' }],
    [critical.length, 'At-risk orders', 'orders', Clock, 'rose', { kind: 'at-risk' }],
    [lowStock, 'Stock alerts', 'inventory', Boxes, 'amber', {}],
  ];
  return (
    <div className="ops-page dashboard-overview space-y-4">
      <PageHeader
        title={overviewTitle}
        description={overviewDescription}
        help="Monitor sales and order volume, move work through each fulfillment stage, and catch deadline or stock issues before they become delays."
        right={<div className="dashboard-sync-card" aria-label={`Workspace clock ${new Date(now).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}`}><div className="dashboard-sync-status"><span className="dashboard-sync-dot"/><span className="dashboard-sync-label">Your workspace</span></div><div className="dashboard-sync-time">{new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div><div className="dashboard-sync-date">{new Date(now).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</div></div>}
      />
      <div className="dashboard-kpi-grid overview-metric-grid grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map(([label, value, sub, Icon, color]) => <article key={label} className={`ops-card dashboard-kpi-card overview-metric-card is-${color}`}><div className="overview-metric-heading"><span className="metric-label">{label}</span><span className="overview-metric-icon"><Icon className="w-4 h-4" /></span></div><div className="metric-value">{value}</div><div className="overview-metric-sub">{sub}</div></article>)}
      </div>

      <section className="ops-card pipeline-card p-4">
        <div className="flex items-center justify-between gap-4 mb-3"><div><h2 className="text-sm font-extrabold">Fulfillment pipeline</h2><p className="text-[10px] text-slate-400 mt-0.5">Choose a stage to see the orders your team can move next.</p></div><span className="text-[10px] text-slate-400">{orders.length} total orders</span></div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {STAGES.map(([stage, label, dot, soft, hex]) => <button key={stage} onClick={() => onNavigate?.('orders', { stage })} style={{ '--stage-accent': hex }} className={`pipeline-stage-card text-left border rounded-xl px-3 py-3 cursor-pointer group transition-all ${soft}`}><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] font-extrabold"><span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}</span><ChevronDown className="w-3.5 h-3.5 opacity-60 rotate-[-90deg] group-hover:translate-x-0.5" /></div><div className="text-2xl font-extrabold mt-1 text-slate-900">{pipelineCounts[stage]}</div><div className="text-[9px] text-slate-500">{Math.round(pipelineCounts[stage] / Math.max(1, orders.length) * 100)}% of orders</div></button>)}
        </div>
      </section>

      <section className="overview-focus-row" aria-label="Items to review">
        <div className="overview-focus-title"><span className="overview-focus-eyebrow">What needs a hand?</span><span className="overview-focus-caption">Jump straight to the work that could use your attention.</span></div>
        <div className="overview-focus-items">{focusItems.map(([value, label, target, Icon, color, meta]) => <button type="button" key={label} onClick={() => onNavigate?.(target, meta)} className={`overview-focus-item is-${color}`}><span className="overview-focus-icon"><Icon className="w-4 h-4" /></span><span className="overview-focus-value">{value}</span><span className="overview-focus-label">{label}</span><ChevronDown className="overview-focus-arrow w-3.5 h-3.5" /></button>)}</div>
      </section>

      <OrderGeoMap orders={orders} />
      <div className="dashboard-support-grid">
        <section className="ops-card team-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="w-4 h-4" /></div><div><h2 className="text-sm font-extrabold">Team today</h2><p className="text-[10px] text-slate-400">Present workers and designated roles</p></div></div><span className="text-xs font-bold">{present.length}/{workers.length}</span></div>
          <div className="space-y-2">{workers.map(w => <div key={w.id} className="team-roster-card border border-slate-200 rounded-xl p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold">{w.name}</div><div className="text-[10px] text-slate-400 mt-0.5">{w.role} · {w.shift}</div></div><span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border ${w.presentToday ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}><BadgeCheck className="w-3 h-3" />{w.presentToday ? 'Present' : 'Off'}</span></div></div>)}{!workers.length && <div className="text-xs text-slate-400 py-6 text-center">Worker roster unavailable.</div>}</div>
          <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={() => onNavigate?.('command')} className="ops-secondary text-[11px]">Command Center</button><button onClick={() => onNavigate?.('shift')} className="ops-secondary text-[11px]">Shift reports</button></div>
        </section>

        <section className="ops-card deadline-watch-card p-4">
          <div className="flex items-center justify-between mb-2"><div><h2 className="text-sm font-extrabold">Deadline watch</h2><p className="text-[10px] text-slate-400">A short list of orders to keep moving on time.</p></div><button onClick={() => setWatchOpen(v => !v)} className="text-xs font-semibold text-blue-600 cursor-pointer inline-flex items-center gap-1">{watchOpen ? 'Show less' : `View ${Math.min(8, watch.length)}`}{watchOpen ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}</button></div>
          <div className="space-y-1.5">{watch.slice(0, watchOpen ? 8 : 3).map(o => { const c = countdown(o.deadline, now); return <div key={o.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-3 py-1.5"><div className="min-w-0"><div className="font-mono text-xs font-bold truncate">{o.id} {o.priority === 'priority' && <Zap className="inline w-3 h-3 text-purple-600"/>}</div><div className="text-[9px] text-slate-500 truncate">{o.customer} · {stageLabel(o)} · {o.city}, {o.state}</div></div><span className={`text-[9px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${c.cls}`}>{c.text}</span></div> })}</div>
          {!watch.length && <div className="p-5 text-center text-xs text-slate-400">No open deadlines.</div>}
        </section>
        <section className="ops-card p-4"><div className="metric-label">Live operations</div><div className="mt-2 grid grid-cols-1 gap-1.5">{[[transferCount,'WH2 transfers needed','inventory',ArrowRightLeft,'text-amber-600'],[stagedCount,'Boxes staged','staging',Truck,'text-purple-600'],[inboundCount,'Inbound deliveries','receiving',Inbox,'text-blue-600']].map(([v,l,target,Icon,c]) => <button key={l} onClick={() => onNavigate?.(target)} className="w-full text-left border border-slate-200 rounded-xl p-2.5 flex items-center justify-between hover:border-blue-300 cursor-pointer"><div><div className="text-lg font-extrabold">{v}</div><div className="text-[10px] text-slate-500">{l}</div></div><Icon className={`w-4 h-4 ${c}`} /></button>)}</div></section>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Package, Zap, Clock, Boxes, ArrowRightLeft, Truck, Inbox, Users, BadgeCheck, ShoppingBag, IndianRupee, ChevronDown, ChevronUp, Timer, Activity, ArrowUpRight } from 'lucide-react';
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

export default function Dashboard({ orders = [], now, lowStock = 0, onNavigate, stagedCount = 0, inboundCount = 0, transferCount = 0, workers = [], activity = [], userName = '' }) {
  const [watchOpen, setWatchOpen] = useState(false);
  const open = useMemo(() => orders.filter(o => !['shipped', 'delivered', 'cancelled'].includes(o.status)), [orders]);
  const todayKey = new Date(now).toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayKey);
  const salesToday = todayOrders.reduce((s, o) => s + Number(o.value || 0), 0);
  const allOrderSales = orders.reduce((sum, order) => sum + Number(order.value || 0), 0);
  const overallAov = orders.length ? Math.round(allOrderSales / orders.length) : 0;
  const critical = open.filter(o => new Date(o.deadline).getTime() < now.getTime() + 3600000);
  const watch = [...open].sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
  const late = open.filter(o => new Date(o.deadline).getTime() < now.getTime()).length;
  const onTimePct = open.length ? Math.round((open.length - late) / open.length * 100) : 100;
  const pipelineCounts = useMemo(() => Object.fromEntries(STAGES.map(([stage]) => [stage, orders.filter(o => toStage(o) === stage).length])), [orders]);
  const present = workers.filter(w => w.presentToday);
  const recentActivity = useMemo(() => [...activity]
    .filter(event => event.timestamp && Number.isFinite(new Date(event.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3), [activity]);
  const firstName = typeof userName === 'string' ? userName.trim().split(/\s+/)[0] : '';
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const overviewTitle = firstName ? `${greeting}, ${firstName}` : 'Operations overview';
  const overviewDescription = late
    ? `${late} ${late === 1 ? 'order is' : 'orders are'} past the promised deadline. Start with the at-risk queue.`
    : "You're up to date. Here's today's workload and fulfillment flow.";
  const kpis = [
    ['Total orders', orders.length, 'Across all fulfillment stages', Boxes, 'slate'],
    ['Orders today', todayOrders.length, 'New orders received', ShoppingBag, 'blue'],
    ['Open orders', open.length, 'Still to fulfill', Package, 'slate'],
    ['Sales today', `₹${salesToday.toLocaleString()}`, 'Revenue from today’s orders', IndianRupee, 'green'],
    ['Average order value', `₹${overallAov.toLocaleString()}`, `Across ${orders.length.toLocaleString()} ${orders.length === 1 ? 'order' : 'orders'}`, IndianRupee, 'violet'],
    ['Open orders on time', `${onTimePct}%`, late ? `${late} past deadline` : 'No open orders past deadline', Timer, late ? (late >= 10 || late / Math.max(1, open.length) >= 0.5 ? 'rose' : 'amber') : 'green'],
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
        right={<div className="dashboard-sync-card" aria-label={`Workspace clock ${new Date(now).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}`}><div className="dashboard-sync-status"><span className="dashboard-sync-dot"/><span className="dashboard-sync-label">Your workspace</span></div><div className="dashboard-sync-time">{new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div><div className="dashboard-sync-date">{new Date(now).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</div></div>}
      />
      <div className="dashboard-kpi-grid overview-metric-grid grid grid-cols-2 gap-3">
        {kpis.map(([label, value, sub, Icon, color]) => <article key={label} className={`ops-card dashboard-kpi-card overview-metric-card is-${color}`}><div className="overview-metric-heading"><span className="metric-label">{label}</span><span className="overview-metric-icon"><Icon className="w-4 h-4" /></span></div><div className="metric-value">{value}</div><div className="overview-metric-sub">{sub}</div></article>)}
      </div>

      <section className="ops-card pipeline-card p-4">
        <div className="flex items-center justify-between gap-4 mb-3"><div><h2 className="text-sm font-extrabold">Fulfillment pipeline</h2><p className="text-[10px] text-slate-400 mt-0.5">Choose a stage to see the orders your team can move next.</p></div><span className="text-[10px] text-slate-400">{orders.length} total orders</span></div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {STAGES.map(([stage, label, dot, soft, hex]) => <button key={stage} onClick={() => onNavigate?.('orders', { stage })} style={{ '--stage-accent': hex }} className={`pipeline-stage-card text-left border rounded-xl px-3 py-3 cursor-pointer group transition-all ${soft}`}><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] font-extrabold"><span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}</span><ChevronDown className="w-3.5 h-3.5 opacity-60 rotate-[-90deg] group-hover:translate-x-0.5" /></div><div className="text-2xl font-extrabold mt-1 text-slate-900">{pipelineCounts[stage]}</div><div className="text-[9px] text-slate-500">{Math.round(pipelineCounts[stage] / Math.max(1, orders.length) * 100)}% of orders</div></button>)}
        </div>
      </section>

      <div className="dashboard-top-operations-grid">
        <section className="ops-card team-card dashboard-support-card">
          <div className="dashboard-support-heading">
            <span className="dashboard-support-heading-icon is-team"><Users aria-hidden="true" /></span>
            <div className="dashboard-support-heading-copy"><h2>Team today</h2><p>Shift coverage and quick links</p></div>
            <span className="dashboard-team-count">{present.length}<i>/</i>{workers.length}</span>
          </div>
          {workers.length ? <>
            <div className="dashboard-team-list">{workers.slice(0, 5).map(worker => <div key={worker.id} className="dashboard-team-row">
              <span className={`dashboard-team-presence${worker.presentToday ? ' is-present' : ''}`} />
              <div className="dashboard-team-copy"><strong>{worker.name}</strong><span>{worker.role} · {worker.shift}</span></div>
              <span className={`dashboard-team-status${worker.presentToday ? ' is-present' : ''}`}>{worker.presentToday ? 'On shift' : 'Off'}</span>
            </div>)}</div>
            {workers.length > 5 && <span className="dashboard-team-more">+{workers.length - 5} more team members</span>}
          </> : <div className="dashboard-support-empty"><span><Users aria-hidden="true" /></span><strong>Team roster unavailable</strong><p>Team coverage will appear here when worker data is available.</p></div>}
          <div className="dashboard-support-links"><button onClick={() => onNavigate?.('command')}>Command Center <ArrowUpRight aria-hidden="true" /></button><button onClick={() => onNavigate?.('shift')}>Shift reports <ArrowUpRight aria-hidden="true" /></button></div>
        </section>

        <section className="ops-card dashboard-support-card dashboard-live-card">
          <div className="dashboard-support-heading">
            <span className="dashboard-support-heading-icon is-live"><Truck aria-hidden="true" /></span>
            <div className="dashboard-support-heading-copy"><h2>Live operations</h2><p>Work currently moving through the warehouse</p></div>
          </div>
          <div className="dashboard-live-grid">{[
            [transferCount, 'WH2 transfers', 'inventory', ArrowRightLeft, 'is-transfer'],
            [stagedCount, 'Boxes staged', 'staging', Truck, 'is-staged'],
            [inboundCount, 'Inbound deliveries', 'receiving', Inbox, 'is-inbound'],
          ].map(([value, label, target, Icon, tone]) => <button key={label} type="button" className={`dashboard-live-item ${tone}`} onClick={() => onNavigate?.(target)}>
            <span className="dashboard-live-icon"><Icon aria-hidden="true" /></span><strong>{value}</strong><span>{label}</span><ArrowUpRight className="dashboard-live-arrow" aria-hidden="true" />
          </button>)}</div>
        </section>
      </div>

      <section className="overview-focus-row" aria-label="Items to review">
        <div className="overview-focus-title"><span className="overview-focus-eyebrow">What needs a hand?</span><span className="overview-focus-caption">Jump straight to the work that could use your attention.</span></div>
        <div className="overview-focus-items">{focusItems.map(([value, label, target, Icon, color, meta]) => <button type="button" key={label} onClick={() => onNavigate?.(target, meta)} className={`overview-focus-item is-${color}`}><span className="overview-focus-icon"><Icon className="w-4 h-4" /></span><span className="overview-focus-value">{value}</span><span className="overview-focus-label">{label}</span><ChevronDown className="overview-focus-arrow w-3.5 h-3.5" /></button>)}</div>
      </section>

      <section className="dashboard-map-workspace" aria-label="Markets and operational priorities">
        <OrderGeoMap orders={orders} />
        <div className="dashboard-map-priorities">
          <section className="ops-card deadline-watch-card p-4">
            <div className="flex items-center justify-between mb-1.5"><div><h2 className="text-sm font-extrabold">Deadline watch</h2><p className="text-[10px] text-slate-400">Orders that need attention soonest.</p></div><button onClick={() => setWatchOpen(v => !v)} className="text-xs font-semibold text-blue-600 cursor-pointer inline-flex items-center gap-1">{watchOpen ? 'Show less' : `View ${Math.min(8, watch.length)}`}{watchOpen ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}</button></div>
            <div className="space-y-1">{watch.slice(0, watchOpen ? 8 : 3).map(o => { const c = countdown(o.deadline, now); return <div key={o.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-2.5 py-1"><div className="min-w-0"><div className="font-mono text-[11px] font-bold leading-4 truncate">{o.id} {o.priority === 'priority' && <Zap className="inline w-3 h-3 text-purple-600"/>}</div><div className="text-[9px] leading-3 text-slate-500 truncate">{o.customer} · {stageLabel(o)} · {o.city}, {o.state}</div></div><span className={`text-[9px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${c.cls}`}>{c.text}</span></div> })}</div>
            {!watch.length && <div className="p-5 text-center text-xs text-slate-400">No open deadlines.</div>}
          </section>
          <section className="ops-card dashboard-activity-card dashboard-support-card" aria-label="Recent team activity">
            <div className="dashboard-activity-heading">
              <div className="dashboard-activity-title">
                <span className="dashboard-activity-icon"><Activity aria-hidden="true" /></span>
                <div><h2>Recent activity</h2><p>Latest updates from your team.</p></div>
              </div>
              <button type="button" onClick={() => onNavigate?.('command')} aria-label="View all activity">View all <ArrowUpRight aria-hidden="true" /></button>
            </div>
            {recentActivity.length ? <div className="dashboard-activity-list">
              {recentActivity.map(event => <article className="dashboard-activity-item" key={event.id}>
                <span className={`dashboard-activity-dot${event.type === 'scan_error' ? ' is-error' : event.type === 'seal' ? ' is-success' : ''}`} />
                <div className="dashboard-activity-copy">
                  <p>{event.message || 'Activity recorded'}</p>
                  <span>{event.actor || 'Team member'}{event.orderId ? ` · ${event.orderId}` : ''}</span>
                </div>
                <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</time>
              </article>)}
            </div> : <div className="dashboard-support-empty is-activity"><span><Activity aria-hidden="true" /></span><strong>No recent updates</strong><p>Completed picks, handoffs and other team actions will show up here.</p></div>}
          </section>
        </div>
      </section>

    </div>
  );
}

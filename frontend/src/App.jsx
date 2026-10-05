/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import Shell from './components/Shell';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import CommandCenter from './components/CommandCenter';
import { StagingView, ProblemLog, StockLedger } from './components/Screens';
import { Receiving, LabelCenter, WorkerMode, ShiftReport, CsvSync } from './components/FulfillmentOps';
import CommandPalette from './components/CommandPalette';
import Toast from './components/Toast';
import Login, { DEMO_USERS } from './components/Login';
import { downloadCsv } from './utils/csv';
import * as api from './lib/api';

const EMPTY = { orders: [], inventory: [], boxes: [], issues: [], bays: [], receiving: [], activity: [], couriers: [] };

const makeLocalUser = (email, role) => role === 'Admin'
  ? { name: 'Aditya (Owner)', email, role, initials: 'AO' }
  : { name: 'Warehouse Packer', email, role, initials: 'WP' };

export default function App() {
  const [currentUser, setCurrentUser] = useState(makeLocalUser(DEMO_USERS[0].email, DEMO_USERS[0].role));
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('pulseops.token')));
  const [activeView, setActiveView] = useState('dashboard');
  const [orderStageFilter, setOrderStageFilter] = useState('all');
  const [orderKindFilter, setOrderKindFilter] = useState('all');
  const [now, setNow] = useState(new Date());
  const [toasts, setToasts] = useState([]);
  const [sessionNotice, setSessionNotice] = useState('');
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('pulseops.token')));
  const [serverStatus, setServerStatus] = useState('connecting');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsLoggedIn(false);
      setLoading(false);
      setState(EMPTY);
      setActiveView('dashboard');
      setSessionNotice('Your session expired. Sign in again to continue.');
      setToasts((previous) => [...previous, {
        id: `${Date.now()}-${Math.random()}`,
        message: 'Your session expired. Sign in again to continue.',
        type: 'error',
      }]);
    };
    window.addEventListener('pulseops:session-expired', handleSessionExpired);
    return () => window.removeEventListener('pulseops:session-expired', handleSessionExpired);
  }, []);

  const addToast = (message, type = 'info', action = undefined) => setToasts((p) => [...p, { id: `${Date.now()}-${Math.random()}`, message, type, action }]);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const refresh = async () => {
    const data = await api.bootstrap();
    setCurrentUser(data.user);
    setState(data.state);
    setServerStatus('online');
    return data;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.health();
        setServerStatus('online');
        if (localStorage.getItem('pulseops.token')) {
          const data = await api.bootstrap();
          if (!cancelled) {
            setCurrentUser(data.user);
            setState(data.state);
            setActiveView(data.user.role === 'Packer' ? 'worker' : 'dashboard');
          }
        }
      } catch (error) {
        setServerStatus(error?.response?.status === 401 ? 'online' : 'offline');
        if (localStorage.getItem('pulseops.token')) {
          localStorage.removeItem('pulseops.token');
          setIsLoggedIn(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const navigate = useCallback((view, meta = {}) => {
    if (view === 'orders') {
      setOrderStageFilter(meta.stage || 'all');
      setOrderKindFilter(meta.kind || 'all');
    }
    setActiveView(view);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const data = await api.login(email, password);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setSessionNotice('');
      setActiveView(data.user.role === 'Packer' ? 'worker' : 'dashboard');
      await refresh();
      addToast(`Signed in as ${data.user.role}`, 'success');
    } catch (error) {
      throw new Error(api.errorMessage(error, 'Invalid credentials or backend unavailable'));
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setIsLoggedIn(false);
    setState(EMPTY);
    setActiveView('dashboard');
  };

  const handleSwitchUser = async ({ role, email, password }) => {
    if (!DEMO_USERS.some((user) => user.role === role) || !email?.trim() || !password) {
      addToast('Enter the other account’s email and password to switch roles.', 'error');
      return false;
    }
    try {
      const currentToken = localStorage.getItem('pulseops.token');
      const data = await api.login(email.trim(), password);
      if (data.user.role !== role) {
        if (currentToken) localStorage.setItem('pulseops.token', currentToken);
        else localStorage.removeItem('pulseops.token');
        addToast(`Those credentials do not belong to the ${role} account.`, 'error');
        return false;
      }
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setActiveView(data.user.role === 'Packer' ? 'worker' : 'dashboard');
      await refresh();
      addToast(`Active role: ${data.user.role}`, 'info');
      return true;
    } catch (error) {
      addToast(api.errorMessage(error, 'Role switch failed'), 'error');
      return false;
    }
  };

  const undoMutation = async (undoId) => {
    try {
      const data = await api.undo(undoId);
      if (data?.state) {
        setState(data.state);
        setCurrentUser(data.user || currentUser);
      } else {
        await refresh();
      }
      addToast(`Undid: ${data?.undone || 'last action'}`, 'info');
    } catch (error) {
      addToast(api.errorMessage(error, 'Undo expired or is no longer available'), 'error');
    }
  };

  const runMutation = async (promise, successMessage) => {
    try {
      const data = await promise;
      if (data?.state) {
        setState(data.state);
        setCurrentUser(data.user || currentUser);
      } else {
        await refresh();
      }
      if (successMessage) {
        if (data?.undo?.id) {
          addToast(successMessage, 'success', { label: 'Undo', onClick: () => undoMutation(data.undo.id) });
        } else {
          addToast(successMessage, 'success');
        }
      }
      return data;
    } catch (error) {
      addToast(api.errorMessage(error), 'error');
      throw error;
    }
  };

  const transfer = (sku, qty) => runMutation(api.transfer(sku, qty), `Transferred ${qty} × ${sku} to Main`);
  const audit = (sku, counted) => runMutation(api.audit(sku, counted), `${sku} count saved`);
  const createLabel = (id, courier, cost) => runMutation(api.createLabel(id, courier, cost), `${courier} label created · ${id} moved to Picking`);
  const batchStage = (ids) => runMutation(api.batchStage(ids), `${ids.length} eligible orders moved to staging`);
  const batchLabel = (ids) => runMutation(api.batchPrint(ids), `${ids.length} labels queued for printing`);
  const handover = (courier, signedBy = 'Floor Supervisor') => runMutation(api.handover(courier, signedBy), `${courier} handover signed`);
  const receive = (id, qty, sku) => runMutation(api.receive(id, qty, sku), `${qty} units received${sku ? ` · ${sku}` : ''} and put away`);
  const stageScan = (boxId, bayId) => runMutation(api.stageScan(boxId, bayId), `${boxId} scanned into ${bayId}`);

  const updateTracking = (orderId, link) => runMutation(api.updateTracking(orderId, link), `Tracking link saved · ${orderId}`);
  const updateStoreSettings = (storeName, tagline) => runMutation(api.updateSettings(storeName, tagline), `Store branding updated · ${storeName}`);
  const printLabels = async (ids) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { addToast('Allow pop-ups to print labels', 'error'); return; }
    try {
      win.document.write('<!doctype html><html><head><title>PulseOps Labels</title></head><body><p style="font-family:Arial,sans-serif;padding:24px;color:#64748b">Preparing labels…</p></body></html>');
      win.document.close();
      const data = await runMutation(api.printLabels(ids), `${ids.length} label(s) prepared for printing`);
      const rows = (data.labels || []).map(l => `<article class="label"><div class="brand">${state.settings?.storeName || 'XYZStore'} · PulseOps</div><div class="order">${l.orderId}</div><div class="customer">${l.customer}</div><div>${l.address}</div><div class="item">${l.product} · ${l.variant} ×${l.quantity}</div><div class="meta">Courier: ${l.courier}${l.trackingId ? ` · ${l.trackingId}` : ''}</div></article>`).join('');
      win.document.open();
      win.document.write(`<!doctype html><html><head><title>PulseOps Labels</title><style>body{font-family:Arial,sans-serif;padding:24px}.label{border:1px solid #cbd5e1;border-radius:12px;padding:18px;margin:0 0 16px;page-break-inside:avoid}.brand{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#64748b}.order{font:700 22px monospace;margin:8px 0}.customer{font-weight:700}.item{margin-top:14px;font-weight:700}.meta{margin-top:10px;color:#475569;font-size:12px}@media print{body{padding:0}.label{break-inside:avoid}}</style></head><body>${rows}</body></html>`);
      win.document.close(); win.focus(); setTimeout(() => win.print(), 200);
    } catch (error) {
      try { win.close(); } catch {}
    }
  };

  const flagOrder = async (order, reason = 'Operational issue') => {
    try {
      await runMutation(api.createIssue({
        title: reason,
        description: `Operational issue flagged from ${order.id} (${order.product}, ${order.variant}).`,
        severity: order.priority === 'priority' ? 'high' : 'medium',
        category: reason.toLowerCase().includes('stock') ? 'stock' : reason.toLowerCase().includes('courier') ? 'courier' : 'packing',
        reportedBy: currentUser.name,
        orderId: order.id,
      }), `${order.id} added to Problem Log`);
    } catch {}
  };

  const workerScan = async (order, barcode) => {
    try {
      const result = await api.scan(order.id, barcode);
      if (result.state) setState(result.state);
      addToast(`${order.id}: ${result.order.scanned}/${result.order.quantity} scanned`, 'success', result?.undo?.id ? { label: 'Undo', onClick: () => undoMutation(result.undo.id) } : undefined);
    } catch (error) {
      const message = api.errorMessage(error);
      const detail = error?.response?.data?.detail;
      if (message === 'Wrong barcode') {
        addToast(`Wrong barcode rejected for ${order.id}`, 'error', detail?.undo?.id ? { label: 'Undo', onClick: () => undoMutation(detail.undo.id) } : undefined);
      } else addToast(message, 'error');
    }
  };

  const sealOrder = async (order) => {
    await runMutation(api.seal(order.id), `${order.id} sealed and sent to staging`);
  };

  const updateIssueStatus = async (id, status) => {
    await runMutation(api.updateIssue(id, status), `Issue ${id} marked ${status}`);
  };

  const addIssue = async (payload) => {
    await runMutation(api.createIssue(payload), `Incident logged${payload.orderId ? ` · ${payload.orderId}` : ''}`);
  };

  const importInventory = async (items) => {
    await runMutation(api.importInventory(items), 'Inventory CSV imported');
  };
  const verifyInventory = async (sku, counted, notes, photo) => {
    await runMutation(api.verifyInventory(sku, counted, notes, photo), `${sku} inventory verified`);
  };

  const sync = async () => {
    for (const dataset of ['orders', 'inventory', 'issues', 'boxes']) {
      try { await api.exportCsv(dataset); } catch (error) { addToast(api.errorMessage(error), 'error'); }
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset all PulseOps demo data?')) return;
    await runMutation(api.resetDemo(), 'Demo data reset');
  };

  const activeOrders = state.orders.filter((o) => !['shipped', 'delivered', 'cancelled'].includes(o.status));
  const urgent = activeOrders.filter((o) => new Date(o.deadline).getTime() < now.getTime() + 2 * 3600000).length;
  const low = state.inventory.filter((i) => i.quantity / Math.max(1, i.maxQuantity) < 0.3).length;
  const missed = state.boxes.filter((b) => b.status === 'missed').length;
  const transferLines = state.inventory.filter((i) => i.quantity <= i.reorderPoint && (i.wh2Quantity || 0) > 0).length;
  const shift = useMemo(() => {
    const mine = state.activity.filter((a) => a.actor === currentUser.name);
    return {
      unitsPicked: mine.filter((a) => a.type === 'pick').length,
      misScans: mine.filter((a) => a.type === 'scan_error').length,
      boxesSealed: mine.filter((a) => a.type === 'seal').length,
      ordersHandled: new Set(mine.map((a) => a.orderId).filter(Boolean)).size,
    };
  }, [state.activity, currentUser.name]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Connecting to PulseOps backend…</div>;
  if (!isLoggedIn) return <><Login onLogin={handleLogin} serverStatus={serverStatus} sessionNotice={sessionNotice} /><div className="fixed bottom-5 right-5 z-50 space-y-2">{toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={removeToast} />)}</div></>;

  return <Shell activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} onSwitchUser={handleSwitchUser} onLogout={handleLogout} urgent={urgent} missed={missed} serverStatus={serverStatus} storeSettings={state.settings || { storeName: 'XYZStore', tagline: 'Fulfillment Control Center' }} onSaveStoreSettings={updateStoreSettings}>
    <main>
      {activeView === 'dashboard' && currentUser.role === 'Admin' && <Dashboard orders={state.orders} now={now} lowStock={low} onNavigate={navigate} workers={state.workers || []} activity={state.activity || []} stagedCount={state.boxes.filter((b) => b.status === 'waiting_pickup').length} inboundCount={state.receiving.filter((r) => r.status !== 'received').length} transferCount={transferLines} userName={currentUser.name} />}
      {activeView === 'command' && currentUser.role === 'Admin' && <CommandCenter onNavigate={navigate} workers={state.workers || []} activity={state.activity || []} />}
      {activeView === 'orders' && currentUser.role === 'Admin' && <Orders orders={state.orders} now={now} flagged={state.issues.map((i) => i.orderId).filter(Boolean)} onLabel={createLabel} onStage={batchStage} onPrint={printLabels} onFlag={flagOrder} onSeal={() => {}} onWorker={() => navigate('worker')} initialStage={orderStageFilter} initialKind={orderKindFilter} />}
      {activeView === 'inventory' && currentUser.role === 'Admin' && <StockLedger inventory={state.inventory} activity={state.activity} onTransfer={transfer} onAudit={audit} onVerify={verifyInventory} />}
      {activeView === 'labels' && currentUser.role === 'Admin' && <LabelCenter orders={state.orders} onLabel={createLabel} />}
      {activeView === 'staging' && currentUser.role === 'Admin' && <StagingView boxes={state.boxes} bays={state.bays} orders={state.orders} now={now} onHandover={handover} onScanBox={stageScan} onTrackingUpdate={updateTracking} />}
      {activeView === 'receiving' && <Receiving receiving={state.receiving} inventory={state.inventory} onReceive={receive} />}
      {activeView === 'worker' && <WorkerMode orders={state.orders} inventory={state.inventory} onScan={workerScan} onSeal={sealOrder} stats={shift} />}
      {activeView === 'issues' && currentUser.role === 'Admin' && <ProblemLog issues={state.issues} user={currentUser.name} onExport={() => api.exportCsv('issues')} onStatus={updateIssueStatus} onAdd={addIssue} />}
      {activeView === 'shift' && <ShiftReport stats={shift} activity={state.activity} currentUser={currentUser.name} workers={state.workers || []} canViewAll={currentUser.role === 'Admin'} />}
      {activeView === 'csv' && currentUser.role === 'Admin' && <CsvSync orders={state.orders} inventory={state.inventory} issues={state.issues} onImport={importInventory} />}
    </main>
    <div className="fixed bottom-5 right-5 z-50 space-y-2">{toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={removeToast} />)}</div>
    <CommandPalette state={state} role={currentUser.role} onNavigate={navigate} />
  </Shell>;
}

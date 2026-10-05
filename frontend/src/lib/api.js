/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || (import.meta.env.DEV ? '' : window.location.origin);
const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    if (
      error.response?.status === 401 &&
      !requestUrl.includes('/api/auth/login') &&
      localStorage.getItem('pulseops.token')
    ) {
      localStorage.removeItem('pulseops.token');
      window.dispatchEvent(new Event('pulseops:session-expired'));
    }
    return Promise.reject(error);
  },
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulseops.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function health() {
  return (await api.get('/api/health')).data;
}

export async function login(email, password) {
  const data = (await api.post('/api/auth/login', { email, password })).data;
  localStorage.setItem('pulseops.token', data.token);
  return data;
}

export async function bootstrap() {
  return (await api.get('/api/bootstrap')).data;
}

export async function logout() {
  localStorage.removeItem('pulseops.token');
}

export async function createLabel(orderId, courier, cost) {
  return (await api.post(`/api/orders/${encodeURIComponent(orderId)}/label`, { courier, cost })).data;
}
export async function batchStage(orderIds) {
  return (await api.post('/api/orders/batch-stage', { orderIds })).data;
}
export async function batchPrint(orderIds) {
  return (await api.post('/api/orders/batch-print', { orderIds })).data;
}
export async function printLabels(orderIds) {
  return (await api.post('/api/print/labels', { orderIds })).data;
}
export async function updateTracking(orderId, trackingLink) {
  return (await api.post(`/api/orders/${encodeURIComponent(orderId)}/tracking`, { trackingLink })).data;
}
export async function scan(orderId, barcode) {
  return (await api.post(`/api/orders/${encodeURIComponent(orderId)}/scan`, { orderId, barcode })).data;
}
export async function seal(orderId) {
  return (await api.post(`/api/orders/${encodeURIComponent(orderId)}/seal`)).data;
}
export async function transfer(sku, quantity) {
  return (await api.post('/api/inventory/transfer', { sku, quantity })).data;
}
export async function audit(sku, counted) {
  return (await api.post('/api/inventory/audit', { sku, counted })).data;
}
export async function receive(id, quantity, sku = null) {
  return (await api.post('/api/receiving/receive', { id, quantity, ...(sku ? { sku } : {}) })).data;
}
export async function stageAssign(boxId, bayId) {
  return (await api.post('/api/staging/assign', { boxId, bayId })).data;
}
export async function stageScan(boxId, bayId) {
  return (await api.post('/api/staging/scan', { boxId, bayId })).data;
}
export async function handover(courier, signedBy) {
  return (await api.post('/api/staging/handover', { courier, signedBy })).data;
}
export async function createIssue(payload) {
  return (await api.post('/api/issues', payload)).data;
}
export async function updateIssue(id, status) {
  return (await api.patch(`/api/issues/${encodeURIComponent(id)}`, { status })).data;
}
export async function importInventory(items) {
  return (await api.post('/api/inventory/import', { items })).data;
}
export async function verifyInventory(sku, counted, notes = '', photo = null) {
  const form = new FormData();
  form.append('counted', String(counted));
  form.append('notes', notes);
  if (photo) form.append('photo', photo);
  return (await api.post(`/api/inventory/${encodeURIComponent(sku)}/verify`, form)).data;
}
export async function undo(undoId) {
  return (await api.post(`/api/undo/${encodeURIComponent(undoId)}`)).data;
}
export async function resetDemo() {
  return (await api.post('/api/reset')).data;
}
export async function shiftReport() {
  return (await api.get('/api/shift-report')).data;
}

export async function exportCsv(dataset) {
  const response = await api.get(`/api/export/${encodeURIComponent(dataset)}`, { responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const name = match?.[1] || `${dataset}.csv`;
  const blobUrl = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export function errorMessage(error, fallback = 'Something went wrong') {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'object' && detail) return detail.message || detail.error || fallback;
  return detail || error?.message || fallback;
}

export default api;

export async function getInsights({ team = 3, minutesPerOrder = 3, waveSize = 12 } = {}) {
  return (await api.get('/api/insights', { params: { team, minutes_per_order: minutesPerOrder, wave_size: waveSize } })).data;
}

export async function getWorkerLogs() {
  return (await api.get('/api/workers/logs')).data;
}
export async function getWorkerShiftReport(workerId) {
  return (await api.get(`/api/workers/${encodeURIComponent(workerId)}/shift-report`)).data;
}

export async function updateSettings(storeName, tagline = "Fulfillment Control Center") {
  return (await api.put("/api/settings", { storeName, tagline })).data;
}

export async function getBriefing({ team = 3, minutesPerOrder = 3 } = {}) {
  return (await api.get('/api/briefing', { params: { team, minutes_per_order: minutesPerOrder } })).data;
}

export async function getOverdueSuggestions({ team = 3, minutesPerOrder = 3 } = {}) {
  return (await api.get('/api/briefing/overdue-suggestions', { params: { team, minutes_per_order: minutesPerOrder } })).data;
}

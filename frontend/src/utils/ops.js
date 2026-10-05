/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
export const STAGE_META = [
  { key: 'received', label: 'Received', dot: 'bg-slate-400', tone: 'stage-received', soft: 'bg-slate-50 text-slate-700 border-slate-200', hex: '#94a3b8' },
  { key: 'processing', label: 'Processing', dot: 'bg-blue-500', tone: 'stage-processing', soft: 'bg-blue-50 text-blue-700 border-blue-200', hex: '#3b82f6' },
  { key: 'picking', label: 'Picking', dot: 'bg-indigo-500', tone: 'stage-picking', soft: 'bg-indigo-50 text-indigo-700 border-indigo-200', hex: '#6366f1' },
  { key: 'packing', label: 'Packing', dot: 'bg-amber-500', tone: 'stage-packing', soft: 'bg-amber-50 text-amber-800 border-amber-200', hex: '#f59e0b' },
  { key: 'staging', label: 'Staging', dot: 'bg-purple-500', tone: 'stage-staging', soft: 'bg-purple-50 text-purple-700 border-purple-200', hex: '#a855f7' },
  { key: 'shipped', label: 'Shipped', dot: 'bg-emerald-500', tone: 'stage-shipped', soft: 'bg-emerald-50 text-emerald-700 border-emerald-200', hex: '#10b981' },
];

export const STAGE_BY_KEY = Object.fromEntries(STAGE_META.map(stage => [stage.key, stage]));

export const ISSUE_CATEGORY_META = {
  stock: { label: 'Stock', icon: '▣', classes: 'bg-amber-50 text-amber-800 border-amber-200', stripe: '#f59e0b' },
  courier: { label: 'Courier', icon: '↗', classes: 'bg-blue-50 text-blue-700 border-blue-200', stripe: '#3b82f6' },
  packing: { label: 'Packing', icon: '□', classes: 'bg-purple-50 text-purple-700 border-purple-200', stripe: '#a855f7' },
  shipping: { label: 'Shipping', icon: '⌁', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200', stripe: '#6366f1' },
  system: { label: 'System', icon: '⌘', classes: 'bg-slate-100 text-slate-700 border-slate-200', stripe: '#64748b' },
};

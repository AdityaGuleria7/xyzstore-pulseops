/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const fmt = (ms) => {
    const a = Math.abs(ms), h = Math.floor(a / 3600000), m = Math.floor((a % 3600000) / 60000);
    return `${ms < 0 ? 'OVERDUE ' : ''}${h}h ${String(m).padStart(2, '0')}m${ms < 0 ? '' : ' left'}`;
};
const PriorityLane = ({ orders, now, onAdvance }) => {
    const list = orders
        .filter(o => o.priority === 'priority' && ['pending', 'processing', 'packed'].includes(o.status))
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    if (!list.length)
        return null;
    return (_jsxs("section", { className: "mx-6 lg:mx-8 mt-6 p-5 rounded-xl border-2 border-amber-300 bg-amber-50/60", children: [_jsxs("h2", { className: "text-sm font-bold text-slate-900", children: ["Priority lane \u00B7 ships today (", list.length, ")"] }), _jsx("div", { className: "mt-3 grid gap-2 md:grid-cols-2", children: list.map(o => {
                    const ms = new Date(o.deadline).getTime() - now.getTime();
                    const tone = ms < 0 ? 'bg-red-600 text-white' : ms < 7200000 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white';
                    return (_jsxs("div", { className: "flex items-center justify-between gap-3 bg-white rounded-lg border border-slate-200 p-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "text-sm font-semibold truncate", children: [o.id, " \u00B7 ", o.product, " ", _jsxs("span", { className: "text-slate-500", children: ["(", o.variant, ")"] })] }), _jsxs("p", { className: "text-xs text-slate-500 capitalize", children: [o.status, " \u00B7 ", o.customer] })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx("span", { className: `text-xs font-bold px-2 py-1 rounded ${tone}`, children: fmt(ms) }), _jsx("button", { onClick: () => onAdvance(o.id), className: "text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white cursor-pointer", children: "Next stage" })] })] }, o.id));
                }) })] }));
};
export default PriorityLane;

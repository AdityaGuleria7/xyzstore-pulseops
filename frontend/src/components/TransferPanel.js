/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const TransferPanel = ({ inventory, orders, onTransfer }) => {
    const needs = inventory.map(i => {
        const demand = orders.filter(o => o.sku === i.sku && (o.status === 'pending' || o.status === 'processing'))
            .reduce((n, o) => n + o.quantity - (o.scanned ?? 0), 0);
        const short = Math.max(0, demand - i.quantity);
        return { i, demand, short, qty: Math.min(i.wh2Quantity ?? 0, Math.max(short, i.reorderPoint - i.quantity)) };
    }).filter(n => (n.short > 0 || n.i.quantity < n.i.reorderPoint) && (n.i.wh2Quantity ?? 0) > 0);
    if (!needs.length)
        return null;
    return (_jsxs("section", { className: "mx-6 lg:mx-8 mt-6 p-5 rounded-xl border border-slate-200 bg-white", children: [_jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Transfers needed from Warehouse 2" }), _jsx("p", { className: "text-xs text-slate-500", children: "Orders only ship from the main warehouse. Move stock before picking." }), _jsx("div", { className: "mt-3 space-y-2", children: needs.map(({ i, short, qty }) => (_jsxs("div", { className: "flex items-center justify-between gap-3 text-sm border border-slate-100 rounded-lg p-3", children: [_jsxs("span", { children: [_jsx("b", { children: i.name }), " (", i.variant, ") \u00B7 main ", i.quantity, " \u00B7 WH2 ", i.wh2Quantity, short > 0 && _jsxs("span", { className: "ml-2 text-xs font-bold text-red-600", children: ["short by ", short, " for open orders"] })] }), _jsxs("button", { onClick: () => onTransfer(i.sku, qty), className: "text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white cursor-pointer", children: ["Move ", qty, " to main"] })] }, i.sku))) })] }));
};
export default TransferPanel;

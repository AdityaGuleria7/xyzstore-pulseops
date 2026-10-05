/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
import { ScanLine, CheckCircle2, XCircle, ArrowRight, Barcode, History } from 'lucide-react';
const Scanner = ({ inventory, orders, onLogScan }) => {
    const [barcode, setBarcode] = useState('');
    const [lastScan, setLastScan] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const inputRef = useRef(null);
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    const executeScan = (rawBarcode) => {
        const trimmed = rawBarcode.trim();
        if (!trimmed)
            return;
        const item = inventory.find(i => i.barcode === trimmed);
        const order = item
            ? orders
                .filter(o => o.barcode === trimmed && (o.status === 'pending' || o.status === 'processing'))
                // Priority orders are always matched first, then earliest deadline
                .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'priority' ? -1 : 1) ||
                new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
            : undefined;
        let result;
        if (item) {
            if (order) {
                result = {
                    success: true,
                    message: `Verified: ${item.name} (${item.variant}) matches Order ${order.id} for ${order.customer}`,
                    item,
                    order,
                    timestamp: new Date().toISOString(),
                    barcode: trimmed
                };
            }
            else {
                result = {
                    success: false,
                    message: `Item in catalog (${item.name}), but no active open order needs this SKU.`,
                    item,
                    timestamp: new Date().toISOString(),
                    barcode: trimmed
                };
            }
        }
        else {
            result = {
                success: false,
                message: 'Barcode not found in warehouse master inventory catalog.',
                timestamp: new Date().toISOString(),
                barcode: trimmed
            };
        }
        setLastScan(result);
        setBarcode('');
    };
    const handleFormSubmit = (e) => {
        e.preventDefault();
        executeScan(barcode);
    };
    const handleConfirm = () => {
        if (lastScan) {
            onLogScan(lastScan);
            setScanHistory(prev => [lastScan, ...prev].slice(0, 10));
            setLastScan(null);
            inputRef.current?.focus();
        }
    };
    const nextPick = orders
        .filter(o => o.status === 'pending' || o.status === 'processing')
        .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'priority' ? -1 : 1) ||
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];
    const nextLoc = nextPick ? inventory.find(i => i.barcode === nextPick.barcode)?.location : undefined;
    const SAMPLE_BARCODES = [
        { label: 'Headphones (Black)', code: '8901234567890' },
        { label: 'Keyboard (Blue)', code: '8901234567891' },
        { label: 'Mouse (RGB)', code: '8901234567892' },
        { label: 'Unknown Barcode', code: '9999999999999' },
    ];
    return (_jsxs("div", { className: "p-6 lg:p-8 max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-slate-900", children: "Pack Station Verification Scanner" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Scan items to ensure the correct SKU and variant are packed into customer orders." })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500 font-mono", children: [_jsx(Barcode, { className: "w-4 h-4 text-slate-400" }), _jsx("span", { children: "Barcode Standard: EAN-13" })] })] }), nextPick && (_jsxs("div", { className: `p-5 rounded-xl border ${nextPick.priority === 'priority' ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`, children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: ["Next to pick ", nextPick.priority === 'priority' && '· PRIORITY'] }), _jsxs("p", { className: "text-2xl font-bold text-slate-900 mt-1", children: [nextPick.product, " ", _jsx("span", { className: "px-2 py-0.5 rounded bg-slate-900 text-white text-base align-middle", children: nextPick.variant.toUpperCase() })] }), _jsxs("p", { className: "text-sm text-slate-600 mt-1", children: [nextPick.id, " \u00B7 ", nextPick.customer, " \u00B7 Scanned ", nextPick.scanned ?? 0, " of ", nextPick.quantity, " \u00B7 Shelf: ", _jsx("b", { children: nextLoc ?? 'unknown' })] })] })), _jsxs("div", { className: "bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4", children: [_jsxs("form", { onSubmit: handleFormSubmit, className: "relative max-w-xl mx-auto", children: [_jsx(ScanLine, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" }), _jsx("input", { ref: inputRef, type: "text", value: barcode, onChange: (e) => setBarcode(e.target.value), placeholder: "Scan barcode with handheld or enter digits...", className: "w-full pl-12 pr-24 py-3 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400", autoFocus: true }), _jsx("button", { type: "submit", className: "absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer", children: "Verify" })] }), _jsx("div", { className: "pt-2 text-center", children: _jsxs("div", { className: "inline-flex flex-wrap items-center justify-center gap-2 text-xs", children: [_jsx("span", { className: "text-slate-400 font-medium mr-1", children: "Quick Test Barcodes:" }), SAMPLE_BARCODES.map((s) => (_jsx("button", { type: "button", onClick: () => {
                                        setBarcode(s.code);
                                        executeScan(s.code);
                                    }, className: "px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono text-[11px] transition-colors cursor-pointer", children: s.label }, s.code)))] }) })] }), lastScan && (_jsx("div", { className: `p-6 rounded-xl border shadow-xs animate-in zoom-in-95 duration-150 bg-white ${lastScan.success
                    ? 'border-emerald-300 border-l-4 border-l-emerald-500'
                    : 'border-red-300 border-l-4 border-l-red-500'}`, children: _jsxs("div", { className: "flex flex-col sm:flex-row items-start gap-4", children: [_jsx("div", { className: "p-2 rounded-lg flex-shrink-0", children: lastScan.success ? (_jsx(CheckCircle2, { className: "w-6 h-6 text-emerald-600" })) : (_jsx(XCircle, { className: "w-6 h-6 text-red-600" })) }), _jsxs("div", { className: "flex-1 space-y-3 w-full", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${lastScan.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`, children: lastScan.success ? 'Verified Match' : 'Mismatch Warning' }), _jsx("span", { className: "text-xs font-mono text-slate-400", children: lastScan.barcode })] }), _jsx("h3", { className: "text-base font-bold text-slate-900 mt-1", children: lastScan.success ? 'Product & Variant Authenticated' : 'Item Discrepancy Detected' }), _jsx("p", { className: "text-xs text-slate-600 mt-0.5", children: lastScan.message })] }), lastScan.item && (_jsxs("div", { className: "bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-xs", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "font-semibold text-slate-800", children: [lastScan.item.name, " (", lastScan.item.variant, ")"] }), _jsx("span", { className: "text-slate-500", children: lastScan.item.category })] }), _jsxs("p", { className: "text-slate-500 font-mono text-[11px]", children: ["SKU: ", lastScan.item.sku, " \u2022 Location: ", lastScan.item.location, " \u2022 Stock: ", lastScan.item.quantity, " units"] })] })), lastScan.order && (_jsxs("div", { className: "bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs", children: [_jsxs("span", { className: "font-semibold text-slate-800 block", children: ["Matched to Order ", lastScan.order.id] }), _jsxs("p", { className: "text-slate-500 mt-0.5", children: ["Customer: ", lastScan.order.customer, " \u2022 Destination: ", lastScan.order.shippingAddress] })] })), _jsxs("div", { className: "pt-2 flex justify-end gap-2", children: [_jsx("button", { onClick: () => { setLastScan(null); inputRef.current?.focus(); }, className: "px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer", children: "Dismiss" }), _jsxs("button", { onClick: handleConfirm, className: `px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${lastScan.success ? 'bg-slate-900 hover:bg-slate-800' : 'bg-red-600 hover:bg-red-700'}`, children: [_jsx("span", { children: lastScan.success ? 'Confirm & Box Item' : 'Acknowledge Error' }), _jsx(ArrowRight, { className: "w-3 h-3" })] })] })] })] }) })), scanHistory.length > 0 && (_jsxs("div", { className: "bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden", children: [_jsxs("div", { className: "px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(History, { className: "w-4 h-4 text-slate-400" }), _jsx("h3", { className: "text-xs font-bold text-slate-800 uppercase tracking-wider", children: "Verification History" })] }), _jsxs("span", { className: "text-xs text-slate-400", children: [scanHistory.length, " scans"] })] }), _jsx("div", { className: "divide-y divide-slate-100 text-xs", children: scanHistory.map((scan, i) => (_jsxs("div", { className: "px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [scan.success ? (_jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-600 flex-shrink-0" })) : (_jsx(XCircle, { className: "w-4 h-4 text-red-600 flex-shrink-0" })), _jsxs("div", { children: [_jsx("span", { className: "font-semibold text-slate-900", children: scan.item ? scan.item.name : `Barcode: ${scan.barcode}` }), _jsx("span", { className: "text-slate-400 font-mono text-[11px] ml-2", children: new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [scan.order && (_jsx("span", { className: "font-mono text-slate-600 text-xs", children: scan.order.id })), _jsx("span", { className: `text-[10px] font-semibold px-2 py-0.5 rounded ${scan.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`, children: scan.success ? 'Approved' : 'Rejected' })] })] }, i))) })] }))] }));
};
export default Scanner;

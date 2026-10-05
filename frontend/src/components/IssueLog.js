/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, CheckCircle2, Clock, ChevronUp, Filter, Copy, Check, Lightbulb } from 'lucide-react';
const ISSUE_TEMPLATES = [
    { title: 'Missing Stock', description: 'Stock required for an order cannot be found on the physical shelf.', severity: 'high', category: 'stock', orderId: '' },
    { title: 'Damaged Item', description: 'Item or packaging is damaged and cannot be packed as saleable stock.', severity: 'high', category: 'packing', orderId: '' },
    { title: 'Address Error', description: 'Customer address needs correction or validation before dispatch.', severity: 'medium', category: 'shipping', orderId: '' },
    { title: 'Courier Missed', description: 'Courier missed the scheduled pickup window.', severity: 'critical', category: 'courier', orderId: '' },
];
const IssueLog = ({ issues, onAddIssue, onUpdateStatus }) => {
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [copiedId, setCopiedId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        severity: 'medium',
        category: 'stock',
        orderId: ''
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        onAddIssue({
            ...formData,
            reportedBy: 'Active Operator'
        });
        setFormData({ title: '', description: '', severity: 'medium', category: 'stock', orderId: '' });
        setShowForm(false);
    };
    const applyTemplate = (tpl) => {
        setFormData({
            title: tpl.title,
            description: tpl.description,
            severity: tpl.severity,
            category: tpl.category,
            orderId: tpl.orderId
        });
        setShowForm(true);
    };
    const handleCopy = (id, text) => {
        navigator.clipboard?.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };
    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            if (filter !== 'all' && issue.status !== filter)
                return false;
            if (severityFilter !== 'all' && issue.severity !== severityFilter)
                return false;
            return true;
        });
    }, [issues, filter, severityFilter]);
    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'critical':
                return 'text-red-700 bg-red-50 border-red-200 font-semibold';
            case 'high':
                return 'text-amber-800 bg-amber-50 border-amber-200 font-semibold';
            case 'medium':
                return 'text-slate-700 bg-slate-100 border-slate-200 font-medium';
            case 'low':
                return 'text-slate-600 bg-slate-50 border-slate-200 font-medium';
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'open':
                return 'text-red-700 bg-red-50 border-red-200 font-semibold';
            case 'investigating':
                return 'text-amber-800 bg-amber-50 border-amber-200 font-semibold';
            case 'resolved':
                return 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold';
        }
    };
    return (_jsxs("div", { className: "p-6 lg:p-8 max-w-5xl mx-auto space-y-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-slate-900", children: "Incident Documentation & AI Resolver" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Log fulfillment blockers daily with automated AI remediation action plans." })] }), _jsxs("button", { onClick: () => setShowForm(!showForm), className: "flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95 self-start sm:self-center", children: [showForm ? _jsx(ChevronUp, { className: "w-3.5 h-3.5" }) : _jsx(Plus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: showForm ? 'Close Form' : 'Log New Incident' })] })] }), _jsxs("div", { className: "bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-wrap items-center gap-2 text-xs", children: [_jsxs("span", { className: "text-slate-500 font-medium flex items-center gap-1 text-[11px] mr-1", children: [_jsx(Lightbulb, { className: "w-3.5 h-3.5 text-amber-500" }), "Quick Templates:"] }), ISSUE_TEMPLATES.map((tpl, i) => (_jsxs("button", { type: "button", onClick: () => applyTemplate(tpl), className: "px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer", children: ["+ ", tpl.title.slice(0, 32), "..."] }, i)))] }), showForm && (_jsxs("div", { className: "bg-white rounded-xl border border-slate-200 shadow-md p-6 space-y-4 animate-in slide-in-from-top-2 duration-150", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-3", children: [_jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Log Operational Incident" }), _jsx("span", { className: "text-xs text-slate-400", children: "AI analysis generates upon submission" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-slate-700", children: "Incident Title *" }), _jsx("input", { required: true, type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-slate-900 text-slate-900", placeholder: "Brief summary of the issue..." })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-slate-700", children: "Details & Context *" }), _jsx("textarea", { required: true, rows: 3, value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-slate-900 text-slate-900 resize-none", placeholder: "Observed discrepancy, affected items, or courier window..." })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-slate-700", children: "Severity" }), _jsxs("select", { value: formData.severity, onChange: (e) => setFormData({ ...formData, severity: e.target.value }), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-slate-900", children: [_jsx("option", { value: "low", children: "Low - Minor" }), _jsx("option", { value: "medium", children: "Medium - Needs attention" }), _jsx("option", { value: "high", children: "High - SLA risk" }), _jsx("option", { value: "critical", children: "Critical - Halting ops" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-slate-700", children: "Category" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-slate-900", children: [_jsx("option", { value: "stock", children: "Stock Discrepancy" }), _jsx("option", { value: "courier", children: "Courier Missed Pickup" }), _jsx("option", { value: "packing", children: "Packing / Variant Error" }), _jsx("option", { value: "shipping", children: "Shipping Address Failure" }), _jsx("option", { value: "system", children: "Hardware / Scanner Issue" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-slate-700", children: "Order ID (Optional)" }), _jsx("input", { type: "text", value: formData.orderId, onChange: (e) => setFormData({ ...formData, orderId: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900", placeholder: "e.g. ORD-7002" })] })] }), _jsxs("div", { className: "pt-2 flex justify-end gap-2 border-t border-slate-100", children: [_jsx("button", { type: "button", onClick: () => setShowForm(false), className: "px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer", children: "Cancel" }), _jsx("button", { type: "submit", className: "bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs", children: "Submit Incident" })] })] })] })), _jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 pb-3", children: [_jsx("div", { className: "flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60", children: ['all', 'open', 'investigating', 'resolved'].map((f) => (_jsxs("button", { onClick: () => setFilter(f), className: `px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all duration-150 cursor-pointer ${filter === f
                                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900'}`, children: [f, " (", issues.filter(i => f === 'all' || i.status === f).length, ")"] }, f))) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "w-3.5 h-3.5 text-slate-400" }), _jsxs("select", { value: severityFilter, onChange: (e) => setSeverityFilter(e.target.value), className: "bg-transparent text-xs font-medium text-slate-600 focus:outline-none cursor-pointer", children: [_jsx("option", { value: "all", children: "All Severities" }), _jsx("option", { value: "critical", children: "Critical" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] })] })] }), _jsx("div", { className: "space-y-4", children: filteredIssues.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-white rounded-xl border border-slate-200", children: [_jsx(CheckCircle2, { className: "w-8 h-8 text-slate-300 mx-auto mb-2" }), _jsx("p", { className: "text-slate-500 text-xs font-medium", children: "No incidents in this view." })] })) : (filteredIssues.map(issue => (_jsxs("div", { className: "bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition-colors", children: [_jsxs("div", { className: "p-5 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `text-[10px] uppercase px-2 py-0.5 rounded border ${getSeverityBadge(issue.severity)}`, children: issue.severity }), _jsx("span", { className: "text-[10px] text-slate-500 uppercase font-medium bg-slate-100 px-2 py-0.5 rounded", children: issue.category }), issue.orderId && (_jsx("span", { className: "text-[10px] font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200", children: issue.orderId }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "flex items-center gap-1 text-[11px] text-slate-400 font-mono", children: [_jsx(Clock, { className: "w-3 h-3" }), new Date(issue.reportedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })] }), _jsx("span", { className: `text-[10px] uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(issue.status)}`, children: issue.status })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-slate-900", children: issue.title }), _jsx("p", { className: "text-xs text-slate-600 mt-1 leading-relaxed", children: issue.description })] }), issue.aiSuggestion && (_jsxs("div", { className: "bg-slate-50 rounded-lg p-3 text-xs border border-slate-200/80 space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-slate-900 font-semibold text-[11px]", children: [_jsx(Sparkles, { className: "w-3 h-3 text-amber-500" }), _jsx("span", { children: "AI Recommended Action" })] }), _jsxs("button", { onClick: () => handleCopy(issue.id, issue.aiSuggestion), className: "flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-900 cursor-pointer", title: "Copy solution text", children: [copiedId === issue.id ? _jsx(Check, { className: "w-3 h-3 text-emerald-600" }) : _jsx(Copy, { className: "w-3 h-3" }), _jsx("span", { children: copiedId === issue.id ? 'Copied' : 'Copy' })] })] }), _jsx("p", { className: "text-slate-700 leading-normal text-xs", children: issue.aiSuggestion })] }))] }), _jsxs("div", { className: "bg-slate-50/75 px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs", children: [_jsxs("span", { className: "text-slate-400 text-[11px]", children: ["Reported by ", issue.reportedBy] }), _jsxs("div", { className: "flex gap-2", children: [issue.status === 'open' && (_jsx("button", { onClick: () => onUpdateStatus(issue.id, 'investigating'), className: "px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium cursor-pointer transition-colors", children: "Investigate" })), issue.status !== 'resolved' && (_jsx("button", { onClick: () => onUpdateStatus(issue.id, 'resolved'), className: "px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors", children: "Mark Resolved" }))] })] })] }, issue.id)))) })] }));
};
export default IssueLog;

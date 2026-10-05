/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, RotateCcw } from 'lucide-react';
const Toast = ({ toast, onDismiss }) => {
    useEffect(() => {
        // If it has an action like Undo, keep it for 5s instead of 3s so the user has plenty of time to click it
        const duration = toast.action ? 5000 : 3500;
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, duration);
        return () => clearTimeout(timer);
    }, [toast.id, toast.action, onDismiss]);
    const config = {
        success: {
            icon: CheckCircle2,
            bg: 'bg-white',
            border: 'border-slate-200',
            text: 'text-slate-900',
            iconColor: 'text-emerald-600',
            badge: 'bg-emerald-50 text-emerald-700'
        },
        error: {
            icon: AlertCircle,
            bg: 'bg-white',
            border: 'border-red-200',
            text: 'text-slate-900',
            iconColor: 'text-red-600',
            badge: 'bg-red-50 text-red-700'
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-white',
            border: 'border-amber-200',
            text: 'text-slate-900',
            iconColor: 'text-amber-600',
            badge: 'bg-amber-50 text-amber-800'
        },
        info: {
            icon: Info,
            bg: 'bg-white',
            border: 'border-slate-200',
            text: 'text-slate-900',
            iconColor: 'text-slate-600',
            badge: 'bg-slate-100 text-slate-700'
        },
    };
    const { icon: Icon, bg, border, text, iconColor } = config[toast.type];
    return (_jsxs("div", { className: `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bg} ${border} ${text} max-w-md transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in`, children: [_jsx(Icon, { className: `w-4 h-4 flex-shrink-0 ${iconColor}` }), _jsx("p", { className: "text-xs font-medium flex-1 text-slate-800 leading-snug", children: toast.message }), toast.action && (_jsxs("button", { onClick: () => {
                    toast.action?.onClick();
                    onDismiss(toast.id);
                }, className: "flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 shadow-xs", children: [_jsx(RotateCcw, { className: "w-3 h-3 text-amber-400" }), _jsx("span", { children: toast.action.label })] })), _jsx("button", { onClick: () => onDismiss(toast.id), className: "p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer", title: "Dismiss notification", children: _jsx(X, { className: "w-3.5 h-3.5" }) })] }));
};
export default Toast;

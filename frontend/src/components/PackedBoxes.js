/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from 'react';
import { Archive, Clock, AlertTriangle, Truck, MapPin, CalendarClock, CheckCircle2, X, RotateCcw, PackageCheck } from 'lucide-react';
const COURIERS = ['FedEx', 'UPS', 'USPS', 'DHL Express'];
const DISPATCH_BAYS = [
    'Bay A (Main Dock)',
    'Bay B (Priority Outbound)',
    'Bay C (Heavy Freight)',
    'Dock 4 (Express Staging)',
];
const PackedBoxes = ({ boxes, onRescheduleBox, onMarkPickedUp }) => {
    const [time, setTime] = useState(() => new Date());
    const [activeTab, setActiveTab] = useState('all');
    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBox, setSelectedBox] = useState(null);
    const [selectedCourier, setSelectedCourier] = useState('FedEx');
    const [selectedBay, setSelectedBay] = useState(DISPATCH_BAYS[0]);
    const [pickupTimeOption, setPickupTimeOption] = useState('1h');
    const [customDateTime, setCustomDateTime] = useState('');
    const [driverNote, setDriverNote] = useState('');
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const missedBoxes = useMemo(() => boxes.filter(b => b.status === 'missed'), [boxes]);
    const waitingBoxes = useMemo(() => boxes.filter(b => b.status === 'waiting_pickup'), [boxes]);
    const pickedUpBoxes = useMemo(() => boxes.filter(b => b.status === 'picked_up'), [boxes]);
    const filteredBoxes = useMemo(() => {
        if (activeTab === 'all')
            return boxes;
        return boxes.filter(b => b.status === activeTab);
    }, [boxes, activeTab]);
    // Next upcoming pickup calculation
    const nextPickupTime = useMemo(() => {
        const times = waitingBoxes
            .map(b => new Date(b.scheduledPickup).getTime())
            .filter(t => t > time.getTime())
            .sort((a, b) => a - b);
        return times.length > 0 ? new Date(times[0]) : null;
    }, [waitingBoxes, time]);
    const openRescheduleModal = (box) => {
        const target = box || missedBoxes[0] || boxes[0];
        if (!target)
            return;
        setSelectedBox(target);
        setSelectedCourier(target.courier || 'FedEx');
        setSelectedBay(target.location || DISPATCH_BAYS[0]);
        setPickupTimeOption('1h');
        setDriverNote('');
        const defaultCustom = new Date(time.getTime() + 2 * 60 * 60 * 1000);
        const tzOffset = defaultCustom.getTimezoneOffset() * 60000;
        const localISOTime = new Date(defaultCustom.getTime() - tzOffset).toISOString().slice(0, 16);
        setCustomDateTime(localISOTime);
        setModalOpen(true);
    };
    const handleConfirmReschedule = (e) => {
        e.preventDefault();
        if (!selectedBox)
            return;
        let targetTime;
        if (pickupTimeOption === '1h') {
            targetTime = new Date(time.getTime() + 1 * 60 * 60 * 1000);
        }
        else if (pickupTimeOption === '3h') {
            targetTime = new Date(time.getTime() + 3 * 60 * 60 * 1000);
        }
        else if (pickupTimeOption === 'tomorrow') {
            targetTime = new Date(time.getTime() + 24 * 60 * 60 * 1000);
            targetTime.setHours(9, 30, 0, 0);
        }
        else {
            targetTime = customDateTime ? new Date(customDateTime) : new Date(time.getTime() + 2 * 60 * 60 * 1000);
        }
        if (Number.isNaN(targetTime.getTime()) || targetTime.getTime() <= time.getTime()) {
            return;
        }
        onRescheduleBox(selectedBox.id, targetTime.toISOString(), selectedCourier, selectedBay, driverNote);
        setModalOpen(false);
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'missed':
                return 'text-red-700 bg-red-50 border-red-200 font-semibold';
            case 'waiting_pickup':
                return 'text-slate-700 bg-slate-100 border-slate-200 font-medium';
            case 'picked_up':
                return 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold';
            default:
                return 'text-slate-600 bg-slate-100 border-slate-200';
        }
    };
    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    return (_jsxs("div", { className: "p-6 lg:p-8 max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-slate-900", children: "Courier Dispatch & Staging" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Track packed boxes in staging bays and coordinate driver handovers." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [nextPickupTime && (_jsxs("div", { className: "text-right hidden sm:block", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-medium text-slate-400 block", children: "Next Window" }), _jsx("span", { className: "text-xs font-mono font-semibold text-slate-800", children: formatTime(nextPickupTime.toISOString()) })] })), _jsxs("button", { onClick: () => openRescheduleModal(), className: "flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95", children: [_jsx(CalendarClock, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Schedule / Re-schedule" })] })] })] }), missedBoxes.length > 0 && (_jsxs("div", { className: "bg-white border-l-4 border-l-red-500 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsxs("p", { className: "text-xs font-bold text-red-900 uppercase tracking-wide", children: [missedBoxes.length, " ", missedBoxes.length === 1 ? 'Courier Pickup Missed' : 'Courier Pickups Missed'] }), _jsxs("p", { className: "text-xs text-slate-600 mt-0.5", children: ["The driver departed without scanning carton (", missedBoxes.map(b => b.id).join(', '), "). Click below to re-assign an immediate window."] })] })] }), _jsxs("button", { onClick: () => openRescheduleModal(missedBoxes[0]), className: "px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 self-start sm:self-center flex-shrink-0 active:scale-95", children: [_jsx(RotateCcw, { className: "w-3 h-3" }), _jsxs("span", { children: ["Re-schedule ", missedBoxes[0].id] })] })] })), _jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 pb-3", children: [_jsx("div", { className: "flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60", children: [
                            { id: 'all', label: `All Staged (${boxes.length})` },
                            { id: 'missed', label: `Missed (${missedBoxes.length})` },
                            { id: 'waiting_pickup', label: `Waiting Pickup (${waitingBoxes.length})` },
                            { id: 'picked_up', label: `Picked Up (${pickedUpBoxes.length})` },
                        ].map(tab => (_jsx("button", { onClick: () => setActiveTab(tab.id), className: `px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${activeTab === tab.id
                                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900'}`, children: tab.label }, tab.id))) }), _jsx("span", { className: "text-xs text-slate-400 hidden sm:inline", children: "Couriers: FedEx \u2022 UPS \u2022 USPS \u2022 DHL" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: filteredBoxes.map(box => {
                    const isMissed = box.status === 'missed';
                    const isWaiting = box.status === 'waiting_pickup';
                    const isPickedUp = box.status === 'picked_up';
                    return (_jsxs("div", { className: `bg-white rounded-xl p-5 border shadow-xs transition-all duration-150 flex flex-col justify-between ${isMissed ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'}`, children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-slate-900 font-mono", children: box.id }), _jsx("p", { className: "text-xs text-slate-400 font-mono mt-0.5", children: box.orderId })] }), _jsx("span", { className: `text-[10px] px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(box.status)}`, children: box.status.replace('_', ' ') })] }), _jsxs("div", { className: "space-y-2 text-xs text-slate-600 bg-slate-50/75 p-3 rounded-lg border border-slate-100 mb-4", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Archive, { className: "w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold text-slate-800 block", children: box.contents }), _jsxs("span", { className: "text-[11px] text-slate-400", children: ["Weight: ", box.weight, " \u2022 ", box.customer] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Truck, { className: "w-3.5 h-3.5 text-slate-400 flex-shrink-0" }), _jsx("span", { className: "font-medium text-slate-800", children: box.courier })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-3.5 h-3.5 text-slate-400 flex-shrink-0" }), _jsx("span", { className: isMissed ? 'text-red-700 font-semibold' : 'text-slate-700', children: formatTime(box.scheduledPickup) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "w-3.5 h-3.5 text-slate-400 flex-shrink-0" }), _jsx("span", { className: "text-slate-600", children: box.location })] }), box.trackingId && (_jsxs("div", { className: "pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[11px]", children: [_jsx("span", { className: "text-slate-400 font-medium", children: "Tracking:" }), _jsx("span", { className: "font-mono text-slate-800 font-semibold", children: box.trackingId })] }))] })] }), _jsxs("div", { className: "pt-2 border-t border-slate-100", children: [isMissed && (_jsxs("button", { onClick: () => openRescheduleModal(box), className: "w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95", children: [_jsx(RotateCcw, { className: "w-3 h-3 text-amber-400" }), _jsx("span", { children: "Re-schedule Pickup" })] })), isWaiting && (_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("button", { onClick: () => openRescheduleModal(box), className: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-1.5 px-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95", children: [_jsx(RotateCcw, { className: "w-3 h-3 text-slate-400" }), _jsx("span", { children: "Edit Window" })] }), _jsxs("button", { onClick: () => onMarkPickedUp(box.id), className: "bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs", children: [_jsx(PackageCheck, { className: "w-3 h-3 text-emerald-400" }), _jsx("span", { children: "Handover" })] })] })), isPickedUp && (_jsxs("div", { className: "w-full py-1 text-center text-xs font-medium text-emerald-700 bg-emerald-50/80 rounded-lg border border-emerald-200 flex items-center justify-center gap-1", children: [_jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-600" }), _jsx("span", { children: "Handed Over & Verified" })] }))] })] }, box.id));
                }) }), modalOpen && selectedBox && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150", children: _jsxs("div", { className: "bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150", children: [_jsxs("div", { className: "px-6 py-4 border-b border-slate-100 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-slate-900", children: "Re-schedule Courier Pickup" }), _jsxs("p", { className: "text-xs text-slate-400 font-mono mt-0.5", children: [selectedBox.id, " \u2022 Order ", selectedBox.orderId] })] }), _jsx("button", { onClick: () => setModalOpen(false), className: "w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleConfirmReschedule, className: "p-6 space-y-4", children: [_jsxs("div", { className: "bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs", children: [_jsx("span", { className: "text-[10px] uppercase font-semibold text-slate-400 block mb-0.5", children: "Carton Info" }), _jsx("p", { className: "font-semibold text-slate-800", children: selectedBox.contents }), _jsxs("p", { className: "text-slate-500 mt-0.5", children: ["Weight: ", selectedBox.weight, " \u2022 For ", selectedBox.customer] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-slate-700", children: "Select Courier Service" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: COURIERS.map(c => (_jsx("button", { type: "button", onClick: () => setSelectedCourier(c), className: `p-2 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${selectedCourier === c
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`, children: c }, c))) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-slate-700", children: "Pickup Window" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("button", { type: "button", onClick: () => setPickupTimeOption('1h'), className: `p-2.5 rounded-lg border text-left cursor-pointer transition-all ${pickupTimeOption === '1h'
                                                        ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'}`, children: [_jsx("span", { className: "block font-bold", children: "+1 Hour" }), _jsx("span", { className: "text-[11px] text-slate-400", children: "Immediate recovery" })] }), _jsxs("button", { type: "button", onClick: () => setPickupTimeOption('3h'), className: `p-2.5 rounded-lg border text-left cursor-pointer transition-all ${pickupTimeOption === '3h'
                                                        ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'}`, children: [_jsx("span", { className: "block font-bold", children: "+3 Hours" }), _jsx("span", { className: "text-[11px] text-slate-400", children: "Evening dispatch" })] }), _jsxs("button", { type: "button", onClick: () => setPickupTimeOption('tomorrow'), className: `p-2.5 rounded-lg border text-left cursor-pointer transition-all ${pickupTimeOption === 'tomorrow'
                                                        ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'}`, children: [_jsx("span", { className: "block font-bold", children: "Tomorrow 9:30 AM" }), _jsx("span", { className: "text-[11px] text-slate-400", children: "Morning batch" })] }), _jsxs("button", { type: "button", onClick: () => setPickupTimeOption('custom'), className: `p-2.5 rounded-lg border text-left cursor-pointer transition-all ${pickupTimeOption === 'custom'
                                                        ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'}`, children: [_jsx("span", { className: "block font-bold", children: "Custom Time" }), _jsx("span", { className: "text-[11px] text-slate-400", children: "Specify slot" })] })] }), pickupTimeOption === 'custom' && (_jsx("div", { className: "pt-1.5", children: _jsx("input", { type: "datetime-local", value: customDateTime, onChange: e => setCustomDateTime(e.target.value), className: "w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900" }) }))] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-slate-700", children: "Dispatch Staging Bay" }), _jsx("select", { value: selectedBay, onChange: e => setSelectedBay(e.target.value), className: "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-900", children: DISPATCH_BAYS.map(b => (_jsx("option", { value: b, children: b }, b))) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-semibold text-slate-700", children: "Driver Notes (Optional)" }), _jsx("input", { type: "text", value: driverNote, onChange: e => setDriverNote(e.target.value), placeholder: "e.g. Call dispatch on dock arrival", className: "w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900" })] }), _jsxs("div", { className: "pt-2 flex justify-end gap-2 border-t border-slate-100", children: [_jsx("button", { type: "button", onClick: () => setModalOpen(false), className: "px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs", children: "Confirm Re-schedule" })] })] })] }) }))] }));
};
export default PackedBoxes;

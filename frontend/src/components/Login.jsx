import React, { useState } from 'react';
import { Box, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, HardHat, Activity, ServerCrash } from 'lucide-react';

export const DEMO_USERS = [
  { name: 'Admin', role: 'Admin', initials: 'A', description: 'Dashboard, orders, stock, transfers, couriers, receiving, issues and reports' },
  { name: 'Packer', role: 'Packer', initials: 'P', description: 'Worker Mode, barcode verification, receiving and shift report' },
];

export default function Login({ onLogin, serverStatus = 'connecting' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try { await onLogin(email.trim(), password); }
    catch (err) { setError(err?.message || 'Unable to sign in'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-5">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_.95fr] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-[#090d15] text-white p-8 lg:p-12 flex flex-col justify-between min-h-[540px]">
          <div>
            <div className="text-[9px] tracking-[.28em] uppercase text-sky-300 font-bold">Operations control tower</div>
            <div className="flex items-center gap-3 mt-5">
              <div className="w-11 h-11 rounded-xl bg-white text-slate-900 flex items-center justify-center"><Box className="w-6 h-6" /></div>
              <div><div className="text-2xl font-extrabold tracking-tight">XYZStore<span className="text-sky-400">·PulseOps</span></div><div className="text-xs text-slate-400 mt-0.5">Fulfillment operations, in one live workspace.</div></div>
            </div>
            <p className="text-sm text-slate-300 leading-6 mt-8 max-w-md">Replace spreadsheets and shared folders with one place to see orders, catch delays early, pack the right items and never miss a courier pickup.</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {['Live order pipeline', 'Priority fast-track', 'Barcode verification', 'Courier pickup control'].map((x) => <div key={x} className="border border-white/10 bg-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /><span className="text-slate-300">{x}</span></div>)}
          </div>
        </div>
        <div className="p-7 lg:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6"><div className="text-xs text-slate-400 font-medium">Welcome back</div><h1 className="text-2xl font-extrabold mt-1">Sign in to PulseOps</h1><p className="text-xs text-slate-500 mt-1">Sign in with an account configured for this environment.</p></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="flex gap-2 items-center bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs"><AlertCircle className="w-4 h-4" />{error}</div>}
              {serverStatus === 'offline' && <div className="flex gap-2 items-center bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs"><ServerCrash className="w-4 h-4" />Backend is offline. Start FastAPI on port 8000.</div>}
              <div><label className="text-xs font-semibold">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1.5 w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-slate-900" /></div>
              <div><label className="text-xs font-semibold">Password</label><div className="relative mt-1.5"><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-slate-900" /><button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
              <button disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2">{loading ? 'Connecting…' : 'Enter Ops Hub'} {!loading && <ArrowRight className="w-4 h-4" />}</button>
            </form>
            <div className="mt-6 pt-5 border-t border-slate-100"><div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2.5">Available roles</div><div className="space-y-2">{DEMO_USERS.map((user) => <div key={user.role} className="w-full text-left border border-slate-200 rounded-xl p-3 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">{user.role === 'Admin' ? <ShieldCheck className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold">{user.name} · {user.role}</div><div className="text-[11px] text-slate-500 mt-0.5">{user.description}</div></div></div>)}</div><p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1"><Activity className="w-3 h-3" />{serverStatus === 'online' ? 'API connected' : 'Connecting to API'} · Use the credentials configured by the deployment owner.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Box, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, HardHat, Activity, ServerCrash } from 'lucide-react';

export const DEMO_USERS = [
  { name: 'Admin', role: 'Admin', initials: 'A', description: 'Store oversight · orders, inventory, dispatch and reports' },
  { name: 'Packer', role: 'Packer', initials: 'P', description: 'Floor operations · picking, packing, receiving and handoff' },
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
    <div className="login-screen min-h-screen flex items-center justify-center p-5">
      <div className="login-layout w-full max-w-5xl grid lg:grid-cols-[1.05fr_.95fr] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="login-story text-white p-8 lg:p-12 flex flex-col justify-between min-h-[540px]">
          <div>
            <div className="login-eyebrow text-[9px] tracking-[.28em] uppercase font-bold">A better way to run fulfillment</div>
            <div className="login-brand flex items-center gap-3 mt-5">
              <div className="login-brand-mark w-11 h-11 rounded-xl flex items-center justify-center"><Box className="w-6 h-6" /></div>
              <div><div className="text-2xl font-extrabold tracking-tight">PulseOps<span className="login-brand-period">.</span></div><div className="text-xs text-slate-400 mt-0.5">One workspace. Every handoff.</div></div>
            </div>
            <p className="login-promise text-sm leading-6 mt-8 max-w-md">Keep orders, inventory and dispatch in sync—so your team can spend less time chasing updates and more time getting every order out right.</p>
          </div>
          <div className="login-benefits grid grid-cols-2 gap-2.5 text-xs">
            {['Orders through dispatch', 'Pick & pack verification', 'Stock and receiving', 'Courier handover'].map((x) => <div key={x} className="login-benefit border rounded-xl px-3 py-2.5 flex items-center gap-2"><span className="login-benefit-dot w-1.5 h-1.5 rounded-full" /><span>{x}</span></div>)}
          </div>
        </div>
        <div className="login-form-panel p-7 lg:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6"><div className="text-xs text-slate-400 font-medium">Your operations, in one place</div><h1 className="text-2xl font-extrabold mt-1">Welcome back</h1><p className="text-xs text-slate-500 mt-1">Sign in to open your team's workspace.</p></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="flex gap-2 items-center bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs"><AlertCircle className="w-4 h-4" />{error}</div>}
              {serverStatus === 'offline' && <div className="flex gap-2 items-center bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs"><ServerCrash className="w-4 h-4" />Backend is offline. Start FastAPI on port 8000.</div>}
              <div><label htmlFor="login-email" className="text-xs font-semibold">Work email</label><input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required className="login-input mt-1.5 w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-slate-900" /></div>
              <div><label htmlFor="login-password" className="text-xs font-semibold">Password</label><div className="relative mt-1.5"><input id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} autoComplete="current-password" required className="login-input w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-slate-900" /><button type="button" aria-label={showPass ? 'Hide password' : 'Show password'} onClick={() => setShowPass((v) => !v)} className="login-password-toggle absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
              <button disabled={loading} className="login-submit w-full disabled:opacity-50 text-white rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2">{loading ? 'Connecting…' : 'Sign in'} {!loading && <ArrowRight className="w-4 h-4" />}</button>
            </form>
            <div className="login-access mt-6 pt-5 border-t border-slate-100"><div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2.5">Workspace access</div><div className="space-y-2">{DEMO_USERS.map((user) => <div key={user.role} className="login-access-card w-full text-left border border-slate-200 rounded-xl p-3 flex items-center gap-3"><div className="login-access-icon w-9 h-9 rounded-lg flex items-center justify-center">{user.role === 'Admin' ? <ShieldCheck className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold">{user.role} access</div><div className="text-[11px] text-slate-500 mt-0.5">{user.description}</div></div></div>)}</div><p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1"><Activity className="w-3 h-3" />{serverStatus === 'online' ? 'Workspace service connected' : 'Connecting to workspace service'}<span className="sr-only">. Use the credentials configured by the deployment owner.</span></p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

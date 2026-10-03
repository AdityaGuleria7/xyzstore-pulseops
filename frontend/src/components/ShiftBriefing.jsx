import React, { useEffect, useState } from 'react';
import { Sparkles, Volume2, Square } from 'lucide-react';
import * as api from '../lib/api';

/** Plain-English start-of-shift briefing built from live data, with optional read-aloud. */
export default function ShiftBriefing({ team, minutesPerOrder }) {
  const [data, setData] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    let alive = true;
    api.getBriefing({ team, minutesPerOrder }).then((d) => alive && setData(d)).catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [team, minutesPerOrder]);
  useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, [canSpeak]);

  if (!data) return null;
  const toggle = () => {
    if (!canSpeak) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(data.lines.join(' '));
    u.rate = 1; u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    setSpeaking(true); window.speechSynthesis.speak(u);
  };
  return (
    <section className="ops-card relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-5" aria-label="Shift briefing">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"><Sparkles className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Shift briefing</div>
          <p className="mt-1 text-base font-extrabold leading-snug text-slate-900">{data.lines[0]}</p>
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-700">
            {data.lines.slice(1).map((l, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />{l}</li>)}
          </ul>
        </div>
        {canSpeak && <button onClick={toggle} className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50" aria-label={speaking ? 'Stop reading' : 'Read briefing aloud'}>
          {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}{speaking ? 'Stop' : 'Read aloud'}</button>}
      </div>
    </section>
  );
}

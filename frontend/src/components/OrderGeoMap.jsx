import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, MapPin, TrendingUp, ShoppingBag, IndianRupee, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MARKET_MIN_ZOOM = 2;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const marketKey = o => `${o.city || 'Unknown'}|${o.state || 'Unknown'}|${o.country || 'Unknown'}`;

function iconForCount(count, active) {
  const size = Math.max(28, Math.min(52, 26 + Math.sqrt(count) * 7));
  return L.divIcon({
    className: 'pulseops-map-marker',
    html: `<div class="pulseops-map-marker-core ${active ? 'is-active' : ''}" style="width:${size}px;height:${size}px"><span>${count}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function OrderGeoMap({ orders = [] }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const markets = useMemo(() => {
    const by = new Map();
    for (const o of orders) {
      const lat = Number(o.latitude);
      const lon = Number(o.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const key = marketKey(o);
      const rec = by.get(key) || {
        key,
        city: o.city || 'Unknown',
        state: o.state || 'Unknown',
        country: o.country || 'Unknown',
        count: 0,
        sales: 0,
        lat,
        lon,
      };
      rec.count += 1;
      rec.sales += Number(o.value || 0);
      by.set(key, rec);
    }
    return [...by.values()].sort((a, b) => b.count - a.count || b.sales - a.sales);
  }, [orders]);

  const countries = useMemo(() => {
    const by = new Map();
    for (const market of markets) {
      const rec = by.get(market.country) || { country: market.country, count: 0, sales: 0, states: new Map() };
      rec.count += market.count;
      rec.sales += market.sales;
      rec.states.set(market.state, (rec.states.get(market.state) || 0) + market.count);
      by.set(market.country, rec);
    }
    return [...by.values()].sort((a, b) => b.count - a.count || b.sales - a.sales);
  }, [markets]);

  const totalSales = orders.reduce((sum, o) => sum + Number(o.value || 0), 0);
  const selected = markets.find(m => m.key === selectedMarket) || null;

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return undefined;
    const map = L.map(hostRef.current, { zoomControl: false, worldCopyJump: true, minZoom: 1, maxZoom: 12, zoomSnap: 0.5, preferCanvas: true }).setView([20, 0], MARKET_MIN_ZOOM);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Keep Leaflet's viewport in sync with the responsive card. This prevents
    // stretched/cropped tiles when the dashboard grid or browser width changes.
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false, debounceMoveend: true });
    });
    resizeObserver.observe(hostRef.current);
    requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      map.fitBounds([[-55, -170], [72, 175]], { padding: [12, 12], maxZoom: 2.1, animate: false });
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markets.forEach(m => {
      const marker = L.marker([clamp(m.lat, -85, 85), m.lon], {
        icon: iconForCount(m.count, m.key === selectedMarket),
        keyboard: true,
        title: `${m.city}, ${m.state}, ${m.country}: ${m.count} orders`,
      });
      marker.bindPopup(`
        <div class="pulseops-popup">
          <div class="pulseops-popup-title">${m.city}</div>
          <div class="pulseops-popup-sub">${m.state} · ${m.country}</div>
          <div class="pulseops-popup-grid">
            <div><span>Orders</span><b>${m.count}</b></div>
            <div><span>Sales</span><b>₹${Math.round(m.sales).toLocaleString()}</b></div>
          </div>
        </div>
      `);
      marker.on('click', () => {
        setSelectedMarket(m.key);
        setSelectedCountry(m.country);
      });
      marker.addTo(layer);
    });
  }, [markets, selectedMarket]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    map.flyTo([selected.lat, selected.lon], Math.max(4, map.getZoom()), { duration: 0.6 });
  }, [selected]);

  const focusWorld = () => mapRef.current?.fitBounds([[-55, -170], [72, 175]], { padding: [18, 18], duration: 0.6 });
  const focusCountry = countryName => {
    const list = markets.filter(m => m.country === countryName);
    if (!list.length || !mapRef.current) return;
    const bounds = L.latLngBounds(list.map(m => [m.lat, m.lon]));
    mapRef.current.fitBounds(bounds.pad(0.35), { maxZoom: 5, duration: 0.6 });
  };

  return (
    <section className="ops-card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Globe2 className="w-[18px] h-[18px]" /></div>
          <div>
            <h2 className="text-base font-extrabold">Global Orders & Sales</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live order concentration by country, state and city.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right"><div className="metric-label">Orders</div><div className="text-lg font-extrabold">{orders.length}</div></div>
          <div className="text-right"><div className="metric-label">Sales</div><div className="text-lg font-extrabold text-emerald-600">₹{Math.round(totalSales).toLocaleString()}</div></div>
          <button type="button" onClick={focusWorld} title="Reset map view" className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer inline-flex items-center justify-center"><Crosshair className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.55fr_.85fr] border-t border-slate-100">
        <div className="p-5">
          <div ref={hostRef} className="pulseops-map h-[390px] rounded-2xl overflow-hidden border border-slate-200" aria-label="Global order map" />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[10px] text-slate-400"><span><MapPin className="inline w-3 h-3 mr-1" />Markers are aggregated by city.</span><span>{markets.length} locations · {countries.length} countries</span></div>
          {selected && <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5"><div><div className="text-xs font-extrabold text-slate-900">{selected.city}, {selected.state}</div><div className="text-[10px] text-slate-500">{selected.country} · {selected.count} orders · ₹{Math.round(selected.sales).toLocaleString()}</div></div><button type="button" onClick={() => setSelectedMarket(null)} className="text-xs font-semibold text-blue-700 cursor-pointer">Clear</button></div>}
        </div>

        <div className="border-l border-slate-100 p-5 bg-slate-50/45">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /><div className="metric-label">Market distribution</div></div><div className="text-[9px] text-slate-400">{orders.length} orders</div></div>
          <div className="mt-3 space-y-2 max-h-[330px] overflow-y-auto pr-1">
            {countries.map(c => {
              const pct = Math.round(c.count / Math.max(1, orders.length) * 100);
              const open = selectedCountry === c.country;
              return <div key={c.country} className={`rounded-xl border bg-white ${open ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                <button type="button" onClick={() => { const next = open ? null : c.country; setSelectedCountry(next); if (next) focusCountry(next); }} className="w-full text-left p-3 cursor-pointer"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold">{c.country}</span><span className="text-xs font-mono font-bold">{c.count}</span></div><div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} /></div><div className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-2"><span><IndianRupee className="inline w-3 h-3" />{Math.round(c.sales).toLocaleString()}</span><span>· {c.states.size} states/regions</span></div></button>
                {open && <div className="px-3 pb-3 flex flex-wrap gap-1.5">{[...c.states.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8).map(([state, count]) => <span key={state} className="px-2 py-1 rounded-md bg-slate-100 text-[9px] font-semibold text-slate-600">{state} · {count}</span>)}</div>}
              </div>;
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3"><div className="ops-panel"><div className="metric-label">Top market</div><div className="text-sm font-extrabold mt-1">{countries[0]?.country || '—'}</div><div className="text-[9px] text-slate-400 mt-0.5">{countries[0]?.count || 0} orders</div></div><div className="ops-panel"><div className="metric-label">Sales / order</div><div className="text-sm font-extrabold mt-1">₹{orders.length ? Math.round(totalSales / orders.length).toLocaleString() : 0}</div><div className="text-[9px] text-slate-400 mt-0.5">Blended value</div></div></div>
        </div>
      </div>
    </section>
  );
}

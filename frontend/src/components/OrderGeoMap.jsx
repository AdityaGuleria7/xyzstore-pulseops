import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, MapPin, TrendingUp, IndianRupee, Crosshair } from 'lucide-react';
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
      if (mapRef.current === map) map.invalidateSize({ pan: false, debounceMoveend: true });
    });
    resizeObserver.observe(hostRef.current);
    const initialViewportFrame = requestAnimationFrame(() => {
      if (mapRef.current !== map) return;
      map.invalidateSize({ pan: false });
      map.fitBounds([[-55, -170], [72, 175]], { padding: [12, 12], maxZoom: 2.1, animate: false });
    });

    return () => {
      cancelAnimationFrame(initialViewportFrame);
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
    <section className="global-orders-panel">
      <header className="global-orders-header">
        <div className="global-orders-heading">
          <span className="global-orders-icon"><Globe2 aria-hidden="true" /></span>
          <div className="global-orders-title">
            <span className="global-orders-eyebrow">Geographic performance</span>
            <h2>Global Orders &amp; Sales</h2>
            <p>Explore order volume and sales by market.</p>
          </div>
        </div>
        <div className="global-orders-summary">
          <div className="global-orders-stat">
            <span>Orders</span><strong>{orders.length.toLocaleString()}</strong>
          </div>
          <div className="global-orders-stat is-sales">
            <span>Gross sales</span><strong>₹{Math.round(totalSales).toLocaleString()}</strong>
          </div>
          <button type="button" onClick={focusWorld} title="Reset map view" aria-label="Reset map view" className="global-orders-reset"><Crosshair aria-hidden="true" /></button>
        </div>
      </header>

      <div className="global-orders-layout">
        <div className="global-orders-map-column">
          <div className="global-orders-map-frame">
            <div ref={hostRef} className="pulseops-map" aria-label="Global order map" />
            {!markets.length && <div className="global-orders-map-empty">No location data is available for these orders.</div>}
            <div className="global-orders-map-label"><MapPin aria-hidden="true" /> Orders by city</div>
          </div>
          <div className="global-orders-map-footer">
            <span>Marker size and count show orders per city.</span>
            <span>{markets.length} locations <i /> {countries.length} countries</span>
          </div>
          {selected && <div className="global-orders-selected-market" role="status">
            <div><strong>{selected.city}, {selected.state}</strong><span>{selected.country} · {selected.count} orders · ₹{Math.round(selected.sales).toLocaleString()}</span></div>
            <button type="button" onClick={() => setSelectedMarket(null)}>Clear selection</button>
          </div>}
        </div>

        <aside className="global-orders-markets" aria-label="Market distribution">
          <div className="global-orders-markets-heading">
            <div><span className="global-orders-eyebrow">Market distribution</span><h3><TrendingUp aria-hidden="true" /> Markets</h3></div>
            <span className="global-orders-market-count">{countries.length}</span>
          </div>
          {countries.length ? <div className="global-orders-market-list">
            {countries.map((country, index) => {
              const share = Math.round(country.count / Math.max(1, orders.length) * 100);
              const expanded = selectedCountry === country.country;
              return <article className={`global-orders-market${expanded ? ' is-expanded' : ''}`} key={country.country} style={{ '--market-order': index }}>
                <button type="button" className="global-orders-market-button" aria-expanded={expanded} onClick={() => {
                  const next = expanded ? null : country.country;
                  setSelectedCountry(next);
                  if (next) focusCountry(next);
                }}>
                  <span className="global-orders-market-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="global-orders-market-main">
                    <span className="global-orders-market-name">{country.country}<b>{country.count.toLocaleString()}</b></span>
                    <span className="global-orders-market-track"><span style={{ width: `${share}%` }} /></span>
                    <span className="global-orders-market-sub"><span>{share}% of orders</span><span>₹{Math.round(country.sales).toLocaleString()}</span></span>
                  </span>
                </button>
                {expanded && <div className="global-orders-market-regions">
                  {[...country.states.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([region, count]) => <span key={region}>{region}<b>{count}</b></span>)}
                </div>}
              </article>;
            })}
          </div> : <div className="global-orders-market-empty">Market breakdown will appear when orders include location data.</div>}
          <div className="global-orders-average"><span>Average order value</span><strong>₹{orders.length ? Math.round(totalSales / orders.length).toLocaleString() : '0'}</strong></div>
        </aside>
      </div>
    </section>
  );
}

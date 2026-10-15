import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const pin = (color, label = '') =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:22px;height:22px;box-shadow:0 4px 10px -4px rgba(16,48,47,.6);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font:700 10px sans-serif;color:#fff">${label}</span></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22]
  });

const COLORS = { attraction: '#f29a2e', hotel: '#127c7a', center: '#e2603f' };

/**
 * markers: [{ lat, lng, title, kind: 'attraction' | 'hotel' | 'center', label }]
 */
export default function MapView({ center, markers = [], zoom = 12, height = 300 }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    if (!el.current || map.current || !center) return undefined;
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([center.lat, center.lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!layer.current) return;
    layer.current.clearLayers();
    const points = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    points.forEach((m) => {
      L.marker([m.lat, m.lng], { icon: pin(COLORS[m.kind] || COLORS.attraction, m.label || '') })
        .bindPopup(`<b>${m.title.replace(/</g, '&lt;')}</b>${m.subtitle ? `<br>${m.subtitle.replace(/</g, '&lt;')}` : ''}`)
        .addTo(layer.current);
    });
    if (points.length > 1) map.current.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [30, 30], maxZoom: 13 });
  }, [markers]);

  if (!center) return null;
  return <div ref={el} className="map-box" style={{ height }} aria-label="Map" />;
}

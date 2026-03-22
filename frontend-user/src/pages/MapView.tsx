import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiGet } from '../utils/api';

interface MapPoint {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string;
  address: string;
  status: string;
}

interface MapData {
  points: MapPoint[];
  region: string;
  last_updated: string;
}

const categoryColors: Record<string, string> = {
  hospital: '#f87171',
  shelter: '#60a5fa',
  water: '#38bdf8',
  aid: '#f5b73a',
  safe_zone: '#34d399',
};

const categoryLabels: Record<string, string> = {
  hospital: 'Hospital',
  shelter: 'Shelter',
  water: 'Water',
  aid: 'Aid Center',
  safe_zone: 'Safe Zone',
};

function createIcon(category: string): L.DivIcon {
  const color = categoryColors[category] || '#34d399';
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 16px; height: 16px;
      background: ${color};
      border: 2px solid #000;
      border-radius: 50%;
      box-shadow: 0 0 8px ${color};
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapView() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const mapRef = useRef<L.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGet<MapData>('/map/points').then(setMapData).catch(console.error);
  }, []);

  useEffect(() => {
    if (!mapData || !mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current, {
        center: [36.1627, -86.7816],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        errorTileUrl: '',
      }).addTo(mapRef.current);
    }

    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer);
      }
    });

    const filtered = filter === 'all'
      ? mapData.points
      : mapData.points.filter((p) => p.category === filter);

    filtered.forEach((point) => {
      const marker = L.marker([point.latitude, point.longitude], {
        icon: createIcon(point.category),
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div style="font-size: 13px;">
          <strong>${point.name}</strong><br/>
          <span style="color: ${categoryColors[point.category] || '#0f172a'};">
            ${categoryLabels[point.category] || point.category}
          </span><br/>
          ${point.description ? `<em>${point.description}</em><br/>` : ''}
          ${point.address ? `<small>${point.address}</small><br/>` : ''}
          <span>Status: ${point.status}</span>
        </div>
      `);
    });
  }, [mapData, filter]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <h1 className="page-title-mobile-only">
        Explore resources <span className="text-highlight">near you</span>
      </h1>
      <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginBottom: '16px', maxWidth: '48ch' }}>
        Shelters, hospitals, water, and safe zones — cached for offline use.
      </p>

      <div className="map-filter-bar">
        {['all', 'hospital', 'shelter', 'water', 'aid', 'safe_zone'].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`map-filter-btn${filter === cat ? ' active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All' : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      <div
        ref={mapContainer}
        style={{
          height: 'min(52vh, 520px)',
          width: '100%',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      />

      <div className="terminal-card" style={{ marginTop: '12px' }}>
        <h2>Legend</h2>
        <div className="map-legend-grid">
          {Object.entries(categoryColors).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: color, boxShadow: `0 0 6px ${color}`,
              }} />
              <span>{categoryLabels[cat] || cat}</span>
            </div>
          ))}
        </div>
        {mapData && (
          <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            Region: {mapData.region} &bull; {mapData.points.length} points loaded
          </div>
        )}
      </div>
    </div>
  );
}

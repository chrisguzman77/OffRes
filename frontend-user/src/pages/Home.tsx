export default function Home() {
  return (
    <div>
      <h1>
        Stay ready when the grid <span className="text-highlight">goes down</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '52ch', lineHeight: 1.6 }}>
        OFFRes runs entirely on this device — assistant, wallet, and map work without cell service or Wi‑Fi.
      </p>

      <div className="home-grid">
        <div className="feature-card feature-card--teal">
          <h2>Assistant</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
            Local AI for first aid, evacuation, water safety, and sheltering questions.
          </p>
        </div>
        <div className="feature-card feature-card--peach">
          <h2>Wallet</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
            Preload funds and pay offline with QR codes; sync settles when you&apos;re back online.
          </p>
        </div>
        <div className="feature-card feature-card--sky">
          <h2>Map</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
            Hospitals, shelters, water points, and safe zones on an offline-friendly map.
          </p>
        </div>
      </div>

      <div className="muted-footer">DisasterPi v1.0 · Raspberry Pi · Field-ready</div>
    </div>
  );
}

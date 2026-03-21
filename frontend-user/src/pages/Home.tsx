export default function Home() {
  return (
    <div>
      <h1>DisasterPi</h1>
      <div className="terminal-card">
        <p style={{ lineHeight: 1.8, fontSize: '0.9rem' }}>
          Emergency response device operating in <strong>offline mode</strong>.
        </p>
        <hr className="terminal-divider" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          This device provides three critical services during disasters when
          internet connectivity is unavailable:
        </p>
      </div>

      <div className="terminal-card">
        <h2>[ Assistant ]</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Ask disaster-related questions. First aid, evacuation, water safety,
          sheltering, and more. Powered by a local AI model.
        </p>
      </div>

      <div className="terminal-card">
        <h2>[ Wallet ]</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Make offline payments using preloaded funds. Generate QR codes for
          vendors to scan. Transactions settle when connectivity returns.
        </p>
      </div>

      <div className="terminal-card">
        <h2>[ Map ]</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          View nearby hospitals, emergency shelters, water distribution points,
          aid centers, and safe zones on an offline map.
        </p>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: '0.7rem',
        color: 'var(--text-dim)',
      }}>
        DisasterPi v1.0.0 &bull; Raspberry Pi 5 &bull; Fully Offline
      </div>
    </div>
  );
}

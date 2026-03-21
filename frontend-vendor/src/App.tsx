import { useState } from 'react';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import SyncPage from './pages/SyncPage';
import { getVendorName, setVendorName } from './utils/storage';

type Page = 'scan' | 'history' | 'sync';

export default function App() {
  const [page, setPage] = useState<Page>('scan');
  const [vendorNameState, setVendorNameState] = useState(getVendorName());
  const [editingName, setEditingName] = useState(false);

  const handleNameSave = (name: string) => {
    setVendorName(name);
    setVendorNameState(name);
    setEditingName(false);
  };

  return (
    <div>
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {editingName ? (
          <input
            type="text"
            defaultValue={vendorNameState}
            autoFocus
            onBlur={(e) => handleNameSave(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave((e.target as HTMLInputElement).value);
            }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--accent)',
              color: 'var(--text-primary)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.9rem',
            }}
          />
        ) : (
          <span
            onClick={() => setEditingName(true)}
            style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {vendorNameState} (tap to edit)
          </span>
        )}
        <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>
          DisasterPi Vendor
        </span>
      </div>

      <div className="container">
        <div className="nav">
          <button className={page === 'scan' ? 'active' : ''} onClick={() => setPage('scan')}>
            Scan
          </button>
          <button className={page === 'history' ? 'active' : ''} onClick={() => setPage('history')}>
            History
          </button>
          <button className={page === 'sync' ? 'active' : ''} onClick={() => setPage('sync')}>
            Sync
          </button>
        </div>
      </div>

      {page === 'scan' && <ScanPage />}
      {page === 'history' && <HistoryPage />}
      {page === 'sync' && <SyncPage />}
    </div>
  );
}

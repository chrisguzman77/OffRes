import { useState } from 'react';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import SyncPage from './pages/SyncPage';
import { getVendorName, setVendorName } from './utils/storage';

type Page = 'scan' | 'history' | 'sync';

function IconScan({ active }: { active: boolean }) {
  const c = active ? 'var(--brand)' : 'currentColor';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

function IconHistory({ active }: { active: boolean }) {
  const c = active ? 'var(--brand)' : 'currentColor';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 8v4l3 2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconSync({ active }: { active: boolean }) {
  const c = active ? 'var(--brand)' : 'currentColor';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 12a8 8 0 0 1 14-5" />
      <path d="M20 12a8 8 0 0 1-14 5" />
      <path d="M18 3v4h-4" />
      <path d="M6 21v-4h4" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" opacity="0.35" />
      <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="2" opacity="0.7" />
      <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
  );
}

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
    <div className="vendor-app">
      <header className="vendor-header">
        <div className="vendor-brand">
          <div className="vendor-logo">
            <LogoMark />
          </div>
          <div className="vendor-brand-text">
            <h1>OFFPay</h1>
            <div className="vendor-tagline">Secure offline transactions</div>
          </div>
        </div>
        <div className="vendor-offline-pill" role="status">
          Offline mode
        </div>
      </header>

      <div className="vendor-name-row">
        {editingName ? (
          <input
            type="text"
            defaultValue={vendorNameState}
            autoFocus
            placeholder="Business name"
            onBlur={(e) => handleNameSave(e.target.value.trim() || vendorNameState)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave((e.target as HTMLInputElement).value.trim() || vendorNameState);
            }}
          />
        ) : (
          <button
            type="button"
            className="tap-edit"
            onClick={() => setEditingName(true)}
            style={{
              width: '100%',
              textAlign: 'left',
              border: 'none',
              background: 'none',
              font: 'inherit',
              padding: 0,
            }}
          >
            <span className="tap-edit">
              Merchant: <strong>{vendorNameState || 'Tap to set name'}</strong>
            </span>
          </button>
        )}
      </div>

      <main className="vendor-main">
        {page === 'scan' && <ScanPage />}
        {page === 'history' && <HistoryPage />}
        {page === 'sync' && <SyncPage />}
      </main>

      <nav className="vendor-tabbar" aria-label="Main">
        <button
          type="button"
          className={`vendor-tab${page === 'scan' ? ' active' : ''}`}
          onClick={() => setPage('scan')}
        >
          <IconScan active={page === 'scan'} />
          Scan
        </button>
        <button
          type="button"
          className={`vendor-tab${page === 'history' ? ' active' : ''}`}
          onClick={() => setPage('history')}
        >
          <IconHistory active={page === 'history'} />
          History
        </button>
        <button
          type="button"
          className={`vendor-tab${page === 'sync' ? ' active' : ''}`}
          onClick={() => setPage('sync')}
        >
          <IconSync active={page === 'sync'} />
          Sync
        </button>
      </nav>
    </div>
  );
}

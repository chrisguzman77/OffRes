import type { FC } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const pages = [
  { id: 'home', label: 'Home' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'map', label: 'Map' },
] as const;

function IconHome({ active }: { active: boolean }) {
  const c = active ? 'var(--teal-400)' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" aria-hidden>
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChat({ active }: { active: boolean }) {
  const c = active ? 'var(--teal-400)' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" aria-hidden>
      <path d="M21 12a8 8 0 0 1-8 8H6l-4 3v-3a8 8 0 1 1 19-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWallet({ active }: { active: boolean }) {
  const c = active ? 'var(--teal-400)' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" aria-hidden>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20M16 14h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconMap({ active }: { active: boolean }) {
  const c = active ? 'var(--teal-400)' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" aria-hidden>
      <path d="M9 20l-5-2V4l5 2 6-2 5 2v14l-5-2-6 2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4v16M15 2v16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const icons: Record<string, FC<{ active: boolean }>> = {
  home: IconHome,
  assistant: IconChat,
  wallet: IconWallet,
  map: IconMap,
};

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  return (
    <>
      <aside className="nav-rail" aria-label="Main navigation">
        <div className="nav-rail-brand">OFFRes</div>
        <p className="nav-rail-tagline">Secure offline services when networks fail.</p>
        <nav className="nav-rail-items">
          {pages.map((p) => {
            const Icon = icons[p.id];
            const active = currentPage === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`nav-rail-item${active ? ' active' : ''}`}
                onClick={() => onNavigate(p.id)}
              >
                <Icon active={active} />
                {p.label}
              </button>
            );
          })}
        </nav>
        <div className="nav-rail-footer">
          <div className="status-pill--on-dark">
            <span className="status-dot offline" />
            Offline
          </div>
        </div>
      </aside>

      <nav className="nav-bottom" aria-label="Main navigation">
        {pages.map((p) => {
          const Icon = icons[p.id];
          const active = currentPage === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`nav-bottom-item${active ? ' active' : ''}`}
              onClick={() => onNavigate(p.id)}
            >
              <Icon active={active} />
              {p.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}

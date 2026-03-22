import { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const PAGE_TITLES: Record<string, string> = {
  home: 'Overview',
  assistant: 'Assistant',
  wallet: 'Wallet',
  map: 'Offline map',
};

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const title = PAGE_TITLES[currentPage] ?? 'OFFRes';

  return (
    <div className="user-app-shell">
      <Navbar currentPage={currentPage} onNavigate={onNavigate} />

      <div className="main-stack content-backdrop">
        <header className="user-top-bar">
          <span className="brand-wordmark">OFFRes</span>
          <span className="status-pill">
            <span className="status-dot offline" />
            Offline
          </span>
        </header>

        <header className="app-top-bar-wide">
          <h2>{title}</h2>
          <div className="app-search-mock" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            Search services on this device…
          </div>
          <span className="status-pill">
            <span className="status-dot offline" />
            Offline
          </span>
        </header>

        <main className="user-main">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  return (
    <div>
      {/* Header bar */}
      <div style={{
        padding: '8px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--terminal-green)',
          textShadow: 'var(--glow)',
        }}>
          OFFRes
        </span>
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
        }}>
          <span className="status-dot offline" />
          OFFLINE
        </span>
      </div>

      {/* Navigation */}
      <div className="container">
        <Navbar currentPage={currentPage} onNavigate={onNavigate} />
        {children}
      </div>
    </div>
  );
}

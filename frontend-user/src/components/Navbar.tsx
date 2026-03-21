interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const pages = [
  { id: 'home', label: 'Home' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'map', label: 'Map' },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  return (
    <div className="nav-bar">
      {pages.map((p) => (
        <button
          key={p.id}
          className={`nav-item ${currentPage === p.id ? 'active' : ''}`}
          onClick={() => onNavigate(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

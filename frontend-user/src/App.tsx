import { useState } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Assistant from './pages/Assistant';
import Wallet from './pages/Wallet';
import MapView from './pages/MapView';

export default function App() {
  const [page, setPage] = useState('home');

  const renderPage = () => {
    switch (page) {
      case 'home': return <Home />;
      case 'assistant': return <Assistant />;
      case 'wallet': return <Wallet />;
      case 'map': return <MapView />;
      default: return <Home />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}

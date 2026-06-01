import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Determine active view: render Products page for '#products', Home page otherwise
  const isProducts = currentHash.startsWith('#products');

  return (
    <div className="app-container">
      <Navbar currentHash={currentHash} />
      <div data-barba="wrapper">
        {isProducts ? <Products /> : <Home />}
      </div>
      <Footer />
    </div>
  );
}

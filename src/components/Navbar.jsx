import React, { useState, useEffect } from 'react';

export default function Navbar({ currentHash }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isProducts = currentHash.startsWith('#products');

  useEffect(() => {
    // Add show-nav-left class to body for styles.css transitions
    if (isProducts) {
      document.body.classList.add('show-nav-left');
      setIsScrolled(true);
    } else {
      const handleScroll = () => {
        // Show logo when scrolled down past hero section threshold
        if (window.scrollY > 200) {
          setIsScrolled(true);
          document.body.classList.add('show-nav-left');
        } else {
          setIsScrolled(false);
          document.body.classList.remove('show-nav-left');
        }
      };

      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.body.classList.remove('show-nav-left');
      };
    }
  }, [isProducts]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLinkClick = (e, targetHash) => {
    setMenuOpen(false);
    
    // If target starts with '#' and we are on products page, we should let hashchange route back to home
    if (targetHash.startsWith('#') && targetHash !== '#products' && isProducts) {
      // Allow hash change to route back to home, then scroll
      window.location.hash = targetHash;
    } else if (targetHash.startsWith('#') && targetHash !== '#products') {
      // On home page, smooth scroll to section
      e.preventDefault();
      const element = document.querySelector(targetHash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        // Update hash in URL without jumping
        window.history.pushState(null, null, targetHash);
      }
    }
  };

  return (
    <>
      <nav style={{ top: 0 }}>
        <div className={`nav-left ${!isScrolled && !isProducts ? 'hidden' : ''}`}>
          <a href="#home" className="nav-logo" onClick={(e) => handleLinkClick(e, '#home')}>
            <img src="/newlogo.png" alt="NeoCode logo" className="nav-logo-img" />
          </a>
        </div>
        <div className="nav-right">
          <ul className="nav-links">
            <li>
              <a 
                href="#home" 
                className={!isProducts && currentHash === '#home' ? 'active' : ''}
                onClick={(e) => handleLinkClick(e, '#home')}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="#services" 
                className={!isProducts && currentHash === '#services' ? 'active' : ''}
                onClick={(e) => handleLinkClick(e, '#services')}
              >
                Services
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className={!isProducts && currentHash === '#contact' ? 'active' : ''}
                onClick={(e) => handleLinkClick(e, '#contact')}
              >
                Contact Us
              </a>
            </li>
            <li>
              <a 
                href="#products" 
                className={isProducts ? 'active' : ''}
              >
                Products
              </a>
            </li>
          </ul>
          <button 
            className="hamburger" 
            onClick={toggleMenu} 
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} id="mobileMenu">
        <a href="#home" onClick={(e) => handleLinkClick(e, '#home')}>Home</a>
        <a href="#services" onClick={(e) => handleLinkClick(e, '#services')}>Services</a>
        <a href="#contact" onClick={(e) => handleLinkClick(e, '#contact')}>Contact Us</a>
        <a href="#products" onClick={() => setMenuOpen(false)}>Products</a>
      </div>
    </>
  );
}

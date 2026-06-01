import React, { useState, useEffect } from 'react';

export default function Navbar({ currentHash }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
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
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLinkClick = (e, targetHash) => {
    setMenuOpen(false);
    
    if (targetHash.startsWith('#')) {
      // Smooth scroll to section
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
      <nav>
        <div className="nav-left">
          <a href="#home" className="nav-logo" onClick={(e) => handleLinkClick(e, '#home')}>
            <img src="/favicon.png" alt="NeoCode logo emblem" className="nav-logo-emblem" />
            <img src="/newlogo.png" alt="NeoCode logo" className="nav-logo-img" />
          </a>
        </div>
        <div className="nav-right">
          <ul className="nav-links">
            <li>
              <a 
                href="#home" 
                className={currentHash === '#home' ? 'active' : ''}
                onClick={(e) => handleLinkClick(e, '#home')}
                aria-label="Home"
              >
                <span className="material-icons">home</span>
                <span className="nav-label">Home</span>
              </a>
            </li>
            <li>
              <a 
                href="#products" 
                className={currentHash === '#products' ? 'active' : ''}
                onClick={(e) => handleLinkClick(e, '#products')}
                aria-label="Products"
              >
                <span className="material-icons">inventory</span>
                <span className="nav-label">Products</span>
              </a>
            </li>
            <li>
              <a 
                href="#services" 
                className={currentHash === '#services' ? 'active' : ''}
                onClick={(e) => handleLinkClick(e, '#services')}
                aria-label="Services"
              >
                <span className="material-icons">widgets</span>
                <span className="nav-label">Services</span>
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className={currentHash === '#contact' ? 'active' : ''}
                onClick={(e) => handleLinkClick(e, '#contact')}
                aria-label="Contact Us"
              >
                <span className="material-icons">email</span>
                <span className="nav-label">Contact</span>
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
        <a href="#products" onClick={(e) => handleLinkClick(e, '#products')}>Products</a>
        <a href="#services" onClick={(e) => handleLinkClick(e, '#services')}>Services</a>
        <a href="#contact" onClick={(e) => handleLinkClick(e, '#contact')}>Contact Us</a>
      </div>
    </>
  );
}

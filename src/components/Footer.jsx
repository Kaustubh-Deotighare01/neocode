import React from 'react';

export default function Footer() {
  const handleLinkClick = (e, targetHash) => {
    if (targetHash.startsWith('#') && targetHash !== '#products') {
      const element = document.querySelector(targetHash);
      if (element) {
        e.preventDefault();
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, null, targetHash);
      }
    }
  };

  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <a href="#home" className="nav-logo" onClick={(e) => handleLinkClick(e, '#home')}>
            <img src="/newlogo.png" alt="NeoCode logo" className="nav-logo-img" />
            <span className="logo-text">NeoCode <span>Technologies</span></span>
          </a>
          <p>Building intelligent software solutions, AI-powered applications, and scalable digital platforms for businesses worldwide.</p>
          <div className="footer-social">
            <a href="mailto:technologiesneocode@gmail.com" className="social-btn">
              <span className="material-icons">email</span>
            </a>
            <a href="tel:+918421427605" className="social-btn">
              <span className="material-icons">call</span>
            </a>
            <a href="http://www.neocodetechnologies.com" className="social-btn" target="_blank" rel="noreferrer">
              <span className="material-icons">public</span>
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><a href="#home" onClick={(e) => handleLinkClick(e, '#home')}>Home</a></li>
            <li><a href="#services" onClick={(e) => handleLinkClick(e, '#services')}>Services</a></li>
            <li><a href="#contact" onClick={(e) => handleLinkClick(e, '#contact')}>Contact</a></li>
            <li><a href="#products">Products</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><span>Nagpur, Maharashtra, India</span></li>
            <li><span>technologiesneocode@gmail.com</span></li>
            <li><span>+91 8421427605</span></li>
            <li><span>+91 8624066459</span></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 NeoCode Technologies Pvt. Ltd. All Rights Reserved.</p>
        <p>Designed & Developed by NeoCode Technologies.</p>
      </div>
    </footer>
  );
}

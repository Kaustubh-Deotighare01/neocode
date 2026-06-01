import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import HeroSection3D from '../components/HeroSection3D';
import ServiceGrid from '../components/ServiceGrid';
import ContactForm from '../components/ContactForm';
import FaqSection from '../components/FaqSection';
import Folder from '../components/Folder';
import BentoCard from '../components/BentoCard';

const PRODUCTS = [
  {
    id: 1,
    title: 'AI Sales Assistant',
    desc: 'A predictive assistant that helps teams qualify leads, suggest responses, and streamline follow-ups.',
    icon: 'smart_toy'
  },
  {
    id: 2,
    title: 'Inventory Insights Dashboard',
    desc: 'Real-time analytics for stock levels, demand forecasts, and supplier performance in one central dashboard.',
    icon: 'analytics'
  },
  {
    id: 3,
    title: 'Chatbot Companion',
    desc: 'A conversational AI experience for customer support and internal knowledge access with smart intent handling.',
    icon: 'chat'
  },
  {
    id: 4,
    title: 'Booking & Delivery App',
    desc: 'A mobile-first product for scheduling services, tracking deliveries, and managing customer journeys.',
    icon: 'smartphone'
  },
  {
    id: 5,
    title: 'E-Commerce Storefront',
    desc: 'A polished online storefront demo with product discovery, checkout flow, and analytics-ready design.',
    icon: 'storefront'
  },
  {
    id: 6,
    title: 'Cloud Automation Portal',
    desc: 'A modern operations portal for provisioning resources, monitoring deployments, and automating workflows.',
    icon: 'cloud'
  }
];

function AboutLogoCard() {
  const cardRef = useRef(null);
  
  const handleMouseMove = (e) => {
    if (window.innerWidth <= 768) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const relativeX = (x / rect.width) * 100;
    const relativeY = (y / rect.height) * 100;
    card.style.setProperty('--glow-x', `${relativeX}%`);
    card.style.setProperty('--glow-y', `${relativeY}%`);
    card.style.setProperty('--glow-intensity', '1');

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.1,
      ease: 'power2.out',
      transformPerspective: 1000
    });

    const magnetX = (x - centerX) * 0.04;
    const magnetY = (y - centerY) * 0.04;
    gsap.to(card, {
      x: magnetX,
      y: magnetY,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty('--glow-intensity', '0');
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      x: 0,
      y: 0,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  return (
    <div 
      ref={cardRef} 
      className="about-logo-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="about-logo-glow" />
      <div className="hologram-container">
        {/* Orbital HUD Rings */}
        <div className="hud-ring ring-outer" />
        <div className="hud-ring ring-inner" />
        {/* Floating Logo Emblem */}
        <div className="floating-logo">
          <img src="/favicon.png" alt="NeoCode Emblem" className="logo-emblem-3d" />
        </div>
      </div>
      <div className="about-logo-brand">
        <span className="brand-primary">NEOCODE</span>
        <span className="brand-secondary">TECHNOLOGIES</span>
      </div>
      <div className="about-glow-badge">✦ Based in Nagpur, India</div>
    </div>
  );
}

function AboutMetricBox({ num, label }) {
  const boxRef = useRef(null);

  const handleMouseMove = (e) => {
    if (window.innerWidth <= 768) return;
    const box = boxRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const relativeX = (x / rect.width) * 100;
    const relativeY = (y / rect.height) * 100;
    box.style.setProperty('--glow-x', `${relativeX}%`);
    box.style.setProperty('--glow-y', `${relativeY}%`);
    box.style.setProperty('--glow-intensity', '0.8');

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    gsap.to(box, {
      rotateX,
      rotateY,
      duration: 0.1,
      ease: 'power2.out',
      transformPerspective: 1000
    });
  };

  const handleMouseLeave = () => {
    const box = boxRef.current;
    if (!box) return;

    box.style.setProperty('--glow-intensity', '0');
    gsap.to(box, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  return (
    <div 
      ref={boxRef} 
      className="metric-box-interactive"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="metric-num">{num}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

export default function Home() {
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    // Initialize standard reveal-on-scroll animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    // Handle hash scrolling on page mount (e.g. if loaded via #services)
    const hash = window.location.hash;
    if (hash && hash !== '#home') {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }

    return () => {
      revealElements.forEach((el) => {
        try { observer.unobserve(el); } catch (e) {}
      });
    };
  }, []);

  const handleScrollToContact = (e) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, null, '#contact');
    }
  };

  return (
    <div data-barba="container" data-barba-namespace="home">
      <style>{`
        .products-two-col {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          margin-top: 40px;
          flex-wrap: wrap;
          max-width: 1220px;
        }
        .products-text {
          flex: 1;
          min-width: 300px;
          padding-left: 0;
        }
        @media (max-width: 768px) {
          .products-text {
            padding-left: 0;
            text-align: center;
          }
        }
        .products-folder-container {
          flex: 1;
          display: flex;
          justify-content: center;
          min-width: 300px;
          padding: 40px 0;
        }
        .products-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(10px);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.4s forwards;
          overflow-y: auto;
          padding: 40px 20px;
        }
        .products-modal-content {
          width: 100%;
          max-width: 1200px;
          margin: auto;
          position: relative;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          animation: popOut 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .modal-close-btn {
          position: absolute; top: -50px; right: 0;
          background: rgba(255,255,255,0.1); border: none;
          color: white; width: 44px; height: 44px; border-radius: 50%;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          z-index: 10000;
        }
        .modal-close-btn:hover { background: rgba(0, 243, 255, 0.2); color: #00D2FF; }
        
        .detail-modal-content {
          background: linear-gradient(145deg, #1a1a2e, #16213e);
          border: 1px solid rgba(0, 243, 255, 0.2);
          padding: 40px; border-radius: 24px;
          max-width: 500px; width: 90%; text-align: center;
          position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          animation: slideUp 0.3s ease-out forwards;
          margin: auto;
        }
        .detail-modal-icon .material-icons { font-size: 64px; color: #00D2FF; margin-bottom: 20px; text-shadow: 0 0 20px rgba(0,210,255,0.5); }
        .detail-modal-content h2 { font-size: 2rem; margin-bottom: 15px; background: linear-gradient(90deg, #fff, #00D2FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .detail-modal-content p { color: #b0c4de; line-height: 1.6; margin-bottom: 30px; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes popOut { 0% { transform: scale(0.8) translateY(50px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
      `}</style>

      {/* 3D Hero Section */}
      <HeroSection3D />

      {/* Products Section */}
      <section id="products" className="services-section reveal">
        <div className="section-header-aligned">
          <div className="section-label">Demo Products</div>
        </div>
        <div className="products-two-col">
          <div className="products-folder-container">
            <Folder color="#00D2FF" onClick={() => setShowProductsModal(true)} />
          </div>
          <div className="products-text">
            <h2 className="section-title">Explore Our Demos</h2>
            <p className="section-sub" style={{ maxWidth: '100%', marginBottom: 0 }}>
              Click on our interactive project folder to reveal a grid of high-performance product demos, showcasing our capabilities from AI integration to real-time analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <ServiceGrid />
        <div className="services-cta reveal">
          <a href="#contact" className="btn-primary" onClick={handleScrollToContact}>
            Talk to Our Team
          </a>
        </div>
      </section>

      {/* About Section */}
      <section className="about-wrap reveal">
        <div className="about-left-col">
          <AboutLogoCard />
          <div className="about-metrics">
            <AboutMetricBox num="15+" label="Projects Delivered" />
            <AboutMetricBox num="50+" label="Happy Clients" />
            <AboutMetricBox num="5+" label="Years Experience" />
            <AboutMetricBox num="Global" label="Client Reach" />
          </div>
        </div>
        <div className="section-header-aligned">
          <div className="section-label">About Us</div>
          <h2 className="section-title">Who We Are</h2>
          <p className="section-sub">
            At NeoCode Technologies, we leverage cutting-edge AI and software engineering to construct high-performance digital systems. Our expert team of developers and architects delivers customized tech integrations designed to scale.
          </p>
          <ul className="about-list">
            <li>
              <span className="material-icons about-list-icon">verified</span>
              <span>End-to-end product engineering from concept to launch.</span>
            </li>
            <li>
              <span className="material-icons about-list-icon">verified</span>
              <span>Trusted by startups and global enterprises alike.</span>
            </li>
            <li>
              <span className="material-icons about-list-icon">verified</span>
              <span>Agile delivery with transparent communication.</span>
            </li>
            <li>
              <span className="material-icons about-list-icon">verified</span>
              <span>Security, performance, and quality baked into every build.</span>
            </li>
          </ul>
          <a href="#contact" className="btn-primary" onClick={handleScrollToContact}>
            Start a Project
          </a>
        </div>
      </section>

      {/* Contact Section — unified */}
      <section id="contact" className="contact-section-full reveal">
        {/* Header */}
        <div className="contact-section-header">
          <div className="section-label">Get In Touch</div>
          <h2 className="section-title">Let's Build Something Great</h2>
          <p className="section-sub">Ready to transform your business? Reach out to discuss your goals, challenges, and next steps.</p>
        </div>

        {/* Two-column body */}
        <div className="contact-wrap">
          <div className="contact-info">
            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon"><span className="material-icons">place</span></div>
                <div className="contact-item-text"><strong>Location</strong><span>Nagpur, Maharashtra, India</span></div>
              </div>
              <div className="contact-item">
                <div className="contact-icon"><span className="material-icons">email</span></div>
                <div className="contact-item-text"><strong>Email</strong><span>technologiesneocode@gmail.com</span></div>
              </div>
              <div className="contact-item">
                <div className="contact-icon"><span className="material-icons">call</span></div>
                <div className="contact-item-text"><strong>Phone</strong><span>+91 8421427605, +91 8624066459</span></div>
              </div>
            </div>
            <a href="#contact" className="btn-primary" style={{ marginTop: '20px' }} onClick={handleScrollToContact}>
              Send a Message
            </a>

            {/* Find Us — Map */}
            <div className="find-us-block">
              <div className="find-us-label">
                <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '6px' }}>location_on</span>
                Find Us
              </div>
              <div className="find-us-map-square">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d238282.74155!2d78.87799!3d21.14631!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd4c0a5a31faf13%3A0x19b37cf76e8b4ded!2sNagpur%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="NeoCode Office Location"
                />
              </div>
            </div>
          </div>

          <div className="contact-form-container">
            <ContactForm />
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <FaqSection />

      {/* Products Grid Modal */}
      {showProductsModal && !selectedProduct && (
        <div className="products-modal-overlay" onClick={() => setShowProductsModal(false)}>
          <div className="products-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowProductsModal(false)}>
              <span className="material-icons">close</span>
            </button>
            <div className="products-grid">
              {PRODUCTS.map((prod) => (
                <div key={prod.id} style={{ position: 'relative' }}>
                  <BentoCard
                    icon={prod.icon}
                    title={prod.title}
                    desc={prod.desc}
                    actionText="View Info"
                    onCardClick={() => setSelectedProduct(prod)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="products-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" style={{ top: '20px', right: '20px' }} onClick={() => setSelectedProduct(null)}>
              <span className="material-icons">close</span>
            </button>
            <div className="detail-modal-icon">
              <span className="material-icons">{selectedProduct.icon}</span>
            </div>
            <h2>{selectedProduct.title}</h2>
            <p>{selectedProduct.desc}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => setSelectedProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

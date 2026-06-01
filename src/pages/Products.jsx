import React, { useEffect } from 'react';
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

export default function Products() {
  useEffect(() => {
    // Scroll page to top when navigating here
    window.scrollTo(0, 0);

    // Initialize IntersectionObserver for scroll-reveal animations
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

    return () => {
      revealElements.forEach((el) => {
        try { observer.unobserve(el); } catch (e) {}
      });
    };
  }, []);

  return (
    <div data-barba="container" data-barba-namespace="products">
      <section 
        className="services-section reveal" 
        style={{ background: 'transparent', border: 'none', boxShadow: 'none', marginTop: '120px' }}
      >
        <div className="services-header">
          <div className="section-label">Demo Products</div>
          <h2 className="section-title">Featured Projects</h2>
          <p className="section-sub">
            Each demo highlights a different capability, from AI automation to polished web and mobile experiences.
          </p>
        </div>
        <div className="services-grid">
          {PRODUCTS.map((prod) => (
            <BentoCard
              key={prod.id}
              icon={prod.icon}
              title={prod.title}
              desc={prod.desc}
              actionText="View Demo →"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

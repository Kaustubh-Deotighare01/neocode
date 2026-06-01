import React, { useEffect } from 'react';
import HeroSection3D from '../components/HeroSection3D';
import ServiceGrid from '../components/ServiceGrid';
import ContactForm from '../components/ContactForm';
import FaqSection from '../components/FaqSection';

export default function Home() {
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
      {/* 3D Hero Section */}
      <HeroSection3D />

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
        <div>
          <div className="about-card-main">
            <div className="about-glow-badge">✦ Based in Nagpur, India</div>
            <h3>Building Tomorrow's Technology Today</h3>
            <p>At NeoCode Technologies, we are passionate about leveraging cutting-edge AI and software solutions to transform businesses with intelligent digital products.</p>
            <div className="about-metrics">
              <div className="metric-box">
                <div className="metric-num">15+</div>
                <div className="metric-label">Projects Delivered</div>
              </div>
              <div className="metric-box">
                <div className="metric-num">50+</div>
                <div className="metric-label">Happy Clients</div>
              </div>
              <div className="metric-box">
                <div className="metric-num">5+</div>
                <div className="metric-label">Years Experience</div>
              </div>
              <div className="metric-box">
                <div className="metric-num">Global</div>
                <div className="metric-label">Client Reach</div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="section-label">About Us</div>
          <h2 className="section-title">Who We Are</h2>
          <p className="section-sub">Our expert team of developers, designers, and AI specialists works together to deliver solutions that exceed expectations and drive real business value.</p>
          <ul className="about-list">
            <li>End-to-end product engineering from concept to launch.</li>
            <li>Trusted by startups and global enterprises alike.</li>
            <li>Agile delivery with transparent communication.</li>
            <li>Security, performance, and quality baked into every build.</li>
          </ul>
          <a href="#contact" className="btn-primary" onClick={handleScrollToContact}>
            Start a Project
          </a>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="reveal">
        <div className="section-label">Get In Touch</div>
        <h2 className="section-title">Let's Build Something Great</h2>
        <p className="section-sub">Ready to transform your business? Reach out to discuss your goals, challenges, and next steps.</p>
      </section>

      <section className="contact-wrap reveal">
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
          <a href="#contact" className="btn-primary" onClick={handleScrollToContact}>
            Send a Message
          </a>
        </div>
        <ContactForm />
      </section>

      {/* Map Section */}
      <section className="map-section reveal">
        <div className="section-label">Find Us</div>
        <h2 className="section-title">We're Based in <span className="grad">Nagpur</span></h2>
        <div className="map-inner">
          <div className="map-frame">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d238282.74155!2d78.87799!3d21.14631!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd4c0a5a31faf13%3A0x19b37cf76e8b4ded!2sNagpur%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000"
              allowFullScreen=""
              loading="eager"
              height="380"
              referrerPolicy="no-referrer-when-downgrade"
              title="NeoCode Office Map"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />
    </div>
  );
}

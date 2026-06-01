import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

function BentoParticle({ left, top }) {
  const particleRef = useRef(null);

  useEffect(() => {
    const p = particleRef.current;
    if (!p) return;

    // Quick entry animation
    gsap.fromTo(p,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
    );

    // Random floating motion path
    gsap.to(p, {
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      rotation: Math.random() * 360,
      duration: 2 + Math.random() * 2,
      ease: 'none',
      repeat: -1,
      yoyo: true
    });

    // Breathing glow opacity shift
    gsap.to(p, {
      opacity: 0.3,
      duration: 1.5,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true
    });
  }, []);

  return (
    <div 
      ref={particleRef} 
      className="bento-particle" 
      style={{ left, top, position: 'absolute' }} 
    />
  );
}

export default function BentoCard({ icon, title, desc, actionText }) {
  const cardRef = useRef(null);
  const [particles, setParticles] = useState([]);

  const handleMouseMove = (e) => {
    if (window.innerWidth <= 768) return; // Disable hover tilts on mobile
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 1. Update css properties for spotlight glow
    const relativeX = (x / rect.width) * 100;
    const relativeY = (y / rect.height) * 100;
    card.style.setProperty('--glow-x', `${relativeX}%`);
    card.style.setProperty('--glow-y', `${relativeY}%`);
    card.style.setProperty('--glow-intensity', '1');

    // 2. 3D Tilt logic
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.1,
      ease: 'power2.out',
      transformPerspective: 1000
    });

    // 3. Magnetism offset
    const magnetX = (x - centerX) * 0.05;
    const magnetY = (y - centerY) * 0.05;
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

    // Fade out spotlight glow
    card.style.setProperty('--glow-intensity', '0');

    // Reset transformations smoothly
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      x: 0,
      y: 0,
      duration: 0.3,
      ease: 'power2.out'
    });

    // Destroy active particles
    setParticles([]);
  };

  const handleMouseEnter = () => {
    if (window.innerWidth <= 768) return;

    // Generate random start locations for floating particles
    const count = 12;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 90}%`,
      top: `${Math.random() * 90}%`
    }));
    setParticles(newParticles);
  };

  const handleClick = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    );

    // Create ripple effect element
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${maxDistance * 2}px;
      height: ${maxDistance * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 243, 255, 0.4) 0%, rgba(0, 243, 255, 0.2) 30%, transparent 70%);
      left: ${x - maxDistance}px;
      top: ${y - maxDistance}px;
      pointer-events: none;
      z-index: 1000;
    `;
    card.appendChild(ripple);

    gsap.fromTo(ripple,
      { scale: 0, opacity: 1 },
      {
        scale: 1,
        opacity: 0,
        duration: 0.8,
        onComplete: () => ripple.remove()
      }
    );
  };

  return (
    <div
      ref={cardRef}
      className="service-card reveal"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {/* Background glow base */}
      <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div>
        <div className="service-icon">
          <span className="material-icons">{icon}</span>
        </div>
        <div className="service-title">{title}</div>
        <p className="service-desc">{desc}</p>
      </div>
      <div className="service-arrow">{actionText}</div>

      {/* Render active particles inside the card */}
      {particles.map((p) => (
        <BentoParticle key={p.id} left={p.left} top={p.top} />
      ))}
    </div>
  );
}

import React from 'react';
import BentoCard from './BentoCard';

const SERVICES = [
  {
    id: 1,
    title: 'AI Development',
    desc: 'Custom AI solutions including machine learning models, natural language processing, and intelligent automation.',
    icon: 'smart_toy'
  },
  {
    id: 2,
    title: 'Software Development',
    desc: 'Enterprise-grade software solutions built with modern architectures and scalable engineering practices.',
    icon: 'computer'
  },
  {
    id: 3,
    title: 'Mobile Apps',
    desc: 'Native and cross-platform mobile applications designed for smooth performance and delightful user experiences.',
    icon: 'smartphone'
  },
  {
    id: 4,
    title: 'Web Development',
    desc: 'Modern websites and web applications that are fast, secure, and built to convert visitors into customers.',
    icon: 'public'
  },
  {
    id: 5,
    title: 'Automation Systems',
    desc: 'Streamline business workflows with intelligent automation, integrations, and backend orchestration.',
    icon: 'build'
  },
  {
    id: 6,
    title: 'Cloud Solutions',
    desc: 'Cloud architecture, deployment, and management to keep your product available, secure, and resilient.',
    icon: 'cloud'
  }
];

export default function ServiceGrid() {
  return (
    <>
      {/* Section Header */}
      <div className="services-header reveal">
        <div className="section-label">What We Do</div>
        <h2 className="section-title">Cutting-Edge Technology Solutions</h2>
        <p className="section-sub">
          From AI-powered products to scalable cloud infrastructure — end-to-end digital transformation for modern businesses.
        </p>
      </div>

      {/* 6-Card Grid */}
      <div className="services-grid">
        {SERVICES.map((service) => (
          <BentoCard
            key={service.id}
            icon={service.icon}
            title={service.title}
            desc={service.desc}
            actionText="Learn more →"
          />
        ))}
      </div>
    </>
  );
}

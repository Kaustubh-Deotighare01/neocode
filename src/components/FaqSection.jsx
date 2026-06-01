import React, { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: "How long does a typical project take?",
    answer: "Project timelines vary by scope. Simple websites can take 2–4 weeks, while enterprise applications or AI systems can take 3–6 months."
  },
  {
    question: "Do you provide post-launch support?",
    answer: "Yes. We provide support, maintenance, and ongoing enhancements to help your product stay secure and up to date."
  },
  {
    question: "How is pricing determined?",
    answer: "Pricing depends on requirements, complexity, and timeline. We offer transparent estimates with no hidden fees."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section reveal">
      <div className="faq-header">
        <div className="section-label">Common Questions</div>
        <h2 className="section-title">Frequently Asked <span className="grad">Questions</span></h2>
      </div>
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => toggleFaq(index)}>
              {item.question} <span className="faq-icon">{isOpen ? '−' : '+'}</span>
            </button>
            <div className="faq-a" style={{ display: isOpen ? 'block' : 'none' }}>
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

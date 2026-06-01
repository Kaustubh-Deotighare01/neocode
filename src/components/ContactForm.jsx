import React, { useState, useEffect } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });

  const [status, setStatus] = useState({
    submitting: false,
    message: '',
    type: '' // 'success' or 'error'
  });

  useEffect(() => {
    // Initialize EmailJS if the SDK is available
    if (window.emailjs) {
      window.emailjs.init('YOUR_PUBLIC_KEY');
    }
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, message: '', type: '' });

    const { firstName, lastName, email, phone, service, message } = formData;

    if (!firstName || !email || !service || !message) {
      setStatus({
        submitting: false,
        message: '⚠️ Please fill in all required fields.',
        type: 'error'
      });
      return;
    }

    const templateParams = {
      from_name: `${firstName} ${lastName}`.trim(),
      from_email: email,
      phone: phone || 'Not provided',
      service: service || 'Not specified',
      message: message,
      to_email: 'technologiesneocode@gmail.com'
    };

    try {
      if (window.emailjs) {
        await window.emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
        setStatus({
          submitting: false,
          message: '✅ Message sent successfully! We will contact you shortly.',
          type: 'success'
        });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          service: '',
          message: ''
        });
      } else {
        throw new Error('EmailJS SDK not available');
      }
    } catch (err) {
      // Fallback: open mailto link with pre-filled content
      const subject = encodeURIComponent(`Enquiry — ${service} — ${firstName} ${lastName}`);
      const body = encodeURIComponent(
        `Name: ${firstName} ${lastName}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone || 'N/A'}\n` +
        `Service: ${service}\n\n` +
        `Message:\n${message}`
      );
      
      window.location.href = `mailto:technologiesneocode@gmail.com?subject=${subject}&body=${body}`;
      
      setStatus({
        submitting: false,
        message: '📧 Your email client has been opened. Please send the pre-filled email to complete your enquiry.',
        type: 'success'
      });
    }
  };

  return (
    <div className="contact-form-box">
      <div className="form-title">Send Us a Message</div>
      <div className="form-subtitle">We normally respond within 24 hours.</div>
      <form id="contactForm" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="john@company.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            placeholder="+91 00000 00000"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="service">Service Interested In</label>
          <select id="service" value={formData.service} onChange={handleChange} required>
            <option value="">Select a service…</option>
            <option>AI Development</option>
            <option>Custom Software Development</option>
            <option>Mobile App Development</option>
            <option>Web Development</option>
            <option>Automation Systems</option>
            <option>Cloud Solutions</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="message">Your Message</label>
          <textarea
            id="message"
            placeholder="Tell us about your project…"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <button type="submit" className="form-submit" id="submitBtn" disabled={status.submitting}>
          {status.submitting ? 'Sending…' : 'Send Message →'}
        </button>
        {status.message && (
          <div className={`form-msg ${status.type}`} style={{ display: 'block' }}>
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}

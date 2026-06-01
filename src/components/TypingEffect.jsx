import React, { useState, useEffect } from 'react';

export default function TypingEffect() {
  const [text, setText] = useState('');
  const textToType = "NeoCode Technology ";

  useEffect(() => {
    let charIndex = 0;
    let timeoutId;

    const typeWriter = () => {
      if (charIndex < textToType.length) {
        setText(textToType.slice(0, charIndex + 1));
        charIndex++;
        timeoutId = setTimeout(typeWriter, 100 + Math.random() * 50);
      }
    };

    // Initial delay before typing starts
    const startDelayId = setTimeout(typeWriter, 500);

    return () => {
      clearTimeout(startDelayId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <span className="typing-container">
      <span className="typing-text">{text}</span>
      <span className="typing-cursor">|</span>
    </span>
  );
}

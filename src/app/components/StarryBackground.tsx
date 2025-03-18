'use client';

import { useEffect, useRef } from 'react';

export default function StarryBackground() {
  const starsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!starsRef.current) return;
    
    // Clear any existing stars
    starsRef.current.innerHTML = '';
    
    // Create stars
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      // Random position
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      
      // Random size (slightly varied)
      const size = 1 + Math.random() * 2;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      // Random animation properties
      star.style.setProperty('--duration', `${3 + Math.random() * 7}s`);
      star.style.setProperty('--delay', `${Math.random() * 5}s`);
      star.style.setProperty('--opacity', `${0.5 + Math.random() * 0.5}`);
      
      starsRef.current.appendChild(star);
    }
  }, []);
  
  return <div className="stars" ref={starsRef}></div>;
}
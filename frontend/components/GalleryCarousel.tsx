'use client';

import { useEffect, useState, useRef } from 'react';

export default function GalleryCarousel() {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => setImages(data.images || []))
      .catch(() => setImages([]));
  }, []);

  useEffect(() => {
    if (images.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: currentIndex * (carouselRef.current.offsetWidth / 3),
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  if (images.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка галереи...</div>;
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
      <div 
        ref={carouselRef}
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          padding: '10px 0'
        }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            style={{
              minWidth: 'calc(33.333% - 8px)',
              flex: '0 0 auto',
              opacity: Math.abs(currentIndex - idx) <= 2 ? 1 : 0.5,
              transition: 'opacity 0.5s ease',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <img
              src={img}
              alt={`Галерея ${idx + 1}`}
              style={{
                width: '100%',
                height: '220px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.13)'
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Индикаторы */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: 'none',
              background: idx === currentIndex ? 'var(--accent-green)' : '#666',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
}

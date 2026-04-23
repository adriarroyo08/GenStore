import React, { useState, useRef, useCallback } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
  onClick?: () => void;
}

export function ImageZoom({ src, alt, className = '', zoomScale = 2.5, onClick }: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState('center');

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      setBackgroundPosition(`${x}% ${y}%`);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-zoom-in ${className}`}
      onMouseEnter={() => setIsZooming(true)}
      onMouseLeave={() => setIsZooming(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain p-6 transition-opacity duration-200 ${isZooming ? 'opacity-0' : 'opacity-100'}`}
        draggable={false}
      />
      {isZooming && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomScale * 100}%`,
            backgroundPosition,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  );
}

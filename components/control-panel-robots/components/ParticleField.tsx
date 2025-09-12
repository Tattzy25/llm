import React from 'react';

export const ParticleField = () => {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="data-stream-line"
          style={{
            left: `${10 + i * 12}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${6 + Math.random() * 4}s`
          }}
        />
      ))}
      {[...Array(6)].map((_, i) => (
        <div
          key={`right-${i}`}
          className="data-stream-line"
          style={{
            right: `${5 + i * 8}%`,
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${7 + Math.random() * 3}s`,
            background: 'linear-gradient(to bottom, transparent, rgba(147, 51, 234, 0.6), transparent)'
          }}
        />
      ))}
    </>
  );
};
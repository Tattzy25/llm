import React from 'react';

export const HolographicGrid = () => {
  return (
    <div
      className="absolute inset-0 opacity-10 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, var(--holo-cyan) 25%, transparent 26%, transparent 74%, var(--holo-cyan) 75%, transparent 76%, transparent),
          linear-gradient(90deg, transparent 24%, var(--holo-cyan) 25%, transparent 26%, transparent 74%, var(--holo-cyan) 75%, transparent 76%, transparent)
        `,
        backgroundSize: '50px 50px',
      }}
    />
  );
};
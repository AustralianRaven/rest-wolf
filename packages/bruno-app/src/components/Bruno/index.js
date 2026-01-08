import React from 'react';

const Bruno = ({ width }) => {
  return (
    <svg width={width} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      {/* Constellation dog design */}
      <defs>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B7280" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
      </defs>

      {/* Dog body silhouette */}
      <path
        d="M80 120 Q90 110 110 115 Q130 120 140 130 L160 140 Q180 145 190 160 L200 180 Q205 200 200 210 L190 220 Q180 225 170 220 L150 210 Q140 215 130 210 L110 200 Q100 195 95 185 L85 170 Q80 150 85 135 Z"
        fill="url(#bodyGradient)"
        opacity="0.8"
      />

      {/* Head */}
      <ellipse cx="85" cy="140" rx="15" ry="18" fill="url(#bodyGradient)" opacity="0.8" />

      {/* Ears */}
      <ellipse cx="75" cy="130" rx="6" ry="12" fill="url(#bodyGradient)" opacity="0.8" />
      <ellipse cx="95" cy="130" rx="6" ry="12" fill="url(#bodyGradient)" opacity="0.8" />

      {/* Legs */}
      <ellipse cx="110" cy="210" rx="8" ry="15" fill="url(#bodyGradient)" opacity="0.8" />
      <ellipse cx="130" cy="215" rx="8" ry="15" fill="url(#bodyGradient)" opacity="0.8" />
      <ellipse cx="160" cy="215" rx="8" ry="15" fill="url(#bodyGradient)" opacity="0.8" />
      <ellipse cx="180" cy="210" rx="8" ry="15" fill="url(#bodyGradient)" opacity="0.8" />

      {/* Tail */}
      <path d="M190 180 Q205 175 210 165 Q215 155 210 150" stroke="url(#bodyGradient)" strokeWidth="8" fill="none" opacity="0.8" />

      {/* Constellation stars */}
      <circle cx="85" cy="140" r="3" fill="#FCD34D" />
      <circle cx="110" cy="150" r="2.5" fill="#FCD34D" />
      <circle cx="140" cy="160" r="3" fill="#FCD34D" />
      <circle cx="165" cy="170" r="2" fill="#FCD34D" />
      <circle cx="185" cy="180" r="2.5" fill="#FCD34D" />
      <circle cx="200" cy="190" r="2" fill="#FCD34D" />
      <circle cx="175" cy="195" r="2" fill="#FCD34D" />
      <circle cx="150" cy="200" r="2.5" fill="#FCD34D" />
      <circle cx="125" cy="195" r="2" fill="#FCD34D" />
      <circle cx="105" cy="185" r="2.5" fill="#FCD34D" />
      <circle cx="95" cy="165" r="2" fill="#FCD34D" />

      {/* Constellation lines */}
      <g stroke="#FCD34D" strokeWidth="1" opacity="0.6">
        <line x1="85" y1="140" x2="110" y2="150" />
        <line x1="110" y1="150" x2="140" y2="160" />
        <line x1="140" y1="160" x2="165" y2="170" />
        <line x1="165" y1="170" x2="185" y2="180" />
        <line x1="185" y1="180" x2="200" y2="190" />
        <line x1="185" y1="180" x2="175" y2="195" />
        <line x1="175" y1="195" x2="150" y2="200" />
        <line x1="150" y1="200" x2="125" y2="195" />
        <line x1="125" y1="195" x2="105" y2="185" />
        <line x1="105" y1="185" x2="95" y2="165" />
        <line x1="95" y1="165" x2="85" y2="140" />
        <line x1="110" y1="150" x2="105" y2="185" />
        <line x1="140" y1="160" x2="125" y2="195" />
      </g>
    </svg>
  );
};

export default Bruno;

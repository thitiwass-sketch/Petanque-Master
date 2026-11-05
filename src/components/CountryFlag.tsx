import React from 'react';

interface CountryFlagProps {
  code: string;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ code, className = 'w-4 h-2.5' }) => {
  const upper = (code || '').toUpperCase().trim();

  // Thailand 🇹🇭
  if (upper === 'TH' || upper === 'THAILAND' || upper === 'ไทย' || upper === 'ประเทศไทย' || upper.includes('🇹🇭')) {
    return (
      <span
        role="img"
        aria-label="ธงชาติไทย 🇹🇭"
        title="ธงชาติไทย 🇹🇭"
        className={`inline-flex items-center justify-center shrink-0 rounded-[2px] overflow-hidden shadow-xs border border-white/20 align-middle ${className}`}
      >
        <svg viewBox="0 0 900 600" className="w-full h-full block" preserveAspectRatio="none">
          <rect width="900" height="600" fill="#A51931" />
          <rect y="100" width="900" height="400" fill="#F4F5F8" />
          <rect y="200" width="900" height="200" fill="#2D2A4A" />
        </svg>
      </span>
    );
  }

  // France 🇫🇷
  if (upper === 'FR' || upper === 'FRANCE' || upper === 'ฝรั่งเศส' || upper.includes('🇫🇷')) {
    return (
      <span
        role="img"
        aria-label="ธงชาติฝรั่งเศส 🇫🇷"
        title="ธงชาติฝรั่งเศส 🇫🇷"
        className={`inline-flex items-center justify-center shrink-0 rounded-[2px] overflow-hidden shadow-xs border border-white/20 align-middle ${className}`}
      >
        <svg viewBox="0 0 900 600" className="w-full h-full block" preserveAspectRatio="none">
          <rect width="300" height="600" fill="#002395" />
          <rect x="300" width="300" height="600" fill="#FFFFFF" />
          <rect x="600" width="300" height="600" fill="#ED2939" />
        </svg>
      </span>
    );
  }

  // Singapore 🇸🇬
  if (upper === 'SG' || upper === 'SINGAPORE' || upper === 'สิงคโปร์' || upper.includes('🇸🇬')) {
    return (
      <span
        role="img"
        aria-label="ธงชาติสิงคโปร์ 🇸🇬"
        title="ธงชาติสิงคโปร์ 🇸🇬"
        className={`inline-flex items-center justify-center shrink-0 rounded-[2px] overflow-hidden shadow-xs border border-white/20 align-middle ${className}`}
      >
        <svg viewBox="0 0 900 600" className="w-full h-full block" preserveAspectRatio="none">
          <rect width="900" height="300" fill="#EF3340" />
          <rect y="300" width="900" height="300" fill="#FFFFFF" />
          <circle cx="180" cy="150" r="90" fill="#FFFFFF" />
          <circle cx="215" cy="150" r="85" fill="#EF3340" />
          <polygon points="260,110 263,119 272,119 265,125 268,134 260,128 252,134 255,125 248,119 257,119" fill="#FFFFFF" />
          <polygon points="280,140 283,149 292,149 285,155 288,164 280,158 272,164 275,155 268,149 277,149" fill="#FFFFFF" />
          <polygon points="280,170 283,179 292,179 285,185 288,194 280,188 272,194 275,185 268,179 277,179" fill="#FFFFFF" />
          <polygon points="260,200 263,209 272,209 265,215 268,224 260,218 252,224 255,215 248,209 257,209" fill="#FFFFFF" />
          <polygon points="240,155 243,164 252,164 245,170 248,179 240,173 232,179 235,170 228,164 237,164" fill="#FFFFFF" />
        </svg>
      </span>
    );
  }

  // European Union 🇪🇺
  if (upper === 'EU' || upper === 'EUROPE' || upper === 'ยุโรป' || upper.includes('🇪🇺')) {
    return (
      <span
        role="img"
        aria-label="ธงสหภาพยุโรป 🇪🇺"
        title="ธงสหภาพยุโรป 🇪🇺"
        className={`inline-flex items-center justify-center shrink-0 rounded-[2px] overflow-hidden shadow-xs border border-white/20 align-middle ${className}`}
      >
        <svg viewBox="0 0 900 600" className="w-full h-full block" preserveAspectRatio="none">
          <rect width="900" height="600" fill="#003399" />
          <circle cx="450" cy="300" r="160" fill="none" stroke="#FFCC00" strokeWidth="8" strokeDasharray="18 65" />
        </svg>
      </span>
    );
  }

  return <span className="inline-block mr-1">🌍</span>;
};

export const ThaiFlag: React.FC<{ className?: string }> = ({ className = 'w-4 h-2.5' }) => (
  <CountryFlag code="TH" className={className} />
);

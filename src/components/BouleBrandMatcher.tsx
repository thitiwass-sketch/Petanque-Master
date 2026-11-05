import React, { useState } from 'react';
import { BouleModel, MatchScoreResult, matchBoulesToSpec } from '../data/bouleBrands';

interface BouleBrandMatcherProps {
  playerRole: 'pointer' | 'shooter' | 'milieu';
  diameter: number;
  weight: number;
  striation: 'smooth' | 'single' | 'double' | 'heavy';
  onSelectModelForProfile?: (model: BouleModel) => void;
}

export const BouleBrandMatcher: React.FC<BouleBrandMatcherProps> = ({
  playerRole,
  diameter,
  weight,
  striation,
  onSelectModelForProfile,
}) => {
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);

  const matched = matchBoulesToSpec(
    playerRole,
    diameter,
    weight,
    striation === 'heavy' ? 'carbon' : undefined
  );

  const filteredMatches = selectedBrandFilter === 'all'
    ? matched
    : matched.filter((m) => m.model.brand === selectedBrandFilter);

  const brands = ['all', 'Obut', 'MS Pétanque', 'La Boule Bleue', 'Boulenciel', 'Geologique'];

  return (
    <div className="mt-8 pt-8 border-t border-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold mb-2">
            <i className="fa-solid fa-tags"></i>
            <span>Brand & Model Matching ในตลาดจริง</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
            รุ่นลูกเปตองที่แนะนำตามสเปกของคุณ <span className="gradient-text">(FIPJP Certified)</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            แมตช์ความแข็ง ขนาด Ø {diameter} mm และน้ำหนัก {weight} g กับแบรนด์ลูกเปตองแข่งขันยอดนิยมในตลาดจริง
          </p>
        </div>

        {/* Brand Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBrandFilter(b)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                selectedBrandFilter === b
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {b === 'all' ? 'ทุกยี่ห้อ (All)' : b}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMatches.slice(0, 6).map((match, idx) => {
          const model = match.model;
          const isTopMatch = idx === 0 && selectedBrandFilter === 'all';
          const isExpanded = viewDetailsId === model.id;

          return (
            <div
              key={model.id}
              className={`glass-panel p-5 rounded-3xl border transition duration-300 relative flex flex-col justify-between ${
                isTopMatch
                  ? 'border-orange-500/80 bg-gradient-to-b from-orange-950/20 to-slate-900 shadow-glow-orange'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
              }`}
            >
              {/* Badge & Match Score Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {model.brand} • {model.country}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <div
                      className={`px-2.5 py-1 rounded-xl font-mono text-xs font-black flex items-center gap-1 shadow-sm ${
                        match.matchScore >= 90
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <i className="fa-solid fa-circle-check text-[10px]"></i>
                      <span>{match.matchScore}% MATCH</span>
                    </div>
                  </div>
                </div>

                {/* Model Title & Tagline */}
                <h4 className="text-base sm:text-lg font-black text-white font-heading leading-tight mb-1">
                  {model.name}
                </h4>
                <p className="text-xs text-amber-300/90 font-medium mb-3">
                  {model.tagline}
                </p>

                {/* Key Spec Badges */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">ความแข็ง</span>
                    <strong className="text-xs font-mono font-bold text-sky-400 block">
                      {model.hardnessValue}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">วัสดุ</span>
                    <strong className="text-xs font-bold text-slate-200 block truncate">
                      {model.material === 'stainless' ? 'สแตนเลส' : 'คาร์บอน'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ราคาโดยประมาณ</span>
                    <strong className="text-xs font-mono font-bold text-amber-400 block">
                      {model.estimatedPriceTHB}
                    </strong>
                  </div>
                </div>

                {/* Match Reasons */}
                <ul className="space-y-1 mb-3 text-xs text-slate-300">
                  {match.reasons.map((r, ri) => (
                    <li key={ri} className="flex items-start gap-1.5">
                      <i className="fa-solid fa-check text-emerald-400 text-[10px] mt-1 shrink-0"></i>
                      <span className="leading-tight">{r}</span>
                    </li>
                  ))}
                </ul>

                {/* Expandable details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300 animate-fade-in">
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {model.description}
                    </p>
                    <div className="space-y-1">
                      <strong className="text-[11px] text-slate-200 block">จุดเด่นสำคัญ:</strong>
                      {model.pros.map((p, pi) => (
                        <div key={pi} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 pt-1">
                      ✓ {model.officialCert} มาตรฐานแข่งขันสากล
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setViewDetailsId(isExpanded ? null : model.id)}
                  className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1 transition"
                >
                  <span>{isExpanded ? 'ย่อรายละเอียด' : 'ดูจุดเด่นรุ่นนี้'}</span>
                  <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`}></i>
                </button>

                {onSelectModelForProfile && (
                  <button
                    type="button"
                    onClick={() => onSelectModelForProfile(model)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                  >
                    <i className="fa-solid fa-bookmark text-amber-400"></i>
                    <span>เลือกรุ่นนี้</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

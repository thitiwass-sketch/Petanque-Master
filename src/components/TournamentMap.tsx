import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TournamentItem } from '../App';
import { ThaiFlag, CountryFlag } from './CountryFlag';

export interface TournamentCoords {
  lat: number;
  lng: number;
  city: string;
  countryName: string;
  venueName: string;
  region: 'thailand' | 'europe' | 'asean';
}

export const TOURNAMENT_COORDS: Record<string, TournamentCoords> = {
  'th-open-laemchabang': {
    lat: 13.0827,
    lng: 100.9163,
    city: 'ชลบุรี (Chonburi)',
    countryName: 'ประเทศไทย',
    venueName: 'สนามกีฬาเปตอง การท่าเรือแหลมฉบัง',
    region: 'thailand'
  },
  'fipjp-world-championship': {
    lat: 47.3638,
    lng: 5.0601,
    city: 'ดีฌง (Dijon)',
    countryName: 'ประเทศฝรั่งเศส',
    venueName: 'Le Zénith de Dijon',
    region: 'europe'
  },
  'th-national-championship': {
    lat: 14.0322,
    lng: 100.7289,
    city: 'ปทุมธานี (Pathum Thani)',
    countryName: 'ประเทศไทย',
    venueName: 'สนามเปตองในร่ม ศูนย์ฝึกกีฬาแห่งชาติ คลอง 6',
    region: 'thailand'
  },
  'marseillaise-open': {
    lat: 43.2592,
    lng: 5.3789,
    city: 'มาร์เซย์ (Marseille)',
    countryName: 'ประเทศฝรั่งเศส',
    venueName: 'Parc Borély & Plages du Prado',
    region: 'europe'
  },
  'royal-princess-cup': {
    lat: 13.7656,
    lng: 100.3546,
    city: 'กรุงเทพมหานคร (Bangkok)',
    countryName: 'ประเทศไทย',
    venueName: 'สนามเปตอง มหาวิทยาลัยกรุงเทพธนบุรี',
    region: 'thailand'
  },
  'masters-de-petanque': {
    lat: 43.7102,
    lng: 7.2620,
    city: 'นีซ & ริเวียรา (Nice / Côte d\'Azur)',
    countryName: 'ประเทศฝรั่งเศส',
    venueName: 'Promenade des Anglais & Arenes de Nice',
    region: 'europe'
  },
  'singapore-open': {
    lat: 1.3392,
    lng: 103.6944,
    city: 'จูร่ง (Jurong West)',
    countryName: 'ประเทศสิงคโปร์',
    venueName: 'Jurong West Sports Centre',
    region: 'asean'
  },
  'chiangmai-lanna-open': {
    lat: 18.8415,
    lng: 98.9632,
    city: 'เชียงใหม่ (Chiang Mai)',
    countryName: 'ประเทศไทย',
    venueName: 'สนามกีฬา 700 ปี เชียงใหม่',
    region: 'thailand'
  },
  'thailand-national-games': {
    lat: 14.0228,
    lng: 99.5328,
    city: 'กาญจนบุรี / ภูมิภาคเจ้าภาพ',
    countryName: 'ประเทศไทย',
    venueName: 'สนามกีฬากลางจังหวัดเจ้าภาพ กกท.',
    region: 'thailand'
  },
  'sea-games-petanque': {
    lat: 12.9276,
    lng: 100.8771,
    city: 'พัทยา & ชลบุรี (Pattaya)',
    countryName: 'ประเทศไทย',
    venueName: 'ศูนย์กีฬาเปตองนานาชาติ พัทยา',
    region: 'thailand'
  },
  'bangkok-petanque-grand-prix': {
    lat: 13.7525,
    lng: 100.5015,
    city: 'พระนคร กรุงเทพฯ (Bangkok)',
    countryName: 'ประเทศไทย',
    venueName: 'สนามเปตอง ลานคนเมือง ศาลาว่าการ กทม.',
    region: 'thailand'
  },
  'asian-petanque-championship': {
    lat: 13.8138,
    lng: 100.7412,
    city: 'มีนบุรี กรุงเทพฯ (Bangkok)',
    countryName: 'ประเทศไทย',
    venueName: 'ศูนย์กีฬาเฉลิมพระเกียรติฯ มีนบุรี',
    region: 'thailand'
  }
};

// Map controller component for smooth flyTo animations
function MapViewController({
  target,
  zoom,
}: {
  target: [number, number] | null;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [target, zoom, map]);

  return null;
}

interface TournamentMapProps {
  tournaments: TournamentItem[];
  onSelectTourney: (tourney: TournamentItem) => void;
  highlightedId?: string | null;
}

export const TournamentMap: React.FC<TournamentMapProps> = ({
  tournaments,
  onSelectTourney,
  highlightedId,
}) => {
  const [selectedTourneyId, setSelectedTourneyId] = useState<string | null>(
    highlightedId || (tournaments[0]?.id ?? null)
  );
  const [mapTarget, setMapTarget] = useState<[number, number] | null>([14.5, 100.5]);
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [activeRegionFilter, setActiveRegionFilter] = useState<'all' | 'thailand' | 'europe' | 'asean'>('all');

  // Filter tournaments that have coordinate mappings
  const mappedTournaments = useMemo(() => {
    return tournaments
      .filter((t) => TOURNAMENT_COORDS[t.id])
      .filter((t) => {
        if (activeRegionFilter === 'all') return true;
        return TOURNAMENT_COORDS[t.id]?.region === activeRegionFilter;
      });
  }, [tournaments, activeRegionFilter]);

  // Handle focus on regional buttons
  const handleFocusRegion = (region: 'all' | 'thailand' | 'europe' | 'asean') => {
    setActiveRegionFilter(region);
    if (region === 'all') {
      setMapTarget([25.0, 55.0]);
      setMapZoom(3);
    } else if (region === 'thailand') {
      setMapTarget([14.0, 100.8]);
      setMapZoom(6);
    } else if (region === 'europe') {
      setMapTarget([46.0, 4.5]);
      setMapZoom(5);
    } else if (region === 'asean') {
      setMapTarget([5.5, 102.5]);
      setMapZoom(5);
    }
  };

  // Fly to specific tournament
  const handleFlyToTourney = (tourney: TournamentItem) => {
    setSelectedTourneyId(tourney.id);
    const coords = TOURNAMENT_COORDS[tourney.id];
    if (coords) {
      setMapTarget([coords.lat, coords.lng]);
      setMapZoom(11);
    }
  };

  // Helper to create custom HTML DivIcons
  const createCustomIcon = (tourney: TournamentItem, isSelected: boolean) => {
    const isLive = tourney.status === 'live';
    const isDomestic = tourney.scope === 'domestic';

    let bgGrad = isLive
      ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
      : isDomestic
      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
      : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';

    let borderColor = isLive ? '#fca5a5' : isDomestic ? '#7dd3fc' : '#fcd34d';
    let pulseHtml = isLive
      ? '<span class="absolute -inset-1.5 rounded-full bg-rose-500/50 animate-ping"></span>'
      : '';

    let flagHtml = isDomestic ? '🇹🇭' : tourney.country.includes('ฝรั่งเศส') ? '🇫🇷' : tourney.country.includes('สิงคโปร์') ? '🇸🇬' : '🌍';

    const html = `
      <div class="relative group cursor-pointer flex items-center justify-center">
        ${pulseHtml}
        <div style="background: ${bgGrad}; border-color: ${borderColor}; ${isSelected ? 'transform: scale(1.25); box-shadow: 0 0 20px rgba(249, 115, 22, 0.8);' : ''}" 
             class="w-9 h-9 rounded-2xl flex items-center justify-center text-white border-2 shadow-2xl transition-all duration-300 transform hover:scale-115">
          <span style="font-size: 15px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">${flagHtml}</span>
        </div>
        <div class="absolute -bottom-1 w-2 h-2 rotate-45" style="background: ${bgGrad}; border-right: 2px solid ${borderColor}; border-bottom: 2px solid ${borderColor};"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-leaflet-marker',
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -42],
    });
  };

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-slate-800 space-y-5 shadow-2xl animate-fade-in">
      {/* Header with Title & Region Switchers */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">
              Geographic Tournament Explorer
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white font-heading flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot text-amber-400"></i>
            <span>แผนที่พิกัดสนามแข่งขันเปตอง (Interactive Map)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            คลิกหมุดสนามหรือเลือกรายการแข่งขันเพื่อซูมพิกัดสนามจริง พร้อมดูช่องทางสัญญาณสดขอบสนาม
          </p>
        </div>

        {/* Region Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleFocusRegion('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeRegionFilter === 'all'
                ? 'bg-orange-600 text-white shadow-glow-orange'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <i className="fa-solid fa-globe text-xs"></i>
            <span>ทั่วโลก ({tournaments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleFocusRegion('thailand')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeRegionFilter === 'thailand'
                ? 'bg-sky-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ThaiFlag />
            <span>ประเทศไทย</span>
          </button>

          <button
            type="button"
            onClick={() => handleFocusRegion('europe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeRegionFilter === 'europe'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CountryFlag code="FR" />
            <span>ยุโรป/ฝรั่งเศส</span>
          </button>

          <button
            type="button"
            onClick={() => handleFocusRegion('asean')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeRegionFilter === 'asean'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CountryFlag code="SG" />
            <span>สิงคโปร์ & อาเซียน</span>
          </button>
        </div>
      </div>

      {/* Main Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Leaflet Map Canvas (8 Columns on desktop) */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative min-h-[420px] sm:min-h-[500px] bg-slate-950">
          <MapContainer
            center={mapTarget || [14.0, 100.8]}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full min-h-[420px] sm:min-h-[500px] z-0"
            style={{ backgroundColor: '#090d16' }}
          >
            {/* Smooth CartoDB Dark Matter Tiles for crisp night/sports appearance */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            <MapViewController target={mapTarget} zoom={mapZoom} />

            {mappedTournaments.map((tourney) => {
              const coords = TOURNAMENT_COORDS[tourney.id];
              if (!coords) return null;
              const isSelected = selectedTourneyId === tourney.id;

              return (
                <Marker
                  key={tourney.id}
                  position={[coords.lat, coords.lng]}
                  icon={createCustomIcon(tourney, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedTourneyId(tourney.id);
                    },
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-2 text-slate-900 max-w-[270px]">
                      <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tourney.status === 'live'
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tourney.status === 'live' ? '🔴 สดวันนี้ (LIVE)' : 'เตรียมแข่ง'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          {tourney.country.includes('ไทย') ? <ThaiFlag /> : tourney.country.includes('ฝรั่งเศส') ? <CountryFlag code="FR" /> : tourney.country.includes('สิงคโปร์') ? <CountryFlag code="SG" /> : '🌍'}
                          <span>{coords.city}</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                          {tourney.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          {tourney.titleEn}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl text-[11px] space-y-1 border border-slate-200">
                        <div className="flex items-start gap-1.5 text-slate-700">
                          <i className="fa-solid fa-location-dot text-rose-500 mt-0.5 text-xs"></i>
                          <span className="line-clamp-2">{coords.venueName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                          <i className="fa-regular fa-calendar text-amber-500"></i>
                          <span>{tourney.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                          <i className="fa-solid fa-trophy text-amber-500"></i>
                          <span className="font-semibold text-amber-700">{tourney.prizePool}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectTourney(tourney)}
                        className="w-full py-1.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <i className="fa-solid fa-circle-play text-xs"></i>
                        <span>ดูสัญญาณสด & รายละเอียด</span>
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Map Legend (Bottom-left) */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-xl text-[11px] space-y-1 pointer-events-none select-none hidden sm:block">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">สัญลักษณ์หมุดแข่งขัน:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-rose-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>ถ่ายทอดสด (Live)</span>
              </span>
              <span className="flex items-center gap-1.5 text-sky-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>🇹🇭 ในประเทศ</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>นานาชาติ (Intl)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Tournaments List (4 Columns on desktop) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <i className="fa-solid fa-list-ul text-sky-400"></i>
              <span>เลือกสนามเพื่อซูมพิกัด ({mappedTournaments.length} สนาม)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Click to fly</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1 custom-scrollbar">
            {mappedTournaments.map((tourney) => {
              const coords = TOURNAMENT_COORDS[tourney.id];
              const isSelected = selectedTourneyId === tourney.id;
              const isLive = tourney.status === 'live';

              return (
                <div
                  key={tourney.id}
                  onClick={() => handleFlyToTourney(tourney)}
                  className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/80 shadow-glow-orange ring-1 ring-amber-500/50'
                      : isLive
                      ? 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/40'
                      : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] animate-pulse border border-rose-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>LIVE</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold border border-slate-700">
                          {tourney.category === 'open' ? 'Open' : 'Major'}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        {tourney.country.includes('ไทย') ? <ThaiFlag /> : tourney.country.includes('ฝรั่งเศส') ? <CountryFlag code="FR" /> : tourney.country.includes('สิงคโปร์') ? <CountryFlag code="SG" /> : '🌍'}
                        <span>{coords?.city || tourney.country}</span>
                      </span>
                    </div>

                    <i className={`fa-solid fa-location-crosshairs text-xs ${isSelected ? 'text-amber-400' : 'text-slate-600'}`}></i>
                  </div>

                  <h5 className="font-bold text-xs text-white line-clamp-1 group-hover:text-amber-300">
                    {tourney.title}
                  </h5>

                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                    <i className="fa-solid fa-location-dot text-rose-400 text-[9px]"></i>
                    <span>{coords?.venueName || tourney.location}</span>
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-amber-400/90 font-medium">
                      🏆 {tourney.prizePool}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTourney(tourney);
                      }}
                      className="text-sky-400 hover:text-white hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>รายละเอียด</span>
                      <i className="fa-solid fa-arrow-right text-[8px]"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

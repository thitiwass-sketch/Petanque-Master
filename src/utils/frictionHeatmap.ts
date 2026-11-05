import { TerrainType } from '../App';

export interface FrictionDataPoint {
  distanceMeters: number;
  mu: number; // Coefficient of friction
  normalizedIntensity: number; // 0 to 1 (0 = low, 1 = maximum friction)
  color: string;
  hazardType: 'normal' | 'pebble_hazard' | 'sand_sink' | 'optimal_donnee' | 'high_slip';
  surfaceStatusTh: string;
  tacticalAdviceTh: string;
  projectedRollMeters: number;
}

export interface OptimalDonneeZone {
  minMeters: number;
  maxMeters: number;
  optimalMeters: number;
  minRatioX: number;
  maxRatioX: number;
  optimalRatioX: number;
  zoneTitleTh: string;
  zoneDescriptionTh: string;
  suitabilityScore: number; // 0 - 100%
}

/**
 * Returns thermal heatmap color based on coefficient of friction (mu).
 * Spectrum:
 *   mu <= 0.32: #06b6d4 (Cyan - High roll/glide, low resistance)
 *   0.32 < mu <= 0.48: #10b981 (Emerald - Optimal balance, predictable landing)
 *   0.48 < mu <= 0.65: #f59e0b (Amber - Moderate-high resistance, short roll)
 *   0.65 < mu <= 0.78: #f97316 (Orange - High bite, strong stopping power)
 *   mu > 0.78: #ef4444 (Crimson/Red - Severe resistance, stone deflection / chatter hazard)
 */
export function getThermalColor(mu: number, alpha: number = 1): string {
  if (mu <= 0.32) {
    // Cyan
    return `rgba(6, 182, 212, ${alpha})`;
  } else if (mu <= 0.48) {
    // Emerald
    return `rgba(16, 185, 129, ${alpha})`;
  } else if (mu <= 0.65) {
    // Amber
    return `rgba(245, 158, 11, ${alpha})`;
  } else if (mu <= 0.78) {
    // Hot Orange
    return `rgba(249, 115, 22, ${alpha})`;
  } else {
    // Crimson Hazard
    return `rgba(239, 68, 68, ${alpha})`;
  }
}

/**
 * Calculate the localized friction coefficient mu across a terrain surface.
 * Incorporates realistic surface micro-topography:
 * - Dry Clay: Smooth, uniform, low resistance
 * - Gravel: Erratic stone spikes (chatter hazards) and channels
 * - Sandy Ground: High uniform damping, sand furrow resistance
 * - Grass: Rotational turf blade drag
 */
export function getLocalFrictionMu(terrain: TerrainType, xNorm: number): number {
  // Clamp xNorm between 0 and 1
  const x = Math.max(0, Math.min(1, xNorm));

  switch (terrain) {
    case 'dry_clay': {
      // Base mu = 0.28, gentle compacted earthen undulations
      const wave1 = Math.sin(x * 14) * 0.035;
      const wave2 = Math.cos(x * 28 + 0.5) * 0.02;
      return Math.max(0.22, Math.min(0.36, 0.28 + wave1 + wave2));
    }
    case 'gravel': {
      // Base mu = 0.68, high localized variance due to scattered pebbles & crevices
      const rockSpike1 = Math.sin(x * 34) * 0.16;
      const rockSpike2 = Math.cos(x * 68 + 1.2) * 0.12;
      const ridge = Math.sin(x * 12) * 0.08;
      const localizedSpike = (Math.sin(x * 96) > 0.65) ? 0.14 : 0; // Protruding stones
      return Math.max(0.42, Math.min(0.96, 0.66 + rockSpike1 + rockSpike2 + ridge + localizedSpike));
    }
    case 'sandy_ground': {
      // Base mu = 0.72, heavy sand absorption and energy dissipation
      const sandDrift = Math.sin(x * 8) * 0.06;
      const depression = (x > 0.62 && x < 0.76) ? 0.09 : 0; // Landing furrow depression
      return Math.max(0.62, Math.min(0.88, 0.72 + sandDrift + depression));
    }
    case 'grass': {
      // Base mu = 0.58, dense turf blade drag
      const turfWave = Math.sin(x * 22) * 0.08;
      const grassPatch = Math.cos(x * 45) * 0.05;
      return Math.max(0.46, Math.min(0.74, 0.58 + turfWave + grassPatch));
    }
    default:
      return 0.35;
  }
}

/**
 * Returns optimal Donnée (landing point) zone information for the selected technique
 * and terrain.
 */
export function getOptimalDonneeZone(
  trajMode: string,
  terrain: TerrainType,
  startXRatio: number = 0.08,
  jackXRatio: number = 0.88
): OptimalDonneeZone {
  const pitchLengthMeters = 8.0;

  switch (trajMode) {
    case 'rolling': {
      // Rolling needs early landing with long glide: 2.2m - 3.8m
      const minM = 2.2;
      const maxM = terrain === 'dry_clay' ? 3.8 : 3.2;
      const optM = 2.8;
      return {
        minMeters: minM,
        maxMeters: maxM,
        optimalMeters: optM,
        minRatioX: startXRatio + (minM / pitchLengthMeters) * (jackXRatio - startXRatio),
        maxRatioX: startXRatio + (maxM / pitchLengthMeters) * (jackXRatio - startXRatio),
        optimalRatioX: startXRatio + (optM / pitchLengthMeters) * (jackXRatio - startXRatio),
        zoneTitleTh: 'โซน Donnée แนะนำ: การเข้าเรียบ (Rolling)',
        zoneDescriptionTh: 'ปล่อยลูกตกกระทบพื้นห่างแก่น 4.5-5.5m เพื่อให้โมเมนตัมพาลูกกลิ้งเกาะหน้าดินเข้าหาแก่น',
        suitabilityScore: terrain === 'dry_clay' ? 96 : terrain === 'grass' ? 62 : 45,
      };
    }
    case 'halflob': {
      // Demi-Portée lands around 4.5m - 5.8m
      const minM = 4.2;
      const maxM = 5.6;
      const optM = 4.9;
      return {
        minMeters: minM,
        maxMeters: maxM,
        optimalMeters: optM,
        minRatioX: startXRatio + (minM / pitchLengthMeters) * (jackXRatio - startXRatio),
        maxRatioX: startXRatio + (maxM / pitchLengthMeters) * (jackXRatio - startXRatio),
        optimalRatioX: startXRatio + (optM / pitchLengthMeters) * (jackXRatio - startXRatio),
        zoneTitleTh: 'โซน Donnée แนะนำ: โยนครึ่งโด่ง (Demi-Portée)',
        zoneDescriptionTh: 'ตกข้ามอุปสรรคหน้าแก่น แล้วอาศัยแรงเสียดทานหน่วงลูกให้วิ่งระยะสั้น 1.5 - 2.5m',
        suitabilityScore: terrain === 'gravel' ? 82 : terrain === 'dry_clay' ? 92 : 86,
      };
    }
    case 'highlob': {
      // High Lob Plombée lands right in front of jack: 6.8m - 7.5m
      const minM = 6.6;
      const maxM = 7.5;
      const optM = 7.1;
      return {
        minMeters: minM,
        maxMeters: maxM,
        optimalMeters: optM,
        minRatioX: startXRatio + (minM / pitchLengthMeters) * (jackXRatio - startXRatio),
        maxRatioX: startXRatio + (maxM / pitchLengthMeters) * (jackXRatio - startXRatio),
        optimalRatioX: startXRatio + (optM / pitchLengthMeters) * (jackXRatio - startXRatio),
        zoneTitleTh: 'โซน Donnée แนะนำ: โยนโด่งสูง (High Lob / Plombée)',
        zoneDescriptionTh: 'ตกดิ่งระยะ 50-80 ซม. หน้าแก่น Backspin สูงจะดูดติดพื้นทันที เหมาะแก้อุปสรรคหินกรวด',
        suitabilityScore: terrain === 'gravel' ? 98 : 94,
      };
    }
    case 'carreau':
    case 'screwback': {
      // Direct hit at jack/target: 7.8m - 8.0m
      const minM = 7.7;
      const maxM = 8.1;
      const optM = 7.95;
      return {
        minMeters: minM,
        maxMeters: maxM,
        optimalMeters: optM,
        minRatioX: startXRatio + (minM / pitchLengthMeters) * (jackXRatio - startXRatio),
        maxRatioX: startXRatio + (maxM / pitchLengthMeters) * (jackXRatio - startXRatio),
        optimalRatioX: startXRatio + (optM / pitchLengthMeters) * (jackXRatio - startXRatio),
        zoneTitleTh: trajMode === 'screwback' ? 'โซนเป้าหมาย: ตีสกรูแบ็ค (Fer-à-fer & Retro)' : 'โซนเป้าหมาย: ตีติด (Tir au Carreau)',
        zoneDescriptionTh: 'ปะทะกลางลูกคู่แข่งตรงจุด (Direct Hit) เพื่อถ่ายทอดโมเมนตัม 100%',
        suitabilityScore: 95,
      };
    }
    case 'extreme_backspin': {
      // High arc with rapid backspin bite: lands at 7.2m - 7.6m
      const minM = 7.1;
      const maxM = 7.6;
      const optM = 7.4;
      return {
        minMeters: minM,
        maxMeters: maxM,
        optimalMeters: optM,
        minRatioX: startXRatio + (minM / pitchLengthMeters) * (jackXRatio - startXRatio),
        maxRatioX: startXRatio + (maxM / pitchLengthMeters) * (jackXRatio - startXRatio),
        optimalRatioX: startXRatio + (optM / pitchLengthMeters) * (jackXRatio - startXRatio),
        zoneTitleTh: 'โซน Donnée: สกรูแบ็คขั้นสูง (Extreme Backspin & Quick Bite)',
        zoneDescriptionTh: 'ตกกระทบหน้าดินด้วยแรงหมุน 450+ RPM กัดหน้าดินเบรกนิ่งฉับพลัน (Instant Bite) พร้อมถอยประชิดแก่น',
        suitabilityScore: 99,
      };
    }
    default: {
      return {
        minMeters: 4.0,
        maxMeters: 6.0,
        optimalMeters: 5.0,
        minRatioX: 0.45,
        maxRatioX: 0.70,
        optimalRatioX: 0.58,
        zoneTitleTh: 'โซนจุดตกทั่วไป (Standard Donnée)',
        zoneDescriptionTh: 'จุดตกมาตรฐานสำหรับการประเมินสภาพสนาม',
        suitabilityScore: 80,
      };
    }
  }
}

/**
 * Detailed analysis of point selection at a given pixel coordinate on the canvas.
 */
export function analyzePointSelection(
  canvasX: number,
  canvasWidth: number,
  groundY: number,
  terrain: TerrainType,
  trajMode: string
): FrictionDataPoint {
  const startX = canvasWidth * 0.08;
  const jackX = canvasWidth * 0.88;
  const courtLengthMeters = 8.0;

  // Compute distance in meters from throwing circle
  const normPitch = Math.max(0, Math.min(1.05, (canvasX - startX) / (jackX - startX)));
  const distanceMeters = Math.max(0, parseFloat((normPitch * courtLengthMeters).toFixed(2)));

  const mu = getLocalFrictionMu(terrain, normPitch);
  const color = getThermalColor(mu);

  // Normalized intensity 0 to 1 based on practical range 0.20 - 0.95
  const normalizedIntensity = Math.max(0, Math.min(1, (mu - 0.20) / 0.75));

  // Determine hazard or suitability type
  let hazardType: FrictionDataPoint['hazardType'] = 'normal';
  let surfaceStatusTh = '';
  let tacticalAdviceTh = '';

  if (mu > 0.78 && terrain === 'gravel') {
    hazardType = 'pebble_hazard';
    surfaceStatusTh = `⚠️ จุดเสี่ยงหินนูน (μ = ${mu.toFixed(2)})`;
    tacticalAdviceTh = 'หินก้อนใหญ่เสี่ยงต่อการแฉลบเบี่ยงทิศสูง ควรหลีกเลี่ยงจุดตก Donnée บริเวณนี้';
  } else if (mu > 0.74 && terrain === 'sandy_ground') {
    hazardType = 'sand_sink';
    surfaceStatusTh = `⬇️ หลุมทรายดูดซับแรง (μ = ${mu.toFixed(2)})`;
    tacticalAdviceTh = 'ทรายนุ่มหนาแน่น ลูกจะจมหยุดนิ่งทันที เหมาะสำหรับลูกโยนโด่ง ไม่เหมาะสำหรับการกลิ้ง';
  } else if (mu <= 0.32) {
    hazardType = 'high_slip';
    surfaceStatusTh = `⚡ จุดดินเรียบจัด วิ่งไหลไกล (μ = ${mu.toFixed(2)})`;
    tacticalAdviceTh = 'แรงเสียดทานต่ำพิเศษ ลูกจะวิ่งต่อเนื่องยาวนานกว่าปกติ ควรลดแรงสะบัดลง 10-15%';
  } else if (mu >= 0.35 && mu <= 0.50) {
    hazardType = 'optimal_donnee';
    surfaceStatusTh = `🎯 ผิวสัมผัสอุดมคติ (μ = ${mu.toFixed(2)})`;
    tacticalAdviceTh = 'เกาะจับหน้าดินสม่ำเสมอ คาดการณ์ระยะวิ่งได้อย่างแม่นยำสูง';
  } else {
    surfaceStatusTh = `พื้นผิวระดับมาตรฐาน (μ = ${mu.toFixed(2)})`;
    tacticalAdviceTh = 'แรงต้านปานกลาง ควบคุมการสะบัดข้อมือตามระยะห่างจากแก่น';
  }

  // Calculate projected forward roll distance from this landing spot
  let baseRollMeters = 2.8;
  if (trajMode === 'rolling') baseRollMeters = 4.2;
  else if (trajMode === 'halflob') baseRollMeters = 2.0;
  else if (trajMode === 'highlob') baseRollMeters = 0.5;
  else if (trajMode === 'carreau') baseRollMeters = 0.05;
  else if (trajMode === 'screwback') baseRollMeters = -0.65; // retro roll
  else if (trajMode === 'extreme_backspin') baseRollMeters = -0.22; // quick bite & sharp retro grip

  const projectedRollMeters = parseFloat((baseRollMeters * (0.35 / mu)).toFixed(2));

  return {
    distanceMeters,
    mu: parseFloat(mu.toFixed(3)),
    normalizedIntensity,
    color,
    hazardType,
    surfaceStatusTh,
    tacticalAdviceTh,
    projectedRollMeters,
  };
}

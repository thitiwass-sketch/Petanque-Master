import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TechniqueIllustration } from './components/TechniqueIllustration';
import { MeneAnalysis } from './components/MeneAnalysis';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { useAuth } from './context/AuthContext';
import { BouleBrandMatcher } from './components/BouleBrandMatcher';
import { TacticalBoard } from './components/TacticalBoard';
import { DrillPracticeModal } from './components/DrillPracticeModal';
import { CountryFlag, ThaiFlag } from './components/CountryFlag';
import { TournamentMap } from './components/TournamentMap';
import { DrillProgressChart } from './components/DrillProgressChart';
import { BouleModel } from './data/bouleBrands';
import { drawTopDownTrajectory } from './utils/topDownTrajectory';
import { UserAccount, SavedBouleSpec, SavedDrillResult, AuthProvider } from './types/auth';
import {
  getLocalFrictionMu,
  getThermalColor,
  getOptimalDonneeZone,
  analyzePointSelection,
  FrictionDataPoint,
} from './utils/frictionHeatmap';

// Trajectory Configuration Interface
interface TrajConfig {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  apexRatioX: number;
  apexRatioY: number;
  landRatioX: number;
  finalRatioX: number;
  apexDisplay: string;
  landingDisplay: string;
  spinDisplay: string;
  spinType: 'low' | 'medium' | 'high' | 'max' | 'retro';
  description: string;
  techniqueTip: string;
  recommendedAngle: string;
  bounceCount: number;
}

const TRAJECTORY_PRESETS: Record<string, TrajConfig> = {
  rolling: {
    id: 'rolling',
    name: '1. การเข้าเรียบ (Rolling)',
    title: 'การเข้าเรียบ (Rolling / Low Point)',
    subtitle: 'วิถีโค้งต่ำ กลิ้งต่อเนื่องเข้าสู่เป้าหมาย',
    apexRatioX: 0.25,
    apexRatioY: 0.35,
    landRatioX: 0.45,
    finalRatioX: 0.88,
    apexDisplay: '0.4 m',
    landingDisplay: '2.5 m (จุดตก Donnée)',
    spinDisplay: 'Low Spin (หมุนตามน้ำ)',
    spinType: 'low',
    description: 'ปล่อยลูกให้ลอยต่ำ ตกกระทบพื้นดินห่างจากแก่นประมาณ 2/3 ของระยะทาง แล้วให้ลูกวิ่งกลิ้งเข้าใกล้เป้าหมาย',
    techniqueTip: 'เหมาะสำหรับสนามดินบดแน่น ราบเรียบ ไม่มีเศษหินขรุขระขวางทางกลิ้ง',
    recommendedAngle: '25° - 35°',
    bounceCount: 2
  },
  halflob: {
    id: 'halflob',
    name: '2. โยนครึ่งโด่ง (Demi-Portée)',
    title: 'โยนครึ่งโด่ง (Demi-Portée)',
    subtitle: 'ยกลอยปานกลาง ข้ามอุปสรรคแล้ววิ่งระยะสั้น',
    apexRatioX: 0.38,
    apexRatioY: 0.65,
    landRatioX: 0.70,
    finalRatioX: 0.88,
    apexDisplay: '1.5 m',
    landingDisplay: '4.8 m',
    spinDisplay: 'Medium Backspin (ดึงกลับปานกลาง)',
    spinType: 'medium',
    description: 'โยนลูกลอยสูงระดับปานกลาง ให้ลูกตกประมาณครึ่งทางถึงสองในสาม แล้วให้ลูกกลิ้งต่อระยะสั้นเข้าหาแก่น',
    techniqueTip: 'เทคนิคที่ใช้บ่อยที่สุดในสนามทั่วไปเพื่อข้ามลูกบล็อกของคู่แข่ง',
    recommendedAngle: '45° - 55°',
    bounceCount: 2
  },
  highlob: {
    id: 'highlob',
    name: '3. โยนโด่งสูง (High Lob / Portée)',
    title: 'โยนโด่งสูง (High Lob / Plombée)',
    subtitle: 'ลอยมุมสูงดิ่ง หยุดนิ่งทันทีด้วย Backspin',
    apexRatioX: 0.46,
    apexRatioY: 0.92,
    landRatioX: 0.84,
    finalRatioX: 0.87,
    apexDisplay: '3.2 m',
    landingDisplay: '7.2 m (ใกล้แก่น)',
    spinDisplay: 'High Backspin (หมุนถอยหลังจัด)',
    spinType: 'high',
    description: 'โยนลูกลอยสูงมากกลางอากาศ ให้ลูกตกดิ่งใกล้มุมแก่นพร้อมแรงสะบัดข้อมือถอยหลัง (Backspin) รุนแรง ทำให้ลูกหยุดนิ่งทันทีหลังตกกระทบ',
    techniqueTip: 'สุดยอดท่าแก้ทางสนามหินกรวด หรือสนามขรุขระที่มีหลุมบ่อ',
    recommendedAngle: '65° - 75°',
    bounceCount: 1
  },
  carreau: {
    id: 'carreau',
    name: '4. ตีติด / ตีเปลี่ยน (Carreau)',
    title: 'ตีติด / ตีเปลี่ยน (Tir au Carreau)',
    subtitle: 'กระทบเต็มเป้าหมาย ลูกยิงหยุดแทนนิ่ง ณ ตำแหน่งเดิม',
    apexRatioX: 0.45,
    apexRatioY: 0.52,
    landRatioX: 0.88,
    finalRatioX: 0.88,
    apexDisplay: '1.2 m',
    landingDisplay: '8.0 m (Direct Hit)',
    spinDisplay: 'Maximum Backspin (ซับแรงสมบูรณ์)',
    spinType: 'max',
    description: 'ยิงลูกพุ่งตรงเข้าชนกลางลูกเป้าหมายอย่างเต็มแรง ลูกเป้าหมายกระเด็นพ้นพื้นที่ ส่วนลูกยิงหยุดนิ่งแทนนิ่ง ณ จุดปะทะเดิม',
    techniqueTip: 'ต้องถ่ายทอดโมเมนตัม 100% ให้ลูกเดิมกระเด็นออกพร้อมแรงสะบัด Backspin ดูดติดพื้น',
    recommendedAngle: '35° - 42°',
    bounceCount: 0
  },
  screwback: {
    id: 'screwback',
    name: '5. ตีสกรูแบ็ค (Screw Back / Rétro)',
    title: 'ตีสกรูแบ็คถอยหลัง (Screw Back / Tir Rétro)',
    subtitle: 'ยิงชนเป้าหมายตรง กระแทกลูกคู่แข่งออก แล้วหมุนถอยหลังดูดกลับ',
    apexRatioX: 0.44,
    apexRatioY: 0.46,
    landRatioX: 0.88,
    finalRatioX: 0.73,
    apexDisplay: '1.1 m',
    landingDisplay: '8.0 m (Direct Hit & Retro Bite)',
    spinDisplay: 'Super Backspin 380+ RPM (ดึงถอยหลัง -80cm)',
    spinType: 'retro',
    description: 'ยิงลูกพุ่งชนตรงกลางลูกเป้าหมายอย่างแม่นยำ (Fer-à-fer) พร้อมแรงสะบัดข้อมือและปลายนิ้วแบบ Extreme Backspin พลังงานจลน์ส่งลูกคู่แข่งกระเด็นพ้นพื้นที่ ส่วนลูกยิงกัดหน้าดินและหมุนถอยหลัง 50 ซม. - 1.5 ม. เข้าสู่โซนกินแต้ม',
    techniqueTip: 'ใช้เมื่อลูกคู่แข่งบังหน้าแก่น ตีเคลียร์ออกแล้วดึงลูกของเราถอยกลับมาทำแต้มอย่างปลอดภัย',
    recommendedAngle: '32° - 38°',
    bounceCount: 0
  },
  extreme_backspin: {
    id: 'extreme_backspin',
    name: '6. สกรูแบ็คขั้นสูง (Extreme Backspin)',
    title: 'โยนสกรูแบ็คขั้นสูง (Extreme Backspin / Plombée Rétro)',
    subtitle: 'ยกลอยโค้งดิ่ง สะบัดปลายนิ้ว 450+ RPM กัดหน้าดินเบรกนิ่งฉับพลัน (Quick Bite)',
    apexRatioX: 0.44,
    apexRatioY: 0.88,
    landRatioX: 0.82,
    finalRatioX: 0.79,
    apexDisplay: '2.8 m (High Arc)',
    landingDisplay: '7.5 m (Donnée Spot)',
    spinDisplay: 'Extreme Backspin 450+ RPM (Quick Bite & Grip)',
    spinType: 'retro',
    description: 'สุดยอดเทคนิคระดับแชมป์โลก โยนลูกโด่งมุมสูงชันพร้อมการสะบัดข้อมือและปลายนิ้วรวดเร็วสุดขีด 450+ RPM เมื่อลูกตกกระทบพื้นสนาม (Donnée) แรงหมุนย้อนกลับมหาศาลจะทำให้ลูก "กัดดิน" ทันที (Instant Bite) หยุดกึกโดยไม่กระดอนหนี พร้อมถอยหลังสั้นๆ ดึงเข้าประชิดแก่นอย่างเฉียบคม',
    techniqueTip: 'ต้องอาศัยการปล่อยลูกด้วยข้อนิ้วทั้ง 4 กวาดขึ้นทางเดียว (Flick snap) และสนามที่มีความฝืดระดับปานกลางขึ้นไปเพื่อการกัดหน้าดินที่สมบูรณ์แบบ',
    recommendedAngle: '60° - 70°',
    bounceCount: 0
  }
};

export type TerrainType = 'dry_clay' | 'gravel' | 'sandy_ground' | 'grass';

export interface TerrainPreset {
  id: TerrainType;
  label: string;
  nameTh: string;
  description: string;
  friction: number;
  frictionLabel: string;
  bounceElasticity: number;
  bounceLabel: string;
  rollMultiplier: number;
  groundColorTop: string;
  groundColorBottom: string;
  boundaryColor: string;
  particleType: 'dust' | 'pebbles' | 'sand' | 'grass';
  tacticalNote: string;
}

export const TERRAIN_PRESETS: Record<TerrainType, TerrainPreset> = {
  dry_clay: {
    id: 'dry_clay',
    label: 'Dry Clay',
    nameTh: 'สนามดินอัดแน่น (Dry Clay)',
    description: 'พื้นผิวดินแข็งบดแน่น เรียบเนียน แรงเสียดทานต่ำ ลูกวิ่งไหลไกล มีการกระดอนสม่ำเสมอ',
    friction: 0.28,
    frictionLabel: 'ต่ำ (Low) μ = 0.28',
    bounceElasticity: 0.55,
    bounceLabel: 'ปานกลางสม่ำเสมอ (Standard Bounce)',
    rollMultiplier: 1.35,
    groundColorTop: '#7c2d12',
    groundColorBottom: '#270c04',
    boundaryColor: '#f97316',
    particleType: 'dust',
    tacticalNote: 'พื้นผิวเรียบแน่น แรงเสียดทานต่ำ ลูกวิ่งไหลไกล (+35%) ควรเผื่อจุดตกห่างจากแก่น'
  },
  gravel: {
    id: 'gravel',
    label: 'Gravel',
    nameTh: 'สนามหินกรวดร่วน (Gravel)',
    description: 'พื้นผิวหินกรวดคละขนาด แรงกระดอนคาดเดายาก ลูกอาจแฉลบหรือกระดอนซ้ำบนก้อนหิน',
    friction: 0.65,
    frictionLabel: 'ปานกลาง-สูง (Medium-High) μ = 0.65',
    bounceElasticity: 0.78,
    bounceLabel: 'กระดอนแฉลบหิน (Erratic Chatter Bounce)',
    rollMultiplier: 0.82,
    groundColorTop: '#334155',
    groundColorBottom: '#090d16',
    boundaryColor: '#94a3b8',
    particleType: 'pebbles',
    tacticalNote: 'พื้นผิวเต็มไปด้วยเศษหิน ลูกกระดอนแฉลบหลายระลอกและชะลอตัว แนะนำโยนโด่งข้ามหิน'
  },
  sandy_ground: {
    id: 'sandy_ground',
    label: 'Sandy Ground',
    nameTh: 'สนามทรายดูดซับแรง (Sandy Ground)',
    description: 'พื้นทรายนุ่มดูดซับแรงตกกระแทก ลูกแทบไม่กระดอนและฝังตัวหยุดนิ่งอย่างรวดเร็ว',
    friction: 0.92,
    frictionLabel: 'สูงมาก (Very High) μ = 0.92',
    bounceElasticity: 0.12,
    bounceLabel: 'ซับแรงกระแทกทันที (Impact Absorbed)',
    rollMultiplier: 0.35,
    groundColorTop: '#b45309',
    groundColorBottom: '#451a03',
    boundaryColor: '#fbbf24',
    particleType: 'sand',
    tacticalNote: 'พื้นทรายนุ่มดูดซับแรงกระแทก ลูกแทบไม่กระดอนและหยุดนิ่งแทบจะทันทีหลังตกกระทบ'
  },
  grass: {
    id: 'grass',
    label: 'Grass / Lawn',
    nameTh: 'สนามหญ้าธรรมชาติ (Grass / Lawn)',
    description: 'พื้นหญ้าธรรมชาติ ใบหญ้าและดินนุ่มสร้างแรงต้านการหมุนสูง ดูดซับแรงกระแทก ลูกวิ่งไหลสั้นลง',
    friction: 0.80,
    frictionLabel: 'สูง (High Friction) μ = 0.80',
    bounceElasticity: 0.28,
    bounceLabel: 'กระดอนเตี้ย นุ่มหน่วง (Soft Damped Bounce)',
    rollMultiplier: 0.50,
    groundColorTop: '#166534',
    groundColorBottom: '#052e16',
    boundaryColor: '#22c55e',
    particleType: 'grass',
    tacticalNote: 'ใบหญ้าต้านการกลิ้ง ลูกหยุดสั้นกว่าปกติ (-50%) แนะนำส่งลูกวิถีโด่ง (Portée) หรือส่งแรงเพิ่มขึ้น'
  }
};

export interface WindInfo {
  label: string;
  icon: string;
  type: 'calm' | 'tailwind' | 'headwind' | 'crosswind';
  horizVelocity: number;
  tailwindPercent: number;
  description: string;
}

export const getWindDirectionInfo = (direction: number, speed: number): WindInfo => {
  const normDir = ((direction % 360) + 360) % 360;
  const cosVal = Math.cos((normDir * Math.PI) / 180);
  const horizVelocity = speed * cosVal;
  const tailwindPercent = Math.round(cosVal * 100);

  if (speed === 0) {
    return {
      label: 'ลมสงบ (Calm)',
      icon: '🍃',
      type: 'calm',
      horizVelocity: 0,
      tailwindPercent: 0,
      description: 'ไม่มีผลกระทบจากลม วิถีลูกเคลื่อนที่เป็นไปตามโมเมนตัมและแรงโน้มถ่วงปกติ'
    };
  }

  let label = 'ตามลมตรง (Tailwind)';
  let icon = '➡️';
  let type: 'calm' | 'tailwind' | 'headwind' | 'crosswind' = 'tailwind';

  if (normDir >= 337.5 || normDir < 22.5) {
    label = 'ตามลมตรง (Tailwind 0°)';
    icon = '➡️';
    type = 'tailwind';
  } else if (normDir >= 22.5 && normDir < 67.5) {
    label = 'ตามลมเฉียงขวา (Quarter Tailwind 45°)';
    icon = '↗️';
    type = 'tailwind';
  } else if (normDir >= 67.5 && normDir < 112.5) {
    label = 'ลมพัดขวางขวา (Crosswind 90°)';
    icon = '⬆️';
    type = 'crosswind';
  } else if (normDir >= 112.5 && normDir < 157.5) {
    label = 'ต้านลมเฉียง (Quarter Headwind 135°)';
    icon = '↖️';
    type = 'headwind';
  } else if (normDir >= 157.5 && normDir < 202.5) {
    label = 'ต้านลมตรง (Headwind 180°)';
    icon = '⬅️';
    type = 'headwind';
  } else if (normDir >= 202.5 && normDir < 247.5) {
    label = 'ต้านลมเฉียงซ้าย (Quarter Headwind 225°)';
    icon = '↙️';
    type = 'headwind';
  } else if (normDir >= 247.5 && normDir < 292.5) {
    label = 'ลมพัดขวางซ้าย (Crosswind 270°)';
    icon = '⬇️';
    type = 'crosswind';
  } else {
    label = 'ตามลมเฉียงซ้าย (Quarter Tailwind 315°)';
    icon = '↘️';
    type = 'tailwind';
  }

  const description =
    cosVal > 0.25
      ? `ลมส่งท้ายหนุนแรงส่ง (+${(horizVelocity).toFixed(1)} km/h) ลูกลอยไกลขึ้นและตกเกินจุดเป้าหมายเดิม`
      : cosVal < -0.25
      ? `ลมปะทะต้านหน้ารถหน่วงแรงส่ง (${(horizVelocity).toFixed(1)} km/h) ฉุดให้ลูกตกสั้นลงและลดระยะกลิ้ง`
      : `ลมพัดขวางลำตัว แรงผลักแนวราบแทบเป็นศูนย์ (${(horizVelocity).toFixed(1)} km/h) แต่อาจเกิดแรงเหวี่ยงออกด้านข้าง`;

  return {
    label,
    icon,
    type,
    horizVelocity,
    tailwindPercent,
    description
  };
};

export interface RulebookSpecItem {
  item: string;
  spec: string;
  fipjpStandard: string;
  tolerance: string;
  refNotes: string;
}

export interface RulebookArticleItem {
  article: string;
  title: string;
  clause: string;
  keyRule: string;
  penaltyAction: string;
}

export interface RulebookPenaltyCard {
  card: string;
  nameTh: string;
  badgeBg: string;
  borderBg: string;
  textColor: string;
  level: string;
  trigger: string;
  consequence: string;
}

export interface RulebookFoulItem {
  foulName: string;
  articleRef: string;
  description: string;
  procedure: string;
}

export interface RulebookComparisonItem {
  topic: string;
  casualRule: string;
  proFipjpRule: string;
  articleRef: string;
}

export interface RulebookModuleData {
  titleEn: string;
  officialRef: string;
  equipmentSpecs: RulebookSpecItem[];
  articles: RulebookArticleItem[];
  penalties: RulebookPenaltyCard[];
  commonFouls: RulebookFoulItem[];
  comparisonTable: RulebookComparisonItem[];
}

export interface FormatStepDetail {
  stepName: string;
  description: string;
  outcome: string;
}

export interface FormatExampleMatch {
  round: string;
  matches: string;
  note: string;
}

export interface FormatSystemDetail {
  id: string;
  name: string;
  nameEn: string;
  badgeColor: string;
  definition: string;
  pros: string[];
  cons: string[];
  matchFormula?: string;
  matchCalculationExample?: string;
  pairingPrinciple?: string;
  flowSteps?: FormatStepDetail[];
  exampleTable?: FormatExampleMatch[];
}

export interface FormatComparisonItem {
  formatName: string;
  suitableTeams: string;
  timeRequired: string;
  accuracy: string;
  limitations: string;
  badgeClass: string;
}

export interface FormatCaseStudy {
  context: string;
  badge: string;
  scenario: string;
  recommendedFormat: string;
  rationale: string;
  practicalTips: string[];
}

export interface FormatGlossaryItem {
  term: string;
  thaiMeaning: string;
  contextUsage: string;
}

export interface TournamentFormatsModuleData {
  titleEn: string;
  learningObjectives: string[];
  formats: FormatSystemDetail[];
  comparisonTable: FormatComparisonItem[];
  caseStudies: FormatCaseStudy[];
  glossary: FormatGlossaryItem[];
}

interface TechniqueItem {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  levelLabel: string;
  category: 'pointing' | 'shooting' | 'foundation' | 'rules';
  categoryLabel: string;
  title: string;
  summary: string;
  details: {
    overview: string;
    steps: string[];
    commonMistakes: string[];
    proTips: string[];
    rulebookModule?: RulebookModuleData;
    tournamentFormatsModule?: TournamentFormatsModuleData;
  };
}

const TECHNIQUES_DATA: TechniqueItem[] = [
  {
    id: 'grip',
    level: 'beginner',
    levelLabel: 'Beginner',
    category: 'foundation',
    categoryLabel: 'พื้นฐานสำคัญ',
    title: '1. การจับลูกเปตอง (Grip Mechanics)',
    summary: 'จับด้วย 4 นิ้วชิดติดกัน ให้ลูกรองรับตรงข้อพับนิ้วแรก นิ้วหัวแม่มือประคองข้าง ห้ามใช้ฝ่ามือกดลูกแน่นเกินไป',
    details: {
      overview: 'การจับลูกเปตองที่ถูกต้องคือรากฐานของการควบคุมทิศทางและแรงหมุน (Spin) ทั้งหมด ผู้เล่นระดับอาชีพจะไม่ใช้ฝ่ามือบีบลูกแน่น แต่จะวางลูกบนข้อต่อข้อนิ้วทั้งสี่ เพื่อให้ลูกหลุดออกจากปลายนิ้วอย่างลื่นไหลและสร้าง Backspin ตามธรรมชาติ',
      steps: [
        'วางลูกเปตองลงบนรอยพับข้อนิ้วแรกของทั้ง 4 นิ้ว (นิ้วชี้ นิ้วกลาง นิ้วนาง นิ้วก้อย แนบชิดกัน)',
        'นิ้วหัวแม่มือกางออกเล็กน้อยเพื่อประคองด้านข้างอย่างแผ่วเบา โดยไม่ลงน้ำหนักกด',
        'ปล่อยให้มีช่องว่างอากาศเล็กน้อยระหว่างผิวลูกเปตองกับใจกลางฝ่ามือ',
        'ข้อมือต้องปล่อยสบาย ไม่เกร็ง เพื่อให้พร้อมสะบัดขึ้นในจังหวะปล่อยลูก (Release)'
      ],
      commonMistakes: [
        'กำลูกแน่นด้วยอุ้งมือจนเต็มฝ่ามือ ทำให้ลูกสะดุดขณะปล่อยและคุมทิศทางไม่ได้',
        'กางนิ้วมือออกจากกัน ทำให้แรงดันไม่สม่ำเสมอ ลูกเอียงซ้ายหรือขวา',
        'งอข้อมือแข็งเกร็งตอนสวิงแขน'
      ],
      proTips: [
        'ลองจับลูกแล้วคว่ำมือลง ถ้าลูกไม่หล่นและนิ้วมือไม่เกร็ง แสดงว่าสรีระน้ำหนักเหมาะสม',
        'ฝึกหมุนลูกในอุ้งมือด้วยปลายนิ้วก่อนลงแข่งเพื่อกระตุ้นความรู้สึกสัมผัสผิวโลหะ'
      ]
    }
  },
  {
    id: 'stance',
    level: 'beginner',
    levelLabel: 'Beginner',
    category: 'foundation',
    categoryLabel: 'พื้นฐานสำคัญ',
    title: '2. การยืนและการทรงตัวในวงกลม (Stance)',
    summary: 'เท้าทั้งสองวางราบในวงกลม 35-50 ซม. ย่อเข่าเล็กน้อยสร้างศูนย์ถ่วง ลำตัวนิ่ง สายตาจับจ้องจุดตก',
    details: {
      overview: 'ตามกติกา FIPJP เท้าทั้งสองข้างต้องวางสัมผัสพื้นภายในวงกลมขนาด 35 - 50 ซม. โดยไม่เหยียบเส้นขอบ และห้ามยกส้นเท้าหรือก้าวออกจนกว่าลูกจะตกถึงพื้น',
      steps: [
        'ยืนให้เท้าข้างที่ถนัดอยู่เยื้องไปข้างหน้าเล็กน้อย หรือวางเท้าขนานกันตามความถนัด',
        'ทิ้งน้ำหนักลงที่ฝ่าเท้าทั้งสองข้างอย่างสมดุล ย่อเข่าลง 10-15 องศาเพื่อสร้างฐานที่มั่นคง',
        'แขนซ้ายปล่อยผ่อนคลายเพื่อช่วยปรับสมดุลของลำตัว',
        'จัดระเบียบไหล่ให้ชี้ตรงไปยังเป้าหมาย ไม่เอียงลำตัวขณะดึงแขนไปด้านหลัง'
      ],
      commonMistakes: [
        'ยกส้นเท้าข้างหลังลอยขณะเหวี่ยงแขน (อาจถูกปรับฟาวล์ตามกฎ FIPJP)',
        'โยกศีรษะหรือลำตัวไปข้างหน้าตอนปล่อยลูก ทำให้จุดตกคลาดเคลื่อน',
        'ยืนตัวตรงขาตึงเกินไป ทำให้ขาดความยืดหยุ่นในการดูดซับแรงเหวี่ยง'
      ],
      proTips: [
        'หากต้องการเข้าลูกมุมต่ำ สามารถใช้ท่าย่อเข่านั่งยอง (Squat Stance) เพื่อให้สายตาใกล้ระดับพื้นดินมากขึ้น',
        'สูดหายใจเข้าลึกๆ ขณะดึงแขนไปข้างหลัง และผ่อนลมหายใจออกช้าๆ ขณะปล่อยลูก'
      ]
    }
  },
  {
    id: 'rolling',
    level: 'intermediate',
    levelLabel: 'Intermediate',
    category: 'pointing',
    categoryLabel: 'การเข้าลูก (Point)',
    title: '3. การเข้าเรียบ (Rolling / Low Point)',
    summary: 'ปล่อยลูกให้ตกใกล้ตัวประมาณ 1/3 ของระยะทาง ให้ลูกหมุนกลิ้งเข้าหาแก่น เหมาะสำหรับสนามดินเรียบกดแน่น',
    details: {
      overview: 'การเข้าลูกแบบ Rolling คือการส่งลูกเรี่ยพื้นดิน ปล่อยให้แรงเฉื่อยพาลูกกลิ้งเข้าสู่บริเวณใกล้ลูกแก่น เป็นท่าเข้าลูกที่ควบคุมแรงได้ง่ายที่สุดเมื่อสนามมีพื้นผิวเรียบเนียน',
      steps: [
        'ย่อตัวหรือนั่งยองลงเพื่อให้อยู่ในแนวราบกับพื้นสนาม',
        'เล็งจุดตก (Donnée) ที่ระยะประมาณ 1/3 ถึง 1/2 จากวงกลมถึงลูกแก่น',
        'สวิงแขนเป็นวงสวิงต่ำ ปล่อยลูกใกล้ระดับหัวเข่า',
        'ปล่อยให้ลูกสัมผัสพื้นอย่างนุ่มนวลและกลิ้งไปตามแนวลาดเอียงของสนาม'
      ],
      commonMistakes: [
        'ใช้ท่านี้บนสนามหินกรวดหนาหรือพื้นขรุขระ ลูกจะแฉลบเปลี่ยนทิศทางทันที',
        'ทิ้งจุดตกใกล้แก่นเกินไป ทำให้ลูกวิ่งเลยเส้นหลังสนาม'
      ],
      proTips: [
        'อ่านความลาดชัน (Slope) ของสนามก่อนปล่อยลูกทุกลูกเสมอ',
        'ลูกเปตองที่มีลายเส้น (Striated) จะช่วยเพิ่มแรงเสียดทานและหยุดลูกได้ดีขึ้นในท่านี้'
      ]
    }
  },
  {
    id: 'demi-portee',
    level: 'intermediate',
    levelLabel: 'Intermediate',
    category: 'pointing',
    categoryLabel: 'การเข้าลูก (Point)',
    title: '4. โยนครึ่งโด่ง (Demi-Portée)',
    summary: 'โยนลูกลอยระดับกลาง ข้ามหลุมหรือลูกขวางหน้า ตกที่ 2/3 ของระยะทางแล้ววิ่งเกาะแก่น',
    details: {
      overview: 'ท่าลูกครึ่งโด่ง (Demi-Portée) เป็นเทคนิคการเข้าลูกที่นิยมใช้ในการแข่งขันจริงมากที่สุด เพราะสามารถข้ามแนวลูกการ์ดของคู่แข่ง หรือข้ามพื้นผิวที่ไม่สม่ำเสมอในช่วงครึ่งแรกของสนามได้',
      steps: [
        'ยืนย่อเข่าพอประมาณ เหวี่ยงแขนสูงระดับอก',
        'ปล่อยลูกที่มุมเงยประมาณ 45-55 องศา',
        'ข้อมือสะบัดกระดกขึ้นเล็กน้อยเพื่อสร้าง Backspin ช่วยเบรกเมื่อตกกระทบพื้น',
        'กำหนดจุดตก (Donnée) ห่างจากแก่นประมาณ 1 ถึง 1.5 เมตร'
      ],
      commonMistakes: [
        'ไม่ให้แรงหมุนถอยหลัง ทำให้เมื่อตกพื้นแล้วลูกพุ่งเลยไปไกล',
        'เล็งที่ตัวแก่นโดยตรง แทนที่จะเล็งจุดตกบนพื้น'
      ],
      proTips: [
        'ฝึกเลือกจุดตกที่เป็นดินเรียบระหว่างก้อนหิน เพื่อลดการกระเด้งผิดทิศทาง'
      ]
    }
  },
  {
    id: 'high-lob',
    level: 'advanced',
    levelLabel: 'Advanced',
    category: 'pointing',
    categoryLabel: 'การเข้าลูก (Point)',
    title: '5. การโยนโด่งข้ามอุปสรรค (High Lob / Plombée)',
    summary: 'โยนลูกโด่งสูงมากกลางอากาศ ให้ลูกตกแนวดิ่งใกล้มุมแก่นแล้วหยุดทันที อาศัยการสะบัด Backspin รุนแรง',
    details: {
      overview: 'Plombée หรือ High Lob คือศาสตร์สูงสุดของการเข้าลูกเปตอง ลูกจะถูกส่งขึ้นสู่อากาศที่ระดับความสูง 3-5 เมตร และตกในแนวดิ่งเกือบ 90 องศา พร้อมแรง Backspin มหาศาล ทำให้ลูกฝังดินและหยุดนิ่งแทบจะทันที',
      steps: [
        'ยืนเต็มความสูง ย่อเข่าเล็กน้อยเพื่อสปริงตัว',
        'เหวี่ยงแขนจากด้านหลังสุดแนว และยกขึ้นสูงเหนือศีรษะขณะปล่อยลูก',
        'สะบัดข้อมือกระดกกลับหลังอย่างเฉียบคม (Maximum Backspin Snap)',
        'ปล่อยลูกที่จุดสูงสุดของวงสวิง (มุมปล่อย 65-75 องศา)'
      ],
      commonMistakes: [
        'เกร็งหัวไหล่ทำให้ลูกลอยเบี้ยวไม่ตรงแนว',
        'สะบัดข้อมือช้าเกินไป ทำให้ลูกไม่มีแรงหมุนถอยหลังพอลูกตกพื้นจะกระดอนไปข้างหน้า'
      ],
      proTips: [
        'ใช้ลูกเปตองที่มีความนิ่ม (Very Soft 110 kg/mm²) จะช่วยดูดซับแรงตกกระแทกไม่ให้กระดอน'
      ]
    }
  },
  {
    id: 'carreau',
    level: 'advanced',
    levelLabel: 'Advanced',
    category: 'shooting',
    categoryLabel: 'การยิงลูก (Shoot)',
    title: '6. ตีติด / ตีเปลี่ยน (Tir au Carreau)',
    summary: 'ยิงลูกพุ่งชนกลางลูกเป้าหมาย ลูกเดิมกระเด็นออก ส่วนลูกยิงของเราหยุดแทนนิ่ง ณ ตำแหน่งเดิมสมบูรณ์แบบ',
    details: {
      overview: 'Carreau คือช็อตในฝันของนักเปตองทุกคน เป็นการยิงที่สมบูรณ์แบบที่สุดในเชิงฟิสิกส์ เมื่อลูกเหล็กของเราถ่ายทอดพลังงานจลน์ 100% ไปยังลูกของคู่แข่ง ทำให้ลูกคู่แข่งกระเด็นหายไป ส่วนลูกของเราหยุดนิ่งแทนที่เดิม หรือขยับไม่เกิน 5 ซม.',
      steps: [
        'จ้องมองที่จุดกึ่งกลางของลูกเป้าหมาย ไม่มองพื้น',
        'สวิงแขนเป็นแนวตรงเหมือนลูกตุ้มนาฬิกา',
        'ปล่อยลูกที่มุมราบระดับสายตา พุ่งเป็นเส้นโค้งต่ำตรงดิ่ง',
        'สะบัดปลายนิ้วสร้าง Backspin ย้อนหลัง เมื่อกระทบลูกคู่แข่ง ลูกของเราจะดูดลงพื้นทันที'
      ],
      commonMistakes: [
        'เหวี่ยงแขนเฉียงเข้าข้างลำตัว ทำให้วิถีลูกเลี้ยว',
        'กลั้นหายใจหรือกระตุกข้อมือในเสี้ยววินาทีที่ปล่อย'
      ],
      proTips: [
        'ลูกคาร์บอนสตีลเนื้อนิ่ม (Very Soft) ผิวเรียบ ไร้ร่อง striae เป็นตัวเลือกอันดับหนึ่งของมือยิงระดับแชมป์โลกสำหรับการทำ Carreau'
      ]
    }
  },
  {
    id: 'direct-hit',
    level: 'intermediate',
    levelLabel: 'Intermediate',
    category: 'shooting',
    categoryLabel: 'การยิงลูก (Shoot)',
    title: '7. การตีโดนตรงกลางอากาศ (Tir au Fer)',
    summary: 'การยิงลูกกระทบเป้าหมายในอากาศโดยไม่ตกกระทบพื้นก่อน (Iron-on-Iron) เพื่อเคลียร์ลูกคู่แข่งอย่างเด็ดขาด',
    details: {
      overview: 'Tir au Fer (ยิงโดนเหล็กตรงๆ) คือการยิงที่ตัดตัวแปรความขรุขระของพื้นสนามออกไปทั้งหมด ลูกจะลอยผ่านอากาศและกระแทกเข้าผิวโลหะของลูกเป้าหมายโดยตรง',
      steps: [
        'จัดระเบียบแนวสายตา ปลายแขน และเป้าหมายให้อยู่ในระนาบดิ่งเดียวกัน',
        'สวิงแขนส่งกำลังจากแผ่นหลังและหัวไหล่อย่างลื่นไหล',
        'รักษาข้อมือให้นิ่ง ปล่อยลูกตรงสู่ศูนย์กลางของเป้าหมาย'
      ],
      commonMistakes: [
        'ปล่อยลูกตกพื้นหน้าเป้าหมาย ทำให้ลูกกระดอนข้ามหัวลูกเป้าหมายไป',
        'เร่งจังหวะเหวี่ยงแขนเร็วเกินไปจนเสียสมดุล'
      ],
      proTips: [
        'ฝึกซ้อมยิงลูกที่ระยะ 6, 7, 8, 9 และ 10 เมตรสลับกันเพื่อสร้างความจำของกล้ามเนื้อ (Muscle Memory)'
      ]
    }
  },
  {
    id: 'screw-back',
    level: 'advanced',
    levelLabel: 'Master / Advanced',
    category: 'shooting',
    categoryLabel: 'การยิงลูก (Shoot)',
    title: '8. ตีสกรูแบ็คถอยหลัง (Tir Rétro / Screw Back)',
    summary: 'ยิงลูกชนกลางเป้าหมายตรง (Fer-à-fer) ด้วย Super Backspin ลูกคู่แข่งกระเด็นพ้น ส่วนลูกเรากัดหน้าดินแล้วหมุนถอยหลัง 50 ซม. - 1.5 ม. สวยงาม',
    details: {
      overview: 'Tir Rétro (การตีสกรูแบ็ค) คือสุดยอดทักษะการยิงชั้นสูงของวงการเปตองสากล เมื่อลูกเป้าหมายอยู่ชิดแก่นหรืออยู่ด้านหน้า หากยิง Carreau ลูกของเราอาจพุ่งกระแทกแก่นหลุดออกนอกสนาม แต่ถ้าใช้เทคนิคสกรูแบ็ค ลูกยิงจะส่งโมเมนตัม 100% กระแทกลูกคู่แข่งกระเด็นออกไปข้างหน้า และด้วยแรงหมุนถอยหลังมหาศาล (380+ RPM) ลูกของเราจะกัดหน้าดินแล้วหมุนถอยหลังกลับมา 50 ซม. ถึง 1.5 เมตร เข้าสู่โซนกินแต้มอย่างสมบูรณ์แบบ',
      steps: [
        'จับลูกโดยวางรอยพับข้อนิ้วแรกของ 4 นิ้วให้กระชับ ปล่อยนิ้วหัวแม่มืออิสระ ไม่ออกแรงกดบีบ',
        'จัดระนาบวิถีพุ่งมุมราบค่อนข้างต่ำ (มุมเงย 32° - 38°) พุ่งเป็นแนวตรงระนาบเดียวกับจุดกึ่งกลางลูกเป้าหมาย',
        'ในเสี้ยววินาทีปล่อยลูก (Release Snap) ให้กระดกข้อมือขึ้นและสะบัดรูดปลายนิ้วทั้งสี่อย่างรวดเร็วเฉียบคมเพื่อสร้าง Extreme Backspin',
        'ลูกจะพุ่งกระแทกผิวโลหะตรงกลางลูกคู่แข่ง (Fer-à-fer) โมเมนตัมแนวราบถูกถ่ายโอนไปยังลูกเป้าหมายจนหมดสิ้น เหลือเพียงแรงหมุนถอยหลังที่ดูดลูกให้กลิ้งกลับหลังตามแนวสนาม'
      ],
      commonMistakes: [
        'ปล่อยลูกวิถีโด่งเกินไป (High Arc) ทำให้ลูกกระดอนถอยหลังขึ้นฟ้าแทนที่จะกัดกลิ้งเลียดพื้น',
        'บีบอุ้งมือแน่นเกินไปตอนปล่อย ทำให้เกิด Side-spin ลูกเลี้ยวออกข้างแทนที่จะถอยตรง',
        'ใช้บนพื้นทรายร่วนหนา ซึ่งจะดูดซับแรงหมุนทั้งหมดจนลูกหยุดนิ่งไม่ถอย'
      ],
      proTips: [
        'ควรเลือกลูกเปตองประเภทเนื้อนิ่มมาก (Very Soft 110 kg/mm²) ผิวมีลายเส้น (Striated) เพื่อให้ร่องเส้นช่วยยึดเกาะหน้าดินสร้างแรงดูดถอยหลังสูงสุด',
        'ใช้ในสถานการณ์ที่ลูกคู่แข่งตั้งบังแก่นอยู่ในระยะ 10-20 ซม. เพื่อหลีกเลี่ยงการโดนแก่น'
      ]
    }
  },
  {
    id: 'backspin-mastery',
    level: 'advanced',
    levelLabel: 'Advanced',
    category: 'foundation',
    categoryLabel: 'เทคนิคขั้นสูง',
    title: '9. การคุมแรงสะบัดข้อมือ (Backspin Control)',
    summary: 'หัวใจของการหยุดลูกและเบรกระยะตก กระดกปลายนิ้วและข้อมือย้อนทางเพื่อควบคุมการเคลื่อนที่',
    details: {
      overview: 'แรงหมุนถอยหลัง (Backspin) จะทำให้ลูกเปตองเมื่อตกกระทบพื้นแล้วไม่วิ่งเตลิด แต่จะชะลอความเร็วลงอย่างฉับพลัน หรือหมุนถอยหลังกลับมาหาทิศทางที่ขว้างมา',
      steps: [
        'ขณะกำลูก ให้นิ้วทั้งสี่อยู่ด้านล่างของลูก',
        'เมื่อแขนเหวี่ยงขึ้นถึงจุดปล่อย ให้กระดกข้อมือขึ้นหาตัวอย่างรวดเร็ว',
        'ลูกเปตองจะกลิ้งผ่านปลายนิ้วทั้งสี่ เกิดแรงเสียดทานทำให้ลูกหมุนวนกลับหลังกลางอากาศ'
      ],
      commonMistakes: [
        'ใช้ข้อศอกกระตุกแทนการใช้ข้อมือ ทำให้วิถีลูกแกว่ง',
        'สะบัดข้อมือไปด้านข้าง ทำให้ลูกเกิดไซด์สปิน (Side-spin) เลี้ยวหนีเป้าหมาย'
      ],
      proTips: [
        'สังเกตลายของลูกเปตองกลางอากาศ หากเห็นลายหมุนวนย้อนกลับมาชัดเจน แสดงว่าการสะบัดสมบูรณ์แบบ'
      ]
    }
  },
  {
    id: 'measuring-rules',
    level: 'beginner',
    levelLabel: 'Beginner',
    category: 'rules',
    categoryLabel: 'กติกามาตรฐาน',
    title: '10. การวัดแต้มและกติกา FIPJP มาตรฐานสากล',
    summary: 'เครื่องมือและวิธีวัดระยะแต้มลูกใกล้แก่นที่สุด กฎการโยนแก่นใหม่ และการตัดสินกรณีแต้มเสมอ',
    details: {
      overview: 'การแข่งขันเปตองระดับทางการ การตัดสินแพ้ชนะในแต่ละเที่ยว (Mène) ขึ้นอยู่กับระยะห่างที่แม่นยำระดับมิลลิเมตร มีระเบียบปฏิบัติมาตรฐานที่ผู้เล่นทุกคนต้องทราบ',
      steps: [
        'ใช้สายวัดตลับเมตร หรือเวอร์เนียร์คัลลิเปอร์ (Tirette) สำหรับระยะประชิด',
        'ห้ามขยับลูกหรือแก่นก่อนการวัดเสร็จสิ้น หากขยับโดยไม่เจตนาฝ่ายตรงข้ามมีสิทธิ์วางคืนตำแหน่งเดิม',
        'วัดจากจุดกึ่งกลางผิวลูกที่ใกล้ที่สุด ถึงจุดกึ่งกลางของลูกแก่น',
        'หากลูกแก่นหลุดออกนอกสนาม (Nulle) การเล่นในเที่ยวนั้นจะถือเป็นโมฆะหากทั้งสองทีมยังมีลูกเหลืออยู่'
      ],
      commonMistakes: [
        'ใช้เท้าหรือมือสัมผัสลูกระหว่างการก้มลงมองวัดระยะ',
        'รีบหยิบลูกของตัวเองขึ้นมาก่อนที่คู่แข่งจะยอมรับผลการวัดแต้ม'
      ],
      proTips: [
        'พกอุปกรณ์วัดแต้มมาตรฐาน FIPJP ติดตัวเสมอในการแข่งขันทางการ เพื่อหลีกเลี่ยงข้อพิพาท'
      ]
    }
  },
  {
    id: 'fipjp-official-rules',
    level: 'advanced',
    levelLabel: 'Official FIPJP',
    category: 'rules',
    categoryLabel: 'กฎกติกาการแข่งขันสากล',
    title: '11. กฎกติกาการแข่งขันระดับอาชีพ FIPJP (Official Competition Rules & Regulations)',
    summary: 'คู่มือระเบียบการแข่งขันและบทลงโทษมาตรฐานสากล: ข้อกำหนดอุปกรณ์, กติกาเชิงลึก (Article 6, 17), ระบบใบเตือน เหลือง-ส้ม-แดง และข้อเปรียบเทียบอาชีพ',
    details: {
      overview: 'บทความระเบียบข้อบังคับและคู่มือการตัดสินอย่างเป็นทางการ รับรองโดยผู้แทนฝ่ายเทคนิค (FIPJP Technical Delegate) และผู้ตัดสินอาวุโส (Senior Referee) สหพันธ์เปตองและเฌอโพรว็องซาลนานาชาติ (Fédération Internationale de Pétanque et Jeu Provençal) รวบรวมข้อกำหนดมาตรฐานอุปกรณ์ (Equipment Specs), กฎกติกาเชิงลึก (Official Articles), ระบบบทลงโทษบัตรเตือน 3 ลำดับ (Yellow, Orange, Red Cards), และตารางเปรียบเทียบข้อแตกต่างระหว่างการเล่นทั่วไปกับการแข่งขันระดับอาชีพสากล',
      steps: [
        'ขั้นตอนการตรวจรับรองอุปกรณ์ (Article 2 & 3): นำลูกเปตองและลูกเป้าเข้ารับการชั่งน้ำหนัก วัดขนาดเส้นผ่านศูนย์กลาง ตรวจสอบตราสลัก FIPJP และตรวจสอบสารแปลกปลอมก่อนลงแข่ง',
        'ขั้นตอนการจัดวางวงกลมและการยืน (Article 6): วางวงกลมขนาด Ø 50 ซม. ห่างเส้นตายและสิ่งกีดขวาง ≥ 1 เมตร เท้าทั้งสองข้างต้องสัมผัสพื้นเต็มฝ่าเท้า ห้ามเหยียบเส้นหรือยกส้นเท้าจนกว่าลูกจะตกถึงพื้น',
        'ขั้นตอนการโยนลูกเป้า (Article 7): โยนลูกเป้าให้อยู่ในระยะ 6 ถึง 10 เมตร และห่างขอบสนาม ≥ 1 เมตร โดยมีสิทธิ์โยน 1 ครั้ง หากฟาวล์ ฝ่ายตรงข้ามมีสิทธิ์หยิบไปวางตำแหน่งใดก็ได้ที่ถูกต้อง',
        'ขั้นตอนการปฏิบัติตามกฎ 1 นาที (Article 17): เริ่มจับเวลา 60 วินาทีทันทีหลังลูกก่อนหน้าหยุดนิ่ง หรือหลังเสร็จสิ้นการวัดระยะ ผู้เล่นต้องปล่อยลูกให้พ้นมือก่อนหมดเวลา'
      ],
      commonMistakes: [
        'การยกส้นเท้าข้างหลัง (Lifting Heel) หรือเท้าลอยขณะปล่อยลูกในวงกลม (ละเมิด Article 6 - ถูกลงโทษตามระบบบัตรเตือน)',
        'การใช้เท้าเตะ เกลี่ย หรือถมหลุมบนพื้นสนามโดยไม่ได้รับอนุญาตจากผู้ตัดสิน (ละเมิด Article 10 - Illegal Ground Modification)',
        'การโยนลูกผิดลำดับทีม (Playing out of turn) เมื่อยังไม่ได้เป็นฝ่ายเสียแต้ม หรือโยนเกินเวลา 1 นาที (Article 17)'
      ],
      proTips: [
        'ผู้ตัดสินอาวุโส FIPJP แนะนำ: ในการแข่งขันระดับชิงแชมป์โลก ผู้เล่นทุกคนต้องทำความคุ้นเคยกับเสียงสัญญาณเตือนเวลา 1 นาที และหมั่นสังเกตแนวมาร์กตำแหน่งลูกเป้าเสมอก่อนโยน',
        'การพกพาวงเวียนวัดระยะ (Tirette) และสายวัดตลับเมตรที่ผ่านการรับรองมาตรฐานสากล จะช่วยตัดปัญหาข้อพิพาทและรักษาความได้เปรียบทางจิตวิทยาในเกม'
      ],
      rulebookModule: {
        titleEn: 'Official FIPJP Competition Rules & Regulations Handbook',
        officialRef: 'Codex FIPJP - Edition Valid for World Championships & International Tours',
        equipmentSpecs: [
          {
            item: 'ลูกเปตองแข่งขัน (Competition Boules)',
            spec: 'โลหะเหล็กกล้า 100% (Solid Metal)',
            fipjpStandard: 'น้ำหนัก 650 - 800 กรัม, เส้นผ่านศูนย์กลาง 70.5 - 80.0 มม.',
            tolerance: 'น้ำหนัก ±0.5% (ไม่เกิน ±4g), ความแข็ง ≥ 110 kg/mm² (35 HRC)',
            refNotes: 'ต้องสลักชื่อผู้ผลิต, โลโก้ FIPJP, น้ำหนัก และ Serial No. ห้ามถ่วงปรอท/ตะกั่วเด็ดขาด'
          },
          {
            item: 'ลูกเป้าแข่งขัน (Cochonnet / Jack)',
            spec: 'ไม้เนื้อแข็ง หรือเรซินสังเคราะห์ FIPJP',
            fipjpStandard: 'เส้นผ่านศูนย์กลาง 30 มม. (น้ำหนัก 10 - 18 กรัม)',
            tolerance: '±1.0 มม. (ขนาดที่ยอมรับได้ 29.0 - 31.0 มม.)',
            refNotes: 'ทาสีสะท้อนแสงเด่นชัดได้ ห้ามเป็นแม่เหล็กดูดติด และห้ามดัดแปลงอุปกรณ์ใดๆ'
          },
          {
            item: 'วงกลมโยนลูก (Rigid Throwing Circle)',
            spec: 'วงแหวนพลาสติกแข็งสังเคราะห์ หรือขีดบนพื้น',
            fipjpStandard: 'เส้นผ่านศูนย์กลางภายใน 50 ซม. (ขีดชอล์กอนุโลม 35-50 ซม.)',
            tolerance: '±2.0 มม. (ต้องวางราบสนิทกับพื้นสนาม)',
            refNotes: 'ต้องวางห่างจากสิ่งกีดขวางและเส้นตาย (Dead-ball line) อย่างน้อย 1.00 เมตร'
          },
          {
            item: 'อุปกรณ์วัดระยะ (Measuring Apparatus)',
            spec: 'Tirette, แขนเวอร์เนียร์ หรือตลับเมตร FIPJP',
            fipjpStandard: 'ความละเอียดระดับมิลลิเมตร (Calibrated mm gauge)',
            tolerance: '±0.2 มม. สำหรับระยะประชิด (Tirette Compass)',
            refNotes: 'ไม่อนุญาตให้ใช้ฝ่าเท้าหรือก้าวเท้าในการตัดสินแต้มทางการเด็ดขาด'
          }
        ],
        articles: [
          {
            article: 'Article 6',
            title: 'การวางวงกลมและท่ายืน (Throwing Circle & Stance)',
            clause: 'วงกลมต้องวางห่างจากสิ่งกีดขวางและเส้นขอบสนามอย่างน้อย 1 เมตร เท้าทั้งสองข้างของผู้เล่นต้องสัมผัสพื้นอยู่ภายในวงกลมอย่างสมบูรณ์',
            keyRule: 'ห้ามสัมผัสหรือเหยียบเส้นขอบวงกลม และห้ามยกส้นเท้าหรือก้าวเท้าออกจนกว่าลูกที่โยนจะตกกระทบพื้นสนาม',
            penaltyAction: 'ตักเตือนด้วยใบเหลือง หากทำผิดซ้ำปรับลูกเป็นลูกตาย (ใบส้ม) หรือตัดสิทธิ์'
          },
          {
            article: 'Article 7',
            title: 'การโยนลูกเป้าถูกต้อง (Valid Jack Placement)',
            clause: 'ลูกเป้าต้องถูกโยนไปยังระยะห่าง 6 ถึง 10 เมตรจากขอบในของวงกลม และอยู่ห่างจากสิ่งกีดขวาง/เส้นตาย ≥ 1 เมตร',
            keyRule: 'แต่ละทีมมีสิทธิ์โยนเพียง 1 ครั้ง หากโยนไม่ถูกต้อง สิทธิ์การวางเปลี่ยนไปยังฝ่ายตรงข้ามทันทีโดยไม่ต้องโยนใหม่',
            penaltyAction: 'ฝ่ายตรงข้ามหยิบลูกเป้าไปวาง ณ ตำแหน่งใดก็ได้ที่ถูกต้องในสนาม'
          },
          {
            article: 'Article 10',
            title: 'การดัดแปลงสภาพพื้นสนาม (Ground Modification)',
            clause: 'ผู้เล่นห้ามกด ทุบ ขุด เกลี่ย หรือนำก้อนหิน/อุปสรรคออกจากพื้นสนามแข่งขันเด็ดขาด',
            keyRule: 'อนุญาตให้อุดรอยหลุมที่เกิดจากลูกโยนลูกก่อนหน้าได้เพียง 1 หลุมโดยขออนุญาตคู่แข่งหรือผู้ตัดสิน',
            penaltyAction: 'ใบเหลืองเตือนครั้งที่ 1, ใบส้มยกเลิกลูกแข่งขันหากกระทำซ้ำ'
          },
          {
            article: 'Article 17',
            title: 'กฎจำกัดเวลา 1 นาที (The 1-Minute Rule)',
            clause: 'ผู้เล่นมีเวลาสูงสุด 1 นาที (60 วินาที) ในการโยนลูกเปตอง 1 ลูก',
            keyRule: 'การจับเวลาเริ่มทันทีที่ลูกก่อนหน้าหรือลูกเป้าหยุดนิ่งสนิท หรือหลังจากการวัดระยะเสร็จสิ้น',
            penaltyAction: 'ผู้ตัดสินจับเวลาด้วยสต็อปวอทช์ เกินเวลาปรับใบเหลือง / ใบส้มยึดลูกทันที'
          }
        ],
        penalties: [
          {
            card: 'ใบเหลือง (Yellow Card)',
            nameTh: 'การตักเตือนอย่างเป็นทางการ (Official Warning)',
            badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            borderBg: 'border-amber-500/50',
            textColor: 'text-amber-400',
            level: 'ระดับ 1: ตักเตือน (Warning)',
            trigger: 'โยนลูกเกินเวลา 1 นาที, ก้าวล้ำวงกลม, ส้นเท้ายกลอย, ปรับแต่งหน้าดินโดยไม่ได้รับอนุญาต',
            consequence: 'บันทึกลงในใบบันทึกคะแนนของผู้ตัดสิน มีผลครอบคลุมผู้เล่นทุกคนในทีมตลอดทั้งแมตช์'
          },
          {
            card: 'ใบส้ม (Orange Card)',
            nameTh: 'การยกเลิกลูกแข่งขัน (Cancellation of Boule)',
            badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
            borderBg: 'border-orange-500/50',
            textColor: 'text-orange-400',
            level: 'ระดับ 2: ปรับฟาวล์ลูกแข่งขัน (Boule Annulled)',
            trigger: 'กระทำผิดซ้ำข้อหาเดิมหลังจากได้รับใบเหลืองแล้ว หรือโยนลูกผิดลำดับทีมโดยเจตนา',
            consequence: 'ยึดลูกที่กำลังจะโยนออกจากการเล่นทันที หากลูกโยนออกไปแล้วให้ปรับเป็นลูกตาย และจัดลูกอื่นที่กระทบคืนตำแหน่งเดิม'
          },
          {
            card: 'ใบแดง (Red Card)',
            nameTh: 'การตัดสิทธิ์ออกจากการแข่งขัน (Disqualification)',
            badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            borderBg: 'border-rose-500/50',
            textColor: 'text-rose-400',
            level: 'ระดับ 3: ตัดสิทธิ์สูงสุด (Exclusion / Forfeit)',
            trigger: 'ทำผิดซ้ำหลังใบส้ม, ดัดแปลงลูกเปตองทุจริต (ถ่วงปรอท/เผาไฟ), แสดงกิริยาก้าวร้าวรุนแรงต่อผู้ตัดสินหรือคู่แข่ง',
            consequence: 'ตัดสิทธิ์ผู้เล่นคนนั้นออกจากทัวร์นาเมนต์ทันที หรือปรับทีมแพ้บาย (Forfeit 0-13) และส่งรายงานดำเนินคดีวินัย FIPJP'
          }
        ],
        commonFouls: [
          {
            foulName: 'การล้ำวงกลม (Circle Infringement)',
            articleRef: 'Article 6',
            description: 'ปลายเท้าล้ำเส้นขอบวงกลม หรือยกส้นเท้าลอยขึ้นก่อนลูกกระทบพื้นสนาม',
            procedure: 'ผู้ตัดสินเตือนใบเหลือง หากโยนลูกไปแล้วและโดนใบส้ม ลูกนั้นถูกตัดสิทธิ์และตั้งลูกอื่นกลับตำแหน่งเดิม'
          },
          {
            foulName: 'การปรับแต่งสภาพสนามโดยพลการ (Illegal Ground Tampering)',
            articleRef: 'Article 10',
            description: 'ใช้เท้าหรือมือลูบเกลี่ยหน้าดินหน้าวงกลมหรือบริเวณจุดตกโดยไม่ได้รับอนุญาต',
            procedure: 'ผู้ตัดสินสั่งยุติการเล่น คืนสภาพเดิม และลงโทษด้วยระบบใบเตือน'
          },
          {
            foulName: 'การโยนลูกผิดลำดับทีม (Playing Out of Turn)',
            articleRef: 'Article 16',
            description: 'ผู้เล่นโยนลูกทั้งที่ทีมของตนถือแต้มนำอยู่ หรือโยนสลับลำดับโดยไม่เป็นไปตามสถานการณ์คะแนน',
            procedure: 'ลูกที่โยนผิดถือเป็นลูกโมฆะ หากกระทบลูกอื่นในสนาม ต้องนำลูกเหล่านั้นกลับตำแหน่งเดิม'
          }
        ],
        comparisonTable: [
          {
            topic: 'เวลาต่อการโยน 1 ลูก (Time per Throw)',
            casualRule: 'ไม่จำกัดเวลา เล่นตามอัธยาศัยและปรึกษากันได้ไม่จำกัด',
            proFipjpRule: 'เคร่งครัด 60 วินาที (Article 17) จับเวลาด้วยสต็อปวอทช์ทันทีหลังลูกหยุด',
            articleRef: 'FIPJP Article 17'
          },
          {
            topic: 'การวัดระยะแต้ม (Measurement of Points)',
            casualRule: 'ใช้สายตา ก้าวเท้า หรือใช้กิ่งไม้/รองเท้าทาบวัด',
            proFipjpRule: 'ห้ามใช้เท้าเด็ดขาด ต้องใช้เครื่องมือวัดมาตรฐาน (Tirette / Tape) โดยผู้ตัดสินหรือผู้เล่นที่ได้รับอนุญาต',
            articleRef: 'FIPJP Article 26-29'
          },
          {
            topic: 'การเปลี่ยนตัวสำรอง (Player Substitution)',
            casualRule: 'สลับสับเปลี่ยนผู้เล่นเข้าออกได้อิสระตลอดเวลา',
            proFipjpRule: 'เปลี่ยนได้สูงสุด 1 คนต่อทีม ต้องแจ้งผู้ตัดสินก่อนเริ่มเที่ยว (Mène) ใหม่ และเปลี่ยนกลับไม่ได้',
            articleRef: 'FIPJP Article 34'
          },
          {
            topic: 'การดัดแปลงสภาพลูกเปตอง (Boule Alteration)',
            casualRule: 'ติดสติกเกอร์ พ่นสี หรือทำเครื่องหมายตามความชอบ',
            proFipjpRule: 'ห้ามดัดแปลงความร้อน ถ่วงตะกั่ว เจาะรู หรือเปลี่ยนแปลงสภาพเดิมจากโรงงานเด็ดขาด (โทษใบแดง)',
            articleRef: 'FIPJP Article 2'
          },
          {
            topic: 'การทำเครื่องหมายตำแหน่งลูก (Marking Boules)',
            casualRule: 'ไม่ทำเครื่องหมาย หรือใช้เท้าขีดคร่าวๆ',
            proFipjpRule: 'ต้องใช้ชอล์กหรืออุปกรณ์มาร์กทำเครื่องหมายระบุพิกัดทุกลูกก่อนการวัดระยะเสมอ',
            articleRef: 'FIPJP Article 12'
          }
        ]
      }
    }
  },
  {
    id: 'tournament-formats',
    level: 'advanced',
    levelLabel: 'Competition Formats',
    category: 'rules',
    categoryLabel: 'ระบบและกติกาการแข่งขัน',
    title: '12. ระบบการแข่งขันหลัก (Main Competition Formats)',
    summary: 'เจาะลึก 3 รูปแบบการแข่งขันเปตองมาตรฐานสากล: Round Robin (พบกันหมด), Poule System (ระบบพูล 4 ทีม/แพ้ 2 ครั้งตกรอบ พร้อมนัดตัดสิน Barrage), และ Swiss System (ระบบสวิตช์สำหรับทีมจำนวนมาก)',
    details: {
      overview: 'บทเรียนการบริหารจัดการและระบบการแข่งขันหลักในกีฬาเปตอง (Official Petanque Tournament Formats) มุ่งเน้นการทำความเข้าใจเชิงลึกเกี่ยวกับตรรกะการประกบคู่, การกระจายสาย, การคำนวณจำนวนแมตช์, ความเที่ยงธรรมของการจัดอันดับ และการเลือกใช้ระบบแข่งขันให้สอดคล้องกับขนาดรายการ ตั้งแต่ทัวร์นาเมนต์ชุมชนไปจนถึงชิงแชมป์โลก FIPJP World Championship',
      steps: [
        'ขั้นตอนที่ 1: วิเคราะห์ทรัพยากรการแข่งขัน (จำนวนทีมที่สมัคร, จำนวนสนามเปตองที่มี, และกรอบเวลาทั้งหมดของทัวร์นาเมนต์)',
        'ขั้นตอนที่ 2: เลือกระบบการแข่งขันรอบแรก (Poule System สำหรับรอบคัดเลือกระดับชิงแชมป์, Swiss System สำหรับทีมจำนวนมาก, หรือ Round Robin สำหรับกลุ่มขนาดเล็ก)',
        'ขั้นตอนที่ 3: กำหนดเกณฑ์การจับสลากและการวางมือวาง (Seeding & Drawing) พร้อมจัดสายหลัก (Main Draw) และสายแก้ตัว (Consolation Draw)',
        'ขั้นตอนที่ 4: ดำเนินการจับคู่ตามลำดับรอบอย่างเคร่งครัด บันทึกผลคะแนน และประกบคู่ไขว้สาย (Cross-Pairing) ในรอบน็อกเอาต์'
      ],
      commonMistakes: [
        'การเลือกใช้ระบบ Round Robin กับรายการที่มีทีมเข้าร่วมมากเกินไป ส่งผลให้เวลาแข่งยืดเยื้อข้ามคืนและสนามไม่เพียงพอ',
        'การจับคู่ซ้ำ (Rematch) ในระบบ Swiss System ซึ่งขัดแย้งกับหลักการจับคู่สากลอย่างร้ายแรง',
        'ความสับสนในการประกบคู่นัด Barrage ในระบบ Poule โดยนำทีมที่ชนะ 2 นัดรวดมาลงแข่งซ้ำ แทนที่จะให้เข้ารอบไปรอในรอบน็อกเอาต์ทันที'
      ],
      proTips: [
        'ผู้แทนฝ่ายเทคนิค FIPJP แนะนำ: ในการแข่งขันที่มีทีมมากกว่า 32 ทีมขึ้นไปและมีเวลาจำกัด ให้พิจารณาใช้ Swiss System 4-5 รอบ เพื่อคัด 16 หรือ 32 ทีมเข้าสู่รอบน็อกเอาต์ จะประหยัดเวลาได้กว่า 40% เมื่อเทียบกับการแบ่งสายแบบพบกันหมด',
        'การจัดสาย Consolation (ถ้วย ข) ควบคู่กับ Main Event (ถ้วย ก) เสมอ จะช่วยสร้างความพึงพอใจสูงสุดแก่นักกีฬา เพราะทุกทีมจะได้รับประกันการลงแข่งอย่างน้อย 2-3 แมตช์'
      ],
      tournamentFormatsModule: {
        titleEn: 'Official Main Competition Formats & Tournament Directing Manual',
        learningObjectives: [
          'เข้าใจโครงสร้าง ทฤษฎี และกลไกการทำงานของ 3 ระบบการแข่งขันหลัก (Round Robin, Poule System, Swiss System)',
          'สามารถใช้สูตรคณิตศาสตร์คำนวณจำนวนนัดแข่งขัน N(N-1)/2 และจัดสรรเวลาการใช้สนามได้อย่างมีประสิทธิภาพ',
          'เข้าใจกระบวนการของระบบพูล (Poule System) ครบทุกนัด: นัดแรก, นัดผู้ชนะ (Winners), นัดแก้ตัว (Losers), และนัดชี้ชะตา (Barrage)',
          'วิเคราะห์และเลือกรูปแบบการแข่งขันที่เหมาะสมที่สุดระหว่างรายการระดับชุมชน/กระชับมิตร กับรายการชิงแชมป์ระดับอาชีพ/สากล',
          'เชี่ยวชาญคำศัพท์เชิงเทคนิคสากล (Barrage, Bye, Main/Consolation, Cross-Pairing) เพื่อการบริหารจัดการแข่งขันระดับมาตรฐาน'
        ],
        formats: [
          {
            id: 'round-robin',
            name: 'Round Robin (การแข่งขันแบบพบกันหมด)',
            nameEn: 'Round Robin All-Play-All Tournament',
            badgeColor: 'border-sky-500/40 bg-sky-500/10 text-sky-400',
            definition: 'ระบบการแข่งขันที่ทุกทีมภายในกลุ่มเดียวกันต้องลงแข่งขันกับทุกทีมที่เหลือจนครบถ้วน โดยไม่มีการคัดออกระหว่างทาง การจัดอันดับใช้ผลการชนะ-แพ้ ผลต่างคะแนน (Point Differential) หรือการนับคะแนนดิบที่ทำได้',
            pros: [
              'มีความเที่ยงตรงและยุติธรรมสูงสุด ลดผลกระทบจากดวงหรือการจับสลากประกบคู่',
              'ทุกทีมในกลุ่มได้ลงเล่นจำนวนนัดเท่ากันอย่างแน่นอน ไม่มีการตกรอบตั้งแต่แมตช์แรก',
              'สะท้อนศักยภาพที่แท้จริงของทีมตลอดระยะยาวได้อย่างแม่นยำ'
            ],
            cons: [
              'ใช้เวลาและจำนวนสนามแข่งขันมากที่สุด หากมีทีมจำนวนมากจะไม่สามารถจัดให้จบในวันเดียวได้',
              'อาจเกิดเกมนัดสุดท้ายที่ไม่มีผลต่อการเข้ารอบ (Dead Rubbers) หรือเกิดการสมยอมเพื่อเลือกคู่แข่งในรอบต่อไป'
            ],
            matchFormula: 'จำนวนนัดแข่งขันรวม = N × (N - 1) / 2 (เมื่อ N คือจำนวนทีมในสาย)',
            matchCalculationExample: 'หากในสายมี 4 ทีม: จำนวนนัด = 4 × (4 - 1) / 2 = 6 นัด (ใช้เวลาประมาณ 3 รอบการแข่งขัน)',
            exampleTable: [
              { round: 'รอบที่ 1', matches: 'ทีม A พบ ทีม B และ ทีม C พบ ทีม D', note: 'เปิดสนามแข่งขันพร้อมกัน 2 คอร์ต' },
              { round: 'รอบที่ 2', matches: 'ทีม A พบ ทีม C และ ทีม B พบ ทีม D', note: 'สลับประกบคู่ข้ามทีม' },
              { round: 'รอบที่ 3', matches: 'ทีม A พบ ทีม D และ ทีม B พบ ทีม C', note: 'นัดสุดท้าย สรุปผลจัดอันดับ 1 ถึง 4' }
            ]
          },
          {
            id: 'poule-system',
            name: 'Double Knockout / Poule System (ระบบพูล 4 ทีม/แพ้ 2 ครั้งตกรอบ)',
            nameEn: 'Official FIPJP 4-Team Poule System (Double Elimination in Pool)',
            badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
            definition: 'ระบบการแข่งขันรอบคัดเลือกมาตรฐานสากลของ FIPJP แบ่งทีมเป็นสายละ 4 ทีม แข่งขันตามโครงสร้างสายบน-สายล่าง ทีมใดชนะครบ 2 นัดจะได้ผ่านเข้ารอบทันที ส่วนทีมใดแพ้ครบ 2 นัดจะตกรอบทันที แข่งขันไม่เกิน 5 นัดต่อสาย (ประหยัดกว่า Round Robin 1 นัด)',
            pros: [
              'ประหยัดเวลาและจำนวนสนาม โดย 1 สายใช้การแข่งขันเพียง 4-5 นัดเท่านั้น',
              'ทุกนัดมีความหมาย ไม่มีการแข่งขันที่ไร้ความหมาย (No Dead Rubbers)',
              'ให้โอกาสแก้ตัวสำหรับทีมเต็งที่พลาดท่าในนัดแรก ยังมีสิทธิ์กลับมาเข้ารอบผ่านนัด Barrage ได้'
            ],
            cons: [
              'โครงสร้างการประกบคู่มีความซับซ้อน อาจสร้างความสับสนแก่ผู้เล่นและกรรมการมือใหม่',
              'ทีมที่มีผลงานสูสีอาจต้องเจอกันซ้ำเป็นครั้งที่ 2 ในนัด Barrage ภายในวันเดียวกัน'
            ],
            flowSteps: [
              {
                stepName: '1. นัดแรก (First Round / Partie 1 & 2)',
                description: 'ทีม 1 พบ ทีม 2 (นัด A) และ ทีม 3 พบ ทีม 4 (นัด B)',
                outcome: 'ได้ผู้ชนะ 2 ทีม และผู้แพ้ 2 ทีม'
              },
              {
                stepName: '2. นัดผู้ชนะ (Winners Match / Partie des Gagnants)',
                description: 'นำผู้ชนะจากนัด A มาพบกับ ผู้ชนะจากนัด B',
                outcome: 'ทีมชนะมีสถิติ ชนะ 2 นัดรวด -> ผ่านเข้ารอบเป็นที่ 1 ของสาย (1st Qualified) ทันที'
              },
              {
                stepName: '3. นัดแก้ตัวผู้แพ้ (Losers Match / Partie des Perdants)',
                description: 'นำผู้แพ้จากนัด A มาพบกับ ผู้แพ้จากนัด B',
                outcome: 'ทีมแพ้มีสถิติ แพ้ 2 นัดรวด -> ตกรอบ (Eliminated) เป็นทีมแรกของสาย'
              },
              {
                stepName: '4. นัดตัดสินชี้ชะตา (Barrage Match)',
                description: 'นำผู้แพ้จากนัดผู้ชนะ มาพบกับ ผู้ชนะจากนัดแก้ตัว (ทั้งสองทีมมีสถิติ ชนะ 1 แพ้ 1 เท่ากัน)',
                outcome: 'ผู้ชนะในนัด Barrage ผ่านเข้ารอบเป็นที่ 2 ของสาย (2nd Qualified) ส่วนผู้แพ้ตกรอบ'
              }
            ]
          },
          {
            id: 'swiss-system',
            name: 'Switch / Swiss System (ระบบสวิตช์)',
            nameEn: 'Swiss-System Tournament (Buchholz / Sonneborn-Berger Rating)',
            badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
            definition: 'ระบบการจัดประกบคู่แบบไม่คัดตกรอบทันที นิยมใช้อย่างแพร่หลายในทัวร์นาเมนต์ขนาดใหญ่ที่มีทีมเข้าร่วม 32 ถึง 128+ ทีม แต่มีเวลาจำกัด โดยทีมที่มีคะแนนชนะเท่ากันจะถูกจัดประกบคู่ให้เจอกันเองในแต่ละรอบ',
            pros: [
              'รองรับจำนวนทีมมหาศาลได้โดยไม่ต้องแบ่งกลุ่มย่อย แข่งเพียง 4-5 รอบก็จัดอันดับท็อป 16 หรือ 32 ทีมได้แม่นยำ',
              'ทุกทีมได้ลงเล่นครบทุกรอบตั้งแต่ต้นจนจบ ไม่มีใครตกรอบเร็วจนเสียกำลังใจ',
              'ระดับความยากของคู่แข่งจะปรับตัวเข้าหากันโดยอัตโนมัติ (ทีมเก่งเจอทีมเก่ง ทีมมือใหม่เจอมือใหม่)'
            ],
            cons: [
              'ต้องอาศัยโปรแกรมคอมพิวเตอร์หรือกรรมการที่มีความเชี่ยวชาญสูงในการคำนวณคะแนนเสริม (Buchholz Score)',
              'ไม่สามารถจัดตารางล่วงหน้าได้ ต้องรอผลการแข่งขันของทุกคู่ในรอบปัจจุบันเสร็จสิ้นก่อนจึงจะประกบคู่รอบถัดไปได้'
            ],
            pairingPrinciple: 'รอบที่ 1: สุ่มประกบคู่ทั้งหมด -> รอบที่ 2 เป็นต้นไป: ทีมที่มีคะแนนสะสมเท่ากันเจอกัน (เช่น 1-0 พบ 1-0, 0-1 พบ 0-1) โดยมีกฎเหล็ก "ห้ามเจอกับคู่แข่งที่เคยพบกันมาแล้วในรอบก่อนหน้าเด็ดขาด (No Rematch)"'
          }
        ],
        comparisonTable: [
          {
            formatName: 'Round Robin (พบกันหมด)',
            suitableTeams: '3 - 6 ทีมต่อสาย (กลุ่มขนาดเล็ก)',
            timeRequired: 'สูงมาก (6 นัดต่อสาย 4 ทีม)',
            accuracy: '⭐⭐⭐⭐⭐ (แม่นยำสูงสุด ไร้ข้อกังขา)',
            limitations: 'ใช้เวลาและสนามมาก เสี่ยงเกิดเกมสมยอมนัดท้าย',
            badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
          },
          {
            formatName: 'Poule System (ระบบพูล 4 ทีม FIPJP)',
            suitableTeams: 'ทัวร์นาเมนต์ที่หาร 4 ลงตัว (16, 32, 64 ทีม)',
            timeRequired: 'ปานกลาง (4 - 5 นัดต่อสาย)',
            accuracy: '⭐⭐⭐⭐ (มาตรฐานระดับชิงแชมป์โลก)',
            limitations: 'อาจเจอกันซ้ำในนัด Barrage, กรรมการต้องแม่นผัง',
            badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          },
          {
            formatName: 'Swiss System (ระบบสวิตช์)',
            suitableTeams: '24 - 128+ ทีม (ทัวร์นาเมนต์ขนาดใหญ่)',
            timeRequired: 'มีประสิทธิภาพสูง (กำหนดรอบแน่นอน 4-5 รอบ)',
            accuracy: '⭐⭐⭐⭐ (จัดลำดับตามระดับฝีมือได้ดีเยี่ยม)',
            limitations: 'ต้องรอผลจบรอบพร้อมกัน, ต้องใช้ซอฟต์แวร์ช่วยจัด',
            badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
          }
        ],
        caseStudies: [
          {
            context: 'รายการเปตองระดับชุมชน / นันทนาการองค์กร',
            badge: 'Community & Corporate Friendly',
            scenario: 'มีทีมสมัคร 16 ทีม สนามเปตองมีจำกัดเพียง 4 สนาม และมีเวลาแข่งขันเพียง 1 วัน (08:30 - 17:00 น.)',
            recommendedFormat: 'ระบบสวิตช์ (Swiss System) 4 รอบ หรือแบ่ง 4 สายสายละ 4 ทีมแบบ Poule',
            rationale: 'นักกีฬาในชุมชนต้องการความสนุกสนานและได้ลงเล่นหลายเกม การใช้ Swiss System ช่วยให้ทุกทีมได้เล่นครบ 4 นัดแน่นอน ไม่มีทีมใดตกรอบกลับบ้านตั้งแต่เช้า สร้างความพึงพอใจสูงสุด',
            practicalTips: [
              'กำหนดเวลาจำกัดต่อแมตช์ 45 นาที หรือ 11 แต้ม เพื่อควบคุมเวลาให้ตรงตามกำหนด',
              'ทีมอันดับ 1-4 ผ่านเข้าสู่รอบรองชนะเลิศ ชิงถ้วยรางวัลเกียรติยศ'
            ]
          },
          {
            context: 'รายการชิงแชมป์ระดับชาติ / FIPJP World Championship',
            badge: 'Official Professional Championship',
            scenario: 'มีทีมชาติเข้าร่วม 48 ทีม มีสนามแข่งขันมาตรฐาน 24 สนาม แข่งขัน 3 วันเต็มเพื่อหาแชมป์โลก',
            recommendedFormat: 'ระบบพูล FIPJP Poule System (12 สาย สายละ 4 ทีม) ร่วมกับ Main Draw & Consolation Draw',
            rationale: 'เป็นมาตรฐานสากลที่การันตีความเด็ดขาด ทุกทีมมีโอกาสแก้ตัวได้ 1 ครั้ง (Double Knockout) โดยที่ 1 และ 2 ของสายเข้ารอบ Main Draw (ถ้วย ก) ส่วนที่ 3 และ 4 ตกไปแข่ง Consolation Draw (ถ้วย ข / Nations Cup)',
            practicalTips: [
              'ประกบคู่รอบน็อกเอาต์แบบไขว้สาย (Cross-Pairing เช่น ที่ 1 สาย A พบ ที่ 2 สาย B)',
              'จัดทำตารางและบันทึกคะแนนในบอร์ดกลางแจ้งให้ชัดเจน ป้องกันข้อพิพาทในนัด Barrage'
            ]
          }
        ],
        glossary: [
          {
            term: 'Barrage (บาร์ราจ)',
            thaiMeaning: 'นัดตัดสินชี้ชะตาใบสุดท้าย',
            contextUsage: 'การแข่งขันนัดที่ 5 ในระบบ Poule ระหว่างทีมที่แพ้ในนัดผู้ชนะ กับทีมที่ชนะในนัดแก้ตัว ผู้ชนะนัดนี้จะได้สิทธิ์ผ่านเข้ารอบเป็นที่ 2 ของสาย'
          },
          {
            term: 'Bye (บาย / ได้ผ่าน)',
            thaiMeaning: 'สิทธิ์การผ่านเข้ารอบโดยไม่ต้องลงแข่งขัน',
            contextUsage: 'เกิดขึ้นเมื่อจำนวนทีมไม่ลงตัวเป็นเลขคู่ (เช่น สายมี 3 ทีม) หรือทีมที่มีอันดับวางสูงสุด (Top Seed) ได้สิทธิ์ชนะผ่านในรอบแรก'
          },
          {
            term: 'Main / Consolation (สายหลัก / สายแก้ตัว)',
            thaiMeaning: 'ถ้วย ก (ชิงแชมป์ใหญ่) และ ถ้วย ข (ปลอบใจ)',
            contextUsage: 'โครงสร้างการแบ่งสายหลังจบรอบคัดเลือก ทีมอันดับ 1-2 เล่นต่อในสาย Main Event ส่วนทีมอันดับ 3-4 เล่นต่อในสาย Consolation (หรือ Nations Cup ในระดับโลก)'
          },
          {
            term: 'Cross-Pairing (การประกบคู่ไขว้สาย)',
            thaiMeaning: 'การจับคู่ไขว้ข้ามกลุ่มในรอบน็อกเอาต์',
            contextUsage: 'นำทีมอันดับ 1 ของสายหนึ่งมาพบกับทีมอันดับ 2 ของอีกสายหนึ่ง (เช่น 1A พบ 2B) เพื่อเป็นรางวัลแก่ทีมแชมป์กลุ่มและหลีกเลี่ยงการเจอกันซ้ำของทีมสายเดียวกัน'
          }
        ]
      }
    }
  }
];

export interface DrillVisualSetup {
  courtDimensions: string;
  jackDistance: string;
  opponentObstacle: string;
  targetBlindSpot: string;
  tacticalPrinciple: string;
  bulletNotes: string[];
}

export interface DrillItem {
  id: string;
  title: string;
  titleEn: string;
  category: 'pointing' | 'shooting' | 'tactical' | 'pressure' | 'defensive';
  categoryLabel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  difficultyLabel: string;
  difficultyColor: string;
  duration: string;
  targetRepetitions: string;
  repetitionCount: number;
  equipment: string[];
  objective: string;
  setup: string;
  visualSetup?: DrillVisualSetup;
  steps: string[];
  scoringBenchmark: {
    bronze: string;
    silver: string;
    gold: string;
  };
  coachingTips: string[];
  videoDemo: {
    title: string;
    channel: string;
    duration: string;
    videoQuery: string;
    keyMoments: string[];
  };
}

export interface CoachingTipItem {
  id: number;
  category: string;
  title: string;
  coach: string;
  tip: string;
  quote: string;
}

export const PRO_COACHING_TIPS: CoachingTipItem[] = [
  {
    id: 1,
    category: 'Pointing Mechanics',
    title: 'การอ่านจุดตก Donnée บนสนามหินกรวด (Gravel Terrain)',
    coach: 'โค้ชประพัฒน์ (ผู้ฝึกสอนเปตองทีมชาติไทย)',
    tip: 'บนสนามหินกรวด อย่าพยายามเล็งจุดตกที่ลูกแก่นโดยตรง ให้เดินสำรวจหารอยดินเรียบหรือแอ่งทรายเล็กๆ ระหว่างก้อนหิน ห่างจากแก่น 1-1.5 เมตร แล้วโยนโด่งตกตรงนั้นเพื่อลดการแฉลบ 70%',
    quote: 'จุดตกที่ถูกต้อง สำคัญกว่าแรงขว้างเสมอ'
  },
  {
    id: 2,
    category: 'Backspin & Finger Snap',
    title: 'การสะบัดปลายนิ้วสร้าง Backspin ดูดพื้น (Brake Stop)',
    coach: 'Philippe Quintais (แชมป์โลกเปตอง 14 สมัย)',
    tip: 'ในเสี้ยววินาทีที่ลูกหลุดออกจากมือ อย่าบีบอุ้งมือ ให้ปล่อยให้นิ้วทั้งสี่รูดผ่านผิวโลหะอย่างเฉียบคมเหมือนดึงผ้าเช็ดหน้าออกจากกระเป๋า ลูกจะหมุนกลับหลังมากกว่า 800 RPM และเบรกนิ่งทันทีที่ตก',
    quote: 'ข้อมือที่ผ่อนคลาย สร้างแรงหมุนได้เร็วกว่ากล้ามเนื้อแขนที่เกร็ง'
  },
  {
    id: 3,
    category: 'Shooting & Carreau',
    title: 'เคล็ดลับการยิงตีติด (Carreau) Center-to-Center',
    coach: 'Dylan Rocher (แชมป์ยิงชูตติ้งโลก 5 สมัยซ้อน)',
    tip: 'เมื่อขึ้นเล็งในวงกลม อย่ามองภาพรวมของสนาม ให้ซูมสายตาไปที่จุดกึ่งกลางของลูกคู่แข่งเหมือนเป้าเล็งสไนเปอร์ สวิงแขนเป็นแนวระนาบตรง ปล่อยลูกที่ระดับสายตา จะได้อัตรา Carreau สูงสุด',
    quote: 'การยิงเปตอง ไม่ใช่เรื่องของความแรง แต่เป็นเรื่องของแนวระนาบและความนิ่ง'
  },
  {
    id: 4,
    category: 'Mental & Clutch Game',
    title: 'การคุมจังหวะหายใจในสถานการณ์แต้ม 12-12',
    coach: 'พ.อ.หญิง ทองสี ดีเจริญ (ตำนานแชมป์โลกทีมชาติไทย)',
    tip: 'เมื่อแต้มมาถึง 12 ต่อ 12 ชีพจรจะเต้นเร็วขึ้นตามธรรมชาติ ให้ใช้เทคนิค 4-7-8 สูดหายใจเข้า 4 วินาที กลั้นไว้ 7 วินาที แล้วผ่อนออกทางปาก 8 วินาที ก่อนก้าวเข้าวงกลม จะช่วยลดอาการมือสั่นได้ทันที',
    quote: 'คนที่ชนะในเที่ยวสุดท้าย คือคนที่นิ่งที่สุด ไม่ใช่คนที่เก่งที่สุด'
  },
  {
    id: 5,
    category: 'Tactical Selection',
    title: 'การตัดสินใจระหว่าง "ยิงเคลียร์" หรือ "เข้าแทรก"',
    coach: 'โค้ชสุพรรณ (ที่ปรึกษาสมาคมกีฬาเปตองแห่งประเทศไทยฯ)',
    tip: 'หากฝ่ายเราเหลือลูกมากกว่า ให้เลือกเข้าแทรกเพื่อบีบแต้ม แต่หากฝ่ายตรงข้ามเหลือลูกเยอะและลูกของเขาชิดแก่นต่ำกว่า 15 ซม. ต้องตัดสินใจสั่งยิงเคลียร์ทันทีเพื่อไม่ให้เสียเปรียบเชิงพื้นที่',
    quote: 'ประเมินจำนวนลูกที่เหลือของสองทีม ก่อนตัดสินใจเลือกวิธีเล่นทุกลูก'
  },
  {
    id: 6,
    category: 'Screw Back / Tir Rétro',
    title: 'การบังคับให้ลูกถอยหลัง (Rétro) หลังปะทะ Fer-à-fer',
    coach: 'Diego Rizzi (แชมป์ยิงชูตติ้งระดับโลก)',
    tip: 'การทำสกรูแบ็คต้องปล่อยลูกด้วยมุมเหวี่ยงต่ำและเร็ว (Low-flat arc 32°-36°) โดยสะบัดปลายนิ้วให้ลูกหมุนกลับหลังเร็วกว่าความเร็วแนวราบ (ω × R > vx) ทันทีที่ชนลูกเป้าหมาย พลังงานแนวราบจะถูกถ่ายโอนไปทั้งหมด เหลือแต่แรงหมุนที่ขุดหน้าดินพาลูกถอยกลับมาหาตัวคุณ',
    quote: 'สกรูแบ็คไม่ใช่แค่ยิงโดน แต่เป็นการคุมตำแหน่งลูกหลังการยิงอย่างสมบูรณ์แบบ'
  }
];

export interface BackspinPhysicsResult {
  v0: number; // Initial velocity (m/s)
  angleDeg: number; // Launch angle (deg)
  omega0: number; // Angular velocity (rad/s)
  rpm: number; // Rotations per minute
  contactVelocity: number; // v_contact = v_x1 - omega * R (m/s)
  normalImpulse: number; // J_n = m * (1 + e) * v_y1 (N*s)
  retroForce: number; // F_f = mu_k * N (N)
  retroSpeed: number; // v_r reverse linear velocity (m/s)
  retroDistanceM: number; // d_retro in meters
  retroDistanceCm: number; // d_retro in centimeters
  isReverseRoll: boolean; // whether backspin exceeds forward momentum
  explanation: string;
}

export function calculateBackspinPhysics(
  spinType: 'low' | 'medium' | 'high' | 'max' | 'retro',
  terrainId: TerrainType,
  bouleWeightGrams: number = 690,
  bouleDiameterMm: number = 73
): BackspinPhysicsResult {
  const massKg = bouleWeightGrams / 1000;
  const radiusM = (bouleDiameterMm / 1000) / 2;
  const terrain = TERRAIN_PRESETS[terrainId];
  const g = 9.81;

  // Preset launch parameters
  let v0 = 7.2; // m/s
  let angleDeg = 50;
  let spinBeta = 1.2;

  if (spinType === 'low') {
    v0 = 6.0;
    angleDeg = 28;
    spinBeta = 0.35; // gentle roll spin
  } else if (spinType === 'medium') {
    v0 = 7.5;
    angleDeg = 48;
    spinBeta = 1.35; // demi-portée backspin
  } else if (spinType === 'high') {
    v0 = 9.2;
    angleDeg = 70;
    spinBeta = 2.65; // intense plombée backspin
  } else if (spinType === 'retro') {
    // Extreme Super Backspin (Tir Rétro Screw Back)
    v0 = 11.2;
    angleDeg = 36;
    spinBeta = 4.6; // Extreme wrist snap + finger pad friction (400+ RPM)
  } else {
    // max (carreau snap)
    v0 = 11.5;
    angleDeg = 38;
    spinBeta = 3.8; // maximum wrist snap
  }

  const angleRad = (angleDeg * Math.PI) / 180;
  const vx1 = v0 * Math.cos(angleRad);
  const vy1 = v0 * Math.sin(angleRad);

  // 1. Angular Velocity (omega_0) from wrist release snap
  // omega_0 = beta * (v0 / R)
  const omega0 = spinBeta * (v0 / radiusM);
  const rpm = Math.round((omega0 * 60) / (2 * Math.PI));

  // 2. Impact Collision & Normal Impulse
  // J_n = m * (1 + e) * v_y1
  const normalImpulse = massKg * (1 + terrain.bounceElasticity) * vy1;

  // Contact linear speed at lowest tangent of boule: v_c = vx1 - omega * R
  // In backspin, omega opposes forward motion, so relative tangential velocity is (vx1 - omega * R)
  const contactVelocity = vx1 - (omega0 * radiusM);

  // 3. Ground Friction & Retro Roll Distance
  // Dynamic friction mu_k from terrain preset
  const muK = terrain.friction;
  const retroForce = muK * massKg * g;

  let retroDistanceM = 0;
  let retroSpeed = 0;
  const isReverseRoll = contactVelocity < 0;

  if (isReverseRoll) {
    // Relative reverse slip impulse converts angular momentum to linear backward momentum
    // v_r = (|v_c| * muK * 0.45) dampened by terrain elasticity
    const rawRetroSpeed = Math.abs(contactVelocity) * muK * (0.32 / (1 + terrain.bounceElasticity * 0.5));
    retroSpeed = Math.min(2.8, Math.max(0.05, rawRetroSpeed));
    // Rolling resistance coefficient mu_r is approximately 0.15 * muK + 0.08
    const muRoll = Math.max(0.12, muK * 0.42);
    // Retro distance: d_retro = v_r^2 / (2 * mu_r * g)
    retroDistanceM = (retroSpeed * retroSpeed) / (2 * muRoll * g);
    // Sand ground absorbs impact dramatically
    if (terrainId === 'sandy_ground') {
      retroDistanceM *= 0.15;
    } else if (terrainId === 'grass') {
      retroDistanceM *= 0.38;
    }
  }

  const retroDistanceCm = Math.round(retroDistanceM * 100);

  let explanation = '';
  if (isReverseRoll) {
    explanation = `เกิดแรงหมุนสกรูแบคย้อนกลับสำเร็จ (${rpm} RPM) ความเร็วผิวสัมผัส v_contact = ${contactVelocity.toFixed(2)} m/s เกิดแรงเสียดทานฉุดถอยหลัง ส่งผลให้ลูกหมุนดูดถอยหลังประมาณ ${retroDistanceCm} ซม.`;
  } else {
    explanation = `แรงหมุน Backspin (${rpm} RPM) ยังน้อยกว่าความเร็วแนวราบ (${vx1.toFixed(2)} m/s) ลูกยังคงเคลื่อนที่ไปข้างหน้าตามแรงเฉื่อย แต่ชะลอตัวลงอย่างรวดเร็ว`;
  }

  return {
    v0,
    angleDeg,
    omega0,
    rpm,
    contactVelocity,
    normalImpulse,
    retroForce,
    retroSpeed,
    retroDistanceM,
    retroDistanceCm,
    isReverseRoll,
    explanation
  };
}

export const DRILLS_DATA: DrillItem[] = [
  {
    id: 'drill-grouping',
    title: '1. การคุมกลุ่มลูกเข้าวงแคบ 50 ซม. (Target Grouping)',
    titleEn: 'Target Grouping & Cluster Control Drill',
    category: 'pointing',
    categoryLabel: 'การเข้าลูก (Pointing)',
    difficulty: 'beginner',
    difficultyLabel: 'มือใหม่ (Beginner)',
    difficultyColor: 'emerald',
    duration: '25 นาที',
    targetRepetitions: '12 ลูก (4 รอบ x 3 ลูก)',
    repetitionCount: 12,
    equipment: ['ลูกเปตอง 3 ลูก', 'แก่น 1 ลูก', 'เทปวัดระยะหรือเชือกผูก Ø 50 ซม.', 'ชอล์กขีดพื้น'],
    objective: 'ฝึกการโยนลูกให้เกาะกลุ่มในรัศมี 50 ซม. รอบแก่นที่ระยะ 6, 7, 8 และ 9 เมตร เพื่อสร้างความสม่ำเสมอของจังหวะปล่อยลูก',
    setup: 'วาดวงกลมรัศมี 50 ซม. (เส้นผ่านศูนย์กลาง 1 เมตร) รอบแก่น ตั้งระยะเริ่มต้นที่ 6 เมตร และขยับเพิ่มขึ้นทีละ 1 เมตรเมื่อผ่านเกณฑ์',
    steps: [
      'ยืนในวงกลมโยน จัดระเบียบท่ายืน หายใจเข้าลึกๆ และมองจุดตก Donnée ห่างจากแก่น 1-1.5 เมตร',
      'โยนลูกแรกเพื่อหาจังหวะแรงและสัมผัสพื้นสนาม (Tasting the ground)',
      'โยนลูกที่ 2 และ 3 โดยปรับน้ำหนักมือตามผลลัพธ์ของลูกแรก พยายามให้ลูกอยู่ในวงกลมเดียวกัน',
      'บันทึกจำนวนลูกที่เข้าวง 50 ซม. แล้วขยับระยะแก่นออกไปที่ 7m, 8m, 9m'
    ],
    scoringBenchmark: {
      bronze: 'เข้าวง 6-7 ใน 12 ลูก (50-60%)',
      silver: 'เข้าวง 8-9 ใน 12 ลูก (65-75%)',
      gold: 'เข้าวง 10-12 ใน 12 ลูก (80-100% มาตรฐานระดับแข่ง)'
    },
    coachingTips: [
      'อย่ามองที่ตัวแก่น ให้มองจุดตก Donnée บนพื้นสนามเสมอ',
      'รักษาแนวแกนสวิงของแขนให้ตรงเหมือนลูกตุ้มนาฬิกา ห้ามบิดลำตัว'
    ],
    videoDemo: {
      title: 'Pointing Masterclass: Grouping & Radius Control',
      channel: 'Petanque Pro Training Academy',
      duration: '4:15 นาที',
      videoQuery: 'petanque pointing target grouping drill',
      keyMoments: [
        '0:30 การตั้งวงกลมเป้าหมาย 50 ซม. และวัดระยะ',
        '1:45 การเลือกจุดตก Donnée ตามสภาพผิวสนาม',
        '3:10 การวิเคราะห์และปรับแรงโยนลูกที่ 2-3'
      ]
    }
  },
  {
    id: 'drill-backspin',
    title: '2. การสะบัด Backspin คุมจุดตกผ้าเป้าหมาย (Backspin Accuracy)',
    titleEn: 'Backspin Accuracy & High Lob Brake Stop Drill',
    category: 'pointing',
    categoryLabel: 'การเข้าลูก (Pointing)',
    difficulty: 'advanced',
    difficultyLabel: 'ชั้นสูง (Advanced)',
    difficultyColor: 'purple',
    duration: '30 นาที',
    targetRepetitions: '15 ลูก (5 รอบ x 3 ลูก)',
    repetitionCount: 15,
    equipment: ['ลูกเปตอง 3 ลูก', 'ผ้าขนหนูขนาดกระดาษ A4 หรือแผ่นยางบาง', 'แก่น 1 ลูก', 'สายวัด'],
    objective: 'ฝึกการโยนวิถีโด่งสูง (Plombée) พร้อมสะบัดข้อมือสร้างแรงหมุนถอยหลัง (Backspin) ตกบนผ้าเป้าหมายและหยุดทันทีโดยไม่วิ่งเกิน 30 ซม.',
    setup: 'วางผ้าเป้าหมายขนาด A4 ที่ระยะ 7.5 เมตรบนสนามหินกรวดหรือดินแข็ง วางแก่นไว้หลังผ้าประมาณ 40 ซม.',
    steps: [
      'ยืนทรงตัวให้มั่นคง ย่อเข่าเล็กน้อย สวิงแขนจากด้านหลังขึ้นสูงระดับศีรษะ',
      'ในจังหวะปล่อยลูก กระดกปลายนิ้วและข้อมือกลับหลังอย่างเฉียบคมเพื่อปั่น Backspin สูงสุด',
      'เป้าหมายคือให้ลูกตกสัมผัสเนื้อผ้าโดยตรง และแรงหมุนถอยหลังจะตรึงลูกให้นิ่งหรือถอยหลัง',
      'ลูกที่ตกบนผ้าแล้วกลิ้งไม่เกิน 30 ซม. นับเป็น 1 แต้มสมบูรณ์'
    ],
    scoringBenchmark: {
      bronze: 'ตกบนผ้าหรือห่างไม่เกิน 20 ซม. 7/15 ลูก',
      silver: 'ตกบนผ้าและหยุดนิ่ง 10/15 ลูก',
      gold: 'ตกบนผ้าและติดแน่นหยุดทันที 12-15/15 ลูก'
    },
    coachingTips: [
      'ปลดปล่อยหัวไหล่ให้ผ่อนคลาย อย่าเกร็งลำคอ เพราะจะทำให้ลูกเบี้ยวออกข้าง',
      'ใช้ลูกเปตองเนื้อนิ่ม (Very Soft 110 kg/mm²) จะช่วยดูดซับแรงตกกระแทกได้ชัดเจนที่สุด'
    ],
    videoDemo: {
      title: 'Mastering the High Lob (Plombée) Backspin Snap',
      channel: 'French Boules Institute',
      duration: '5:42 นาที',
      videoQuery: 'petanque plombee backspin technique training',
      keyMoments: [
        '0:45 สโลว์โมชันข้อมือในเสี้ยววินาทีปล่อยลูก',
        '2:15 เทคนิคการควบคุมความสูงมุมปล่อย 65-75 องศา',
        '4:00 การสาธิตเป้าหมายแผ่นผ้าและการเบรกหยุด'
      ]
    }
  },
  {
    id: 'drill-tir-au-fer',
    title: '3. การยิงโดนเหล็กตรงจุดกลางอากาศ (Tir au Fer Precision)',
    titleEn: 'Direct Hit Iron-on-Iron Precision Shooting Drill',
    category: 'shooting',
    categoryLabel: 'การยิงลูก (Shooting)',
    difficulty: 'intermediate',
    difficultyLabel: 'ระดับกลาง (Intermediate)',
    difficultyColor: 'amber',
    duration: '35 นาที',
    targetRepetitions: '20 ลูกยิง (4 ระยะ x 5 ลูก)',
    repetitionCount: 20,
    equipment: ['ลูกยิง 3-4 ลูก', 'ลูกเป้าหมาย 1 ลูก', 'ยางหรือวงแหวนชอล์กป้องกันลูกกระดอน', 'สายวัด'],
    objective: 'ฝึกการยิงลูกวิถีตรงกระทบผิวโลหะของลูกเป้าหมายโดยตรงในอากาศ (Iron-on-Iron) โดยลูกยิงต้องไม่กระทบพื้นก่อนเด็ดขาด',
    setup: 'วางลูกเป้าหมายที่ระยะ 7m, 8m, 9m, และ 10m ขีดเส้นขวางหน้าลูกเป้าหมาย 30 ซม. ลูกยิงที่ตกโดนพื้นหน้าเส้นจะถือว่าฟาวล์ (แม้จะแฉลบโดน)',
    steps: [
      'จัดระเบียบเท้าให้อยู่ในแนวตรงกับเป้าหมาย สายตาจับจ้องที่จุดศูนย์กลางของลูกเป้าหมาย',
      'สวิงแขนเป็นแนวระนาบตรง ปล่อยลูกที่ระดับสายตามุม 35-42 องศา',
      'สะบัดนิ้วเบาๆ เพื่อให้ลูกหมุนกลับหลังเล็กน้อย รักษาแนววิถีไม่ให้ส่าย',
      'ยิงระยะละ 5 ลูก จดบันทึกจำนวนครั้งที่โดนเหล็กกลางอากาศตรงจุด'
    ],
    scoringBenchmark: {
      bronze: 'ยิงโดนเหล็กตรง 10-12 ใน 20 ลูก (50-60%)',
      silver: 'ยิงโดนเหล็กตรง 14-16 ใน 20 ลูก (70-80%)',
      gold: 'ยิงโดนเหล็กตรง 17-20 ใน 20 ลูก (>85% มาตรฐานมือยิงระดับชาติ)'
    },
    coachingTips: [
      'อย่ายกศีรษะขึ้นก่อนลูกจะกระทบเป้าหมาย (Keep eye on target until impact)',
      'ปล่อยแขนให้เหวี่ยง Follow-through ไปข้างหน้าจนสุดแนว'
    ],
    videoDemo: {
      title: 'Tir au Fer: World Champion Precision Mechanics',
      channel: 'Elite Petanque Lab',
      duration: '6:10 นาที',
      videoQuery: 'petanque tir au fer shooting tutorial',
      keyMoments: [
        '1:10 การเล็งจุดศูนย์กลางลูกเป้าหมายด้วยแนวสายตา',
        '2:50 การส่งแรงสวิงจากแผ่นหลังและไหล่',
        '4:45 แบบฝึกหัดตัดการตกพื้นหน้าเป้าหมาย'
      ]
    }
  },
  {
    id: 'drill-carreau',
    title: '4. การฝึกทำลูกติด Carreau พักลูกในวง (Carreau Retention)',
    titleEn: 'Carreau Perfect Replacement & Staying Power Drill',
    category: 'shooting',
    categoryLabel: 'การยิงลูก (Shooting)',
    difficulty: 'master',
    difficultyLabel: 'ระดับเซียน (Master)',
    difficultyColor: 'rose',
    duration: '40 นาที',
    targetRepetitions: '15 ครั้ง',
    repetitionCount: 15,
    equipment: ['ลูกยิงเนื้อนิ่ม 3 ลูก', 'ลูกเป้าหมาย 1 ลูก', 'ชอล์กวาดวงกลมรัศมี 20 ซม.'],
    objective: 'ยิงชนกลางลูกเป้าหมายเต็มแรงเพื่อถ่ายทอดโมเมนตัม 100% ให้ลูกเดิมกระเด็นออก และลูกยิงหยุดนิ่งแทนที่เดิมภายในวงกลมรัศมี 20 ซม.',
    setup: 'วาดวงกลมชอล์กขนาดเส้นผ่านศูนย์กลาง 40 ซม. (รัศมี 20 ซม.) วางลูกเป้าหมายไว้ตรงกลาง ที่ระยะ 7.5 - 8.5 เมตร',
    steps: [
      'ทำสมาธิ หายใจออกช้าๆ เล็งที่จุดกึ่งกลางของลูกเหล็กเป้าหมาย',
      'สวิงแขนด้วยจังหวะที่นิ่งและลื่นไหล ปล่อยลูกพร้อมสะบัด Backspin ดูดพื้น',
      'ตรวจเช็กตำแหน่งลูกยิงหลังการปะทะ: หากลูกยิงหยุดอยู่ในวง 20 ซม. นับเป็น Carreau สมบูรณ์',
      'หากลูกยิงกระเด็นตามไปข้างหน้า แสดงว่ามุมปล่อยชันเกินไปหรือ Backspin ไม่พอ'
    ],
    scoringBenchmark: {
      bronze: 'ทำ Carreau ติดในวงได้ 4-5 ครั้งใน 15 ลูก',
      silver: 'ทำ Carreau ติดในวงได้ 7-9 ครั้งใน 15 ลูก',
      gold: 'ทำ Carreau ติดในวงได้ 11-15 ครั้ง (ระดับท็อป 10 โลก)'
    },
    coachingTips: [
      'หัวใจของ Carreau คือการชนแบบ Center-to-Center และแรงหมุน Backspin ช่วยดูดพื้น',
      'ใช้ลูกเหล็กคาร์บอนเนื้อนิ่มพิเศษ (Very Soft 110 kg/mm²) ผิวเรียบ 0 เส้น'
    ],
    videoDemo: {
      title: 'How to Shoot a Carreau: Physics & Muscle Snap',
      channel: 'Petanque Pro Channel',
      duration: '5:20 นาที',
      videoQuery: 'how to shoot a carreau petanque tutorial',
      keyMoments: [
        '0:50 การวิเคราะห์มุมปะทะเชิงฟิสิกส์',
        '2:30 การสะบัดนิ้วสร้างการซับแรงกระแทก',
        '4:10 ข้อผิดพลาดที่ทำให้ลูกกระดอนข้าม'
      ]
    }
  },
  {
    id: 'drill-donnee',
    title: '5. การคาลิเบรตจุดตก Donnée 4 ระยะ (Donnée Calibration)',
    titleEn: 'Donnée Calibration & Distance Muscle Memory Drill',
    category: 'tactical',
    categoryLabel: 'แทกติกและจุดตก (Tactical & Donnée)',
    difficulty: 'intermediate',
    difficultyLabel: 'ระดับกลาง (Intermediate)',
    difficultyColor: 'amber',
    duration: '25 นาที',
    targetRepetitions: '16 ลูก (4 ระยะ x 4 ลูก)',
    repetitionCount: 16,
    equipment: ['ลูกเปตอง 4 ลูก', 'แผ่นยางหรือมาร์กเกอร์จุดตก 4 จุด (ขนาด 20x20 ซม.)', 'สายวัด'],
    objective: 'สร้างความจำกล้ามเนื้อ (Muscle Memory) ในการส่งลูกให้ตกกระทบตรงจุด Donnée ที่ระยะ 5m, 6.5m, 8m, และ 9.5m อย่างแม่นยำ',
    setup: 'วางมาร์กเกอร์จุดตก 4 จุดตามแนวระยะทาง โดยไม่ต้องวางแก่น เพื่อให้สมาธิทั้งหมดจดจ่อที่จุดกระทบพื้นเท่านั้น',
    steps: [
      'โยน 4 ลูกแรกไปยังมาร์กเกอร์ระยะ 5 เมตร โดยเน้นให้ลูกกระทบแผ่นมาร์กเกอร์โดยตรง',
      'สลับไปยังมาร์กเกอร์ระยะ 6.5 เมตร สังเกตการเพิ่มแรงส่งจากหัวไหล่',
      'ทำซ้ำที่ระยะ 8 เมตร และ 9.5 เมตร โดยรักษาจังหวะการสวิงให้สม่ำเสมอ',
      'บันทึกว่าแต่ละระยะมีลูกตกกระทบมาร์กเกอร์กี่ลูก'
    ],
    scoringBenchmark: {
      bronze: 'ตกตรงจุดมาร์กเกอร์ 8-9 ใน 16 ลูก (50-55%)',
      silver: 'ตกตรงจุดมาร์กเกอร์ 11-13 ใน 16 ลูก (70-80%)',
      gold: 'ตกตรงจุดมาร์กเกอร์ 14-16 ใน 16 ลูก (>85%)'
    },
    coachingTips: [
      'อย่ามองไปไกลเกิน ให้สายตาล็อกที่จุดมาร์กเกอร์จนกว่าลูกจะตกกระทบ',
      'หากลูกตกเลยจุด ให้เช็กจังหวะการคลายข้อมือ อาจปล่อยลูกช้าเกินไป'
    ],
    videoDemo: {
      title: 'Donnée Calibration: The Secret to Consistent Pointing',
      channel: 'Boules Tactics Review',
      duration: '4:50 นาที',
      videoQuery: 'petanque donnee landing point drills',
      keyMoments: [
        '0:35 ทำไมการมองจุดตกถึงสำคัญกว่าการมองแก่น',
        '2:00 การปรับแรงเหวี่ยงแขนตามระยะทาง',
        '3:40 การซ้อมด้วยมาร์กเกอร์เป้าแผ่นเรียบ'
      ]
    }
  },
  {
    id: 'drill-pressure',
    title: '6. การจำลองสถานการณ์บีบคั้นแต้ม 12-12 (Pressure 12-12 Endgame)',
    titleEn: '12-12 Match Point High-Pressure Simulation Drill',
    category: 'pressure',
    categoryLabel: 'สถานการณ์บีบคั้น (Pressure Situation)',
    difficulty: 'advanced',
    difficultyLabel: 'ชั้นสูง (Advanced)',
    difficultyColor: 'purple',
    duration: '30 นาที',
    targetRepetitions: '6 สถานการณ์จำลอง',
    repetitionCount: 6,
    equipment: ['ลูกเปตอง 6 ลูก', 'แก่น 1 ลูก', 'นาฬิกาจับเวลา 60 วินาทีตามกติกา FIPJP'],
    objective: 'ฝึกการตัดสินใจและควบคุมอัตราการเต้นของหัวใจในสถานการณ์แต้มตัดสิน 12 ต่อ 12 ที่เหลือลูกเล่นเพียง 1 ลูกเพื่อชนะหรือรอดพ้นความพ่ายแพ้',
    setup: 'จัดวางสถานการณ์บนสนาม 6 รูปแบบ: เช่น คู่แข่งได้แต้มนำ 2 ลูกหน้าแก่น 20 ซม., แก่นถูกดันไปติดเส้นหลังสนาม, ลูกการ์ดคู่แข่งขวางทางเข้า',
    steps: [
      'เริ่มจับเวลา 60 วินาทีตามกติกา FIPJP',
      'เดินสำรวจสภาพพื้นสนามรอบแก่น เลือกระหว่าง "ยิงเคลียร์" หรือ "เข้าแทรก"',
      'ยืนในวงกลม สูดหายใจลึกๆ 2 ครั้ง ลดความตึงเครียดของกล้ามเนื้อแขน',
      'ปล่อยลูกเพื่อแก้สถานการณ์ บันทึกผลลัพธ์ว่าเปลี่ยนเป็นฝ่ายชนะหรือไม่'
    ],
    scoringBenchmark: {
      bronze: 'แก้สถานการณ์สำเร็จ 3 ใน 6 แมตช์พอยต์ (50%)',
      silver: 'แก้สถานการณ์สำเร็จ 4 ใน 6 แมตช์พอยต์ (66%)',
      gold: 'แก้สถานการณ์สำเร็จ 5-6 ใน 6 แมตช์พอยต์ (นักกีฬาสภาพจิตใจเหล็ก)'
    },
    coachingTips: [
      'ในสถานการณ์กดดัน ร่างกายมักเร่งจังหวะเร็วขึ้น จงดึงจังหวะให้ช้าลงและมีสมาธิ',
      'เมื่อตัดสินใจเลือกแทกติกแล้ว จงเชื่อมั่น 100% ห้ามลังเลในเสี้ยววินาทีสวิง'
    ],
    videoDemo: {
      title: 'Clutch Moments: How Pro Players Handle 12-12 Endgames',
      channel: 'World Petanque Highlights',
      duration: '7:15 นาที',
      videoQuery: 'petanque match point 12-12 tactical decision',
      keyMoments: [
        '1:15 การจัดการเวลา 60 วินาทีและการอ่านทางสนาม',
        '3:30 การควบคุมลมหายใจและความแม่นยำภายใต้ความกดดัน',
        '5:50 ตัวอย่างช็อตระดับตำนานในนัดชิงชนะเลิศโลก'
      ]
    }
  },
  {
    id: 'drill-screw-back',
    title: '7. การยิงสกรูแบ็คถอยหลังกินแต้ม (Tir Rétro Mastery)',
    titleEn: 'Tir Rétro Screw Back Precision & Bite Drill',
    category: 'shooting',
    categoryLabel: 'การยิงลูก (Shooting)',
    difficulty: 'master',
    difficultyLabel: 'ระดับเซียน (Master)',
    difficultyColor: 'amber',
    duration: '35 นาที',
    targetRepetitions: '15 ลูก (5 ชุด x 3 ลูก)',
    repetitionCount: 15,
    equipment: ['ลูกเปตอง 4 ลูก (1 ลูกเป้า, 3 ลูกยิง)', 'เทปวัดระยะ', 'ชอล์กขีดโซนถอยหลัง 40-120 ซม.'],
    objective: 'ฝึกการเหวี่ยงลูกมุม 35° พร้อมสะบัดปลายนิ้วสร้าง Extreme Backspin (>380 RPM) เพื่อชนลูกเป้าหมายตรงกลางและลูกยิงหมุนถอยหลัง 40-100 ซม.',
    setup: 'ตั้งลูกเป้าหมายที่ระยะ 8 เมตร วาดเส้นเป้าหมาย และขีดโซนคะแนนถอยหลังห่างจากจุดปะทะ 40 ถึง 100 ซม. ย้อนกลับมาทางวงกลมโยน',
    steps: [
      'ยืนจัดระเบียบในวงกลม เล็งที่จุดกึ่งกลางลูกเป้าหมายในแนวระนาบตรง',
      'สวิงแขนเป็นวงเรียบ ปล่อยลูกที่มุม 32°-38° พร้อมสะบัดรูดปลายนิ้วทั้งสี่ขึ้นเต็มแรง',
      'ลูกต้องปะทะลูกเป้าหมายเต็มแรง (Fer-à-fer) เพื่อถ่ายโอนโมเมนตัมแนวราบทั้งหมด',
      'สังเกตการกัดหน้าดินและการหมุนถอยหลัง (Retro Roll) บันทึกระยะถอยหลังเป็นเซนติเมตร'
    ],
    scoringBenchmark: {
      bronze: 'ยิงโดนเป้าหมาย 8/15 ลูก และมีลูกหมุนถอยหลังอย่างน้อย 3 ลูก',
      silver: 'ยิงโดนเป้าหมาย 11/15 ลูก ถอยหลังเข้าโซน 40-80 ซม. ได้ 6 ลูก',
      gold: 'ยิงโดนเป้าหมาย 13/15 ลูก ถอยหลังดูดกลับ 50-100 ซม. ได้ 9 ลูกขึ้นไป (มาตรฐานระดับทีมชาติ)'
    },
    coachingTips: [
      'อย่าเหวี่ยงแขนสูงเกินไป เพราะวิถีโด่งจะทำให้ลูกกระดอนขึ้นฟ้าแทนที่จะกัดหน้าดินถอยหลัง',
      'สนามดินบดแน่น (Dry Clay) คือพื้นผิวที่เห็นผลการถอยหลังได้สวยงามที่สุด'
    ],
    videoDemo: {
      title: 'Tir Rétro Masterclass: How to Shoot Screw Back in Petanque',
      channel: 'Petanque Pro World Tour',
      duration: '6:12 นาที',
      videoQuery: 'petanque tir retro screw back Dylan Rocher technique',
      keyMoments: [
        '0:45 สรีระการจับลูก 4 นิ้วชิดและการผ่อนแรงนิ้วโป้ง',
        '2:05 การสะบัดปลายนิ้วในเสี้ยววินาทีปล่อยลูก (380+ RPM Snap)',
        '3:40 จังหวะการปะทะ Fer-à-fer และการกัดถอยหลัง'
      ]
    }
  },
  {
    id: 'drill-blind-spot-pocket',
    title: '8. การวางลูกลงหลุมมุมอับสายตาหลังแนวบล็อก (Blind Spot Pocket Pointing)',
    titleEn: 'Defensive Blind Spot Pocket & Anti-Shooting Pointing Drill',
    category: 'defensive',
    categoryLabel: '🛡️ วางมุมอับ (Tactical Defensive)',
    difficulty: 'advanced',
    difficultyLabel: 'ชั้นสูง (Advanced)',
    difficultyColor: 'indigo',
    duration: '35 นาที',
    targetRepetitions: '15 ลูก (5 ชุด x 3 ลูก)',
    repetitionCount: 15,
    equipment: ['ลูกเปตอง 3 ลูก', 'แก่น 1 ลูก', 'ลูกบล็อกคู่แข่ง (Obstacle Boule) 1 ลูก', 'เทปสีหรือชอล์กขีดกรอบมุมอับ 30x30 ซม.'],
    objective: 'ฝึกการส่งลูกวิถีโด่งโค้ง (High Lob with Hook Spin) ให้ตกลงใน "หลุมมุมอับสายตา (Blind Spot Pocket)" ด้านหลังลูกบล็อกของคู่แข่ง เพื่อตัดแนวเล็งยิงตรง (Line of Sight) ของมือยิงคู่แข่ง 100% ทำให้คู่แข่งยิงตรงไม่ได้และเข้าลูกตรงไม่ลง',
    setup: 'วางแก่นที่ระยะ 8.0 เมตร ตั้งลูกบล็อกคู่แข่งไว้ที่ 7.4 เมตรตรงแนวเส้นตรง และกำหนดโซนเป้าหมายมุมอับขนาด 30x30 ซม. หลังลูกบล็อกเยื้องขวา 15-25 ซม.',
    visualSetup: {
      courtDimensions: 'สนามมาตรฐาน 4.0 x 15.0 เมตร, วงกลมยืนโยน 50 ซม.',
      jackDistance: 'แก่นระยะ 8.0 เมตร กลางสนาม',
      opponentObstacle: 'ลูกบล็อกคู่แข่ง (Opponent Front Guard) ที่ระยะ 7.4 เมตร บังวิถียิงตรง',
      targetBlindSpot: 'โซนหลุมมุมอับ (Blind Spot Pocket) ขนาด Ø 30 ซม. ด้านหลังลูกบล็อกเยื้อง 20 ซม.',
      tacticalPrinciple: 'กฎเหล็กมุมอับ: "อย่าวางแค่ให้ชิดแก่น แต่วางในจุดที่คู่แข่งไม่กล้ายิงและเข้าสู้ยาก" เมื่อลูกของเราอยู่หลังลูกบล็อกคู่แข่ง มือยิงคู่แข่งไม่กล้ายิง Tir au fer เพราะหากพลาดเพียงมิลลิเมตรเดียวจะชนลูกตัวเองดันให้เราได้แต้มเพิ่ม',
      bulletNotes: [
        'แนวเล็งยิงตรง (Direct Line of Fire) ถูกลูกบล็อกคู่แข่งบังมิดชิด',
        'หากคู่แข่งฝืนยิง มีโอกาสกระดอนแฉลบโดนลูกตัวเองเปิดทางให้เราเก็บ 2-3 แต้ม',
        'ลูกของเราอยู่ในระยะ 20-30 ซม. จากแก่น ยึดแต้มนำอย่างปลอดภัย'
      ]
    },
    steps: [
      'ยืนในวงกลม สังเกตแนวเส้นตรงระหว่างวงกลม ลูกบล็อกคู่แข่ง และแก่น',
      'เลือกจุดตก Donnée ด้านข้างลูกบล็อกประมาณ 20 ซม. พร้อมสะบัดข้อมือสร้างไซด์สปินให้ลูกไหลม้วนเข้าด้านหลัง',
      'ปล่อยลูกที่มุม 55°-65° (High Lob) ข้ามสิ่งกีดขวาง ตกลงบนโซนหลุมมุมอับ',
      'ตรวจเช็กตำแหน่งลูก: หากลูกหยุดอยู่หลังลูกบล็อกในระยะห่างแก่น < 30 ซม. นับ 1 แต้มสมบูรณ์'
    ],
    scoringBenchmark: {
      bronze: 'เข้าโซนมุมอับ 7-8 ใน 15 ลูก (50%)',
      silver: 'เข้าโซนมุมอับและบังวิถียิงสำเร็จ 10-12 ใน 15 ลูก (70-80%)',
      gold: 'เข้าโซนมุมอับชิดแก่น < 25 ซม. 13-15 ลูก (มาตรฐานนักกีฬาทีมชาติ)'
    },
    coachingTips: [
      'ใช้การสวิงแขนเยื้องข้างเล็กน้อย (Hook Release) เพื่อให้ลูกหมุนเลี้ยวเข้าหลังลูกการ์ด',
      'อย่าเข้าตรงๆ เพราะหากลูกสะกิดลูกการ์ดคู่แข่ง จะทำให้ลูกคู่แข่งวิ่งเข้าหาแก่นแทน'
    ],
    videoDemo: {
      title: 'Tactical Defensive Pointing: Placing Boules in the Blind Spot',
      channel: 'Petanque Pro Tactical Masterclass',
      duration: '5:30 นาที',
      videoQuery: 'petanque defensive pointing blind spot tactics',
      keyMoments: [
        '0:40 ผังการจัดวางมุมอับและแนววิถียิงที่ถูกบล็อก',
        '2:15 เทคนิคการสะบัดลูกแบบ High Lob Hook สู่มุมอับ',
        '4:00 การวิเคราะห์ทางจิตวิทยา: ทำไมมือยิงคู่แข่งถึงกลัวมุมนี้'
      ]
    }
  },
  {
    id: 'drill-anti-displacement-guard',
    title: '9. การวางลูกดักการ์ดกันการสะกิดแก่น (Anti-Displacement Buffer Guard)',
    titleEn: 'Defensive Buffer Boule & Jack-Displacement Shield Drill',
    category: 'defensive',
    categoryLabel: '🛡️ วางมุมอับ (Tactical Defensive)',
    difficulty: 'master',
    difficultyLabel: 'ระดับเซียน (Master)',
    difficultyColor: 'purple',
    duration: '30 นาที',
    targetRepetitions: '12 ลูก (4 ชุด x 3 ลูก)',
    repetitionCount: 12,
    equipment: ['ลูกเปตอง 3 ลูก', 'แก่น 1 ลูก', 'ลูกคู่แข่งจ่อหน้าแก่น 1 ลูก', 'สายวัดระยะ'],
    objective: 'ฝึกการส่งลูกวางลึกหลังแก่นระยะ 35-50 ซม. เพื่อทำหน้าที่เป็น "ลูกกันกระแทก (Buffer Guard)" ดักทางไม่ให้คู่แข่งยิงสะกิดแก่นหนี (Déplacer le But) หากแก่นถูกสะกิดถอยหลัง จะวิ่งเข้าหาลูกเราทันที กลายเป็น 2-3 แต้มให้กับทีมเรา',
    setup: 'วางแก่นที่ระยะ 7.5 เมตร และวางลูกคู่แข่งจ่อหน้าแก่นระยะ 15 ซม. ฝึกโยนลูกข้ามไปตกหลังแก่นระยะ 35-50 ซม. ในแนวเส้นลึก',
    visualSetup: {
      courtDimensions: 'สนามมาตรฐาน 4.0 x 15.0 เมตร',
      jackDistance: 'แก่นระยะ 7.5 เมตร',
      opponentObstacle: 'ลูกคู่แข่งจ่อชิดหน้าแก่น 15 ซม. กุมแต้มหลัก',
      targetBlindSpot: 'โซนแนวรับหลังแก่น (Buffer Pocket) ระยะ 35-50 ซม.',
      tacticalPrinciple: 'เปลี่ยนการเสียเปรียบเป็นแต้มทอง: เมื่อคู่แข่งจ่อชิดแก่นมาก การเข้าสู้ตรงหน้าเสี่ยงดันลูกคู่แข่งให้ดีขึ้น การวางลูกดักหลังจะทำให้การยิงสะกิดแก่นของคู่แข่งกลายเป็นการส่งแต้มให้เราทันที',
      bulletNotes: [
        'ป้องกันการยิงดันแก่นหนี (Anti-Déplacer le But Shield)',
        'ทำหน้าที่เป็นเบาะหยุดลูก (Backstop Cushion)',
        'คู่แข่งถูกจำกัดไม่ให้ทำแต้มเกิน 1 แต้มใน Mène นี้'
      ]
    },
    steps: [
      'ประเมินว่าลูกคู่แข่งอยู่ชิดแก่นเกินกว่าจะเข้าแย่งแต้มด้านหน้าได้อย่างปลอดภัย',
      'เลือกจุดตก Donnée เลยแก่นไปประมาณ 30 ซม. ด้วยวิถี Half-lob สวิงนิ่ง',
      'ปล่อยลูกให้นุ่มนวล ให้ลูกกระดอนเบาๆ และหยุดนิ่งในโซนหลังแก่นระยะ 35-50 ซม.',
      'ทดสอบจำลองสะกิดแก่น: หากแก่นถอยหลังแล้วชนลูกเราหยุดนิ่ง ถือว่าจัดโซนสำเร็จ'
    ],
    scoringBenchmark: {
      bronze: 'วางลูกหลังแก่นในระยะ 35-60 ซม. 6-7 ใน 12 ลูก',
      silver: 'วางลูกหลังแก่นในระยะ 35-50 ซม. ตรงแนว 8-9 ใน 12 ลูก',
      gold: 'วางลูกหลังแก่นระยะ 35-45 ซม. แม่นยำ 10-12 ลูก (ระดับปรมาจารย์แทกติก)'
    },
    coachingTips: [
      'อย่าให้ลูกเลยหลังแก่นเกิน 60 ซม. เพราะจะไม่สามารถดักรับแก่นได้ทัน',
      'รักษาความสูงของการโยนให้อยู่ในระดับ Half-lob เพื่อไม่ให้ลูกกระดอนแฉลบไกล'
    ],
    videoDemo: {
      title: 'How to Counter Jack Displacement: Defensive Buffer Tactics',
      channel: 'Petanque Pro Tactical Masterclass',
      duration: '4:45 นาที',
      videoQuery: 'petanque anti deplacer le but defense tactics',
      keyMoments: [
        '0:30 กลยุทธ์การรับมือเมื่อคู่แข่งจ่อแก่นระยะ < 15 ซม.',
        '1:50 การเลือก Donnée ด้านหลังแก่น',
        '3:20 ผลลัพธ์เมื่อคู่แข่งพยายามยิงกระทุ้งแก่น'
      ]
    }
  }
];

export interface LiveChannel {
  name: string;
  platform: 'youtube' | 'facebook' | 'tv' | 'web';
  badge: string;
  url: string;
  schedule: string;
}

export interface TournamentItem {
  id: string;
  title: string;
  titleEn: string;
  scope: 'domestic' | 'international';
  category: 'open' | 'major' | 'youth';
  status: 'live' | 'upcoming' | 'concluded';
  date: string;
  location: string;
  country: string;
  organizer: string;
  format: string;
  prizePool: string;
  surface: string;
  highlights: string[];
  liveChannels: LiveChannel[];
  detailsUrl?: string;
  streamNotes?: string;
}

// Current date anchor for tournament filtering (October 24, 2026)
export const CURRENT_PETANQUE_DATE = '2026-10-24';

export const TOURNAMENT_DATES: Record<string, { start: string; end: string }> = {
  'th-open-laemchabang': { start: '2026-10-25', end: '2026-10-26' },
  'fipjp-world-championship': { start: '2026-10-22', end: '2026-10-26' },
  'th-national-championship': { start: '2026-11-20', end: '2026-11-24' },
  'bangkok-petanque-grand-prix': { start: '2026-11-28', end: '2026-11-29' },
  'thailand-national-games': { start: '2026-12-09', end: '2026-12-19' },
  'sea-games-petanque': { start: '2026-12-09', end: '2026-12-20' },
  'royal-princess-cup': { start: '2026-12-12', end: '2026-12-14' },
  'chiangmai-lanna-open': { start: '2027-01-09', end: '2027-01-10' },
  'asian-petanque-championship': { start: '2027-02-18', end: '2027-02-22' },
  'singapore-open': { start: '2027-03-27', end: '2027-03-29' },
  'marseillaise-open': { start: '2027-07-04', end: '2027-07-08' },
  'masters-de-petanque': { start: '2027-07-15', end: '2027-07-19' },
};

/**
 * Detects country name or ISO code and prepends the appropriate flag emoji
 * (e.g. 'ประเทศไทย' / 'TH' -> '🇹🇭 ประเทศไทย', 'ฝรั่งเศส' / 'FR' -> '🇫🇷 ฝรั่งเศส', 'สิงคโปร์' / 'SG' -> '🇸🇬 สิงคโปร์')
 */
export const detectAndPrependCountryFlag = (countryInput: string): string => {
  if (!countryInput) return '🌍 นานาชาติ';
  const clean = countryInput.replace(/[\u{1F1E6}-\u{1F1FF}]{2}|[🇹🇭🇫🇷🇸🇬🇪🇺🌍🏳️]/gu, '').trim();

  if (/ไทย|thailand|\bth\b/i.test(countryInput)) {
    return clean ? (clean.includes('ไทย') ? `🇹🇭 ${clean}` : `🇹🇭 ประเทศไทย (${clean})`) : '🇹🇭 ประเทศไทย';
  }
  if (/ฝรั่งเศส|france|\bfr\b/i.test(countryInput)) {
    return clean ? (clean.includes('ฝรั่งเศส') ? `🇫🇷 ${clean}` : `🇫🇷 ฝรั่งเศส`) : '🇫🇷 ฝรั่งเศส';
  }
  if (/สิงคโปร์|singapore|\bsg\b/i.test(countryInput)) {
    return clean ? (clean.includes('สิงคโปร์') ? `🇸🇬 ${clean}` : `🇸🇬 สิงคโปร์`) : '🇸🇬 สิงคโปร์';
  }
  if (/ยุโรป|europe|\beu\b/i.test(countryInput)) {
    return clean ? (clean.includes('ยุโรป') ? `🇪🇺 ${clean}` : `🇪🇺 ทวีปยุโรป`) : '🇪🇺 ทวีปยุโรป';
  }
  return `🌍 ${clean || countryInput}`;
};

export const TOURNAMENTS_DATA: TournamentItem[] = [
  {
    id: 'th-open-laemchabang',
    title: 'เปตองการกุศล ท่าเรือแหลมฉบัง โอเพ่น ครั้งที่ 16',
    titleEn: '16th Laem Chabang Charity Petanque Open Championship',
    scope: 'domestic',
    category: 'open',
    status: 'live',
    date: '25 - 26 ตุลาคม 2026 (แข่งขัน & ถ่ายทอดสดวันนี้ 🔴)',
    location: 'สนามกีฬาเปตอง การท่าเรือแหลมฉบัง อ.ศรีราชา จ.ชลบุรี',
    country: '🇹🇭 ประเทศไทย',
    organizer: 'การท่าเรือแห่งประเทศไทย ร่วมกับ ชมรมเปตองแหลมฉบัง',
    format: 'ทีม 3 คนทั่วไป (Open Triples) ไม่จำกัดเพศ/วัย & ทีมเยาวชน U17',
    prizePool: 'เงินรางวัลรวมกว่า 250,000 บาท พร้อมถ้วยเกียรติยศ',
    surface: 'สนามหินกรวดร่วนละเอียดผสมดินแน่น (Gravel & Fine Stone)',
    highlights: [
      'ทัวร์นาเมนต์โอเพ่นที่มีทีมส่งแข่งขันมากที่สุดในภาคตะวันออกกว่า 180 ทีม',
      'เปิดรับนักกีฬาเปตองทุกสังกัด ทั้งมืออาชีพ ชมรม และประชาชนทั่วไป',
      'มีถ่ายทอดสดระบบ Multi-Camera คมชัดระดับ Full HD ตลอดทั้งวัน'
    ],
    liveChannels: [
      {
        name: 'Facebook Live: ชมรมเปตองท่าเรือแหลมฉบัง',
        platform: 'facebook',
        badge: 'Facebook Live',
        url: 'https://www.facebook.com/search/top?q=ชมรมเปตองท่าเรือแหลมฉบัง',
        schedule: 'รอบ 32 ทีม ถึง ชิงชนะเลิศ (09:00 - 18:30 น.)'
      },
      {
        name: 'YouTube: Petanque Thailand Channel',
        platform: 'youtube',
        badge: 'YouTube Live 4K',
        url: 'https://www.youtube.com/results?search_query=เปตองท่าเรือแหลมฉบัง+โอเพ่น',
        schedule: 'ถ่ายทอดสดคู่เอกประจำสนาม 1 และสนาม 2'
      }
    ],
    streamNotes: 'สัญญาณสดพร้อมผู้บรรยายกีฬาเปตองมืออาชีพและสรุปสกอร์สดแต้มต่อแต้ม'
  },
  {
    id: 'fipjp-world-championship',
    title: 'การแข่งขันเปตองชิงแชมป์โลก ครั้งที่ 51 (FIPJP World Championship)',
    titleEn: '51st FIPJP World Petanque Championship',
    scope: 'international',
    category: 'major',
    status: 'live',
    date: '22 - 26 ตุลาคม 2026 (รอบไฟนอลสัปดาห์นี้ 🔴)',
    location: 'Le Zénith de Dijon, เมืองดีฌง, ประเทศฝรั่งเศส',
    country: '🇫🇷 ฝรั่งเศส',
    organizer: 'สหพันธ์เปตองและลูกบูลนานาชาติ (FIPJP)',
    format: 'ทีม 3 คน (Triplets), ชายเดี่ยว/หญิงเดี่ยว, และ Precision Shooting',
    prizePool: 'ตำแหน่งแชมป์โลกอย่างเป็นทางการ + ถ้วยแชมป์โลก FIPJP Trophee',
    surface: 'สนามสังเคราะห์ในร่มระดับเวิลด์คลาส (Compacted Indoor Arena)',
    highlights: [
      'ทัพนักกีฬาเปตองทีมชาติไทย แชมป์โลกหญิงและแชมป์ชูตติ้งโลก ลงดวลกับฝรั่งเศสและมาดากัสการ์',
      'รวมนักกีฬากว่า 48 ประเทศทั่วโลกที่ผ่านการคัดเลือก',
      'สัญญาณถ่ายทอดสดระดับสากลพร้อมภาพช้า Super Slow-motion วิเคราะห์รอยตก'
    ],
    liveChannels: [
      {
        name: 'FIPJP Web TV Official (สหพันธ์เปตองโลก)',
        platform: 'web',
        badge: 'Official Web TV',
        url: 'https://fipjp.org',
        schedule: 'ถ่ายทอดสดรอบน็อกเอาต์ 16 ทีม ถึง รอบชิงชนะเลิศ (14:00 - 23:00 น. เวลาไทย)'
      },
      {
        name: 'Olympic Channel (Olympics.com / Live Sports)',
        platform: 'web',
        badge: 'Olympic Channel',
        url: 'https://olympics.com',
        schedule: 'รอบชิงเหรียญทอง Precision Shooting และ ทีม 3 คน'
      },
      {
        name: 'T Sports 7 (ทีวีดิจิทัลช่อง 7 & แอปพลิเคชัน)',
        platform: 'tv',
        badge: 'T Sports 7 HD',
        url: 'https://tsports7.com',
        schedule: 'ถ่ายทอดสดคู่ที่มีนักกีฬาทีมชาติไทยลงสนาม พร้อมพากย์ไทย'
      },
      {
        name: 'L\'Équipe Live (ฝรั่งเศส)',
        platform: 'tv',
        badge: 'L\'Équipe Live',
        url: 'https://www.lequipe.fr',
        schedule: 'ถ่ายทอดสดทุกแมตช์ของสาย A และสายบน'
      }
    ],
    streamNotes: 'รองรับการรับชมทั้งบนมือถือ เว็บเบราว์เซอร์ และสมาร์ททีวีสัญญาณคมชัด'
  },
  {
    id: 'th-national-championship',
    title: 'การแข่งขันเปตองชิงชนะเลิศแห่งประเทศไทย ประจำปี 2567-2568',
    titleEn: 'Thailand National Petanque Championship',
    scope: 'domestic',
    category: 'major',
    status: 'upcoming',
    date: '20 - 24 พฤศจิกายน 2026',
    location: 'สนามเปตองในร่ม ศูนย์ฝึกกีฬาแห่งชาติ คลอง 6 จ.ปทุมธานี',
    country: '🇹🇭 ประเทศไทย',
    organizer: 'สมาคมกีฬาเปตองแห่งประเทศไทย ในพระราชูปถัมภ์ฯ',
    format: 'ชายเดี่ยว, หญิงเดี่ยว, คู่ชาย, คู่หญิง, ทีม 3 คน, และ ชูตติ้ง (Shooting)',
    prizePool: 'ถ้วยเกียรติยศแห่งประเทศไทย + สิทธิ์ติดทีมชาติไทยลุยศึกชิงแชมป์เอเชียและซีเกมส์',
    surface: 'ดินอัดแน่นผสมกรวดร่วน (Clay & Crushed Stone)',
    highlights: [
      'การแข่งขันระดับชาติที่ใหญ่ที่สุดของไทย คัดเลือกยอดฝีมือเป็นตัวแทนทีมชาติไทย',
      'รวมดาวรุ่งจากทุกสโมสรและสังกัดกองทัพ ตำรวจ มหาวิทยาลัย และภูมิภาค',
      'ใช้กติกามาตรฐาน FIPJP เต็มรูปแบบ มีกรรมการผู้ตัดสินระดับนานาชาติ'
    ],
    liveChannels: [
      {
        name: 'T Sports 7 (ทีวีดิจิทัล ช่อง 7 & AIS Play)',
        platform: 'tv',
        badge: 'T Sports 7 TV',
        url: 'https://tsports7.com',
        schedule: 'ถ่ายทอดสดรอบรองชนะเลิศ และชิงชนะเลิศ 13:00 - 17:30 น.'
      },
      {
        name: 'YouTube: สมาคมกีฬาเปตองแห่งประเทศไทยฯ Official',
        platform: 'youtube',
        badge: 'YouTube Live',
        url: 'https://www.youtube.com/results?search_query=สมาคมกีฬาเปตองแห่งประเทศไทย',
        schedule: 'สตรีมสดรอบ 32 ทีม ถึง รอบ 8 ทีมสุดท้ายตลอดวัน'
      },
      {
        name: 'Facebook Live: สมาคมกีฬาเปตองแห่งประเทศไทยฯ',
        platform: 'facebook',
        badge: 'Facebook Live',
        url: 'https://www.facebook.com/PetanqueAssocTH',
        schedule: 'รายงานบรรยากาศสด สัมภาษณ์หลังเกม และพิธีมอบรางวัล'
      }
    ]
  },
  {
    id: 'marseillaise-open',
    title: 'มงเดียล ลา มาร์กเซแยส อา เปตอง 2027 (Mondial La Marseillaise à Pétanque)',
    titleEn: 'Mondial La Marseillaise à Pétanque 2027 (World’s Biggest Open)',
    scope: 'international',
    category: 'open',
    status: 'upcoming',
    date: '4 - 8 กรกฎาคม 2027',
    location: 'Parc Borély & Plages du Prado, เมืองมาร์เซย์, ประเทศฝรั่งเศส',
    country: '🇫🇷 ฝรั่งเศส',
    organizer: 'La Marseillaise Newspaper ร่วมกับ สหพันธ์เปตองฝรั่งเศส (FFPJP)',
    format: 'Open Triplette (ทีม 3 คน ไม่จำกัดระดับฝีมือ ไม่จำกัดสัญชาติ)',
    prizePool: 'เงินรางวัลรวมกว่า €38,000 + ถ้วยเกียรติยศ La Marseillaise',
    surface: 'ดินลูกรัง หินกรวดชายหาด และลานหญ้าปาร์คโบเรลี',
    highlights: [
      'ทัวร์นาเมนต์เปตองประเภทโอเพ่นที่ใหญ่และมีชื่อเสียงที่สุดในโลก มีผู้เล่นกว่า 15,000 คน',
      'ทุกคนสามารถสมัครเข้าแข่งได้ ไม่ว่าจะเป็นแชมป์โลก ดารา หรือประชาชนทั่วไป',
      'บรรยากาศเทศกาลเปตองระดับโลกริมทะเลเมดิเตอร์เรเนียน มีผู้ชมกว่า 150,000 คน'
    ],
    liveChannels: [
      {
        name: 'France 3 (สถานีโทรทัศน์แห่งชาติฝรั่งเศส)',
        platform: 'tv',
        badge: 'France Télévisions',
        url: 'https://france3-regions.francetvinfo.fr/provence-alpes-cote-d-azur',
        schedule: 'ถ่ายทอดสดรอบ 16 ทีมสุดท้าย ถึง รอบชิงชนะเลิศ'
      },
      {
        name: 'France.tv Sport (Web & Streaming Portal)',
        platform: 'web',
        badge: 'France.tv Live',
        url: 'https://www.france.tv/sport',
        schedule: 'สัญญาณสด HD ออนไลน์ ครอบคลุม 4 คอร์ทหลักตลอดวัน'
      },
      {
        name: 'YouTube: France 3 Provence-Alpes-Côte d\'Azur',
        platform: 'youtube',
        badge: 'YouTube Live',
        url: 'https://www.youtube.com/results?search_query=Mondial+La+Marseillaise+Petanque',
        schedule: 'ไฮไลต์สดและสัมภาษณ์สดนักกีฬาชั้นนำ'
      },
      {
        name: 'Boulistenaute Web TV',
        platform: 'web',
        badge: 'Boulistenaute TV',
        url: 'https://www.boulistenaute.com',
        schedule: 'เจาะลึกช็อตเด็ด Carreau และบทวิเคราะห์แฟนเปตองสากล'
      }
    ]
  },
  {
    id: 'royal-princess-cup',
    title: 'การแข่งขันเปตองชิงถ้วยพระราชทาน สมเด็จพระกนิษฐาธิราชเจ้า กรมสมเด็จพระเทพรัตนราชสุดาฯ สยามบรมราชกุมารี โอเพ่น',
    titleEn: 'Her Royal Highness Princess Maha Chakri Sirindhorn Royal Cup Open',
    scope: 'domestic',
    category: 'open',
    status: 'upcoming',
    date: '12 - 14 ธันวาคม 2026',
    location: 'สนามเปตอง มหาวิทยาลัยกรุงเทพธนบุรี, กรุงเทพมหานคร',
    country: '🇹🇭 ประเทศไทย',
    organizer: 'สมาคมกีฬาเปตองแห่งประเทศไทยฯ ร่วมกับ มหาวิทยาลัยกรุงเทพธนบุรี',
    format: 'ทีมคู่ชายทั่วไป (Men’s Doubles), ทีมคู่หญิงทั่วไป, และทีมคู่เยาวชน',
    prizePool: 'ถ้วยพระราชทานฯ อันทรงเกียรติ พร้อมเงินรางวัลรวม 180,000 บาท',
    surface: 'ดินบดแน่นเรียบผสมทรายบาง (Compacted Earth & Sand Layer)',
    highlights: [
      'ถ้วยรางวัลพระราชทานอันทรงเกียรติสูงสุดของวงการเปตองไทย',
      'เปิดรับสมัครทีมโอเพ่นจากทั่วประเทศ ทั้งสโมสร ชมรม และประชาชน',
      'มีระบบวัดแต้มด้วยเลเซอร์มาตรฐานสากลเพื่อความแม่นยำโปร่งใส'
    ],
    liveChannels: [
      {
        name: 'Facebook Live: สมาคมกีฬาเปตองแห่งประเทศไทยฯ',
        platform: 'facebook',
        badge: 'Facebook Live',
        url: 'https://www.facebook.com/PetanqueAssocTH',
        schedule: 'ถ่ายทอดสดรอบตัดเชือกและคู่ชิงถ้วยพระราชทาน'
      },
      {
        name: 'AIS Play Sports Streaming',
        platform: 'web',
        badge: 'AIS Play Live',
        url: 'https://aisplay.ais.co.th',
        schedule: 'สตรีมสดรอบชิงชนะเลิศทุกประเภท (ชมฟรีทุกเครือข่าย)'
      },
      {
        name: 'YouTube: Petanque Live Studio',
        platform: 'youtube',
        badge: 'YouTube Live',
        url: 'https://www.youtube.com/results?search_query=เปตองชิงถ้วยพระราชทาน',
        schedule: 'ถ่ายทอดสดคู่เอกประจำรอบแบ่งกลุ่มและรอบน็อกเอาต์'
      }
    ]
  },
  {
    id: 'masters-de-petanque',
    title: 'มาสเตอร์ส เดอ เปตอง ยุโรป (Masters de Pétanque European Tour)',
    titleEn: 'Masters de Pétanque Summer European Tour',
    scope: 'international',
    category: 'major',
    status: 'upcoming',
    date: 'กรกฎาคม - กันยายน 2027 (7 สนามทั่วยุโรป)',
    location: 'เมืองนีซ, น็องต์, มงต์เปลลิเยร์, รูออง ประเทศฝรั่งเศสและโมนาโก',
    country: '🇪🇺 ทวีปยุโรป',
    organizer: 'Quarterback Productions ร่วมกับ สหพันธ์เปตองฝรั่งเศส',
    format: 'รวมทีมท็อป 8 ทีมของโลก (รวมทีมชาติฝรั่งเศส, มาดากัสการ์, อิตาลี, เบลเยียม)',
    prizePool: 'เงินรางวัลรวมกว่า €120,000 ตลอดทัวร์ 7 สนาม',
    surface: 'สนามเปตองคอร์ตพิเศษใจกลางจัตุรัสเมืองประวัติศาสตร์',
    highlights: [
      'ทัวร์นาเมนต์รวมซูเปอร์สตาร์นักเปตองระดับโลก เช่น Dylan Rocher, Philippe Quintais, Henri Lacroix',
      'การดวลช็อต Carreau ความแม่นยำสูงเฉลี่ยมากกว่า 85% ตลอดทัวร์',
      'ถ่ายทอดสดระบบกล้อง Spider-cam และกราฟิกวิเคราะห์ทิศทางความเร็วลูก'
    ],
    liveChannels: [
      {
        name: 'La Chaîne L\'Équipe (Canal 21 France)',
        platform: 'tv',
        badge: 'L\'Équipe TV',
        url: 'https://www.lequipe.fr/lachainelequipe',
        schedule: 'ถ่ายทอดสด Prime Time ทุกวันพฤหัสบดีที่มีการแข่งขัน'
      },
      {
        name: 'Eurosport 2 & Eurosport Player',
        platform: 'tv',
        badge: 'Eurosport Live',
        url: 'https://www.eurosport.com',
        schedule: 'สตรีมมิ่งสดทั่วยุโรปและสมาชิกระดับสากล'
      },
      {
        name: 'YouTube: Masters de Pétanque Official',
        platform: 'youtube',
        badge: 'YouTube Live',
        url: 'https://www.youtube.com/results?search_query=Masters+de+Petanque',
        schedule: 'ย้อนหลังแบบ Full Match และไลฟ์สดยูทูบช่วง Final'
      }
    ]
  },
  {
    id: 'singapore-open',
    title: 'สิงคโปร์ อินเตอร์เนชั่นแนล เปตอง โอเพ่น (Singapore Petanque Open)',
    titleEn: 'Singapore International Petanque Open Championship',
    scope: 'international',
    category: 'open',
    status: 'upcoming',
    date: '27 - 29 มีนาคม 2027',
    location: 'Jurong West Sports Centre, ประเทศสิงคโปร์',
    country: '🇸🇬 สิงคโปร์',
    organizer: 'Singapore Petanque and Sports Boules Federation (SPSBF)',
    format: 'Open Triples (ทีม 3 คนทั่วไป) & Precision Shooting Contest',
    prizePool: 'เงินรางวัลรวม $20,000 SGD พร้อมถ้วยเกียรติยศนานาชาติ',
    surface: 'หินแกรนิตบดละเอียดและทรายอัด (Fine Granite & Sand)',
    highlights: [
      'การแข่งขันโอเพ่นนานาชาติระดับชั้นนำของเอเชียแปซิฟิก',
      'มีทีมชั้นนำจากไทย, มาเลเซีย, เวียดนาม, กัมพูชา, ออสเตรเลีย และฝรั่งเศสเข้าร่วม',
      'บรรยากาศการแข่งขันในร่มปรับอากาศมาตรฐานสูง'
    ],
    liveChannels: [
      {
        name: 'Facebook Live: Singapore Petanque Federation',
        platform: 'facebook',
        badge: 'Facebook Live',
        url: 'https://www.facebook.com/search/top?q=Singapore%20Petanque',
        schedule: 'ถ่ายทอดสดรอบน็อกเอาต์และพิธีเปิด-ปิด'
      },
      {
        name: 'YouTube: ASEAN Boules Sport Network',
        platform: 'youtube',
        badge: 'YouTube Live',
        url: 'https://www.youtube.com/results?search_query=Singapore+Petanque+Open',
        schedule: 'ไลฟ์สดคู่ชิงชนะเลิศและแมตช์พิเศษ'
      }
    ]
  },
  {
    id: 'chiangmai-lanna-open',
    title: 'เชียงใหม่ ลานนา เปตอง โอเพ่น ชิงถ้วยผู้ว่าราชการจังหวัดเชียงใหม่',
    titleEn: 'Chiang Mai Lanna Petanque Open Tournament',
    scope: 'domestic',
    category: 'open',
    status: 'upcoming',
    date: '9 - 10 มกราคม 2027',
    location: 'สนามกีฬา 700 ปี เชียงใหม่, จ.เชียงใหม่',
    country: '🇹🇭 ประเทศไทย',
    organizer: 'สมาคมกีฬาแห่งจังหวัดเชียงใหม่ ร่วมกับ ชมรมเปตองลานนา',
    format: 'ทีม 3 คน โอเพ่นทั่วไป (Open Triples) & ทีมเยาวชนอายุไม่เกิน 18 ปี',
    prizePool: 'เงินรางวัลรวม 140,000 บาท พร้อมถ้วยเกียรติยศลานนา',
    surface: 'ดินผสมกรวดภูเขาธรรมชาติ (Natural Mountain Gravel)',
    highlights: [
      'สัมผัสลมหนาวแดนเหนือในการแข่งขันเปตองโอเพ่นที่ใหญ่ที่สุดของภาคเหนือ',
      'เปิดรับทีมอิสระจากทั่วประเทศ ไม่จำกัดภูมิลำเนา',
      'มีกิจกรรมคลินิกสอนทักษะเปตองโดยอดีตนักกีฬาทีมชาติก่อนเริ่มแข่ง'
    ],
    liveChannels: [
      {
        name: 'Facebook Live: เปตองเชียงใหม่นิวส์',
        platform: 'facebook',
        badge: 'Facebook Live',
        url: 'https://www.facebook.com/search/top?q=เปตองเชียงใหม่',
        schedule: 'ถ่ายทอดสดบรรยากาศและคู่เอกรอบ 16 ทีม ถึงชิงชนะเลิศ'
      },
      {
        name: 'YouTube: Lanna Petanque Channel',
        platform: 'youtube',
        badge: 'YouTube Live',
        url: 'https://www.youtube.com/results?search_query=เปตองลานนา+เชียงใหม่',
        schedule: 'สตรีมสดรอบชิงชนะเลิศ'
      }
    ]
  },
  {
    id: 'thailand-national-games',
    title: 'มหกรรมกีฬาแห่งชาติ ครั้งที่ 49 (Thailand National Games - Petanque)',
    titleEn: '49th Thailand National Games - Petanque Tournament',
    scope: 'domestic',
    category: 'major',
    status: 'upcoming',
    date: '9 - 19 ธันวาคม 2026',
    location: 'สนามกีฬากลางจังหวัดเจ้าภาพ / ยิมเนเซียมเปตองมาตรฐาน',
    country: '🇹🇭 ประเทศไทย',
    organizer: 'การกีฬาแห่งประเทศไทย (กกท.)',
    format: 'เดี่ยว, คู่, คู่ผสม, ทีม 3 คน, และ Shooting ชาย-หญิง',
    prizePool: 'เหรียญทองเกียรติยศแห่งชาติ พร้อมเงินอัดฉีดกองทุนพัฒนากีฬาแห่งชาติ',
    surface: 'สนามเปตองมาตรฐานการกีฬาแห่งประเทศไทยบดอัดแน่น',
    highlights: [
      'ตัวแทนนักกีฬาเปตองจาก 77 จังหวัดทั่วประเทศที่ผ่านรอบคัดเลือกระดับภาค',
      'ชิงชัยความเป็นหนึ่งแห่งวงการกีฬาเปตองของประเทศไทย',
      'ได้รับความสนใจจากสื่อมวลชนและถ่ายทอดสดทางสถานีโทรทัศน์แห่งชาติ'
    ],
    liveChannels: [
      {
        name: 'T Sports 7 (ทีวีดิจิทัลช่อง 7)',
        platform: 'tv',
        badge: 'T Sports 7 HD',
        url: 'https://tsports7.com',
        schedule: 'ถ่ายทอดสดรอบรองชนะเลิศและชิงเหรียญทองทุกประเภท'
      },
      {
        name: 'AIS Play Sports (แอปพลิเคชัน & เว็บไซต์)',
        platform: 'web',
        badge: 'AIS Play',
        url: 'https://aisplay.ais.co.th',
        schedule: 'ถ่ายทอดสดครบทุกสนามตลอดทั้งวัน (ชมฟรีทุกเครือข่าย)'
      },
      {
        name: 'Facebook Live: กองประชาสัมพันธ์ การกีฬาแห่งประเทศไทย',
        platform: 'facebook',
        badge: 'Facebook Live',
        url: 'https://www.facebook.com/prsat.sports',
        schedule: 'รายงานผลสด อัปเดตตารางเหรียญ และสัมภาษณ์สดแชมป์'
      }
    ]
  },
  {
    id: 'sea-games-petanque',
    title: 'การแข่งขันเปตอง กีฬาซีเกมส์ ครั้งที่ 33 (33rd SEA Games - Petanque)',
    titleEn: '33rd SEA Games Thailand - Petanque Championship',
    scope: 'international',
    category: 'major',
    status: 'upcoming',
    date: '9 - 20 ธันวาคม 2026',
    location: 'ศูนย์กีฬาเปตองนานาชาติ, กรุงเทพมหานคร และ พัทยา ชลบุรี',
    country: '🇹🇭 ภูมิภาคอาเซียน / ไทยแลนด์',
    organizer: 'สหพันธ์กีฬาซีเกมส์ ร่วมกับ สมาคมกีฬาเปตองแห่งประเทศไทยฯ',
    format: 'ชิง 10 เหรียญทอง: ชายเดี่ยว, หญิงเดี่ยว, คู่, คู่ผสม, ทีม 3 คน, และ Shooting',
    prizePool: 'เหรียญรางวัลเกียรติยศซีเกมส์ และคะแนนสะสมอันดับโลก',
    surface: 'สนามเปตองสังเคราะห์ในร่มระดับเวิลด์คลาส',
    highlights: [
      'ประเทศไทยเป็นเจ้าภาพ ทัพนักโยนลูกเหล็กไทยตั้งเป้ากวาด 8 เหรียญทอง',
      'การประลองกับคู่ปรับตลอดกาล กัมพูชา, เวียดนาม, มาเลเซีย และลาว',
      'มหกรรมกีฬาที่มียอดผู้ชมรับชมการถ่ายทอดสดสูงสุดในภูมิภาคอาเซียน'
    ],
    liveChannels: [
      {
        name: 'T Sports 7, NBT 2HD, ช่อง 9 MCOT HD (ฟรีทีวี)',
        platform: 'tv',
        badge: 'Free TV Pool',
        url: 'https://tsports7.com',
        schedule: 'ถ่ายทอดสดรอบคัดเลือกและรอบชิงเหรียญทองทุกวัน'
      },
      {
        name: 'TrueID Sports (แอปพลิเคชัน & กล่อง TrueID)',
        platform: 'web',
        badge: 'TrueID Sports',
        url: 'https://www.trueid.net',
        schedule: 'สตรีมสดหลายช่องสัญญาณ ถ่ายทอดทุกคู่ของนักกีฬาไทย'
      },
      {
        name: 'AIS Play SEA Games Live Channel',
        platform: 'web',
        badge: 'AIS Play Live',
        url: 'https://aisplay.ais.co.th',
        schedule: 'สตรีมมิ่งสดความคมชัดระดับ Full HD ทุกสนาม'
      },
      {
        name: 'YouTube: สมาคมกีฬาเปตองแห่งประเทศไทยฯ',
        platform: 'youtube',
        badge: 'YouTube Live',
        url: 'https://www.youtube.com/results?search_query=ซีเกมส์+เปตอง',
        schedule: 'ไฮไลต์ทุกช็อตเด็ดและภาพเบื้องหลังแคมป์ทีมชาติไทย'
      }
    ]
  },
  {
    id: 'bangkok-petanque-grand-prix',
    title: 'แบงค็อก เปตอง กรังด์ปรีซ์ โอเพ่น 2026 (Bangkok Petanque Grand Prix)',
    titleEn: 'Bangkok Petanque Grand Prix Open Championship 2026',
    scope: 'domestic',
    category: 'open',
    status: 'upcoming',
    date: '28 - 29 พฤศจิกายน 2026',
    location: 'สนามเปตอง ลานคนเมือง ศาลาว่าการกรุงเทพมหานคร',
    country: '🇹🇭 ประเทศไทย',
    organizer: 'กรุงเทพมหานคร ร่วมกับ สมาคมกีฬาเปตองแห่งประเทศไทยฯ',
    format: 'ทีม 3 คนทั่วไป (Open Triples) และ คู่ผสม (Mixed Doubles)',
    prizePool: 'เงินรางวัลรวมกว่า 200,000 บาท พร้อมถ้วยเกียรติยศผู้ว่าฯ กทม.',
    surface: 'ลานหินเกล็ดบดละเอียดพิเศษใจกลางกรุง (Fine Crushed Aggregate)',
    highlights: [
      'ทัวร์นาเมนต์โอเพ่นใหญ่ใจกลางเมืองหลวง รวมทีมสโมสรชั้นนำทั่วประเทศ',
      'เปิดรับสมัครทั้งประชาชนทั่วไปและนักกีฬาทีมชาติเข้าร่วมประชันฝีมือ',
      'เวทีชูตติ้งกลางคืนระบบไฟส่องสว่างระดับมาตรฐานสากล'
    ],
    liveChannels: [
      {
        name: 'Facebook Live: กรุงเทพมหานคร โดยสำนักงานประชาสัมพันธ์',
        platform: 'facebook',
        badge: 'BMA Live',
        url: 'https://www.facebook.com/prbangkok',
        schedule: 'ถ่ายทอดสดพิธีเปิดและคู่ชิงชนะเลิศ (15:00 - 19:00 น.)'
      },
      {
        name: 'YouTube: Bangkok Sports Channel',
        platform: 'youtube',
        badge: 'YouTube Live',
        url: 'https://www.youtube.com/results?search_query=Bangkok+Petanque+Grand+Prix',
        schedule: 'สตรีมสดรอบ 16 ทีม ถึง รอบตัดเชือก'
      }
    ]
  },
  {
    id: 'asian-petanque-championship',
    title: 'การแข่งขันเปตองชิงชนะเลิศแห่งเอเชีย ครั้งที่ 32 (32nd Asian Petanque Championship)',
    titleEn: '32nd Asian Petanque & Shooting Championship 2027',
    scope: 'international',
    category: 'major',
    status: 'upcoming',
    date: '18 - 22 กุมภาพันธ์ 2027',
    location: 'ศูนย์กีฬาเฉลิมพระเกียรติฯ มีนบุรี, กรุงเทพมหานคร',
    country: '🇹🇭 ทวีปเอเชีย / ไทยแลนด์',
    organizer: 'สหพันธ์เปตองแห่งเอเชีย (ABF) ร่วมกับ สมาคมกีฬาเปตองแห่งประเทศไทยฯ',
    format: 'ทีม 3 คน ชาย/หญิง/เยาวชน และ ชูตติ้งความแม่นยำ (Precision Shooting)',
    prizePool: 'ถ้วยเกียรติยศเอเชีย เหรียญทองคำเกียรติยศ และโควตาลุยศึกชิงแชมป์โลก',
    surface: 'สนามเปตองในร่มพื้นสังเคราะห์บดอัดมาตรฐาน ABF',
    highlights: [
      'มหกรรมเปตองระดับทวีปที่มีการขับเคี่ยวระหว่างไทย กัมพูชา เวียดนาม ไต้หวัน และญี่ปุ่น',
      'ทัพไทยส่งชุดใหญ่เต็มอัตราศึกเพื่อรักษาบัลลังก์เจ้าเปตองเอเชีย',
      'ใช้ระบบผู้ตัดสินระดับนานาชาติและเทคโนโลยี Instant Replay ตรวจจับเส้นวงกลม'
    ],
    liveChannels: [
      {
        name: 'T Sports 7 (ทีวีดิจิทัล & AIS Play)',
        platform: 'tv',
        badge: 'T Sports 7 HD',
        url: 'https://tsports7.com',
        schedule: 'ถ่ายทอดสดรอบตัดเชือกและชิงชนะเลิศทุกประเภท'
      },
      {
        name: 'YouTube: Asian Boules Sport Network (ABF)',
        platform: 'youtube',
        badge: 'YouTube Live 4K',
        url: 'https://www.youtube.com/results?search_query=Asian+Petanque+Championship',
        schedule: 'ถ่ายทอดสดครบทุกสนามตลอดทั้ง 5 วัน'
      },
      {
        name: 'Facebook Live: สมาคมกีฬาเปตองแห่งประเทศไทยฯ',
        platform: 'facebook',
        badge: 'Facebook Live',
        url: 'https://www.facebook.com/PetanqueAssocTH',
        schedule: 'รายงานสกอร์สดและบทสัมภาษณ์แชมป์เอเชีย'
      }
    ]
  }
];

// Procedural Web Audio Sound Engine for Petanque Physics FX
class PetanqueAudioEngine {
  private ctx: AudioContext | null = null;
  private rollingNode: AudioNode | null = null;

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Air release / whoosh sound
  playThrow() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(1100, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.22);
      filter.Q.value = 2.8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  // Metallic clash / collision (Carreau / Boule hitting boule)
  playMetalImpact() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Resonant metallic chime harmonics
      const freqs = [2240, 3560, 5280, 7920];
      const decays = [0.38, 0.26, 0.18, 0.12];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.94, now + decays[idx]);

        gain.gain.setValueAtTime(0.32 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + decays[idx]);
      });

      // Sharp initial metal strike transient
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(4200, now);
      click.frequency.exponentialRampToValueAtTime(250, now + 0.015);
      clickGain.gain.setValueAtTime(0.45, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      click.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      click.start(now);
      click.stop(now + 0.018);
    } catch (e) {}
  }

  // Ground Impact on surface (Dry Clay, Gravel, Sandy Ground)
  playImpact(terrain: TerrainType) {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      if (terrain === 'dry_clay') {
        // Solid packed clay thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);

        // Dry clay surface tap
        const click = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        click.frequency.setValueAtTime(800, now);
        click.frequency.exponentialRampToValueAtTime(120, now + 0.035);
        clickGain.gain.setValueAtTime(0.22, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        click.connect(clickGain);
        clickGain.connect(this.ctx.destination);
        click.start(now);
        click.stop(now + 0.04);
      } else if (terrain === 'gravel') {
        // Crunchy stone chatter & micro clicks
        for (let i = 0; i < 4; i++) {
          const offset = now + i * 0.035;
          const stoneOsc = this.ctx.createOscillator();
          const stoneGain = this.ctx.createGain();
          stoneOsc.type = 'triangle';
          const f = 1350 + Math.random() * 850;
          stoneOsc.frequency.setValueAtTime(f, offset);
          stoneOsc.frequency.exponentialRampToValueAtTime(f * 0.7, offset + 0.035);

          stoneGain.gain.setValueAtTime(0.25 / (i + 1), offset);
          stoneGain.gain.exponentialRampToValueAtTime(0.001, offset + 0.038);

          stoneOsc.connect(stoneGain);
          stoneGain.connect(this.ctx.destination);
          stoneOsc.start(offset);
          stoneOsc.stop(offset + 0.045);
        }
      } else if (terrain === 'grass') {
        // Grass: Muffled soft turf thud + gentle blade rustle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.16);
        gain.gain.setValueAtTime(0.36, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.17);

        // Soft grass blade swish noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(480, now + 0.14);
        filter.Q.value = 1.3;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.24, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
      } else {
        // sandy_ground: Deep cushioned whoosh-thump
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.exponentialRampToValueAtTime(75, now + 0.18);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
      }
    } catch (e) {}
  }

  // Rolling sound on surface
  playRoll(terrain: TerrainType, duration: number) {
    this.stopRoll();
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const playDur = Math.min(2.5, Math.max(0.2, duration));
      const bufferSize = Math.floor(this.ctx.sampleRate * playDur);
      if (bufferSize <= 0) return;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      if (terrain === 'dry_clay') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);
        filter.frequency.exponentialRampToValueAtTime(110, now + playDur);
        gain.gain.setValueAtTime(0.14, now);
      } else if (terrain === 'gravel') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + playDur);
        filter.Q.value = 2.4;
        gain.gain.setValueAtTime(0.2, now);
      } else if (terrain === 'grass') {
        // Grass surface rolling swish / gentle rustle
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.exponentialRampToValueAtTime(600, now + playDur);
        filter.Q.value = 1.4;
        gain.gain.setValueAtTime(0.13, now);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + playDur);
        gain.gain.setValueAtTime(0.16, now);
      }

      gain.gain.exponentialRampToValueAtTime(0.001, now + playDur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);

      this.rollingNode = noise;
    } catch (e) {}
  }

  stopRoll() {
    if (this.rollingNode) {
      try {
        (this.rollingNode as AudioBufferSourceNode).stop();
      } catch (e) {}
      this.rollingNode = null;
    }
  }
}

const audioEngine = new PetanqueAudioEngine();

export default function App() {
  // Mobile drawer menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Trajectory Visualizer State
  const [activeTrajMode, setActiveTrajMode] = useState<string>('rolling');
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>('dry_clay');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [windSpeed, setWindSpeed] = useState<number>(15); // Wind speed (0 - 50 km/h)
  const [windDirection, setWindDirection] = useState<number>(0); // Wind direction (0° = Tailwind ➡️, 180° = Headwind ⬅️)
  const soundFlagsRef = useRef<{ throw: boolean; impact: boolean; roll: boolean }>({
    throw: false,
    impact: false,
    roll: false
  });
  const [animProgress, setAnimProgress] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;
  const animProgressRef = useRef<number>(1);
  animProgressRef.current = animProgress;
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showMobileMetrics, setShowMobileMetrics] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Interactive Surface Friction Heatmap & Donnée Point Selection State
  const [showFrictionHeatmap, setShowFrictionHeatmap] = useState<boolean>(true);
  const [heatmapMode, setHeatmapMode] = useState<'intensity' | 'zones'>('intensity');
  const [hoveredFrictionPoint, setHoveredFrictionPoint] = useState<FrictionDataPoint | null>(null);
  const [canvasCursorPos, setCanvasCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [customDonneeMarker, setCustomDonneeMarker] = useState<FrictionDataPoint | null>(null);

  // Sync refs for uninterrupted 60fps rendering in drawTrajectoryFrame
  const showFrictionHeatmapRef = useRef(showFrictionHeatmap);
  showFrictionHeatmapRef.current = showFrictionHeatmap;
  const heatmapModeRef = useRef(heatmapMode);
  heatmapModeRef.current = heatmapMode;
  const canvasCursorPosRef = useRef(canvasCursorPos);
  canvasCursorPosRef.current = canvasCursorPos;
  const customDonneeMarkerRef = useRef(customDonneeMarker);
  customDonneeMarkerRef.current = customDonneeMarker;

  // Simulator View Mode & Custom Physics Tuning (User Request #2)
  const [simulatorViewMode, setSimulatorViewMode] = useState<'side_2d' | 'top_down'>('side_2d');
  const simulatorViewModeRef = useRef(simulatorViewMode);
  simulatorViewModeRef.current = simulatorViewMode;

  const [isCustomPhysics, setIsCustomPhysics] = useState<boolean>(false);
  const [customReleaseAngle, setCustomReleaseAngle] = useState<number>(45); // 15° to 75°
  const [customInitialVelocity, setCustomInitialVelocity] = useState<number>(8.5); // 4.0 to 15.0 m/s
  const [customBackspinRpm, setCustomBackspinRpm] = useState<number>(250); // 0 to 600 RPM
  const isCustomPhysicsRef = useRef(isCustomPhysics);
  isCustomPhysicsRef.current = isCustomPhysics;

  // Interactive Hand Scale & Boule Spec Visualizer Widget (Hero Section)
  const [heroHandLength, setHeroHandLength] = useState<number>(182); // 160 - 205 mm
  const [heroRole, setHeroRole] = useState<'shooter' | 'pointer' | 'milieu'>('shooter');
  const customReleaseAngleRef = useRef(customReleaseAngle);
  customReleaseAngleRef.current = customReleaseAngle;
  const customInitialVelocityRef = useRef(customInitialVelocity);
  customInitialVelocityRef.current = customInitialVelocity;
  const customBackspinRpmRef = useRef(customBackspinRpm);
  customBackspinRpmRef.current = customBackspinRpm;

  // Navigation Grouped Dropdown State (User Request #1)
  const [activeNavDropdown, setActiveNavDropdown] = useState<'training' | 'equipment' | 'match' | null>(null);

  // Drill Interactive Cockpit Practice Modal (User Request #4)
  const [activePracticeDrill, setActivePracticeDrill] = useState<any | null>(null);

  // Petanque Finder Calculator State & Custom Overrides
  const [handLength, setHandLength] = useState<number>(180);
  const [playerRole, setPlayerRole] = useState<'pointer' | 'milieu' | 'shooter'>('pointer');
  const [striation, setStriation] = useState<'smooth' | 'single' | 'heavy'>('single');
  const [palmWidth, setPalmWidth] = useState<'narrow' | 'standard' | 'wide'>('standard');
  const [customDiameter, setCustomDiameter] = useState<number | null>(null);
  const [customWeight, setCustomWeight] = useState<number | null>(null);

  // Technique Library State
  const [activeFilter, setActiveFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalItem, setActiveModalItem] = useState<TechniqueItem | null>(null);

  // Drill Library State
  const [drillFilter, setDrillFilter] = useState<'all' | 'pointing' | 'shooting' | 'tactical' | 'pressure'>('all');
  const [activeDrillModal, setActiveDrillModal] = useState<DrillItem | null>(null);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [customDrillVideos, setCustomDrillVideos] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('petanque_custom_drill_videos');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [drillVideoInput, setDrillVideoInput] = useState<string>('');
  const [drillVideoSuccess, setDrillVideoSuccess] = useState<string | null>(null);
  const [drillPracticeCounts, setDrillPracticeCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('petanque_drill_practice_counts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'drill-grouping': 8,
      'drill-backspin': 11,
      'drill-tir-au-fer': 14,
      'drill-carreau': 9,
      'drill-donnee': 13,
      'drill-pressure': 4,
    };
  });

  const handleIncrementDrillRep = (drillId: string) => {
    setDrillPracticeCounts((prev) => {
      const next = { ...prev, [drillId]: (prev[drillId] || 0) + 1 };
      try {
        localStorage.setItem('petanque_drill_practice_counts', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleResetDrillRep = (drillId: string) => {
    setDrillPracticeCounts((prev) => {
      const next = { ...prev, [drillId]: 0 };
      try {
        localStorage.setItem('petanque_drill_practice_counts', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Tournament & Live Broadcasts State
  const [tourneyScopeFilter, setTourneyScopeFilter] = useState<'all' | 'domestic' | 'international'>('all');
  const [tourneyCategoryFilter, setTourneyCategoryFilter] = useState<'all' | 'open' | 'major'>('all');
  const [tourneyStatusFilter, setTourneyStatusFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [tourneySearchQuery, setTourneySearchQuery] = useState<string>('');
  const [activeTourneyModal, setActiveTourneyModal] = useState<TournamentItem | null>(null);
  const [tourneyViewMode, setTourneyViewMode] = useState<'cards' | 'calendar' | 'map'>('cards');
  const [calendarMonth, setCalendarMonth] = useState<string>('2026-10');

  // Backspin Physics Visualizer Modal
  const [showBackspinPhysicsModal, setShowBackspinPhysicsModal] = useState<boolean>(false);

  // Score & Drill Tracker Mini-tool (Interactive Add-on)
  const [scoreTeamA, setScoreTeamA] = useState<number>(0);
  const [scoreTeamB, setScoreTeamB] = useState<number>(0);
  const [meneHistory, setMeneHistory] = useState<Array<{ mene: number; a: number; b: number }>>([]);
  const [drillTotalThrows, setDrillTotalThrows] = useState<number>(0);
  const [drillHits, setDrillHits] = useState<number>(0);

  // Centralized Authentication State from AuthContext (Real OAuth & Cloud Sync)
  const {
    currentUser: userAccount,
    saveSpec,
    deleteSpec,
    saveDrill,
    deleteDrill,
    logout,
    migrationStats,
  } = useAuth();

  // Toast Notification System
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);
  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Toast notification when Guest data is migrated to cloud account
  useEffect(() => {
    if (migrationStats && (migrationStats.migratedSpecsCount > 0 || migrationStats.migratedDrillsCount > 0)) {
      showToast(
        `✓ ซิงค์คลาวด์สำเร็จ: ผสาน ${migrationStats.migratedSpecsCount} สเปก และ ${migrationStats.migratedDrillsCount} แบบฝึกเข้าสู่บัญชีของคุณแล้ว`,
        'success'
      );
    }
  }, [migrationStats]);

  // Auth & Profile Modals State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<'save_spec' | 'save_drill' | 'general_login'>('general_login');
  const [pendingSpecToSave, setPendingSpecToSave] = useState<SavedBouleSpec | null>(null);
  const [pendingDrillToSave, setPendingDrillToSave] = useState<SavedDrillResult | null>(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState<boolean>(false);

  // Derived Calculator Specs with Custom Selection Support
  const calculateSpecs = () => {
    let baseDia = 72;
    let baseWeight = 690;
    let hardness = 'ปานกลาง (Half-soft)';
    let hardnessVal = '120 kg/mm²';
    let material = 'สแตนเลส (Stainless Steel)';
    let baseAdvice = '';

    // Diameter calculation based on hand length
    if (handLength < 165) baseDia = 71;
    else if (handLength <= 175) baseDia = 72;
    else if (handLength <= 185) baseDia = 73;
    else if (handLength <= 195) baseDia = 74;
    else baseDia = 75;

    // Adjust for palm width
    if (palmWidth === 'wide' && baseDia < 77) baseDia += 1;
    if (palmWidth === 'narrow' && baseDia > 71) baseDia -= 1;

    // Adjust for position
    if (playerRole === 'pointer') {
      baseWeight = 700;
      hardness = 'แข็ง (Hard)';
      hardnessVal = '140 kg/mm²';
      material = striation === 'heavy' ? 'เหล็กคาร์บอน ลายถี่พิเศษ' : 'สแตนเลส ลายเดี่ยว/คู่';
      baseAdvice = 'เน้นลูกขนาดกระชับมือ น้ำหนักแน่นเพื่อยึดตำแหน่งหน้าแก่น ลดแรงกระดอนแฉลบหิน';
    } else if (playerRole === 'shooter') {
      baseDia = Math.min(80, baseDia + 1);
      baseWeight = 680;
      hardness = 'นิ่มมาก (Very Soft)';
      hardnessVal = '110 kg/mm²';
      material = 'เหล็กคาร์บอน (Carbon Steel) ลูกเรียบ 0 เส้น';
      baseAdvice = 'ลูกนิ่มช่วยดูดซับแรงกระแทก ตีติด (Carreau) ได้ดีเยี่ยม ป้องกันลูกยิงกระดอนข้ามเป้า';
    } else {
      // Milieu
      baseWeight = 690;
      hardness = 'นิ่ม (Soft) ถึง กึ่งนิ่ม';
      hardnessVal = '115 - 120 kg/mm²';
      material = 'สแตนเลส สเปกสมดุล ลายเดี่ยว';
      baseAdvice = 'สมดุลทั้งการเข้าลูกและการยิง เหมาะสำหรับผู้เล่นตำแหน่งรอบด้านที่ต้องแก้เกม';
    }

    // Effective Diameter & Weight (selected vs auto recommended)
    const effectiveDia = customDiameter !== null ? customDiameter : baseDia;
    const effectiveWeight = customWeight !== null ? customWeight : baseWeight;
    const isCustomized = customDiameter !== null || customWeight !== null;

    // Grip Ergonomics Index calculation
    const diaDiff = Math.abs(effectiveDia - baseDia);
    const weightDiff = Math.abs(effectiveWeight - baseWeight);

    let fitPercent = 98;
    if (diaDiff === 1) fitPercent -= 10;
    else if (diaDiff === 2) fitPercent -= 24;
    else if (diaDiff >= 3) fitPercent -= 42;

    if (weightDiff > 20) fitPercent -= 8;
    fitPercent = Math.max(35, Math.min(100, fitPercent));

    let fitNote = '';
    if (effectiveDia === baseDia && effectiveWeight === baseWeight) {
      fitNote = 'ตรงกับสรีระฝ่ามือและตำแหน่งการเล่นของคุณอย่างสมบูรณ์แบบ (Optimal Grip)';
    } else if (effectiveDia > baseDia + 1) {
      fitNote = `ขนาด Ø ${effectiveDia} มม. มีขนาดใหญ่กว่าค่ามาตรฐานมือ (${baseDia} มม.) เล็กน้อย อาจทำให้ลูกหลุดมือเร็วขึ้นหากเหวี่ยงแขนแรง`;
    } else if (effectiveDia < baseDia - 1) {
      fitNote = `ขนาด Ø ${effectiveDia} มม. เล็กกว่าค่ามาตรฐานมือ (${baseDia} มม.) อาจทำให้ลูกล้นอุ้งมือและควบคุมระนาบยาก`;
    } else {
      fitNote = `ปรับแต่งสเปกตามความคุ้นเคย: Ø ${effectiveDia} มม. / ${effectiveWeight} ก. อยู่ในเกณฑ์เหมาะสม`;
    }

    return {
      diameter: effectiveDia,
      baseDiameter: baseDia,
      diaRange: `${effectiveDia - 1} - ${effectiveDia + 1}`,
      weight: effectiveWeight,
      baseWeight,
      weightRange: `${effectiveWeight - 10} - ${effectiveWeight + 10}`,
      hardness,
      hardnessVal,
      material,
      advice: baseAdvice,
      fitNote,
      fitPercent,
      isCustomized
    };
  };

  const specs = calculateSpecs();
  const windInfo = getWindDirectionInfo(windDirection, windSpeed);

  // Save custom drill video to localStorage
  const handleSaveDrillVideo = (drillId: string, url: string) => {
    const updated = { ...customDrillVideos, [drillId]: url.trim() };
    setCustomDrillVideos(updated);
    try {
      localStorage.setItem('petanque_custom_drill_videos', JSON.stringify(updated));
    } catch (e) {}
    setDrillVideoSuccess(drillId);
    setTimeout(() => setDrillVideoSuccess(null), 3500);
  };

  // Save Boule Spec to Account Handler (Cloud & Local Sync)
  const saveSpecToAccount = (spec: SavedBouleSpec, _account?: UserAccount) => {
    saveSpec(spec);
    showToast(`✓ บันทึกสเปกลูกเปตอง Ø ${spec.diameter}mm / ${spec.weight}g ในโปรไฟล์สำเร็จ!`, 'success');
  };

  const handleSaveSpecClick = (overrideSpec?: SavedBouleSpec | React.MouseEvent) => {
    const isSpec = Boolean(overrideSpec && typeof overrideSpec === 'object' && 'diameter' in overrideSpec);
    const currentSpecToSave: SavedBouleSpec = (isSpec ? (overrideSpec as SavedBouleSpec) : null) || {
      id: 'spec-' + Date.now(),
      savedAt: new Date().toISOString(),
      handLength,
      palmWidth,
      playerRole,
      striation,
      diameter: specs.diameter,
      weight: specs.weight,
      hardness: specs.hardness,
      hardnessVal: specs.hardnessVal,
      material: specs.material,
      fitPercent: specs.fitPercent,
      fitNote: specs.fitNote,
      advice: specs.advice,
      isCustomized: specs.isCustomized,
    };

    if (userAccount.isGuest) {
      // Trigger prompt modal for Guest as requested in UX guidelines!
      setPendingSpecToSave(currentSpecToSave);
      setAuthModalReason('save_spec');
      setAuthModalOpen(true);
    } else {
      saveSpecToAccount(currentSpecToSave, userAccount);
    }
  };

  // Save Drill Result to Account Handler (Cloud & Local Sync)
  const saveDrillToAccount = (drillResult: SavedDrillResult, _account?: UserAccount) => {
    saveDrill(drillResult);
    showToast(`✓ บันทึกผลการฝึก "${drillResult.drillTitle}" (${drillResult.reps}/${drillResult.targetReps} ครั้ง) สำเร็จ!`, 'success');
  };

  const handleSaveDrillClick = (drill: DrillItem) => {
    const reps = drillPracticeCounts[drill.id] || 0;
    const progressPct = Math.min(100, Math.round((reps / drill.repetitionCount) * 100));
    const currentDrillToSave: SavedDrillResult = {
      id: 'drill-' + Date.now(),
      drillId: drill.id,
      drillTitle: drill.title,
      reps,
      targetReps: drill.repetitionCount,
      progressPct,
      savedAt: new Date().toISOString(),
      videoUrl: customDrillVideos[drill.id] || '',
    };

    if (userAccount.isGuest) {
      // Trigger prompt modal for Guest!
      setPendingDrillToSave(currentDrillToSave);
      setAuthModalReason('save_drill');
      setAuthModalOpen(true);
    } else {
      saveDrillToAccount(currentDrillToSave, userAccount);
    }
  };

  // Login handler with Google, Facebook, LINE, and Guest
  const handleLoginSuccess = (_provider: AuthProvider, _customName?: string) => {
    setAuthModalOpen(false);

    // If there was a pending item that triggered this modal, immediately save it!
    if (pendingSpecToSave) {
      saveSpecToAccount(pendingSpecToSave, userAccount);
      setPendingSpecToSave(null);
    } else if (pendingDrillToSave) {
      saveDrillToAccount(pendingDrillToSave, userAccount);
      setPendingDrillToSave(null);
    } else {
      showToast(`✓ ยินดีต้อนรับ ${userAccount.displayName} เข้าสู่ระบบสำเร็จ!`, 'success');
    }
  };

  const handleSaveAsGuest = () => {
    setAuthModalOpen(false);
    if (pendingSpecToSave) {
      saveSpecToAccount(pendingSpecToSave, userAccount);
      setPendingSpecToSave(null);
    } else if (pendingDrillToSave) {
      saveDrillToAccount(pendingDrillToSave, userAccount);
      setPendingDrillToSave(null);
    }
  };

  const handleLoadSpec = (saved: SavedBouleSpec) => {
    setHandLength(saved.handLength);
    setPalmWidth(saved.palmWidth);
    setPlayerRole(saved.playerRole);
    setStriation(saved.striation);
    if (saved.isCustomized) {
      setCustomDiameter(saved.diameter);
      setCustomWeight(saved.weight);
    } else {
      setCustomDiameter(null);
      setCustomWeight(null);
    }
    showToast(`⚡ โหลดสเปก Ø ${saved.diameter}mm / ${saved.weight}g ลงในเครื่องคำนวณเรียบร้อยแล้ว`, 'info');
    const el = document.getElementById('calculator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteSpec = (specId: string) => {
    deleteSpec(specId);
    showToast('ลบสเปกลูกเปตองเรียบร้อยแล้ว', 'info');
  };

  const handleDeleteDrill = (drillSaveId: string) => {
    deleteDrill(drillSaveId);
    showToast('ลบประวัติการฝึกเรียบร้อยแล้ว', 'info');
  };

  const handleLogout = () => {
    logout();
    setUserProfileModalOpen(false);
    showToast('สลับกลับสู่โหมด Guest (ข้อมูลในเครื่องยังคงอยู่)', 'info');
  };

  // Surface Friction Heatmap & Point Selection Interactive Handlers
  const handleToggleHeatmap = () => {
    setShowFrictionHeatmap((prev) => {
      const next = !prev;
      showFrictionHeatmapRef.current = next;
      if (!isAnimating) {
        requestAnimationFrame(() => drawTrajectoryFrame(animProgress));
      }
      return next;
    });
  };

  const handleToggleHeatmapMode = (mode: 'intensity' | 'zones') => {
    setHeatmapMode(mode);
    heatmapModeRef.current = mode;
    if (!isAnimating) {
      requestAnimationFrame(() => drawTrajectoryFrame(animProgress));
    }
  };

  const handleClearCustomDonnee = () => {
    setCustomDonneeMarker(null);
    customDonneeMarkerRef.current = null;
    if (!isAnimating) {
      requestAnimationFrame(() => drawTrajectoryFrame(animProgress));
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setCanvasCursorPos({ x, y });
    canvasCursorPosRef.current = { x, y };

    const groundY = canvas.height * 0.82;
    const analysis = analyzePointSelection(x, canvas.width, groundY, selectedTerrain, activeTrajMode);
    setHoveredFrictionPoint(analysis);

    if (!isAnimating) {
      drawTrajectoryFrame(animProgress);
    }
  };

  const handleCanvasMouseLeave = () => {
    setCanvasCursorPos(null);
    canvasCursorPosRef.current = null;
    setHoveredFrictionPoint(null);
    if (!isAnimating) {
      drawTrajectoryFrame(animProgress);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const groundY = canvas.height * 0.82;

    // If clicked near the ground plane (within 65px) or below:
    if (Math.abs(y - groundY) < 65 || y >= groundY) {
      const analysis = analyzePointSelection(x, canvas.width, groundY, selectedTerrain, activeTrajMode);
      setCustomDonneeMarker(analysis);
      customDonneeMarkerRef.current = analysis;
      if (!isAnimating) {
        drawTrajectoryFrame(animProgress);
      }
    } else {
      replaySimulation();
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    setCanvasCursorPos({ x, y });
    canvasCursorPosRef.current = { x, y };
    const groundY = canvas.height * 0.82;
    const analysis = analyzePointSelection(x, canvas.width, groundY, selectedTerrain, activeTrajMode);
    setHoveredFrictionPoint(analysis);
    if (!isAnimating) {
      drawTrajectoryFrame(animProgress);
    }
  };

  const handleCanvasTouchEnd = () => {
    setTimeout(() => {
      setCanvasCursorPos(null);
      canvasCursorPosRef.current = null;
      setHoveredFrictionPoint(null);
      if (!isAnimating) {
        drawTrajectoryFrame(animProgress);
      }
    }, 2500);
  };

  // Canvas Drawing & Trajectory Simulation with Terrain Physics
  const drawTrajectoryFrame = (progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isMobileCanvas = w < 520;
    const terrain = TERRAIN_PRESETS[selectedTerrain];

    // Top-Down Bird's-Eye View Rendering Branch
    if (simulatorViewModeRef.current === 'top_down') {
      drawTopDownTrajectory({
        ctx,
        w,
        h,
        progress,
        windSpeed,
        windDirection,
        activeTrajMode,
        selectedTerrain,
        isMobile: isMobileCanvas,
        terrainColors: {
          groundColorTop: terrain.groundColorTop,
          groundColorBottom: terrain.groundColorBottom,
          boundaryColor: terrain.boundaryColor,
          rollMultiplier: terrain.rollMultiplier,
        },
        customPhysics: {
          enabled: isCustomPhysicsRef.current,
          releaseAngle: customReleaseAngleRef.current,
          initialVelocity: customInitialVelocityRef.current,
          backspinRpm: customBackspinRpmRef.current,
        },
        isPaused: isPausedRef.current,
      });
      return;
    }

    let cfg = TRAJECTORY_PRESETS[activeTrajMode];
    if (isCustomPhysicsRef.current) {
      const angleRad = (customReleaseAngleRef.current * Math.PI) / 180;
      const v0 = customInitialVelocityRef.current;
      const spinRpm = customBackspinRpmRef.current;
      const g = 9.8;
      const flightDist = (v0 * v0 * Math.sin(2 * angleRad)) / g;
      const apexH = (v0 * Math.sin(angleRad)) ** 2 / (2 * g);
      const customLandX = Math.min(0.90, Math.max(0.28, 0.08 + (flightDist / 12.0) * 0.75));
      const customApexY = Math.min(1.0, Math.max(0.25, apexH / 4.0));
      const spinDamp = Math.max(0.1, 1 - spinRpm / 500);

      cfg = {
        ...cfg,
        name: `กำหนดเอง (${customReleaseAngleRef.current}°, ${customInitialVelocityRef.current} m/s)`,
        apexRatioY: customApexY,
        landRatioX: customLandX,
        finalRatioX: Math.min(0.95, customLandX + 0.15 * spinDamp),
        apexDisplay: `${apexH.toFixed(2)} m (Apex)`,
        landingDisplay: `${flightDist.toFixed(1)} m (Donnée)`,
        spinDisplay: `${spinRpm} RPM Backspin`,
      };
    }

    const groundY = h * 0.82;
    const startX = w * 0.08;
    const startY = groundY;

    // 0. Wind Aerodynamics Calculation
    const windAngleRad = (windDirection * Math.PI) / 180;
    const windCos = Math.cos(windAngleRad); // +1 = full tailwind, -1 = full headwind
    const windHorizVelocity = windSpeed * windCos; // km/h horizontal component

    // Hang-time and apex height amplify airborne wind drift
    const trajWindSensitivity =
      activeTrajMode === 'highlob' ? 1.65 :
      activeTrajMode === 'halflob' ? 0.95 :
      activeTrajMode === 'carreau' ? 0.55 :
      activeTrajMode === 'screwback' ? 0.45 : 0.25;

    // Horizontal drift in pixels on canvas (up to ~16% width at 50 km/h)
    const maxDriftPx = w * 0.16;
    const windDriftX = (windSpeed / 50) * windCos * trajWindSensitivity * maxDriftPx;

    // Atmospheric Wind Streaks in the sky
    if (windSpeed > 0) {
      ctx.save();
      const numStreaks = Math.min(16, Math.max(4, Math.floor(windSpeed / 3.2)));
      ctx.lineWidth = 1.3;
      for (let s = 0; s < numStreaks; s++) {
        const sy = (s * 0.042 + 0.08) * h;
        const streakLen = 28 + (windSpeed / 50) * 65;
        const flowDir = windCos >= 0 ? 1 : -1;
        const driftOffset = ((Date.now() * 0.05 * flowDir + s * 93) % (w + 100) + (w + 100)) % (w + 100) - 50;

        ctx.strokeStyle = `rgba(148, 163, 184, ${0.08 + (windSpeed / 50) * 0.18})`;
        ctx.beginPath();
        if (windCos >= 0) {
          ctx.moveTo(driftOffset, sy);
          ctx.lineTo(driftOffset + streakLen, sy);
          ctx.lineTo(driftOffset + streakLen - 4, sy - 2.5);
        } else {
          ctx.moveTo(driftOffset, sy);
          ctx.lineTo(driftOffset - streakLen, sy);
          ctx.lineTo(driftOffset - streakLen + 4, sy - 2.5);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 1. Terrain Ground Gradient Fill
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
    groundGrad.addColorStop(0, terrain.groundColorTop);
    groundGrad.addColorStop(1, terrain.groundColorBottom);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // 2. Terrain Ground Boundary Line & Interactive Friction Intensity Heatmap
    if (showFrictionHeatmapRef.current) {
      ctx.save();
      const bandHeight = isMobileCanvas ? 28 : 36;
      const stepPx = isMobileCanvas ? 4 : 3;

      // Render Continuous Thermal Gradient Slices along ground
      for (let px = 0; px < w; px += stepPx) {
        const normX = px / w;
        const localMu = getLocalFrictionMu(selectedTerrain, normX);
        const colTop = getThermalColor(localMu, 0.85);
        const colBottom = getThermalColor(localMu, 0.04);

        const sliceGrad = ctx.createLinearGradient(px, groundY, px, groundY + bandHeight);
        sliceGrad.addColorStop(0, colTop);
        sliceGrad.addColorStop(1, colBottom);

        ctx.fillStyle = sliceGrad;
        ctx.fillRect(px, groundY, stepPx, bandHeight);
      }

      // Modulated Neon Surface Boundary Line
      ctx.lineWidth = isMobileCanvas ? 2.5 : 3.5;
      for (let px = 0; px < w; px += stepPx * 2) {
        const normX = px / w;
        const localMu = getLocalFrictionMu(selectedTerrain, normX);
        ctx.strokeStyle = getThermalColor(localMu, 0.95);
        ctx.beginPath();
        ctx.moveTo(px, groundY);
        ctx.lineTo(Math.min(w, px + stepPx * 2), groundY);
        ctx.stroke();
      }

      // Soft Upward Thermal Glow on Ground Surface
      const glowGrad = ctx.createLinearGradient(0, groundY - 14, 0, groundY);
      glowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      glowGrad.addColorStop(
        1,
        selectedTerrain === 'dry_clay'
          ? 'rgba(6, 182, 212, 0.16)'
          : selectedTerrain === 'gravel'
          ? 'rgba(239, 68, 68, 0.16)'
          : selectedTerrain === 'sandy_ground'
          ? 'rgba(249, 115, 22, 0.16)'
          : 'rgba(16, 185, 129, 0.16)'
      );
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, groundY - 14, w, 14);

      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.strokeStyle = terrain.boundaryColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 3. Terrain-Specific Surface Textures & Decor
    if (selectedTerrain === 'gravel') {
      // Gravel Surface: Scattered angular rocks, pebbles, and stony ridges
      const gravelRocks = [
        { x: 0.14, r: 4.5, col: '#cbd5e1' },
        { x: 0.19, r: 6.5, col: '#94a3b8' },
        { x: 0.25, r: 3.5, col: '#64748b' },
        { x: 0.31, r: 5.5, col: '#cbd5e1' },
        { x: 0.37, r: 4.0, col: '#94a3b8' },
        { x: 0.43, r: 6.0, col: '#475569' },
        { x: 0.49, r: 3.5, col: '#cbd5e1' },
        { x: 0.55, r: 5.0, col: '#94a3b8' },
        { x: 0.61, r: 4.2, col: '#64748b' },
        { x: 0.67, r: 6.5, col: '#cbd5e1' },
        { x: 0.72, r: 4.0, col: '#94a3b8' },
        { x: 0.78, r: 5.5, col: '#64748b' },
        { x: 0.83, r: 4.8, col: '#cbd5e1' },
        { x: 0.89, r: 6.0, col: '#94a3b8' },
        { x: 0.94, r: 3.8, col: '#cbd5e1' },
      ];
      gravelRocks.forEach((rock) => {
        ctx.beginPath();
        ctx.arc(w * rock.x, groundY + 2, rock.r, 0, Math.PI * 2);
        ctx.fillStyle = rock.col;
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    } else if (selectedTerrain === 'sandy_ground') {
      // Sandy Ground Surface: Fine granular sand stippling & soft sand depression
      ctx.fillStyle = 'rgba(254, 243, 199, 0.45)';
      for (let i = 0; i < 45; i++) {
        const sx = (i * 0.021 + 0.04) * w;
        const sy = groundY + 3 + (i % 4) * 3;
        ctx.fillRect(sx, sy, 2, 2);
      }
      // Small landing furrow / indentation in sand
      const landXRef = w * cfg.landRatioX;
      ctx.beginPath();
      ctx.ellipse(landXRef, groundY + 2.5, 16, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(69, 26, 3, 0.55)';
      ctx.fill();
    } else if (selectedTerrain === 'grass') {
      // Grass Surface: Lush lawn turf blades & rich green ground bed
      ctx.fillStyle = 'rgba(21, 128, 61, 0.45)';
      ctx.fillRect(0, groundY, w, 4);

      // Stems and blades of green grass sticking up along ground boundary
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 55; i++) {
        const gx = (i * 0.018 + 0.01) * w;
        const bladeH = 7 + ((i * 7) % 8);
        const slant = ((i % 3) - 1) * 3;
        ctx.strokeStyle = i % 2 === 0 ? '#4ade80' : '#22c55e';
        ctx.beginPath();
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx + slant, groundY - bladeH);
        ctx.stroke();
      }
      // Clustered grass tufts / lawn texture patches
      ctx.fillStyle = 'rgba(134, 239, 172, 0.35)';
      for (let i = 0; i < 35; i++) {
        const sx = (i * 0.028 + 0.02) * w;
        ctx.fillRect(sx, groundY + 4 + (i % 3) * 2, 6, 2);
      }
    } else {
      // Dry Clay Surface: Smooth compacted reddish clay texture
      ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
      for (let i = 0; i < 22; i++) {
        const sx = (i * 0.044 + 0.03) * w;
        ctx.fillRect(sx, groundY + 4, 10, 2);
      }
    }

    // 4. Pitch Throwing Circle (Rond de lancer)
    ctx.beginPath();
    ctx.ellipse(startX, groundY, 26, 7, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '10px "Plus Jakarta Sans", Prompt, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.fillText('วงกลมโยน (Ø 50cm)', startX, groundY + 22);

    // 5. Target Jack (Cochonnet / But)
    const jackX = w * 0.88;
    const jackY = groundY - 6;
    ctx.beginPath();
    ctx.arc(jackX, jackY, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.fillText('แก่น (Cochonnet)', jackX, groundY + 20);

    // 6. Opponent Boule for Carreau and Screwback modes
    // (Wind might cause the boule to drift away and miss or glance the opponent boule)
    const landX_base = w * cfg.landRatioX;
    const landX = Math.max(startX + 28, Math.min(w * 0.94, landX_base + windDriftX));
    const isTargetHitMode = activeTrajMode === 'carreau' || activeTrajMode === 'screwback';

    if (isTargetHitMode) {
      const isTargetHit = Math.abs(landX - jackX) < 26;
      const blastSpeed = activeTrajMode === 'screwback' ? 290 : 220;
      const oppX = jackX + (progress > 0.7 && isTargetHit ? (progress - 0.7) * blastSpeed : 0);
      const oppOpacity = progress > 0.7 && isTargetHit ? Math.max(0.08, 1 - (progress - 0.7) * 2.2) : 1;
      ctx.save();
      ctx.globalAlpha = oppOpacity;
      ctx.beginPath();
      ctx.arc(oppX, groundY - 11, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.strokeStyle = isTargetHit ? '#ef4444' : '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = isTargetHit ? '#ef4444' : '#94a3b8';
      const oppLabel = isTargetHit
        ? activeTrajMode === 'screwback'
          ? 'ลูกคู่แข่ง (ถูกกระแทกกระเด็นพ้นเป้า)'
          : 'ลูกคู่แข่ง (เป้าชน Carreau)'
        : 'ลูกคู่แข่ง (ลมพัดเบี่ยงเป้า)';
      ctx.fillText(oppLabel, oppX, groundY - 16);
      ctx.restore();
    }

    // 7. Trajectory Arc Coordinates with Terrain Physics, Wind & Screwback/Extreme Retro Distance
    const isRetroOrExtreme = activeTrajMode === 'screwback' || activeTrajMode === 'extreme_backspin';
    const isExtreme = activeTrajMode === 'extreme_backspin';
    const isScrewback = activeTrajMode === 'screwback';
    const apexX_base = w * cfg.apexRatioX;
    const apexY = groundY - (h * 0.65 * cfg.apexRatioY);
    const rawFinalX_base = w * cfg.finalRatioX;
    const rollDelta_base = (rawFinalX_base - landX_base) * terrain.rollMultiplier;
    const finalX_base = Math.min(w * 0.95, landX_base + rollDelta_base);

    // Apply horizontal aerodynamic wind force to airborne trajectory
    const apexX = Math.max(startX + 14, apexX_base + windDriftX * 0.42);

    // Ground roll calculation (Normal forward roll vs. Screwback/Extreme Retro Roll)
    let finalX: number;
    let retroRollPx = 0;

    if (isRetroOrExtreme) {
      // In Screwback & Extreme Backspin: Backspin bites the terrain.
      // Dry Clay: strong reverse roll; Gravel: bites quickly; Sand: absorbs
      const retroTerrainFactor =
        selectedTerrain === 'sandy_ground' ? 0.20 :
        selectedTerrain === 'grass' ? 0.45 :
        selectedTerrain === 'gravel' ? 0.85 : 1.15;
      retroRollPx = (w * (isExtreme ? 0.045 : 0.14)) * retroTerrainFactor;
      finalX = Math.max(startX + 50, landX - retroRollPx);
    } else {
      // Forward ground roll adjusted by horizontal wind velocity and surface friction
      const groundWindFactor = (windHorizVelocity / 50) * (0.32 / terrain.friction);
      const rollDelta = Math.max(8, rollDelta_base * (1 + groundWindFactor));
      finalX = Math.max(landX + 6, Math.min(w * 0.96, landX + rollDelta));
    }

    // If wind is present, render the ideal/zero-wind baseline path for comparison
    if (windSpeed > 0 && Math.abs(windDriftX) > 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(apexX_base, apexY, landX_base, groundY);
      ctx.lineTo(finalX_base, groundY);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Ghost marker at baseline landing
      ctx.beginPath();
      ctx.arc(landX_base, groundY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.fill();
      ctx.font = '9px "Plus Jakarta Sans", Prompt, sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('ไร้ลม (0 km/h)', landX_base, groundY + 16);
      ctx.restore();
    }

    // Actual trajectory path line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(apexX, apexY, landX, groundY);
    if (!isRetroOrExtreme) {
      ctx.lineTo(finalX, groundY);
    }
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = windSpeed > 0
      ? (windCos > 0.15 ? '#38bdf8' : windCos < -0.15 ? '#f43f5e' : '#fbbf24')
      : isExtreme ? '#a855f7' : isScrewback ? '#f59e0b' : 'rgba(240, 113, 72, 0.45)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Highlight Landing Point (Donnée / Impact)
    ctx.beginPath();
    ctx.arc(landX, groundY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isExtreme ? '#a855f7' : isScrewback ? '#f59e0b' : '#38bdf8';
    ctx.fill();
    ctx.font = '10px "Plus Jakarta Sans", Prompt, sans-serif';
    ctx.fillStyle = isExtreme ? '#c084fc' : isScrewback ? '#f59e0b' : '#38bdf8';
    ctx.textAlign = 'center';
    const driftMeters = (windDriftX / 28).toFixed(2);
    const donneeLabel = isScrewback
      ? 'จุดปะทะ Fer-à-fer'
      : isExtreme
      ? 'จุดตกกัดดิน Donnée Bite'
      : windSpeed > 0 && Math.abs(windDriftX) > 2
      ? `จุดตก Donnée (${windDriftX > 0 ? '+' : ''}${driftMeters}m ลม)`
      : 'จุดตก Donnée';
    ctx.fillText(donneeLabel, landX, groundY - 10);

    // If Screw Back or Extreme Backspin mode, draw retrograde roll path & indicator
    if (isRetroOrExtreme) {
      ctx.save();
      const retroColor = isExtreme ? '#a855f7' : '#f59e0b';
      // Reverse ground roll vector path
      ctx.beginPath();
      ctx.moveTo(landX, groundY);
      ctx.lineTo(finalX, groundY);
      ctx.strokeStyle = retroColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Reverse arrow head pointing backwards (left)
      ctx.beginPath();
      ctx.moveTo(finalX + 9, groundY - 4.5);
      ctx.lineTo(finalX, groundY);
      ctx.lineTo(finalX + 9, groundY + 4.5);
      ctx.fillStyle = retroColor;
      ctx.strokeStyle = retroColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Final stop marker
      ctx.beginPath();
      ctx.arc(finalX, groundY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      // Retro distance badge label
      const retroCm = Math.round((retroRollPx / 28) * 100);
      ctx.font = 'bold 10px "Plus Jakarta Sans", Prompt, sans-serif';
      ctx.fillStyle = retroColor;
      ctx.textAlign = 'center';
      const retroText = isExtreme
        ? `⚡ กัดหน้าดินเบรกนิ่งฉับพลัน Quick Bite (-${retroCm} cm)`
        : `⏪ สกรูแบคถอยหลัง (-${retroCm} cm)`;
      ctx.fillText(retroText, (landX + finalX) / 2, groundY + 18);
      ctx.restore();
    }

    // 8. Ball Position & Terrain-Specific Bounce / Deceleration
    let ballX = startX;
    let ballY = startY;
    let rotationAngle = 0;

    if (progress <= 0.70) {
      // FLIGHT PHASE IN AIR
      const t = progress / 0.70;
      ballX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * apexX + t * t * landX;
      ballY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * apexY + t * t * groundY;
      rotationAngle = isRetroOrExtreme ? -t * (isExtreme ? 38 : 26) : progress * 15 * (cfg.spinType === 'max' ? -1 : 1);
    } else {
      // GROUND IMPACT, BOUNCE & DECELERATION PHASE
      const pG = (progress - 0.70) / 0.30; // 0 to 1
      ballX = landX + (finalX - landX) * Math.sin((pG * Math.PI) / 2);
      rotationAngle = isRetroOrExtreme
        ? -((isExtreme ? 38 : 26) + pG * (isExtreme ? 28 : 20))
        : progress * 15 * (cfg.spinType === 'max' ? -1 : 1);

      if (isRetroOrExtreme) {
        // Screw Back / Extreme Backspin bites directly with severe backspin; quick compression into earth
        if (pG < 0.16) {
          const biteCompression = Math.sin((pG / 0.16) * Math.PI) * (isExtreme ? 6.0 : 4.5);
          ballY = groundY - biteCompression;
        } else {
          ballY = groundY;
        }
      } else if (selectedTerrain === 'dry_clay') {
        // DRY CLAY: Low friction -> Two clean elastic bounces, then smooth roll
        if (pG < 0.28) {
          const b1 = Math.sin((pG / 0.28) * Math.PI) * (20 * terrain.bounceElasticity);
          ballY = groundY - b1;
        } else if (pG < 0.52) {
          const b2 = Math.sin(((pG - 0.28) / 0.24) * Math.PI) * (9 * terrain.bounceElasticity);
          ballY = groundY - b2;
        } else {
          ballY = groundY;
        }
      } else if (selectedTerrain === 'gravel') {
        // GRAVEL: Erratic stone chatter -> High unpredictable hops & pebble vibration
        if (pG < 0.30) {
          const b1 = Math.sin((pG / 0.30) * Math.PI) * (28 * terrain.bounceElasticity);
          ballY = groundY - b1;
        } else if (pG < 0.55) {
          const b2 = Math.sin(((pG - 0.30) / 0.25) * Math.PI) * (15 * terrain.bounceElasticity);
          ballY = groundY - b2;
        } else if (pG < 0.72) {
          const b3 = Math.sin(((pG - 0.55) / 0.17) * Math.PI) * (7 * terrain.bounceElasticity);
          ballY = groundY - b3;
        } else {
          // Micro stone chatter before coming to full stop
          ballY = groundY - (pG < 0.92 ? Math.sin(pG * 45) * 1.5 : 0);
        }
      } else if (selectedTerrain === 'grass') {
        // GRASS: High friction + turf cushioning -> Soft damped bounce & quick deceleration
        if (pG < 0.22) {
          const b1 = Math.sin((pG / 0.22) * Math.PI) * (12 * terrain.bounceElasticity);
          ballY = groundY - b1;
        } else if (pG < 0.44) {
          const b2 = Math.sin(((pG - 0.22) / 0.22) * Math.PI) * (4.5 * terrain.bounceElasticity);
          ballY = groundY - b2;
        } else {
          ballY = groundY;
        }
      } else {
        // SANDY GROUND: Very high friction -> Impact absorbed, near-zero bounce, sinks into sand
        if (pG < 0.12) {
          const b1 = Math.sin((pG / 0.12) * Math.PI) * (2.5 * terrain.bounceElasticity);
          ballY = groundY - b1;
        } else {
          // Nestles into sand furrow
          const sinkDepth = Math.min(2.5, ((pG - 0.12) / 0.3) * 2.5);
          ballY = groundY + sinkDepth;
        }
      }
    }

    // 9. Impact Surface Particles
    if (progress >= 0.69 && progress <= 0.83) {
      const impactAge = (progress - 0.69) / 0.14; // 0 to 1
      ctx.save();
      if (selectedTerrain === 'gravel') {
        // Flying stone chips / sparks
        ctx.fillStyle = `rgba(203, 213, 225, ${Math.max(0, 1 - impactAge)})`;
        [-14, -8, -2, 6, 12, 18].forEach((offset) => {
          ctx.beginPath();
          ctx.arc(
            landX + offset * impactAge * 1.8,
            groundY - (12 - Math.abs(offset * 0.6)) * impactAge * 1.6,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      } else if (selectedTerrain === 'sandy_ground') {
        // Expanding soft sand puff ring
        ctx.beginPath();
        ctx.ellipse(landX, groundY, impactAge * 34, impactAge * 9, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0, 0.8 * (1 - impactAge))})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (selectedTerrain === 'grass') {
        // Flying grass blades and turf flecks on impact
        [-16, -11, -5, 5, 12, 18].forEach((offset, idx) => {
          ctx.save();
          ctx.translate(
            landX + offset * impactAge * 1.6,
            groundY - (12 - Math.abs(offset * 0.45)) * impactAge * 1.5
          );
          ctx.rotate((idx * 45 * Math.PI) / 180 + impactAge * 2.5);
          ctx.fillStyle = idx % 2 === 0 ? `rgba(74, 222, 128, ${Math.max(0, 1 - impactAge)})` : `rgba(34, 197, 94, ${Math.max(0, 1 - impactAge)})`;
          ctx.fillRect(-1.5, -4.5, 3, 9);
          ctx.restore();
        });

        // Soft green turf compression ring
        ctx.beginPath();
        ctx.ellipse(landX, groundY, impactAge * 28, impactAge * 7, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${Math.max(0, 0.8 * (1 - impactAge))})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Dry clay dust cloud
        ctx.beginPath();
        ctx.ellipse(landX, groundY, impactAge * 26, impactAge * 6.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249, 115, 22, ${Math.max(0, 0.7 * (1 - impactAge))})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 10. Carreau, Screwback, and Extreme Backspin impact explosion / bite spark
    if ((activeTrajMode === 'carreau' || activeTrajMode === 'screwback' || activeTrajMode === 'extreme_backspin') && progress >= 0.68 && progress <= 0.85) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(landX, groundY - 10, (progress - 0.68) * 130, 0, Math.PI * 2);
      ctx.strokeStyle = isExtreme ? 'rgba(168, 85, 247, 0.7)' : activeTrajMode === 'screwback' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Sparks kicking backwards for screwback and extreme backspin
      if (activeTrajMode === 'screwback' || isExtreme) {
        ctx.fillStyle = isExtreme ? '#c084fc' : '#fbbf24';
        const sparkCount = isExtreme ? 10 : 7;
        for (let sp = 0; sp < sparkCount; sp++) {
          const spAngle = (sp * (360 / sparkCount) * Math.PI) / 180;
          const spDist = (progress - 0.68) * 110;
          ctx.beginPath();
          ctx.arc(landX + Math.cos(spAngle) * spDist, (groundY - 10) + Math.sin(spAngle) * spDist, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 11. Draw Petanque Ball (Boule) with metallic gradient and striation
    ctx.save();
    ctx.translate(ballX, ballY - 11);
    ctx.rotate(rotationAngle);

    const bouleGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 11);
    bouleGrad.addColorStop(0, '#ffffff');
    bouleGrad.addColorStop(0.4, '#cbd5e1');
    bouleGrad.addColorStop(1, '#475569');

    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = bouleGrad;
    ctx.fill();
    ctx.strokeStyle = '#e05326';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Striation line on ball
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();

    // Step-through Frame Inspection Reticle & Vertical Laser Guideline when paused
    if (isPausedRef.current) {
      ctx.save();
      // 1. Vertical projection laser guideline from boule center down to ground
      if (ballY < groundY - 2) {
        ctx.beginPath();
        ctx.moveTo(ballX, ballY);
        ctx.lineTo(ballX, groundY);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ground contact bead
        ctx.beginPath();
        ctx.arc(ballX, groundY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Luminous reticle ring around boule
      ctx.beginPath();
      ctx.arc(ballX, ballY - 11, 18, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Floating In-Canvas Telemetry Pill
      const distM = (((ballX - startX) / (w * 0.78)) * 8.0).toFixed(1);
      const altM = Math.max(0, ((groundY - ballY) / (h * 0.65)) * 2.2).toFixed(2);
      const pillText = `📍 ${distM}m | สูง: ${altM}m (${(progress * 100).toFixed(0)}%)`;
      ctx.font = isMobileCanvas ? 'bold 8.5px "Plus Jakarta Sans", Prompt, sans-serif' : 'bold 10px "Plus Jakarta Sans", Prompt, sans-serif';
      const pillW = ctx.measureText(pillText).width + 16;
      const pillH = isMobileCanvas ? 18 : 22;
      const pillX = Math.max(8, Math.min(w - pillW - 8, ballX - pillW / 2));
      const pillY = Math.max(10, ballY - 34);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(pillText, pillX + pillW / 2, pillY + (isMobileCanvas ? 12 : 14.5));
      ctx.restore();
    }

    // 12. Canvas Wind Vector HUD Widget (Top Right of Canvas)
    const hudW = isMobileCanvas ? 116 : 152;
    const hudH = isMobileCanvas ? 40 : 50;
    const hudX = w - hudW - (isMobileCanvas ? 8 : 14);
    const hudY = isMobileCanvas ? 8 : 14;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, isMobileCanvas ? 8 : 10);
    ctx.fill();
    ctx.stroke();

    // Rotating wind compass arrow
    const dialCenterX = hudX + (isMobileCanvas ? 16 : 22);
    const dialCenterY = hudY + (isMobileCanvas ? 20 : 25);
    ctx.save();
    ctx.translate(dialCenterX, dialCenterY);
    ctx.rotate(windAngleRad);
    ctx.strokeStyle = windSpeed === 0 ? '#94a3b8' : windCos > 0.15 ? '#38bdf8' : windCos < -0.15 ? '#f43f5e' : '#fbbf24';
    ctx.lineWidth = isMobileCanvas ? 1.8 : 2.2;
    ctx.beginPath();
    ctx.moveTo(isMobileCanvas ? -8 : -11, 0);
    ctx.lineTo(isMobileCanvas ? 7 : 9, 0);
    ctx.lineTo(isMobileCanvas ? 3 : 4, -3.5);
    ctx.moveTo(isMobileCanvas ? 7 : 9, 0);
    ctx.lineTo(isMobileCanvas ? 3 : 4, 3.5);
    ctx.stroke();
    ctx.restore();

    ctx.font = isMobileCanvas ? 'bold 8.5px "Plus Jakarta Sans", Prompt, sans-serif' : 'bold 10px "Plus Jakarta Sans", Prompt, sans-serif';
    ctx.fillStyle = windSpeed === 0 ? '#94a3b8' : windCos > 0.15 ? '#38bdf8' : windCos < -0.15 ? '#f43f5e' : '#fbbf24';
    ctx.textAlign = 'left';
    ctx.fillText(`Wind: ${windSpeed} km/h (${windDirection}°)`, hudX + (isMobileCanvas ? 32 : 42), hudY + (isMobileCanvas ? 16 : 20));

    ctx.font = isMobileCanvas ? '7.5px "Plus Jakarta Sans", Prompt, sans-serif' : '9px "Plus Jakarta Sans", Prompt, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const hudStatus = windSpeed === 0
      ? '🍃 ลมสงบ (Calm)'
      : windCos > 0.2
      ? `➡️ ตามลม +${(windHorizVelocity).toFixed(1)} km/h`
      : windCos < -0.2
      ? `⬅️ ต้านลม ${(windHorizVelocity).toFixed(1)} km/h`
      : '⬆️ ลมพัดขวางลำตัว';
    ctx.fillText(hudStatus, hudX + (isMobileCanvas ? 32 : 42), hudY + (isMobileCanvas ? 29 : 36));
    ctx.restore();

    // --- 13. TACTICAL DONNÉE LANDING ZONES & INTERACTIVE POINT SELECTION HUD ---
    if (showFrictionHeatmapRef.current) {
      ctx.save();

      // A. Optimal Donnée Zone Highlight
      const donneeZone = getOptimalDonneeZone(activeTrajMode, selectedTerrain);
      const zoneLeftX = w * donneeZone.minRatioX;
      const zoneRightX = w * donneeZone.maxRatioX;
      const zoneWidth = Math.max(20, zoneRightX - zoneLeftX);
      const zoneOptX = w * donneeZone.optimalRatioX;

      // Illuminated tactical zone band on ground
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.fillRect(zoneLeftX, groundY - 22, zoneWidth, 22);

      // Top boundary dashed line of zone
      ctx.beginPath();
      ctx.moveTo(zoneLeftX, groundY - 22);
      ctx.lineTo(zoneRightX, groundY - 22);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Corner brackets ┌ and ┐
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(zoneLeftX, groundY - 8);
      ctx.lineTo(zoneLeftX, groundY - 22);
      ctx.lineTo(zoneLeftX + 8, groundY - 22);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(zoneRightX, groundY - 8);
      ctx.lineTo(zoneRightX, groundY - 22);
      ctx.lineTo(zoneRightX - 8, groundY - 22);
      ctx.stroke();

      // Target Donnée icon badge
      ctx.beginPath();
      ctx.arc(zoneOptX, groundY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = isMobileCanvas ? 'bold 8px "Plus Jakarta Sans", Prompt, sans-serif' : 'bold 9.5px "Plus Jakarta Sans", Prompt, sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText(
        isMobileCanvas
          ? `🎯 โซน Donnée (${donneeZone.minMeters}-${donneeZone.maxMeters}m)`
          : `🎯 โซน Donnée แนะนำ (${donneeZone.minMeters}m - ${donneeZone.maxMeters}m) • ความเหมาะสม ${donneeZone.suitabilityScore}%`,
        zoneOptX,
        groundY - 26
      );

      // Local friction annotation at current landing point landX
      const landingMu = getLocalFrictionMu(selectedTerrain, landX / w);
      ctx.font = isMobileCanvas ? '8px "Plus Jakarta Sans", Prompt, sans-serif' : '9px "Plus Jakarta Sans", Prompt, sans-serif';
      ctx.fillStyle = getThermalColor(landingMu);
      ctx.fillText(`μ = ${landingMu.toFixed(2)} (${landingMu > 0.65 ? 'ต้านแรง' : landingMu > 0.45 ? 'เกาะยึด' : 'ลื่นไหล'})`, landX, groundY + (isMobileCanvas ? 16 : 20));

      // B. Terrain Hazard Indicators (Gravel stones & Sandy sinks)
      if (selectedTerrain === 'gravel') {
        [0.34, 0.58, 0.76].forEach((hzRatio) => {
          const hzX = w * hzRatio;
          ctx.beginPath();
          ctx.arc(hzX, groundY, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 8px "Plus Jakarta Sans", Prompt, sans-serif';
          ctx.fillStyle = '#f87171';
          ctx.fillText('⚠️ หินแฉลบ', hzX, groundY + (isMobileCanvas ? 26 : 30));
        });
      } else if (selectedTerrain === 'sandy_ground') {
        const sinkX = w * 0.69;
        ctx.font = 'bold 8px "Plus Jakarta Sans", Prompt, sans-serif';
        ctx.fillStyle = '#fb923c';
        ctx.fillText('⬇️ หลุมทรายดูดแรง', sinkX, groundY + (isMobileCanvas ? 26 : 30));
      }

      // C. Interactive Cursor / Custom Clicked Point HUD & Projection Reticle
      const activePoint = canvasCursorPosRef.current
        ? analyzePointSelection(canvasCursorPosRef.current.x, w, groundY, selectedTerrain, activeTrajMode)
        : customDonneeMarkerRef.current;

      if (activePoint) {
        const targetX = canvasCursorPosRef.current
          ? canvasCursorPosRef.current.x
          : startX + (activePoint.distanceMeters / 8.0) * (jackX - startX);

        // Vertical Laser Guide Line
        ctx.beginPath();
        ctx.moveTo(targetX, 0);
        ctx.lineTo(targetX, groundY + 36);
        ctx.strokeStyle = activePoint.color;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Concentric Target Rings on ground surface
        ctx.beginPath();
        ctx.ellipse(targetX, groundY, 14, 4.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = activePoint.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(targetX, groundY, 6, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = activePoint.color;
        ctx.fill();

        // Projected Roll Vector from this landing spot
        const rollPixels = (activePoint.projectedRollMeters / 8.0) * (jackX - startX);
        const estFinalX = Math.max(startX + 10, Math.min(w * 0.98, targetX + rollPixels));

        ctx.beginPath();
        ctx.moveTo(targetX, groundY);
        ctx.lineTo(estFinalX, groundY);
        ctx.strokeStyle = activePoint.projectedRollMeters < 0 ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrow head on projected roll
        ctx.beginPath();
        if (activePoint.projectedRollMeters >= 0) {
          ctx.moveTo(estFinalX - 7, groundY - 3.5);
          ctx.lineTo(estFinalX, groundY);
          ctx.lineTo(estFinalX - 7, groundY + 3.5);
        } else {
          ctx.moveTo(estFinalX + 7, groundY - 3.5);
          ctx.lineTo(estFinalX, groundY);
          ctx.lineTo(estFinalX + 7, groundY + 3.5);
        }
        ctx.strokeStyle = activePoint.projectedRollMeters < 0 ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Final stop circle
        ctx.beginPath();
        ctx.arc(estFinalX, groundY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();

        // In-Canvas Floating Telemetry Card
        const tooltipW = isMobileCanvas ? 175 : 230;
        const tooltipH = isMobileCanvas ? 72 : 84;
        let ttX = targetX + 12;
        if (ttX + tooltipW > w - 10) ttX = targetX - tooltipW - 12;
        if (ttX < 10) ttX = 10;
        const ttY = Math.max(10, groundY - tooltipH - 24);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = activePoint.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(ttX, ttY, tooltipW, tooltipH, 10);
        ctx.fill();
        ctx.stroke();

        // Tooltip Typography
        ctx.font = isMobileCanvas ? 'bold 9px "Plus Jakarta Sans", Prompt, sans-serif' : 'bold 10.5px "Plus Jakarta Sans", Prompt, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`📍 จุด Donnée: ${activePoint.distanceMeters} m`, ttX + 10, ttY + 16);

        ctx.font = isMobileCanvas ? '8.5px "Plus Jakarta Sans", Prompt, sans-serif' : '9.5px "Plus Jakarta Sans", Prompt, sans-serif';
        ctx.fillStyle = activePoint.color;
        ctx.fillText(`⚡ แรงเสียดทาน: μ = ${activePoint.mu.toFixed(2)} (${activePoint.surfaceStatusTh.split('(')[0].trim()})`, ttX + 10, ttY + 32);

        ctx.font = isMobileCanvas ? '8px "Plus Jakarta Sans", Prompt, sans-serif' : '9px "Plus Jakarta Sans", Prompt, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        const rollLabel = activePoint.projectedRollMeters < 0
          ? `⏪ สกรูแบคถอยหลัง: ${(activePoint.projectedRollMeters * 100).toFixed(0)} cm`
          : `🔄 คาดการณ์ระยะกลิ้งต่อ: +${activePoint.projectedRollMeters.toFixed(2)} m`;
        ctx.fillText(rollLabel, ttX + 10, ttY + 48);

        ctx.font = isMobileCanvas ? '7.5px "Plus Jakarta Sans", Prompt, sans-serif' : '8.5px "Plus Jakarta Sans", Prompt, sans-serif';
        ctx.fillStyle = activePoint.hazardType === 'pebble_hazard' ? '#f87171' : activePoint.hazardType === 'optimal_donnee' ? '#34d399' : activePoint.hazardType === 'sand_sink' ? '#fb923c' : '#38bdf8';
        ctx.fillText(
          activePoint.hazardType === 'pebble_hazard'
            ? '⚠️ เสี่ยงแฉลบหิน หลีกเลี่ยงจุดนี้'
            : activePoint.hazardType === 'optimal_donnee'
            ? '✨ โซนคุณภาพ ควบคุมง่าย'
            : activePoint.hazardType === 'sand_sink'
            ? '⬇️ ทรายดูดแรง จมหยุดเร็ว'
            : '🍃 พื้นเรียบลื่น วิ่งไหลไกล',
          ttX + 10,
          ttY + (isMobileCanvas ? 62 : 68)
        );
      }

      ctx.restore();
    }
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight || 340;
    drawTrajectoryFrame(animProgress);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleAudio = () => {
    setIsAudioEnabled((prev) => {
      const next = !prev;
      if (next) {
        audioEngine.playMetalImpact();
      } else {
        audioEngine.stopRoll();
      }
      return next;
    });
  };

  const runAnimation = (startProgress: number = 0) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    soundFlagsRef.current = {
      throw: startProgress > 0,
      impact: startProgress >= 0.70,
      roll: startProgress >= 0.70,
    };
    let p = startProgress;
    setIsAnimating(true);
    setIsPaused(false);
    isPausedRef.current = false;

    if (isAudioEnabled && startProgress < 0.1) {
      soundFlagsRef.current.throw = true;
      audioEngine.playThrow();
    }

    const step = () => {
      p += 0.015 * playbackSpeed;

      // Audio triggers
      if (isAudioEnabled) {
        if (p >= 0.70 && !soundFlagsRef.current.impact) {
          soundFlagsRef.current.impact = true;
          if (activeTrajMode === 'carreau' || activeTrajMode === 'screwback') {
            audioEngine.playMetalImpact();
          } else {
            audioEngine.playImpact(selectedTerrain);
          }
          if (!soundFlagsRef.current.roll) {
            soundFlagsRef.current.roll = true;
            const remainingDuration = ((0.30 / (0.015 * playbackSpeed)) * 16.67) / 1000;
            audioEngine.playRoll(selectedTerrain, remainingDuration);
          }
        }
      }

      if (p >= 1) {
        p = 1;
        setAnimProgress(1);
        animProgressRef.current = 1;
        setIsAnimating(false);
        setIsPaused(false);
        isPausedRef.current = false;
        drawTrajectoryFrame(1);
        audioEngine.stopRoll();
      } else {
        setAnimProgress(p);
        animProgressRef.current = p;
        drawTrajectoryFrame(p);
        animFrameRef.current = requestAnimationFrame(step);
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  const handlePauseSimulation = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(false);
    setIsPaused(true);
    isPausedRef.current = true;
    audioEngine.stopRoll();
    drawTrajectoryFrame(animProgressRef.current);
  };

  const handlePlayOrResumeSimulation = () => {
    if (animProgress >= 1) {
      runAnimation(0);
    } else {
      runAnimation(animProgress);
    }
  };

  const handleStepSliderChange = (newVal: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(false);
    setIsPaused(true);
    isPausedRef.current = true;
    audioEngine.stopRoll();
    const clamped = Math.max(0, Math.min(1, newVal));
    setAnimProgress(clamped);
    animProgressRef.current = clamped;
    drawTrajectoryFrame(clamped);
  };

  const handleStepFrame = (delta: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(false);
    setIsPaused(true);
    isPausedRef.current = true;
    audioEngine.stopRoll();
    setAnimProgress((prev) => {
      const next = Math.max(0, Math.min(1, Number((prev + delta).toFixed(3))));
      animProgressRef.current = next;
      requestAnimationFrame(() => drawTrajectoryFrame(next));
      return next;
    });
  };

  const replaySimulation = () => {
    runAnimation(0);
  };

  useEffect(() => {
    runAnimation(0);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioEngine.stopRoll();
    };
  }, [activeTrajMode, selectedTerrain, playbackSpeed, isAudioEnabled, windSpeed, windDirection]);

  // Point-in-Time Physics Telemetry for Step-Through Inspection at current frame
  const currentPhysicsData = useMemo(() => {
    const p = animProgress;
    const cfg = TRAJECTORY_PRESETS[activeTrajMode];
    const terrain = TERRAIN_PRESETS[selectedTerrain];

    let phase: 'launch' | 'flight' | 'apex' | 'impact' | 'bounce_roll' | 'rest';
    let phaseTh: string;
    let phaseIcon: string;

    if (p === 0) {
      phase = 'launch';
      phaseTh = 'จุดปล่อยลูก (Launch Release 0%)';
      phaseIcon = 'fa-rocket';
    } else if (p >= 0.32 && p <= 0.38) {
      phase = 'apex';
      phaseTh = 'จุดสูงสุดวิถีโค้ง (Trajectory Apex)';
      phaseIcon = 'fa-mountain';
    } else if (p < 0.69) {
      phase = 'flight';
      phaseTh = 'ลอยตัวในอากาศ (Airborne Trajectory)';
      phaseIcon = 'fa-paper-plane';
    } else if (p >= 0.69 && p <= 0.72) {
      phase = 'impact';
      phaseTh = 'จุดตกกระทบพื้น (Donnée Impact Point)';
      phaseIcon = 'fa-burst';
    } else if (p > 0.72 && p < 0.98) {
      phase = 'bounce_roll';
      phaseTh = activeTrajMode === 'extreme_backspin'
        ? 'กัดหน้าดินเบรกนิ่งฉับพลัน (Extreme Backspin Quick Bite)'
        : activeTrajMode === 'screwback'
        ? 'สกรูแบคกัดพื้นถอยหลัง (Retro Bite)'
        : 'กลิ้งและกระดอน (Bounce & Rollout)';
      phaseIcon = 'fa-arrows-spin';
    } else {
      phase = 'rest';
      phaseTh = 'จุดหยุดนิ่งสัมบูรณ์ (Final Rest Position)';
      phaseIcon = 'fa-flag-checkered';
    }

    const launchAngle = isCustomPhysics ? customReleaseAngle : (activeTrajMode === 'rolling' ? 30 : activeTrajMode === 'halflob' ? 50 : activeTrajMode === 'highlob' ? 70 : activeTrajMode === 'extreme_backspin' ? 65 : 45);
    const launchVel = isCustomPhysics ? customInitialVelocity : (activeTrajMode === 'rolling' ? 6.5 : activeTrajMode === 'halflob' ? 7.8 : activeTrajMode === 'highlob' ? 9.2 : activeTrajMode === 'extreme_backspin' ? 8.9 : 8.5);
    const backspinRpm = isCustomPhysics ? customBackspinRpm : (activeTrajMode === 'extreme_backspin' ? 480 : (cfg.spinType === 'max' || activeTrajMode === 'screwback' ? 520 : cfg.spinType === 'high' ? 380 : cfg.spinType === 'medium' ? 220 : 60));

    const peakApexMeters = isCustomPhysics
      ? Number((((launchVel * Math.sin((launchAngle * Math.PI) / 180)) ** 2) / (2 * 9.8)).toFixed(2))
      : parseFloat(cfg.apexDisplay) || 1.8;

    const donneeDistMeters = isCustomPhysics
      ? Number((((launchVel ** 2) * Math.sin((2 * launchAngle * Math.PI) / 180)) / 9.8).toFixed(1))
      : parseFloat(cfg.landingDisplay) || 6.5;

    const rollDistMeters = activeTrajMode === 'extreme_backspin'
      ? -0.18
      : activeTrajMode === 'screwback'
      ? -0.42
      : Number((donneeDistMeters * (1 - cfg.landRatioX / cfg.finalRatioX) * terrain.rollMultiplier).toFixed(2));

    let currentX_m = 0;
    let currentY_m = 0;
    let currentSpeed_ms = 0;
    let currentSpin_rpm = backspinRpm;

    if (p <= 0.70) {
      const t = p / 0.70;
      currentX_m = Number((t * donneeDistMeters).toFixed(2));
      currentY_m = Number((4 * peakApexMeters * t * (1 - t)).toFixed(2));
      const vx = launchVel * Math.cos((launchAngle * Math.PI) / 180);
      const vy = launchVel * Math.sin((launchAngle * Math.PI) / 180) - 9.8 * (t * 0.9);
      currentSpeed_ms = Number((Math.sqrt(vx * vx + vy * vy)).toFixed(1));
    } else {
      const pG = (p - 0.70) / 0.30;
      if (activeTrajMode === 'screwback' || activeTrajMode === 'extreme_backspin') {
        currentX_m = Number((donneeDistMeters + rollDistMeters * Math.sin((pG * Math.PI) / 2)).toFixed(2));
      } else {
        currentX_m = Number((donneeDistMeters + Math.max(0.2, rollDistMeters) * Math.sin((pG * Math.PI) / 2)).toFixed(2));
      }

      if (pG < 0.25) {
        currentY_m = Number((Math.sin((pG / 0.25) * Math.PI) * 0.28 * terrain.bounceElasticity).toFixed(2));
      } else if (pG < 0.50) {
        currentY_m = Number((Math.sin(((pG - 0.25) / 0.25) * Math.PI) * 0.12 * terrain.bounceElasticity).toFixed(2));
      } else {
        currentY_m = 0.00;
      }

      const impactSpeed = launchVel * 0.65;
      currentSpeed_ms = Number((Math.max(0, impactSpeed * (1 - pG) * (1 - terrain.friction * 0.5))).toFixed(1));
      currentSpin_rpm = Math.round(backspinRpm * Math.max(0, 1 - pG * 1.2));
    }

    const windEffectCos = Math.cos((windDirection * Math.PI) / 180);
    const windDriftDistM = Number(((windSpeed / 50) * windEffectCos * 0.85 * (p <= 0.7 ? p / 0.7 : 1)).toFixed(2));

    return {
      progressPct: Math.round(p * 100),
      phase,
      phaseTh,
      phaseIcon,
      currentX_m,
      currentY_m,
      currentSpeed_ms,
      currentSpeed_kmh: Number((currentSpeed_ms * 3.6).toFixed(1)),
      currentSpin_rpm,
      peakApexMeters,
      donneeDistMeters,
      rollDistMeters,
      windDriftDistM,
      frictionMu: terrain.friction,
      frictionLabel: terrain.frictionLabel,
    };
  }, [animProgress, activeTrajMode, selectedTerrain, isCustomPhysics, customReleaseAngle, customInitialVelocity, customBackspinRpm, windSpeed, windDirection]);

  // Filtered Techniques
  const filteredTechniques = TECHNIQUES_DATA.filter((item) => {
    const matchFilter = activeFilter === 'all' || item.level === activeFilter;
    const matchQuery =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.overview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchQuery;
  });

  // Filtered Drills
  const filteredDrills = DRILLS_DATA.filter((drill) => {
    if (drillFilter === 'all') return true;
    return drill.category === drillFilter;
  });

  // Strictly filter tournaments that are current or future (filtering out past/concluded events)
  const currentAndFutureTournaments: TournamentItem[] = useMemo(() => {
    return TOURNAMENTS_DATA.filter((tourney: TournamentItem) => {
      const dates = TOURNAMENT_DATES[tourney.id];
      if (dates && dates.end < CURRENT_PETANQUE_DATE) {
        return false;
      }
      return true;
    });
  }, []);

  // Filtered Tournaments & Competitions based on user search & filter pills
  const filteredTournaments: TournamentItem[] = useMemo(() => {
    return currentAndFutureTournaments.filter((tourney: TournamentItem) => {
      const matchScope = tourneyScopeFilter === 'all' || tourney.scope === tourneyScopeFilter;
      const matchCategory = tourneyCategoryFilter === 'all' || tourney.category === tourneyCategoryFilter;
      const matchStatus = tourneyStatusFilter === 'all' || tourney.status === tourneyStatusFilter;
      const q = tourneySearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tourney.title.toLowerCase().includes(q) ||
        tourney.titleEn.toLowerCase().includes(q) ||
        tourney.location.toLowerCase().includes(q) ||
        tourney.country.toLowerCase().includes(q) ||
        tourney.format.toLowerCase().includes(q) ||
        tourney.organizer.toLowerCase().includes(q) ||
        tourney.liveChannels.some(
          (c: LiveChannel) =>
            c.name.toLowerCase().includes(q) ||
            c.badge.toLowerCase().includes(q) ||
            c.schedule.toLowerCase().includes(q)
        );
      return matchScope && matchCategory && matchStatus && matchSearch;
    });
  }, [currentAndFutureTournaments, tourneyScopeFilter, tourneyCategoryFilter, tourneyStatusFilter, tourneySearchQuery]);

  // Score Tracker Functions
  const addPointA = () => {
    if (scoreTeamA < 13) setScoreTeamA((prev) => prev + 1);
  };
  const addPointB = () => {
    if (scoreTeamB < 13) setScoreTeamB((prev) => prev + 1);
  };
  const recordMene = (pointsA: number, pointsB: number) => {
    const nextMene = meneHistory.length + 1;
    setMeneHistory([...meneHistory, { mene: nextMene, a: pointsA, b: pointsB }]);
  };
  const resetScore = () => {
    setScoreTeamA(0);
    setScoreTeamB(0);
    setMeneHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      {/* HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo */}
            <a href="#" className="flex items-center space-x-3.5 group">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950/80 to-slate-900 p-1.5 flex items-center justify-center border border-sky-500/30 shadow-lg shadow-sky-500/20 group-hover:border-sky-400/60 group-hover:shadow-sky-500/40 transform group-hover:scale-105 transition duration-300">
                <img
                  src="/assets/aistudio/Artboard_5_d7d07c9e.png"
                  alt="Petanque Pro Official Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white font-heading">
                  PETANQUE<span className="gradient-text ml-1">PRO</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                  Master Technique Guide
                </span>
              </div>
            </a>

            {/* Desktop Grouped Navigation (User Request #1) */}
            <nav className="hidden lg:flex items-center space-x-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
              {/* Category 1: การฝึกซ้อม (Training) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveNavDropdown('training')}
                onMouseLeave={() => setActiveNavDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => setActiveNavDropdown(activeNavDropdown === 'training' ? null : 'training')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeNavDropdown === 'training'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <i className="fa-solid fa-bullseye text-amber-400"></i>
                  <span>การฝึกซ้อม (Training)</span>
                  <i className="fa-solid fa-chevron-down text-[9px] text-slate-400"></i>
                </button>

                {activeNavDropdown === 'training' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 space-y-1 z-50 animate-scale-up">
                    <a
                      href="#simulator"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-cubes"></i>
                      </div>
                      <div>
                        <strong className="block font-bold">วิถีโคจร 2D & มุมมองบน</strong>
                        <span className="text-[10px] text-slate-400">Trajectory & Bird's-Eye View</span>
                      </div>
                    </a>

                    <a
                      href="#techniques"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-person-running"></i>
                      </div>
                      <div>
                        <strong className="block font-bold">เทคนิคการเล่นระดับโปร</strong>
                        <span className="text-[10px] text-slate-400">Technique Masterclass</span>
                      </div>
                    </a>

                    <a
                      href="#drills"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-stopwatch-20"></i>
                      </div>
                      <div>
                        <strong className="block font-bold">คลังแบบฝึก & ตัวจับเวลา</strong>
                        <span className="text-[10px] text-slate-400">Drill Library & Live Timer</span>
                      </div>
                    </a>

                    <a
                      href="#tactics-board"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-purple-950/40 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition group border border-purple-500/20"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-chess-knight"></i>
                      </div>
                      <div>
                        <strong className="block font-bold text-purple-300">กระดานแทกติก Mène</strong>
                        <span className="text-[10px] text-purple-400">✨ Interactive Board & Strategy</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Category 2: อุปกรณ์ (Equipment) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveNavDropdown('equipment')}
                onMouseLeave={() => setActiveNavDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => setActiveNavDropdown(activeNavDropdown === 'equipment' ? null : 'equipment')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeNavDropdown === 'equipment'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <i className="fa-solid fa-sliders text-orange-400"></i>
                  <span>อุปกรณ์ (Equipment)</span>
                  <i className="fa-solid fa-chevron-down text-[9px] text-slate-400"></i>
                </button>

                {activeNavDropdown === 'equipment' && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 space-y-1 z-50 animate-scale-up">
                    <a
                      href="#calculator"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-calculator"></i>
                      </div>
                      <div>
                        <strong className="block font-bold">Boule Finder Calculator</strong>
                        <span className="text-[10px] text-slate-400">คำนวณตามสรีระมือและตำแหน่ง</span>
                      </div>
                    </a>

                    <a
                      href="#calculator"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-tags"></i>
                      </div>
                      <div>
                        <strong className="block font-bold">Brand & Model Matching</strong>
                        <span className="text-[10px] text-amber-400">Obut, MS, La Boule Bleue, Decathlon</span>
                      </div>
                    </a>

                    <a
                      href="#specs"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>
                      <div>
                        <strong className="block font-bold">Hardness & Specs Matrix</strong>
                        <span className="text-[10px] text-slate-400">ความแข็ง kg/mm² & โลหะ</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Category 3: การแข่งขัน (Match & Live) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveNavDropdown('match')}
                onMouseLeave={() => setActiveNavDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => setActiveNavDropdown(activeNavDropdown === 'match' ? null : 'match')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeNavDropdown === 'match'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <i className="fa-solid fa-trophy text-rose-400"></i>
                  <span>การแข่งขัน (Match & Live)</span>
                  <i className="fa-solid fa-chevron-down text-[9px] text-slate-400"></i>
                </button>

                {activeNavDropdown === 'match' && (
                  <div className="absolute top-full right-0 mt-1 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 space-y-1 z-50 animate-scale-up">
                    <a
                      href="#tactics"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-chess"></i>
                      </div>
                      <div>
                        <strong className="block font-bold">กลยุทธ์และแทกติกแก้เกม</strong>
                        <span className="text-[10px] text-slate-400">Game Strategy & Terrain</span>
                      </div>
                    </a>

                    <a
                      href="#score-tool"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-chart-column"></i>
                      </div>
                      <div>
                        <strong className="block font-bold">Mène Analysis & บันทึกสกอร์</strong>
                        <span className="text-[10px] text-slate-400">Match Tracker & Telemetry</span>
                      </div>
                    </a>

                    <a
                      href="#tournaments"
                      onClick={() => setActiveNavDropdown(null)}
                      className="p-2 rounded-xl hover:bg-rose-950/40 flex items-center gap-2.5 text-xs text-rose-300 hover:text-white transition bg-rose-500/10 border border-rose-500/30"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <i className="fa-solid fa-tower-broadcast"></i>
                      </div>
                      <div>
                        <strong className="block font-bold text-rose-300">ตารางแข่งขัน & ถ่ายทอดสด</strong>
                        <span className="text-[10px] text-rose-400">🔴 ทัวร์นาเมนต์โอเพ่นและชิงแชมป์</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </nav>

            {/* Action CTA & User Profile Button */}
            <div className="hidden sm:flex items-center gap-2.5">
              <a
                href="#tournaments"
                className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-400/30 transition flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>🔴 Live สด</span>
              </a>

              {/* User Profile / Guest Login Pill */}
              {userAccount.isGuest ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalReason('general_login');
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 font-bold text-xs transition flex items-center gap-2 shadow-sm"
                  title="เข้าสู่ระบบด้วย Google, Facebook, LINE หรือใช้งานในโหมด Guest"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-amber-400">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <span>เข้าสู่ระบบ</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                    Guest
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setUserProfileModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-orange-500/40 hover:border-orange-500/80 transition flex items-center gap-2 group shadow-sm"
                  title="ดูโปรไฟล์และสเปกที่บันทึกไว้"
                >
                  <img
                    src={userAccount.avatarUrl}
                    alt={userAccount.displayName}
                    className="w-6 h-6 rounded-lg object-cover border border-orange-400/50"
                  />
                  <div className="text-left hidden md:block">
                    <span className="text-xs font-bold text-white block leading-tight truncate max-w-[110px]">
                      {userAccount.displayName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-amber-400 block leading-none">
                      {userAccount.savedSpecs.length} สเปก
                    </span>
                  </div>
                  <i className="fa-solid fa-chevron-down text-[9px] text-slate-400 group-hover:text-white transition"></i>
                </button>
              )}

              {/* Primary Header CTA */}
              <a
                href="#calculator"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs tracking-wide shadow-glow-orange transition duration-300 transform hover:-translate-y-0.5 border border-amber-300/20 flex items-center gap-1.5"
              >
                <i className="fa-solid fa-crosshairs"></i> วิเคราะห์สเปกลูก
              </a>
            </div>

            {/* Mobile Hamburger Button (Accessible min 44x44px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              aria-label={mobileMenuOpen ? 'ปิดเมนูการนำทาง' : 'เปิดเมนูการนำทาง'}
              aria-expanded={mobileMenuOpen}
            >
              <i className={mobileMenuOpen ? 'fa-solid fa-xmark text-xl' : 'fa-solid fa-bars-staggered text-xl'} aria-hidden="true"></i>
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu - Clean Categorized Sections (User Request #1) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/95 backdrop-blur-2xl border-b border-slate-800 px-4 pt-3 pb-6 space-y-3.5 max-h-[85vh] overflow-y-auto">
            {/* Mobile User Profile / Guest Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={userAccount.avatarUrl}
                  alt={userAccount.displayName}
                  className="w-10 h-10 rounded-xl object-cover border border-orange-500/40"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white leading-tight">
                      {userAccount.displayName}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                      {userAccount.isGuest ? 'Guest' : userAccount.provider.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {userAccount.isGuest ? 'ทดลองใช้งานอิสระ ไม่ต้องสมัครสมาชิก' : `บันทึกไว้ ${userAccount.savedSpecs.length} สเปก • ${userAccount.savedDrills.length} แบบฝึก`}
                  </span>
                </div>
              </div>

              {userAccount.isGuest ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalReason('general_login');
                    setAuthModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition whitespace-nowrap shadow-sm"
                >
                  เข้าสู่ระบบ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setUserProfileModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition whitespace-nowrap"
                >
                  โปรไฟล์ของฉัน
                </button>
              )}
            </div>

            {/* Mobile Group 1: การฝึกซ้อม (Training) */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 px-2 block">
                🏋️‍♂️ การฝึกซ้อม (Training)
              </span>
              <a
                href="#simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-amber-400"
              >
                <i className="fa-solid fa-cubes text-amber-400 mr-2.5 w-4"></i> วิถีโคจร 2D & มุมมองบน (Trajectory & Top-down)
              </a>
              <a
                href="#techniques"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-sky-400"
              >
                <i className="fa-solid fa-person-running text-sky-400 mr-2.5 w-4"></i> เทคนิคการเล่นระดับโปร (Techniques)
              </a>
              <a
                href="#drills"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-emerald-400"
              >
                <i className="fa-solid fa-stopwatch-20 text-emerald-400 mr-2.5 w-4"></i> คลังแบบฝึก & ตัวจับเวลา (Drills & Timer)
              </a>
              <a
                href="#tactics-board"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-bold text-purple-300 hover:bg-purple-950/40"
              >
                <i className="fa-solid fa-chess-knight text-purple-400 mr-2.5 w-4"></i> กระดานแทกติก Mène (Tactical Board)
              </a>
            </div>

            {/* Mobile Group 2: อุปกรณ์ (Equipment) */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-orange-400 px-2 block">
                🧮 อุปกรณ์ (Equipment)
              </span>
              <a
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-orange-400"
              >
                <i className="fa-solid fa-calculator text-orange-400 mr-2.5 w-4"></i> ตัวค้นหาลูกเปตอง (Boule Finder)
              </a>
              <a
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-amber-400"
              >
                <i className="fa-solid fa-tags text-amber-400 mr-2.5 w-4"></i> แมตช์รุ่นลูกในตลาด (Brand Matching)
              </a>
              <a
                href="#specs"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-emerald-400"
              >
                <i className="fa-solid fa-shield-halved text-emerald-400 mr-2.5 w-4"></i> ตารางความแข็ง (Hardness Matrix)
              </a>
            </div>

            {/* Mobile Group 3: การแข่งขัน (Match & Live) */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-400 px-2 block">
                🏆 การแข่งขัน & ถ่ายทอดสด (Match & Live)
              </span>
              <a
                href="#tactics"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-purple-400"
              >
                <i className="fa-solid fa-chess text-purple-400 mr-2.5 w-4"></i> กลยุทธ์และแทกติกแก้เกม (Tactics)
              </a>
              <a
                href="#score-tool"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-amber-400"
              >
                <i className="fa-solid fa-chart-column text-amber-400 mr-2.5 w-4"></i> บันทึกคะแนน & วิเคราะห์ Mène
              </a>
              <a
                href="#tournaments"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block mr-2 animate-ping"></span>
                🔴 ตารางแข่งขัน & ถ่ายทอดสด (Tournaments & Live)
              </a>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT LANDMARK (WCAG 2.1 AA Compliance) */}
      <main id="main-content" className="flex-1 pb-20 lg:pb-0" tabIndex={-1}>
      {/* HERO SECTION */}
      <section className="hero-pattern relative py-12 sm:py-16 lg:py-20 overflow-hidden border-b border-slate-800/80">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-orange-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {(() => {
            // Live Hand-to-Boule Calibration Calculations
            const heroRecDiameter = Math.max(71, Math.min(76, Math.round(71 + (heroHandLength - 160) * 0.11)));
            const heroRecWeight = heroRole === 'shooter' ? 680 : heroRole === 'pointer' ? 705 : 690;
            const diamPct = Math.max(5, Math.min(95, ((heroRecDiameter - 70.5) / (80.0 - 70.5)) * 100));
            const weightPct = Math.max(5, Math.min(95, ((heroRecWeight - 650) / (800 - 650)) * 100));

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:items-center">
                {/* Left Column: Hero Copy & Interactive Hand Scale Visualizer Widget */}
                <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
                  <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-amber-300 shadow-inner-light">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <span>FIPJP Official Standard Compatible</span>
                    </div>

                    {/* Developer Badge in Hero */}
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-xs font-semibold text-amber-200 shadow-inner-light">
                      <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                      <span>
                        ผู้ออกแบบสร้างสรรค์พัฒนา: <strong className="text-white">ฐิติวัสส์ กาญจนาพิมาย</strong>
                      </span>
                    </div>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] font-heading text-white">
                    เรียนรู้ทักษะเปตอง <br />
                    <span className="gradient-text">ระดับมืออาชีพ</span>
                  </h1>

                  <p className="text-slate-200 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                    เจาะลึกเทคนิคการเข้าลูก (Pointing) การยิงเปลี่ยน (Carreau) การคำนวณสเปกอุปกรณ์ให้รับกับสรีระฝ่ามือ และการวางแทกติกแก้ทางสนามทุกรูปแบบ
                  </p>

                  {/* DATA VISUALIZER WIDGET: Interactive Hand Scale & Boule Spec Graph */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-slate-700/90 shadow-2xl space-y-4 text-left max-w-2xl mx-auto lg:mx-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold border border-orange-500/30">
                          <i className="fa-solid fa-hand"></i>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <span>กราฟปรับขนาดมือ & สเปกลูกที่แนะนำ</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                              Live Interactive Scale
                            </span>
                          </h4>
                          <span className="text-[11px] text-slate-300">
                            เลื่อนขนาดฝ่ามือเพื่อดูสเปก FIPJP ที่รับกับสรีระของคุณทันที
                          </span>
                        </div>
                      </div>

                      {/* Role Filter Pills */}
                      <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setHeroRole('shooter')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            heroRole === 'shooter' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <i className="fa-solid fa-crosshairs text-[10px]"></i>
                          <span>มือยิง</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroRole('pointer')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            heroRole === 'pointer' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <i className="fa-solid fa-bullseye text-[10px]"></i>
                          <span>มือเข้า</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroRole('milieu')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            heroRole === 'milieu' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <i className="fa-solid fa-scale-balanced text-[10px]"></i>
                          <span>มือกลาง</span>
                        </button>
                      </div>
                    </div>

                    {/* Hand Slider Control */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-medium flex items-center gap-1.5">
                          <i className="fa-solid fa-ruler text-orange-400"></i>
                          <span>ความยาวฝ่ามือ (ข้อมือถึงปลายนิ้วกลาง):</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-amber-300 font-mono">
                            {heroHandLength} <span className="text-xs text-slate-300 font-normal">มม.</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                            {heroHandLength < 172 ? 'มือเล็ก (Small)' : heroHandLength > 190 ? 'มือใหญ่ (Large)' : 'ขนาดมาตรฐาน (Medium)'}
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="160"
                        max="205"
                        step="1"
                        value={heroHandLength}
                        onChange={(e) => setHeroHandLength(parseInt(e.target.value, 10))}
                        className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-ew-resize accent-orange-500 border border-slate-700"
                      />

                      {/* Quick preset buttons */}
                      <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono pt-0.5">
                        <button
                          type="button"
                          onClick={() => setHeroHandLength(165)}
                          className="hover:text-amber-300 transition text-slate-300 hover:underline cursor-pointer"
                        >
                          165 mm (มือเล็ก)
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroHandLength(180)}
                          className="hover:text-amber-300 transition text-slate-300 hover:underline cursor-pointer font-bold"
                        >
                          180 mm (มาตรฐานไทย)
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroHandLength(195)}
                          className="hover:text-amber-300 transition text-slate-300 hover:underline cursor-pointer"
                        >
                          195 mm (มือใหญ่/ยุโรป)
                        </button>
                      </div>
                    </div>

                    {/* Live Visual Spec Scale Gauges (Ø 70.5 - 80 mm & 650 - 800 g) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Scale 1: Diameter Ø */}
                      <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-notch text-amber-400"></i>
                            <span>เส้นผ่านศูนย์กลาง Ø:</span>
                          </span>
                          <span className="text-sm font-black text-amber-300 font-mono">
                            Ø {heroRecDiameter} mm
                          </span>
                        </div>

                        {/* Visual Range Bar with Marker */}
                        <div className="relative pt-1">
                          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-200"
                              style={{ width: `${diamPct}%` }}
                            ></div>
                          </div>
                          {/* Indicator needle pin */}
                          <div
                            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-200"
                            style={{ left: `${diamPct}%` }}
                          >
                            <span className="w-2 h-2 rounded-full bg-white shadow-glow-orange border border-orange-500"></span>
                          </div>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-300 font-mono pt-1">
                          <span>70.5 mm (ต่ำสุด)</span>
                          <span className="text-amber-300 font-bold">แนะนำ: Ø{heroRecDiameter}</span>
                          <span>80.0 mm (สูงสุด)</span>
                        </div>
                      </div>

                      {/* Scale 2: Weight (g) */}
                      <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                            <i className="fa-solid fa-weight-scale text-emerald-400"></i>
                            <span>น้ำหนักลูก (Weight):</span>
                          </span>
                          <span className="text-sm font-black text-emerald-300 font-mono">
                            {heroRecWeight} g
                          </span>
                        </div>

                        {/* Visual Range Bar with Marker */}
                        <div className="relative pt-1">
                          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-200"
                              style={{ width: `${weightPct}%` }}
                            ></div>
                          </div>
                          {/* Indicator needle pin */}
                          <div
                            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-200"
                            style={{ left: `${weightPct}%` }}
                          >
                            <span className="w-2 h-2 rounded-full bg-white shadow-glow-cyan border border-emerald-500"></span>
                          </div>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-300 font-mono pt-1">
                          <span>650 g (เบาสุด)</span>
                          <span className="text-emerald-300 font-bold">แนะนำ: {heroRecWeight}g</span>
                          <span>800 g (หนักสุด)</span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Recommendation Summary Pill */}
                    <div className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-slate-200 text-[11px]">
                          <strong>คำแนะนำ:</strong> ขนาดมือ <strong>{heroHandLength} mm</strong> เหมาะกับลูก{' '}
                          <strong className="text-amber-300">Ø{heroRecDiameter} mm</strong> /{' '}
                          <strong className="text-emerald-300">{heroRecWeight} g</strong>{' '}
                          ({heroRole === 'shooter' ? 'เน้นน้ำหนักเบา ควงสวิงไว ซับแรง Carreau ดี' : heroRole === 'pointer' ? 'เน้นน้ำหนักหน่วง ช่วยเบรกเกาะหน้าดิน Donnée' : 'น้ำหนักสมดุล คุมได้ทั้งเข้าและยิง'})
                        </span>
                      </div>
                      <a
                        href="#calculator"
                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 whitespace-nowrap ml-2 underline shrink-0"
                      >
                        คำนวณ 3D ละเอียด ➜
                      </a>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                    <a
                      href="#simulator"
                      className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-glow-orange transition duration-300 transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-play text-slate-950"></i> ทดลองจำลองวิถีลูก
                    </a>
                    <a
                      href="#tournaments"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-sm border border-rose-500/40 transition text-center flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                      <span>ตารางแข่งขัน & ถ่ายทอดสด</span>
                    </a>
                    <a
                      href="#calculator"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition text-center flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-sliders text-orange-400"></i> คำนวณเลือกลูกเปตอง
                    </a>
                  </div>
                </div>

                {/* Right Column: FIPJP Standards & Match Knowledge Quick Cards (WCAG AA Contrast Validated) */}
                <div className="lg:col-span-5 space-y-4 sm:space-y-5 w-full max-w-xl mx-auto lg:max-w-none">
                  {/* Petanque Tactical & Technical Mastery Card */}
                  <div className="glass-panel p-5 rounded-3xl shadow-2xl relative border border-slate-700/80 overflow-hidden group">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-lg border border-amber-400/30 shadow-inner">
                          <i className="fa-solid fa-trophy"></i>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                            FIPJP COMPETITION MATRIX
                          </span>
                          <h3 className="text-base font-black text-white font-heading">
                            เกณฑ์มาตรฐานระดับสากล & แท็กติก
                          </h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        FIPJP STANDARD
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed mb-4 font-normal">
                      คู่มือและเครื่องมือคำนวณสเปกอุปกรณ์ตามสรีระ พร้อมระบบจำลองฟิสิกส์วิถีโค้ง (Donnée & Backspin) และโมดูลวิเคราะห์แต้มในแต่ละเที่ยว (Mène Analysis) เพื่อยกระดับความแม่นยำในการแข่งขัน
                    </p>

                    {/* Quick Visual Pills with WCAG AA compliant contrast */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80">
                        <span className="text-[10px] text-slate-300 font-semibold block">เส้นผ่านศูนย์กลาง</span>
                        <strong className="text-amber-300 text-xs font-bold font-mono">70.5 - 80 mm</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80">
                        <span className="text-[10px] text-slate-300 font-semibold block">น้ำหนักลูก</span>
                        <strong className="text-emerald-300 text-xs font-bold font-mono">650 - 800 g</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80">
                        <span className="text-[10px] text-slate-300 font-semibold block">เกณฑ์จบเกม</span>
                        <strong className="text-sky-300 text-xs font-bold font-mono">13 แต้มสากล</strong>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href="#simulator"
                        className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 text-center"
                      >
                        <i className="fa-solid fa-atom text-amber-400"></i>
                        <span>วิถีฟิสิกส์</span>
                      </a>
                      <a
                        href="#score-tool"
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-glow-orange transition flex items-center justify-center gap-1.5 text-center"
                      >
                        <i className="fa-solid fa-chart-line"></i>
                        <span>วิเคราะห์แต้ม Mène</span>
                      </a>
                    </div>
                  </div>

                  {/* FIPJP Rulebook Quick Cards with WCAG AA Legibility */}
                  <div className="glass-panel p-5 rounded-3xl shadow-xl relative border border-slate-700/80 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-shield-halved text-amber-400"></i>
                        <span>หลักสำคัญการแข่งขัน FIPJP</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-300 tracking-wider font-semibold">
                        OFFICIAL CODEX
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                            <i className="fa-solid fa-circle"></i>
                          </div>
                          <span className="font-semibold text-slate-200 text-xs">ลูกเป้า Cochonnet 30 มม.</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 font-semibold">ไม้ / เรซิน FIPJP</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center font-bold text-xs shrink-0">
                            <i className="fa-solid fa-arrows-spin"></i>
                          </div>
                          <span className="font-semibold text-slate-200 text-xs">แรงสะบัด Backspin Spin</span>
                        </div>
                        <span className="text-[10px] font-mono text-orange-300 font-semibold">เบรกหยุดดั่งใจ</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                            <i className="fa-solid fa-clock"></i>
                          </div>
                          <span className="font-semibold text-slate-200 text-xs">กฎ 1 นาทีต่อลูก (Article 17)</span>
                        </div>
                        <span className="text-[10px] font-mono text-sky-300 font-semibold">เคร่งครัด 60s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* SECTION 1: INTERACTIVE PHYSICS TRAJECTORY SIMULATOR */}
      <section id="simulator" className="py-16 bg-slate-900/90 border-b border-slate-800 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 rounded-full inline-block mb-2">
              Interactive Physics Canvas
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              จำลองวิถีลูกเปตอง (Trajectory Visualizer)
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              เลือกรูปแบบการโยน เพื่อดูการทำงานของวิถีโค้ง จุดตก (Donnée) แรงหมุน Backspin และการชนปะทะแบบ Carreau
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-3.5 sm:p-6 lg:p-8 shadow-2xl border border-slate-800">
            {/* Trajectory Controls & Terrain Preset Bar */}
            <div className="space-y-4 mb-6">
              {/* Trajectory Mode Buttons Container (Fluid Mobile Adaptive with Responsive Padding & Max-Width) */}
              <div className="w-full max-w-full lg:max-w-7xl mx-auto p-1.5 sm:p-2 md:p-2.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2.5 w-full">
                  {Object.keys(TRAJECTORY_PRESETS).map((key) => {
                    const item = TRAJECTORY_PRESETS[key];
                    const isActive = activeTrajMode === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTrajMode(key)}
                        aria-pressed={isActive}
                        className={`w-full min-h-[44px] px-2.5 sm:px-3 md:px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center text-center gap-1.5 sm:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-[0.98] ${
                          isActive
                            ? 'bg-orange-600 text-white shadow-glow-orange border border-amber-400/50'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/90 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        <i
                          className={`${
                            key === 'rolling'
                              ? 'fa-solid fa-shoe-prints'
                              : key === 'halflob'
                              ? 'fa-solid fa-chart-line'
                              : key === 'highlob'
                              ? 'fa-solid fa-arrow-up-from-ground-water'
                              : key === 'carreau'
                              ? 'fa-solid fa-burst'
                              : key === 'extreme_backspin'
                              ? 'fa-solid fa-arrows-spin text-purple-300'
                              : 'fa-solid fa-arrow-rotate-left text-amber-300'
                          } shrink-0 text-sm`}
                          aria-hidden="true"
                        ></i>
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simulator Settings Bar: Audio Toggle & Terrain Preset Dropdown Menu */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 px-3 shadow-inner w-full justify-between">
                {/* Audio Sound FX Toggle */}
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-sm ${
                    isAudioEnabled
                      ? 'bg-emerald-600/25 border-emerald-500/80 text-emerald-300 shadow-glow-cyan'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="เปิด / ปิด เสียงเอฟเฟกต์ (Audio Sound Effects: Metal Clash & Surface Roll)"
                >
                  <i
                    className={`fa-solid ${
                      isAudioEnabled ? 'fa-volume-high text-emerald-400' : 'fa-volume-xmark text-slate-500'
                    }`}
                  ></i>
                  <span>Audio: {isAudioEnabled ? 'ON (เปิดเสียง)' : 'OFF (ปิด)'}</span>
                </button>

                {/* Terrain Preset Dropdown */}
                <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: TERRAIN_PRESETS[selectedTerrain].boundaryColor }}
                  ></span>
                  <label htmlFor="terrain-dropdown" className="text-xs font-bold text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                    <i className="fa-solid fa-mountain-sun text-amber-400"></i>
                    <span className="hidden sm:inline">สภาพพื้นผิว:</span>
                  </label>
                  <div className="relative">
                    <select
                      id="terrain-dropdown"
                      value={selectedTerrain}
                      onChange={(e) => setSelectedTerrain(e.target.value as TerrainType)}
                      className="bg-slate-950 border border-slate-700 hover:border-amber-400/70 text-slate-100 text-xs font-bold rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer transition shadow-md"
                    >
                      <option value="dry_clay">Dry Clay (ดินอัดแน่น)</option>
                      <option value="gravel">Gravel (หินกรวดร่วน)</option>
                      <option value="sandy_ground">Sandy Ground (พื้นทราย)</option>
                      <option value="grass">Grass / Lawn (สนามหญ้า)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <i className="fa-solid fa-chevron-down text-[10px]"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aerodynamics: Wind Speed & Wind Direction Control Sliders */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-inner">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
                {/* Wind Speed Control Slider */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="wind-speed-slider" className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <i className="fa-solid fa-wind text-sky-400"></i>
                      <span>ความเร็วลม (Wind Speed)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-extrabold font-mono px-2.5 py-0.5 rounded-lg border transition ${
                          windSpeed === 0
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : windSpeed <= 15
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-glow-cyan'
                            : windSpeed <= 30
                            ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                            : 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                        }`}
                      >
                        {windSpeed} km/h ({(windSpeed * 0.27778).toFixed(1)} m/s)
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {windSpeed === 0 ? '🍃 สงบ' : windSpeed <= 15 ? '💨 เอื่อย' : windSpeed <= 30 ? '🌬️ ปานกลาง' : '🌪️ กรรโชก'}
                      </span>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="wind-speed-slider"
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={windSpeed}
                      onChange={(e) => setWindSpeed(Number(e.target.value))}
                      className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500 border border-slate-800"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 (สงบ)</span>
                    <span>15 km/h</span>
                    <span>30 km/h</span>
                    <span>50 km/h (ลมแรง)</span>
                  </div>
                </div>

                {/* Wind Direction Control Slider */}
                <div className="flex-1 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="wind-direction-slider" className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <i
                        className="fa-solid fa-location-arrow text-amber-400 transition-transform duration-200"
                        style={{ transform: `rotate(${windDirection - 45}deg)` }}
                      ></i>
                      <span>ทิศทางลม (Wind Direction)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold font-mono px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center gap-1.5">
                        <span>{windDirection}°</span>
                        <span>{windInfo.icon}</span>
                      </span>
                      <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                        {windInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="wind-direction-slider"
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={windDirection}
                      onChange={(e) => setWindDirection(Number(e.target.value))}
                      className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-slate-800"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0° (ตามลม ➡️)</span>
                    <span>90° (ขวาง ⬆️)</span>
                    <span>180° (ต้านลม ⬅️)</span>
                    <span>270° (ขวาง ⬇️)</span>
                    <span>360°</span>
                  </div>
                </div>
              </div>

              {/* Quick Scenario Preset Chips */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-question text-sky-400"></i>
                  <span>ผลกระทบ: <span className="text-slate-200 font-medium">{windInfo.description}</span></span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setWindSpeed(0); setWindDirection(0); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      windSpeed === 0 ? 'bg-sky-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    🍃 ไร้ลม (0 km/h)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setWindSpeed(22); setWindDirection(0); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      windSpeed === 22 && windDirection === 0 ? 'bg-sky-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-sky-300'
                    }`}
                  >
                    ➡️ ตามลม 22 km/h
                  </button>
                  <button
                    type="button"
                    onClick={() => { setWindSpeed(22); setWindDirection(180); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      windSpeed === 22 && windDirection === 180 ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-rose-300'
                    }`}
                  >
                    ⬅️ ต้านลม 22 km/h
                  </button>
                  <button
                    type="button"
                    onClick={() => { setWindSpeed(35); setWindDirection(180); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      windSpeed === 35 ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                    }`}
                  >
                    💨 ลมแรง 35 km/h
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation Canvas & Interactive Player Container */}
            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
              {/* Canvas Viewport */}
              <div className="relative w-full h-72 sm:h-84 md:h-96 bg-slate-950 overflow-hidden group">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full block cursor-crosshair select-none"
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                  onClick={handleCanvasClick}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                ></canvas>

                {/* Floating Top Control HUD: View Mode, Custom Physics, and Heatmap (User Request #2) */}
                <div className="absolute top-3 right-3 sm:right-4 flex flex-col items-end gap-1.5 z-20 pointer-events-auto">
                  <div className="flex flex-wrap items-center justify-end gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-700/80 shadow-xl text-xs">
                    {/* View Switcher: 2D Side vs Top-down */}
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatorViewMode('side_2d');
                          simulatorViewModeRef.current = 'side_2d';
                          if (!isAnimating) drawTrajectoryFrame(animProgress);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                          simulatorViewMode === 'side_2d'
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="มุมมอง 2D ด้านข้าง"
                      >
                        <i className="fa-solid fa-chart-area"></i>
                        <span>ด้านข้าง 2D</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatorViewMode('top_down');
                          simulatorViewModeRef.current = 'top_down';
                          if (!isAnimating) drawTrajectoryFrame(animProgress);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                          simulatorViewMode === 'top_down'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="มุมมองจากด้านบน (Top-down Bird's-Eye View) แสดงเบี่ยงเบนซ้าย-ขวาจากแรงลม"
                      >
                        <i className="fa-solid fa-eye text-sky-300"></i>
                        <span>มุมมองบน (Bird's-Eye)</span>
                      </button>
                    </div>

                    {/* Custom Physics Tuning Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCustomPhysics;
                        setIsCustomPhysics(next);
                        isCustomPhysicsRef.current = next;
                        if (!isAnimating) drawTrajectoryFrame(animProgress);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                        isCustomPhysics
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-400/50 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                      title="ปรับแต่งมุมปล่อยลูก (Release Angle) และความเร็วต้น (Initial Velocity) ด้วยตนเอง"
                    >
                      <i className="fa-solid fa-sliders text-purple-400"></i>
                      <span>{isCustomPhysics ? 'ฟิสิกส์: กำหนดเอง' : 'ปรับฟิสิกส์เอง'}</span>
                    </button>

                    {/* Friction Heatmap Button */}
                    <button
                      type="button"
                      onClick={handleToggleHeatmap}
                      className={`px-2 py-1 rounded-lg font-bold text-[10px] transition flex items-center gap-1 ${
                        showFrictionHeatmap
                          ? 'bg-gradient-to-r from-cyan-600/30 to-emerald-600/30 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                      title="เปิด / ปิด แถบแสดงความเข้มข้นแรงเสียดทานพื้นผิวสนาม (Friction Intensity Heatmap)"
                    >
                      <i className="fa-solid fa-fire-flame-curved text-amber-400"></i>
                      <span>{showFrictionHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}</span>
                    </button>

                    {showFrictionHeatmap && (
                      <div className="hidden xs:flex items-center gap-1 pl-1 border-l border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleToggleHeatmapMode('intensity')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                            heatmapMode === 'intensity' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          μ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleHeatmapMode('zones')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                            heatmapMode === 'zones' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          โซน
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Custom Clicked Donnée Test Marker Badge */}
                  {customDonneeMarker && (
                    <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/60 shadow-lg text-[11px] text-white animate-fade-in">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <i className="fa-solid fa-bullseye text-emerald-400"></i>
                        <span>จุดทดสอบ: {customDonneeMarker.distanceMeters} m</span>
                      </span>
                      <span className="text-slate-400 font-mono">μ = {customDonneeMarker.mu}</span>
                      <button
                        type="button"
                        onClick={handleClearCustomDonnee}
                        className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition"
                        title="ลบจุดทดสอบนี้"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  )}
                </div>

                {/* Thermal Friction Spectrum Legend & Interactive Click Guide */}
                {showFrictionHeatmap && (
                  <div className="hidden md:flex absolute bottom-2.5 right-4 z-10 flex-col items-end gap-1 pointer-events-none select-none">
                    <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-[10px] flex items-center gap-3">
                      <span className="font-bold text-slate-300 flex items-center gap-1">
                        <i className="fa-solid fa-layer-group text-amber-400"></i>
                        <span>ระดับแรงเสียดทาน (μ):</span>
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="flex items-center gap-1 text-cyan-300">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          <span>&lt;0.32 ลื่น</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>0.45 สมดุล</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>0.60 เกาะแน่น</span>
                        </span>
                        <span className="flex items-center gap-1 text-rose-300">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>&gt;0.75 แฉลบหิน</span>
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded-md font-medium">
                      💡 แตะหรือลากเมาส์บนพื้นสนามเพื่อทดสอบจุด Donnée และคำนวณระยะกลิ้ง
                    </span>
                  </div>
                )}

                {/* Desktop Telemetry HUD: Pinned top-left (visible only on sm: and up) */}
                <div className="hidden sm:block absolute top-4 left-4 glass-card p-3 rounded-xl text-xs space-y-1.5 border border-slate-800/90 shadow-xl backdrop-blur-md max-w-[280px] pointer-events-none select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-slate-300">
                      ความสูงสูงสุด (Apex):{' '}
                      <span className="font-mono text-amber-400 font-bold">
                        {TRAJECTORY_PRESETS[activeTrajMode].apexDisplay}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="text-slate-300">
                      ระยะจุดตก (Donnée):{' '}
                      <span className="font-mono text-sky-400 font-bold">
                        {TRAJECTORY_PRESETS[activeTrajMode].landingDisplay}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-slate-300">
                      Backspin Rate:{' '}
                      <span className="font-mono text-emerald-400 font-bold">
                        {TRAJECTORY_PRESETS[activeTrajMode].spinDisplay}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: TERRAIN_PRESETS[selectedTerrain].boundaryColor }}
                    ></span>
                    <span className="text-slate-300">
                      แรงเสียดทาน (Friction):{' '}
                      <span className="font-mono text-white font-bold">
                        {TERRAIN_PRESETS[selectedTerrain].frictionLabel}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    <span className="text-slate-300">
                      การกระดอน (Bounce):{' '}
                      <span className="font-mono text-purple-300 font-bold">
                        {TERRAIN_PRESETS[selectedTerrain].bounceLabel}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5 border-t border-slate-800/80">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="text-slate-300">
                      แรงลม (Wind Force):{' '}
                      <span className="font-mono font-bold text-sky-300">
                        {windSpeed === 0 ? '0 km/h (Calm)' : `${windSpeed} km/h (${windInfo.label})`}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isAudioEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                    <span className="text-slate-300">
                      Audio FX:{' '}
                      <span className={`font-mono font-bold ${isAudioEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isAudioEnabled
                          ? activeTrajMode === 'carreau'
                            ? 'Metal Impact Clang 🔔'
                            : activeTrajMode === 'screwback'
                            ? 'Metal Clash & Retro Bite Roll 🔄'
                            : `${selectedTerrain === 'gravel' ? 'Stone Chatter' : selectedTerrain === 'sandy_ground' ? 'Sand Damping' : selectedTerrain === 'grass' ? 'Turf Thump & Grass Swish' : 'Earth Thud'} & Roll 🔊`
                          : 'Muted'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Mobile In-Canvas Mini HUD (Ultra compact, clean, non-intrusive) */}
                <div className="sm:hidden absolute top-2 left-2 flex items-center gap-1.5 z-10">
                  <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] font-mono flex items-center gap-1.5 text-slate-200 shadow-md">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="text-slate-400">Apex:</span>
                      <strong className="text-amber-400">{TRAJECTORY_PRESETS[activeTrajMode].apexDisplay}</strong>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                      <span className="text-slate-400">Donnée:</span>
                      <strong className="text-sky-400">{TRAJECTORY_PRESETS[activeTrajMode].landingDisplay}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileMetrics(!showMobileMetrics)}
                    className="px-2 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[10px] font-bold text-amber-300 hover:text-white flex items-center gap-1 shadow-md active:scale-95 transition"
                  >
                    <i className="fa-solid fa-sliders"></i>
                    <span>{showMobileMetrics ? 'ซ่อน' : 'สเปก'}</span>
                  </button>
                </div>
              </div>

              {/* Mobile Collapsible/Expanded Physics Metrics Bar */}
              {showMobileMetrics && (
                <div className="sm:hidden bg-slate-900/95 border-t border-slate-800/90 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-chart-simple"></i>
                      <span>ค่าพารามิเตอร์ฟิสิกส์วิถีลูก</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMobileMetrics(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">ความสูงสูงสุด (Apex)</span>
                      <span className="font-mono text-amber-400 font-bold">{TRAJECTORY_PRESETS[activeTrajMode].apexDisplay}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">ระยะจุดตก (Donnée)</span>
                      <span className="font-mono text-sky-400 font-bold">{TRAJECTORY_PRESETS[activeTrajMode].landingDisplay}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">Backspin Rate</span>
                      <span className="font-mono text-emerald-400 font-bold">{TRAJECTORY_PRESETS[activeTrajMode].spinDisplay}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">แรงเสียดทาน (Friction)</span>
                      <span className="font-mono text-white font-bold">{TERRAIN_PRESETS[selectedTerrain].frictionLabel}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">การกระดอน (Bounce)</span>
                      <span className="font-mono text-purple-300 font-bold">{TERRAIN_PRESETS[selectedTerrain].bounceLabel}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">แรงลม (Wind Force)</span>
                      <span className="font-mono text-sky-300 font-bold">
                        {windSpeed === 0 ? '0 km/h (Calm)' : `${windSpeed} km/h (${windInfo.label})`}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Audio FX:</span>
                    <span className={`font-mono font-bold ${isAudioEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isAudioEnabled
                        ? activeTrajMode === 'carreau'
                          ? 'Metal Impact Clang 🔔'
                          : activeTrajMode === 'screwback'
                          ? 'Metal Clash 🔄'
                          : `${selectedTerrain === 'gravel' ? 'Stone Chatter' : selectedTerrain === 'sandy_ground' ? 'Sand Damping' : selectedTerrain === 'grass' ? 'Turf Thump' : 'Earth Thud'} 🔊`
                        : 'Muted'}
                    </span>
                  </div>
                </div>
              )}

              {/* Custom Physics Tuning Drawer (User Request #2) */}
              {isCustomPhysics && (
                <div className="bg-slate-900/98 border-t border-purple-500/30 p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <i className="fa-solid fa-atom text-purple-400"></i>
                        <span>กำหนดค่าตัวแปรฟิสิกส์เชิงลึก (Custom Kinematic Tuning)</span>
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                      Real-time Dynamic Calculation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* 1. Release Angle */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">มุมการปล่อยลูก (Release Angle):</span>
                        <strong className="text-amber-400 font-mono text-sm">{customReleaseAngle}°</strong>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="75"
                        step="1"
                        value={customReleaseAngle}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomReleaseAngle(val);
                          customReleaseAngleRef.current = val;
                          if (!isAnimating) drawTrajectoryFrame(animProgress);
                        }}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>15° (เรียบเลียดพื้น)</span>
                        <span>45° (ระยะไกล)</span>
                        <span>75° (โด่งชัน)</span>
                      </div>
                    </div>

                    {/* 2. Initial Velocity */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">ความเร็วต้น (Initial Velocity):</span>
                        <strong className="text-sky-400 font-mono text-sm">{customInitialVelocity} m/s</strong>
                      </div>
                      <input
                        type="range"
                        min="4.0"
                        max="15.0"
                        step="0.1"
                        value={customInitialVelocity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomInitialVelocity(val);
                          customInitialVelocityRef.current = val;
                          if (!isAnimating) drawTrajectoryFrame(animProgress);
                        }}
                        className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>4.0 m/s (เบา)</span>
                        <span>8.5 m/s (มาตรฐาน)</span>
                        <span>15.0 m/s (แรงจัด)</span>
                      </div>
                    </div>

                    {/* 3. Backspin Rate */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">อัตราหมุนถอยหลัง (Backspin):</span>
                        <strong className="text-emerald-400 font-mono text-sm">{customBackspinRpm} RPM</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="600"
                        step="10"
                        value={customBackspinRpm}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomBackspinRpm(val);
                          customBackspinRpmRef.current = val;
                          if (!isAnimating) drawTrajectoryFrame(animProgress);
                        }}
                        className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0 (หมุนตามน้ำ)</span>
                        <span>250 (กึ่งถอย)</span>
                        <span>600 (สกรูแบคจัด)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>
                      💡 ผลคำนวณสด: จุดตก Donnée ~{(((customInitialVelocity ** 2) * Math.sin((2 * customReleaseAngle * Math.PI) / 180)) / 9.8).toFixed(1)} เมตร • ความสูง Apex ~{(((customInitialVelocity * Math.sin((customReleaseAngle * Math.PI) / 180)) ** 2) / (2 * 9.8)).toFixed(2)} เมตร
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomReleaseAngle(45);
                        customReleaseAngleRef.current = 45;
                        setCustomInitialVelocity(8.5);
                        customInitialVelocityRef.current = 8.5;
                        setCustomBackspinRpm(250);
                        customBackspinRpmRef.current = 250;
                        if (!isAnimating) drawTrajectoryFrame(animProgress);
                      }}
                      className="text-purple-300 hover:underline"
                    >
                      คืนค่ามาตรฐาน
                    </button>
                  </div>
                </div>
              )}

              {/* STEP-THROUGH CONTROLS & TIMELINE SCRUBBER CONSOLE */}
              <div className="bg-slate-900/98 border-t border-slate-800 p-3 sm:p-4 space-y-3 z-10">
                {/* Scrubber Header & Milestone Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <i className="fa-solid fa-sliders text-orange-400"></i>
                      <span>ระบบตรวจวัดฟิสิกส์ทีละเฟรม (Step-Through Trajectory Inspector)</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Frame {currentPhysicsData.progressPct}% ({currentPhysicsData.progressPct}/100)
                    </span>
                  </div>

                  {/* Current Phase Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                      currentPhysicsData.phase === 'launch'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : currentPhysicsData.phase === 'apex'
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                        : currentPhysicsData.phase === 'flight'
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                        : currentPhysicsData.phase === 'impact'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : currentPhysicsData.phase === 'bounce_roll'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}>
                      <i className={`fa-solid ${currentPhysicsData.phaseIcon}`}></i>
                      <span>{currentPhysicsData.phaseTh}</span>
                    </span>
                    {isPaused && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        ⏸️ PAUSED (ลากแถบเพื่อดูฟิสิกส์)
                      </span>
                    )}
                  </div>
                </div>

                {/* Range Slider Scrubber with Visual Milestone Markers */}
                <div className="relative pt-1 pb-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={animProgress}
                    onChange={(e) => handleStepSliderChange(parseFloat(e.target.value))}
                    className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-ew-resize accent-orange-500 border border-slate-700/80 shadow-inner"
                    title="ลากสไลเดอร์เพื่อเลื่อนตำแหน่งลูกเปตองทีละเฟรม"
                  />

                  {/* Milestone Quick-Jump Buttons on Slider Track */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1 px-1">
                    <button
                      type="button"
                      onClick={() => handleStepSliderChange(0)}
                      className={`hover:text-amber-400 transition flex items-center gap-1 cursor-pointer ${animProgress === 0 ? 'text-amber-300 font-bold' : ''}`}
                      title="จุดเริ่มต้นปล่อยลูก (0%)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>0% ปล่อย</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStepSliderChange(0.35)}
                      className={`hover:text-amber-400 transition flex items-center gap-1 cursor-pointer ${animProgress >= 0.32 && animProgress <= 0.38 ? 'text-amber-300 font-bold' : ''}`}
                      title="จุดสูงสุดของวิถีโค้ง Apex (~35%)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span>35% Apex ({TRAJECTORY_PRESETS[activeTrajMode].apexDisplay})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStepSliderChange(0.70)}
                      className={`hover:text-amber-400 transition flex items-center gap-1 cursor-pointer ${animProgress >= 0.69 && animProgress <= 0.72 ? 'text-sky-300 font-bold' : ''}`}
                      title="จุดตกกระทบพื้นสนาม Donnée (~70%)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                      <span>70% Donnée ({TRAJECTORY_PRESETS[activeTrajMode].landingDisplay})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStepSliderChange(1.0)}
                      className={`hover:text-amber-400 transition flex items-center gap-1 cursor-pointer ${animProgress >= 0.99 ? 'text-purple-300 font-bold' : ''}`}
                      title="จุดหยุดนิ่งสัมบูรณ์ (100%)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      <span>100% สิ้นสุด</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Point-in-Time Physics Inspection Cockpit (Telemetry Data at current frame) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs">
                  {/* 1. Distance X */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <i className="fa-solid fa-ruler-horizontal text-sky-400"></i>
                      <span>ระยะแนวนอน (X)</span>
                    </span>
                    <div className="mt-1">
                      <strong className="text-sm font-black text-white font-mono">{currentPhysicsData.currentX_m}</strong>
                      <span className="text-[10px] text-slate-400 ml-1">ม. จากวงโยน</span>
                    </div>
                  </div>

                  {/* 2. Altitude Y */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <i className="fa-solid fa-arrows-up-down text-amber-400"></i>
                      <span>ความสูง (Y)</span>
                    </span>
                    <div className="mt-1">
                      <strong className="text-sm font-black text-amber-300 font-mono">{currentPhysicsData.currentY_m}</strong>
                      <span className="text-[10px] text-slate-400 ml-1">ม. เหนือพื้น</span>
                    </div>
                  </div>

                  {/* 3. Instantaneous Speed */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <i className="fa-solid fa-gauge-high text-emerald-400"></i>
                      <span>ความเร็วชั่วขณะ (v)</span>
                    </span>
                    <div className="mt-1">
                      <strong className="text-sm font-black text-emerald-300 font-mono">{currentPhysicsData.currentSpeed_ms}</strong>
                      <span className="text-[10px] text-slate-400 ml-1">m/s ({currentPhysicsData.currentSpeed_kmh} km/h)</span>
                    </div>
                  </div>

                  {/* 4. Backspin Rate */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <i className="fa-solid fa-arrow-rotate-left text-purple-400"></i>
                      <span>Backspin RPM</span>
                    </span>
                    <div className="mt-1">
                      <strong className="text-sm font-black text-purple-300 font-mono">{currentPhysicsData.currentSpin_rpm}</strong>
                      <span className="text-[10px] text-slate-400 ml-1">RPM</span>
                    </div>
                  </div>

                  {/* 5. Wind Drift Effect */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <i className="fa-solid fa-wind text-sky-400"></i>
                      <span>การเบี่ยงจากลม</span>
                    </span>
                    <div className="mt-1">
                      <strong className="text-sm font-black text-sky-300 font-mono">
                        {currentPhysicsData.windDriftDistM > 0 ? `+${currentPhysicsData.windDriftDistM}` : currentPhysicsData.windDriftDistM}
                      </strong>
                      <span className="text-[10px] text-slate-400 ml-1">ม. ({windInfo.label})</span>
                    </div>
                  </div>

                  {/* 6. Surface Friction Contact */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <i className="fa-solid fa-layer-group text-orange-400"></i>
                      <span>สัมผัสพื้นผิว (μ)</span>
                    </span>
                    <div className="mt-1">
                      <strong className="text-sm font-black text-orange-300 font-mono">
                        {animProgress >= 0.70 ? `μ = ${currentPhysicsData.frictionMu}` : 'ลอยอากาศ'}
                      </strong>
                      <span className="text-[10px] text-slate-400 ml-1 truncate block">
                        {animProgress >= 0.70 ? TERRAIN_PRESETS[selectedTerrain].label : 'Drag = 0.47'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Kinematic Explanatory Insight Banner */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300 gap-3">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-brain text-amber-400 text-sm shrink-0"></i>
                    <span className="text-[11px] leading-relaxed">
                      {animProgress < 0.32 ? (
                        <span><strong>จังหวะไต่ระดับความสูง:</strong> ลูกเปตองพุ่งออกจากมือด้วยความเร็วต้น {currentPhysicsData.currentSpeed_ms} m/s ทำมุมปล่อย {isCustomPhysics ? `${customReleaseAngle}°` : TRAJECTORY_PRESETS[activeTrajMode].recommendedAngle} พร้อมแรงหมุน Backspin ({currentPhysicsData.currentSpin_rpm} RPM) สร้างแรงยก Magnus ช่วยพยุงลูกลอยตัว</span>
                      ) : animProgress <= 0.38 ? (
                        <span><strong>จุดสูงสุดของวิถีโค้ง (Apex):</strong> ความเร็วในแนวดิ่ง Vy = 0 สัมผัสจุดสูงสุดที่ระดับ {currentPhysicsData.peakApexMeters} ม. เหนือพื้นสนาม ก่อนที่แรงดึงดูดของโลก (g = 9.8 m/s²) จะเริ่มดึงลูกตกลงมา</span>
                      ) : animProgress < 0.69 ? (
                        <span><strong>จังหวะดิ่งสู่เป้าหมาย:</strong> ลูกทิ้งตัวลงเข้าหาจุดตก Donnée ({currentPhysicsData.donneeDistMeters} ม.) แรงลมทำให้เกิดระยะเบี่ยงเบนสะสม {currentPhysicsData.windDriftDistM > 0 ? `+${currentPhysicsData.windDriftDistM}` : currentPhysicsData.windDriftDistM} ม.</span>
                      ) : animProgress <= 0.72 ? (
                        <span><strong>จุดตกกระทบพื้นสนาม (Donnée Impact):</strong> จุดวัดความแม่นยำสูงสุด! พลังงานจลน์ถูกดูดซับโดยพื้น {TERRAIN_PRESETS[selectedTerrain].label} (แรงเสียดทาน $\mu = {currentPhysicsData.frictionMu}$) และ Backspin เริ่มกัดยึดพื้นผิว</span>
                      ) : animProgress < 0.98 ? (
                        <span><strong>การกลิ้งและกระดอน (Bounce & Roll):</strong> {activeTrajMode === 'screwback' ? 'แรงหมุนถอยหลังจัด (Screw Back) ทำงานร่วมกับความฝืดของพื้นดิน กัดยึดดึงลูกถอยหลังกลับ' : `ลูกกระดอนและกลิ้งเข้าหาแก่นด้วยแรงเสียดทานจลน์ ระยะกลิ้งต่อเนื่อง ~${currentPhysicsData.rollDistMeters} เมตร`}</span>
                      ) : (
                        <span><strong>สิ้นสุดการเคลื่อนที่ (Rest Position):</strong> ลูกหยุดนิ่งสมบูรณ์ ณ ตำแหน่งสุดท้าย ห่างจากวงโยน {currentPhysicsData.currentX_m} เมตร {Math.abs(currentPhysicsData.currentX_m - 8.0) < 0.35 ? '✨ เกาะชิดแก่นอย่างสมบูรณ์แบบ!' : ''}</span>
                      )}
                    </span>
                  </div>

                  {/* Micro Step Buttons */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStepFrame(-0.02)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition"
                      title="ถอยหลัง 2% (-2 เฟรม)"
                    >
                      -2%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepFrame(0.02)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition"
                      title="เดินหน้า 2% (+2 เฟรม)"
                    >
                      +2%
                    </button>
                  </div>
                </div>
              </div>

              {/* Integrated Control Toolbar (Placed cleanly below the canvas - Clear CTA Hierarchy) */}
              <div className="bg-slate-900/95 border-t border-slate-800 p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 z-10">
                <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
                  {/* Play / Pause Toggle Button */}
                  <button
                    type="button"
                    onClick={isAnimating ? handlePauseSimulation : handlePlayOrResumeSimulation}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                      isAnimating
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-glow-amber'
                        : 'bg-emerald-600/30 border-emerald-500/80 text-emerald-300 hover:bg-emerald-600/40'
                    }`}
                    title={isAnimating ? 'พักชั่วคราว (Pause Animation)' : 'เล่นต่อ / เริ่มต้น (Play / Resume)'}
                  >
                    <i className={`fa-solid ${isAnimating ? 'fa-pause' : 'fa-play'}`}></i>
                    <span>{isAnimating ? 'พักชั่วคราว (Pause)' : animProgress >= 1 ? 'เล่นใหม่ (Play)' : 'เล่นต่อ (Resume)'}</span>
                  </button>

                  {/* Frame-by-frame Step Backward */}
                  <button
                    type="button"
                    onClick={() => handleStepFrame(-0.01)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1"
                    title="เลื่อนถอยหลังทีละ 1 เฟรม (-1%)"
                  >
                    <i className="fa-solid fa-backward-step"></i>
                    <span className="hidden xs:inline">ถอย 1 เฟรม</span>
                  </button>

                  {/* Frame-by-frame Step Forward */}
                  <button
                    type="button"
                    onClick={() => handleStepFrame(0.01)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1"
                    title="เลื่อนไปข้างหน้าทีละ 1 เฟรม (+1%)"
                  >
                    <span className="hidden xs:inline">เดินหน้า 1 เฟรม</span>
                    <i className="fa-solid fa-forward-step"></i>
                  </button>

                  {/* Replay Button */}
                  <button
                    type="button"
                    onClick={replaySimulation}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1"
                    title="รีเพลย์จากจุดเริ่มต้น (0%)"
                  >
                    <i className="fa-solid fa-rotate-left text-amber-400"></i>
                    <span>รีเพลย์</span>
                  </button>

                  {/* Audio quick toggle */}
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
                      isAudioEnabled
                        ? 'bg-emerald-600/30 border-emerald-500/80 text-emerald-300'
                        : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title="เปิด/ปิด เสียงเอฟเฟกต์"
                  >
                    <i className={`fa-solid ${isAudioEnabled ? 'fa-volume-high text-emerald-400' : 'fa-volume-xmark text-slate-400'}`}></i>
                    <span>{isAudioEnabled ? 'Sound ON' : 'Sound OFF'}</span>
                  </button>

                  {/* Playback speed buttons */}
                  <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-1 text-[11px] text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-400 hidden xs:inline">สปีด:</span>
                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(0.5)}
                      className={`px-1.5 py-0.5 rounded text-[11px] transition ${playbackSpeed === 0.5 ? 'bg-orange-600 text-white font-bold' : 'hover:text-white text-slate-300'}`}
                    >
                      0.5x
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(1)}
                      className={`px-1.5 py-0.5 rounded text-[11px] transition ${playbackSpeed === 1 ? 'bg-orange-600 text-white font-bold' : 'hover:text-white text-slate-300'}`}
                    >
                      1.0x
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(1.5)}
                      className={`px-1.5 py-0.5 rounded text-[11px] transition ${playbackSpeed === 1.5 ? 'bg-orange-600 text-white font-bold' : 'hover:text-white text-slate-300'}`}
                    >
                      1.5x
                    </button>
                  </div>

                  {/* Friction Heatmap Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleHeatmap}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
                      showFrictionHeatmap
                        ? 'bg-amber-500/25 border-amber-500/80 text-amber-300'
                        : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title="เปิด/ปิด แผนที่แรงเสียดทานพื้นผิวสนาม (Friction Heatmap & Donnée Zones)"
                  >
                    <i className="fa-solid fa-fire-flame-curved text-amber-400"></i>
                    <span>{showFrictionHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}</span>
                  </button>

                  {/* Backspin Physics Modal Button */}
                  <button
                    type="button"
                    onClick={() => setShowBackspinPhysicsModal(true)}
                    className="px-3 py-1.5 bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition border border-purple-500/50"
                    title="ดูสูตรและการคำนวณฟิสิกส์สกรูแบค (Backspin Physics Analysis)"
                  >
                    <i className="fa-solid fa-atom text-purple-400"></i>
                    <span>ฟิสิกส์สกรูแบค</span>
                  </button>
                </div>

                {/* Primary CTA Button: Distinct Prominent Gradient */}
                <button
                  type="button"
                  onClick={replaySimulation}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-glow-orange flex items-center justify-center gap-2 transition border border-amber-300/40 shrink-0"
                >
                  <i className={`fa-solid ${isAnimating ? 'fa-spinner animate-spin' : 'fa-play'} text-slate-950`}></i>
                  <span>จำลองการโยน (Throw)</span>
                </button>
              </div>
            </div>

            {/* Dynamic Technique, Terrain & Aerodynamic Wind Notes */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-3">
                <i className="fa-solid fa-circle-info text-amber-400 text-lg mt-0.5 shrink-0"></i>
                <div>
                  <strong className="text-white block font-bold mb-0.5">
                    {TRAJECTORY_PRESETS[activeTrajMode].title}
                  </strong>
                  <p>{TRAJECTORY_PRESETS[activeTrajMode].description}</p>
                  <div className="mt-2 text-amber-300/90 text-xs font-medium flex items-center gap-1.5">
                    <i className="fa-solid fa-lightbulb text-amber-400"></i>
                    <span>ข้อแนะนำ: {TRAJECTORY_PRESETS[activeTrajMode].techniqueTip}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-3">
                <i className="fa-solid fa-mountain text-orange-400 text-lg mt-0.5 shrink-0"></i>
                <div>
                  <strong className="text-white block font-bold mb-0.5 flex items-center gap-2">
                    <span>วิเคราะห์สภาพสนาม:</span>
                    <span className="text-amber-400 font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {TERRAIN_PRESETS[selectedTerrain].label}
                    </span>
                  </strong>
                  <p>{TERRAIN_PRESETS[selectedTerrain].description}</p>
                  <div className="mt-2 text-orange-300/90 text-xs font-medium flex items-center gap-1.5">
                    <i className="fa-solid fa-compass text-orange-400"></i>
                    <span>ผลทางแทกติก: {TERRAIN_PRESETS[selectedTerrain].tacticalNote}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-3">
                <i className="fa-solid fa-wind text-sky-400 text-lg mt-0.5 shrink-0"></i>
                <div>
                  <strong className="text-white block font-bold mb-0.5 flex items-center gap-2">
                    <span>อากาศพลศาสตร์ (Aerodynamics):</span>
                    <span className="text-sky-400 font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {windSpeed} km/h • {windDirection}°
                    </span>
                  </strong>
                  <p>{windInfo.description}</p>
                  <div className="mt-2 text-sky-300/90 text-xs font-medium flex items-center gap-1.5">
                    <i className="fa-solid fa-gauge-high text-sky-400"></i>
                    <span>
                      {windInfo.horizVelocity > 0
                        ? `แรงหนุนตามแนวราบ +${(windInfo.horizVelocity).toFixed(1)} km/h (เล็งจุดตกสั้นลง)`
                        : windInfo.horizVelocity < 0
                        ? `แรงต้านปะทะหน้า ${(windInfo.horizVelocity).toFixed(1)} km/h (ต้องชดเชยแรงส่ง)`
                        : 'ลมพัดขวาง ไม่มีแรงฉุดแนวราบตรง'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PETANQUE FINDER CALCULATOR */}
      <section id="calculator" className="py-16 bg-slate-950 scroll-mt-12 relative border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-orange-400 uppercase bg-orange-500/10 border border-orange-500/20 px-3.5 py-1 rounded-full inline-block mb-2">
              Smart Fitting System
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Petanque Finder Calculator Pro
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              คำนวณและค้นหาสเปกลูกเปตองที่เหมาะกับฝ่ามือ ตำแหน่งการเล่น และระดับความแข็งตามหลักสรีรศาสตร์
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Panel */}
            <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <i className="fa-solid fa-sliders text-orange-500"></i> ปรับแต่งข้อมูลสรีระของคุณ
              </h3>

              {/* Hand Size Interactive Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    ความยาวฝ่ามือ (Hand Length)
                  </label>
                  <span className="text-base font-extrabold font-mono text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-lg">
                    {handLength} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="220"
                  value={handLength}
                  onChange={(e) => setHandLength(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                  <span>150mm (มือเล็ก)</span>
                  <span>185mm (มาตรฐาน)</span>
                  <span>220mm (มือใหญ่)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  *วัดจากรอยพับข้อมือด้านล่าง ถึงปลายนิ้วกลางขณะกางมือตรง
                </p>
              </div>

              {/* Palm Width Option */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  ความกว้างอุ้งมือ (Palm Span)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['narrow', 'standard', 'wide'] as const).map((width) => (
                    <button
                      key={width}
                      type="button"
                      onClick={() => setPalmWidth(width)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                        palmWidth === width
                          ? 'bg-orange-600/20 border-orange-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {width === 'narrow' ? 'แคบ / นิ้วสั้น' : width === 'standard' ? 'สมส่วน' : 'กว้าง / อุ้งมือหนา'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position Selection Tabs */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  ตำแหน่งการเล่นหลัก (Position)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlayerRole('pointer')}
                    className={`p-3 rounded-2xl border text-center transition ${
                      playerRole === 'pointer'
                        ? 'bg-orange-600/25 border-orange-500 text-white shadow-glow-orange'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <i className="fa-solid fa-bullseye text-base block mb-1 text-orange-400"></i>
                    <span className="text-xs font-bold block">มือเข้า (Point)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlayerRole('milieu')}
                    className={`p-3 rounded-2xl border text-center transition ${
                      playerRole === 'milieu'
                        ? 'bg-orange-600/25 border-orange-500 text-white shadow-glow-orange'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <i className="fa-solid fa-shuffle text-base block mb-1 text-amber-400"></i>
                    <span className="text-xs font-bold block">มือกลาง (Milieu)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlayerRole('shooter')}
                    className={`p-3 rounded-2xl border text-center transition ${
                      playerRole === 'shooter'
                        ? 'bg-orange-600/25 border-orange-500 text-white shadow-glow-orange'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <i className="fa-solid fa-crosshairs text-base block mb-1 text-sky-400"></i>
                    <span className="text-xs font-bold block">มือตี (Shooter)</span>
                  </button>
                </div>
              </div>

              {/* Striation Preference */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  รูปแบบลาย (Striation / Grooves)
                </label>
                <select
                  value={striation}
                  onChange={(e) => setStriation(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="smooth">ลูกเรียบไร้ลาย (0 Striae) - หลุดมือง่าย ชื่นชอบโดยมือตี</option>
                  <option value="single">ลายเดี่ยวมาตรฐาน (1-2 Striae) - ช่วยควบคุมทิศทาง</option>
                  <option value="heavy">ลายถี่หนาแน่น (Multiple Striae) - เกาะจับแน่น หยุดบนพื้นหินได้ดี</option>
                </select>
              </div>

              {/* INTERACTIVE BOULE SIZE (DIAMETER) SELECTOR */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-arrows-left-right text-amber-400"></i>
                    <span>ขนาดเส้นผ่านศูนย์กลาง (Ø Diameter)</span>
                  </label>
                  <span className="text-xs font-extrabold font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                    Ø {specs.diameter} mm {customDiameter !== null ? '(กำหนดเอง)' : '(แนะนำ)'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[71, 72, 73, 74, 75, 76, 77, 78, 79, 80].map((dia) => {
                    const isSelected = specs.diameter === dia;
                    const isAuto = specs.baseDiameter === dia;
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => setCustomDiameter(dia)}
                        className={`relative py-2 px-1 rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-glow-orange border-2 border-amber-300 font-extrabold scale-[1.03]'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{dia} mm</span>
                        {isAuto && (
                          <span
                            className={`text-[9px] block leading-none mt-0.5 font-medium ${
                              isSelected ? 'text-slate-900 font-bold' : 'text-amber-400'
                            }`}
                          >
                            แนะนำ
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
                  <span>71-73mm (มือเข้า/ผู้หญิง/เยาวชน)</span>
                  <span>74-80mm (มือตี/มือใหญ่)</span>
                </div>
              </div>

              {/* INTERACTIVE BOULE WEIGHT SELECTOR */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-weight-hanging text-orange-400"></i>
                    <span>น้ำหนักลูกเปตอง (Boule Weight)</span>
                  </label>
                  <span className="text-xs font-extrabold font-mono text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-lg">
                    {specs.weight} g {customWeight !== null ? '(กำหนดเอง)' : '(แนะนำ)'}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {[650, 660, 670, 680, 690, 700, 710, 720, 730, 740, 750, 800].map((wt) => {
                    const isSelected = specs.weight === wt;
                    const isAuto = specs.baseWeight === wt;
                    return (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => setCustomWeight(wt)}
                        className={`relative py-2 px-1 rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-orange-600 text-white shadow-glow-orange border-2 border-orange-400 font-extrabold scale-[1.03]'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{wt}g</span>
                        {isAuto && (
                          <span
                            className={`text-[9px] block leading-none mt-0.5 font-medium ${
                              isSelected ? 'text-amber-200 font-bold' : 'text-orange-400'
                            }`}
                          >
                            แนะนำ
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
                  <span>650-680g (เบา/ยิงตีติดง่าย)</span>
                  <span>690-730g (มาตรฐานแข่ง)</span>
                  <span>740-800g (หนักยึดดิน)</span>
                </div>
              </div>

              {/* Reset to Auto Recommendation Button */}
              {specs.isCustomized && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDiameter(null);
                      setCustomWeight(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 hover:bg-slate-800 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-rotate-left text-amber-400"></i>
                    <span>รีเซ็ตเป็นค่าสรีระแนะนำอัตโนมัติ (Reset to Auto: Ø {specs.baseDiameter} mm / {specs.baseWeight} g)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Result Card Display */}
            <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                    <i className="fa-solid fa-square-check"></i> ผลการแนะนำสเปกลูกเปตอง
                  </h3>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {specs.isCustomized ? '⚙️ สเปกกำหนดเองร่วมกับสรีระ' : '✨ สเปกวิเคราะห์อัตโนมัติตามสรีระ'}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono px-3 py-1 rounded-full border ${
                    specs.fitPercent >= 90
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : specs.fitPercent >= 75
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  FIT ACCURACY {specs.fitPercent}%
                </span>
              </div>

              {/* Recommended Specs Grid Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      เส้นผ่านศูนย์กลาง (Ø)
                    </span>
                    {customDiameter !== null && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <span className="text-3xl font-black font-heading text-amber-400">{specs.diameter} มม.</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    มาตรฐานมือ: <span className="text-slate-300">{specs.baseDiameter}</span> มม.
                  </span>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      น้ำหนัก (Weight)
                    </span>
                    {customWeight !== null && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono">
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <span className="text-3xl font-black font-heading text-orange-400">{specs.weight} กรัม</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    มาตรฐานมือ: <span className="text-slate-300">{specs.baseWeight}</span> ก.
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 glass-card p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    ระดับความแข็ง
                  </span>
                  <span className="text-lg font-bold font-heading text-sky-400 block">{specs.hardness}</span>
                  <span className="text-xs font-mono text-slate-400">{specs.hardnessVal}</span>
                </div>
              </div>

              {/* Strategic Advice & Dynamic Fit Note */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">เนื้อโลหะและลายที่แนะนำ:</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{specs.material}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold">
                    <i className="fa-solid fa-lightbulb"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">คำแนะนำการควบคุม:</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{specs.advice}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-800/80 pt-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 text-xs font-bold">
                    <i className="fa-solid fa-hand"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-300">การประเมินความกระชับฝ่ามือ (Ergonomic Fit Assessment):</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{specs.fitNote}</p>
                  </div>
                </div>
              </div>

              {/* Visual Fit Gauge Indicator */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>สัดส่วนการจับกระชับฝ่ามือ (Grip Ergonomics Index)</span>
                  <span className="font-mono text-orange-400">{specs.fitPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${specs.fitPercent}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  *ลูกเปตองที่ขนาดพอดีกับรอยพับข้อนิ้วแรกจะช่วยลดความล้าของกล้ามเนื้อแขนในการแข่งขันระยะยาว
                </p>
              </div>

              {/* SAVE SPECS & GUEST UX ACTION PANEL */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/30 border border-orange-500/30 space-y-3.5 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                      <i className="fa-solid fa-floppy-disk"></i>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        บันทึกผลการคำนวณสเปกลูก (Save My Specs)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {userAccount.isGuest
                          ? '👤 ใช้งานในฐานะ Guest ได้ทันที • กดบันทึกเพื่อเก็บสเปกลงโปรไฟล์'
                          : `✓ บัญชีของคุณ: ${userAccount.displayName}`}
                      </p>
                    </div>
                  </div>

                  {userAccount.savedSpecs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUserProfileModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition flex items-center gap-1.5 self-end sm:self-auto"
                    >
                      <i className="fa-solid fa-list-check"></i>
                      <span>ดูที่บันทึกไว้ ({userAccount.savedSpecs.length})</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveSpecClick}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs tracking-wide shadow-glow-orange transition duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 border border-amber-400/30"
                  >
                    <i className="fa-solid fa-bookmark text-sm"></i>
                    <span>💾 บันทึกสเปกของฉัน (Save My Specs: Ø {specs.diameter}mm / {specs.weight}g)</span>
                  </button>

                  {userAccount.isGuest ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalReason('general_login');
                        setAuthModalOpen(true);
                      }}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition border border-slate-700 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <i className="fa-solid fa-right-to-bracket text-amber-400"></i>
                      <span>Login (Google/Facebook/Line)</span>
                    </button>
                  ) : null}
                </div>

                {/* Recently Saved Specs Quick-Selector */}
                {userAccount.savedSpecs.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      สเปกที่บันทึกไว้ล่าสุด:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {userAccount.savedSpecs.slice(0, 3).map((saved) => (
                        <button
                          key={saved.id}
                          type="button"
                          onClick={() => handleLoadSpec(saved)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-[11px] font-mono text-slate-300 hover:text-amber-300 transition flex items-center gap-1.5"
                          title="คลิกเพื่อโหลดสเปกนี้ลงเครื่องคำนวณ"
                        >
                          <i className="fa-solid fa-rotate-right text-[9px] text-amber-400"></i>
                          <span>Ø{saved.diameter}mm / {saved.weight}g ({saved.playerRole})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Real-World Brand & Model Matching (User Request #3) */}
            <div className="lg:col-span-12">
              <BouleBrandMatcher
                playerRole={playerRole}
                diameter={specs.diameter}
                weight={specs.weight}
                striation={striation}
                onSelectModelForProfile={(model) => {
                  const savedModelSpec: SavedBouleSpec = {
                    id: 'spec-' + Date.now().toString(36),
                    title: `${model.brand} ${model.name}`,
                    savedAt: new Date().toISOString(),
                    diameter: specs.diameter,
                    weight: specs.weight,
                    hardness: model.hardness,
                    hardnessVal: model.hardnessValue,
                    material: `${model.brand} (${model.material === 'stainless' ? 'สแตนเลส' : 'คาร์บอน'})`,
                    playerRole,
                    striation,
                    handLength,
                    palmWidth,
                    isCustomized: specs.isCustomized,
                    fitPercent: specs.fitPercent,
                    fitNote: `รุ่นแนะนำ: ${model.name} (${model.estimatedPriceTHB}) - ${model.badge}`,
                    advice: model.description,
                  };
                  handleSaveSpecClick(savedModelSpec);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TECHNIQUE MASTERCLASS LIBRARY */}
      <section id="techniques" className="py-16 bg-slate-900/60 border-b border-slate-800 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-sky-400 uppercase bg-sky-400/10 border border-sky-400/20 px-3.5 py-1 rounded-full inline-block mb-2">
                Comprehensive Technique Library
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">บทเรียนทักษะการเล่นเปตอง</h2>
              <p className="text-slate-400 text-sm mt-1">คลังวิชาทักษะตั้งแต่ระดับพื้นฐานจนถึงการทำคะแนนชั้นสูง</p>
            </div>

            {/* Filter Level Tabs */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'beginner', label: 'มือใหม่' },
                  { id: 'intermediate', label: 'ระดับกลาง' },
                  { id: 'advanced', label: 'ชั้นสูง' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                    activeFilter === tab.id
                      ? 'bg-orange-600 text-white border-orange-500 shadow-glow-orange'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเทคนิค เช่น จับลูก, Carreau, โยนโด่ง, Backspin..."
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500 shadow-inner"
              />
              <i className="fa-solid fa-magnifying-glass text-slate-500 absolute left-3.5 top-3.5 text-sm"></i>
            </div>
          </div>

          {/* Technique Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTechniques.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 hover:border-slate-700 transition duration-300 flex flex-col justify-between group hover:shadow-2xl hover:shadow-sky-950/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={`px-3 py-1 text-[10px] font-bold rounded-full border ${
                        item.level === 'beginner'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : item.level === 'intermediate'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                      }`}
                    >
                      {item.levelLabel}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <i className="fa-solid fa-tag text-[10px] text-orange-400"></i>
                      {item.categoryLabel}
                    </span>
                  </div>

                  {/* Technical Instructional Illustration */}
                  <div className="mb-4 transform group-hover:scale-[1.01] transition-transform duration-300">
                    <TechniqueIllustration id={item.id} />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">{item.summary}</p>
                </div>
                <button
                  onClick={() => setActiveModalItem(item)}
                  className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-bold text-xs border border-slate-700 hover:border-sky-500/40 transition text-center flex items-center justify-center gap-2 shadow-sm"
                >
                  <i className="fa-solid fa-book-open"></i> อ่านคำอธิบายอย่างละเอียด
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: PETANQUE DRILL LIBRARY (คลังแบบฝึกซ้อมมาตรฐาน & COACHING INSIGHT) */}
      <section id="drills" className="py-16 bg-slate-900/80 border-b border-slate-800 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase bg-emerald-400/10 border border-emerald-400/20 px-3.5 py-1 rounded-full inline-block mb-2">
              Structured Practice & Drill Library
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              คลังแบบฝึกซ้อมเปตองมาตรฐาน (Petanque Drill Library)
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              แบบฝึกซ้อมอย่างเป็นระบบ 6 ทักษะสำคัญ พร้อมระบบบันทึกจำนวนครั้ง เกณฑ์มาตรฐานเหรียญทอง (Scoring Benchmarks)
              และฟังก์ชันผูก URL วิดีโอฝึกซ้อมส่วนตัว เพื่อวิเคราะห์พัฒนาการของคุณ
            </p>
          </div>

          {/* COACHING INSIGHT: DAILY PRO TIP GLASS-CARD */}
          {(() => {
            const activeTip = PRO_COACHING_TIPS[tipIndex % PRO_COACHING_TIPS.length];
            return (
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-orange-950/20 shadow-2xl mb-12 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg shadow-inner border border-amber-400/30">
                      <i className="fa-solid fa-lightbulb"></i>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                        Coaching Insight • เคล็ดลับมืออาชีพประจำวัน
                      </span>
                      <h3 className="text-lg font-black text-white font-heading flex items-center gap-2">
                        <span>{activeTip.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                          {activeTip.category}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-xs text-slate-400 font-medium">
                      เคล็ดลับที่ {((tipIndex % PRO_COACHING_TIPS.length) + 1)} / {PRO_COACHING_TIPS.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTipIndex((prev) => (prev + 1) % PRO_COACHING_TIPS.length)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <i className="fa-solid fa-shuffle text-xs"></i>
                      <span>สุ่มอ่านเคล็ดลับถัดไป</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-8 space-y-2">
                    <p className="text-slate-200 text-sm leading-relaxed font-light">
                      {activeTip.tip}
                    </p>
                    <div className="text-xs text-amber-300/90 font-medium flex items-center gap-2 pt-1">
                      <i className="fa-solid fa-user-tie text-amber-400"></i>
                      <span>ผู้ฝึกสอน: <strong>{activeTip.coach}</strong></span>
                    </div>
                  </div>
                  <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Coach's Golden Quote:
                    </span>
                    <blockquote className="text-xs sm:text-sm font-semibold italic text-amber-200/90 leading-snug">
                      "{activeTip.quote}"
                    </blockquote>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* RECHARTS DRILL PROGRESSION & GROWTH TRENDS BAR CHART */}
          <DrillProgressChart
            drills={DRILLS_DATA}
            practiceCounts={drillPracticeCounts}
            onIncrementRep={handleIncrementDrillRep}
            onResetRep={handleResetDrillRep}
            onSelectDrill={(drill) => setActiveDrillModal(drill)}
          />

          {/* Drill Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `ทั้งหมด (${DRILLS_DATA.length})` },
                { id: 'pointing', label: 'การเข้าลูก (Pointing)' },
                { id: 'shooting', label: 'การยิงลูก (Shooting)' },
                { id: 'tactical', label: 'จุดตก Donnée' },
                { id: 'pressure', label: 'แต้ม 12-12 บีบคั้น' },
                { id: 'defensive', label: '🛡️ วางมุมอับ (Tactical Defensive)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDrillFilter(tab.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                    drillFilter === tab.id
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <i className="fa-solid fa-video text-rose-400"></i>
              <span>สามารถแนบ URL วิดีโอฝึกซ้อมของตนเองในแต่ละดริลล์ได้</span>
            </div>
          </div>

          {/* Drill Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrills.map((drill) => {
              const currentReps = drillPracticeCounts[drill.id] || 0;
              const hasCustomVideo = Boolean(customDrillVideos[drill.id]);
              const progressPct = Math.min(100, Math.round((currentReps / drill.repetitionCount) * 100));

              return (
                <div
                  key={drill.id}
                  className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-slate-700 transition duration-300 flex flex-col justify-between space-y-4"
                >
                  {/* Top Badges */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                          drill.difficulty === 'beginner'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : drill.difficulty === 'intermediate'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : drill.difficulty === 'advanced'
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {drill.difficultyLabel}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <i className="fa-solid fa-clock text-amber-400"></i>
                        {drill.duration}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1 leading-snug">{drill.title}</h3>
                    <p className="text-[11px] text-slate-400 italic mb-3">{drill.titleEn}</p>
                    <p className="text-slate-300 text-xs leading-relaxed mb-4">{drill.objective}</p>

                    {/* Equipment Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {drill.equipment.slice(0, 3).map((eq, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400"
                        >
                          {eq}
                        </span>
                      ))}
                    </div>

                    {/* Repetition Practice Counter */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">ความคืบหน้าการฝึก:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {currentReps} / {drill.repetitionCount} ครั้ง ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleIncrementDrillRep(drill.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition flex items-center gap-1 active:scale-95"
                        >
                          <i className="fa-solid fa-plus text-[10px]"></i>
                          <span>+1 ลูกที่โยน</span>
                        </button>
                        {currentReps > 0 && (
                          <button
                            type="button"
                            onClick={() => handleResetDrillRep(drill.id)}
                            className="text-[10px] text-slate-500 hover:text-slate-400 transition"
                          >
                            รีเซ็ต
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CUSTOM TRAINING VIDEO URL INPUT & LINK */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-video text-rose-400"></i>
                          <span>วิดีโอฝึกซ้อมของฉัน:</span>
                        </span>
                        {hasCustomVideo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                            เชื่อมโยงแล้ว
                          </span>
                        )}
                      </div>

                      {hasCustomVideo ? (
                        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                          <a
                            href={customDrillVideos[drill.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:underline truncate max-w-[190px] font-mono text-[11px] flex items-center gap-1"
                            title={customDrillVideos[drill.id]}
                          >
                            <i className="fa-solid fa-play text-[10px]"></i>
                            <span>{customDrillVideos[drill.id]}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleSaveDrillVideo(drill.id, '')}
                            className="text-slate-500 hover:text-red-400 text-xs p-1"
                            title="ลบ URL นี้"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="url"
                            placeholder="วางลิงก์ YouTube/Drive ซ้อม..."
                            value={drillVideoInput && activeDrillModal?.id === drill.id ? drillVideoInput : ''}
                            onChange={(e) => {
                              setActiveDrillModal(drill);
                              setDrillVideoInput(e.target.value);
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (drillVideoInput) {
                                handleSaveDrillVideo(drill.id, drillVideoInput);
                                setDrillVideoInput('');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition whitespace-nowrap"
                          >
                            {drillVideoSuccess === drill.id ? '✓ บันทึก' : 'บันทึก'}
                          </button>
                        </div>
                      )}

                      {drillVideoSuccess === drill.id && (
                        <span className="text-[10px] text-emerald-400 block animate-fade-in">
                          ✓ บันทึกลิงก์วิดีโอลงในระบบเรียบร้อยแล้ว
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Drill Actions & Live Practice Cockpit */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePracticeDrill(drill)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                    >
                      <i className="fa-solid fa-play text-slate-950 text-xs"></i>
                      <span>เข้าสู่ห้องฝึกซ้อมสด & วิดีโอ (Live Cockpit)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveDrillClick(drill)}
                        className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-[11px] border border-emerald-500/30 hover:border-emerald-500/60 transition text-center flex items-center justify-center gap-1.5"
                      >
                        <i className="fa-solid fa-floppy-disk text-xs"></i>
                        <span className="truncate">บันทึกผล ({currentReps}/{drill.repetitionCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveDrillModal(drill)}
                        className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-[11px] border border-slate-700 hover:border-slate-600 transition text-center flex items-center justify-center gap-1.5"
                      >
                        <i className="fa-solid fa-list-check text-xs text-sky-400"></i>
                        <span className="truncate">เกณฑ์เหรียญทอง</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: HARDNESS & SPECS MATRIX */}
      <section id="specs" className="py-16 bg-slate-950 scroll-mt-12 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase bg-emerald-400/10 border border-emerald-400/20 px-3.5 py-1 rounded-full inline-block mb-2">
              Equipment Engineering
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              ตรรกะความแข็งและวัสดุโลหะ
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              วิเคราะห์ความแข็ง (Hardness Level in kg/mm²) และแรงยึดเกาะผิวสัมผัสตามมาตรฐาน FIPJP
            </p>
          </div>

          {/* Material Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Stainless Steel */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg">
                  <i className="fa-solid fa-gem"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">สแตนเลส (Stainless Steel)</h3>
                  <span className="text-xs text-emerald-400 font-mono">ไร้สนิม 100% | ทนทานยาวนาน</span>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-6">
                ผลิตจากเหล็กกล้าผสมโครเมียม ไร้ปัญหาสนิม ไม่จำเป็นต้องใช้น้ำมันชโลมรักษาบ่อย เหมาะสำหรับผู้เล่นที่ชอบสัมผัสเนียนมือ และการเล่นในสภาพอากาศชื้น
              </p>
              <div className="space-y-3 text-xs border-t border-slate-800 pt-4">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>ความทนทานต่อสนิม (Rust Resistance)</span>
                    <span className="text-emerald-400 font-bold">10/10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[100%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>แรงยึดเกาะฝ่ามือ (Grip Texture)</span>
                    <span className="text-amber-400 font-bold">7.5/10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[75%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>การบำรุงรักษา</span>
                    <span className="text-sky-400 font-bold">ง่ายดาย (ล้างน้ำเช็ดแห้ง)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carbon Steel */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold text-xl shadow-glow-orange">
                  <i className="fa-solid fa-magnet"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">เหล็กคาร์บอน (Carbon Steel)</h3>
                  <span className="text-xs text-orange-400 font-mono">ยึดเกาะสูงสุด | ขวัญใจมือตี</span>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-6">
                เนื้อเหล็กให้แรงติดฝ่ามือดีเยี่ยม ชะลออาการลูกหลุดมือขณะเหวี่ยง แต่ต้องเช็ดทำความสะอาดชโลมน้ำมันสม่ำเสมอหลังการแข่งขันเพื่อป้องกันสนิม
              </p>
              <div className="space-y-3 text-xs border-t border-slate-800 pt-4">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>ความทนทานต่อสนิม (Rust Resistance)</span>
                    <span className="text-amber-400 font-bold">5/10 (ต้องชโลมน้ำมัน)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[50%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>แรงยึดเกาะฝ่ามือ (Grip Texture)</span>
                    <span className="text-emerald-400 font-bold">9.8/10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[98%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>การบำรุงรักษา</span>
                    <span className="text-amber-400 font-bold">ต้องใช้น้ำมันกันสนิมเป็นประจำ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hardness Table */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-emerald-400"></i> ตารางเปรียบเทียบระดับความแข็ง (Hardness Matrix)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">ระดับความแข็ง</th>
                    <th className="p-3.5">ค่า (kg/mm²)</th>
                    <th className="p-3.5">อัตราการสะท้อน (Rebound)</th>
                    <th className="p-3.5">ตำแหน่งที่เหมาะสม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-sky-400">นิ่มมาก (Very Soft)</td>
                    <td className="p-3.5 font-mono">110 kg/mm²</td>
                    <td className="p-3.5 text-emerald-400">ต่ำที่สุด (ซับแรงดีเยี่ยม ไม่กระดอน)</td>
                    <td className="p-3.5 text-white">มือตีระดับแข่งขัน (Shooter) Carreau เน้นๆ</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-emerald-400">นิ่ม (Soft)</td>
                    <td className="p-3.5 font-mono">115 kg/mm²</td>
                    <td className="p-3.5 text-emerald-400">ต่ำ (ควบคุมทิศทางง่าย)</td>
                    <td className="p-3.5 text-white">มือตี & มือกลาง (Milieu)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-amber-400">ปานกลาง (Half-soft)</td>
                    <td className="p-3.5 font-mono">120 kg/mm²</td>
                    <td className="p-3.5 text-amber-400">ปานกลางสมดุล ทนทาน</td>
                    <td className="p-3.5 text-white">มือเข้า / เล่นได้ทุกตำแหน่ง อเนกประสงค์</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-orange-400">แข็ง (Hard)</td>
                    <td className="p-3.5 font-mono">140 kg/mm²</td>
                    <td className="p-3.5 text-red-400">สูง (ทนทานต่อรอยขีดข่วน อายุการใช้งานยาว)</td>
                    <td className="p-3.5 text-white">มือเข้า (Pointer) สำหรับสนามหินแข็ง</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: TACTICS & TERRAIN STRATEGY */}
      <section id="tactics" className="py-16 bg-slate-900/40 scroll-mt-12 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-purple-400 uppercase bg-purple-400/10 border border-purple-400/20 px-3.5 py-1 rounded-full inline-block mb-2">
              Tactical Playbook
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              กลยุทธ์การเล่นและการแก้ทางสนาม
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              การเลือกไลน์การเล่นตามสภาพพื้นผิว การตั้งการ์ดป้องกัน และการตัดสินใจเชิงกลยุทธ์
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Hard Clay */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                <i className="fa-solid fa-mountain"></i>
              </div>
              <h3 className="text-lg font-bold text-white">1. สนามดินอัดแน่น (Hard Clay)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                พื้นผิวแข็ง ลูกวิ่งไกลเมื่อกระทบพื้น ควรเผื่อระยะจุดตกก่อนถึงเป้าหมาย
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <span className="font-bold text-amber-400 block mb-1">กลยุทธ์แนะนำ:</span>
                <p>• เล่นลูกเข้าเรียบ (Rolling) ปล่อยจุดตกให้ห่างจากแก่น 1.5 - 2 เมตร</p>
                <p>• มือตีต้องใช้เทคนิค Direct Hit เพื่อเลี่ยงการแฉลบจากพื้นแข็ง</p>
              </div>
            </div>

            {/* Loose Gravel */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg">
                <i className="fa-solid fa-cubes"></i>
              </div>
              <h3 className="text-lg font-bold text-white">2. สนามหินร่วน (Gravel)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ทิศทางลูกเดายากเมื่อชนหิน ควรใช้เทคนิคโยนโด่งข้ามหิน
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <span className="font-bold text-sky-400 block mb-1">กลยุทธ์แนะนำ:</span>
                <p>• ใช้เทคนิค High Lob (โยนโด่ง) ให้ตกดิ่งใกล้มุมแก่น</p>
                <p>• หลีกเลี่ยงการปล่อยลูกกลิ้งเรียบเพราะหินจะปัดลูกแฉลบออกนอกเป้า</p>
              </div>
            </div>

            {/* Natural Grass / Lawn */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                <i className="fa-solid fa-seedling"></i>
              </div>
              <h3 className="text-lg font-bold text-white">3. สนามหญ้า (Natural Grass)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ใบหญ้าและดินนุ่มสร้างแรงต้านสูง ลูกหยุดสั้นและแทบไม่กระดอน
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <span className="font-bold text-emerald-400 block mb-1">กลยุทธ์แนะนำ:</span>
                <p>• ใช้เทคนิค Portée / โยนโด่ง ข้ามใบหญ้าลงหน้าแก่นโดยตรง</p>
                <p>• หากเล่นลูกเข้าเรียบ ต้องเพิ่มแรงส่ง (+40%) เพื่อไม่ให้ลูกหยุดค้างกลางทาง</p>
              </div>
            </div>

            {/* Defense & Blocking */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                <i className="fa-solid fa-shield"></i>
              </div>
              <h3 className="text-lg font-bold text-white">4. การตั้งการ์ดบล็อก (Blocking)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                วางลูกขวางหน้าแก่นระยะ 30-50 ซม. ในเส้นทางตรงเพื่อบีบฝั่งตรงข้าม
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <span className="font-bold text-purple-400 block mb-1">กลยุทธ์แนะนำ:</span>
                <p>• บังคับให้คู่แข่งต้องเสียลูกเพื่อตีลูกการ์ดเราออก</p>
                <p>• หากคู่แข่งไม่มีมือยิงที่แม่นยำ การตั้งการ์ดจะการันตีแต้มเสมอ</p>
              </div>
            </div>
          </div>

          {/* Interactive Tactical Board & Decision Tree */}
          <div className="mt-14 pt-10 border-t border-slate-800/80">
            <TacticalBoard />
          </div>
        </div>
      </section>

      {/* SECTION 6: INTERACTIVE MATCH SCORE & DRILL TRACKER (Value-add Pro Feature) */}
      <section id="score-tool" className="py-16 bg-slate-950 scroll-mt-12 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 rounded-full inline-block mb-2">
              Pro Tournament Tools
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              ระบบนับแต้ม 13 แต้ม & โมดูลวิเคราะห์เที่ยว (Mène Analysis)
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              บันทึกคะแนนรายเที่ยว (Mène), สถิติลูกยิงโดน/พลาด, กราฟวิเคราะห์ประสิทธิภาพ (Recharts) และวินิจฉัยจุดอ่อนของผู้เล่น
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Score Board */}
            <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-trophy text-amber-400"></i> กระดานคะแนนแข่งขัน (Target: 13 Points)
                </h3>
                <button
                  onClick={resetScore}
                  className="text-xs text-slate-400 hover:text-red-400 transition flex items-center gap-1"
                >
                  <i className="fa-solid fa-arrow-rotate-left"></i> รีเซ็ต
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Team A */}
                <div
                  className={`p-5 rounded-2xl border text-center transition ${
                    scoreTeamA >= 13
                      ? 'bg-amber-500/20 border-amber-400 shadow-glow-orange'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    ทีมเรา / ทีม A
                  </span>
                  <div className="text-5xl font-black font-heading text-amber-400 my-2">{scoreTeamA}</div>
                  {scoreTeamA >= 13 && (
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">
                      🏆 ชนะการแข่งขัน!
                    </span>
                  )}
                  <div className="flex justify-center gap-2 mt-3">
                    <button
                      onClick={() => setScoreTeamA((prev) => Math.max(0, prev - 1))}
                      className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold"
                    >
                      -1
                    </button>
                    <button
                      onClick={addPointA}
                      className="px-4 h-9 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1"
                    >
                      +1 แต้ม
                    </button>
                  </div>
                </div>

                {/* Team B */}
                <div
                  className={`p-5 rounded-2xl border text-center transition ${
                    scoreTeamB >= 13
                      ? 'bg-red-500/20 border-red-400'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    คู่แข่ง / ทีม B
                  </span>
                  <div className="text-5xl font-black font-heading text-sky-400 my-2">{scoreTeamB}</div>
                  {scoreTeamB >= 13 && (
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">
                      🏆 ทีม B ชนะ
                    </span>
                  )}
                  <div className="flex justify-center gap-2 mt-3">
                    <button
                      onClick={() => setScoreTeamB((prev) => Math.max(0, prev - 1))}
                      className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold"
                    >
                      -1
                    </button>
                    <button
                      onClick={addPointB}
                      className="px-4 h-9 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1"
                    >
                      +1 แต้ม
                    </button>
                  </div>
                </div>
              </div>

              {/* Record End (Mène) */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">ประวัติแต่ละเที่ยว (Mène History)</span>
                  <button
                    onClick={() => recordMene(scoreTeamA, scoreTeamB)}
                    className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <i className="fa-solid fa-plus"></i> บันทึกเที่ยวนี้
                  </button>
                </div>
                {meneHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">ยังไม่มีการบันทึกเที่ยว</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {meneHistory.map((m) => (
                      <span
                        key={m.mene}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-mono border border-slate-700"
                      >
                        เที่ยวที่ {m.mene}: {m.a} - {m.b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Target Drill Tracker */}
            <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <i className="fa-solid fa-bullseye text-orange-400"></i> บันทึกความแม่นยำฝึกซ้อม (Drill Tracker)
              </h3>

              <div className="text-center p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">อัตราความแม่นยำ (Hit Rate)</span>
                <div className="text-4xl font-black font-heading text-emerald-400">
                  {drillTotalThrows === 0 ? '0%' : `${Math.round((drillHits / drillTotalThrows) * 100)}%`}
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  เข้าเป้า/ยิงโดน: {drillHits} / {drillTotalThrows} ครั้ง
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setDrillTotalThrows((prev) => prev + 1);
                    setDrillHits((prev) => prev + 1);
                  }}
                  className="p-3.5 rounded-xl bg-emerald-600/20 border border-emerald-500 text-emerald-300 font-bold text-xs hover:bg-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-check"></i> เข้าเป้า / ยิงโดน
                </button>
                <button
                  onClick={() => {
                    setDrillTotalThrows((prev) => prev + 1);
                  }}
                  className="p-3.5 rounded-xl bg-red-600/20 border border-red-500 text-red-300 font-bold text-xs hover:bg-red-600/30 transition flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-xmark"></i> พลาดเป้า
                </button>
              </div>

              {drillTotalThrows > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const currentDrillToSave: SavedDrillResult = {
                      id: 'drill-tracker-' + Date.now(),
                      drillId: 'accuracy-tracker',
                      drillTitle: 'สถิติความแม่นยำ (Drill Accuracy Tracker)',
                      reps: drillHits,
                      targetReps: drillTotalThrows,
                      progressPct: Math.round((drillHits / drillTotalThrows) * 100),
                      savedAt: new Date().toISOString(),
                    };
                    if (userAccount.isGuest) {
                      setPendingDrillToSave(currentDrillToSave);
                      setAuthModalReason('save_drill');
                      setAuthModalOpen(true);
                    } else {
                      saveDrillToAccount(currentDrillToSave, userAccount);
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>💾 บันทึกสถิติความแม่นยำนี้ ({drillHits}/{drillTotalThrows} ครั้ง)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setDrillTotalThrows(0);
                  setDrillHits(0);
                }}
                className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs transition"
              >
                ล้างข้อมูลฝึกซ้อม
              </button>
            </div>
          </div>

          {/* DEDICATED MÈNE ANALYSIS & WEAKNESS DIAGNOSTICS MODULE */}
          <div className="mt-12 pt-10 border-t border-slate-800/80">
            <MeneAnalysis />
          </div>
        </div>
      </section>

      {/* SECTION 7: TOURNAMENTS & LIVE BROADCASTS (ศูนย์รวมรายการแข่งขัน & ถ่ายทอดสด) */}
      <section id="tournaments" className="py-16 bg-slate-900/50 scroll-mt-12 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>🔴 สด & อนาคต (Live & Upcoming Circuit Only)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
                <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                <span>ไม่แสดงข้อมูลการแข่งขันในอดีตที่ผ่านพ้นไปแล้ว</span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              ศูนย์รวมรายการแข่งขันเปตอง & ถ่ายทอดสด (Live)
            </h2>
            <p className="text-slate-300 text-sm mt-2.5 leading-relaxed">
              รวบรวมทัวร์นาเมนต์เปตอง ทั้งระดับโอเพ่นและชิงแชมป์ พร้อมช่องทางรับชมสัญญาณสด ลิงก์เกาะติดขอบสนาม และตารางการแข่งขันอย่างเป็นทางการ
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-heading block">
                {currentAndFutureTournaments.length}
              </span>
              <span className="text-xs text-slate-400">รายการแข่งขันปัจจุบัน & อนาคต</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-rose-500/30 text-center bg-rose-950/20">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-2xl sm:text-3xl font-black text-rose-400 font-heading">
                  {currentAndFutureTournaments.filter((t) => t.status === 'live').length}
                </span>
              </div>
              <span className="text-xs text-rose-300 font-semibold">🔴 กำลังถ่ายทอดสด (Live Now)</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-sky-500/30 text-center">
              <span className="text-2xl sm:text-3xl font-black text-sky-400 font-heading block">
                {currentAndFutureTournaments.filter((t) => t.scope === 'domestic').length}
              </span>
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-sm">🇹🇭</span>
                <span>รายการในประเทศ</span>
              </span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-amber-500/30 text-center">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-heading block">
                {currentAndFutureTournaments.filter((t) => t.scope === 'international').length}
              </span>
              <span className="text-xs text-slate-400">ระดับนานาชาติ 🌍</span>
            </div>
          </div>

          {/* Search & Filter Toolbar with View Mode Toggle */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 mb-8">
            {/* View Mode Toggle Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">รูปแบบการแสดงผล:</span>
                <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setTourneyViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      tourneyViewMode === 'cards'
                        ? 'bg-orange-600 text-white shadow-glow-orange'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-grip text-xs"></i>
                    <span>การ์ดรายการ (Cards)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTourneyViewMode('calendar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      tourneyViewMode === 'calendar'
                        ? 'bg-rose-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-calendar-days text-xs text-rose-300"></i>
                    <span>ปฏิทินรายเดือน (Calendar View)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTourneyViewMode('map')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      tourneyViewMode === 'map'
                        ? 'bg-sky-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-map-location-dot text-xs text-sky-300"></i>
                    <span>แผนที่พิกัด (Map View 🗺️)</span>
                  </button>
                </div>
              </div>

              {tourneyViewMode === 'calendar' ? (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>สีแดง = กำลังแข่ง/สด</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sky-400 font-semibold ml-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>สีฟ้า = เตรียมแข่งขัน</span>
                  </span>
                </div>
              ) : tourneyViewMode === 'map' ? (
                <span className="text-xs text-sky-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>คลิกหมุดสนามบนแผนที่เพื่อดูข้อมูลสถานที่, กำหนดการ, และพิกัด GPS</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  แสดงผลแบบการ์ดพร้อมข้อมูลช่องทางรับชมสด
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อรายการ, สนาม, หรือช่องทางถ่ายทอด..."
                  value={tourneySearchQuery}
                  onChange={(e) => setTourneySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
                {tourneySearchQuery && (
                  <button
                    onClick={() => setTourneySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* Status / Scope Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    setTourneyScopeFilter('all');
                    setTourneyCategoryFilter('all');
                    setTourneyStatusFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tourneyScopeFilter === 'all' && tourneyCategoryFilter === 'all' && tourneyStatusFilter === 'all'
                      ? 'bg-orange-600 text-white shadow-glow-orange'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  ทั้งหมด ({currentAndFutureTournaments.length})
                </button>
                <button
                  onClick={() => setTourneyStatusFilter(tourneyStatusFilter === 'live' ? 'all' : 'live')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    tourneyStatusFilter === 'live'
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>ถ่ายทอดสด Live ({currentAndFutureTournaments.filter((t) => t.status === 'live').length})</span>
                </button>
                <button
                  onClick={() => setTourneyScopeFilter(tourneyScopeFilter === 'domestic' ? 'all' : 'domestic')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    tourneyScopeFilter === 'domestic'
                      ? 'bg-sky-600 text-white shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span className="text-sm">🇹🇭</span>
                  <span>ในประเทศ</span>
                </button>
                <button
                  onClick={() => setTourneyScopeFilter(tourneyScopeFilter === 'international' ? 'all' : 'international')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    tourneyScopeFilter === 'international'
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>🌍</span>
                  <span>นานาชาติ</span>
                </button>
                <button
                  onClick={() => setTourneyCategoryFilter(tourneyCategoryFilter === 'open' ? 'all' : 'open')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tourneyCategoryFilter === 'open'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  🔓 โอเพ่นทั่วไป
                </button>
                <button
                  onClick={() => setTourneyCategoryFilter(tourneyCategoryFilter === 'major' ? 'all' : 'major')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tourneyCategoryFilter === 'major'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  🏆 ชิงแชมป์หลัก
                </button>
              </div>
            </div>

            {/* Active Filter Indicators */}
            {(tourneyScopeFilter !== 'all' || tourneyCategoryFilter !== 'all' || tourneyStatusFilter !== 'all' || tourneySearchQuery) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">กำลังกรอง:</span>
                {tourneyStatusFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-mono text-[11px] border border-rose-500/30">
                    สถานะ: ถ่ายทอดสด
                  </span>
                )}
                {tourneyScopeFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono text-[11px] border border-sky-500/30 inline-flex items-center gap-1.5">
                    <span>ขอบเขต:</span>
                    {tourneyScopeFilter === 'domestic' ? (
                      <span className="inline-flex items-center gap-1"><span className="text-sm">🇹🇭</span> ในประเทศ</span>
                    ) : (
                      <span>นานาชาติ 🌍</span>
                    )}
                  </span>
                )}
                {tourneyCategoryFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[11px] border border-emerald-500/30">
                    ประเภท: {tourneyCategoryFilter === 'open' ? 'โอเพ่นทั่วไป 🔓' : 'ชิงแชมป์หลัก 🏆'}
                  </span>
                )}
                {tourneySearchQuery && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[11px] border border-amber-500/30">
                    ค้นหา: &quot;{tourneySearchQuery}&quot;
                  </span>
                )}
                <button
                  onClick={() => {
                    setTourneyScopeFilter('all');
                    setTourneyCategoryFilter('all');
                    setTourneyStatusFilter('all');
                    setTourneySearchQuery('');
                  }}
                  className="text-orange-400 hover:underline font-semibold ml-auto"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>

          {/* VIEW MODE SWITCH: MAP VIEW vs MONTHLY CALENDAR vs CARDS GRID */}
          {tourneyViewMode === 'map' ? (
            <div className="mb-8">
              <TournamentMap
                tournaments={filteredTournaments.length > 0 ? filteredTournaments : currentAndFutureTournaments}
                onSelectTourney={setActiveTourneyModal}
              />
            </div>
          ) : tourneyViewMode === 'calendar' ? (
            <div className="space-y-6">
              {/* Month Selector Tabs */}
              <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-calendar-check text-rose-400 text-lg"></i>
                  <span className="text-sm font-bold text-white">เลือกเดือนเพื่อดูตารางแข่งขัน:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '2026-10', name: 'ตุลาคม 2026 (ต.ค. - ปัจจุบัน)' },
                    { id: '2026-11', name: 'พฤศจิกายน 2026 (พ.ย.)' },
                    { id: '2026-12', name: 'ธันวาคม 2026 (ธ.ค.)' },
                    { id: '2027-01', name: 'มกราคม 2027 (ม.ค.)' },
                    { id: '2027-02', name: 'กุมภาพันธ์ 2027 (ก.พ.)' },
                    { id: '2027-03', name: 'มีนาคม 2027 (มี.ค.)' },
                    { id: '2027-07', name: 'กรกฎาคม 2027 (ก.ค.)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCalendarMonth(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        calendarMonth === m.id
                          ? 'bg-rose-600 text-white shadow-lg border border-rose-400/50'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7-Day Monthly Calendar Grid */}
              {(() => {
                const monthMeta: Record<string, { name: string; totalDays: number; startDay: number }> = {
                  '2026-10': { name: 'ตุลาคม 2026 (October 2026)', totalDays: 31, startDay: 4 }, // Thu
                  '2026-11': { name: 'พฤศจิกายน 2026 (November 2026)', totalDays: 30, startDay: 0 }, // Sun
                  '2026-12': { name: 'ธันวาคม 2026 (December 2026)', totalDays: 31, startDay: 2 }, // Tue
                  '2027-01': { name: 'มกราคม 2027 (January 2027)', totalDays: 31, startDay: 5 }, // Fri
                  '2027-02': { name: 'กุมภาพันธ์ 2027 (February 2027)', totalDays: 28, startDay: 1 }, // Mon
                  '2027-03': { name: 'มีนาคม 2027 (March 2027)', totalDays: 31, startDay: 1 }, // Mon
                  '2027-07': { name: 'กรกฎาคม 2027 (July 2027)', totalDays: 31, startDay: 4 }, // Thu
                };

                const currentMonth = monthMeta[calendarMonth] || monthMeta['2026-10'];
                const daysOfWeek = ['อา. (Sun)', 'จ. (Mon)', 'อ. (Tue)', 'พ. (Wed)', 'พฤ. (Thu)', 'ศ. (Fri)', 'ส. (Sat)'];

                // Filter tournaments active in this month from current and future list
                const monthTournaments = currentAndFutureTournaments.filter((t) => {
                  const dates = TOURNAMENT_DATES[t.id];
                  if (!dates) return false;
                  return dates.start.startsWith(calendarMonth) || dates.end.startsWith(calendarMonth);
                });

                return (
                  <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-xl font-black text-white font-heading">{currentMonth.name}</h3>
                        <span className="text-xs text-slate-400">
                          พบการแข่งขัน {monthTournaments.length} รายการในเดือนนี้ (คัดกรองเฉพาะปัจจุบันและอนาคต)
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        CURRENT & UPCOMING ONLY
                      </span>
                    </div>

                    {/* Day-of-Week Column Headers */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold text-slate-400 font-mono pb-1 border-b border-slate-800/80">
                      {daysOfWeek.map((dow, idx) => (
                        <div
                          key={dow}
                          className={`py-2 rounded-lg ${idx === 0 ? 'text-rose-400 bg-rose-500/5' : idx === 6 ? 'text-sky-400 bg-sky-500/5' : ''}`}
                        >
                          {dow}
                        </div>
                      ))}
                    </div>

                    {/* Day Cells Grid */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {/* Blank cells for start offset */}
                      {Array.from({ length: currentMonth.startDay }).map((_, i) => (
                        <div key={`blank-${i}`} className="min-h-[85px] sm:min-h-[105px] rounded-2xl bg-slate-950/30 border border-slate-900/60 p-1.5 opacity-30"></div>
                      ))}

                      {/* Day cells 1 to totalDays */}
                      {Array.from({ length: currentMonth.totalDays }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${calendarMonth}-${String(dayNum).padStart(2, '0')}`;
                        const isToday = dateStr === CURRENT_PETANQUE_DATE;
                        const isPastDay = dateStr < CURRENT_PETANQUE_DATE;

                        const dayEvents = currentAndFutureTournaments.filter((t) => {
                          const dates = TOURNAMENT_DATES[t.id];
                          if (!dates) return false;
                          return dateStr >= dates.start && dateStr <= dates.end;
                        });

                        const hasLive = dayEvents.some((e) => e.status === 'live');
                        const hasEvent = dayEvents.length > 0;

                        return (
                          <div
                            key={`day-${dayNum}`}
                            className={`min-h-[85px] sm:min-h-[105px] rounded-2xl p-2 transition flex flex-col justify-between border ${
                              isToday
                                ? 'bg-rose-950/40 border-rose-400 ring-2 ring-rose-500/50 shadow-lg'
                                : hasLive
                                ? 'bg-rose-950/25 border-rose-500/60 shadow-inner'
                                : hasEvent
                                ? 'bg-sky-950/20 border-sky-500/40'
                                : isPastDay
                                ? 'bg-slate-950/40 border-slate-900/80 opacity-50'
                                : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                                    isToday
                                      ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                                      : hasLive
                                      ? 'bg-rose-600 text-white'
                                      : hasEvent
                                      ? 'bg-sky-600 text-white'
                                      : isPastDay
                                      ? 'text-slate-600'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {dayNum}
                                </span>
                                {isToday && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/30 text-rose-300 border border-rose-400/40">
                                    วันนี้
                                  </span>
                                )}
                              </div>
                              {hasLive && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                              )}
                            </div>

                            {/* Tournament Markers in Day Cell */}
                            <div className="space-y-1 mt-1">
                              {dayEvents.map((ev) => (
                                <button
                                  key={ev.id}
                                  type="button"
                                  onClick={() => setActiveTourneyModal(ev)}
                                  className={`w-full text-left p-1 rounded-lg text-[10px] leading-tight font-semibold truncate transition block ${
                                    ev.status === 'live'
                                      ? 'bg-rose-500 text-white hover:bg-rose-400 font-bold'
                                      : 'bg-slate-800 hover:bg-slate-700 text-sky-300'
                                  }`}
                                  title={`${ev.title} (${ev.date})`}
                                >
                                  {ev.status === 'live' ? '🔴 ' : '🏆 '}
                                  {ev.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Month's Scheduled Tournaments Summary List */}
                    <div className="pt-6 border-t border-slate-800 space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-rose-400"></i>
                        <span>รายการแข่งขันประจำเดือน {currentMonth.name}:</span>
                      </h4>

                      {monthTournaments.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                          ไม่มีกำหนดการแข่งขันในเดือนนี้
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {monthTournaments.map((t) => (
                            <div
                              key={t.id}
                              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {t.status === 'live' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40 animate-pulse">
                                      🔴 LIVE
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                      🗓️ กำหนดการ
                                    </span>
                                  )}
                                  <span className="font-bold text-white">{t.title}</span>
                                </div>
                                <div className="text-slate-400 flex items-center gap-2">
                                  <span><i className="fa-solid fa-calendar mr-1 text-slate-500"></i>{t.date}</span>
                                  <span>•</span>
                                  <span><i className="fa-solid fa-location-dot mr-1 text-slate-500"></i>{t.location}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveTourneyModal(t)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs whitespace-nowrap transition border border-slate-700 shrink-0"
                              >
                                รายละเอียด & Live
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* DOMESTIC OPEN PETANQUE SCHEDULE SUMMARY TABLE (การแข่งขันเปตองโอเพ่นภายในประเทศ) */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                      <i className="fa-solid fa-table-list"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">ตารางสรุปการแข่งขันเปตองโอเพ่นภายในประเทศ (Domestic Open Calendar)</h3>
                      <p className="text-xs text-slate-400">เรียงตามลำดับวันและเดือนจากปัจจุบันสู่อนาคต (คัดกรองเฉพาะรายการที่กำลังแข่งและที่จะมีขึ้น)</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    CURRENT & UPCOMING ONLY
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-300 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-3">วันที่จัดแข่งขัน</th>
                        <th className="p-3">ชื่อรายการ</th>
                        <th className="p-3">สถานที่/จังหวัด</th>
                        <th className="p-3">รุ่นการแข่งขัน</th>
                        <th className="p-3">เงินรางวัลรวม</th>
                        <th className="p-3">ผู้จัด/ช่องทางสมัคร</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      <tr className="hover:bg-slate-900/50 transition bg-rose-950/15">
                        <td className="p-3 font-mono font-bold text-rose-400">25 - 26 ต.ค. 2026 🔴</td>
                        <td className="p-3 font-bold text-white">เปตองการกุศล ท่าเรือแหลมฉบัง โอเพ่น ครั้งที่ 16</td>
                        <td className="p-3 text-slate-300">สนามกีฬาเปตอง การท่าเรือแหลมฉบัง อ.ศรีราชา จ.ชลบุรี</td>
                        <td className="p-3 text-sky-300">ทีม 3 คนทั่วไป (Open Triples) & เยาวชน U17</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">250,000 บาท</td>
                        <td className="p-3 text-slate-300">การท่าเรือฯ / ชมรมเปตองแหลมฉบัง (FB เพจ)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 transition">
                        <td className="p-3 font-mono font-bold text-slate-200">20 - 24 พ.ย. 2026</td>
                        <td className="p-3 font-bold text-white">การแข่งขันเปตองชิงชนะเลิศแห่งประเทศไทย ประจำปี 2567-2568</td>
                        <td className="p-3 text-slate-300">สนามเปตองในร่ม ศูนย์ฝึกกีฬาแห่งชาติ คลอง 6 จ.ปทุมธานี</td>
                        <td className="p-3 text-sky-300">ชายเดี่ยว, หญิงเดี่ยว, คู่, ทีม 3 คน, ชูตติ้ง</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">ถ้วยเกียรติยศ + สิทธิ์ทีมชาติ</td>
                        <td className="p-3 text-slate-300">สมาคมกีฬาเปตองแห่งประเทศไทยฯ</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 transition">
                        <td className="p-3 font-mono font-bold text-slate-200">28 - 29 พ.ย. 2026</td>
                        <td className="p-3 font-bold text-white">แบงค็อก เปตอง กรังด์ปรีซ์ โอเพ่น 2026</td>
                        <td className="p-3 text-slate-300">สนามเปตอง ลานคนเมือง ศาลาว่าการ กทม.</td>
                        <td className="p-3 text-sky-300">ทีม 3 คนทั่วไป (Open Triples) & คู่ผสม</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">200,000 บาท</td>
                        <td className="p-3 text-slate-300">กรุงเทพมหานคร ร่วมกับ สมาคมกีฬาเปตองฯ</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 transition">
                        <td className="p-3 font-mono font-bold text-slate-200">12 - 14 ธ.ค. 2026</td>
                        <td className="p-3 font-bold text-white">เปตองชิงถ้วยพระราชทาน สมเด็จพระกนิษฐาธิราชเจ้าฯ โอเพ่น</td>
                        <td className="p-3 text-slate-300">สนามเปตอง มหาวิทยาลัยกรุงเทพธนบุรี, กรุงเทพฯ</td>
                        <td className="p-3 text-sky-300">ทีมคู่ชายทั่วไป, ทีมคู่หญิงทั่วไป, เยาวชน</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">180,000 บาท + ถ้วยพระราชทาน</td>
                        <td className="p-3 text-slate-300">ม.กรุงเทพธนบุรี ร่วมกับ สมาคมกีฬาเปตองฯ</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 transition">
                        <td className="p-3 font-mono font-bold text-slate-200">9 - 10 ม.ค. 2027</td>
                        <td className="p-3 font-bold text-white">เชียงใหม่ ลานนา เปตอง โอเพ่น ชิงถ้วยผู้ว่าฯ</td>
                        <td className="p-3 text-slate-300">สนามกีฬาเทศบาลนครเชียงใหม่ จ.เชียงใหม่</td>
                        <td className="p-3 text-sky-300">ทีม 3 คนทั่วไป, ทีมอาวุโส (อายุ 55 ปีขึ้นไป)</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">120,000 บาท</td>
                        <td className="p-3 text-slate-300">สมาคมกีฬาจังหวัดเชียงใหม่ (ฝ่ายเปตอง)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 transition">
                        <td className="p-3 font-mono font-bold text-slate-200">18 - 22 ก.พ. 2027</td>
                        <td className="p-3 font-bold text-white">การแข่งขันเปตองชิงชนะเลิศแห่งเอเชีย ครั้งที่ 32 (Asian Championship)</td>
                        <td className="p-3 text-slate-300">ศูนย์กีฬาเฉลิมพระเกียรติฯ มีนบุรี, กรุงเทพฯ</td>
                        <td className="p-3 text-sky-300">ทีม 3 คน ชาย/หญิง/เยาวชน, ชูตติ้งความแม่นยำ</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">เหรียญทองเกียรติยศ + โควตาโลก</td>
                        <td className="p-3 text-slate-300">สหพันธ์เปตองแห่งเอเชีย (ABF) / สมาคมกีฬาเปตองฯ</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 transition">
                        <td className="p-3 font-mono font-bold text-amber-400">ก.พ. 2027 [รอประกาศวัน]</td>
                        <td className="p-3 font-bold text-white">สงขลา สมิหลา เปตอง โอเพ่น 2027</td>
                        <td className="p-3 text-slate-300">สนามเปตองสวนสองทะเล หาดสมิหลา จ.สงขลา</td>
                        <td className="p-3 text-sky-300">ประชาชนทั่วไป (Open Triples), เยาวชน U15</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">100,000 บาท</td>
                        <td className="p-3 text-slate-300">เทศบาลนครสงขลา / ชมรมเปตองสงขลา</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50 transition">
                        <td className="p-3 font-mono font-bold text-amber-400">เม.ย. 2027 [รอประกาศวัน]</td>
                        <td className="p-3 font-bold text-white">ขอนแก่น มอดินแดง เปตอง โอเพ่น คัพ</td>
                        <td className="p-3 text-slate-300">สนามเปตอง มหาวิทยาลัยขอนแก่น จ.ขอนแก่น</td>
                        <td className="p-3 text-sky-300">ทีมคู่ทั่วไป (Open Doubles), ทีมประชาชนอีสาน</td>
                        <td className="p-3 font-mono text-amber-400 font-bold">80,000 บาท</td>
                        <td className="p-3 text-slate-300">ชมรมเปตองมหาวิทยาลัยขอนแก่น</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
          /* Tournament Cards Grid */
          filteredTournaments.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-slate-800">
              <i className="fa-solid fa-trophy text-4xl text-slate-600 mb-3"></i>
              <h3 className="text-lg font-bold text-white mb-1">ไม่พบรายการแข่งขันที่ตรงกับเงื่อนไข</h3>
              <p className="text-xs text-slate-400 mb-4">ลองปรับเปลี่ยนคำค้นหา หรือเลือกตัวกรองใหม่อีกครั้ง</p>
              <button
                onClick={() => {
                  setTourneyScopeFilter('all');
                  setTourneyCategoryFilter('all');
                  setTourneyStatusFilter('all');
                  setTourneySearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
              >
                แสดงรายการแข่งขันทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTournaments.map((tourney) => (
                <div
                  key={tourney.id}
                  className={`glass-panel rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 hover:border-slate-700 relative overflow-hidden group ${
                    tourney.status === 'live'
                      ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-slate-900/60 to-slate-950 shadow-glow-red'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Top Bar Badges */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Status Badge */}
                        {tourney.status === 'live' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-[11px] font-extrabold text-rose-300 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            🔴 ถ่ายทอดสดวันนี้ (LIVE)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">
                            <i className="fa-regular fa-clock text-slate-400"></i> เร็วๆ นี้
                          </span>
                        )}

                        {/* Scope Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                            tourney.scope === 'domestic'
                              ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          {tourney.scope === 'domestic' ? (
                            <>
                              <ThaiFlag />
                              <span>ในประเทศ</span>
                            </>
                          ) : (
                            <>
                              <span>🌍</span>
                              <span>นานาชาติ</span>
                            </>
                          )}
                        </span>

                        {/* Category Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            tourney.category === 'open'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          }`}
                        >
                          {tourney.category === 'open' ? '🔓 โอเพ่น (Open)' : '🏆 ชิงแชมป์หลัก'}
                        </span>
                      </div>

                      {/* Country Flag / Tag */}
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <i className="fa-solid fa-location-dot text-rose-400 text-[11px]"></i>
                        {tourney.country.includes('ไทย') ? (
                          <ThaiFlag />
                        ) : tourney.country.includes('ฝรั่งเศส') ? (
                          <CountryFlag code="FR" />
                        ) : tourney.country.includes('สิงคโปร์') ? (
                          <CountryFlag code="SG" />
                        ) : tourney.country.includes('ยุโรป') ? (
                          <CountryFlag code="EU" />
                        ) : (
                          <span>🌍</span>
                        )}
                        <span>{tourney.country.replace(/\s*[🇹🇭🇫🇷🇸🇬🇪🇺]/g, '').trim()}</span>
                      </span>
                    </div>

                    {/* Tournament Titles */}
                    <h3 className="text-lg sm:text-xl font-black text-white font-heading group-hover:text-amber-400 transition leading-snug">
                      {tourney.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5 mb-3.5 italic">
                      {tourney.titleEn}
                    </p>

                    {/* Metadata Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4">
                      <div className="flex items-center gap-2">
                        <i className="fa-regular fa-calendar text-amber-400 shrink-0 w-4"></i>
                        <span className="text-slate-400">วันที่:</span>
                        <span className="font-semibold text-white">{tourney.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-map-pin text-rose-400 shrink-0 w-4"></i>
                        <span className="text-slate-400">สถานที่:</span>
                        <span className="truncate" title={tourney.location}>{tourney.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-people-group text-sky-400 shrink-0 w-4"></i>
                        <span className="text-slate-400">ประเภท:</span>
                        <span className="truncate" title={tourney.format}>{tourney.format}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-trophy text-amber-400 shrink-0 w-4"></i>
                        <span className="text-slate-400">รางวัล:</span>
                        <span className="text-amber-300 font-semibold truncate" title={tourney.prizePool}>{tourney.prizePool}</span>
                      </div>
                    </div>

                    {/* Surface / Highlights */}
                    <div className="mb-4 space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-layer-group text-slate-500 w-4"></i>
                        <span>สภาพสนาม: <strong className="text-slate-300">{tourney.surface}</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <i className="fa-solid fa-star text-amber-400 w-4 mt-0.5 shrink-0"></i>
                        <span className="line-clamp-2 text-slate-300">{tourney.highlights[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* LIVE CHANNELS SECTION */}
                  <div className="pt-3.5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        <span>ช่องทางถ่ายทอดสด (Live Channels):</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {tourney.liveChannels.length} ช่องทาง
                      </span>
                    </div>

                    {/* Channel Cards */}
                    <div className="space-y-2 mb-3.5">
                      {tourney.liveChannels.map((channel, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Platform Icon */}
                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                              {channel.platform === 'facebook' && <i className="fa-brands fa-facebook text-blue-400 text-sm"></i>}
                              {channel.platform === 'youtube' && <i className="fa-brands fa-youtube text-red-500 text-sm"></i>}
                              {channel.platform === 'tv' && <i className="fa-solid fa-tv text-amber-400 text-xs"></i>}
                              {channel.platform === 'web' && <i className="fa-solid fa-globe text-sky-400 text-xs"></i>}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-200 block truncate">{channel.name}</span>
                              <span className="text-[11px] text-slate-400 block truncate">{channel.schedule}</span>
                            </div>
                          </div>

                          {/* Direct Live Link Button */}
                          <a
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold shrink-0 flex items-center gap-1.5 transition ${
                              channel.platform === 'facebook'
                                ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40'
                                : channel.platform === 'youtube'
                                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40'
                                : channel.platform === 'tv'
                                ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40'
                                : 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40'
                            }`}
                          >
                            <span>รับชมสด</span>
                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* Card Action Button */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveTourneyModal(tourney)}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-circle-info text-amber-400"></i>
                        <span>ดูผังถ่ายทอดสด & รายละเอียดรายการ</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        </div>
      </section>
      </main>

      {/* ACCESSIBLE MOBILE BOTTOM NAVIGATION BAR (WCAG 2.1 AA & Thumb Ergonomics) */}
      <nav
        aria-label="เมนูการนำทางด่วนสำหรับมือถือ"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 lg:hidden shadow-2xl pb-safe"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          <a
            href="#simulator"
            className="min-h-[48px] flex flex-col items-center justify-center text-slate-300 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl transition"
            aria-label="จำลองวิถี 2D & Bird's Eye View"
          >
            <i className="fa-solid fa-cubes text-base" aria-hidden="true"></i>
            <span className="text-[10px] font-medium tracking-tight mt-1">วิถีโคจร</span>
          </a>
          <a
            href="#tactics-board"
            className="min-h-[48px] flex flex-col items-center justify-center text-slate-300 hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-xl transition"
            aria-label="กระดานแทกติก & Replay"
          >
            <i className="fa-solid fa-chess-knight text-base" aria-hidden="true"></i>
            <span className="text-[10px] font-medium tracking-tight mt-1">แทกติก</span>
          </a>
          <a
            href="#calculator"
            className="min-h-[48px] flex flex-col items-center justify-center text-orange-400 hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-xl transition font-bold"
            aria-label="ตัวค้นหาและคำนวณสเปกลูก"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-glow-orange -mt-3">
              <i className="fa-solid fa-calculator text-xs" aria-hidden="true"></i>
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-0.5 text-orange-300">สเปกมือ</span>
          </a>
          <a
            href="#drills"
            className="min-h-[48px] flex flex-col items-center justify-center text-slate-300 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl transition"
            aria-label="คลังแบบฝึกซ้อมและตัวจับเวลา"
          >
            <i className="fa-solid fa-stopwatch-20 text-base" aria-hidden="true"></i>
            <span className="text-[10px] font-medium tracking-tight mt-1">แบบฝึก</span>
          </a>
          <a
            href="#tournaments"
            className="min-h-[48px] flex flex-col items-center justify-center text-slate-300 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-xl transition"
            aria-label="ตารางแข่งขันและถ่ายทอดสด Live"
          >
            <div className="relative">
              <i className="fa-solid fa-tower-broadcast text-base" aria-hidden="true"></i>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-1">แข่งสด</span>
          </a>
        </div>
      </nav>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-800/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3.5">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950/70 to-slate-900 p-1.5 flex items-center justify-center border border-sky-500/30 shadow-md">
                <img
                  src="/assets/aistudio/Artboard_5_d7d07c9e.png"
                  alt="Petanque Pro Official Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]"
                />
              </div>
              <div>
                <span className="text-white font-bold text-lg font-heading block">Petanque Master Guide Pro</span>
                <span className="text-xs text-slate-400">
                  ระบบชี้นำเทคนิคการเล่นและวิเคราะห์สเปกลูกเปตองระดับอาชีพ
                </span>
              </div>
            </div>

            {/* Prominent Developer Credit Card in Footer */}
            <div className="glass-card px-5 py-3 rounded-2xl border border-amber-500/30 flex items-center gap-3 bg-slate-900/90 shadow-2xl">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-user-gear text-lg"></i>
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                  Lead Visual & UX Developer
                </span>
                <span className="text-xs font-extrabold text-amber-300">
                  ผู้ออกแบบสร้างสรรค์พัฒนา: ฐิติวัสส์ กาญจนาพิมาย
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <p>© 2026 Petanque Master Guide Pro. Developed by ฐิติวัสส์ กาญจนาพิมาย (Thitiwat Kanjanaphimai).</p>
            <div className="flex gap-4 text-slate-400">
              <span>
                <i className="fa-solid fa-shield-halved text-emerald-400 mr-1"></i> FIPJP Compliant
              </span>
              <span>
                <i className="fa-solid fa-code text-sky-400 mr-1"></i> UI/UX Promax Edition
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* TOURNAMENT DETAIL & LIVE MODAL DIALOG */}
      {activeTourneyModal && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveTourneyModal(null)}
        >
          <div
            className="glass-panel rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-700 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveTourneyModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>

            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {activeTourneyModal.status === 'live' ? (
                  <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    🔴 ถ่ายทอดสดวันนี้ (LIVE NOW)
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    <i className="fa-regular fa-clock mr-1"></i> รายการเตรียมแข่งขัน
                  </span>
                )}
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 inline-flex items-center gap-1.5">
                  {activeTourneyModal.scope === 'domestic' ? (
                    <>
                      <ThaiFlag />
                      <span>รายการในประเทศ</span>
                    </>
                  ) : (
                    <span>🌍 ระดับนานาชาติ</span>
                  )}
                </span>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  {activeTourneyModal.category === 'open' ? '🔓 โอเพ่นทั่วไป' : '🏆 ชิงแชมป์หลัก'}
                </span>
              </div>

              {/* Title & Organization */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-heading leading-snug">
                  {activeTourneyModal.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 italic mt-1">
                  {activeTourneyModal.titleEn}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-300">
                  <i className="fa-solid fa-building-columns"></i>
                  <span>ผู้จัดการแข่งขัน: <strong>{activeTourneyModal.organizer}</strong></span>
                </div>
              </div>

              {/* Full Specs & Schedule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block">ช่วงวันเวลาแข่งขัน:</span>
                  <strong className="text-white text-sm block">{activeTourneyModal.date}</strong>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">สถานที่ & ประเทศจัดการแข่งขัน:</span>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    {activeTourneyModal.country.includes('ไทย') ? (
                      <ThaiFlag />
                    ) : activeTourneyModal.country.includes('ฝรั่งเศส') ? (
                      <CountryFlag code="FR" />
                    ) : activeTourneyModal.country.includes('สิงคโปร์') ? (
                      <CountryFlag code="SG" />
                    ) : activeTourneyModal.country.includes('ยุโรป') ? (
                      <CountryFlag code="EU" />
                    ) : (
                      <span>🌍</span>
                    )}
                    <span>{activeTourneyModal.location} ({activeTourneyModal.country.replace(/\s*[🇹🇭🇫🇷🇸🇬🇪🇺]/g, '').trim()})</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">ประเภทการแข่งขัน:</span>
                  <strong className="text-sky-300 block">{activeTourneyModal.format}</strong>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">เงินรางวัล & เกียรติยศ:</span>
                  <strong className="text-amber-400 block">{activeTourneyModal.prizePool}</strong>
                </div>
                <div className="sm:col-span-2 space-y-1 border-t border-slate-800 pt-2">
                  <span className="text-slate-400 block">ลักษณะพื้นผิวสนาม:</span>
                  <span className="text-slate-200">{activeTourneyModal.surface}</span>
                </div>
              </div>

              {/* Highlights & Tournament Characteristics */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-list-check"></i> จุดเด่นและข้อมูลสำคัญประจำทัวร์นาเมนต์:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {activeTourneyModal.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>

              {/* ALL LIVE CHANNELS WITH DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>ช่องทางถ่ายทอดสดอย่างเป็นทางการ (Official Live Broadcast):</span>
                </h4>
                <div className="space-y-2.5">
                  {activeTourneyModal.liveChannels.map((c, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          {c.platform === 'facebook' && <i className="fa-brands fa-facebook text-blue-400 text-lg"></i>}
                          {c.platform === 'youtube' && <i className="fa-brands fa-youtube text-red-500 text-lg"></i>}
                          {c.platform === 'tv' && <i className="fa-solid fa-tv text-amber-400 text-sm"></i>}
                          {c.platform === 'web' && <i className="fa-solid fa-globe text-sky-400 text-sm"></i>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{c.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 font-mono">
                              {c.badge}
                            </span>
                          </div>
                          <span className="text-slate-400 block mt-0.5">{c.schedule}</span>
                        </div>
                      </div>

                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-xs tracking-wide shadow-md transition flex items-center gap-2 shrink-0 self-end sm:self-auto"
                      >
                        <span>เปิดสัญญาณสด</span>
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                      </a>
                    </div>
                  ))}
                </div>

                {activeTourneyModal.streamNotes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                    <i className="fa-solid fa-circle-info mr-1 text-sky-400"></i>
                    {activeTourneyModal.streamNotes}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTourneyModal(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL DIALOG */}
      {activeModalItem && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className={`glass-panel rounded-3xl ${
              activeModalItem.details.rulebookModule || activeModalItem.details.tournamentFormatsModule ? 'max-w-4xl' : 'max-w-2xl'
            } w-full p-6 sm:p-8 shadow-2xl relative border border-slate-700 max-h-[88vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 text-[10px] font-bold rounded-full border ${
                    activeModalItem.level === 'beginner'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : activeModalItem.level === 'intermediate'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                  }`}
                >
                  {activeModalItem.levelLabel}
                </span>
                <span className="text-xs text-slate-400">หมวดหมู่: {activeModalItem.categoryLabel}</span>
                {activeModalItem.details.rulebookModule && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/30 ml-auto flex items-center gap-1">
                    <i className="fa-solid fa-certificate text-sky-400"></i>
                    <span>Official FIPJP Delegate Module</span>
                  </span>
                )}
                {activeModalItem.details.tournamentFormatsModule && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-400/30 ml-auto flex items-center gap-1">
                    <i className="fa-solid fa-sitemap text-purple-400"></i>
                    <span>Tournament Directing Standards</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white font-heading pb-3 border-b border-slate-800">
                {activeModalItem.title}
              </h3>

              {/* High-Fidelity Instructional Diagram (ภาพประกอบเชิงเทคนิคและสรีระศาสตร์) */}
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 sm:p-4 shadow-xl">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-2 text-sky-400">
                    <i className="fa-solid fa-compass-drafting"></i>
                    <span>ภาพจำลองเทคนิคและมุมองศาวิถี (Biomechanical Vector Diagram)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">FIPJP Standard</span>
                </div>
                <TechniqueIllustration id={activeModalItem.id} expanded={true} />
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <p className="leading-relaxed">{activeModalItem.details.overview}</p>

                {/* Steps */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-amber-400 flex items-center gap-2">
                    <i className="fa-solid fa-list-check"></i> ขั้นตอนการฝึกปฏิบัติ (Step-by-Step):
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                    {activeModalItem.details.steps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ul>
                </div>

                {/* Common Mistakes */}
                <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-2">
                  <h4 className="font-bold text-red-400 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation"></i> ข้อผิดพลาดที่พบบ่อย (Common Mistakes):
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                    {activeModalItem.details.commonMistakes.map((cm, idx) => (
                      <li key={idx}>{cm}</li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tips */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                    <i className="fa-solid fa-star"></i> เคล็ดลับมืออาชีพ (Pro Tips):
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                    {activeModalItem.details.proTips.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>

                {/* DEDICATED OFFICIAL FIPJP RULEBOOK EXPANDED MODULE */}
                {activeModalItem.details.rulebookModule && (
                  <div className="space-y-6 pt-4 border-t border-slate-800">
                    {/* Official Delegate Badge Header */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/50 via-slate-900 to-indigo-950/50 border border-sky-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 text-xl shadow-inner">
                          <i className="fa-solid fa-scale-balanced"></i>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 block font-mono">
                            FIPJP Technical Delegate & Senior Referee Dossier
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-white font-heading">
                            Official FIPJP Competition Rules & Regulations
                          </h4>
                          <span className="text-[11px] text-slate-400 block">
                            {activeModalItem.details.rulebookModule.officialRef}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold shrink-0">
                        ✓ FIPJP Certified
                      </span>
                    </div>

                    {/* SECTION 1: ข้อกำหนดอุปกรณ์การแข่งขันระดับอาชีพ */}
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                        <span>ข้อกำหนดอุปกรณ์การแข่งขันระดับอาชีพ (Approved Equipment Specs)</span>
                      </h4>
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/80 text-slate-300 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="p-3">รายการอุปกรณ์</th>
                              <th className="p-3">สเปกวัสดุ</th>
                              <th className="p-3">เกณฑ์มาตรฐาน FIPJP</th>
                              <th className="p-3">เกณฑ์คลาดเคลื่อน (Tolerance)</th>
                              <th className="p-3">ข้อกำหนดเพิ่มเติม / หมายเหตุผู้ตัดสิน</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-slate-300">
                            {activeModalItem.details.rulebookModule.equipmentSpecs.map((eq, i) => (
                              <tr key={i} className="hover:bg-slate-800/40 transition">
                                <td className="p-3 font-bold text-white whitespace-nowrap">{eq.item}</td>
                                <td className="p-3 text-sky-300 whitespace-nowrap">{eq.spec}</td>
                                <td className="p-3 text-amber-300 font-mono font-medium">{eq.fipjpStandard}</td>
                                <td className="p-3 text-emerald-400 font-mono">{eq.tolerance}</td>
                                <td className="p-3 text-slate-400 text-[11px] min-w-[200px]">{eq.refNotes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SECTION 2: กฎกติกาการแข่งขันเชิงลึก */}
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
                        <span>กฎกติกาการแข่งขันเชิงลึก (Official Game Mechanics & Articles)</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeModalItem.details.rulebookModule.articles.map((art, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-sky-500/40 transition flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono font-bold text-xs border border-sky-500/30">
                                  {art.article}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">FIPJP Official</span>
                              </div>
                              <h5 className="font-bold text-white text-xs sm:text-sm">{art.title}</h5>
                              <p className="text-slate-300 text-xs leading-relaxed">{art.clause}</p>
                              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-amber-300 space-y-1">
                                <div>
                                  <strong className="text-slate-200">กฎสำคัญ:</strong> {art.keyRule}
                                </div>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-rose-300">
                              <i className="fa-solid fa-gavel text-rose-400"></i>
                              <span><strong>บทลงโทษ:</strong> {art.penaltyAction}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: ระบบบทลงโทษและการแจกใบเตือน */}
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
                        <span>ระบบบทลงโทษและการแจกใบเตือน (Cards & Penalties System)</span>
                      </h4>

                      {/* Penalty Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {activeModalItem.details.rulebookModule.penalties.map((pen, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-2xl bg-slate-900/90 border ${pen.borderBg} space-y-2.5 relative overflow-hidden`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${pen.badgeBg}`}>
                                {pen.card}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">FIPJP Sanction</span>
                            </div>
                            <h5 className="font-bold text-white text-xs">{pen.nameTh}</h5>
                            <div className="space-y-1 text-xs">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">เหตุที่ทำให้ถูกลงโทษ:</span>
                              <p className="text-slate-200 text-[11px] leading-relaxed">{pen.trigger}</p>
                            </div>
                            <div className="space-y-1 text-xs border-t border-slate-800/80 pt-2">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">ผลทางกติกา:</span>
                              <p className={`${pen.textColor} text-[11px] font-semibold leading-relaxed`}>{pen.consequence}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Common Professional Fouls */}
                      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                          <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
                          <span>การฟาวล์ที่พบบ่อยในการแข่งขันระดับอาชีพ (Common Professional Fouls):</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          {activeModalItem.details.rulebookModule.commonFouls.map((foul, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <strong className="text-white text-xs">{foul.foulName}</strong>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                                  {foul.articleRef}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px]">{foul.description}</p>
                              <div className="text-[10px] text-amber-300 pt-1 border-t border-slate-900">
                                <strong>แนวทางผู้ตัดสิน:</strong> {foul.procedure}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: ตารางเปรียบเทียบกติการะหว่างทั่วไป VS ระดับมืออาชีพ */}
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">4</span>
                        <span>ตารางสรุปข้อแตกต่างกติการะหว่างทั่วไป VS ระดับมืออาชีพ (Comparison Table)</span>
                      </h4>
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/80 text-slate-300 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="p-3 w-1/4">รายการ / ประเด็นกติกา</th>
                              <th className="p-3 w-1/3 text-slate-400">กติกาการเล่นทั่วไป (Casual / Recreation)</th>
                              <th className="p-3 w-1/3 text-emerald-300">กติกาการแข่งขันอาชีพ FIPJP (Official Pro)</th>
                              <th className="p-3 whitespace-nowrap text-sky-400">อ้างอิงกติกา</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-slate-300">
                            {activeModalItem.details.rulebookModule.comparisonTable.map((cmp, i) => (
                              <tr key={i} className="hover:bg-slate-800/40 transition">
                                <td className="p-3 font-bold text-white">{cmp.topic}</td>
                                <td className="p-3 text-slate-400 text-[11px] leading-relaxed">{cmp.casualRule}</td>
                                <td className="p-3 text-emerald-300 text-[11px] font-semibold leading-relaxed">{cmp.proFipjpRule}</td>
                                <td className="p-3 text-sky-400 font-mono text-[10px] whitespace-nowrap">{cmp.articleRef}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* DEDICATED TOURNAMENT FORMATS EXPANDED MODULE (ระบบการแข่งขันหลัก) */}
                {activeModalItem.details.tournamentFormatsModule && (
                  <div className="space-y-6 pt-4 border-t border-slate-800">
                    {/* Module Header Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-sky-950/50 border border-purple-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 shrink-0 text-xl shadow-inner">
                          <i className="fa-solid fa-sitemap"></i>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 block font-mono">
                            Tournament Directing & Match Format Standards
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-white font-heading">
                            ระบบการแข่งขันหลัก (Main Competition Formats)
                          </h4>
                          <span className="text-[11px] text-slate-400 block">
                            {activeModalItem.details.tournamentFormatsModule.titleEn}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold shrink-0">
                        ✓ FIPJP Approved
                      </span>
                    </div>

                    {/* SECTION 1: วัตถุประสงค์การเรียนรู้ (Learning Objectives) */}
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                        <span>วัตถุประสงค์การเรียนรู้ (Learning Objectives)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeModalItem.details.tournamentFormatsModule.learningObjectives.map((obj, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300 hover:border-slate-700 transition"
                          >
                            <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 2: เนื้อหาบทเรียน (ทฤษฎีและคำนิยาม 3 ระบบ) */}
                    <div className="space-y-4">
                      <h4 className="text-xs sm:text-sm font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
                        <span>เนื้อหาบทเรียน: ทฤษฎีและกลไกของ 3 ระบบการแข่งขันหลัก</span>
                      </h4>

                      <div className="space-y-4">
                        {activeModalItem.details.tournamentFormatsModule.formats.map((fmt) => (
                          <div
                            key={fmt.id}
                            className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 hover:border-slate-700 transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                              <div>
                                <h5 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                                  <span>{fmt.name}</span>
                                </h5>
                                <span className="text-[11px] text-slate-400 italic block">{fmt.nameEn}</span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border self-start sm:self-auto ${fmt.badgeColor}`}>
                                {fmt.id.toUpperCase()}
                              </span>
                            </div>

                            {/* Definition */}
                            <p className="text-xs text-slate-300 leading-relaxed">{fmt.definition}</p>

                            {/* Formula Box for Round Robin */}
                            {fmt.matchFormula && (
                              <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-1 text-xs">
                                <div className="text-sky-300 font-mono font-bold flex items-center gap-1.5">
                                  <i className="fa-solid fa-calculator text-sky-400"></i>
                                  <span>สูตรคำนวณจำนวนนัด: {fmt.matchFormula}</span>
                                </div>
                                <p className="text-slate-300 text-[11px]">{fmt.matchCalculationExample}</p>
                              </div>
                            )}

                            {/* Pairing Principle for Swiss */}
                            {fmt.pairingPrinciple && (
                              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1 text-xs">
                                <div className="text-purple-300 font-mono font-bold flex items-center gap-1.5">
                                  <i className="fa-solid fa-code-branch text-purple-400"></i>
                                  <span>หลักการประกบคู่ (Pairing Logic):</span>
                                </div>
                                <p className="text-slate-300 text-[11px] leading-relaxed">{fmt.pairingPrinciple}</p>
                              </div>
                            )}

                            {/* Flow Steps for Poule System */}
                            {fmt.flowSteps && (
                              <div className="space-y-2 pt-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                                  ขั้นตอนการแข่งขันสายละ 4 ทีม (Poule Match Flow):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {fmt.flowSteps.map((st, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 flex flex-col justify-between"
                                    >
                                      <div>
                                        <strong className="text-amber-300 block text-xs">{st.stepName}</strong>
                                        <p className="text-slate-400 text-[11px] mt-0.5">{st.description}</p>
                                      </div>
                                      <div className="pt-1.5 border-t border-slate-900 text-[11px] text-emerald-400 font-semibold">
                                        ⚡ {st.outcome}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Example Table for Round Robin */}
                            {fmt.exampleTable && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block">
                                  ตัวอย่างตารางประกบคู่สาย 4 ทีม (A, B, C, D):
                                </span>
                                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                                  <table className="w-full text-left text-xs">
                                    <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                                      <tr>
                                        <th className="p-2.5">รอบ</th>
                                        <th className="p-2.5">คู่แข่งขัน</th>
                                        <th className="p-2.5">การจัดสรรสนาม / หมายเหตุ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/80 text-[11px]">
                                      {fmt.exampleTable.map((ex, exIdx) => (
                                        <tr key={exIdx} className="hover:bg-slate-900/50">
                                          <td className="p-2.5 font-bold text-white whitespace-nowrap">{ex.round}</td>
                                          <td className="p-2.5 text-sky-300">{ex.matches}</td>
                                          <td className="p-2.5 text-slate-400">{ex.note}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Pros & Cons Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                              <div className="p-3 rounded-xl bg-emerald-950/15 border border-emerald-900/30 space-y-1">
                                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                                  <i className="fa-solid fa-thumbs-up"></i> ข้อดี (Advantages):
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                                  {fmt.pros.map((p, pIdx) => (
                                    <li key={pIdx}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-3 rounded-xl bg-red-950/15 border border-red-900/30 space-y-1">
                                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                                  <i className="fa-solid fa-triangle-exclamation"></i> ข้อจำกัด (Limitations):
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                                  {fmt.cons.map((c, cIdx) => (
                                    <li key={cIdx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: ตารางเปรียบเทียบ 3 ระบบ (Comparison Table) */}
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
                        <span>ตารางเปรียบเทียบ 3 ระบบการแข่งขัน (Comprehensive Comparison)</span>
                      </h4>
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/80 text-slate-300 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="p-3">ระบบการแข่งขัน</th>
                              <th className="p-3">จำนวนทีมที่เหมาะสม</th>
                              <th className="p-3">เวลา & สนามที่ใช้</th>
                              <th className="p-3">ความเที่ยงตรงในการวัดผล</th>
                              <th className="p-3">ข้อจำกัดหลัก</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-slate-300">
                            {activeModalItem.details.tournamentFormatsModule.comparisonTable.map((cmp, i) => (
                              <tr key={i} className="hover:bg-slate-800/40 transition">
                                <td className="p-3 font-bold text-white whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border block w-fit mb-1 ${cmp.badgeClass}`}>
                                    {cmp.formatName}
                                  </span>
                                </td>
                                <td className="p-3 text-sky-300 font-semibold">{cmp.suitableTeams}</td>
                                <td className="p-3 text-amber-300">{cmp.timeRequired}</td>
                                <td className="p-3 text-emerald-300 font-medium">{cmp.accuracy}</td>
                                <td className="p-3 text-slate-400 text-[11px] min-w-[200px]">{cmp.limitations}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SECTION 4: กรณีศึกษาตัวอย่าง (Case Studies) */}
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-mono font-bold">4</span>
                        <span>กรณีศึกษาตัวอย่าง (Case Study): การเลือกใช้ระบบให้เหมาะสม</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeModalItem.details.tournamentFormatsModule.caseStudies.map((cs, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-white text-xs sm:text-sm">{cs.context}</h5>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                                {cs.badge}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                              <strong className="text-slate-200">สถานการณ์:</strong> {cs.scenario}
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300">
                              <strong>ระบบแนะนำ:</strong> {cs.recommendedFormat}
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{cs.rationale}</p>
                            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                              <strong className="text-amber-400 block text-[10px] uppercase">ข้อแนะนำเชิงปฏิบัติ:</strong>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[10px]">
                                {cs.practicalTips.map((tip, tIdx) => (
                                  <li key={tIdx}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 5: คำศัพท์สำคัญ (Glossary) */}
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono font-bold">5</span>
                        <span>คำศัพท์สำคัญในการจัดการแข่งขัน (Competition Glossary)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeModalItem.details.tournamentFormatsModule.glossary.map((glo, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <strong className="text-white font-mono text-xs text-indigo-300">{glo.term}</strong>
                              <span className="text-[10px] text-amber-300 font-semibold">{glo.thaiMeaning}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{glo.contextUsage}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRILL DETAIL MODAL DIALOG WITH CUSTOM VIDEO LINK INPUT */}
      {activeDrillModal && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveDrillModal(null)}
        >
          <div
            className="glass-panel rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-700 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveDrillModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              aria-label="Close drill modal"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>

            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    activeDrillModal.difficulty === 'beginner'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : activeDrillModal.difficulty === 'intermediate'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : activeDrillModal.difficulty === 'advanced'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {activeDrillModal.difficultyLabel}
                </span>
                <span className="text-xs text-slate-400">หมวดหมู่: {activeDrillModal.categoryLabel}</span>
                <span className="text-xs text-amber-400 font-mono ml-auto">
                  <i className="fa-solid fa-clock mr-1"></i>
                  {activeDrillModal.duration} • เป้าหมาย {activeDrillModal.targetRepetitions}
                </span>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                  {activeDrillModal.title}
                </h3>
                <p className="text-xs text-slate-400 italic mt-0.5">{activeDrillModal.titleEn}</p>
              </div>

              {/* Objective & Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <i className="fa-solid fa-bullseye"></i> วัตถุประสงค์ (Objective):
                  </span>
                  <p className="text-slate-300 leading-relaxed">{activeDrillModal.objective}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="font-bold text-sky-400 flex items-center gap-1.5">
                    <i className="fa-solid fa-compass-drafting"></i> การจัดสนาม (Setup):
                  </span>
                  <p className="text-slate-300 leading-relaxed">{activeDrillModal.setup}</p>
                </div>
              </div>

              {/* TACTICAL DEFENSIVE VISUAL SETUP & BLIND SPOT DIAGRAM */}
              {activeDrillModal.visualSetup && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/40 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                        <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                          TACTICAL BLIND SPOT SETUP
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          ผังจำลองการจัดสนามและโซนมุมอับสายตา (Visual Setup Diagram)
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 font-bold">
                      Defensive Mastery
                    </span>
                  </div>

                  {/* Interactive SVG Court Visualizer Diagram */}
                  <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 600 220" role="img" aria-label="ผังจำลองการจัดวางสนามเปตองและโซนมุมอับ">
                      <defs>
                        <radialGradient id="blindSpotAura" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                          <stop offset="60%" stopColor="#10b981" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="lobPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                          <stop offset="50%" stopColor="#ec4899" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                        </linearGradient>
                        <marker id="arrowLob" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
                        </marker>
                      </defs>

                      {/* Terrain Grid Background */}
                      <rect x="10" y="10" width="580" height="200" rx="12" fill="#1c1917" stroke="#334155" strokeWidth="1" />
                      <line x1="10" y1="110" x2="590" y2="110" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />

                      {/* Distance labels */}
                      <text x="30" y="30" fill="#94a3b8" fontSize="10" fontFamily="monospace">0m (จุดโยน)</text>
                      <text x="360" y="30" fill="#94a3b8" fontSize="10" fontFamily="monospace">7.4m</text>
                      <text x="440" y="30" fill="#94a3b8" fontSize="10" fontFamily="monospace">8.0m (แก่น)</text>
                      <text x="530" y="30" fill="#94a3b8" fontSize="10" fontFamily="monospace">15.0m</text>

                      {/* Throwing Circle */}
                      <circle cx="50" cy="110" r="24" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                      <text x="50" y="113" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">THROW</text>

                      {/* Opponent Blocked Vision Cone (Line of Sight Obstructed) */}
                      <polygon points="50,110 370,80 370,140" fill="#f43f5e" fillOpacity="0.08" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="210" y="100" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">แนวเล็งยิงถูกบล็อก (Blocked Line)</text>

                      {/* Opponent Guard Boule */}
                      <circle cx="370" cy="110" r="14" fill="#64748b" stroke="#f43f5e" strokeWidth="2.5" />
                      <text x="370" y="114" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">B1</text>
                      <text x="370" y="138" fill="#f43f5e" fontSize="8" fontWeight="bold" textAnchor="middle">ลูกบล็อกคู่แข่ง</text>

                      {/* Jack Cochonnet */}
                      <circle cx="440" cy="110" r="7" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="440" y="130" fill="#f97316" fontSize="9" fontWeight="bold" textAnchor="middle">แก่น (Jack)</text>

                      {/* Target Blind Spot Pocket */}
                      <circle cx="430" cy="80" r="28" fill="url(#blindSpotAura)" />
                      <circle cx="430" cy="80" r="18" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
                      <circle cx="430" cy="80" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                      <text x="430" y="83" fill="#022c22" fontSize="8" fontWeight="bold" textAnchor="middle">A1</text>
                      <text x="430" y="55" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">★ หลุมมุมอับ (Blind Spot)</text>

                      {/* Curved Lob Trajectory into Blind Spot */}
                      <path d="M 50,110 Q 240,15 430,78" fill="none" stroke="url(#lobPathGrad)" strokeWidth="2.5" strokeDasharray="5 3" markerEnd="url(#arrowLob)" />
                    </svg>
                  </div>

                  {/* Tactical Specs & Principles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <span className="font-bold text-amber-400 block">พิกัดทางกายภาพ:</span>
                      <p className="text-slate-300">📏 {activeDrillModal.visualSetup.courtDimensions}</p>
                      <p className="text-slate-300">🎯 {activeDrillModal.visualSetup.jackDistance}</p>
                      <p className="text-rose-300">🛡️ {activeDrillModal.visualSetup.opponentObstacle}</p>
                      <p className="text-emerald-300 font-bold">✨ {activeDrillModal.visualSetup.targetBlindSpot}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <span className="font-bold text-purple-400 block">กฎเหล็กทางยุทธวิธี (Tactical Principle):</span>
                      <p className="text-slate-200 italic leading-relaxed">
                        "{activeDrillModal.visualSetup.tacticalPrinciple}"
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-300 pt-1">
                        {activeDrillModal.visualSetup.bulletNotes.map((note, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <i className="fa-solid fa-check text-emerald-400 text-[10px] mt-0.5" aria-hidden="true"></i>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Step by Step */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs sm:text-sm">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-list-ol text-emerald-400"></i>
                  <span>ขั้นตอนการฝึกปฏิบัติทีละขั้นตอน (Step-by-Step Drill):</span>
                </h4>
                <ol className="space-y-2 list-decimal list-inside text-slate-300">
                  {activeDrillModal.steps.map((st, i) => (
                    <li key={i} className="leading-relaxed pl-1">{st}</li>
                  ))}
                </ol>
              </div>

              {/* Scoring Benchmarks: Bronze, Silver, Gold */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <i className="fa-solid fa-medal"></i>
                  <span>เกณฑ์การประเมินผลคะแนน (Scoring Benchmarks):</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 space-y-1">
                    <span className="font-bold text-amber-500 block">🥉 ระดับทองแดง (Bronze)</span>
                    <p className="text-slate-300 text-[11px]">{activeDrillModal.scoringBenchmark.bronze}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <span className="font-bold text-slate-300 block">🥈 ระดับเงิน (Silver)</span>
                    <p className="text-slate-300 text-[11px]">{activeDrillModal.scoringBenchmark.silver}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <span className="font-bold text-amber-300 block">🥇 ระดับทอง (Gold - มาตรฐานแข่ง)</span>
                    <p className="text-slate-300 text-[11px]">{activeDrillModal.scoringBenchmark.gold}</p>
                  </div>
                </div>
              </div>

              {/* Coaching Pro Tips */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2 text-xs">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                  <i className="fa-solid fa-star"></i> เคล็ดลับจากผู้ฝึกสอน (Coaching Pro Tips):
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                  {activeDrillModal.coachingTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>

              {/* CUSTOM TRAINING VIDEO URL MANAGEMENT */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <i className="fa-solid fa-video text-rose-400"></i>
                    <span>วิดีโอฝึกซ้อมของฉัน (Custom Training Video URL):</span>
                  </h4>
                  {customDrillVideos[activeDrillModal.id] && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      ✓ บันทึกในเบราว์เซอร์แล้ว
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  คุณสามารถวางลิงก์วิดีโอคลิปฝึกซ้อมของตนเอง (เช่น YouTube Unlisted, Google Drive, Facebook Video) เพื่อให้สามารถคลิกกลับมาเปิดดูเพื่อทบทวนท่าทางและจังหวะของตนเองได้ตลอดเวลา
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="วางลิงก์ URL เช่น https://youtube.com/watch?v=..."
                    defaultValue={customDrillVideos[activeDrillModal.id] || ''}
                    id={`modal-video-input-${activeDrillModal.id}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        `modal-video-input-${activeDrillModal.id}`
                      ) as HTMLInputElement;
                      if (input) {
                        handleSaveDrillVideo(activeDrillModal.id, input.value);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>บันทึก URL วิดีโอ</span>
                  </button>
                </div>

                {customDrillVideos[activeDrillModal.id] && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <a
                      href={customDrillVideos[activeDrillModal.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-2 truncate font-mono text-xs"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>เปิดดูวิดีโอ: {customDrillVideos[activeDrillModal.id]}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleSaveDrillVideo(activeDrillModal.id, '')}
                      className="text-slate-500 hover:text-red-400 text-xs px-2 py-1"
                      title="ลบ URL นี้"
                    >
                      ลบลิงก์
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    activeDrillModal.videoDemo.videoQuery
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1.5 order-2 sm:order-1"
                >
                  <i className="fa-brands fa-youtube text-red-500 text-sm"></i>
                  <span>ค้นหาวิดีโอสาธิตทักษะนี้บน YouTube</span>
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveDrillClick(activeDrillModal);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <i className="fa-solid fa-bookmark"></i>
                    <span>💾 บันทึกผลการฝึกซ้อมนี้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDrillModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACKSPIN PHYSICS MODAL DIALOG (สูตรและการคำนวณฟิสิกส์สกรูแบค) */}
      {showBackspinPhysicsModal && (() => {
        const backspinData = calculateBackspinPhysics(
          TRAJECTORY_PRESETS[activeTrajMode].spinType,
          selectedTerrain,
          specs.weight,
          specs.diameter
        );

        return (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowBackspinPhysicsModal(false)}
          >
            <div
              className="glass-panel rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative border border-purple-500/40 max-h-[88vh] overflow-y-auto space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowBackspinPhysicsModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
                aria-label="Close physics modal"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl border border-purple-400/40">
                  <i className="fa-solid fa-atom"></i>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 block">
                    Advanced Petanque Mechanics
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                    ฟิสิกส์การตีลูกเปตองแบบ &quot;สกรูแบค&quot; (Backspin Shot Physics)
                  </h3>
                </div>
              </div>

              {/* Real-time Current Physics Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">ความเร็วเชิงมุม (ω₀)</span>
                  <span className="text-xl font-black text-purple-300 font-heading">
                    {backspinData.omega0.toFixed(1)} rad/s
                  </span>
                  <span className="text-[11px] text-purple-400 block font-mono">{backspinData.rpm} RPM</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">การดลสัมผัส (Jn)</span>
                  <span className="text-xl font-black text-sky-300 font-heading">
                    {backspinData.normalImpulse.toFixed(2)} N·s
                  </span>
                  <span className="text-[11px] text-slate-400 block">แรงสะท้อนแนวดิ่ง</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">ความเร็วสัมผัส (vc)</span>
                  <span className={`text-xl font-black font-heading ${backspinData.isReverseRoll ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {backspinData.contactVelocity.toFixed(2)} m/s
                  </span>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {backspinData.isReverseRoll ? 'ไถลกลับหลัง (Back-slip)' : 'ไถลไปข้างหน้า'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/40 text-center">
                  <span className="text-[10px] text-purple-300 uppercase font-mono block">ระยะถอยหลัง (Retro d)</span>
                  <span className="text-2xl font-black text-amber-400 font-heading">
                    {backspinData.isReverseRoll ? `-${backspinData.retroDistanceCm} ซม.` : '0 ซม.'}
                  </span>
                  <span className="text-[11px] text-slate-300 block font-mono">
                    {backspinData.isReverseRoll ? 'ดูดถอยหลังสำเร็จ' : 'หยุดสั้น'}
                  </span>
                </div>
              </div>

              {/* Explanatory Steps with Mathematical Formulas */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-200">
                {/* Step 1: Angular Velocity */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                    <span>แรงหมุนถอยหลัง (Angular Velocity & Wrist Snap):</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    ขณะปล่อยลูกเปตอง ผู้เล่นจะกระดกข้อมือและรูดปลายนิ้วขึ้นทางด้านหลัง สร้างแรงบิด (Torque: τ) ทำให้ลูกหมุนถอยหลังกลางอากาศ
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-sky-300 border border-slate-800 space-y-1">
                    <div>สูตรความเร็วเชิงมุม: <strong>ω₀ = β × (v₀ / R)</strong></div>
                    <div>ความถี่การหมุน (RPM): <strong>RPM = (ω₀ × 60) / (2π)</strong></div>
                    <div className="text-slate-400 text-[11px] pt-1">
                      *โดย β คือสัมประสิทธิ์การสะบัดข้อมือ (0.35 = กลิ้งเรียบ, 2.65 = โยนโด่ง Plombée, 3.8 = ตีติด Carreau)
                    </div>
                  </div>
                </div>

                {/* Step 2: Collision & Momentum Transfer */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-sky-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
                    <span>การถ่ายโอนพลังงานขณะปะทะพื้นหรือลูกเป้า (Collision & Momentum Transfer):</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    เมื่อลูกกระทบพื้นหรือกระทบลูกคู่แข่ง (Carreau) การดลแนวดิ่ง <strong>J_n</strong> จะดูดซับโมเมนตัมแนวราบ และความเร็วสัมผัสที่จุดต่ำสุดของลูกคือ:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-sky-300 border border-slate-800 space-y-1">
                    <div>การดลแรงกระแทก: <strong>J_n = m × (1 + e) × v_y1</strong></div>
                    <div>ความเร็วสัมผัสจุดต่ำสุด: <strong>v_contact = v_x1 - (ω × R)</strong></div>
                    <div className="text-slate-400 text-[11px] pt-1">
                      *หาก <strong>(ω × R) &gt; v_x1</strong> ค่า <strong>v_contact</strong> จะติดลบ หมายความว่าผิวสัมผัสหมุนถอยหลังเร็วกว่าความเร็วพุ่งไปข้างหน้า!
                    </div>
                  </div>
                </div>

                {/* Step 3: Ground Friction & Retro Distance */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
                    <span>แรงเสียดทานและการหมุนย้อนกลับ (Ground Friction & Retro Distance):</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    เมื่อ <strong>v_contact &lt; 0</strong> แรงเสียดทานจลน์จากพื้นดิน <strong>F_f = μ_k × N</strong> จะออกแรงผลักลูกไปทางด้านหลัง ฉุดให้ความเร็วเชิงเส้นกลับทิศ และกลิ้งถอยหลัง (Retro Roll):
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 space-y-1">
                    <div>ความเร็วถอยหลังเริ่มต้น: <strong>v_r = |v_contact| × μ_k × C_damping</strong></div>
                    <div>ระยะทางถอยหลัง (Retro Distance): <strong>d_retro = (v_r)² / (2 × μ_r × g)</strong></div>
                    <div className="text-slate-400 text-[11px] pt-1">
                      *สนามดินแข็ง μ_k = 0.28 ส่งผลให้เกิดการกลิ้งถอยหลังไกลที่สุด (30-80 ซม.) ส่วนสนามทรายจะซับแรงหมุนแทบทันที
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowBackspinPhysicsModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                >
                  ปิดหน้าต่างการวิเคราะห์
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* AUTHENTICATION & LOGIN MODAL (Google, Facebook, LINE & Guest) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingSpecToSave(null);
          setPendingDrillToSave(null);
        }}
        reason={authModalReason}
        pendingSpec={pendingSpecToSave}
        pendingDrill={pendingDrillToSave}
        onLoginSuccess={handleLoginSuccess}
        onSaveAsGuest={handleSaveAsGuest}
      />

      {/* USER PROFILE & SAVED DATA MODAL */}
      <UserProfileModal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        user={userAccount}
        onLogout={handleLogout}
        onOpenLogin={() => {
          setUserProfileModalOpen(false);
          setAuthModalReason('general_login');
          setAuthModalOpen(true);
        }}
        onLoadSpec={handleLoadSpec}
        onDeleteSpec={handleDeleteSpec}
        onDeleteDrill={handleDeleteDrill}
      />

      {/* DRILL LIVE PRACTICE COCKPIT & VIDEO MODAL */}
      {activePracticeDrill && (
        <DrillPracticeModal
          drill={activePracticeDrill}
          isOpen={Boolean(activePracticeDrill)}
          onClose={() => setActivePracticeDrill(null)}
          onSaveSession={(result: SavedDrillResult) => {
            setDrillPracticeCounts((prev) => ({
              ...prev,
              [result.drillId]: Math.max(prev[result.drillId] || 0, result.reps),
            }));

            if (userAccount.isGuest) {
              setPendingDrillToSave(result);
              setAuthModalReason('save_drill');
              setAuthModalOpen(true);
            } else {
              saveDrillToAccount(result, userAccount);
            }
            setActivePracticeDrill(null);
          }}
        />
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center justify-between gap-3"
          style={{
            backgroundColor:
              toastMessage.type === 'success'
                ? '#059669'
                : toastMessage.type === 'warn'
                ? '#d97706'
                : '#0284c7',
            borderColor: 'rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
          }}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <i
              className={
                toastMessage.type === 'success'
                  ? 'fa-solid fa-circle-check text-base'
                  : toastMessage.type === 'warn'
                  ? 'fa-solid fa-triangle-exclamation text-base'
                  : 'fa-solid fa-circle-info text-base'
              }
            ></i>
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition text-xs shrink-0"
            aria-label="Close notification"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </aside>
      )}
    </div>
  );
}

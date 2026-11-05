import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface BoardItem {
  id: string;
  type: 'jack' | 'teamA' | 'teamB';
  number?: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  isHolding?: boolean;
  distanceToJackCm?: number;
}

export interface TacticalFrame {
  id: string;
  stepNumber: number;
  title: string;
  actionType: 'point' | 'shoot' | 'push_jack' | 'setup';
  team: 'teamA' | 'teamB' | 'neutral';
  items: BoardItem[];
  note: string;
  holdingTeam: 'teamA' | 'teamB' | 'none';
  holdingPoints: number;
  movedBallId?: string;
  fromPos?: { x: number; y: number };
  toPos?: { x: number; y: number };
}

export interface PresetScenario {
  id: string;
  title: string;
  difficulty: 'ง่าย' | 'ปานกลาง' | 'ท้าทายระดับโปร';
  description: string;
  items: BoardItem[];
  frames: TacticalFrame[];
  expertAdvice: {
    situation: string;
    recommendedShot: 'point' | 'shoot' | 'push_jack';
    primaryReason: string;
    riskLevel: 'ต่ำ (Low)' | 'ปานกลาง (Medium)' | 'สูง (High)';
    alternativeOption: string;
  };
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'blocked-front',
    title: '🛡️ แก่นโดนบังหน้า (Front Guard Block)',
    difficulty: 'ปานกลาง',
    description: 'ลูกคู่แข่งวางขวางหน้าแก่นระยะ 25 ซม. ปิดมุมเข้าตรง',
    items: [
      { id: 'jack', type: 'jack', x: 62, y: 50 },
      { id: 'b1', type: 'teamB', number: 1, x: 55, y: 50 },
      { id: 'b2', type: 'teamB', number: 2, x: 66, y: 62 },
      { id: 'a1', type: 'teamA', number: 1, x: 52, y: 35 },
    ],
    frames: [
      {
        id: 'bf-1',
        stepNumber: 1,
        title: 'ช็อต 1: ทีม A วางเปิดเกม (Opening Point)',
        actionType: 'point',
        team: 'teamA',
        items: [
          { id: 'jack', type: 'jack', x: 62, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 52, y: 35 },
        ],
        note: 'ทีมเราเปิดเกมวาง A1 ตกเบี่ยงซ้ายห่างแก่น 42 ซม. เพื่อบังคับให้คู่แข่งต้องเปิดหน้าเล่น',
        holdingTeam: 'teamA',
        holdingPoints: 1,
        movedBallId: 'a1',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 52, y: 35 }
      },
      {
        id: 'bf-2',
        stepNumber: 2,
        title: 'ช็อต 2: คู่แข่งตั้งบล็อกหน้าแก่น (Front Guard)',
        actionType: 'point',
        team: 'teamB',
        items: [
          { id: 'jack', type: 'jack', x: 62, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 52, y: 35 },
          { id: 'b1', type: 'teamB', number: 1, x: 55, y: 50 },
        ],
        note: 'ทีม B ส่ง B1 วางตรงแนวหน้าแก่น 25 ซม. ชิงแต้มนำและปิดไลน์การเข้าลูกตรงๆ',
        holdingTeam: 'teamB',
        holdingPoints: 1,
        movedBallId: 'b1',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 55, y: 50 }
      },
      {
        id: 'bf-3',
        stepNumber: 3,
        title: 'ช็อต 3: คู่แข่งเสริมลูกดักหลัง (Secondary Guard)',
        actionType: 'point',
        team: 'teamB',
        items: [
          { id: 'jack', type: 'jack', x: 62, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 52, y: 35 },
          { id: 'b1', type: 'teamB', number: 1, x: 55, y: 50 },
          { id: 'b2', type: 'teamB', number: 2, x: 66, y: 62 },
        ],
        note: 'ทีม B วาง B2 ดักแนวขวาหลังแก่น 34 ซม. เตรียมรับลูกสะกิด',
        holdingTeam: 'teamB',
        holdingPoints: 1,
        movedBallId: 'b2',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 66, y: 62 }
      },
      {
        id: 'bf-4',
        stepNumber: 4,
        title: 'ช็อต 4: ทีม A ยิงสกัดเปิดทาง (Tir au fer Clear)',
        actionType: 'shoot',
        team: 'teamA',
        items: [
          { id: 'jack', type: 'jack', x: 62, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 52, y: 35 },
          { id: 'b1', type: 'teamB', number: 1, x: 42, y: 78 }, // knocked away
          { id: 'b2', type: 'teamB', number: 2, x: 66, y: 62 },
          { id: 'a2', type: 'teamA', number: 2, x: 58, y: 51 }, // landed near
        ],
        note: 'มือยิงทีม A ตัดสินใจยิงตรงกลางลูก B1 หลุดออกข้าง สนามเปิดโล่ง ลูก A2 นิ่งเกาะแก่นกิน 2 แต้ม!',
        holdingTeam: 'teamA',
        holdingPoints: 2,
        movedBallId: 'a2',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 58, y: 51 }
      }
    ],
    expertAdvice: {
      situation: 'ลูกทีมตรงข้ามตั้งบล็อกตรงแนวแก่น หากพยายามวางเข้าตรงเสี่ยงดันลูกเขาชิดแก่นยิ่งกว่าเดิม',
      recommendedShot: 'shoot',
      primaryReason: 'ยิงเก็บลูกหน้า (Tir au fer) เพื่อเปิดทางเดินแก่น หากตีโดนจะเคลียร์พื้นที่และมีสิทธิ์เก็บ 2-3 แต้ม',
      riskLevel: 'ปานกลาง (Medium)',
      alternativeOption: 'เข้าลูกแบบสปินโค้งอ้อม (High Lob Hook) ตกหลังลูกบล็อกระยะ 15 ซม.'
    }
  },
  {
    id: 'carreau-or-loss',
    title: '⚡ Carreau ตัดสินแต้ม (Match Point Pressure)',
    difficulty: 'ท้าทายระดับโปร',
    description: 'คู่แข่งเข้าติดแก่น 8 ซม. ถ้าไม่ยิงติดจะเสียเปรียบเกม',
    items: [
      { id: 'jack', type: 'jack', x: 68, y: 48 },
      { id: 'b1', type: 'teamB', number: 1, x: 66, y: 47 },
      { id: 'b2', type: 'teamB', number: 2, x: 74, y: 54 },
      { id: 'a1', type: 'teamA', number: 1, x: 58, y: 60 },
    ],
    frames: [
      {
        id: 'col-1',
        stepNumber: 1,
        title: 'ช็อต 1: วางเปิดห่าง (Team A Point)',
        actionType: 'point',
        team: 'teamA',
        items: [
          { id: 'jack', type: 'jack', x: 68, y: 48 },
          { id: 'a1', type: 'teamA', number: 1, x: 58, y: 60 },
        ],
        note: 'ลูกแรกของทีม A ตกไหลเบี่ยงขวา ระยะ 68 ซม. ไม่ชิดแก่นพอ',
        holdingTeam: 'teamA',
        holdingPoints: 1,
        movedBallId: 'a1',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 58, y: 60 }
      },
      {
        id: 'col-2',
        stepNumber: 2,
        title: 'ช็อต 2: คู่แข่งจ่อแก่น 8 ซม. (B1 Master Point)',
        actionType: 'point',
        team: 'teamB',
        items: [
          { id: 'jack', type: 'jack', x: 68, y: 48 },
          { id: 'a1', type: 'teamA', number: 1, x: 58, y: 60 },
          { id: 'b1', type: 'teamB', number: 1, x: 66, y: 47 },
        ],
        note: 'คู่แข่งวางเกาะแก่นระยะทองคำ 8 ซม. บีบให้เราต้องยิงสถานเดียว',
        holdingTeam: 'teamB',
        holdingPoints: 1,
        movedBallId: 'b1',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 66, y: 47 }
      },
      {
        id: 'col-3',
        stepNumber: 3,
        title: 'ช็อต 3: คู่แข่งวางดักเพิ่มแต้ม (B2 Consolidation)',
        actionType: 'point',
        team: 'teamB',
        items: [
          { id: 'jack', type: 'jack', x: 68, y: 48 },
          { id: 'a1', type: 'teamA', number: 1, x: 58, y: 60 },
          { id: 'b1', type: 'teamB', number: 1, x: 66, y: 47 },
          { id: 'b2', type: 'teamB', number: 2, x: 74, y: 54 },
        ],
        note: 'คู่แข่งวางลูกหนุน B2 หลังแก่น 38 ซม. สร้างแรงกดดันเพิ่ม',
        holdingTeam: 'teamB',
        holdingPoints: 2,
        movedBallId: 'b2',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 74, y: 54 }
      },
      {
        id: 'col-4',
        stepNumber: 4,
        title: 'ช็อต 4: ยิงเปลี่ยนสมบูรณ์แบบ (Perfect Carreau A2)',
        actionType: 'shoot',
        team: 'teamA',
        items: [
          { id: 'jack', type: 'jack', x: 68, y: 48 },
          { id: 'a1', type: 'teamA', number: 1, x: 58, y: 60 },
          { id: 'b1', type: 'teamB', number: 1, x: 88, y: 22 }, // knocked out
          { id: 'b2', type: 'teamB', number: 2, x: 74, y: 54 },
          { id: 'a2', type: 'teamA', number: 2, x: 66, y: 47 }, // Carreau in place of b1!
        ],
        note: 'ช็อตชี้ขาด: มือยิงทีมเราส่ง Tir au Fer กระทบเต็มใบ B1 กระเด็นออก ลูก A2 หยุดนิ่งแทนที่ (Carreau) พลิกเป็นฝ่ายได้ 2 แต้ม!',
        holdingTeam: 'teamA',
        holdingPoints: 2,
        movedBallId: 'a2',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 66, y: 47 }
      }
    ],
    expertAdvice: {
      situation: 'คู่แข่งได้แต้มชิดแก่นมาก การเข้าลูกสู้แทบเป็นไปไม่ได้ที่จะได้แต้มที่ดีกว่า',
      recommendedShot: 'shoot',
      primaryReason: 'ต้องตัดสินใจยิง (Direct Hit / Carreau) เท่านั้น หากตีติดตัวเดิมจะพลิกเป็นฝ่ายได้ 2 แต้มทันที',
      riskLevel: 'สูง (High)',
      alternativeOption: 'หากมือยิงฟอร์มไม่ดี ให้เข้าลูกตัดทางหลังแก่นเพื่อจำกัดความเสียหายไม่ให้เกิน 1 แต้ม'
    }
  },
  {
    id: 'deep-pressure',
    title: '🎯 บีบเกมระยะไกล 9.5 เมตร (Deep Ground)',
    difficulty: 'ท้าทายระดับโปร',
    description: 'แก่นอยู่ลึกใกล้เส้นขอบตาย การวางต้องแม่น Donnée สูง',
    items: [
      { id: 'jack', type: 'jack', x: 84, y: 50 },
      { id: 'a1', type: 'teamA', number: 1, x: 79, y: 44 },
      { id: 'b1', type: 'teamB', number: 1, x: 80, y: 58 },
      { id: 'b2', type: 'teamB', number: 2, x: 88, y: 42 },
    ],
    frames: [
      {
        id: 'dp-1',
        stepNumber: 1,
        title: 'ช็อต 1: โยนแก่นลึก 9.5 เมตร',
        actionType: 'setup',
        team: 'neutral',
        items: [
          { id: 'jack', type: 'jack', x: 84, y: 50 },
        ],
        note: 'โยนแก่นไปท้ายสนาม 9.5 เมตร ห่างเส้นตายเพียง 1.5 เมตร เพื่อกดดันสมาธิมือเข้า',
        holdingTeam: 'none',
        holdingPoints: 0,
        movedBallId: 'jack',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 84, y: 50 }
      },
      {
        id: 'dp-2',
        stepNumber: 2,
        title: 'ช็อต 2: วางหน้าแก่นดักทาง (Team A Point)',
        actionType: 'point',
        team: 'teamA',
        items: [
          { id: 'jack', type: 'jack', x: 84, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 79, y: 44 },
        ],
        note: 'เข้าลูก Half-lob ตกหน้าแก่น 60 ซม. ไหลเกาะสวยงาม ถือ 1 แต้ม',
        holdingTeam: 'teamA',
        holdingPoints: 1,
        movedBallId: 'a1',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 79, y: 44 }
      },
      {
        id: 'dp-3',
        stepNumber: 3,
        title: 'ช็อต 3: คู่แข่งเข้าสู้แต่หลุดไลน์ (Team B Over-roll)',
        actionType: 'point',
        team: 'teamB',
        items: [
          { id: 'jack', type: 'jack', x: 84, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 79, y: 44 },
          { id: 'b1', type: 'teamB', number: 1, x: 80, y: 58 },
        ],
        note: 'ทีม B เร่งแรงลูกหลุดเบี่ยงขวา 75 ซม. ยังเสียแต้มให้ทีม A',
        holdingTeam: 'teamA',
        holdingPoints: 1,
        movedBallId: 'b1',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 80, y: 58 }
      },
      {
        id: 'dp-4',
        stepNumber: 4,
        title: 'ช็อต 4: คู่แข่งพยายามยิงแต่ตกครูด (Team B Missed Shot)',
        actionType: 'shoot',
        team: 'teamB',
        items: [
          { id: 'jack', type: 'jack', x: 84, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 79, y: 44 },
          { id: 'b1', type: 'teamB', number: 1, x: 80, y: 58 },
          { id: 'b2', type: 'teamB', number: 2, x: 88, y: 42 },
        ],
        note: 'ทีม B เสี่ยงยิงไกลแต่ตกสั้นกระดอนข้ามไปหลังแก่น ทีมเราครองความได้เปรียบเบ็ดเสร็จ!',
        holdingTeam: 'teamA',
        holdingPoints: 1,
        movedBallId: 'b2',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 88, y: 42 }
      }
    ],
    expertAdvice: {
      situation: 'ระยะไกลมาก 9.5 ม. แรงยิงจะแกว่งง่ายกว่าระยะ 6-7 ม.',
      recommendedShot: 'point',
      primaryReason: 'เข้าลูกแบบ Half-lob ให้ตกหน้าแก่น 80 ซม. ปล่อยให้ลูกวิ่งไหลเข้าหาแก่น ความเสี่ยงน้อยกว่าการสุ่มยิงไกล',
      riskLevel: 'ต่ำ (Low)',
      alternativeOption: 'ยิงแบบตกครูดพื้น (Tir à la rafle) หากสภาพสนามเป็นดินเรียบไม่มีหินดัก'
    }
  },
  {
    id: 'jack-displacement',
    title: '💥 โอกาสตีแก่นหนี (Jack Displacement Tactical)',
    difficulty: 'ท้าทายระดับโปร',
    description: 'ลูกเราลอยอยู่ด้านหลังแก่น หากสะกิดแก่นถอยหลังจะกิน 3 แต้ม',
    items: [
      { id: 'jack', type: 'jack', x: 60, y: 50 },
      { id: 'b1', type: 'teamB', number: 1, x: 56, y: 50 },
      { id: 'a1', type: 'teamA', number: 1, x: 70, y: 46 },
      { id: 'a2', type: 'teamA', number: 2, x: 72, y: 55 },
    ],
    frames: [
      {
        id: 'jd-1',
        stepNumber: 1,
        title: 'ช็อต 1: คู่แข่งคุมหน้าแก่นแน่นหนา (B1 Tight Front)',
        actionType: 'point',
        team: 'teamB',
        items: [
          { id: 'jack', type: 'jack', x: 60, y: 50 },
          { id: 'b1', type: 'teamB', number: 1, x: 56, y: 50 },
        ],
        note: 'B1 ปิดหน้าแก่นระยะ 16 ซม. ขวางมิดทุกไลน์ตรง',
        holdingTeam: 'teamB',
        holdingPoints: 1,
        movedBallId: 'b1',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 56, y: 50 }
      },
      {
        id: 'jd-2',
        stepNumber: 2,
        title: 'ช็อต 2: ทีม A วางลูกรองรับด้านหลัง (A1 Back Guard)',
        actionType: 'point',
        team: 'teamA',
        items: [
          { id: 'jack', type: 'jack', x: 60, y: 50 },
          { id: 'b1', type: 'teamB', number: 1, x: 56, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 70, y: 46 },
        ],
        note: 'ทีมเราเจตนาวาง A1 เลยหลังแก่น 60 ซม. สร้างกับดัก',
        holdingTeam: 'teamB',
        holdingPoints: 1,
        movedBallId: 'a1',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 70, y: 46 }
      },
      {
        id: 'jd-3',
        stepNumber: 3,
        title: 'ช็อต 3: ทีม A เพิ่มลูกดักหลังตัวที่สอง (A2 Pocket)',
        actionType: 'point',
        team: 'teamA',
        items: [
          { id: 'jack', type: 'jack', x: 60, y: 50 },
          { id: 'b1', type: 'teamB', number: 1, x: 56, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 70, y: 46 },
          { id: 'a2', type: 'teamA', number: 2, x: 72, y: 55 },
        ],
        note: 'สร้างหลุมรับลูก (Boule Pocket) ด้านหลังแก่น 2 ลูก',
        holdingTeam: 'teamB',
        holdingPoints: 1,
        movedBallId: 'a2',
        fromPos: { x: 12, y: 50 },
        toPos: { x: 72, y: 55 }
      },
      {
        id: 'jd-4',
        stepNumber: 4,
        title: 'ช็อต 4: ยิงสะกิดแก่นถอยหลัง (Déplacer le But)',
        actionType: 'push_jack',
        team: 'teamA',
        items: [
          { id: 'jack', type: 'jack', x: 71, y: 50 }, // jack moved back!
          { id: 'b1', type: 'teamB', number: 1, x: 56, y: 50 },
          { id: 'a1', type: 'teamA', number: 1, x: 70, y: 46 },
          { id: 'a2', type: 'teamA', number: 2, x: 72, y: 55 },
          { id: 'a3', type: 'teamA', number: 3, x: 69, y: 51 },
        ],
        note: 'ช็อตมาสเตอร์คลาส: ยิงกระทุ้งแก่นให้ถอยเข้าหากลุ่มลูก A ด้านหลัง พลิกสถานการณ์กิน 3 แต้มรวด!',
        holdingTeam: 'teamA',
        holdingPoints: 3,
        movedBallId: 'jack',
        fromPos: { x: 60, y: 50 },
        toPos: { x: 71, y: 50 }
      }
    ],
    expertAdvice: {
      situation: 'ทีมเรามีลูกรออยู่ด้านหลัง 2 ลูก หากยิงดันแก่น (Déplacer le but) ให้เลื่อนไปข้างหลัง 40-70 ซม. จะพลิกกลับมาได้แต้มมหาศาล',
      recommendedShot: 'push_jack',
      primaryReason: 'กระทุ้งแก่นให้ถอยเข้าหาลูกทีมเราด้านหลัง เป็นเทคนิคแก้เกมชั้นสูงที่พลิกสถานการณ์จากเสียแต้มเป็นชนะ Mène',
      riskLevel: 'สูง (High)',
      alternativeOption: 'ยิงเคลียร์ลูก B1 ออกจากสนามตรงๆ'
    }
  }
];

export const TacticalBoard: React.FC = () => {
  const [items, setItems] = useState<BoardItem[]>(PRESET_SCENARIOS[0].items);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('blocked-front');
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showTrajectoryTrail, setShowTrajectoryTrail] = useState<boolean>(true);
  const [selectedTool, setSelectedTool] = useState<'move' | 'add_teamA' | 'add_teamB' | 'delete'>('move');
  const boardRef = useRef<HTMLDivElement>(null);

  // Tactical Replay State
  const [replayFrames, setReplayFrames] = useState<TacticalFrame[]>(PRESET_SCENARIOS[0].frames);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(PRESET_SCENARIOS[0].frames.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isReplayMode, setIsReplayMode] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>('');

  // Jack position
  const jack = items.find((i) => i.type === 'jack') || { x: 60, y: 50 };

  // Calculate distances in cm (scaled roughly: 100% width = 12 meters, 1% ≈ 12 cm)
  const CM_PER_PERCENT = 12.0;

  const itemsWithDistance = items.map((item) => {
    if (item.type === 'jack') return item;
    const dx = (item.x - jack.x) * CM_PER_PERCENT;
    const dy = (item.y - jack.y) * CM_PER_PERCENT * 0.75; // aspect ratio adjustment
    const distCm = Math.round(Math.sqrt(dx * dx + dy * dy));
    return {
      ...item,
      distanceToJackCm: distCm,
    };
  });

  // Determine holding points
  const boulesSorted = itemsWithDistance
    .filter((i) => i.type !== 'jack')
    .sort((a, b) => (a.distanceToJackCm || 999) - (b.distanceToJackCm || 999));

  let holdingTeam: 'teamA' | 'teamB' | 'none' = 'none';
  let holdingPointsCount = 0;
  const holdingIds = new Set<string>();

  if (boulesSorted.length > 0) {
    const closest = boulesSorted[0];
    holdingTeam = closest.type as 'teamA' | 'teamB';
    holdingPointsCount = 1;
    holdingIds.add(closest.id);

    // Count consecutive boules from the same team that are closer than competitor's best
    for (let i = 1; i < boulesSorted.length; i++) {
      if (boulesSorted[i].type === holdingTeam) {
        holdingPointsCount++;
        holdingIds.add(boulesSorted[i].id);
      } else {
        break; // competitor's boule stops the count
      }
    }
  }

  // Active scenario advice
  const currentScenario = PRESET_SCENARIOS.find((p) => p.id === selectedPresetId);

  // Dynamic tactical recommendation engine
  const dynamicAdvice = () => {
    const closestA = boulesSorted.find((b) => b.type === 'teamA')?.distanceToJackCm ?? 999;
    const closestB = boulesSorted.find((b) => b.type === 'teamB')?.distanceToJackCm ?? 999;

    if (holdingTeam === 'teamA') {
      return {
        situation: `ทีมเรา (Team A) กำลังถือแต้มนำอยู่ ${holdingPointsCount} แต้ม (ใกล้สุด ${closestA} ซม.)`,
        recommendedShot: closestA < 35 ? 'point' : 'point',
        title: 'ยุทธวิธีคุมเกม (Consolidate Lead)',
        advice: 'ทีมเรากำลังได้แต้ม แนะนำให้เข้าลูกหนุน (Appui) หรือวางกันหลังแก่นเพื่อป้องกันการยิงดันแก่นของคู่แข่ง',
        actionLabel: 'เข้าลูกคุ้มกัน (Defensive Point)'
      };
    } else if (holdingTeam === 'teamB') {
      if (closestB < 25) {
        return {
          situation: `ทีมคู่แข่ง (Team B) จ่อแก่นระยะใกล้มาก (${closestB} ซม.) กุมความได้เปรียบ`,
          recommendedShot: 'shoot',
          title: 'ยุทธวิธีโจมตีทำลายเป้า (Direct Attack)',
          advice: `ลูกคู่แข่งอยู่ชิดแก่นต่ำกว่า 30 ซม. การเข้าสู้มีโอกาสเสียเปรียบสูง แนะนำให้ 'ยิงเปลี่ยน (Tir au fer)' เพื่อเคลียร์ลูกคู่แข่งทิ้ง`,
          actionLabel: 'ยิงเปลี่ยน (Tir au fer)'
        };
      } else {
        return {
          situation: `ทีมคู่แข่งนำอยู่ 1 แต้ม แต่ระยะห่างจากแก่นยังเปิดกว้าง (${closestB} ซม.)`,
          recommendedShot: 'point',
          title: 'ยุทธวิธีเข้าชิงแต้ม (Point to Beat)',
          advice: `ระยะ ${closestB} ซม. ยังเปิดพื้นที่กว้าง แนะนำให้ 'เข้าลูก (Pointing)' โยกลงหน้าแก่นระยะ 15-20 ซม. เพื่อชิงแต้มกลับคืนมาโดยไม่ต้องเสี่ยงยิง`,
          actionLabel: 'เข้าลูกชิงแต้ม (Point Inside)'
        };
      }
    }
    return {
      situation: 'ยังไม่มีลูกบนสนาม',
      recommendedShot: 'point',
      title: 'เปิดเกม Mène',
      advice: 'โยนลูกเปิดเกมให้ตกหน้าแก่น 30-50 ซม. อย่าให้เลยหลังแก่น',
      actionLabel: 'เข้าลูกเปิดเกม'
    };
  };

  const advice = dynamicAdvice();

  // Active replay frame info
  const activeFrame = replayFrames[currentFrameIndex];

  // Replay frame jumper
  const jumpToFrame = useCallback((index: number) => {
    if (index < 0 || index >= replayFrames.length) return;
    setCurrentFrameIndex(index);
    const targetFrame = replayFrames[index];
    if (targetFrame) {
      setItems(targetFrame.items);
    }
  }, [replayFrames]);

  // Playback timer loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      const stepDuration = 2000 / playbackSpeed;
      timer = setInterval(() => {
        setCurrentFrameIndex((prevIndex) => {
          if (prevIndex >= replayFrames.length - 1) {
            if (isLooping) {
              const nextIndex = 0;
              setItems(replayFrames[nextIndex].items);
              return nextIndex;
            } else {
              setIsPlaying(false);
              return prevIndex;
            }
          } else {
            const nextIndex = prevIndex + 1;
            setItems(replayFrames[nextIndex].items);
            return nextIndex;
          }
        });
      }, stepDuration);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, replayFrames, playbackSpeed, isLooping]);

  // Capture current state as a new replay frame
  const captureCurrentFrame = (overrideNote?: string, actionType: 'point' | 'shoot' | 'push_jack' | 'setup' = 'point') => {
    const nextStepNum = replayFrames.length + 1;
    const newFrame: TacticalFrame = {
      id: `frame-${Date.now().toString(36)}`,
      stepNumber: nextStepNum,
      title: `ช็อต ${nextStepNum}: ${overrideNote || `การเดินแต้มขั้นที่ ${nextStepNum}`}`,
      actionType,
      team: holdingTeam === 'teamA' ? 'teamA' : holdingTeam === 'teamB' ? 'teamB' : 'neutral',
      items: JSON.parse(JSON.stringify(items)),
      note: overrideNote || advice.situation,
      holdingTeam,
      holdingPoints: holdingPointsCount,
    };

    const updated = [...replayFrames, newFrame];
    setReplayFrames(updated);
    setCurrentFrameIndex(updated.length - 1);
    setCustomNote('');
  };

  // Dragging Handlers
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    if (selectedTool === 'delete') {
      if (id !== 'jack') {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
      return;
    }
    setActiveItem(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeItem || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    let xPct = ((clientX - rect.left) / rect.width) * 100;
    let yPct = ((clientY - rect.top) / rect.height) * 100;

    // Constrain to field bounds
    xPct = Math.max(5, Math.min(95, xPct));
    yPct = Math.max(10, Math.min(90, yPct));

    setItems((prev) =>
      prev.map((item) => (item.id === activeItem ? { ...item, x: xPct, y: yPct } : item))
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeItem) {
      if (isRecording) {
        // Auto-record frame on ball drop
        const droppedItem = items.find((i) => i.id === activeItem);
        const name = droppedItem?.type === 'jack' ? 'ย้ายตำแหน่งแก่น' : `ปรับตำแหน่งลูก ${activeItem}`;
        captureCurrentFrame(name, droppedItem?.type === 'jack' ? 'push_jack' : 'point');
      }
      setActiveItem(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'move' || selectedTool === 'delete') return;
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const xPct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

    const nextNum = items.filter((i) => i.type === selectedTool.replace('add_', '')).length + 1;
    if (nextNum > 6) return;

    const newItem: BoardItem = {
      id: `${selectedTool.replace('add_', '')}-${Date.now().toString(36)}`,
      type: selectedTool === 'add_teamA' ? 'teamA' : 'teamB',
      number: nextNum,
      x: xPct,
      y: yPct,
    };

    const newItems = [...items, newItem];
    setItems(newItems);

    if (isRecording) {
      const stepName = `เพิ่มลูกทีม ${newItem.type === 'teamA' ? 'A' : 'B'} เบอร์ ${newItem.number}`;
      captureCurrentFrame(stepName, 'point');
    }

    setSelectedTool('move');
  };

  const loadScenario = (preset: PresetScenario) => {
    setSelectedPresetId(preset.id);
    setItems(preset.items);
    setReplayFrames(preset.frames);
    setCurrentFrameIndex(preset.frames.length - 1);
    setIsPlaying(false);
  };

  const resetToCleanBoard = () => {
    setSelectedPresetId('custom');
    const freshItems: BoardItem[] = [
      { id: 'jack', type: 'jack', x: 65, y: 50 },
      { id: 'a1', type: 'teamA', number: 1, x: 55, y: 42 },
      { id: 'b1', type: 'teamB', number: 1, x: 58, y: 58 },
    ];
    setItems(freshItems);
    const initialFrame: TacticalFrame = {
      id: 'custom-init',
      stepNumber: 1,
      title: 'ช็อต 1: วางเปิดสนามเริ่มต้น',
      actionType: 'setup',
      team: 'neutral',
      items: freshItems,
      note: 'เริ่มต้นวางแก่นและลูกแรกทั้งสองฝ่าย',
      holdingTeam: 'teamA',
      holdingPoints: 1,
    };
    setReplayFrames([initialFrame]);
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  };

  return (
    <section
      id="tactics-board"
      aria-labelledby="tactical-heading"
      className="py-12 border-b border-slate-800/80 bg-slate-950/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Live region for WCAG Screen Readers */}
        <div aria-live="polite" className="sr-only">
          {activeFrame ? `ช็อตที่ ${activeFrame.stepNumber}: ${activeFrame.title}. ${activeFrame.note}` : advice.situation}
        </div>

        {/* Section Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
              <i className="fa-solid fa-chess-knight text-purple-400" aria-hidden="true"></i>
              <span>Interactive Tactical Board & Replay Simulator</span>
            </div>
            <h2 id="tactical-heading" className="text-2xl sm:text-4xl font-black text-white font-heading">
              กระดานแทกติก & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">Tactical Replay ย้อนดูช็อต</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              จำลองกลยุทธ์และบันทึกย้อนดูรูปแบบการแก้เกม (Tactical Replay) ทีละช็อต พร้อมเส้นทิศทางลูก (Trajectory Vectors) และระบบวิเคราะห์คำนวณแต้มแม่นยำตามกติกา FIPJP
            </p>
          </div>

          {/* Quick Scenario Selector with min 44px touch targets */}
          <nav aria-label="สถานการณ์แทกติกจำลอง" className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold hidden sm:inline">สถานการณ์:</span>
            {PRESET_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => loadScenario(scenario)}
                aria-pressed={selectedPresetId === scenario.id}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  selectedPresetId === scenario.id
                    ? 'bg-purple-600 text-white shadow-glow-purple border border-purple-400/50'
                    : 'bg-slate-900 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{scenario.title}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={resetToCleanBoard}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              title="รีเซ็ตกระดานใหม่"
              aria-label="รีเซ็ตกระดานแทกติกเป็นค่าเริ่มต้น"
            >
              <i className="fa-solid fa-rotate-right mr-1.5" aria-hidden="true"></i> รีเซ็ต
            </button>
          </nav>
        </header>

        {/* Tactical Canvas & Decision Tree Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Board Canvas & Replay Cockpit (Left 8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Toolbar above canvas (Accessible, touch-friendly min-h 44px) */}
            <div className="bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              {/* Tool Selection */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTool('move')}
                  aria-pressed={selectedTool === 'move'}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    selectedTool === 'move'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-200 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-hand-pointer" aria-hidden="true"></i>
                  <span>ลากย้าย (Move)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTool('add_teamA')}
                  aria-pressed={selectedTool === 'add_teamA'}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    selectedTool === 'add_teamA'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800/80 text-amber-300 hover:text-amber-200'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" aria-hidden="true"></span>
                  <span>+ ทีมเรา (A)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTool('add_teamB')}
                  aria-pressed={selectedTool === 'add_teamB'}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    selectedTool === 'add_teamB'
                      ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800/80 text-sky-300 hover:text-sky-200'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-sky-400 inline-block shadow-sm" aria-hidden="true"></span>
                  <span>+ คู่แข่ง (B)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTool('delete')}
                  aria-pressed={selectedTool === 'delete'}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
                    selectedTool === 'delete'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:text-rose-400'
                  }`}
                  title="คลิกที่ลูกเปตองเพื่อลบ"
                  aria-label="โหมดลบลูกเปตอง"
                >
                  <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                  <span className="hidden sm:inline">ลบลูก</span>
                </button>
              </div>

              {/* Display Overlays Toggles */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTrajectoryTrail(!showTrajectoryTrail)}
                  aria-pressed={showTrajectoryTrail}
                  aria-label="แสดงเส้นวิถีการเดินลูก Replay"
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    showTrajectoryTrail
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700'
                  }`}
                >
                  <i className="fa-solid fa-route" aria-hidden="true"></i>
                  <span className="hidden sm:inline">เส้นวิถี (Trail)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRuler(!showRuler)}
                  aria-pressed={showRuler}
                  aria-label="แสดงเส้นวัดระยะเซนติเมตร"
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    showRuler
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700'
                  }`}
                >
                  <i className="fa-solid fa-ruler" aria-hidden="true"></i>
                  <span className="hidden sm:inline">ระยะ (cm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowZones(!showZones)}
                  aria-pressed={showZones}
                  aria-label="แสดงรัศมีวงกลมระยะแก่น"
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    showZones
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700'
                  }`}
                >
                  <i className="fa-solid fa-bullseye" aria-hidden="true"></i>
                  <span className="hidden sm:inline">รัศมีแก่น</span>
                </button>
              </div>
            </div>

            {/* Tactical Field Container */}
            <div
              ref={boardRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={handleBoardClick}
              role="region"
              aria-label="ผืนสนามแทกติกเปตองแบบสัมผัสและลากวาง"
              className="relative w-full h-[440px] sm:h-[500px] rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl select-none cursor-crosshair touch-none"
              style={{
                background: 'radial-gradient(ellipse at 60% 50%, #292524 0%, #1c1917 50%, #0c0a09 100%)',
              }}
            >
              {/* Gravel & Sand Texture overlay */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(#78716c 1px, transparent 1px), radial-gradient(#d6d3d1 1px, transparent 1px)',
                  backgroundSize: '24px 24px, 12px 12px',
                  backgroundPosition: '0 0, 12px 12px',
                }}
              ></div>

              {/* FIPJP Court Boundaries (Standard 4m x 15m scale) */}
              <div className="absolute inset-4 rounded-2xl border border-dashed border-slate-600/70 pointer-events-none">
                <div className="absolute top-2 left-6 text-[10px] font-mono text-slate-400">
                  ◀ วงกลมยืนโยน (Throw Circle: 0m)
                </div>
                <div className="absolute top-2 right-6 text-[10px] font-mono text-slate-400">
                  เส้นตายท้ายสนาม (Dead Line: 12m) ▶
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-300 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-700/60 shadow-sm">
                  ระยะแก่นการแข่งขันมาตรฐาน FIPJP: 6.0 - 10.0 เมตร
                </div>
              </div>

              {/* Throwing Circle at Left (50cm FIPJP Ring) */}
              <div className="absolute top-1/2 left-8 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-amber-400/50 bg-amber-500/5 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[9px] font-mono font-bold text-amber-300 leading-none">R=50cm</span>
                <span className="text-[8px] text-slate-300 mt-0.5">จุดยืนโยน</span>
              </div>

              {/* Distance Radii around Cochonnet */}
              {showZones && (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${jack.x}%`, top: `${jack.y}%` }}
                >
                  <div className="w-28 h-28 rounded-full border border-emerald-400/50 bg-emerald-500/5 -translate-x-1/2 -translate-y-1/2 absolute flex items-center justify-center">
                    <span className="text-[9px] font-mono text-emerald-300 absolute top-1 font-bold">30 cm (จุดสวย)</span>
                  </div>
                  <div className="w-56 h-56 rounded-full border border-dashed border-amber-400/40 -translate-x-1/2 -translate-y-1/2 absolute flex items-center justify-center">
                    <span className="text-[9px] font-mono text-amber-300/80 absolute top-2 font-bold">70 cm</span>
                  </div>
                </div>
              )}

              {/* Tactical Replay Motion Trajectory Vector SVG */}
              {showTrajectoryTrail && activeFrame && activeFrame.fromPos && activeFrame.toPos && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                  <defs>
                    <marker
                      id="arrowhead-replay"
                      markerWidth="8"
                      markerHeight="6"
                      refX="7"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 8 3, 0 6"
                        fill={activeFrame.actionType === 'shoot' ? '#f43f5e' : '#f59e0b'}
                      />
                    </marker>
                    <linearGradient id="replayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
                    </linearGradient>
                  </defs>
                  {/* Trajectory path curve */}
                  <path
                    d={`M ${activeFrame.fromPos.x * 0.01 * (boardRef.current?.clientWidth || 700)} ${activeFrame.fromPos.y * 0.01 * (boardRef.current?.clientHeight || 480)} Q ${(activeFrame.fromPos.x + activeFrame.toPos.x) / 2 * 0.01 * (boardRef.current?.clientWidth || 700)} ${Math.min(activeFrame.fromPos.y, activeFrame.toPos.y) * 0.7 * 0.01 * (boardRef.current?.clientHeight || 480)} ${activeFrame.toPos.x * 0.01 * (boardRef.current?.clientWidth || 700)} ${activeFrame.toPos.y * 0.01 * (boardRef.current?.clientHeight || 480)}`}
                    fill="none"
                    stroke={activeFrame.actionType === 'shoot' ? '#f43f5e' : 'url(#replayGrad)'}
                    strokeWidth="3"
                    strokeDasharray="6,4"
                    markerEnd="url(#arrowhead-replay)"
                    className="animate-pulse"
                  />
                  {/* Landing Circle Pulse */}
                  <circle
                    cx={`${activeFrame.toPos.x}%`}
                    cy={`${activeFrame.toPos.y}%`}
                    r="14"
                    fill="none"
                    stroke={activeFrame.actionType === 'shoot' ? '#f43f5e' : '#f59e0b'}
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    className="animate-ping"
                  />
                </svg>
              )}

              {/* Distance Ruler Lines from Cochonnet to each Boule */}
              {showRuler && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {itemsWithDistance
                    .filter((item) => item.type !== 'jack')
                    .map((item) => {
                      const isHolding = holdingIds.has(item.id);
                      return (
                        <g key={`ruler-${item.id}`}>
                          <line
                            x1={`${jack.x}%`}
                            y1={`${jack.y}%`}
                            x2={`${item.x}%`}
                            y2={`${item.y}%`}
                            stroke={isHolding ? (item.type === 'teamA' ? '#fbbf24' : '#38bdf8') : '#64748b'}
                            strokeWidth={isHolding ? 2 : 1}
                            strokeDasharray={isHolding ? 'none' : '3,3'}
                            opacity={isHolding ? 0.95 : 0.45}
                          />
                          <foreignObject
                            x={`calc(${(jack.x + item.x) / 2}% - 28px)`}
                            y={`calc(${(jack.y + item.y) / 2}% - 11px)`}
                            width="56"
                            height="22"
                          >
                            <div
                              className={`text-[9px] font-mono font-bold text-center px-1 py-0.5 rounded-md border shadow-md ${
                                isHolding
                                  ? 'bg-slate-900 text-white border-amber-400/80'
                                  : 'bg-slate-950/90 text-slate-300 border-slate-700/60'
                              }`}
                            >
                              {item.distanceToJackCm} cm
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}
                </svg>
              )}

              {/* Render Cochonnet (Jack) */}
              <div
                onPointerDown={(e) => handlePointerDown('jack', e)}
                style={{ left: `${jack.x}%`, top: `${jack.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing group p-2 focus:outline-none"
                title="ลูกเป้า (Cochonnet) - ลากเพื่อเปลี่ยนตำแหน่ง"
                tabIndex={0}
                aria-label="ลูกเป้าแก่น Cochonnet"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.9)] border-2 border-white ring-2 ring-orange-500/50 transform group-hover:scale-125 transition-transform flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/90"></span>
                </div>
                <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/40 pointer-events-none shadow-md">
                  แก่น (Jack)
                </div>
              </div>

              {/* Render Boules on the field */}
              {itemsWithDistance
                .filter((i) => i.type !== 'jack')
                .map((boule) => {
                  const isHolding = holdingIds.has(boule.id);
                  const isTeamA = boule.type === 'teamA';
                  return (
                    <div
                      key={boule.id}
                      onPointerDown={(e) => handlePointerDown(boule.id, e)}
                      style={{ left: `${boule.x}%`, top: `${boule.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing group p-2 focus:outline-none"
                      tabIndex={0}
                      aria-label={`ลูกเปตองทีม ${isTeamA ? 'A' : 'B'} เบอร์ ${boule.number || 1} ระยะห่าง ${boule.distanceToJackCm} ซม.`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full relative flex items-center justify-center shadow-2xl transition-transform group-hover:scale-115 ${
                          isTeamA
                            ? 'bg-gradient-to-br from-amber-100 via-slate-300 to-slate-700 border-2 border-amber-400'
                            : 'bg-gradient-to-br from-slate-400 via-slate-700 to-slate-950 border-2 border-sky-400'
                        } ${isHolding ? 'ring-4 ring-emerald-400/80 animate-pulse' : ''}`}
                      >
                        <div className="absolute inset-1 rounded-full border border-black/20 pointer-events-none"></div>
                        <span
                          className={`text-xs font-black font-mono select-none ${
                            isTeamA ? 'text-amber-950' : 'text-sky-200'
                          }`}
                        >
                          {boule.number || 1}
                        </span>

                        {isHolding && (
                          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-glow-emerald border border-white">
                            ★
                          </div>
                        )}
                      </div>

                      <div className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none bg-slate-950/95 text-slate-200 border border-slate-700 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isTeamA ? 'bg-amber-400' : 'bg-sky-400'}`}></span>
                        <span>{boule.distanceToJackCm} cm</span>
                      </div>
                    </div>
                  );
                })}

              {/* Status HUD in canvas bottom-left */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-xl flex items-center gap-3 z-30">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      holdingTeam === 'teamA'
                        ? 'bg-amber-400 shadow-glow-orange'
                        : holdingTeam === 'teamB'
                        ? 'bg-sky-400 shadow-glow-sky'
                        : 'bg-slate-600'
                    }`}
                  ></div>
                  <span className="text-xs font-bold text-white">
                    {holdingTeam === 'teamA' ? (
                      <span className="text-amber-300">ทีมเราถือแต้ม: {holdingPointsCount} แต้ม</span>
                    ) : holdingTeam === 'teamB' ? (
                      <span className="text-sky-300">คู่แข่งถือแต้ม: {holdingPointsCount} แต้ม</span>
                    ) : (
                      'ยังไม่มีลูกในระยะ'
                    )}
                  </span>
                </div>
                <span className="text-slate-600">|</span>
                <span className="text-[11px] text-slate-300 font-mono">
                  ลูก A: {items.filter((i) => i.type === 'teamA').length}/6 • ลูก B: {items.filter((i) => i.type === 'teamB').length}/6
                </span>
              </div>
            </div>

            {/* TACTICAL REPLAY SCRUBBER & CONTROL COCKPIT */}
            <div className="glass-panel p-4 rounded-3xl border border-slate-700/80 shadow-xl space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-300 flex items-center justify-center font-bold">
                    <i className="fa-solid fa-backward-step" aria-hidden="true"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white font-heading flex items-center gap-2">
                      <span>Tactical Replay Simulator</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {currentFrameIndex + 1} / {replayFrames.length} ช็อต
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      เล่นย้อนหลังการแก้เกมทีละช็อต หรือกดบันทึกเพื่อสร้างลำดับกลยุทธ์ของคุณเอง
                    </p>
                  </div>
                </div>

                {/* Record Toggle & Snapshot button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecording(!isRecording)}
                    aria-pressed={isRecording}
                    aria-label={isRecording ? 'หยุดการบันทึกช็อต' : 'เริ่มบันทึกช็อต'}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
                      isRecording
                        ? 'bg-rose-600 text-white shadow-glow-rose animate-pulse'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" aria-hidden="true"></span>
                    <span>{isRecording ? 'กำลังบันทึก (REC)' : 'บันทึกช็อต (Record)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => captureCurrentFrame(customNote || undefined)}
                    aria-label="จับภาพบันทึกสถานะกระดานปัจจุบันเป็นคีย์เฟรม"
                    className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <i className="fa-solid fa-camera" aria-hidden="true"></i>
                    <span className="hidden sm:inline">+ ถ่ายช็อต (Snapshot)</span>
                  </button>
                </div>
              </div>

              {/* Scrubber step buttons timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>Timeline ช็อตกลยุทธ์:</span>
                  <span className="font-mono text-purple-300">
                    {activeFrame ? activeFrame.title : ''}
                  </span>
                </div>

                {/* Visual Step Pills / Scrubber Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {replayFrames.map((frame, idx) => {
                    const isCurrent = idx === currentFrameIndex;
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => jumpToFrame(idx)}
                        aria-pressed={isCurrent}
                        aria-label={`กระโดดไปช็อตที่ ${idx + 1}: ${frame.title}`}
                        className={`min-h-[44px] p-2 rounded-xl text-left transition border flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                          isCurrent
                            ? 'bg-purple-600 text-white border-purple-400/80 shadow-glow-purple'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold">
                            STEP {idx + 1}
                          </span>
                          <span className="text-[10px]">
                            {frame.actionType === 'shoot' ? '💥 ยิง' : frame.actionType === 'push_jack' ? '🔄 ดันแก่น' : '🎯 เข้า'}
                          </span>
                        </div>
                        <span className="text-xs font-bold truncate mt-1">
                          {frame.title.split(':')[1]?.trim() || frame.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Playback Controls & Speed Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* Media buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => jumpToFrame(0)}
                    disabled={currentFrameIndex === 0}
                    aria-label="ย้อนกลับไปช็อตแรกสุด"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <i className="fa-solid fa-backward-fast" aria-hidden="true"></i>
                  </button>

                  <button
                    type="button"
                    onClick={() => jumpToFrame(Math.max(0, currentFrameIndex - 1))}
                    disabled={currentFrameIndex === 0}
                    aria-label="ย้อนกลับไปช็อตก่อนหน้า"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <i className="fa-solid fa-step-backward" aria-hidden="true"></i>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? 'หยุดการเล่นชั่วคราว' : 'เล่นภาพจำลองช็อตต่อกัน'}
                    className="min-h-[44px] px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-purple transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                  >
                    <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} aria-hidden="true"></i>
                    <span>{isPlaying ? 'พัก (Pause)' : 'เล่น (Play Replay)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => jumpToFrame(Math.min(replayFrames.length - 1, currentFrameIndex + 1))}
                    disabled={currentFrameIndex === replayFrames.length - 1}
                    aria-label="ไปยังช็อตถัดไป"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <i className="fa-solid fa-step-forward" aria-hidden="true"></i>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLooping(!isLooping)}
                    aria-pressed={isLooping}
                    aria-label={isLooping ? 'ปิดการเล่นวนลูป' : 'เปิดการเล่นวนลูปอัตโนมัติ'}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                      isLooping
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                    title="เล่นวนซ้ำ (Loop)"
                  >
                    <i className="fa-solid fa-repeat" aria-hidden="true"></i>
                  </button>
                </div>

                {/* Speed buttons */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 px-2 hidden sm:inline">ความเร็ว:</span>
                  {[0.75, 1, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      aria-pressed={playbackSpeed === spd}
                      aria-label={`ความเร็ว ${spd} เท่า`}
                      className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                        playbackSpeed === spd
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Active frame explanation note */}
              {activeFrame && (
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs mt-0.5 shrink-0">
                    <i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">
                      บันทึกประจำช็อต: {activeFrame.title}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">
                      {activeFrame.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tactical Decision Tree & Expert Analysis (Right 4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Live Tactical Decision Assistant Card */}
            <article className="glass-panel p-5 rounded-3xl border border-slate-700/80 shadow-xl space-y-4 relative overflow-hidden">
              <header className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <i className="fa-solid fa-brain" aria-hidden="true"></i>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block font-bold">
                      STRATEGY DECISION TREE
                    </span>
                    <h3 className="text-base font-black text-white font-heading">
                      การวิเคราะห์ทางยุทธวิธี
                    </h3>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                    advice.recommendedShot === 'shoot'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {advice.recommendedShot === 'shoot' ? '🎯 SHOOT' : '🎯 POINT'}
                </span>
              </header>

              {/* Current Board State Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-slate-300 block">สถานการณ์ปัจจุบัน:</span>
                <p className="text-xs text-slate-100 leading-relaxed">{advice.situation}</p>
              </div>

              {/* Recommended Action / Shot Decision */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-crosshairs text-amber-400" aria-hidden="true"></i>
                    <span>คำแนะนำ: {advice.title}</span>
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-purple-500/30 text-purple-200 font-bold">
                    {advice.actionLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {advice.advice}
                </p>
              </div>

              {/* Scenario-specific Expert Breakdown if loaded */}
              {currentScenario && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-shield text-amber-400" aria-hidden="true"></i>
                      <span>ระดับความเสี่ยง (Risk Level):</span>
                    </span>
                    <span className="font-mono text-white">{currentScenario.expertAdvice.riskLevel}</span>
                  </div>
                  <div className="text-slate-200 text-xs">
                    <strong className="text-white block mb-0.5 font-bold">เหตุผลหลักทางยุทธวิธี:</strong>
                    {currentScenario.expertAdvice.primaryReason}
                  </div>
                  <div className="text-slate-300 text-xs pt-1.5 border-t border-slate-800/80">
                    <strong className="text-slate-200 block mb-0.5 font-bold">แผนสำรอง (Plan B):</strong>
                    {currentScenario.expertAdvice.alternativeOption}
                  </div>
                </div>
              )}

              {/* Decision Flow Quick Reference */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-300 block">กฎเหล็กการตัดสินใจ (Petanque Axioms):</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <strong className="text-emerald-400 block mb-0.5 font-bold">เมื่อไหร่ควรเข้า (Point)?</strong>
                    <span className="text-slate-300">คู่แข่งห่าง &gt; 35 cm หรือต้องการบีบให้คู่แข่งใช้ลูกเปลือง</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <strong className="text-rose-400 block mb-0.5 font-bold">เมื่อไหร่ควรยิง (Shoot)?</strong>
                    <span className="text-slate-300">คู่แข่งจ่อ &lt; 25 cm หรือมีโอกาสกวาดแต้มใหญ่ 2-4 แต้ม</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

export type ShotType = 'shoot' | 'point';
export type ShotResult =
  | 'carreau'       // ยิงติดตายสมบูรณ์แบบ
  | 'hit'           // ยิงโดน/ลูกกระเด็น
  | 'miss_short'    // ยิงตกสั้นหน้าเป้า
  | 'miss_wide'     // ยิงเลย/เฉี่ยวข้าง
  | 'point_close'   // เข้าติดแก่น (<30cm)
  | 'point_fair'    // เข้าโซน (30-70cm)
  | 'point_fail';   // เข้าเสีย/เลยเป้า (>70cm)

export interface MeneShot {
  id: string;
  type: ShotType;
  result: ShotResult;
  playerBouleNo: number; // 1 to 6
  shooterName?: string;
}

export interface MeneRecord {
  meneNumber: number;
  teamAScore: number;
  teamBScore: number;
  pointsWonTeamA: number;
  shots: MeneShot[];
  tacticalNote: string;
  distanceMeter: number;
}

// Initial realistic tournament match data (7 Mènes) for immediate rich visualization
const INITIAL_MENES: MeneRecord[] = [
  {
    meneNumber: 1,
    teamAScore: 2,
    teamBScore: 0,
    pointsWonTeamA: 2,
    distanceMeter: 7.2,
    tacticalNote: 'เปิดเกมระยะ 7 ม. เข้าลูกติดแก่น 2 ลูก คู่แข่งยิงพลาด',
    shots: [
      { id: '1-1', type: 'point', result: 'point_close', playerBouleNo: 1 },
      { id: '1-2', type: 'point', result: 'point_fair', playerBouleNo: 2 },
      { id: '1-3', type: 'shoot', result: 'hit', playerBouleNo: 3 },
      { id: '1-4', type: 'point', result: 'point_close', playerBouleNo: 4 },
      { id: '1-5', type: 'shoot', result: 'carreau', playerBouleNo: 5 },
      { id: '1-6', type: 'point', result: 'point_fair', playerBouleNo: 6 },
    ]
  },
  {
    meneNumber: 2,
    teamAScore: 2,
    teamBScore: 1,
    pointsWonTeamA: 0,
    distanceMeter: 8.5,
    tacticalNote: 'คู่แข่งโยนแก่นไกล 8.5 ม. มือยิงตกสั้น 2 ลูก เสีย 1 แต้ม',
    shots: [
      { id: '2-1', type: 'point', result: 'point_fair', playerBouleNo: 1 },
      { id: '2-2', type: 'shoot', result: 'miss_short', playerBouleNo: 2 },
      { id: '2-3', type: 'shoot', result: 'miss_short', playerBouleNo: 3 },
      { id: '2-4', type: 'point', result: 'point_close', playerBouleNo: 4 },
      { id: '2-5', type: 'shoot', result: 'hit', playerBouleNo: 5 },
      { id: '2-6', type: 'point', result: 'point_fail', playerBouleNo: 6 },
    ]
  },
  {
    meneNumber: 3,
    teamAScore: 5,
    teamBScore: 1,
    pointsWonTeamA: 3,
    distanceMeter: 6.8,
    tacticalNote: 'Mène ฟอร์มทอง! ยิงติด Carreau 2 ลูกรวด กวาด 3 แต้ม',
    shots: [
      { id: '3-1', type: 'point', result: 'point_close', playerBouleNo: 1 },
      { id: '3-2', type: 'shoot', result: 'carreau', playerBouleNo: 2 },
      { id: '3-3', type: 'point', result: 'point_close', playerBouleNo: 3 },
      { id: '3-4', type: 'shoot', result: 'carreau', playerBouleNo: 4 },
      { id: '3-5', type: 'shoot', result: 'hit', playerBouleNo: 5 },
      { id: '3-6', type: 'point', result: 'point_fair', playerBouleNo: 6 },
    ]
  },
  {
    meneNumber: 4,
    teamAScore: 5,
    teamBScore: 4,
    pointsWonTeamA: 0,
    distanceMeter: 9.2,
    tacticalNote: 'โดนกดดันระยะ 9 ม. มือยิงแฉลบข้างและตกสั้น เสีย 3 แต้ม',
    shots: [
      { id: '4-1', type: 'point', result: 'point_fair', playerBouleNo: 1 },
      { id: '4-2', type: 'shoot', result: 'miss_wide', playerBouleNo: 2 },
      { id: '4-3', type: 'shoot', result: 'miss_short', playerBouleNo: 3 },
      { id: '4-4', type: 'shoot', result: 'miss_wide', playerBouleNo: 4 },
      { id: '4-5', type: 'point', result: 'point_fail', playerBouleNo: 5 },
      { id: '4-6', type: 'point', result: 'point_close', playerBouleNo: 6 },
    ]
  },
  {
    meneNumber: 5,
    teamAScore: 8,
    teamBScore: 4,
    pointsWonTeamA: 3,
    distanceMeter: 7.0,
    tacticalNote: 'ดึงจังหวะกลับมาได้ เข้าลูกแน่นและยิงเปลี่ยนเป้าสำเร็จ',
    shots: [
      { id: '5-1', type: 'point', result: 'point_close', playerBouleNo: 1 },
      { id: '5-2', type: 'point', result: 'point_close', playerBouleNo: 2 },
      { id: '5-3', type: 'shoot', result: 'hit', playerBouleNo: 3 },
      { id: '5-4', type: 'shoot', result: 'carreau', playerBouleNo: 4 },
      { id: '5-5', type: 'point', result: 'point_fair', playerBouleNo: 5 },
      { id: '5-6', type: 'shoot', result: 'hit', playerBouleNo: 6 },
    ]
  },
  {
    meneNumber: 6,
    teamAScore: 10,
    teamBScore: 4,
    pointsWonTeamA: 2,
    distanceMeter: 7.8,
    tacticalNote: 'ตั้งการ์ดบล็อกหน้าแก่นสำเร็จ บีบคู่แข่งเล่นยาก ได้ 2 แต้ม',
    shots: [
      { id: '6-1', type: 'point', result: 'point_close', playerBouleNo: 1 },
      { id: '6-2', type: 'shoot', result: 'hit', playerBouleNo: 2 },
      { id: '6-3', type: 'point', result: 'point_fair', playerBouleNo: 3 },
      { id: '6-4', type: 'shoot', result: 'hit', playerBouleNo: 4 },
      { id: '6-5', type: 'shoot', result: 'miss_short', playerBouleNo: 5 },
      { id: '6-6', type: 'point', result: 'point_close', playerBouleNo: 6 },
    ]
  },
  {
    meneNumber: 7,
    teamAScore: 13,
    teamBScore: 4,
    pointsWonTeamA: 3,
    distanceMeter: 6.5,
    tacticalNote: 'Mène ปิดแมตช์ 13 แต้ม! ยิง Carreau ปิดเกมอย่างสมบูรณ์แบบ',
    shots: [
      { id: '7-1', type: 'point', result: 'point_close', playerBouleNo: 1 },
      { id: '7-2', type: 'shoot', result: 'carreau', playerBouleNo: 2 },
      { id: '7-3', type: 'point', result: 'point_close', playerBouleNo: 3 },
      { id: '7-4', type: 'shoot', result: 'carreau', playerBouleNo: 4 },
      { id: '7-5', type: 'point', result: 'point_close', playerBouleNo: 5 },
      { id: '7-6', type: 'shoot', result: 'hit', playerBouleNo: 6 },
    ]
  }
];

export const MeneAnalysis: React.FC = () => {
  const [menes, setMenes] = useState<MeneRecord[]>(INITIAL_MENES);
  const [activeTab, setActiveTab] = useState<'trends' | 'distribution' | 'radar' | 'raw_data'>('trends');
  const [filterDistance, setFilterDistance] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Mène quick form state
  const [newPointsA, setNewPointsA] = useState<number>(1);
  const [newPointsB, setNewPointsB] = useState<number>(0);
  const [newDistance, setNewDistance] = useState<number>(7.5);
  const [newNote, setNewNote] = useState<string>('');
  const [newShots, setNewShots] = useState<ShotResult[]>([
    'point_close',
    'shoot',
    'hit',
    'point_fair',
    'shoot',
    'carreau'
  ] as unknown as ShotResult[]);

  // Filtered Menes
  const filteredMenes = useMemo(() => {
    if (filterDistance === 'all') return menes;
    if (filterDistance === 'short') return menes.filter(m => m.distanceMeter < 7.0);
    if (filterDistance === 'medium') return menes.filter(m => m.distanceMeter >= 7.0 && m.distanceMeter <= 8.5);
    return menes.filter(m => m.distanceMeter > 8.5);
  }, [menes, filterDistance]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalShooting = 0;
    let carreauCount = 0;
    let hitCount = 0;
    let missShortCount = 0;
    let missWideCount = 0;

    let totalPointing = 0;
    let pointCloseCount = 0;
    let pointFairCount = 0;
    let pointFailCount = 0;

    let longDistanceShooting = 0;
    let longDistanceHits = 0;

    let trailingMenesCount = 0;
    let trailingShootingCount = 0;
    let trailingHitsCount = 0;

    filteredMenes.forEach(m => {
      const isTrailing = m.teamAScore < m.teamBScore;
      if (isTrailing) trailingMenesCount++;

      m.shots.forEach(s => {
        if (s.type === 'shoot') {
          totalShooting++;
          if (m.distanceMeter > 8.0) {
            longDistanceShooting++;
            if (s.result === 'carreau' || s.result === 'hit') longDistanceHits++;
          }
          if (isTrailing) {
            trailingShootingCount++;
            if (s.result === 'carreau' || s.result === 'hit') trailingHitsCount++;
          }

          if (s.result === 'carreau') carreauCount++;
          else if (s.result === 'hit') hitCount++;
          else if (s.result === 'miss_short') missShortCount++;
          else if (s.result === 'miss_wide') missWideCount++;
        } else {
          totalPointing++;
          if (s.result === 'point_close') pointCloseCount++;
          else if (s.result === 'point_fair') pointFairCount++;
          else if (s.result === 'point_fail') pointFailCount++;
        }
      });
    });

    const totalHits = carreauCount + hitCount;
    const shootingHitRate = totalShooting > 0 ? Math.round((totalHits / totalShooting) * 100) : 0;
    const carreauRate = totalShooting > 0 ? Math.round((carreauCount / totalShooting) * 100) : 0;
    const missShortPercent = (totalShooting - totalHits) > 0 ? Math.round((missShortCount / (totalShooting - totalHits)) * 100) : 0;
    const missWidePercent = (totalShooting - totalHits) > 0 ? Math.round((missWideCount / (totalShooting - totalHits)) * 100) : 0;

    const pointingSuccessCount = pointCloseCount + pointFairCount;
    const pointingSuccessRate = totalPointing > 0 ? Math.round((pointingSuccessCount / totalPointing) * 100) : 0;
    const closePointRate = totalPointing > 0 ? Math.round((pointCloseCount / totalPointing) * 100) : 0;

    const longRangeHitRate = longDistanceShooting > 0 ? Math.round((longDistanceHits / longDistanceShooting) * 100) : shootingHitRate;
    const pressureHitRate = trailingShootingCount > 0 ? Math.round((trailingHitsCount / trailingShootingCount) * 100) : shootingHitRate;

    return {
      totalShooting,
      totalHits,
      carreauCount,
      hitCount,
      missShortCount,
      missWideCount,
      shootingHitRate,
      carreauRate,
      missShortPercent,
      missWidePercent,
      totalPointing,
      pointingSuccessRate,
      closePointRate,
      pointCloseCount,
      pointFairCount,
      pointFailCount,
      longRangeHitRate,
      pressureHitRate,
      trailingMenesCount
    };
  }, [filteredMenes]);

  // Weakness Diagnosis Engine
  const diagnosis = useMemo(() => {
    const flaws: { title: string; severity: 'critical' | 'warning' | 'positive'; desc: string; fixAdvice: string }[] = [];

    // Check Short Miss bias
    if (stats.missShortPercent >= 55) {
      flaws.push({
        title: 'จุดอ่อนวิกฤต: ยิงตกสั้นหน้าเป้าเป็นหลัก (Short-Miss Bias)',
        severity: 'critical',
        desc: `ลูกที่ยิงพลาดเป็นลูกตกสั้นถึง ${stats.missShortPercent}% บ่งบอกว่าผู้เล่นผ่อนแรงแขนหรือสะบัดข้อมือช้าเกินไปในจังหวะปล่อยลูก ส่งผลให้ลูกตกกระทบพื้นก่อนถึงลูกเป้าหมาย`,
        fixAdvice: 'ฝึก Drill #2 (ยิงข้ามสิ่งกีดขวาง Tire à la sautée) เพื่อบังคับให้จุดตก Donnée เลยข้ามไปตกกระทบลูกเป้าหมายโดยตรง (Fer-à-fer)'
      });
    } else if (stats.missWidePercent >= 55) {
      flaws.push({
        title: 'จุดอ่อนวิกฤต: ยิงเฉี่ยวออกด้านข้าง (Lateral Drift)',
        severity: 'critical',
        desc: `ลูกที่ยิงพลาดแฉลบออกซ้ายหรือขวา ${stats.missWidePercent}% เกิดจากแนวแกนหัวไหล่เปิดหรือปล่อยนิ้วชี้และนิ้วก้อยไม่สม่ำเสมอกัน`,
        fixAdvice: 'ฝึกการกวัดแกว่งแขนในแนวระนาบตรง (Arm Pendulum Alignment) และเช็กแนวเท้าทั้งสองข้างในวงกลม'
      });
    }

    // Check Long-range performance drop
    if (stats.longRangeHitRate < stats.shootingHitRate - 15) {
      flaws.push({
        title: 'จุดอ่อนระยะไกล: ความแม่นยำตกเมื่อระยะ > 8.0 เมตร',
        severity: 'warning',
        desc: `อัตรายิงโดนในระยะไกล (${stats.longRangeHitRate}%) ต่ำกว่าระยะเฉลี่ย (${stats.shootingHitRate}%) อย่างมีนัยสำคัญ`,
        fixAdvice: 'เพิ่มการส่งแรงจากข้อพับสะโพกและแรงเหวี่ยงหลัง (Backswing Amplitude) โดยไม่เกร็งข้อมือ'
      });
    }

    // Check Pointing Depth
    if (stats.pointFailCount > 2) {
      flaws.push({
        title: 'จุดที่ควรปรับปรุง: การควบคุมลูกเข้าเรียบในพื้นแข็ง',
        severity: 'warning',
        desc: `มีลูกเข้าหลุดโซน (>70 ซม.) ${stats.pointFailCount} ลูก ทำให้เสียเปรียบเชิงตำแหน่ง`,
        fixAdvice: 'ฝึกใช้เทคนิค Demi-Portée เล็งจุดตกสั้นลง 1.5 เมตร เผื่อแรงกลิ้งของพื้นดินแข็ง'
      });
    }

    // Positive strength
    if (stats.carreauRate >= 25) {
      flaws.push({
        title: 'จุดแข็งเด่นชัด: อัตราการทำ Carreau สูงระดับโปร (≥25%)',
        severity: 'positive',
        desc: `ทำ Carreau ได้ถึง ${stats.carreauRate}% สร้างความได้เปรียบเชิงแต้มอย่างมหาศาลในเหม้ที่มีโอกาสกวาดแต้ม`,
        fixAdvice: 'รักษาจังหวะสะบัด Backspin รูดปลายนิ้ว 4 นิ้วให้คงที่ในทุกระยะแข่งขัน'
      });
    }

    return flaws;
  }, [stats]);

  // Chart Data: Trends per Mène
  const meneTrendData = useMemo(() => {
    return menes.map(m => {
      const shootShots = m.shots.filter(s => s.type === 'shoot');
      const hits = shootShots.filter(s => s.result === 'carreau' || s.result === 'hit').length;
      const carreau = shootShots.filter(s => s.result === 'carreau').length;
      const hitRate = shootShots.length > 0 ? Math.round((hits / shootShots.length) * 100) : 0;

      const pointShots = m.shots.filter(s => s.type === 'point');
      const goodPoints = pointShots.filter(s => s.result === 'point_close' || s.result === 'point_fair').length;
      const pointRate = pointShots.length > 0 ? Math.round((goodPoints / pointShots.length) * 100) : 0;

      return {
        mene: `Mène ${m.meneNumber}`,
        teamA: m.teamAScore,
        teamB: m.teamBScore,
        hitRate,
        carreau,
        hits,
        pointRate,
        distance: m.distanceMeter,
        pointsWon: m.pointsWonTeamA
      };
    });
  }, [menes]);

  // Chart Data: Shot Results Pie
  const pieData = useMemo(() => {
    return [
      { name: 'Carreau (ตีติดตาย)', value: stats.carreauCount, color: '#f59e0b' },
      { name: 'Hit (ตีโดนกระเด็น)', value: stats.hitCount, color: '#10b981' },
      { name: 'ตกสั้น (Miss Short)', value: stats.missShortCount, color: '#ef4444' },
      { name: 'ออกข้าง (Miss Wide)', value: stats.missWideCount, color: '#ec4899' },
      { name: 'เข้าชิดแก่น (<30cm)', value: stats.pointCloseCount, color: '#06b6d4' },
      { name: 'เข้าโซน (30-70cm)', value: stats.pointFairCount, color: '#3b82f6' },
      { name: 'เข้าเสีย (>70cm)', value: stats.pointFailCount, color: '#64748b' },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Chart Data: Radar 5 Axes
  const radarData = useMemo(() => {
    return [
      { subject: 'ความแม่นยำยิง (Hit %)', score: Math.min(100, stats.shootingHitRate), fullMark: 100 },
      { subject: 'ทำ Carreau ติดตาย', score: Math.min(100, stats.carreauRate * 2.5), fullMark: 100 },
      { subject: 'การเข้าลูกชิด (<30cm)', score: Math.min(100, stats.closePointRate), fullMark: 100 },
      { subject: 'ระยะไกล (>8.0m)', score: Math.min(100, stats.longRangeHitRate), fullMark: 100 },
      { subject: 'ความนิ่งเมื่อแต้มตาม', score: Math.min(100, stats.pressureHitRate), fullMark: 100 },
    ];
  }, [stats]);

  // Handler to add a new Mène
  const handleAddNewMene = () => {
    const lastMene = menes[menes.length - 1];
    const newMeneNo = (lastMene ? lastMene.meneNumber : 0) + 1;
    const newTeamA = (lastMene ? lastMene.teamAScore : 0) + newPointsA;
    const newTeamB = (lastMene ? lastMene.teamBScore : 0) + newPointsB;

    const constructedShots: MeneShot[] = newShots.map((res, idx) => {
      const isShoot = res === 'carreau' || res === 'hit' || res === 'miss_short' || res === 'miss_wide';
      return {
        id: `${newMeneNo}-${idx + 1}`,
        type: isShoot ? 'shoot' : 'point',
        result: res,
        playerBouleNo: idx + 1
      };
    });

    const newRecord: MeneRecord = {
      meneNumber: newMeneNo,
      teamAScore: newTeamA,
      teamBScore: newTeamB,
      pointsWonTeamA: newPointsA,
      distanceMeter: newDistance,
      tacticalNote: newNote || `เที่ยวที่ ${newMeneNo} ได้ ${newPointsA} แต้ม ระยะ ${newDistance} ม.`,
      shots: constructedShots
    };

    setMenes([...menes, newRecord]);
    setShowAddModal(false);
    setNewNote('');
  };

  const handleResetSample = () => {
    setMenes(INITIAL_MENES);
  };

  const handleClearAll = () => {
    setMenes([]);
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Quick Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
              MÈNE PERFORMANCE ANALYTICS
            </span>
            <span className="text-xs text-slate-400">• สถิติทุกลูกในแต่ละเที่ยว</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white font-heading mt-1 flex items-center gap-2">
            <span>โมดูลวิเคราะห์แต้มในแต่ละเที่ยว (Mène Analysis)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-normal">
              D3 / Recharts Powered
            </span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>บันทึกเที่ยวใหม่ (+ Mène)</span>
          </button>
          <button
            type="button"
            onClick={handleResetSample}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
            title="รีเซ็ตเป็นข้อมูลตัวอย่าง 7 เหม้"
          >
            <i className="fa-solid fa-rotate-right mr-1"></i> ข้อมูลตัวอย่าง
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs border border-slate-800 transition"
            title="ล้างข้อมูลทั้งหมด"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>

      {/* KPI Headline Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>ความแม่นยำยิง (Hit Rate)</span>
            <i className="fa-solid fa-crosshairs text-emerald-400"></i>
          </div>
          <div className="text-3xl font-black font-heading text-emerald-400">
            {stats.shootingHitRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
            โดน {stats.totalHits} / ยิง {stats.totalShooting} ครั้ง
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>ตีติดตาย (Carreau Rate)</span>
            <i className="fa-solid fa-bullseye text-amber-400"></i>
          </div>
          <div className="text-3xl font-black font-heading text-amber-400">
            {stats.carreauRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
            {stats.carreauCount} Carreau จาก {stats.totalShooting} ลูก
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>เข้าลูกสำเร็จ (Point Rate)</span>
            <i className="fa-solid fa-circle-dot text-sky-400"></i>
          </div>
          <div className="text-3xl font-black font-heading text-sky-400">
            {stats.pointingSuccessRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
            ชิดแก่น {stats.pointCloseCount} / รวม {stats.totalPointing} ลูก
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>แนวโน้มการยิงพลาด</span>
            <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
          </div>
          <div className="text-xl font-bold font-heading text-rose-400 mt-1">
            {stats.missShortPercent >= 50 ? 'ตกสั้นหน้าเป้า' : stats.missWidePercent >= 50 ? 'เฉี่ยวออกข้าง' : 'สมดุล'}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 font-mono">
            สั้น {stats.missShortPercent}% | ข้าง {stats.missWidePercent}%
          </span>
        </div>
      </div>

      {/* WEAKNESS DIAGNOSIS & COACH RECOMMENDATIONS (การวิเคราะห์จุดอ่อนของผู้เล่น) */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base border border-amber-400/30">
              <i className="fa-solid fa-stethoscope"></i>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-white font-heading">
                การวิเคราะห์จุดอ่อนและข้อบกพร่องรายบุคคล (Biomechanical Weakness Diagnostic)
              </h4>
              <span className="text-[11px] text-slate-400">
                ประมวลผลจากอัตราส่วนการยิงพลาด (Miss Ratio) ระยะทำการ และความสม่ำเสมอในแต่ละเที่ยว
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700 font-mono">
            {diagnosis.length} ประเด็นวิเคราะห์
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {diagnosis.map((d, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border space-y-2 ${
                d.severity === 'critical'
                  ? 'bg-rose-950/25 border-rose-500/40'
                  : d.severity === 'warning'
                  ? 'bg-amber-950/25 border-amber-500/40'
                  : 'bg-emerald-950/25 border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    d.severity === 'critical'
                      ? 'text-rose-400'
                      : d.severity === 'warning'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      d.severity === 'critical'
                        ? 'fa-circle-exclamation'
                        : d.severity === 'warning'
                        ? 'fa-triangle-exclamation'
                        : 'fa-check-circle'
                    }`}
                  ></i>
                  <span>{d.title}</span>
                </strong>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900/80 text-slate-400">
                  {d.severity}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{d.desc}</p>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-sky-300">
                <strong className="text-amber-400">แนวทางแก้ไขจากผู้ฝึกสอน:</strong> {d.fixAdvice}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER & TAB NAVIGATION */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Chart View Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'trends', label: 'แนวโน้มคะแนน & ความแม่นยำ', icon: 'fa-chart-line' },
            { id: 'distribution', label: 'สัดส่วนลูกยิง/ลูกเข้า (Pie)', icon: 'fa-chart-pie' },
            { id: 'radar', label: 'เรดาร์ 5 มิติ (Skill Radar)', icon: 'fa-chart-simple' },
            { id: 'raw_data', label: 'ตารางบันทึกรายเที่ยว', icon: 'fa-table' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Distance Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">ระยะเป้า:</span>
          {[
            { id: 'all', label: 'ทุกระยะ' },
            { id: 'short', label: '< 7.0 ม.' },
            { id: 'medium', label: '7.0 - 8.5 ม.' },
            { id: 'long', label: '> 8.5 ม.' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterDistance(f.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterDistance === f.id
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: CHARTS */}
      <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-slate-800 min-h-[380px]">
        {menes.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <i className="fa-solid fa-chart-line text-4xl text-slate-600"></i>
            <h4 className="text-base font-bold text-white">ยังไม่มีข้อมูลเที่ยวการเล่น</h4>
            <p className="text-xs text-slate-400">กดปุ่ม &quot;บันทึกเที่ยวใหม่&quot; หรือ &quot;ข้อมูลตัวอย่าง&quot; เพื่อเริ่มต้นการวิเคราะห์</p>
          </div>
        ) : (
          <>
            {/* 1. TRENDS CHART */}
            {activeTab === 'trends' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <i className="fa-solid fa-chart-line text-amber-400"></i>
                      <span>วิวัฒนาการแต้มและความแม่นยำในแต่ละเที่ยว (Score & Hit Rate per Mène)</span>
                    </h4>
                    <span className="text-xs text-slate-400">
                      เปรียบเทียบแต้มสะสมทีม A (สีทอง) กับ ทีม B (สีฟ้า) และอัตราความแม่นยำในการยิง % (เส้นประสีเขียว)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-3 h-1 bg-amber-400 rounded-full"></span> ทีมเรา (Score A)
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <span className="w-3 h-1 bg-sky-400 rounded-full"></span> คู่แข่ง (Score B)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-3 h-1 bg-emerald-400 rounded-full"></span> ยิงโดน %
                    </span>
                  </div>
                </div>

                <div className="w-full h-80 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={meneTrendData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="mene" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" stroke="#64748b" domain={[0, 13]} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#f8fafc'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="teamA" stroke="#f59e0b" strokeWidth={3} name="แต้มสะสมทีมเรา" activeDot={{ r: 6 }} />
                      <Line yAxisId="left" type="monotone" dataKey="teamB" stroke="#38bdf8" strokeWidth={2.5} name="แต้มสะสมคู่แข่ง" strokeDasharray="4 4" />
                      <Line yAxisId="right" type="monotone" dataKey="hitRate" stroke="#10b981" strokeWidth={2} name="ความแม่นยำยิง (%)" dot={{ stroke: '#10b981', strokeWidth: 2, r: 4 }} />
                      <Line yAxisId="right" type="monotone" dataKey="pointRate" stroke="#818cf8" strokeWidth={1.5} name="เข้าลูกสำเร็จ (%)" strokeDasharray="2 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 2. DISTRIBUTION PIE & BAR CHARTS */}
            {activeTab === 'distribution' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-amber-400"></i>
                    <span>สัดส่วนผลลัพธ์ลูกเปตอง (Shot Distribution)</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    จำแนกผลการยิงและการเข้าลูกทั้งหมด เพื่อตรวจดูว่าลูกส่วนใหญ่จัดอยู่ในกลุ่ม Carreau, ยิงโดน, ยิงตกสั้น หรือเข้าชิดแก่น
                  </p>

                  <div className="space-y-1.5 pt-2">
                    {pieData.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900/80">
                        <span className="flex items-center gap-2 text-slate-300">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                          <span>{entry.name}</span>
                        </span>
                        <strong className="text-white font-mono">{entry.value} ลูก</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#090d16" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#f8fafc'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 3. RADAR 5 AXES */}
            {activeTab === 'radar' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <i className="fa-solid fa-bullseye text-purple-400"></i>
                    <span>เรดาร์ศักยภาพ 5 มิติ (5-Axis Competency Radar)</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    วิเคราะห์มิติการเล่นรอบด้าน: ความแม่นยำ, การทำลูกตาย (Carreau), ความนิ่งในระยะไกล, การเข้าลูกระยะประชิด และสภาพจิตใจยามแต้มตามหลัง
                  </p>

                  <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                    <strong className="text-amber-400 block font-bold">สรุปโปรไฟล์สไตล์การเล่น:</strong>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      ผู้เล่นมีจุดเด่นสูงในด้าน <strong>Carreau Efficiency</strong> และ <strong>Close Pointing</strong> แต่ควรเสริมความแน่นอนเมื่อโยนระยะไกลเกิน 8.5 เมตร
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 10 }} />
                      <Radar name="คะแนนสมรรถนะ" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} strokeWidth={2} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#f8fafc'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 4. RAW DATA TABLE */}
            {activeTab === 'raw_data' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm sm:text-base">
                    ตารางบันทึกสถิติรายเที่ยว (Mène-by-Mène Log)
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    บันทึกแล้ว {menes.length} เที่ยว
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="p-3">เที่ยว</th>
                        <th className="p-3">สกอร์ (A - B)</th>
                        <th className="p-3">ระยะ</th>
                        <th className="p-3">ผลการยิง/เข้าทุกลูก (ลูก 1 ถึง 6)</th>
                        <th className="p-3">บันทึกแทกติก / ข้อสังเกต</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {menes.map(m => (
                        <tr key={m.meneNumber} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white whitespace-nowrap">
                            Mène {m.meneNumber}
                          </td>
                          <td className="p-3 font-mono font-bold whitespace-nowrap">
                            <span className="text-amber-400">{m.teamAScore}</span>
                            <span className="text-slate-500 mx-1">-</span>
                            <span className="text-sky-400">{m.teamBScore}</span>
                            {m.pointsWonTeamA > 0 && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                +{m.pointsWonTeamA}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                            {m.distanceMeter} ม.
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {m.shots.map((s, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                    s.result === 'carreau'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : s.result === 'hit'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : s.result === 'miss_short'
                                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                      : s.result === 'miss_wide'
                                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                                      : s.result === 'point_close'
                                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                      : s.result === 'point_fair'
                                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                  title={`ลูกที่ ${idx + 1}: ${s.result}`}
                                >
                                  {s.result === 'carreau' ? '🎯 Carreau' :
                                   s.result === 'hit' ? '✓ Hit' :
                                   s.result === 'miss_short' ? '✗ ตกสั้น' :
                                   s.result === 'miss_wide' ? '✗ ออกข้าง' :
                                   s.result === 'point_close' ? '🟢 ชิดแก่น' :
                                   s.result === 'point_fair' ? '🟡 ในโซน' : '🔴 หลุดเป้า'}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-[11px] text-slate-400 max-w-xs">
                            {m.tacticalNote}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* QUICK ADD MÈNE MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-panel rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative border border-slate-700 max-h-[88vh] overflow-y-auto space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-400/30">
                <i className="fa-solid fa-plus"></i>
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-white font-heading">
                  บันทึกข้อมูลเที่ยวใหม่ (Record New Mène)
                </h4>
                <span className="text-xs text-slate-400">
                  เที่ยวที่ {(menes[menes.length - 1]?.meneNumber || 0) + 1} • บันทึกผลยิงและแต้ม
                </span>
              </div>
            </div>

            {/* Score & Distance Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">แต้มที่ทีมเราได้</span>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={newPointsA}
                  onChange={e => setNewPointsA(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-base font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">แต้มที่คู่แข่งได้</span>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={newPointsB}
                  onChange={e => setNewPointsB(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-base font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">ระยะแก่น (เมตร)</span>
                <input
                  type="number"
                  step="0.1"
                  min="6.0"
                  max="10.0"
                  value={newDistance}
                  onChange={e => setNewDistance(parseFloat(e.target.value) || 7.0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 6 Boules Shot Tagging */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                แท็กผลงานลูกเปตองทั้ง 6 ลูกในเที่ยวนี้:
              </span>
              <div className="space-y-2">
                {newShots.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-bold text-slate-400 font-mono w-16">
                      ลูกที่ {idx + 1}:
                    </span>
                    <select
                      value={st}
                      onChange={e => {
                        const copy = [...newShots];
                        copy[idx] = e.target.value as ShotResult;
                        setNewShots(copy);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="carreau">🎯 ยิงติดตาย (Carreau)</option>
                      <option value="hit">✓ ยิงโดนกระเด็น (Hit)</option>
                      <option value="miss_short">✗ ยิงตกสั้นหน้าเป้า (Miss Short)</option>
                      <option value="miss_wide">✗ ยิงออกข้าง/แฉลบ (Miss Wide)</option>
                      <option value="point_close">🟢 เข้าชิดแก่น (&lt;30cm)</option>
                      <option value="point_fair">🟡 เข้าในโซน (30-70cm)</option>
                      <option value="point_fail">🔴 เข้าหลุดโซน (&gt;70cm)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-1">
                บันทึกแทกติก / สภาพสนามในเที่ยวนี้:
              </span>
              <input
                type="text"
                placeholder="เช่น คู่แข่งโยนแก่นชิดเส้นข้าง, แก้เกมด้วยการยิงสองลูก..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddNewMene}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition"
              >
                บันทึก Mène นี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { SavedDrillResult } from '../types/auth';

export interface DrillItem {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  categoryLabel: string;
  difficulty: string;
  difficultyLabel: string;
  difficultyColor: string;
  duration: string;
  targetRepetitions: string;
  repetitionCount: number;
  equipment: string[];
  objective: string;
  setup: string;
  steps: string[];
  scoringBenchmark: {
    bronze: string;
    silver: string;
    gold: string;
  };
  coachingTips: string[];
  videoDemo?: {
    title: string;
    channel: string;
    duration: string;
    videoQuery: string;
    youtubeId?: string;
    keyMoments: string[];
  };
}

interface DrillPracticeModalProps {
  drill: DrillItem;
  isOpen: boolean;
  onClose: () => void;
  onSaveSession: (result: SavedDrillResult) => void;
  initialVideoUrl?: string;
}

// Map known queries/drills to real clean tutorial videos
const YOUTUBE_EMBED_MAP: Record<string, string> = {
  'drill-pointing-plombee': '4_k9JvV_qG8',
  'drill-carreau-distance': '1gWzV3yZk0w',
  'drill-portee-circle': '8m-Q6TqC024',
  'drill-jack-movement': 'Z7g0QvFjXbE',
  'drill-donnee-grid': 'aC0h1hN_mGk',
  'drill-pressure': 'Zf5A3qYqL2g',
  'drill-screw-back': 'Y3z7U5W5m8Y',
};

export const DrillPracticeModal: React.FC<DrillPracticeModalProps> = ({
  drill,
  isOpen,
  onClose,
  onSaveSession,
}) => {
  const [activeTab, setActiveTab] = useState<'practice' | 'video'>('practice');

  // Practice Cockpit State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [countdownMinutes, setCountdownMinutes] = useState<number>(15);

  const [hits, setHits] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [userVideoLink, setUserVideoLink] = useState<string>('');
  const [showVideoPreview, setShowVideoPreview] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHits(0);
      setMisses(0);
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setSessionNotes('');
      setUserVideoLink('');
      setShowVideoPreview(false);
    }
  }, [isOpen, drill.id]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === 'countdown') {
            if (prev <= 1) {
              setIsTimerRunning(false);
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerMode]);

  if (!isOpen) return null;

  const totalThrows = hits + misses;
  const successRate = totalThrows > 0 ? Math.round((hits / totalThrows) * 100) : 0;

  // Grade calculation
  const getGrade = () => {
    if (totalThrows === 0) return { label: 'ยังไม่เริ่มฝึก', color: 'text-slate-400' };
    if (successRate >= 85) return { label: '🥇 ระดับทอง (Gold Medal Mastery)', color: 'text-amber-400' };
    if (successRate >= 70) return { label: '🥈 ระดับเงิน (Silver Standard)', color: 'text-slate-300' };
    if (successRate >= 50) return { label: '🥉 ระดับทองแดง (Bronze Target)', color: 'text-amber-600' };
    return { label: '🎯 กำลังพัฒนา (Needs Repetition)', color: 'text-sky-400' };
  };

  const grade = getGrade();

  // Format timer
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (timerMode === 'countdown' && timerSeconds === 0) {
      setTimerSeconds(countdownMinutes * 60);
    }
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(timerMode === 'countdown' ? countdownMinutes * 60 : 0);
  };

  const handleSave = () => {
    const sessionResult: SavedDrillResult = {
      id: 'session-' + Date.now().toString(36),
      drillId: drill.id,
      drillTitle: drill.title,
      drillCategory: drill.categoryLabel,
      savedAt: new Date().toISOString(),
      progressPct: successRate,
      reps: hits,
      targetReps: totalThrows || drill.repetitionCount,
      notes: sessionNotes || `ฝึกเสร็จสิ้น ${hits}/${totalThrows} ลูก (${successRate}%) เวลา ${formatTime(timerSeconds)}`,
      videoUrl: userVideoLink || undefined,
    };
    onSaveSession(sessionResult);
  };

  // YouTube Embed ID resolution
  const defaultEmbedId = YOUTUBE_EMBED_MAP[drill.id] || '8m-Q6TqC024';

  // Parse user video link
  const getEmbeddableUserVideo = (url: string) => {
    if (!url) return null;
    try {
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        let videoId = '';
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else {
          const params = new URLSearchParams(url.split('?')[1]);
          videoId = params.get('v') || '';
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
    } catch (e) {}
    return null;
  };

  const embeddedUserUrl = getEmbeddableUserVideo(userVideoLink);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 animate-scale-up">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg border border-emerald-400/30 shadow-inner">
              <i className="fa-solid fa-stopwatch-20"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                  {drill.categoryLabel}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  เป้าหมาย: {drill.targetRepetitions}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-heading truncate max-w-[280px] sm:max-w-md">
                {drill.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 hover:bg-slate-700"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'practice'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-stopwatch"></i>
              <span>สนามฝึกซ้อม & ตัวนับแต้ม (Practice Mode)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-play"></i>
              <span>วิดีโอสาธิตเทคนิค (In-App Video)</span>
            </button>
          </div>

          <span className="text-xs font-mono font-bold text-amber-400 hidden sm:inline">
            FIPJP Practice Cockpit
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {activeTab === 'practice' ? (
            <div className="space-y-6">
              {/* Top Cockpit: Timer & Score Gauge Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Timer Card */}
                <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-clock text-amber-400"></i>
                      <span>นาฬิกาจับเวลาการฝึก</span>
                    </span>
                    <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setTimerMode('stopwatch');
                          setIsTimerRunning(false);
                          setTimerSeconds(0);
                        }}
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          timerMode === 'stopwatch' ? 'bg-orange-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        จับเวลาเดินหน้า
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTimerMode('countdown');
                          setIsTimerRunning(false);
                          setTimerSeconds(countdownMinutes * 60);
                        }}
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          timerMode === 'countdown' ? 'bg-orange-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        นับถอยหลัง ({countdownMinutes}m)
                      </button>
                    </div>
                  </div>

                  {/* Big Digital Timer Display */}
                  <div className="text-center py-2">
                    <div className="text-4xl sm:text-5xl font-mono font-black text-amber-400 tracking-wider">
                      {formatTime(timerSeconds)}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {isTimerRunning ? '● กำลังจับเวลาการฝึกซ้อม...' : '⏸ หยุดชั่วคราว'}
                    </span>
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {!isTimerRunning ? (
                      <button
                        type="button"
                        onClick={handleStartTimer}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <i className="fa-solid fa-play"></i>
                        <span>{timerSeconds === 0 ? 'เริ่มจับเวลา' : 'จับเวลาต่อ'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePauseTimer}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <i className="fa-solid fa-pause"></i>
                        <span>พักเวลา</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetTimer}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs transition border border-slate-700"
                    >
                      <i className="fa-solid fa-rotate-left mr-1"></i> รีเซ็ต
                    </button>
                  </div>
                </div>

                {/* 2. Success Rate & Scoring Benchmark Card */}
                <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-chart-line text-emerald-400"></i>
                      <span>อัตราความแม่นยำ (Success Rate)</span>
                    </span>
                    <span className={`text-xs font-bold font-mono ${grade.color}`}>
                      {grade.label}
                    </span>
                  </div>

                  {/* Big Percentage Display */}
                  <div className="text-center py-1">
                    <div className="text-4xl sm:text-5xl font-mono font-black text-white">
                      {successRate}
                      <span className="text-xl text-emerald-400">%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2 border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${successRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Scoring Benchmarks breakdown */}
                  <div className="text-[10px] space-y-1 text-slate-400 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-500">🥉 Bronze:</span>
                      <span className="text-slate-300">{drill.scoringBenchmark.bronze}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">🥈 Silver:</span>
                      <span className="text-slate-300">{drill.scoringBenchmark.silver}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold">🥇 Gold:</span>
                      <span className="text-amber-300">{drill.scoringBenchmark.gold}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Repetition Counter Controls (Big Thumb Friendly Buttons for Mobile Court Use) */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      บันทึกผลแต่ละลูกที่โยน (Shot-by-Shot Counter)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      โยนไปแล้วทั้งหมด: <strong className="text-amber-400">{totalThrows}</strong> / {drill.repetitionCount} ลูก
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHits(0);
                      setMisses(0);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                  >
                    ล้างการนับ
                  </button>
                </div>

                {/* Big Plus Buttons */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
                  {/* Hit / Success Button */}
                  <button
                    type="button"
                    onClick={() => setHits((prev) => prev + 1)}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white font-black shadow-glow-emerald transition duration-150 flex flex-col items-center justify-center gap-1 border border-emerald-400/40"
                  >
                    <div className="flex items-center gap-2 text-base sm:text-lg">
                      <i className="fa-solid fa-circle-check text-xl"></i>
                      <span>+ สำเร็จ (Hit)</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black mt-1">
                      {hits} ลูก
                    </div>
                    <span className="text-[10px] text-emerald-200">เข้าจุดมาร์กเกอร์ / ยิงโดน</span>
                  </button>

                  {/* Miss Button */}
                  <button
                    type="button"
                    onClick={() => setMisses((prev) => prev + 1)}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 active:scale-95 text-slate-300 hover:text-white font-black transition duration-150 flex flex-col items-center justify-center gap-1 border border-slate-700"
                  >
                    <div className="flex items-center gap-2 text-base sm:text-lg">
                      <i className="fa-solid fa-circle-xmark text-xl text-rose-400"></i>
                      <span>+ พลาด (Miss)</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-rose-300 mt-1">
                      {misses} ลูก
                    </div>
                    <span className="text-[10px] text-slate-400">หลุดระยะเป้าหมาย</span>
                  </button>
                </div>

                {/* Subtraction minor buttons */}
                <div className="flex items-center justify-end gap-3 pt-1 text-xs text-slate-400">
                  <span>แก้ไขค่านับ:</span>
                  <button
                    type="button"
                    onClick={() => setHits((prev) => Math.max(0, prev - 1))}
                    className="hover:text-amber-400 underline"
                  >
                    -1 สำเร็จ
                  </button>
                  <button
                    type="button"
                    onClick={() => setMisses((prev) => Math.max(0, prev - 1))}
                    className="hover:text-rose-400 underline"
                  >
                    -1 พลาด
                  </button>
                </div>
              </div>

              {/* Training Notes & Video Attachment Link */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">
                  บันทึกความคิดเห็น & แนบคลิปส่งงานโค้ช (Optional)
                </span>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="เช่น ซ้อมสนามหินคลุก แดดแรง ลมพัดขวาง ยิงระยะ 8.5 เมตรได้ดีขึ้น..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={userVideoLink}
                      onChange={(e) => setUserVideoLink(e.target.value)}
                      placeholder="แนบลิงก์คลิปวิดีโอฝึกของคุณ (เช่น YouTube, TikTok, Drive)..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {userVideoLink && (
                      <button
                        type="button"
                        onClick={() => setShowVideoPreview(!showVideoPreview)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-bold border border-slate-700 transition"
                      >
                        {showVideoPreview ? 'ซ่อนพรีวิว' : 'ทดสอบเล่น'}
                      </button>
                    )}
                  </div>

                  {/* Embedded User Video Preview */}
                  {showVideoPreview && embeddedUserUrl && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-700 aspect-video bg-black">
                      <iframe
                        src={embeddedUserUrl}
                        title="User Practice Video Preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
                >
                  ปิดหน้าต่าง
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-glow-emerald transition duration-200 flex items-center justify-center gap-2 border border-emerald-300/30"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>บันทึกผลการฝึกนี้ ({successRate}%) ลงโปรไฟล์</span>
                </button>
              </div>
            </div>
          ) : (
            /* Video Tab: In-App Embedded Video Player */
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-black aspect-video relative">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${defaultEmbedId}?autoplay=0&rel=0`}
                  title={drill.videoDemo?.title || drill.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    {drill.videoDemo?.title || 'วิดีโอสาธิตเทคนิคการฝึก'}
                  </h4>
                  <span className="text-xs font-mono text-amber-400">
                    {drill.videoDemo?.duration || '5:00 นาที'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  ช่อง: {drill.videoDemo?.channel || 'Petanque Coaching Channel'}
                </p>

                {drill.videoDemo?.keyMoments && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-bold text-slate-300 block">ช่วงเวลาสำคัญ (Key Timestamps):</span>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {drill.videoDemo.keyMoments.map((km, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>{km}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('practice')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                >
                  <i className="fa-solid fa-play"></i>
                  <span>กลับไปหน้าบันทึกผลการฝึก</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

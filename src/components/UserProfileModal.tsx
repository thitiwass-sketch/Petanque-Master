import React, { useState } from 'react';
import { UserAccount, SavedBouleSpec, SavedDrillResult } from '../types/auth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onLogout: () => void;
  onOpenLogin: () => void;
  onLoadSpec: (spec: SavedBouleSpec) => void;
  onDeleteSpec: (specId: string) => void;
  onDeleteDrill: (drillSaveId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onOpenLogin,
  onLoadSpec,
  onDeleteSpec,
  onDeleteDrill,
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'drills'>('specs');

  if (!isOpen) return null;

  const providerLabel = {
    guest: 'โหมดผู้เยี่ยมชม (Guest)',
    google: 'Google Account',
    facebook: 'Facebook Account',
    line: 'LINE Official Account',
  }[user.provider];

  const providerBadgeColor = {
    guest: 'bg-slate-800 text-slate-300 border-slate-700',
    google: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    facebook: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30',
    line: 'bg-[#06C755]/10 text-[#06C755] border-[#06C755]/30',
  }[user.provider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          aria-label="Close modal"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* User Profile Header Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-800 shrink-0">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500/40 shadow-lg"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${
                user.provider === 'google'
                  ? 'bg-blue-500'
                  : user.provider === 'facebook'
                  ? 'bg-[#1877F2]'
                  : user.provider === 'line'
                  ? 'bg-[#06C755]'
                  : 'bg-slate-600'
              }`}
            >
              {user.provider === 'google' ? 'G' : user.provider === 'facebook' ? 'f' : user.provider === 'line' ? 'L' : '👤'}
            </span>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 className="text-xl font-black text-white font-heading">{user.displayName}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${providerBadgeColor}`}>
                {providerLabel}
              </span>
            </div>

            {user.email && (
              <p className="text-xs text-slate-400 font-mono mb-2">{user.email}</p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 font-medium">
                🎯 สเปกลูกที่บันทึกไว้: <strong>{user.savedSpecs.length}</strong> รายการ
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 font-medium">
                🏅 ผลการฝึกที่บันทึกไว้: <strong>{user.savedDrills.length}</strong> ครั้ง
              </span>
              {user.migratedFromGuest && (
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 font-medium text-[11px] flex items-center gap-1">
                  <i className="fa-solid fa-cloud-arrow-up text-purple-400" aria-hidden="true"></i>
                  <span>ผสานข้อมูลจาก Guest สำเร็จ</span>
                </span>
              )}
              {!user.isGuest && user.cloudSyncedAt && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
                  <span>Cloud Synced</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            {user.isGuest ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
              >
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
                <span>เข้าสู่ระบบเพื่อซิงค์</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                <span>สลับเป็น Guest</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 pb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'specs'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-calculator"></i>
            <span>สเปกลูกเปตองของฉัน ({user.savedSpecs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drills')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'drills'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-bullseye"></i>
            <span>ประวัติผลการฝึกซ้อม ({user.savedDrills.length})</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
          {activeTab === 'specs' && (
            <>
              {user.savedSpecs.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3 text-xl">
                    <i className="fa-solid fa-calculator"></i>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">ยังไม่มีสเปกลูกเปตองที่บันทึกไว้</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    ไปที่ส่วน Petanque Finder Calculator ปรับขนาดฝ่ามือและตำแหน่ง แล้วกดปุ่ม "บันทึกสเปกของฉัน"
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition"
                  >
                    ไปที่เครื่องคำนวณสเปกลูก
                  </button>
                </div>
              ) : (
                user.savedSpecs.map((spec) => (
                  <div
                    key={spec.id}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-amber-400 font-mono">
                          Ø {spec.diameter} mm • {spec.weight} g
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">
                          {spec.playerRole === 'pointer' ? 'มือเข้า' : spec.playerRole === 'shooter' ? 'มือตี' : 'มือกลาง'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(spec.savedAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {spec.material} • ความแข็ง {spec.hardness} ({spec.hardnessVal})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ฝ่ามือ {spec.handLength}mm • ความแม่นยำสรีระ {spec.fitPercent}%
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadSpec(spec);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                        title="โหลดการตั้งค่านี้กลับเข้าสู่เครื่องคำนวณ"
                      >
                        <i className="fa-solid fa-rotate-right"></i>
                        <span>โหลดลงเครื่องคำนวณ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSpec(spec.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-xs transition"
                        title="ลบสเปกนี้"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'drills' && (
            <>
              {user.savedDrills.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-xl">
                    <i className="fa-solid fa-bullseye"></i>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">ยังไม่มีประวัติการฝึกซ้อมที่บันทึกไว้</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    ไปที่ส่วน Drill Library หรือ Drill Tracker ฝึกซ้อมนับจำนวนลูก แล้วกดปุ่ม "บันทึกผลการฝึก"
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                  >
                    ไปที่คลังแบบฝึกซ้อม
                  </button>
                </div>
              ) : (
                user.savedDrills.map((drill) => (
                  <div
                    key={drill.id}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {drill.drillTitle}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(drill.savedAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400 font-mono">
                        ความสำเร็จ: {drill.reps} / {drill.targetReps} ครั้ง ({drill.progressPct}%)
                      </p>
                      {drill.videoUrl && (
                        <a
                          href={drill.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <i className="fa-solid fa-video text-[10px]"></i>
                          <span>{drill.videoUrl}</span>
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteDrill(drill.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-xs transition"
                      title="ลบรายการนี้"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

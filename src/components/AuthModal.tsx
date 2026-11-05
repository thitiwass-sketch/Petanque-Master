import React, { useState } from 'react';
import { AuthProvider, SavedBouleSpec, SavedDrillResult } from '../types/auth';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'save_spec' | 'save_drill' | 'general_login';
  pendingSpec?: Partial<SavedBouleSpec> | null;
  pendingDrill?: Partial<SavedDrillResult> | null;
  onLoginSuccess?: (provider: AuthProvider) => void;
  onSaveAsGuest?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  reason = 'general_login',
  pendingSpec,
  pendingDrill,
  onLoginSuccess,
  onSaveAsGuest,
}) => {
  const {
    currentUser,
    loginWithGoogle,
    loginWithFacebook,
    loginWithLine,
    continueAsGuest,
    isLoading,
    loadingProvider,
    authError,
    clearAuthError,
  } = useAuth();

  const [customNameInput, setCustomNameInput] = useState('');
  const [showCustomGuestInput, setShowCustomGuestInput] = useState(false);

  if (!isOpen) return null;

  const handleProviderLogin = async (provider: 'google' | 'facebook' | 'line') => {
    clearAuthError();
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else if (provider === 'facebook') {
        await loginWithFacebook();
      } else if (provider === 'line') {
        await loginWithLine();
      }
      if (onLoginSuccess) {
        onLoginSuccess(provider);
      }
      onClose();
    } catch (e) {
      // Error handled by AuthContext state
    }
  };

  const handleGuestSaveClick = () => {
    if (showCustomGuestInput && customNameInput.trim()) {
      continueAsGuest(customNameInput.trim());
    } else {
      continueAsGuest();
    }
    if (onSaveAsGuest) {
      onSaveAsGuest();
    }
    onClose();
  };

  const guestSpecsCount = currentUser.savedSpecs.length;
  const guestDrillsCount = currentUser.savedDrills.length;
  const hasLocalDataToMigrate = currentUser.isGuest && (guestSpecsCount > 0 || guestDrillsCount > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button with 44x44px hitbox */}
        <button
          onClick={onClose}
          type="button"
          disabled={isLoading}
          className="absolute top-5 right-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50"
          aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
        >
          <i className="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
        </button>

        {/* Header Badge & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold mb-3">
            <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
            <span>ยืนยันตัวตนจริง & ซิงค์ข้อมูลคลาวด์ (OAuth Identity)</span>
          </div>

          <h3 id="auth-modal-title" className="text-2xl font-black text-white font-heading">
            {reason === 'save_spec'
              ? 'บันทึกสเปกลูกเปตองของคุณ'
              : reason === 'save_drill'
              ? 'บันทึกสถิติผลการฝึกซ้อม'
              : 'เข้าสู่ระบบ PetanquePro'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            {reason === 'save_spec'
              ? 'เลือกเชื่อมต่อบัญชีโซเชียลเพื่อเก็บสเปกลูกไว้เปิดดูบนทุกอุปกรณ์ หรือบันทึกลงในเครื่องนี้ในฐานะ Guest'
              : reason === 'save_drill'
              ? 'เชื่อมต่อบัญชีจริงเพื่อบันทึกประวัติความแม่นยำและสถิติการโยน พร้อมซิงค์ข้อมูลข้ามอุปกรณ์ทันที'
              : 'เชื่อมต่อบัญชีผ่าน Google, Facebook หรือ LINE เพื่อเปิดใช้งานโปรไฟล์นักกีฬาเต็มรูปแบบ'}
          </p>
        </div>

        {/* Error Alert Banner */}
        {authError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-rose-400 text-base shrink-0" aria-hidden="true"></i>
              <div>
                <strong className="block font-bold">การยืนยันตัวตนไม่สำเร็จ:</strong>
                <span className="text-[11px] text-rose-300">{authError.message}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={clearAuthError}
              className="text-rose-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-rose-500/20"
              aria-label="ปิดข้อความแจ้งเตือน"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Guest Data Migration Notice (Account Linking Banner) */}
        {hasLocalDataToMigrate && (
          <div className="mb-5 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3 text-xs text-purple-200">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 text-sm">
              <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
            </div>
            <div>
              <strong className="block font-bold text-white">ตรวจพบข้อมูลในโหมด Guest:</strong>
              <span className="text-[11px] text-purple-300">
                คุณมี {guestSpecsCount > 0 ? `${guestSpecsCount} สเปก` : ''}
                {guestSpecsCount > 0 && guestDrillsCount > 0 ? ' และ ' : ''}
                {guestDrillsCount > 0 ? `${guestDrillsCount} บันทึกการฝึก` : ''} ในเครื่อง ระบบจะผสาน (Merge) ขึ้นบัญชีคลาวด์ให้อัตโนมัติเมื่อเข้าสู่ระบบ
              </span>
            </div>
          </div>
        )}

        {/* Pending Item Preview Card (if saving) */}
        {reason === 'save_spec' && pendingSpec && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                <i className="fa-solid fa-calculator" aria-hidden="true"></i>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  สเปกที่กำลังจะบันทึก
                </span>
                <span className="text-sm font-extrabold text-white">
                  Ø {pendingSpec.diameter} mm • {pendingSpec.weight} g
                </span>
                <span className="text-xs text-slate-300 block">
                  {pendingSpec.playerRole === 'pointer' ? 'มือเข้า (Pointer)' : pendingSpec.playerRole === 'shooter' ? 'มือตี (Shooter)' : 'มือกลาง (Milieu)'} • ความแม่นยำสรีระ {pendingSpec.fitPercent}%
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold">
              พร้อมบันทึก
            </span>
          </div>
        )}

        {reason === 'save_drill' && pendingDrill && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                <i className="fa-solid fa-bullseye" aria-hidden="true"></i>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  ผลการฝึกที่กำลังจะบันทึก
                </span>
                <span className="text-sm font-extrabold text-white">
                  {pendingDrill.drillTitle || 'แบบฝึกซ้อม'}
                </span>
                <span className="text-xs text-slate-300 block">
                  ทำได้ {pendingDrill.reps || 0} / {pendingDrill.targetReps || 10} ครั้ง ({pendingDrill.progressPct || 0}%)
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-bold">
              พร้อมบันทึก
            </span>
          </div>
        )}

        {/* Real OAuth Social Login Buttons - Google, Facebook, LINE */}
        <div className="space-y-3 mb-6">
          {/* Google Sign-In with real GIS OAuth flow */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleProviderLogin('google')}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-800 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {loadingProvider === 'google' ? (
              <span className="flex items-center gap-2 text-slate-700">
                <i className="fa-solid fa-circle-notch animate-spin text-orange-600 text-base" aria-hidden="true"></i>
                <span>กำลังเชื่อมต่อ Google OAuth...</span>
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.27-2.09 3.645-5.17 3.645-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.72-2.1-6.66-4.92H1.31v3.13C3.34 21.36 7.38 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.34 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.31C.48 8.24 0 10.06 0 12s.48 3.76 1.31 5.41l4.03-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.38 0 3.34 2.64 1.31 6.59l4.03 3.13c.94-2.82 3.56-4.97 6.66-4.97z"
                  />
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </>
            )}
          </button>

          {/* Facebook Login with real SDK dialog */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleProviderLogin('facebook')}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-60 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {loadingProvider === 'facebook' ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-circle-notch animate-spin text-white text-base" aria-hidden="true"></i>
                <span>กำลังเชื่อมต่อ Facebook SDK...</span>
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>เข้าสู่ระบบด้วย Facebook</span>
              </>
            )}
          </button>

          {/* LINE Login with Channel API dialog */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleProviderLogin('line')}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#06C755] hover:bg-[#05b54c] disabled:opacity-60 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {loadingProvider === 'line' ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-circle-notch animate-spin text-white text-base" aria-hidden="true"></i>
                <span>กำลังเชื่อมต่อ LINE Channel API...</span>
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.035 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.646 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.573-3.844 2.573-5.993zm-14.887 2.875h-2.127a.532.532 0 0 1-.532-.532V7.473a.532.532 0 0 1 .532-.532h2.127a.532.532 0 0 1 .532.532v.532a.532.532 0 0 1-.532.532h-1.595v1.064h1.595a.532.532 0 0 1 .532.532v.532a.532.532 0 0 1-.532.532zm3.19 0h-.532a.532.532 0 0 1-.532-.532V7.473a.532.532 0 0 1 .532-.532h.532a.532.532 0 0 1 .532.532v5.174a.532.532 0 0 1-.532.532zm4.786 0h-.532a.532.532 0 0 1-.442-.236l-2.213-3.097v2.801a.532.532 0 0 1-.532.532h-.532a.532.532 0 0 1-.532-.532V7.473a.532.532 0 0 1 .532-.532h.532a.532.532 0 0 1 .442.236l2.213 3.097V7.473a.532.532 0 0 1 .532-.532h.532a.532.532 0 0 1 .532.532v5.174a.532.532 0 0 1-.532.532zm3.722-3.045a.532.532 0 0 1-.532.532h-1.595v1.449h1.595a.532.532 0 0 1 .532.532v.532a.532.532 0 0 1-.532.532h-2.127a.532.532 0 0 1-.532-.532V7.473a.532.532 0 0 1 .532-.532h2.127a.532.532 0 0 1 .532.532v.532a.532.532 0 0 1-.532.532h-1.595v1.064h1.595a.532.532 0 0 1 .532.532v.532z" />
                </svg>
                <span>เข้าสู่ระบบด้วย LINE</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
            หรือบันทึกในโหมด Guest
          </span>
        </div>

        {/* Guest Local Save Action with 44px min-h */}
        <div className="space-y-3">
          {showCustomGuestInput && (
            <div className="mb-2">
              <label htmlFor="custom-guest-name" className="text-xs font-bold text-slate-300 block mb-1">
                ชื่อผู้เล่นที่คุณต้องการแสดง (Optional):
              </label>
              <input
                id="custom-guest-name"
                type="text"
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                placeholder="เช่น สมชาย นักแม่นเป้า, ปอนด์ ปืนกล..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleGuestSaveClick}
            disabled={isLoading}
            className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <i className="fa-solid fa-hard-drive text-amber-400" aria-hidden="true"></i>
            <span>⚡ บันทึกลงในเครื่องนี้ต่อไปในฐานะ Guest (Local Storage)</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>*โหมด Guest ข้อมูลจะถูกเก็บในเบราว์เซอร์เครื่องนี้</span>
            <button
              type="button"
              onClick={() => setShowCustomGuestInput(!showCustomGuestInput)}
              className="text-amber-400 hover:underline"
            >
              {showCustomGuestInput ? 'ซ่อนชื่อกำหนดเอง' : 'ตั้งชื่อผู้เล่น'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

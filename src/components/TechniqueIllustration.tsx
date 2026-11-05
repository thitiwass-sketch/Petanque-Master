import React, { useState } from 'react';
import superBouleImg from '../assets/images/petanque_grip_perfect_1792806070756.jpg';
import stanceRealImg from '../assets/images/thai_stance_athlete_1792805664319.jpg';

interface TechniqueIllustrationProps {
  id: string;
  expanded?: boolean;
  className?: string;
}

export const TechniqueIllustration: React.FC<TechniqueIllustrationProps> = ({
  id,
  expanded = false,
  className = ''
}) => {
  // Dynamic height based on whether technique is grip/stance or expanded
  const heightClass = expanded
    ? id === 'grip' || id === 'stance'
      ? 'min-h-[560px] sm:min-h-[620px] p-0'
      : 'h-64 sm:h-80 md:h-96'
    : id === 'grip' || id === 'stance'
    ? 'h-[370px] sm:h-[410px]'
    : 'h-48 sm:h-52';

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-inner group flex items-center justify-center select-none ${className}`}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.25) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      ></div>

      {/* Render Specific Technique Diagram */}
      {id === 'grip' && <GripIllustration expanded={expanded} />}
      {id === 'stance' && <StanceIllustration expanded={expanded} />}
      {id === 'rolling' && <RollingIllustration expanded={expanded} />}
      {id === 'demi-portee' && <DemiPorteeIllustration expanded={expanded} />}
      {id === 'high-lob' && <HighLobIllustration expanded={expanded} />}
      {id === 'carreau' && <CarreauIllustration expanded={expanded} />}
      {id === 'direct-hit' && <DirectHitIllustration expanded={expanded} />}
      {id === 'screw-back' && <ScrewBackIllustration expanded={expanded} />}
      {id === 'backspin-mastery' && <BackspinMasteryIllustration expanded={expanded} />}
      {id === 'measuring-rules' && <MeasuringRulesIllustration expanded={expanded} />}
      {id === 'fipjp-official-rules' && <FipjpRulesIllustration expanded={expanded} />}
      {id === 'tournament-formats' && <TournamentFormatsIllustration expanded={expanded} />}

      {/* Floating Badge Indicator (only shown if not handled internally by Grip & Stance illustrations) */}
      {id !== 'grip' && id !== 'stance' && (
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-bold text-slate-300 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          <span>{expanded ? 'ภาพวิเคราะห์เชิงเทคนิคและสรีระ' : 'แผนภาพเชิงเทคนิค'}</span>
        </div>
      )}
    </div>
  );
};

/* Common SVG Definitions for consistency across all sub-illustrations */
const CommonDefs: React.FC = () => (
  <defs>
    <radialGradient id="bouleMetalCommon" cx="38%" cy="32%" r="68%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="22%" stopColor="#cbd5e1" />
      <stop offset="55%" stopColor="#64748b" />
      <stop offset="85%" stopColor="#334155" />
      <stop offset="100%" stopColor="#0f172a" />
    </radialGradient>
    <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M1 1 L7 4 L1 7 Z" fill="#38bdf8" />
    </marker>
    <marker id="arrowAmber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M1 1 L7 4 L1 7 Z" fill="#f59e0b" />
    </marker>
    <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M1 1 L7 4 L1 7 Z" fill="#22c55e" />
    </marker>
    <filter id="glowCommon" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
);

/* -------------------------------------------------------------
   1. GRIP MECHANICS ILLUSTRATION (Authentic Coaching Photography)
   Featuring user's real photographic demonstration across 3 key angles
   ------------------------------------------------------------- */
export interface HotspotMarker {
  id: string;
  category: 'technique' | 'equipment';
  top: string;
  left: string;
  label: string;
  sublabel: string;
  type: 'good' | 'warn' | 'info';
  icon: string;
}

interface GripAngleData {
  id: string;
  title: string;
  shortTitle: string;
  shortLabel: string;
  src: string;
  alt: string;
  keyRule: string;
  ruleType: 'good' | 'warn' | 'info';
  isSuperBoule?: boolean;
  bouleModel?: string;
  description: string;
  proTip: string;
  markers: HotspotMarker[];
}

const GRIP_ANGLES: GripAngleData[] = [
  {
    id: 'super-match',
    title: 'ลูกซุปเปอร์แข่งขัน FIPJP: ลายร่องคู่ & ผิวคาร์บอนดำด้าน (Super Match Striated Edition)',
    shortTitle: '⭐ ลูกซุปเปอร์ (Super Match)',
    shortLabel: '⭐ ซุปเปอร์',
    src: superBouleImg,
    alt: 'ภาพลูกเปตองซุปเปอร์แข่งขัน FIPJP ลายร่องคู่ สเตนเลสและคาร์บอนสตีล พร้อมการจับ 4 นิ้วมาตรฐาน',
    keyRule: '✓ ลูกซุปเปอร์ลายร่องคู่ (Twin Striations): เพิ่มแรงยึดเกาะปลายนิ้ว +25% สร้าง Backspin สกรูถอยหลัง',
    ruleType: 'good',
    isSuperBoule: true,
    bouleModel: 'Super Match FIPJP (ลายร่องคู่)',
    description:
      'ลูกเปตองซุปเปอร์ (Super Boule) รุ่นแข่งขันมาตรฐานสากล FIPJP โดดเด่นด้วยลายร่องคู่ขนาน (Twin Striations) ที่กลึงด้วยเทคโนโลยีความแม่นยำสูง ช่วยให้ 4 ปลายนิ้วเกาะผิวลูกได้แน่นโดยไม่ต้องออกแรงบีบ ผิวคาร์บอนดำด้านช่วยตัดแสงสะท้อนและสร้างแรงเสียดทานสูงสุดเพื่อการสะบัดหมุนลูกสกรูถอยหลัง (Screw Back) และหยุดสนิท (Carreau)',
    proTip: 'ร่องลายคู่ของลูกซุปเปอร์ทำหน้าที่ดักเม็ดทรายและฝุ่นในสนาม ทำให้ลูกหยุดสนิทบนพื้นหินกรวดดีกว่าลูกเกลี้ยงอย่างเห็นได้ชัด',
    markers: [
      {
        id: 'sm-fingers',
        category: 'technique',
        top: '56%',
        left: '59%',
        label: 'นิ้วกลาง นิ้วนาง นิ้วก้อย ชิดกันตรงข้อพับแรก',
        sublabel: 'นิ้วเรียงชิดติดกันสนิท สวยงาม รองรับน้ำหนักตรงรอยพับข้อนิ้วแรก เพื่อปล่อยลูกได้ราบรื่นและสร้างรอบหมุนสูงสุด',
        type: 'good',
        icon: 'fa-hand'
      },
      {
        id: 'sm-thumb',
        category: 'technique',
        top: '27%',
        left: '53%',
        label: 'นิ้วโป้งประคองข้าง',
        sublabel: 'วางแนบข้างลูกเบาๆ ไม่กดบีบ เพื่อป้องกันวิถีลูกเลี้ยว',
        type: 'info',
        icon: 'fa-thumbs-up'
      },
      {
        id: 'sm-airgap',
        category: 'technique',
        top: '67%',
        left: '42%',
        label: 'Air Gap (ช่องว่างฝ่ามือ)',
        sublabel: 'เว้นระยะห่างระหว่างลูกเปตองกับอุ้งมือ 1-2 ซม. ไม่กำแน่นติดก้นฝ่ามือ',
        type: 'good',
        icon: 'fa-circle-dot'
      },
      {
        id: 'sm-grooves',
        category: 'equipment',
        top: '41%',
        left: '52%',
        label: 'ร่องลายคู่ซุปเปอร์ (Twin Striations)',
        sublabel: 'ร่องกลึงคู่เพิ่มแรงเสียดทานกับปลายนิ้ว +25% สร้าง Backspin สกรูถอยหลัง',
        type: 'good',
        icon: 'fa-bolt'
      },
      {
        id: 'sm-finish',
        category: 'equipment',
        top: '47%',
        left: '63%',
        label: 'ผิวสัมผัสสตีลแข่งขัน FIPJP',
        sublabel: 'ผิวกลึงความละเอียดสูง สัมผัสแน่นหนึบมือ ปล่อยลูกแม่นยำ',
        type: 'info',
        icon: 'fa-shield-halved'
      }
    ]
  },
  {
    id: 'outdoor-front',
    title: 'มุมที่ 1: การวาง 4 นิ้วชิดตรงข้อนิ้วแรก & สัมผัสธรรมชาติ (Front Palm Grip)',
    shortTitle: '1. หน้าฝ่ามือ (IMG_2042)',
    shortLabel: '1. หน้ามือ',
    src: '/assets/aistudio/IMG_2042_41257190.JPG',
    alt: 'ภาพถ่ายจริงกลางแจ้ง แสงธรรมชาติ: การวาง 4 นิ้วชิดตรงรอยพับข้อนิ้วแรกของลูกเปตอง',
    keyRule: '✓ 4 นิ้วเรียงชิดขนานตรงรอยพับแรก + อุ้งมือโปร่งมีช่องว่าง Air Gap 1-2 ซม.',
    ruleType: 'good',
    bouleModel: 'Super Edition (ลายร่องคู่)',
    description:
      'ภาพถ่ายจริงความละเอียดสูงกลางแจ้ง แสดงการจัดระเบียบนิ้วชี้ กลาง นาง ก้อย เรียงชิดขนานรับน้ำหนักลูกเปตองตรงรอยพับข้อนิ้วแรก โดยนิ้วหัวแม่มือประคองข้างอย่างผ่อนคลาย และอุ้งมือโปร่งไม่กำแน่นติดก้นฝ่ามือ เพื่อให้ปล่อยลูกหลุดมือได้อย่างราบรื่นและนุ่มนวล',
    proTip: 'แสงธรรมชาติสะท้อนความโค้งมนของลูกเปตอง ช่วยให้เห็นจุดสัมผัสน้ำหนักบนข้อนิ้วแรกได้อย่างชัดเจนที่สุด',
    markers: [
      {
        id: 'of-fingers',
        category: 'technique',
        top: '44%',
        left: '17%',
        label: '4 นิ้วชิดตรงข้อพับแรก',
        sublabel: 'เรียงชิดติดกัน ไม่กางนิ้วออก รองรับน้ำหนักลูก',
        type: 'good',
        icon: 'fa-hand'
      },
      {
        id: 'of-balance',
        category: 'technique',
        top: '54%',
        left: '44%',
        label: 'จุดรับน้ำหนักสมดุล (Air Gap)',
        sublabel: 'ลูกวางสมดุล ไม่กำแน่นติดก้นฝ่ามือ เว้นระยะ 1-2 ซม.',
        type: 'good',
        icon: 'fa-circle-dot'
      },
      {
        id: 'of-thumb',
        category: 'technique',
        top: '22%',
        left: '38%',
        label: 'นิ้วโป้งประคองข้าง',
        sublabel: 'พักสบาย ไม่ใช้แรงกดบีบ ป้องกันลูกสะบัดเลี้ยว',
        type: 'info',
        icon: 'fa-thumbs-up'
      },
      {
        id: 'of-wrist',
        category: 'technique',
        top: '72%',
        left: '72%',
        label: 'แนวข้อมือผ่อนคลาย',
        sublabel: 'ส่งแรงเหวี่ยงจากหัวไหล่เป็นลูกตุ้ม ไม่เกร็งข้อมือ',
        type: 'info',
        icon: 'fa-arrow-trend-up'
      },
      {
        id: 'of-grooves',
        category: 'equipment',
        top: '36%',
        left: '52%',
        label: 'ร่องลายคู่ซุปเปอร์ (Twin Striations)',
        sublabel: 'แนวร่องกลึงคู่ ช่วยสร้างแรงยึดเกาะกับปลายนิ้ว +25%',
        type: 'good',
        icon: 'fa-bolt'
      },
      {
        id: 'of-fipjp',
        category: 'equipment',
        top: '60%',
        left: '30%',
        label: 'ตราแข่งขัน FIPJP 72/690',
        sublabel: 'ขนาดและน้ำหนักมาตรฐาน FIPJP Homologated',
        type: 'info',
        icon: 'fa-certificate'
      }
    ]
  },
  {
    id: 'outdoor-back',
    title: 'มุมที่ 2: มุมมองหลังมือ & แนวนิ้วโป้งประคองข้าง (Top / Side Alignment)',
    shortTitle: '2. หลังมือ & สวิง (IMG_2043)',
    shortLabel: '2. หลังมือ',
    src: '/assets/aistudio/IMG_2043_1ed72956.JPG',
    alt: 'ภาพถ่ายจริงกลางแจ้ง: มุมมองหลังมือและแนวนิ้วหัวแม่มือประคองข้างลูกเปตอง',
    keyRule: '✓ นิ้วโป้งพักแนบข้างเบาๆ ไม่บีบลูก + แนวข้อมือตรงระดับเดียวกับแขน',
    ruleType: 'good',
    description:
      'ภาพถ่ายจริงมุมบนหลังมือ แสดงแนวแขนและข้อมือที่ตรงเป็นระนาบเดียวกับแนวแกว่งสวิง นิ้วโป้งวางแนบด้านข้างของลูกโดยไม่ใช้แรงกด เพื่อป้องกันไม่ให้ลูกถูกผลักเฉไปทางซ้ายหรือขวาขณะปล่อยลูก',
    proTip: 'การจัดแนวหลังมือและแขนให้ตรงระนาบลูกตุ้ม เป็นกุญแจสำคัญในการควบคุมเส้นทางวิถีลูกให้ตรงเป้าหมาย 100%',
    markers: [
      {
        id: 'ob-thumb',
        category: 'technique',
        top: '44%',
        left: '26%',
        label: 'นิ้วโป้งพักแนบข้าง',
        sublabel: 'ประคองทิศทางเบาๆ ไม่กดบีบลูก',
        type: 'good',
        icon: 'fa-thumbs-up'
      },
      {
        id: 'ob-arm',
        category: 'technique',
        top: '32%',
        left: '58%',
        label: 'แนวหลังมือและระนาบแขน',
        sublabel: 'ตรงแนวเดียวกับทิศทางปล่อยลูก',
        type: 'good',
        icon: 'fa-ruler-combined'
      },
      {
        id: 'ob-fingers',
        category: 'technique',
        top: '74%',
        left: '18%',
        label: '4 ปลายนิ้วรองรับใต้ลูก',
        sublabel: 'พร้อมดีดสร้างแรงหมุน Backspin',
        type: 'info',
        icon: 'fa-hand'
      },
      {
        id: 'ob-swing',
        category: 'technique',
        top: '64%',
        left: '78%',
        label: 'แกนสวิงลูกตุ้ม',
        sublabel: 'แกว่งขึ้นลงตรงระนาบ ไม่บิดข้อมือ',
        type: 'info',
        icon: 'fa-arrows-up-down'
      },
      {
        id: 'ob-grooves',
        category: 'equipment',
        top: '56%',
        left: '46%',
        label: 'ลายร่องคู่ก้นลูกเปตอง',
        sublabel: 'ร่องลายรอบลูกช่วยเบรกจับทรายเมื่อลูกตกกระทบพื้น',
        type: 'good',
        icon: 'fa-bolt'
      }
    ]
  },
  {
    id: 'airgap',
    title: 'มุมที่ 3: ช่องว่างอุ้งมือ Air Gap & การกระจายน้ำหนัก (Palm Clearance)',
    shortTitle: '3. ช่องว่าง Air Gap',
    shortLabel: '3. Air Gap',
    src: '/assets/aistudio/IMG_2020_ec69db95.jpg',
    alt: 'ภาพถ่ายจริงสาธิตการจับลูกเปตอง: ช่องว่างระหว่างลูกกับฝ่ามือ (Air Gap)',
    keyRule: '✓ รักษาระยะ Air Gap 1-2 ซม. ห้ามกำลูกแน่นติดก้นฝ่ามือเด็ดขาด',
    ruleType: 'good',
    description:
      'เปิดฝ่ามือให้อิสระ ต้องมีช่องว่าง (Air Gap) ประมาณ 1-2 ซม. ระหว่างลูกเปตองกับฝ่ามือด้านใน ไม่ให้เกิดแรงเสียดทานหน่วงลูก ทำให้ปล่อยลูกหลุดจากมือได้อย่างราบรื่นและนุ่มนวลที่สุด',
    proTip: 'ลูกเปตองจะตั้งอยู่บนปลายนิ้ว 4 นิ้ว โดยไม่สัมผัสก้นฝ่ามือ ทำให้จังหวะปล่อยลูกหลุดมือได้อย่างอิสระตามแรงเหวี่ยง',
    markers: [
      {
        id: 'ag-gap',
        category: 'technique',
        top: '52%',
        left: '32%',
        label: 'Air Gap (ช่องว่างอุ้งมือ)',
        sublabel: 'เว้นระยะ 1-2 ซม. ไม่กำลูกแน่นติดฝ่ามือ',
        type: 'good',
        icon: 'fa-wind'
      },
      {
        id: 'ag-weight',
        category: 'technique',
        top: '16%',
        left: '58%',
        label: 'จุดรับน้ำหนักลูกเปตอง',
        sublabel: 'ถ่ายน้ำหนักผ่าน 4 ปลายนิ้วอย่างสมดุล',
        type: 'info',
        icon: 'fa-scale-balanced'
      },
      {
        id: 'ag-warn',
        category: 'technique',
        top: '74%',
        left: '20%',
        label: '✕ ห้ามกำติดก้นฝ่ามือ',
        sublabel: 'จะทำให้ปล่อยลูกสะดุด ทิศทางแกว่งควบคุมยาก',
        type: 'warn',
        icon: 'fa-triangle-exclamation'
      },
      {
        id: 'ag-metal',
        category: 'equipment',
        top: '32%',
        left: '68%',
        label: 'สมดุลน้ำหนักลูกแข่งขัน',
        sublabel: 'น้ำหนักลูกกระจายสมดุลสม่ำเสมอทั่วทรงกลม',
        type: 'info',
        icon: 'fa-circle-dot'
      }
    ]
  },
  {
    id: 'knuckles',
    title: 'มุมที่ 4: ซูมรายละเอียด 4 นิ้วขนานชิดใต้ลูก (Curled Knuckles Macro)',
    shortTitle: '4. ข้อพับ 4 นิ้วชิด',
    shortLabel: '4. นิ้วชิด',
    src: '/assets/aistudio/IMG_2022_a3c57e29.jpg',
    alt: 'ภาพถ่ายจริงสาธิตการจับลูกเปตอง: การวาง 4 นิ้วชิดกันตรงรอยพับแรกของนิ้ว',
    keyRule: '✓ 4 นิ้วเรียงชิดขนาน ไม่กางนิ้วออก (ลูกสัมผัสตรงรอยพับข้อนิ้วแรก)',
    ruleType: 'good',
    description:
      'ลูกเปตองวางพาดบนรอยพับข้อนิ้วแรกของนิ้วชี้ กลาง นาง และก้อย โดยนิ้วทั้งหมดเรียงชิดติดกัน ไม่กางนิ้วออก เพื่อให้สามารถควบคุมทิศทางตรงเป๊ะและสร้างแรงสะบัดหมุนถอยหลัง (Backspin) ได้อย่างเสถียร',
    proTip: 'ปลายนิ้วทั้งสี่จะเป็นตัวนำวิถีและสะบัดแรงหมุน หากกางนิ้วออกลูกจะแกว่งและควบคุมระยะตกได้ยาก',
    markers: [
      {
        id: 'kn-close',
        category: 'technique',
        top: '22%',
        left: '32%',
        label: '4 นิ้วชิดตรงข้อพับแรก',
        sublabel: 'เรียงชิดขนาน ไม่กางนิ้วออก สัมผัสรอยพับแรก',
        type: 'good',
        icon: 'fa-hand'
      },
      {
        id: 'kn-thumb',
        category: 'technique',
        top: '48%',
        left: '70%',
        label: 'นิ้วโป้งประคองข้าง',
        sublabel: 'พักสบาย ไม่ใช้แรงกดบีบลูก',
        type: 'info',
        icon: 'fa-thumbs-up'
      },
      {
        id: 'kn-backspin',
        category: 'technique',
        top: '66%',
        left: '18%',
        label: 'แรงส่ง Backspin ↺',
        sublabel: 'ลูกหมุนกลิ้งหลุดออกจาก 4 ปลายนิ้วอย่างสม่ำเสมอ',
        type: 'good',
        icon: 'fa-rotate-left'
      },
      {
        id: 'kn-groove',
        category: 'equipment',
        top: '38%',
        left: '42%',
        label: 'สัมผัสร่องลายซุปเปอร์',
        sublabel: 'ร่องลายให้แรงต้านพอดีกับผิวปลายนิ้ว',
        type: 'good',
        icon: 'fa-bolt'
      }
    ]
  }
];

const GripIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => {
  const [selectedAngleIndex, setSelectedAngleIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'focused' | 'compare'>('focused');
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<'technique' | 'equipment'>('technique');
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [superFinish] = useState<'carbone' | 'inox'>('carbone');

  const currentAngle = GRIP_ANGLES[selectedAngleIndex];
  const visibleMarkers = currentAngle.markers.filter(
    (m) => m.category === activeCategory
  );
  const activeMarker = visibleMarkers.find((m) => m.id === activeHotspotId) || null;

  const techCount = currentAngle.markers.filter((m) => m.category === 'technique').length;
  const equipCount = currentAngle.markers.filter((m) => m.category === 'equipment').length;

  const handlePrevHotspot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (visibleMarkers.length === 0) return;
    const currentIndex = visibleMarkers.findIndex((m) => m.id === activeHotspotId);
    const prevIndex = currentIndex <= 0 ? visibleMarkers.length - 1 : currentIndex - 1;
    setActiveHotspotId(visibleMarkers[prevIndex].id);
  };

  const handleNextHotspot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (visibleMarkers.length === 0) return;
    const currentIndex = visibleMarkers.findIndex((m) => m.id === activeHotspotId);
    const nextIndex = currentIndex >= visibleMarkers.length - 1 ? 0 : currentIndex + 1;
    setActiveHotspotId(visibleMarkers[nextIndex].id);
  };

  // Compare Mode: Grid layout
  if (expanded && viewMode === 'compare') {
    return (
      <div className="w-full h-full p-4 flex flex-col justify-between bg-slate-950 text-white">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>เปรียบเทียบภาพถ่ายจริงครบทุกมุมมอง • โหมดลูกซุปเปอร์ (Super Boule Gallery)</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setViewMode('focused')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i>
            <span>ดูเจาะลึกแบบทีละมุม (Focused View)</span>
          </button>
        </div>

        {/* 5-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1 overflow-y-auto">
          {GRIP_ANGLES.map((angle, idx) => (
            <div
              key={angle.id}
              onClick={() => {
                setSelectedAngleIndex(idx);
                setActiveHotspotId(null);
                setViewMode('focused');
              }}
              className={`group cursor-pointer rounded-2xl bg-slate-900/90 border p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-950/30 ${
                angle.isSuperBoule
                  ? 'border-amber-500/70 bg-gradient-to-b from-amber-950/20 to-slate-900/90 ring-1 ring-amber-500/30'
                  : 'border-slate-800 hover:border-amber-500/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-400 font-mono">
                    {angle.isSuperBoule ? '⭐ SUPER' : `มุมที่ ${idx}`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                    <i className="fa-solid fa-circle-check text-[9px] text-amber-400"></i>
                    <span>{angle.isSuperBoule ? 'ลายร่องคู่ FIPJP' : 'ภาพถ่ายจริง'}</span>
                  </span>
                </div>

                <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 mb-2.5">
                  <img
                    src={angle.src}
                    alt={angle.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-[0.98] contrast-[1.12]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-[11px] font-bold text-amber-300 drop-shadow-md block">
                      {angle.shortLabel}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2 text-[10px] font-bold text-emerald-300 line-clamp-2">
                  {angle.keyRule}
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed mb-2 line-clamp-2">
                  {angle.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-amber-400 group-hover:text-amber-300 font-bold">
                <span>คลิกเจาะลึก Hotspots</span>
                <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Focused Mode (both compact card & expanded modal view)
  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 rounded-2xl select-none">
      {/* 1. TOP BAR: Category Tabs (เทคนิค / อุปกรณ์) & Overlay Toggle Switch */}
      <div className="relative z-20 px-2.5 py-2 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-2">
        {/* Left: Category Filter Tabs (แยกแท็บข้อมูล "เทคนิค" กับ "อุปกรณ์") */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-inner">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCategory('technique');
              setActiveHotspotId(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'technique'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <i className="fa-solid fa-hand text-[10px]"></i>
            <span>เทคนิค ({techCount})</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCategory('equipment');
              setActiveHotspotId(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'equipment'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <i className="fa-solid fa-bolt text-[10px]"></i>
            <span>อุปกรณ์ ({equipCount})</span>
          </button>
        </div>

        {/* Right: Toggle Switch ซ่อน/แสดง Overlay & Compare Mode */}
        <div className="flex items-center gap-2">
          {/* iOS-Style Overlay Toggle Switch */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-sm">
            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
              <i
                className={`fa-solid ${
                  showOverlay ? 'fa-eye text-emerald-400' : 'fa-eye-slash text-slate-500'
                } text-[10px]`}
              ></i>
              <span className="hidden sm:inline">Overlay</span>
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={showOverlay}
              onClick={(e) => {
                e.stopPropagation();
                setShowOverlay(!showOverlay);
              }}
              className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 shrink-0 cursor-pointer rounded-full border border-slate-600 transition-colors duration-200 ease-in-out ${
                showOverlay ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
              title={showOverlay ? 'คลิกเพื่อซ่อน Overlay' : 'คลิกเพื่อแสดง Overlay'}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showOverlay ? 'translate-x-3 sm:translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {expanded && (
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold transition flex items-center gap-1"
            >
              <i className="fa-solid fa-table-columns"></i>
              <span className="hidden sm:inline">ทุกมุม</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN PHOTOGRAPHIC FRAME WITH INTERACTIVE HOTSPOTS */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-slate-950 group/photo">
        {/* Real Photograph with Polished Finish */}
        <img
          key={currentAngle.src}
          src={currentAngle.src}
          alt={currentAngle.alt}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover object-center transition-all duration-700 drop-shadow-2xl select-none ${
            superFinish === 'carbone'
              ? 'filter brightness-[0.97] contrast-[1.15] saturate-[1.08]'
              : 'filter brightness-[1.05] contrast-[1.12] saturate-[0.92]'
          }`}
        />

        {/* Realistic SVG Engraved Twin Striations Overlay for Outdoor Photos */}
        {showOverlay && currentAngle.id === 'outdoor-front' && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 400 400"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="grooveDropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="0.7" floodColor="#000" floodOpacity="0.85" />
              </filter>
            </defs>
            <path
              d="M 122 184 C 152 148, 212 143, 258 178"
              fill="none"
              stroke="#09090b"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#grooveDropShadow)"
              opacity="0.92"
            />
            <path
              d="M 122 185 C 152 149, 212 144, 258 179"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <path
              d="M 127 194 C 155 158, 215 153, 256 188"
              fill="none"
              stroke="#09090b"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#grooveDropShadow)"
              opacity="0.92"
            />
            <path
              d="M 127 195 C 155 159, 215 154, 256 189"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <g opacity="0.8" transform="translate(198, 172) rotate(-11)">
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fill="rgba(255,255,255,0.45)"
                stroke="#0f172a"
                strokeWidth="0.4"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
                letterSpacing="2"
              >
                SUPER • FIPJP 72/690
              </text>
            </g>
          </svg>
        )}

        {showOverlay && currentAngle.id === 'outdoor-back' && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 400 400"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="grooveDropShadow2" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="0.7" floodColor="#000" floodOpacity="0.85" />
              </filter>
            </defs>
            <path
              d="M 132 250 C 162 216, 230 216, 260 254"
              fill="none"
              stroke="#09090b"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#grooveDropShadow2)"
              opacity="0.92"
            />
            <path
              d="M 132 251 C 162 217, 230 217, 260 255"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <path
              d="M 138 260 C 166 226, 226 226, 254 264"
              fill="none"
              stroke="#09090b"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#grooveDropShadow2)"
              opacity="0.92"
            />
            <path
              d="M 138 261 C 166 227, 226 227, 254 265"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <g opacity="0.8" transform="translate(198, 238) rotate(4)">
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fill="rgba(255,255,255,0.45)"
                stroke="#0f172a"
                strokeWidth="0.4"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
                letterSpacing="2"
              >
                SUPER 72 • 690g
              </text>
            </g>
          </svg>
        )}

        {/* Ambient Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30"></div>

        {/* INTERACTIVE HOTSPOT PINS OVERLAID ON IMAGE */}
        {showOverlay &&
          visibleMarkers.map((marker) => {
            const isActive = activeHotspotId === marker.id;
            const isEquip = marker.category === 'equipment';

            return (
              <button
                key={marker.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspotId(isActive ? null : marker.id);
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group/pin transition-transform duration-200 focus:outline-none"
                style={{ top: marker.top, left: marker.left }}
                title={`${marker.category === 'equipment' ? '⚡ อุปกรณ์' : '✋ เทคนิค'}: ${marker.label}`}
              >
                {/* Glowing pulse ring */}
                <span
                  className={`absolute -inset-1 rounded-full animate-ping opacity-70 ${
                    isEquip
                      ? 'bg-amber-400'
                      : marker.type === 'warn'
                      ? 'bg-rose-400'
                      : 'bg-emerald-400'
                  }`}
                />

                {/* Hotspot Circular Pin */}
                <div
                  className={`relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-2xl border-2 transition-all duration-200 ${
                    isActive
                      ? 'scale-125 ring-2 ring-white ' +
                        (isEquip
                          ? 'bg-amber-400 text-slate-950 border-amber-100 shadow-amber-500/50'
                          : 'bg-emerald-400 text-slate-950 border-white shadow-emerald-500/50')
                      : isEquip
                      ? 'bg-amber-500 hover:scale-115 text-slate-950 border-amber-300'
                      : marker.type === 'warn'
                      ? 'bg-rose-500 hover:scale-115 text-white border-rose-300'
                      : 'bg-emerald-500 hover:scale-115 text-white border-emerald-300'
                  }`}
                >
                  <i className={`fa-solid ${marker.icon} text-[10px] sm:text-[11px]`}></i>
                </div>
              </button>
            );
          })}

        {/* DOCKED ACTIVE HOTSPOT INSPECTOR CARD (Zero Overlap & Screen Clutter) */}
        {showOverlay && activeMarker && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700/90 shadow-2xl flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold ${
                    activeMarker.category === 'equipment'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : activeMarker.type === 'warn'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <i className={`fa-solid ${activeMarker.icon || 'fa-circle-info'}`}></i>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        activeMarker.category === 'equipment'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {activeMarker.category === 'equipment' ? '⚡ อุปกรณ์' : '✋ เทคนิค'}
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                      {activeMarker.label}
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                    {activeMarker.sublabel}
                  </p>
                </div>
              </div>

              {/* Prev / Next / Close Controls */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={handlePrevHotspot}
                  className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-[10px]"
                  title="จุดก่อนหน้า"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button
                  type="button"
                  onClick={handleNextHotspot}
                  className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-[10px]"
                  title="จุดถัดไป"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspotId(null);
                  }}
                  className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 flex items-center justify-center text-[11px]"
                  title="ปิดหน้าต่างนี้"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Hotspot Helper Hint (When No Hotspot is Active) */}
        {showOverlay && !activeMarker && visibleMarkers.length > 0 && (
          <div className="absolute bottom-2.5 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
            <div className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 shadow flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>
                แตะที่จุด <strong>Hotspot</strong> บนภาพเพื่อดูรายละเอียด ({visibleMarkers.length} จุด)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. EXPANDED VIEW: COACHING & EQUIPMENT BREAKDOWN */}
      {expanded && (
        <div className="relative z-20 p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span className="text-amber-400">{currentAngle.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold">
                  ⚡ FIPJP Super Edition
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                {currentAngle.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-2">
              <i className="fa-solid fa-lightbulb text-amber-400 mt-0.5"></i>
              <span>
                <strong>คำแนะนำเทคนิคการจับ:</strong> {currentAngle.proTip}
              </span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
              <i className="fa-solid fa-crosshairs text-amber-400 mt-0.5"></i>
              <span>
                <strong>คุณสมบัติลูกซุปเปอร์:</strong> ร่องลายคู่เพิ่มแรงเกาะนิ้ว +25% สะบัดสร้างรอบสปินสกรูถอยหลังและหยุดลูกได้สนิท
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLEAN SEGMENTED CONTROL: ORGANIZED ANGLE SWITCHER (No Line Wrapping / Truncation) */}
      <div className="relative z-20 px-2 py-1.5 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 flex items-center gap-1.5 overflow-hidden">
        <span className="text-[10px] font-bold text-slate-400 hidden md:inline-flex items-center gap-1 pl-1 shrink-0">
          <i className="fa-solid fa-camera text-sky-400"></i>
          <span>มุมมอง:</span>
        </span>

        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar py-0.5 justify-start sm:justify-center">
          {GRIP_ANGLES.map((angle, idx) => {
            const isSelected = selectedAngleIndex === idx;
            return (
              <button
                key={angle.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAngleIndex(idx);
                  setActiveHotspotId(null);
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? angle.isSuperBoule
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-500/20 scale-[1.02]'
                      : 'bg-amber-500 text-slate-950 font-extrabold shadow-md scale-[1.02]'
                    : angle.isSuperBoule
                    ? 'bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
                title={angle.title}
              >
                <span>{angle.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   2. STANCE & BALANCE IN CIRCLE ILLUSTRATION (Photorealistic Athlete Demonstration)
   ------------------------------------------------------------- */
interface StanceHotspot {
  id: string;
  category: 'posture' | 'rules';
  top: string;
  left: string;
  label: string;
  sublabel: string;
  type: 'good' | 'info' | 'warn';
  icon: string;
  proTip: string;
}

const STANCE_HOTSPOTS: StanceHotspot[] = [
  {
    id: 'stance-feet',
    category: 'rules',
    top: '90%',
    left: '49%',
    label: 'เท้าทั้ง 2 ข้างวางราบในวงกลม',
    sublabel: 'กฎ FIPJP มาตรา 6: เท้าทั้งสองข้างต้องอยู่ภายในวงกลม ห้ามสัมผัสหรือเหยียบเส้นขอบ และห้ามยกส้นเท้าจนกว่าลูกจะตกถึงพื้น',
    type: 'good',
    icon: 'fa-shoe-prints',
    proTip: 'การวางเท้าขนานชิดกันหรือเหลื่อมกันเล็กน้อยตามความถนัด ช่วยให้ฐานมั่นคงและถ่ายน้ำหนักสมดุลที่สุด'
  },
  {
    id: 'stance-knees',
    category: 'posture',
    top: '68%',
    left: '53%',
    label: 'ย่อเข่า 15° สร้างศูนย์ถ่วงต่ำ (Center of Gravity)',
    sublabel: 'งอข้อเข่าประมาณ 15 องศา ลดระดับสะโพก ลำตัวนิ่ง ไม่โยกไหวขณะวาดวงสวิงแขน',
    type: 'good',
    icon: 'fa-arrows-down-to-line',
    proTip: 'การย่อเข่า 15° ช่วยดูดซับแรงสะท้อนจากการเหวี่ยงแขน ทำให้แกนลำตัวนิ่งสนิทและส่งแรงแม่นยำขึ้น 30%'
  },
  {
    id: 'stance-circle',
    category: 'rules',
    top: '93%',
    left: '42%',
    label: 'วงกลมแข่งขันมาตรฐาน (Ø 35 - 50 ซม.)',
    sublabel: 'วงกลมยืนโยนลูกต้องมีเส้นผ่านศูนย์กลางภายใน 35-50 ซม. วางบนพื้นสนามกรวดแน่นและห่างจากสิ่งกีดขวาง ≥ 1 เมตร',
    type: 'info',
    icon: 'fa-circle-notch',
    proTip: 'ตรวจดูว่าไม่มีก้อนหินหรือหลุมใต้ฝ่าเท้าภายในวงกลมก่อนเริ่มจัดท่ายืน เพื่อไม่ให้เสียการทรงตัว'
  },
  {
    id: 'stance-gaze',
    category: 'posture',
    top: '15%',
    left: '57%',
    label: 'สายตามุ่งมั่นจับจ้องจุดตก (Donnée)',
    sublabel: 'ศีรษะตั้งตรง ล็อคโฟกัสสายตาไปยังเป้าหมาย/จุดตกบนพื้นสนาม ไม่ก้มมองปลายเท้า',
    type: 'good',
    icon: 'fa-eye',
    proTip: 'การล็อคสายตาไปยังจุด Donnée ช่วยให้สมองคำนวณวิถีโค้งและแรงเหวี่ยงของแขนโดยอัตโนมัติ'
  },
  {
    id: 'stance-arm',
    category: 'posture',
    top: '59%',
    left: '41%',
    label: 'การถือลูกและวงสวิงแขนลูกตุ้ม (Backswing Ready)',
    sublabel: 'มือจับลูกเปตอง แขนทิ้งดิ่งอย่างผ่อนคลาย เตรียมแกว่งเป็นลูกตุ้มนาฬิกา (Pendulum Motion) ตรงแนวไหล่',
    type: 'info',
    icon: 'fa-hand',
    proTip: 'ปล่อยให้แรงโน้มถ่วงช่วยส่งลูก ไม่เกร็งกล้ามเนื้อข้อมือหรือกระชากแขน'
  },
  {
    id: 'stance-polo',
    category: 'posture',
    top: '34%',
    left: '50%',
    label: 'แกนลำตัว & เสื้อโปโลกีฬา (Torso Alignment)',
    sublabel: 'ลำตัวโน้มไปข้างหน้าเล็กน้อยอย่างเป็นธรรมชาติ รักษาแกนกระดูกสันหลังและแนวหัวไหล่ให้ตั้งฉากกับเป้าหมาย',
    type: 'good',
    icon: 'fa-shirt',
    proTip: 'รักษาแกนลำตัวให้นิ่ง ไม่เอียงหรือบิดลำตัวขณะสวิงส่งลูก'
  }
];

const StanceIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => {
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<'posture' | 'rules'>('posture');
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);

  const visibleHotspots = STANCE_HOTSPOTS.filter(
    (h) => h.category === activeCategory
  );
  const activeHotspot = STANCE_HOTSPOTS.find((h) => h.id === activeHotspotId) || null;

  const postureCount = STANCE_HOTSPOTS.filter((h) => h.category === 'posture').length;
  const rulesCount = STANCE_HOTSPOTS.filter((h) => h.category === 'rules').length;

  const handlePrevHotspot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (visibleHotspots.length === 0) return;
    const currentIndex = visibleHotspots.findIndex((h) => h.id === activeHotspotId);
    const prevIndex = currentIndex <= 0 ? visibleHotspots.length - 1 : currentIndex - 1;
    setActiveHotspotId(visibleHotspots[prevIndex].id);
  };

  const handleNextHotspot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (visibleHotspots.length === 0) return;
    const currentIndex = visibleHotspots.findIndex((h) => h.id === activeHotspotId);
    const nextIndex = currentIndex >= visibleHotspots.length - 1 ? 0 : currentIndex + 1;
    setActiveHotspotId(visibleHotspots[nextIndex].id);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 rounded-2xl select-none">
      {/* 1. TOP BAR: Category Tabs (สรีระ & ท่ายืน / กฎ & วงกลม) & Overlay Toggle Switch */}
      <div className="relative z-20 px-2.5 py-2 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-2">
        {/* Left: Category Filter Tabs */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-inner">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCategory('posture');
              setActiveHotspotId(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'posture'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <i className="fa-solid fa-person text-[10px]"></i>
            <span>สรีระ & ท่ายืน ({postureCount})</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCategory('rules');
              setActiveHotspotId(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'rules'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <i className="fa-solid fa-scale-balanced text-[10px]"></i>
            <span>กฎ & วงกลม ({rulesCount})</span>
          </button>
        </div>

        {/* Right: Toggle Switch ซ่อน/แสดง Overlay */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-sm">
            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
              <i
                className={`fa-solid ${
                  showOverlay ? 'fa-eye text-emerald-400' : 'fa-eye-slash text-slate-500'
                } text-[10px]`}
              ></i>
              <span className="hidden sm:inline">Overlay</span>
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={showOverlay}
              onClick={(e) => {
                e.stopPropagation();
                setShowOverlay(!showOverlay);
              }}
              className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 shrink-0 cursor-pointer rounded-full border border-slate-600 transition-colors duration-200 ease-in-out ${
                showOverlay ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
              title={showOverlay ? 'คลิกเพื่อซ่อน Overlay' : 'คลิกเพื่อแสดง Overlay'}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showOverlay ? 'translate-x-3 sm:translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN PHOTOGRAPHIC DISPLAY */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-slate-950 group/photo">
        {/* Photorealistic Thai athlete stance photo */}
        <img
          src={stanceRealImg}
          alt="ภาพถ่ายจริงนักกีฬาเปตองชาวไทยวัย 20 ต้นๆ สวมเสื้อโปโลกีฬา สาธิตท่ายืนและการทรงตัวในวงกลมแข่งขัน FIPJP"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-all duration-700 select-none filter brightness-[0.98] contrast-[1.08] saturate-[1.05]"
        />

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/25"></div>

        {/* SVG TECHNICAL HUD OVERLAY */}
        {showOverlay && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 1000 562"
            preserveAspectRatio="none"
          >
            <CommonDefs />

            {/* SIGHT VECTOR (สายตามอง Donné) */}
            <g opacity="0.95">
              <line
                x1="575"
                y1="88"
                x2="900"
                y2="88"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                markerEnd="url(#arrowBlue)"
              />
              <rect x="620" y="66" width="130" height="20" rx="5" fill="#0f172a" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="1" />
              <text x="685" y="80" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="bold">
                สายตามอง Donnée ➔
              </text>
            </g>

            {/* KNEE FLEXION ANGLE (ย่อเข่า 15°) */}
            <g opacity="0.95">
              <path
                d="M 505 310 L 535 385 L 490 480"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
              <rect x="350" y="360" width="125" height="22" rx="5" fill="#0f172a" fillOpacity="0.9" stroke="#f59e0b" strokeWidth="1" />
              <text x="412" y="375" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="bold">
                ศูนย์ถ่วงต่ำ (ย่อเข่า 15°)
              </text>
              <line x1="475" y1="371" x2="530" y2="380" stroke="#f59e0b" strokeWidth="1.5" />
            </g>

            {/* PLUMB LINE (แนวดิ่งจุดศูนย์ถ่วง) */}
            <line
              x1="495"
              y1="230"
              x2="495"
              y2="490"
              stroke="#ef4444"
              strokeWidth="1.8"
              strokeDasharray="4 3"
              opacity="0.85"
            />
            <circle cx="495" cy="230" r="5" fill="#ef4444" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1.5" />

            {/* REGULATION CIRCLE HIGHLIGHT (Ø 35-50 cm) */}
            <ellipse
              cx="485"
              cy="522"
              rx="95"
              ry="20"
              stroke="#ea580c"
              strokeWidth="2.8"
              fill="#ea580c"
              fillOpacity="0.12"
              filter="url(#glowCommon)"
            />
            <rect x="435" y="534" width="100" height="20" rx="4" fill="#0f172a" fillOpacity="0.9" stroke="#ea580c" strokeWidth="1" />
            <text x="485" y="548" textAnchor="middle" fill="#fb923c" fontSize="10.5" fontWeight="bold">
              Ø 35 - 50 cm
            </text>

            {/* FIPJP RULE BADGE HUD */}
            <g transform="translate(48, 435)">
              <rect width="180" height="42" rx="8" fill="#0f172a" fillOpacity="0.92" stroke="#22c55e" strokeWidth="1.2" />
              <text x="90" y="17" textAnchor="middle" fill="#4ade80" fontSize="10.5" fontWeight="bold">
                กฎ FIPJP มาตรา 6
              </text>
              <text x="90" y="33" textAnchor="middle" fill="#cbd5e1" fontSize="9">
                เท้าทั้ง 2 ข้างห้ามยกส้นเท้า
              </text>
              <path d="M 180 25 C 250 25, 330 35, 400 60" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="3 3" />
            </g>
          </svg>
        )}

        {/* INTERACTIVE HOTSPOT PINS */}
        {showOverlay &&
          visibleHotspots.map((marker) => {
            const isActive = activeHotspotId === marker.id;
            const isRule = marker.category === 'rules';

            return (
              <button
                key={marker.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspotId(isActive ? null : marker.id);
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group/pin transition-transform duration-200 focus:outline-none"
                style={{ top: marker.top, left: marker.left }}
                title={`${isRule ? '📏 กฎข้อบังคับ' : '🏃 สรีระ & ท่ายืน'}: ${marker.label}`}
              >
                <span
                  className={`absolute -inset-1 rounded-full animate-ping opacity-75 ${
                    isRule ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />

                <div
                  className={`relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-2xl border-2 transition-all duration-200 ${
                    isActive
                      ? 'scale-125 ring-2 ring-white ' +
                        (isRule
                          ? 'bg-amber-400 text-slate-950 border-amber-100 shadow-amber-500/50'
                          : 'bg-emerald-400 text-slate-950 border-white shadow-emerald-500/50')
                      : isRule
                      ? 'bg-amber-500 hover:scale-115 text-slate-950 border-amber-300'
                      : 'bg-emerald-500 hover:scale-115 text-white border-emerald-300'
                  }`}
                >
                  <i className={`fa-solid ${marker.icon} text-[10px] sm:text-[11px]`}></i>
                </div>
              </button>
            );
          })}

        {/* DOCKED ACTIVE HOTSPOT INSPECTOR CARD */}
        {showOverlay && activeHotspot && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700/90 shadow-2xl flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold ${
                    activeHotspot.category === 'rules'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <i className={`fa-solid ${activeHotspot.icon}`}></i>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                        activeHotspot.category === 'rules'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {activeHotspot.category === 'rules' ? '📏 กฎข้อบังคับ FIPJP' : '🏃 สรีระ & ท่ายืน'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {activeHotspot.label}
                    </h4>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug mt-0.5 line-clamp-2">
                    {activeHotspot.sublabel}
                  </p>
                  <p className="text-[9.5px] text-amber-300/90 mt-1 flex items-center gap-1 font-medium">
                    <i className="fa-solid fa-lightbulb text-[9px] text-amber-400"></i>
                    <span><strong>Pro Tip:</strong> {activeHotspot.proTip}</span>
                  </p>
                </div>
              </div>

              {/* Navigation & Dismiss */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={handlePrevHotspot}
                  className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-[10px] transition border border-slate-800"
                  title="จุดก่อนหน้า"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button
                  type="button"
                  onClick={handleNextHotspot}
                  className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-[10px] transition border border-slate-800"
                  title="จุดถัดไป"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspotId(null);
                  }}
                  className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 flex items-center justify-center text-[10px] transition border border-slate-800"
                  title="ปิดการตรวจสอบ"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. PRO COACHING STRIP */}
      <div className="relative z-20 px-3 py-1.5 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-300 gap-2">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="truncate">
            <strong className="text-white">ท่ายืนสมดุล (Stance Mastery):</strong> เท้า 2 ข้างราบในวงกลม ย่อเข่า 15° ลำตัวนิ่ง สายตาจับจ้องจุดตก Donnée
          </span>
        </div>
        <span className="text-emerald-400 font-bold shrink-0 hidden sm:inline-flex items-center gap-1">
          <i className="fa-solid fa-circle-check"></i>
          <span>FIPJP มาตรา 6</span>
        </span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   3. ROLLING / LOW POINT ILLUSTRATION
   ------------------------------------------------------------- */
const RollingIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    <defs>
      <linearGradient id="rollingArc" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
    </defs>

    {/* Ground Plane */}
    <line x1="10" y1="210" x2="490" y2="210" stroke="#64748b" strokeWidth="3" />
    <path d="M10 210 L490 210 L490 270 L10 270 Z" fill="#1e293b" fillOpacity="0.4" />
    <circle cx="80" cy="216" r="2" fill="#475569" />
    <circle cx="160" cy="218" r="2.5" fill="#475569" />
    <circle cx="280" cy="215" r="2" fill="#475569" />
    <circle cx="390" cy="217" r="2.5" fill="#475569" />

    {/* Throwing Circle at 0m */}
    <ellipse cx="60" cy="212" rx="30" ry="8" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.1" />
    <text x="60" y="235" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">0 m (วงกลม)</text>

    {/* Trajectory: Low arc */}
    <path
      d="M65 170 Q120 120 200 210"
      stroke="url(#rollingArc)"
      strokeWidth="3.5"
      fill="none"
      filter="url(#glowCommon)"
    />

    {/* Apex Marker */}
    <line x1="120" y1="135" x2="120" y2="210" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
    <rect x="75" y="95" width="90" height="22" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
    <text x="120" y="110" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">Apex ~0.4 m (โค้งต่ำ)</text>

    {/* Donnée (จุดตก) at 1/3 distance */}
    <circle cx="200" cy="210" r="7" fill="#fbbf24" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2" />
    <circle cx="200" cy="210" r="3" fill="#f59e0b" />
    <rect x="150" y="225" width="100" height="22" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
    <text x="200" y="240" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">Donnée (จุดตก 1/3)</text>

    {/* Rolling Ground Track from 200 to 420 */}
    <line x1="200" y1="208" x2="420" y2="208" stroke="#34d399" strokeWidth="4" strokeDasharray="6 4" />
    <path d="M260 202 L275 208 L260 214" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
    <path d="M330 202 L345 208 L330 214" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
    <rect x="250" y="165" width="115" height="22" rx="4" fill="#0f172a" stroke="#34d399" strokeWidth="1" />
    <text x="307" y="180" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">กลิ้งเกาะพื้น 2/3 ระยะ</text>

    {/* Final Resting Boule */}
    <circle cx="410" cy="198" r="12" fill="url(#bouleMetalCommon)" stroke="#cbd5e1" strokeWidth="1.5" />

    {/* Jack (Cochonnet) in Orange/Red */}
    <circle cx="435" cy="204" r="6" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
    <text x="435" y="235" textAnchor="middle" fill="#fb923c" fontSize="10" fontWeight="bold">แก่น (Jack)</text>

    {/* Distance Scale */}
    <line x1="60" y1="260" x2="435" y2="260" stroke="#475569" strokeWidth="1" />
    <text x="247" y="258" textAnchor="middle" fill="#94a3b8" fontSize="9">ระยะรวม ~7 - 9 เมตร</text>
  </svg>
);

/* -------------------------------------------------------------
   4. DEMI-PORTEE (HALF LOB) ILLUSTRATION
   ------------------------------------------------------------- */
const DemiPorteeIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    <defs>
      <linearGradient id="demiArc" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Ground Plane */}
    <line x1="10" y1="210" x2="490" y2="210" stroke="#64748b" strokeWidth="3" />
    <rect x="10" y="211" width="480" height="59" fill="#1e293b" fillOpacity="0.4" />

    {/* Throwing Circle at 0m */}
    <ellipse cx="60" cy="212" rx="30" ry="8" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.1" />

    {/* Front Obstacle Boule (Opponent Guard Boule) */}
    <circle cx="210" cy="198" r="12" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
    <rect x="165" y="225" width="90" height="20" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
    <text x="210" y="239" textAnchor="middle" fill="#f87171" fontSize="9.5" fontWeight="bold">ลูกบล็อกขวางหน้า</text>

    {/* Parabolic Trajectory Arc */}
    <path
      d="M65 160 Q180 30 330 210"
      stroke="url(#demiArc)"
      strokeWidth="3.5"
      fill="none"
      filter="url(#glowCommon)"
    />

    {/* Apex Marker ~1.8m */}
    <line x1="195" y1="72" x2="195" y2="210" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" />
    <rect x="150" y="40" width="90" height="22" rx="4" fill="#0f172a" stroke="#a855f7" strokeWidth="1" />
    <text x="195" y="55" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold">Apex ~1.8 m (ครึ่งโด่ง)</text>

    {/* Clearance Margin */}
    <line x1="210" y1="184" x2="210" y2="85" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="2 2" />
    <text x="218" y="140" fill="#4ade80" fontSize="9" fontWeight="bold">ข้ามพ้นลูกบล็อก</text>

    {/* Donnée landing point at 2/3 distance */}
    <circle cx="330" cy="210" r="7" fill="#fbbf24" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2" />
    <circle cx="330" cy="210" r="3" fill="#f59e0b" />
    <rect x="280" y="225" width="100" height="22" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
    <text x="330" y="240" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">จุดตก Donnée 2/3</text>

    {/* Short Controlled Roll Track to Jack */}
    <line x1="330" y1="208" x2="410" y2="208" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 3" />
    <path d="M365 204 L375 208 L365 212" stroke="#f59e0b" strokeWidth="2" />
    <rect x="345" y="165" width="80" height="20" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
    <text x="385" y="179" textAnchor="middle" fill="#fcd34d" fontSize="9.5" fontWeight="bold">วิ่งสั้น ~1 เมตร</text>

    {/* Our Boule Nestled beside Jack */}
    <circle cx="410" cy="198" r="12" fill="url(#bouleMetalCommon)" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="430" cy="204" r="6" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
  </svg>
);

/* -------------------------------------------------------------
   5. HIGH LOB (PLOMBEE) ILLUSTRATION
   ------------------------------------------------------------- */
const HighLobIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    <defs>
      <linearGradient id="highLobArc" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="40%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>

    {/* Ground Plane */}
    <line x1="10" y1="220" x2="490" y2="220" stroke="#64748b" strokeWidth="3" />
    <rect x="10" y="221" width="480" height="50" fill="#1e293b" fillOpacity="0.4" />

    {/* Launch Angle 70° indicator at circle */}
    <ellipse cx="60" cy="222" rx="26" ry="7" stroke="#f59e0b" strokeWidth="2" fill="#f59e0b" fillOpacity="0.1" />
    <path d="M60 215 L95 125" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M78 215 A 25 25 0 0 0 71 188" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
    <text x="90" y="200" fill="#38bdf8" fontSize="10" fontWeight="bold">65° - 75°</text>

    {/* Extreme High Parabolic Trajectory */}
    <path
      d="M60 170 C120 -40 280 -40 395 220"
      stroke="url(#highLobArc)"
      strokeWidth="3.5"
      fill="none"
      filter="url(#glowCommon)"
    />

    {/* Apex Peak Marker at > 3.5m */}
    <rect x="175" y="10" width="130" height="24" rx="6" fill="#0f172a" stroke="#ec4899" strokeWidth="1" />
    <text x="240" y="26" textAnchor="middle" fill="#f472b6" fontSize="10" fontWeight="bold">Apex ~3.5 - 4.5 m (โด่งสูงสุด)</text>
    <line x1="240" y1="35" x2="240" y2="220" stroke="#ec4899" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

    {/* Steep Vertical Descent Angle Indicator */}
    <line x1="395" y1="120" x2="395" y2="218" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3 3" />
    <rect x="320" y="145" width="85" height="22" rx="4" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1" />
    <text x="362" y="160" textAnchor="middle" fill="#a78bfa" fontSize="9.5" fontWeight="bold">มุมตกเกือบ 90°</text>

    {/* Landing Point & Backspin Crater Stop */}
    <ellipse cx="395" cy="220" rx="18" ry="6" stroke="#22c55e" strokeWidth="2" fill="#22c55e" fillOpacity="0.2" />
    <ellipse cx="395" cy="220" rx="9" ry="3" stroke="#22c55e" strokeWidth="2" />
    <circle cx="395" cy="208" r="12" fill="url(#bouleMetalCommon)" stroke="#cbd5e1" strokeWidth="1.5" />

    {/* Backspin Snap Vector Arrow */}
    <path d="M412 195 A 15 15 0 1 0 380 195" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
    <text x="445" y="185" fill="#38bdf8" fontSize="9.5" fontWeight="bold">↺ Backspin เบรกทันที</text>

    {/* Jack beside impact */}
    <circle cx="420" cy="216" r="6" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
    <rect x="345" y="235" width="115" height="22" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
    <text x="402" y="250" textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="bold">หยุดนิ่งทันที (&lt; 10 ซม.)</text>
  </svg>
);

/* -------------------------------------------------------------
   6. CARREAU (PERFECT HIT) ILLUSTRATION
   ------------------------------------------------------------- */
const CarreauIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    <defs>
      <linearGradient id="carreauLaser" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="70%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <filter id="impactBurst" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Ground Plane */}
    <line x1="10" y1="210" x2="490" y2="210" stroke="#64748b" strokeWidth="3" />
    <rect x="10" y="211" width="480" height="59" fill="#1e293b" fillOpacity="0.4" />

    {/* Laser Trajectory Arrow from thrower */}
    <path
      d="M30 150 Q140 120 250 198"
      stroke="url(#carreauLaser)"
      strokeWidth="3.5"
      strokeDasharray="6 3"
      fill="none"
    />

    {/* Impact Spark Flash Rays */}
    <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" filter="url(#impactBurst)">
      <line x1="250" y1="198" x2="230" y2="165" />
      <line x1="250" y1="198" x2="250" y2="155" />
      <line x1="250" y1="198" x2="275" y2="168" />
      <line x1="250" y1="198" x2="270" y2="225" />
      <line x1="250" y1="198" x2="230" y2="220" />
    </g>

    {/* Central Collision Point */}
    <circle cx="250" cy="198" r="14" fill="#fbbf24" fillOpacity="0.4" />

    {/* Shooter Boule (Stops on exact spot: v = 0) */}
    <circle cx="250" cy="198" r="12" fill="url(#bouleMetalCommon)" stroke="#38bdf8" strokeWidth="2.5" />
    <rect x="180" y="115" width="140" height="24" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
    <text x="250" y="131" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="bold">ลูกยิงหยุดนิ่งแทนที่ (v = 0)</text>

    {/* Opponent Target Boule Ejected with high velocity */}
    <circle cx="390" cy="198" r="12" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
    <line x1="265" y1="198" x2="375" y2="198" stroke="#ef4444" strokeWidth="3" strokeDasharray="4 2" />
    <polygon points="380,198 368,193 368,203" fill="#ef4444" />
    <rect x="340" y="145" width="130" height="24" rx="6" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
    <text x="405" y="161" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">ลูกเป้าหมายกระเด็นพ้น (v₂)</text>

    {/* Jack nearby untouched */}
    <circle cx="280" cy="204" r="6" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
    <text x="280" y="235" textAnchor="middle" fill="#fb923c" fontSize="9.5" fontWeight="bold">แก่นเดิม</text>

    {/* Physics Conservation Law Banner */}
    <rect x="70" y="30" width="360" height="34" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
    <text x="250" y="52" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">
      Momentum Conservation: m₁v₁ = m₂v₂ (ถ่ายทอดพลังงานจลน์ 100%)
    </text>

    {/* Backspin Grip Retro Vector */}
    <path d="M240 185 A 12 12 0 1 0 260 185" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
    <text x="250" y="250" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold">Backspin ซับแรงปะทะดูดติดดิน</text>
  </svg>
);

/* -------------------------------------------------------------
   7. DIRECT HIT (TIR AU FER) ILLUSTRATION
   ------------------------------------------------------------- */
const DirectHitIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    <defs>
      <radialGradient id="crosshairGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ground Plane */}
    <line x1="10" y1="220" x2="490" y2="220" stroke="#64748b" strokeWidth="3" />
    <rect x="10" y="221" width="480" height="50" fill="#1e293b" fillOpacity="0.4" />

    {/* Direct In-Air Flight Path */}
    <path
      d="M30 140 Q170 80 340 160"
      stroke="#38bdf8"
      strokeWidth="3"
      fill="none"
    />

    {/* Crosshair Target Reticle over Opponent Boule */}
    <circle cx="350" cy="165" r="38" fill="url(#crosshairGlow)" />
    <circle cx="350" cy="165" r="28" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" />
    <line x1="310" y1="165" x2="390" y2="165" stroke="#ef4444" strokeWidth="1.5" />
    <line x1="350" y1="125" x2="350" y2="205" stroke="#ef4444" strokeWidth="1.5" />

    {/* Target Boule Suspended / Resting Before Impact */}
    <circle cx="350" cy="165" r="13" fill="#475569" stroke="#ef4444" strokeWidth="2" />

    {/* Incoming Shooter Boule just 2cm away */}
    <circle cx="328" cy="155" r="13" fill="url(#bouleMetalCommon)" stroke="#38bdf8" strokeWidth="2" />

    {/* Iron-on-Iron Sparks */}
    <g stroke="#fbbf24" strokeWidth="2">
      <line x1="338" y1="158" x2="345" y2="140" />
      <line x1="338" y1="158" x2="330" y2="135" />
      <line x1="338" y1="162" x2="344" y2="180" />
    </g>

    {/* Iron-on-Iron Badge */}
    <rect x="250" y="45" width="200" height="30" rx="6" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
    <text x="350" y="65" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="bold">
      Tir au Fer (เหล็กปะทะเหล็กกลางอากาศ)
    </text>

    {/* No Ground Bounce callout */}
    <rect x="50" y="195" width="210" height="24" rx="5" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
    <text x="155" y="211" textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="bold">
      ✓ ไม่กระทบพื้นก่อน = ไร้การแฉลบหิน
    </text>
  </svg>
);

/* -------------------------------------------------------------
   8. BACKSPIN MASTERY ILLUSTRATION
   ------------------------------------------------------------- */
const BackspinMasteryIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    <defs>
      <radialGradient id="backspinBurst" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ground Plane */}
    <line x1="10" y1="220" x2="490" y2="220" stroke="#64748b" strokeWidth="3" />
    <rect x="10" y="221" width="480" height="50" fill="#1e293b" fillOpacity="0.4" />

    {/* Rotating Boule in Flight */}
    <circle cx="230" cy="115" r="45" fill="url(#bouleMetalCommon)" stroke="#38bdf8" strokeWidth="3" />
    <circle cx="230" cy="115" r="55" fill="url(#backspinBurst)" />

    {/* Spinning Striations */}
    <path d="M200 90 Q230 115 200 140" stroke="#334155" strokeWidth="2.5" />
    <path d="M230 75 Q260 115 230 155" stroke="#334155" strokeWidth="2.5" />
    <path d="M255 90 Q285 115 255 140" stroke="#334155" strokeWidth="2.5" />

    {/* Counter-Clockwise Rotation Arrows (Backspin) */}
    <path
      d="M165 115 A 65 65 0 0 1 295 115"
      stroke="#38bdf8"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeDasharray="6 4"
    />
    <polygon points="165,115 175,107 175,123" fill="#38bdf8" />
    <polygon points="295,115 285,107 285,123" fill="#38bdf8" />

    {/* Forward Linear Velocity Vector */}
    <line x1="230" y1="115" x2="360" y2="115" stroke="#22c55e" strokeWidth="3" markerEnd="url(#arrowGreen)" />
    <rect x="290" y="85" width="120" height="22" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
    <text x="350" y="100" textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="bold">ความเร็วลอย v (Linear)</text>

    {/* Angular Backspin Vector */}
    <rect x="70" y="45" width="150" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
    <text x="145" y="61" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">หมุนถอยหลัง ω &gt; 40 rad/s</text>

    {/* Ground Bite Effect (Where backspin grips the soil) */}
    <ellipse cx="380" cy="220" rx="30" ry="8" stroke="#f59e0b" strokeWidth="2" fill="#f59e0b" fillOpacity="0.2" />
    <line x1="390" y1="205" x2="340" y2="205" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrowAmber)" />
    <rect x="290" y="235" width="150" height="22" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
    <text x="365" y="250" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">แรงเสียดทานดึงถอย (Retro Bite)</text>
  </svg>
);

/* -------------------------------------------------------------
   9. MEASURING RULES (FIPJP) ILLUSTRATION
   ------------------------------------------------------------- */
const MeasuringRulesIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    {/* Ground Overhead Top-down View */}
    <rect x="10" y="10" width="480" height="260" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />

    {/* Jack in Center */}
    <circle cx="250" cy="140" r="10" fill="#ea580c" stroke="#fed7aa" strokeWidth="2" />
    <text x="250" y="165" textAnchor="middle" fill="#fb923c" fontSize="10" fontWeight="bold">ลูกแก่น (Cochonnet)</text>

    {/* Team Blue Boule */}
    <circle cx="160" cy="90" r="22" fill="url(#bouleMetalCommon)" stroke="#38bdf8" strokeWidth="3" />
    <text x="160" y="94" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">A</text>
    <rect x="115" y="35" width="90" height="20" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
    <text x="160" y="49" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">ทีม A (น้ำเงิน)</text>

    {/* Team Red Boule */}
    <circle cx="345" cy="180" r="22" fill="url(#bouleMetalCommon)" stroke="#ef4444" strokeWidth="3" />
    <text x="345" y="184" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">B</text>
    <rect x="300" y="215" width="90" height="20" rx="4" fill="#991b1b" stroke="#ef4444" strokeWidth="1" />
    <text x="345" y="229" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">ทีม B (แดง)</text>

    {/* Measurement Caliper / Tape Lines */}
    <line x1="250" y1="140" x2="175" y2="98" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
    <circle cx="175" cy="98" r="3" fill="#38bdf8" />
    <rect x="175" y="125" width="65" height="18" rx="4" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1" />
    <text x="207" y="138" textAnchor="middle" fill="#7dd3fc" fontSize="9.5" fontWeight="bold">d₁ = 11.2 cm</text>

    <line x1="250" y1="140" x2="330" y2="172" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
    <circle cx="330" cy="172" r="3" fill="#ef4444" />
    <rect x="260" y="165" width="65" height="18" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
    <text x="292" y="178" textAnchor="middle" fill="#fca5a5" fontSize="9.5" fontWeight="bold">d₂ = 12.8 cm</text>

    {/* FIPJP Compass / Tirette Tool Representation */}
    <path d="M250 140 L210 118" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
    <circle cx="250" cy="140" r="3" fill="#fbbf24" />

    {/* Decision Banner */}
    <rect x="130" y="235" width="240" height="26" rx="6" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
    <text x="250" y="252" textAnchor="middle" fill="#4ade80" fontSize="10.5" fontWeight="bold">
      ✓ ทีม A ใกล้กว่า 1.6 ซม. (Point Gagnant)
    </text>
  </svg>
);

/* -------------------------------------------------------------
   10. SCREW BACK (TIR RÉTRO) ILLUSTRATION
   ------------------------------------------------------------- */
const ScrewBackIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    {/* Ground Plane */}
    <line x1="20" y1="215" x2="480" y2="215" stroke="#475569" strokeWidth="2.5" />
    <rect x="20" y="216" width="460" height="50" fill="#090d16" opacity="0.6" />

    {/* Pitch Throwing Circle & Arc from left */}
    <ellipse cx="65" cy="215" rx="18" ry="5" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
    <path d="M65 215 Q180 90 280 200" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 4" fill="none" />

    {/* Target Boule (Blasted Forward after Impact) */}
    <circle cx="410" cy="195" r="20" fill="#475569" stroke="#ef4444" strokeWidth="2" />
    <line x1="320" y1="195" x2="435" y2="195" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowAmber)" />
    <rect x="345" y="150" width="125" height="20" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
    <text x="407" y="164" textAnchor="middle" fill="#fca5a5" fontSize="9.5" fontWeight="bold">ลูกคู่แข่งกระเด็นพ้นเป้า</text>

    {/* Point of Direct Collision (Fer-à-fer) */}
    <ellipse cx="300" cy="198" rx="22" ry="14" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" fill="#f59e0b" fillOpacity="0.15" />
    {/* Collision Sparks */}
    <line x1="300" y1="180" x2="300" y2="168" stroke="#fbbf24" strokeWidth="2" />
    <line x1="315" y1="188" x2="328" y2="178" stroke="#fbbf24" strokeWidth="2" />
    <line x1="285" y1="188" x2="272" y2="178" stroke="#fbbf24" strokeWidth="2" />

    {/* Shooter Boule (Drawing Backwards via Backspin Bite) */}
    <circle cx="215" cy="195" r="20" fill="url(#bouleMetalCommon)" stroke="#f59e0b" strokeWidth="2.5" />
    {/* Striations on Boule */}
    <ellipse cx="215" cy="195" rx="16" ry="10" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" fill="none" />

    {/* Super Backspin Counter-Clockwise Arrow */}
    <path
      d="M200 178 C192 185 192 205 202 212"
      stroke="#38bdf8"
      strokeWidth="2.5"
      markerEnd="url(#arrowBlue)"
      fill="none"
    />
    <rect x="125" y="130" width="135" height="22" rx="4" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1" />
    <text x="192" y="145" textAnchor="middle" fill="#7dd3fc" fontSize="9.5" fontWeight="bold">Super Backspin (380+ RPM)</text>

    {/* Retrograde Rollback Vector (Pointing Left) */}
    <line x1="295" y1="215" x2="218" y2="215" stroke="#f59e0b" strokeWidth="3.5" />
    <polygon points="214,215 224,210 224,220" fill="#f59e0b" />

    {/* Retro Distance Bracket & Label */}
    <rect x="175" y="235" width="165" height="24" rx="5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
    <text x="257" y="251" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">
      ⏪ ถอยหลังกินแต้ม: -60 ถึง -120 cm (Rétro)
    </text>

    {/* Cochonnet near the impact */}
    <circle cx="308" cy="210" r="5.5" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
    <text x="308" y="228" textAnchor="middle" fill="#fb923c" fontSize="8.5" fontWeight="bold">แก่น</text>
  </svg>
);

/* -------------------------------------------------------------
   11. OFFICIAL FIPJP COMPETITION RULES & REGULATIONS ILLUSTRATION
   ------------------------------------------------------------- */
const FipjpRulesIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />
    <defs>
      <linearGradient id="validZoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
      </linearGradient>
    </defs>

    {/* Ground Horizon & Court Boundary Line */}
    <line x1="15" y1="210" x2="485" y2="210" stroke="#475569" strokeWidth="2.5" />
    <rect x="15" y="211" width="470" height="55" fill="#090d16" opacity="0.75" />

    {/* Court Perimeter Markings (Article 5) */}
    <line x1="15" y1="205" x2="15" y2="266" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 2" />
    <text x="18" y="200" fill="#f43f5e" fontSize="7.5" fontWeight="bold">เส้นตาย (Dead-ball line)</text>

    {/* Official Throwing Circle Ø 50 cm (Article 6) */}
    <ellipse cx="65" cy="210" rx="28" ry="8" stroke="#f59e0b" strokeWidth="2.8" fill="#f59e0b" fillOpacity="0.12" filter="url(#glowCommon)" />
    <rect x="25" y="224" width="80" height="18" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
    <text x="65" y="237" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">วงกลม Ø 50 cm</text>
    <text x="65" y="254" textAnchor="middle" fill="#cbd5e1" fontSize="7.5">ห้ามเหยียบ/ยกส้น</text>

    {/* 1-Meter Minimum Clearance Margin */}
    <line x1="93" y1="210" x2="135" y2="210" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
    <rect x="95" y="192" width="38" height="14" rx="3" fill="#0f172a" stroke="#f43f5e" strokeWidth="0.8" />
    <text x="114" y="202" textAnchor="middle" fill="#f87171" fontSize="7.5" fontWeight="bold">≥ 1 ม.</text>

    {/* Valid Jack Throw Zone (6m to 10m - Article 7) */}
    <rect x="180" y="155" width="220" height="55" rx="6" fill="url(#validZoneGrad)" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="4 2" />
    <rect x="230" y="142" width="120" height="20" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
    <text x="290" y="156" textAnchor="middle" fill="#4ade80" fontSize="9.5" fontWeight="bold">
      ✓ โซนโยนเป้าถูกต้อง (6 - 10 ม.)
    </text>

    {/* Cochonnet Target Jack (Ø 30 mm ±1 mm) */}
    <circle cx="340" cy="204" r="6" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
    <rect x="315" y="172" width="50" height="18" rx="4" fill="#0f172a" stroke="#ea580c" strokeWidth="1" />
    <text x="340" y="184" textAnchor="middle" fill="#fb923c" fontSize="8" fontWeight="bold">เป้า Ø 30mm</text>

    {/* Approved Competition Boule Specs (650-800g, 70.5-80mm) */}
    <circle cx="380" cy="198" r="14" fill="url(#bouleMetalCommon)" stroke="#cbd5e1" strokeWidth="1.5" />
    <ellipse cx="380" cy="198" rx="10" ry="7" stroke="#94a3b8" strokeWidth="0.8" fill="none" strokeDasharray="2 1" />
    <rect x="345" y="224" width="70" height="18" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
    <text x="380" y="236" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">650-800g / FIPJP</text>

    {/* 1-Minute Rule Stopwatch (Article 17) */}
    <g transform="translate(195, 30)">
      <circle cx="25" cy="25" r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="25" cy="25" r="3" fill="#38bdf8" />
      <line x1="25" y1="25" x2="25" y2="10" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="25" x2="35" y2="30" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="55" y="8" width="135" height="34" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
      <text x="65" y="22" fill="#38bdf8" fontSize="9.5" fontWeight="bold">Article 17: กฎ 1 นาที</text>
      <text x="65" y="34" fill="#94a3b8" fontSize="8">เริ่มจับเวลาทันทีหลังลูกหยุดนิ่ง</text>
    </g>

    {/* FIPJP Cards & Penalties System (Cards Display) */}
    <g transform="translate(390, 20)">
      <rect x="0" y="0" width="85" height="72" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="1" />
      <text x="42" y="14" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontWeight="bold">ระบบใบเตือน</text>
      {/* Yellow Card */}
      <rect x="12" y="20" width="16" height="22" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
      <text x="20" y="52" textAnchor="middle" fill="#eab308" fontSize="7" fontWeight="bold">เตือน</text>
      {/* Orange Card */}
      <rect x="35" y="20" width="16" height="22" rx="2" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
      <text x="43" y="52" textAnchor="middle" fill="#f97316" fontSize="7" fontWeight="bold">ยึดลูก</text>
      {/* Red Card */}
      <rect x="58" y="20" width="16" height="22" rx="2" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
      <text x="66" y="52" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">ปรับแพ้</text>
      <text x="42" y="65" textAnchor="middle" fill="#94a3b8" fontSize="6.5">FIPJP Sanctions</text>
    </g>

    {/* Referee Jurisdiction Banner */}
    <g transform="translate(35, 30)">
      <rect width="145" height="34" rx="6" fill="#0f172a" stroke="#eab308" strokeWidth="1" />
      <text x="10" y="16" fill="#fbbf24" fontSize="9.5" fontWeight="bold">⚖️ ข้อบังคับ FIPJP แท้</text>
      <text x="10" y="28" fill="#cbd5e1" fontSize="8">มาตรฐานผู้ตัดสินระดับนานาชาติ</text>
    </g>
  </svg>
);

/* -------------------------------------------------------------
   12. MAIN COMPETITION FORMATS (ระบบการแข่งขันหลัก) ILLUSTRATION
   ------------------------------------------------------------- */
const TournamentFormatsIllustration: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg viewBox="0 0 500 280" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <CommonDefs />

    {/* Section 1: Round Robin (พบกันหมด) */}
    <g transform="translate(10, 20)">
      <rect x="0" y="0" width="150" height="235" rx="12" fill="#090d16" stroke="#38bdf8" strokeWidth="1.2" opacity="0.9" />
      <rect x="0" y="0" width="150" height="28" rx="12" fill="#0369a1" fillOpacity="0.3" />
      <text x="75" y="18" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">1. Round Robin</text>

      {/* 4 Teams Node Network */}
      <g transform="translate(75, 80)">
        {/* Connection Lines */}
        <line x1="-32" y1="-32" x2="32" y2="-32" stroke="#0284c7" strokeWidth="1.5" />
        <line x1="32" y1="-32" x2="32" y2="32" stroke="#0284c7" strokeWidth="1.5" />
        <line x1="32" y1="32" x2="-32" y2="32" stroke="#0284c7" strokeWidth="1.5" />
        <line x1="-32" y1="32" x2="-32" y2="-32" stroke="#0284c7" strokeWidth="1.5" />
        <line x1="-32" y1="-32" x2="32" y2="32" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="3 2" />
        <line x1="32" y1="-32" x2="-32" y2="32" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="3 2" />

        {/* Nodes A, B, C, D */}
        <circle cx="-32" cy="-32" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="-32" y="-28" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">A</text>

        <circle cx="32" cy="-32" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="32" y="-28" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">B</text>

        <circle cx="32" cy="32" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="32" y="36" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">C</text>

        <circle cx="-32" cy="32" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="-32" y="36" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">D</text>
      </g>

      {/* Formula & Metrics */}
      <rect x="10" y="145" width="130" height="36" rx="6" fill="#0f172a" stroke="#1e293b" />
      <text x="75" y="159" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold">N × (N - 1) / 2</text>
      <text x="75" y="172" textAnchor="middle" fill="#94a3b8" fontSize="8">4 ทีม = 6 นัดครบถ้วน</text>

      <rect x="10" y="190" width="130" height="32" rx="6" fill="#0f172a" stroke="#0284c7" strokeWidth="0.8" />
      <text x="75" y="204" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontWeight="bold">✓ ยุติธรรมสูงสุด</text>
      <text x="75" y="215" textAnchor="middle" fill="#94a3b8" fontSize="7.5">ทุกทีมได้แข่งเท่ากัน</text>
    </g>

    {/* Section 2: Poule System (ระบบพูล 4 ทีม FIPJP) */}
    <g transform="translate(170, 20)">
      <rect x="0" y="0" width="160" height="235" rx="12" fill="#090d16" stroke="#f59e0b" strokeWidth="1.2" opacity="0.9" />
      <rect x="0" y="0" width="160" height="28" rx="12" fill="#b45309" fillOpacity="0.3" />
      <text x="80" y="18" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">2. Poule System (FIPJP)</text>

      {/* Step 1: Match 1 & 2 */}
      <rect x="8" y="38" width="68" height="20" rx="4" fill="#1e293b" stroke="#475569" />
      <text x="42" y="51" textAnchor="middle" fill="#cbd5e1" fontSize="7.5">1 พบ 2 (M1)</text>

      <rect x="84" y="38" width="68" height="20" rx="4" fill="#1e293b" stroke="#475569" />
      <text x="118" y="51" textAnchor="middle" fill="#cbd5e1" fontSize="7.5">3 พบ 4 (M2)</text>

      {/* Winners Match */}
      <line x1="42" y1="58" x2="60" y2="76" stroke="#22c55e" strokeWidth="1.2" markerEnd="url(#arrowGreen)" />
      <line x1="118" y1="58" x2="100" y2="76" stroke="#22c55e" strokeWidth="1.2" markerEnd="url(#arrowGreen)" />

      <rect x="35" y="78" width="90" height="22" rx="4" fill="#064e3b" stroke="#22c55e" strokeWidth="1" />
      <text x="80" y="92" textAnchor="middle" fill="#86efac" fontSize="7.5" fontWeight="bold">นัดผู้ชนะ (Winners)</text>

      <rect x="98" y="104" width="56" height="18" rx="4" fill="#166534" stroke="#4ade80" />
      <text x="126" y="116" textAnchor="middle" fill="#bbf7d0" fontSize="7.5" fontWeight="bold">เข้ารอบที่ 1</text>

      {/* Losers Match */}
      <rect x="15" y="128" width="85" height="22" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
      <text x="57" y="142" textAnchor="middle" fill="#fca5a5" fontSize="7.5" fontWeight="bold">นัดแก้ตัว (Losers)</text>

      <rect x="8" y="154" width="46" height="16" rx="3" fill="#450a0a" stroke="#f87171" strokeWidth="0.8" />
      <text x="31" y="165" textAnchor="middle" fill="#fca5a5" fontSize="7">ตกรอบ</text>

      {/* Barrage Match */}
      <rect x="45" y="174" width="105" height="24" rx="5" fill="#78350f" stroke="#f59e0b" strokeWidth="1.2" />
      <text x="97" y="189" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold">⚡ นัดตัดสิน BARRAGE</text>

      <rect x="82" y="204" width="70" height="18" rx="4" fill="#166534" stroke="#4ade80" />
      <text x="117" y="216" textAnchor="middle" fill="#bbf7d0" fontSize="7.5" fontWeight="bold">✓ เข้ารอบที่ 2</text>
    </g>

    {/* Section 3: Swiss System (ระบบสวิตช์) */}
    <g transform="translate(340, 20)">
      <rect x="0" y="0" width="150" height="235" rx="12" fill="#090d16" stroke="#a855f7" strokeWidth="1.2" opacity="0.9" />
      <rect x="0" y="0" width="150" height="28" rx="12" fill="#6b21a8" fillOpacity="0.3" />
      <text x="75" y="18" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold">3. Swiss / Switch</text>

      {/* Tiered Pairing Diagram */}
      <g transform="translate(15, 42)">
        <rect x="0" y="0" width="120" height="22" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
        <text x="60" y="14" textAnchor="middle" fill="#a5b4fc" fontSize="7.5" fontWeight="bold">รอบที่ 1: สุ่มประกบคู่</text>

        <path d="M60 22 L35 38 M60 22 L85 38" stroke="#818cf8" strokeWidth="1.2" />

        {/* Tier 1-0 */}
        <rect x="0" y="40" width="56" height="22" rx="4" fill="#064e3b" stroke="#10b981" />
        <text x="28" y="54" textAnchor="middle" fill="#6ee7b7" fontSize="7.5" fontWeight="bold">ชนะ (1-0)</text>

        {/* Tier 0-1 */}
        <rect x="64" y="40" width="56" height="22" rx="4" fill="#4c0519" stroke="#f43f5e" />
        <text x="92" y="54" textAnchor="middle" fill="#fda4af" fontSize="7.5" fontWeight="bold">แพ้ (0-1)</text>

        <rect x="0" y="72" width="120" height="24" rx="4" fill="#1e1b4b" stroke="#a855f7" strokeWidth="0.8" />
        <text x="60" y="87" textAnchor="middle" fill="#e9d5ff" fontSize="7.5">รอบ 2: ชนะเจอชนะ / แพ้เจอแพ้</text>

        {/* Rule Box */}
        <rect x="0" y="105" width="120" height="42" rx="5" fill="#0f172a" stroke="#334155" />
        <text x="60" y="120" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">กฎเหล็ก: No Rematch</text>
        <text x="60" y="132" textAnchor="middle" fill="#94a3b8" fontSize="7">ห้ามเจอทีมเดิมซ้ำ</text>
        <text x="60" y="142" textAnchor="middle" fill="#94a3b8" fontSize="7">คะแนนเท่ากันเจอกัน</text>
      </g>

      <rect x="10" y="195" width="130" height="30" rx="6" fill="#0f172a" stroke="#a855f7" strokeWidth="0.8" />
      <text x="75" y="208" textAnchor="middle" fill="#d8b4fe" fontSize="8" fontWeight="bold">32-128+ ทีมแข่งขัน</text>
      <text x="75" y="219" textAnchor="middle" fill="#94a3b8" fontSize="7.5">แข่ง 4-5 รอบ คัดอันดับได้ทันที</text>
    </g>

    {/* Footer Summary Banner */}
    <rect x="10" y="260" width="480" height="16" rx="4" fill="#0f172a" stroke="#334155" />
    <text x="250" y="272" textAnchor="middle" fill="#94a3b8" fontSize="8">
      FIPJP Tournament Directing Standards • สหพันธ์เปตองและเฌอโพรว็องซาลนานาชาติ
    </text>
  </svg>
);


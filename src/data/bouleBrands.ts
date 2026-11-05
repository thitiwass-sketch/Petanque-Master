// Real-world FIPJP approved boules database and matching algorithm
export interface BouleModel {
  id: string;
  brand: 'Obut' | 'MS Pétanque' | 'La Boule Bleue' | 'Boulenciel' | 'Geologique';
  name: string;
  tagline: string;
  country: string;
  originYear: string;
  material: 'stainless' | 'carbon';
  hardness: 'very_soft' | 'soft' | 'half_soft' | 'hard';
  hardnessValue: string; // e.g., '110 kg/mm²', '115 kg/mm²', '140 kg/mm²'
  availableDiameters: number[]; // e.g., [71, 72, 73, 74, 75, 76]
  availableWeights: number[]; // e.g., [680, 690, 700, 710]
  bestForRoles: ('pointer' | 'shooter' | 'milieu')[];
  striations: ('smooth' | 'single' | 'double' | 'heavy')[];
  bounceLevel: 'minimal' | 'low' | 'medium' | 'high';
  estimatedPriceTHB: string;
  badge: string;
  description: string;
  pros: string[];
  officialCert: string;
}

export const POPULAR_BOULE_MODELS: BouleModel[] = [
  {
    id: 'obut-match',
    brand: 'Obut',
    name: 'Obut Match (กึ่งแข็งสารพัดประโยชน์)',
    tagline: 'ลูกเปตองที่ได้รับความนิยมสูงสุดตลอดกาล ทนทาน สมดุลรอบด้าน',
    country: 'ฝรั่งเศส (France)',
    originYear: '1955',
    material: 'carbon',
    hardness: 'half_soft',
    hardnessValue: '140 kg/mm²',
    availableDiameters: [71, 72, 73, 74, 75, 76],
    availableWeights: [680, 690, 700, 710, 720],
    bestForRoles: ['pointer', 'milieu'],
    striations: ['smooth', 'single', 'double'],
    bounceLevel: 'medium',
    estimatedPriceTHB: '4,200 - 4,800 ฿',
    badge: 'Best Seller ยอดนิยมอันดับ 1',
    description: 'เหล็กคาร์บอนชุบดำด้าน ให้ความรู้สึกกระชับมือ เข้ามือง่าย เกาะเกล็ดหินดินลูกรังได้ดีเยี่ยม เหมาะกับผู้เล่นที่ต้องการความคงทน',
    pros: ['ราคาจับต้องได้ คุ้มค่าที่สุด', 'ทนทานต่อการกระแทกหิน', 'เข้ามือได้เร็ว'],
    officialCert: 'FIPJP Approved'
  },
  {
    id: 'obut-match-it',
    brand: 'Obut',
    name: 'Obut Match IT (สแตนเลสกึ่งนิ่ม)',
    tagline: 'สแตนเลสปลอดสนิม ผิวสัมผัสซาติน สเปกแข่งขัน',
    country: 'ฝรั่งเศส (France)',
    originYear: '2015',
    material: 'stainless',
    hardness: 'half_soft',
    hardnessValue: '115 kg/mm²',
    availableDiameters: [71, 72, 73, 74, 75, 76],
    availableWeights: [680, 690, 700, 710],
    bestForRoles: ['milieu', 'shooter'],
    striations: ['smooth', 'single'],
    bounceLevel: 'low',
    estimatedPriceTHB: '5,900 - 6,600 ฿',
    badge: 'Popular Stainless',
    description: 'สแตนเลสสตีลแท้ไม่เป็นสนิม ดูแลง่าย ผิวสัมผัสเนียนแต่ไม่ลื่นมือ ความแข็ง 115 kg/mm² ช่วยให้ตีติด Carreau ได้ง่ายกว่าลูกแข็ง',
    pros: ['ไม่เป็นสนิม ดูแลง่าย', 'ซับแรงกระแทกได้ดีกว่า Match รุ่นธรรมดา', 'การทรงตัวสมดุลสูง'],
    officialCert: 'FIPJP Approved'
  },
  {
    id: 'obut-atx',
    brand: 'Obut',
    name: 'Obut ATX (รุ่นท็อปเกรดพรีเมียม)',
    tagline: 'ลูกเปตองเกรดอากาศยานสำหรับนักกีฬาระดับแชมป์โลก',
    country: 'ฝรั่งเศส (France)',
    originYear: '1998',
    material: 'stainless',
    hardness: 'half_soft',
    hardnessValue: '130 kg/mm²',
    availableDiameters: [72, 73, 74, 75, 76],
    availableWeights: [680, 690, 700],
    bestForRoles: ['shooter', 'milieu'],
    striations: ['smooth', 'single'],
    bounceLevel: 'minimal',
    estimatedPriceTHB: '13,500 - 15,500 ฿',
    badge: 'Pro Championship Tier',
    description: 'หลอมขึ้นรูปด้วยเทคโนโลยีขั้นสูงจากเหล็กกล้าไร้สนิมเกรดอุตสาหกรรมการบิน ไร้รอยสะเทือน การทรงตัวสม่ำเสมอที่สุดในโลก',
    pros: ['บาลานซ์สมบูรณ์แบบ', 'สัมผัสลูกระดับเวิลด์คลาส', 'แชมป์โลกเลือกใช้มากที่สุด'],
    officialCert: 'FIPJP Approved'
  },
  {
    id: 'obut-rcx',
    brand: 'Obut',
    name: 'Obut RCX (สแตนเลสนิ่มพิเศษซับแรงกระแทก)',
    tagline: 'เทคโนโลยีดูดซับแรงปะทะ ออกแบบมาเพื่อมือยิงลูกเปลี่ยน Carreau',
    country: 'ฝรั่งเศส (France)',
    originYear: '2020',
    material: 'stainless',
    hardness: 'soft',
    hardnessValue: '115 kg/mm²',
    availableDiameters: [71, 72, 73, 74, 75, 76],
    availableWeights: [680, 690, 700],
    bestForRoles: ['shooter'],
    striations: ['smooth', 'single'],
    bounceLevel: 'minimal',
    estimatedPriceTHB: '8,200 - 9,200 ฿',
    badge: 'Shooter Special Edition',
    description: 'โครงสร้างโลหะสแตนเลสสูตรพิเศษที่นุ่มนวล ซับแรงสะท้อนเมื่อปะทะลูกเป้าหรือลูกคู่แข่ง ลูกจะหยุดนิ่ง ณ จุดปะทะได้ดีเยี่ยม',
    pros: ['ยิงติด Carreau อัตราสำเร็จสูงมาก', 'ลูกไม่กระดอนหนีจุดตก', 'นุ่มนวลถนอมข้อมือ'],
    officialCert: 'FIPJP Approved'
  },
  {
    id: 'ms-2110',
    brand: 'MS Pétanque',
    name: 'MS 2110 (ลายก้างปลาในตำนาน)',
    tagline: 'ลูกคาร์บอนนิ่มพิเศษ ลายซิกเนเจอร์กันแฉลบที่มือชู้ตเตอร์หลงรัก',
    country: 'ฝรั่งเศส (France)',
    originYear: '1992',
    material: 'carbon',
    hardness: 'very_soft',
    hardnessValue: '110 kg/mm²',
    availableDiameters: [71, 72, 73, 74, 75, 76],
    availableWeights: [680, 690, 700],
    bestForRoles: ['shooter', 'milieu'],
    striations: ['heavy', 'double'],
    bounceLevel: 'minimal',
    estimatedPriceTHB: '6,400 - 7,200 ฿',
    badge: 'Carreau Machine',
    description: 'ผิวสัมผัสคาร์บอนลายตัดร่องตารางเฉพาะตัวของ MS ช่วยลดการแฉลบของลูกในแนวขวาง ซับแรงกระแทกสูงสุด และให้การยึดเกาะนิ้วยอดเยี่ยม',
    pros: ['ยิงติด Carreau เนียนสนิท', 'ลายกันแฉลบช่วยคุมทิศทางตอนกระแทก', 'เข้ามือกึ่งเหนียวไม่ลื่น'],
    officialCert: 'FIPJP Approved'
  },
  {
    id: 'ms-stra',
    brand: 'MS Pétanque',
    name: 'MS Stra Elite (สแตนเลสกึ่งแข็งลายเส้น)',
    tagline: 'สเปกสมดุลย์ทั้งยิงและวาง คุมระยะสม่ำเสมอ',
    country: 'ฝรั่งเศส (France)',
    originYear: '2005',
    material: 'stainless',
    hardness: 'half_soft',
    hardnessValue: '120 kg/mm²',
    availableDiameters: [72, 73, 74, 75, 76],
    availableWeights: [685, 695, 705],
    bestForRoles: ['milieu', 'pointer'],
    striations: ['single', 'double'],
    bounceLevel: 'low',
    estimatedPriceTHB: '7,100 - 7,900 ฿',
    badge: 'All-Rounder Favorite',
    description: 'ร่องลายเส้นตัดลึกขนาน ช่วยให้นิ้วก้อยและปลายนิ้วสร้างแบ็กสปินได้มั่นใจ พื้นผิวสแตนเลสขัดด้านสะท้อนแสงแดดน้อย',
    pros: ['สร้าง Backspin ยอดเยี่ยม', 'ไม่เป็นสนิม ทนทาน', 'อ่านทางกลิ้งบนสนามดินง่าย'],
    officialCert: 'FIPJP Approved'
  },
  {
    id: 'la-boule-bleue-140',
    brand: 'La Boule Bleue',
    name: 'La Boule Bleue 140 Inox (ช่างฝีมือมาร์เซย)',
    tagline: 'แบรนด์เก่าแก่ที่สุดตั้งแต่ปี 1904 หลอมด้วยมือจากฝรั่งเศสตอนใต้',
    country: 'ฝรั่งเศส (Marseille, France)',
    originYear: '1904',
    material: 'stainless',
    hardness: 'hard',
    hardnessValue: '140 kg/mm²',
    availableDiameters: [71, 72, 73, 74, 75, 76, 77, 78],
    availableWeights: [680, 690, 700, 710, 720, 730],
    bestForRoles: ['pointer'],
    striations: ['heavy', 'double'],
    bounceLevel: 'medium',
    estimatedPriceTHB: '6,800 - 7,600 ฿',
    badge: 'Artisanal Heritage 1904',
    description: 'ผลิตแบบดั้งเดิมตามสั่ง (Handmade) ความแข็ง 140 kg/mm² ทนทานต่อการขูดขีดสูงสุด เหมาะกับสนามหินคลุกและมือเข้าลูกอาชีพ',
    pros: ['อายุการใช้งานยาวนานนับสิบปี', 'ขนาดและน้ำหนักเลือกได้หลากหลายที่สุด', 'เอกลักษณ์สีฟ้าดั้งเดิม'],
    officialCert: 'FIPJP Approved'
  },
  {
    id: 'boulenciel-iris',
    brand: 'Boulenciel',
    name: 'Boulenciel Iris (กลึง CNC ละเอียดที่สุดในโลก)',
    tagline: 'นวัตกรรมอิตาลี ลูกกลมสมบูรณ์แบบไร้จุดบกพร่องระดับไมครอน',
    country: 'อิตาลี (Italy)',
    originYear: '2012',
    material: 'stainless',
    hardness: 'half_soft',
    hardnessValue: '120 kg/mm²',
    availableDiameters: [71, 72, 73, 74, 75, 76],
    availableWeights: [680, 690, 700],
    bestForRoles: ['milieu', 'pointer', 'shooter'],
    striations: ['smooth', 'single'],
    bounceLevel: 'low',
    estimatedPriceTHB: '7,800 - 8,900 ฿',
    badge: 'Precision CNC Machined',
    description: 'ลูกเปตองยี่ห้อเดียวในโลกที่กลึงทั้งผิวด้านในและด้านนอกด้วยเครื่อง CNC 5 แกน จุดศูนย์ถ่วงแม่นยำที่สุด กลิ้งตรงเป็นเส้นตรง',
    pros: ['กลิ้งตรงที่สุด ไม่แกว่งซ้ายขวา', 'สแตนเลสเกรดสูงไม่ลอกล่อน', 'ดีไซน์ลวดลายโมเดิร์น'],
    officialCert: 'FIPJP Approved'
  },
  {
    id: 'geologique-alpha',
    brand: 'Geologique',
    name: 'Geologique Alpha (มาตรฐานแข่งขันเริ่มต้น)',
    tagline: 'ลูกแข่งขันที่ได้รับการรับรอง FIPJP ในราคาเริ่มต้นคุ้มค่า',
    country: 'ฝรั่งเศส (Decathlon)',
    originYear: '2018',
    material: 'carbon',
    hardness: 'hard',
    hardnessValue: '135 kg/mm²',
    availableDiameters: [72, 73, 74, 75],
    availableWeights: [690, 700, 710],
    bestForRoles: ['pointer', 'milieu'],
    striations: ['single', 'smooth'],
    bounceLevel: 'high',
    estimatedPriceTHB: '2,200 - 2,800 ฿',
    badge: 'Budget Friendly FIPJP',
    description: 'เหมาะสำหรับผู้ที่ต้องการลูกมาตรฐานแข่งขัน FIPJP ลูกแรกในราคาประหยัด ได้ใบเซอร์แข่งขันทางการ',
    pros: ['ราคาประหยัดที่สุดสำหรับลูกมีเซอร์ฯ', 'เหล็กคาร์บอนแข็งแรง', 'หาซื้อง่าย'],
    officialCert: 'FIPJP Approved'
  }
];

export interface MatchScoreResult {
  model: BouleModel;
  matchScore: number; // 0 - 100%
  reasons: string[];
  exactDiaMatch: boolean;
  exactWeightMatch: boolean;
}

export function matchBoulesToSpec(
  role: 'pointer' | 'shooter' | 'milieu',
  targetDiameter: number,
  targetWeight: number,
  preferredMaterial?: 'stainless' | 'carbon',
  preferredHardness?: string
): MatchScoreResult[] {
  const scored = POPULAR_BOULE_MODELS.map((model) => {
    let score = 50;
    const reasons: string[] = [];

    // Role fit (up to +25)
    if (model.bestForRoles.includes(role)) {
      score += 25;
      reasons.push(`ออกแบบมารองรับตำแหน่ง ${role === 'shooter' ? 'มือยิง (Shooter)' : role === 'pointer' ? 'มือเข้า (Pointer)' : 'มือกลาง (Milieu)'} โดยเฉพาะ`);
    } else {
      score -= 10;
    }

    // Diameter availability (+15)
    const exactDia = model.availableDiameters.includes(targetDiameter);
    if (exactDia) {
      score += 15;
      reasons.push(`มีขนาด Ø ${targetDiameter} mm รองรับพอดีกับสรีระฝ่ามือ`);
    } else {
      const closest = model.availableDiameters.reduce((prev, curr) =>
        Math.abs(curr - targetDiameter) < Math.abs(prev - targetDiameter) ? curr : prev
      );
      score += 8;
      reasons.push(`ขนาดใกล้เคียงที่สุดคือ Ø ${closest} mm`);
    }

    // Weight availability (+15)
    const exactWeight = model.availableWeights.includes(targetWeight);
    if (exactWeight) {
      score += 15;
      reasons.push(`มีน้ำหนักเป้าหมาย ${targetWeight} g ตรงตามสเปก`);
    } else {
      score += 7;
    }

    // Material preference
    if (preferredMaterial && model.material === preferredMaterial) {
      score += 10;
      reasons.push(`วัสดุ ${model.material === 'stainless' ? 'สแตนเลสแท้ปลอดสนิม' : 'เหล็กคาร์บอนยึดเกาะผิวมือ'} ตรงตามต้องการ`);
    }

    // Bounce & Hardness match
    if (role === 'shooter' && (model.hardness === 'very_soft' || model.hardness === 'soft')) {
      score += 10;
      reasons.push(`ความแข็งระดับนิ่ม (${model.hardnessValue}) ช่วยดูดซับแรงตีติด Carreau`);
    } else if (role === 'pointer' && (model.hardness === 'hard' || model.hardness === 'half_soft')) {
      score += 10;
      reasons.push(`ความแข็งระดับ ${model.hardnessValue} ทนแรงกระแทกหิน ยึดคุมระยะตกได้คงที่`);
    }

    // Normalize
    const finalScore = Math.min(99, Math.max(60, score));

    return {
      model,
      matchScore: finalScore,
      reasons,
      exactDiaMatch: exactDia,
      exactWeightMatch: exactWeight
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

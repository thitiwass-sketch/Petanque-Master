import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import type { DrillItem } from '../App';

interface DrillProgressChartProps {
  drills: DrillItem[];
  practiceCounts: Record<string, number>;
  onIncrementRep?: (drillId: string) => void;
  onResetRep?: (drillId: string) => void;
  onSelectDrill?: (drill: DrillItem) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const completed = data.completedReps;
    const target = data.targetReps;
    const pct = data.progressPct;
    const isCompleted = completed >= target;

    return (
      <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[240px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 block">
              {data.category}
            </span>
            <h5 className="font-bold text-white text-xs">{data.fullName}</h5>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {isCompleted ? '✓ ผ่านเกณฑ์' : `${pct}%`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">จำนวนที่ฝึกแล้ว (Reps):</span>
            <strong className="text-emerald-400 font-mono text-sm">{completed}</strong>
            <span className="text-[10px] text-slate-500 ml-1">ลูก</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">เป้าหมายมาตรฐาน (Target):</span>
            <strong className="text-amber-400 font-mono text-sm">{target}</strong>
            <span className="text-[10px] text-slate-500 ml-1">ลูก</span>
          </div>
        </div>

        {/* Progress bar inside tooltip */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>ความก้าวหน้า</span>
            <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {pct}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
          <span>{data.titleEn}</span>
          <span className="text-sky-300 font-mono">ระดับ: {data.difficulty}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const DrillProgressChart: React.FC<DrillProgressChartProps> = ({
  drills,
  practiceCounts,
  onIncrementRep,
  onResetRep,
  onSelectDrill
}) => {
  const [chartCategory, setChartCategory] = useState<'all' | 'pointing' | 'shooting' | 'tactical_pressure'>('all');
  const [metricView, setMetricView] = useState<'counts' | 'percentage'>('counts');

  // Filter drills based on selected subcategory
  const filteredDrills = useMemo(() => {
    if (chartCategory === 'all') return drills;
    if (chartCategory === 'pointing') return drills.filter((d) => d.category === 'pointing');
    if (chartCategory === 'shooting') return drills.filter((d) => d.category === 'shooting');
    return drills.filter((d) => d.category === 'tactical' || d.category === 'pressure');
  }, [drills, chartCategory]);

  // Transform data for Recharts BarChart
  const chartData = useMemo(() => {
    return filteredDrills.map((d, index) => {
      const completed = practiceCounts[d.id] || 0;
      const target = d.repetitionCount;
      const progressPct = Math.round((completed / target) * 100);

      // Clean short label for XAxis
      const shortName = d.title.length > 22 ? d.title.slice(0, 20) + '...' : d.title;

      return {
        id: d.id,
        shortIndex: `D${index + 1}`,
        name: shortName,
        fullName: d.title,
        titleEn: d.titleEn,
        category: d.categoryLabel,
        completedReps: completed,
        targetReps: target,
        progressPct,
        difficulty: d.difficultyLabel,
        difficultyColor: d.difficultyColor,
        isCompleted: completed >= target,
        drillObj: d
      };
    });
  }, [filteredDrills, practiceCounts]);

  // Aggregate stats across all drills
  const totalStats = useMemo(() => {
    let totalCompleted = 0;
    let totalTarget = 0;
    let completedCount = 0;

    drills.forEach((d) => {
      const count = practiceCounts[d.id] || 0;
      totalCompleted += count;
      totalTarget += d.repetitionCount;
      if (count >= d.repetitionCount) completedCount++;
    });

    const overallPct = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

    return {
      totalCompleted,
      totalTarget,
      overallPct,
      completedDrills: completedCount,
      totalDrills: drills.length
    };
  }, [drills, practiceCounts]);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-6 mb-10 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90">
      {/* Glow highlight */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header with Title and Mode Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30 shadow-inner">
            <i className="fa-solid fa-chart-column"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                Drill Progress & Growth Telemetry
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                Recharts Visualizer
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
              กราฟติดตามความคืบหน้าการฝึกซ้อม (Practice vs Target Repetitions)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              เปรียบเทียบจำนวนครั้งที่โยนจริง (Repetition Count) กับเป้าหมายมาตรฐาน (Target Repetitions) ในแต่ละดริลล์
            </p>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
          {/* Metric View Toggle: Counts vs Percentage */}
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setMetricView('counts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                metricView === 'counts'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-hashtag text-[10px]"></i>
              <span>จำนวนครั้ง (Reps)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricView('percentage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                metricView === 'percentage'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-percent text-[10px]"></i>
              <span>เปอร์เซ็นต์ (% Rate)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>จำนวนโยนสะสม</span>
            <i className="fa-solid fa-bullseye text-emerald-400"></i>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {totalStats.totalCompleted}
              </span>
              <span className="text-xs text-slate-400">/ {totalStats.totalTarget} ครั้ง</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">รวมทุกแบบฝึกซ้อม</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>อัตราความคืบหน้ารวม</span>
            <i className="fa-solid fa-arrow-trend-up text-sky-400"></i>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-sky-400 font-mono">
                {totalStats.overallPct}%
              </span>
              <span className="text-xs text-slate-400">สำเร็จ</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, totalStats.overallPct)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ดริลล์ที่ผ่านเกณฑ์</span>
            <i className="fa-solid fa-medal text-amber-400"></i>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {totalStats.completedDrills}
              </span>
              <span className="text-xs text-slate-400">/ {totalStats.totalDrills} ดริลล์</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">ครบตามเกณฑ์มาตรฐาน</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ระดับความพร้อมแข่งขัน</span>
            <i className="fa-solid fa-shield-halved text-purple-400"></i>
          </div>
          <div className="mt-2">
            <span className="text-sm font-black text-white font-mono block">
              {totalStats.overallPct >= 80 ? '🥇 Gold Ready (พร้อมแข่งชิงแชมป์)' : totalStats.overallPct >= 50 ? '🥈 Silver Stage (กำลังพัฒนา)' : '🥉 Bronze Base (ช่วงฝึกความชำนาญ)'}
            </span>
            <span className="text-[10px] text-purple-300 block mt-0.5">เกณฑ์ประเมิน FIPJP Standard</span>
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'all', label: `ทุกหมวดหมู่ (${drills.length})` },
            { id: 'pointing', label: 'การเข้าลูก (Pointing)' },
            { id: 'shooting', label: 'การยิงลูก (Shooting)' },
            { id: 'tactical_pressure', label: 'แทกติก & บีบคั้น' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setChartCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                chartCategory === tab.id
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-300 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
            <span>ที่ฝึกแล้ว (Current Reps)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 ml-2">
            <span className="w-3 h-3 rounded-md bg-amber-500 inline-block"></span>
            <span>เป้าหมายมาตรฐาน (Target Reps)</span>
          </span>
        </div>
      </div>

      {/* Main Recharts BarChart Container */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              domain={metricView === 'percentage' ? [0, 120] : [0, 'auto']}
              tickFormatter={(v) => (metricView === 'percentage' ? `${v}%` : `${v}`)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              formatter={(val) => {
                if (val === 'completedReps') return <span className="text-emerald-400 font-bold">จำนวนที่ฝึกแล้ว (Repetition Count)</span>;
                if (val === 'targetReps') return <span className="text-amber-400 font-bold">เป้าหมายมาตรฐาน (Target Repetitions)</span>;
                if (val === 'progressPct') return <span className="text-sky-400 font-bold">อัตราความสำเร็จ (% Progress Rate)</span>;
                return val;
              }}
            />

            {metricView === 'counts' ? (
              <>
                <Bar
                  dataKey="completedReps"
                  name="completedReps"
                  radius={[8, 8, 0, 0]}
                  fill="#10b981"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-comp-${index}`}
                      fill={entry.isCompleted ? '#10b981' : '#34d399'}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="targetReps"
                  name="targetReps"
                  radius={[8, 8, 0, 0]}
                  fill="#f59e0b"
                  opacity={0.75}
                  animationDuration={800}
                />
              </>
            ) : (
              <Bar
                dataKey="progressPct"
                name="progressPct"
                radius={[8, 8, 0, 0]}
                fill="#38bdf8"
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-pct-${index}`}
                    fill={entry.progressPct >= 100 ? '#10b981' : entry.progressPct >= 50 ? '#38bdf8' : '#f59e0b'}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Interactive Increment Strip Under Chart */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <i className="fa-solid fa-stopwatch text-emerald-400"></i>
            <span>กดบันทึกลูกซ้อมทันที เพื่อดูแท่งกราฟอัปเดตแบบเรียลไทม์ (Quick Log & Live Growth):</span>
          </span>
          <span className="text-[11px] text-slate-400">
            คลิก +1 เพื่อเพิ่มจำนวนลูกซ้อม หรือคลิกชื่อดริลล์เพื่อดูรายละเอียด
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {chartData.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-2xl border transition duration-200 flex flex-col justify-between ${
                item.isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{item.shortIndex}</span>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                    item.isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.progressPct}%
                  </span>
                </div>
                <h6
                  onClick={() => onSelectDrill && onSelectDrill(item.drillObj)}
                  className="font-bold text-xs text-white truncate cursor-pointer hover:text-amber-300 transition"
                  title={item.fullName}
                >
                  {item.fullName.split(' ')[1] || item.fullName}
                </h6>
                <div className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>ฝึกแล้ว:</span>
                  <span className="font-bold text-emerald-400">{item.completedReps}/{item.targetReps}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onIncrementRep && onIncrementRep(item.id)}
                  className="flex-1 py-1 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[11px] font-bold transition flex items-center justify-center gap-1 border border-emerald-500/40 active:scale-95"
                  title="เพิ่มจำนวนลูกฝึกซ้อม +1"
                >
                  <i className="fa-solid fa-plus text-[9px]"></i>
                  <span>+1 ลูก</span>
                </button>
                {item.completedReps > 0 && onResetRep && (
                  <button
                    type="button"
                    onClick={() => onResetRep(item.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition text-[10px]"
                    title="รีเซ็ตค่ากลับเป็น 0"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

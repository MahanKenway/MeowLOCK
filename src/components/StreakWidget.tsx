import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Award, Calendar, Flame, X, Plus, Info, Zap, HelpCircle, Minimize2, Maximize2, Pin } from "lucide-react";
import { FocusSession } from "../types";

function CustomStar({
  className = "w-5 h-5",
  active = true,
  pulse = false,
  glow = true,
  magicalGlow = false
}: {
  className?: string;
  active?: boolean;
  pulse?: boolean;
  glow?: boolean;
  magicalGlow?: boolean;
}) {
  if (!active) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${className} text-white/10 hover:text-white/25 transition-all duration-300 cursor-pointer`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }

  // Multi-layered beautiful magical shadows
  const shadowFilter = magicalGlow
    ? "drop-shadow(0 0 6px rgba(251,191,36,0.95)) drop-shadow(0 0 16px rgba(249,115,22,0.85)) drop-shadow(0 0 35px rgba(168,85,247,0.75)) drop-shadow(0 0 50px rgba(236,72,153,0.5))"
    : glow
    ? "drop-shadow(0 0 4px rgba(251,191,36,0.65)) drop-shadow(0 0 10px rgba(249,115,22,0.3))"
    : undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} transition-all duration-500 ${pulse || magicalGlow ? "animate-pulse" : ""}`}
      style={shadowFilter ? { filter: shadowFilter } : undefined}
    >
      <defs>
        <linearGradient id="gold-grad-3d-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="35%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        <linearGradient id="gold-grad-3d-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="50%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
      </defs>

      <g>
        {/* Left half-shades of star to make it look 3D */}
        <path
          d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="url(#gold-grad-3d-left)"
        />
        {/* Right half-shades of star (slightly darker for gorgeous 3D depth) */}
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z"
          fill="url(#gold-grad-3d-right)"
        />
      </g>

      {/* Shining central diamond lens flare to make it feel alive and beautiful */}
      <path
        d="M12 7c0 1.2 0.8 2 2 2-1.2 0-2 0.8-2 2 0-1.2-0.8-2-2-2 1 0 2-0.8 2-2z"
        fill="#ffffff"
        opacity="0.9"
        className="animate-pulse"
        style={{ transformOrigin: "12px 12px" }}
      />
    </svg>
  );
}

interface StreakWidgetProps {
  sessions: FocusSession[];
  onAddSession?: (session: FocusSession) => void;
  onClose: () => void;
  isMiniMode?: boolean;
  setIsMiniMode?: (mini: boolean) => void;
}

export default function StreakWidget({
  sessions,
  onAddSession,
  onClose,
  isMiniMode = false,
  setIsMiniMode
}: StreakWidgetProps) {
  // Streak calculations helper defined early
  const getCompletedSessions = () => {
    return sessions.filter((s) => s.completed && s.mode !== "shortBreak" && s.mode !== "longBreak");
  };

  const getUniqueFocusDates = () => {
    const dates = getCompletedSessions().map((s) => s.startTime.substring(0, 10));
    return Array.from(new Set(dates)).sort();
  };

  const [activeTab, setActiveTab] = useState<"tracker" | "milestones">("tracker");
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; size: number; color: string }[]>([]);
  const nextSparkId = useRef(0);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [isMiniHovered, setIsMiniHovered] = useState(false);

  // Auto-log checking & magic completion status
  const todayStr = new Date().toISOString().substring(0, 10);
  const uniqueDates = getUniqueFocusDates();
  const hasCompletedToday = uniqueDates.includes(todayStr);

  // Sparkle generator for hover / click (the previous classic animation)
  const triggerSparks = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const colors = ["#fbbf24", "#fef08a", "#a78bfa", "#f472b6", "#60a5fa", "#34d399"];
    const newSparks = Array.from({ length: 12 }).map(() => ({
      id: nextSparkId.current++,
      x: x + (Math.random() * 40 - 20),
      y: y + (Math.random() * 40 - 20),
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setSparks((prev) => [...prev, ...newSparks]);
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => !newSparks.find((ns) => ns.id === s.id)));
    }, 1000);
  };


  const calculateStreak = () => {
    const uniqueDates = getUniqueFocusDates();
    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toISOString().substring(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    const lastSessionDate = uniqueDates[uniqueDates.length - 1];
    if (lastSessionDate !== todayStr && lastSessionDate !== yesterdayStr) {
      return 0;
    }

    let streakCount = 1;
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const current = new Date(uniqueDates[i + 1]);
      const prev = new Date(uniqueDates[i]);
      const diffTime = Math.abs(current.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streakCount++;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streakCount;
  };

  const currentStreak = calculateStreak();

  // Get cosmic rank based on streak
  const getCosmicRank = (streak: number) => {
    if (streak <= 1) return { title: "Stardust Novice", desc: "First embers of focus in the cosmic library.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
    if (streak <= 4) return { title: "Nebula Voyager", desc: "Successfully locked in a stable concentration orbit.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" };
    if (streak <= 9) return { title: "Solar Pioneer", desc: "Blazing high-intensity rays across the galaxy.", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
    if (streak <= 19) return { title: "Galactic Chronicler", desc: "Writing stellar focus logs into deep cosmic history.", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
    return { title: "Quasar Sovereign", desc: "Absolute gravity focus. The laws of space bend to your will.", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" };
  };

  const rank = getCosmicRank(currentStreak);

  // Daily focus minutes today vs goal
  const getTodayFocusMinutes = () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todaySessions = getCompletedSessions().filter((s) => s.startTime.substring(0, 10) === todayStr);
    return todaySessions.reduce((acc, s) => acc + Math.round(s.duration / 60), 0);
  };

  const todayMinutes = getTodayFocusMinutes();
  const dailyGoalMinutes = 50; // default target
  const todayProgressPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  // Generate last 7 days of focus constellation
  const getLast7Days = () => {
    const daysList = [];
    const uniqueDates = getUniqueFocusDates();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().substring(0, 10);
      
      const hasCompleted = uniqueDates.includes(dateStr);
      const daySessions = getCompletedSessions().filter((s) => s.startTime.substring(0, 10) === dateStr);
      const totalMin = daySessions.reduce((acc, s) => acc + Math.round(s.duration / 60), 0);

      daysList.push({
        dateStr,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: date.getDate(),
        hasCompleted,
        totalMin,
        sessionsCount: daySessions.length
      });
    }
    return daysList;
  };

  const weekDays = getLast7Days();

  // Milestone achievements
  const milestones = [
    { days: 1, name: "Meteorite Star", icon: "☄️", desc: "First star of your cosmic study journey!", color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30" },
    { days: 3, name: "Nebula Star", icon: "🌌", desc: "Three days of celestial concentration", color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30" },
    { days: 7, name: "Supernova Star", icon: "🌟", desc: "One-week high-energy focus cascade!", color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-400/30" },
    { days: 15, name: "Cosmic Star", icon: "🪐", desc: "Half-month stellar discipline orbit", color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30" },
    { days: 30, name: "Quasar Sovereign", icon: "💎", desc: "Legendary 30-day infinite gravity well", color: "from-rose-500/20 to-fuchsia-500/20 text-rose-400 border-rose-500/30" },
  ];

  // Calculate milestone progress bar values
  const getNextMilestoneInfo = () => {
    const next = milestones.find((m) => currentStreak < m.days) || milestones[milestones.length - 1];
    const index = milestones.indexOf(next);
    const prevDays = index > 0 ? milestones[index - 1].days : 0;
    
    const range = next.days - prevDays;
    const currentProgress = currentStreak - prevDays;
    const percent = currentStreak >= milestones[milestones.length - 1].days 
      ? 100 
      : Math.min(100, Math.round((currentProgress / range) * 100));

    return { next, percent };
  };

  const { next: nextMilestone, percent: milestonePercent } = getNextMilestoneInfo();


  // MINI MODE / PINNED COMPACT BADGE LAYOUT
  if (isMiniMode) {
    return (
      <div 
        onMouseEnter={() => setIsMiniHovered(true)}
        onMouseLeave={() => setIsMiniHovered(false)}
        className="relative w-full h-full flex flex-col items-center justify-center select-none font-sans cursor-pointer group rounded-full overflow-hidden"
        title={`${currentStreak} Day Starry Streak`}
      >
        {/* Background glow sparks */}
        {sparks.map((s) => (
          <span
            key={s.id}
            className="absolute pointer-events-none rounded-full z-50 animate-ping"
            style={{
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              backgroundColor: s.color,
              boxShadow: `0 0 10px ${s.color}`,
            }}
          />
        ))}

        {/* Outer Circular Aura */}
        <div className={`absolute inset-0 rounded-full scale-105 pointer-events-none transition-all duration-500 ${
          hasCompletedToday 
            ? "bg-gradient-to-tr from-amber-400/40 via-pink-500/30 to-purple-500/40 animate-pulse" 
            : "bg-gradient-to-tr from-amber-400/20 to-purple-500/20"
        }`} />

        {/* Central interactive star node */}
        <motion.div
          className={`relative flex items-center justify-center p-3 bg-neutral-900/40 hover:bg-neutral-900/60 transition-colors rounded-full w-[84px] h-[84px] ${
            hasCompletedToday ? "border-2 border-amber-400" : "border border-amber-400/30"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            triggerSparks(e);
          }}
        >
          {/* Animated central star */}
          <CustomStar className="w-12 h-12 group-hover:rotate-12 transition-transform duration-500" active={true} glow={true} magicalGlow={hasCompletedToday} />
          
          {/* Day count in the center */}
          <span className="absolute text-xs font-black font-mono text-neutral-950 mt-0.5 tracking-tighter">
            {currentStreak}
          </span>
        </motion.div>

        {/* Hover action overlay to restore full screen */}
        <AnimatePresence>
          {isMiniHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-neutral-950/85 flex flex-col items-center justify-center rounded-full gap-1 z-20"
              onClick={() => setIsMiniMode?.(false)}
            >
              <Maximize2 className="w-4 h-4 text-amber-400 fill-amber-400/10" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400">
                UNPIN
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // STANDARD EXPANDED WINDOW VIEW
  return (
    <div className="flex flex-col h-full text-white select-none relative font-sans pr-1">
      
      {/* Background stardust particles overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl z-0">
        <div className="absolute inset-0 bg-radial-gradient from-[#1a103c]/20 via-black/40 to-transparent opacity-80" />
        <div className="absolute w-[2px] h-[2px] rounded-full bg-white/40 top-12 left-1/4 animate-pulse duration-[3s]" />
        <div className="absolute w-[2.5px] h-[2.5px] rounded-full bg-amber-400/30 top-24 right-1/4 animate-pulse duration-[4s]" />
        <div className="absolute w-[1.5px] h-[1.5px] rounded-full bg-purple-400/40 bottom-16 left-1/3 animate-pulse duration-[2s]" />
      </div>

      {/* Sparkles list overlay */}
      {sparks.map((s) => (
        <span
          key={s.id}
          className="absolute pointer-events-none rounded-full z-50 animate-ping"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            boxShadow: `0 0 10px ${s.color}`,
          }}
        />
      ))}

      {/* Header section */}
      <div className="flex items-center justify-between mb-4 z-10 relative">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-amber-400/20 to-purple-500/20 border border-amber-400/30 rounded-xl">
            <CustomStar className="w-5 h-5" active={true} pulse={true} glow={true} magicalGlow={hasCompletedToday} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-gray-100 tracking-tight flex items-center gap-1.5">
              Stellar Focus Streak
            </h3>
            <p className="text-[10px] text-gray-500 font-sans">Power up your cosmic concentration</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-mono font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Auto-Log Active
          </div>

          {setIsMiniMode && (
            <button
              onClick={() => setIsMiniMode(true)}
              title="Pin Star to Desktop (Mini Mode)"
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main interactive giant star & dynamic progress ring */}
      <div className="relative flex flex-col items-center justify-center py-5 bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 rounded-2xl mb-4 p-4 z-10 overflow-hidden">
        
        {/* Stellar orbital rings */}
        <div className="absolute w-32 h-32 border border-white/[0.03] rounded-full animate-spin-slow pointer-events-none" />
        <div className="absolute w-40 h-40 border border-dashed border-white/[0.02] rounded-full animate-spin-slow duration-[35s] pointer-events-none" />

        {/* Central interactive star container */}
        <div className="relative flex items-center justify-center w-36 h-36">
          
          {/* Animated circular progress circle representing daily focus minutes */}
          <svg className="absolute w-32 h-32 transform -rotate-90 pointer-events-none z-0">
            {/* Dark background track */}
            <circle
              cx="64"
              cy="64"
              r="52"
              className="stroke-white/[0.04]"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Glow stroke for progress */}
            <motion.circle
              cx="64"
              cy="64"
              r="52"
              className="stroke-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
              strokeWidth="4.5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 52}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - todayProgressPercent / 100) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>

          {/* Glowing central star node with classic sparkles overlay on click */}
          <motion.div
            className="relative cursor-pointer group z-10"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              triggerSparks(e);
            }}
          >
            {/* Pulsing Back Auras */}
            {hasCompletedToday ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 blur-2xl rounded-full scale-150 opacity-80 animate-pulse duration-[3s]" />
                <div className="absolute inset-0 bg-amber-300/30 blur-xl rounded-full scale-125 opacity-90 animate-ping duration-[4s]" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-amber-400/25 blur-xl rounded-full scale-125 opacity-70 animate-pulse" />
                <div className="absolute inset-0 bg-purple-500/15 blur-lg rounded-full animate-pulse duration-[4s]" />
              </>
            )}
            
            <div className={`relative p-6 bg-gradient-to-tr from-amber-400/10 to-purple-500/10 rounded-full flex items-center justify-center transition-all duration-500 ${
              hasCompletedToday ? "border-2 border-amber-400" : "border border-amber-400/30"
            }`}>
              <CustomStar className="w-14 h-14 group-hover:rotate-12 transition-transform duration-500" active={true} glow={true} magicalGlow={hasCompletedToday} />
              
              {/* Floating streak counter in the star's center */}
              <span className="absolute text-sm font-black font-mono text-neutral-950 tracking-tighter select-none mt-0.5">
                {currentStreak}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Dynamic status display */}
        <div className="text-center mt-3 z-10 space-y-1">
          <span className="text-xs font-bold text-gray-200 tracking-wide block uppercase">
            {currentStreak === 0 ? "Celestial Flame Inactive" : `${currentStreak} Day Starry Streak`}
          </span>
          
          {/* Dynamic Cosmic Rank Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider uppercase border bg-black/40 border-white/5 shadow-inner mt-1">
            <Zap className={`w-3 h-3 ${rank.color} animate-pulse`} />
            <span className={rank.color}>{rank.title}</span>
          </div>

          <p className="text-[10px] text-gray-400 mt-1.5 max-w-[260px] leading-relaxed font-sans mx-auto">
            {currentStreak === 0 
              ? "Complete a focus session today to spark up your first constellation star!"
              : rank.desc}
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-white/5 mb-3.5 z-10 relative">
        <button
          onClick={() => setActiveTab("tracker")}
          className={`flex-1 pb-2 text-center text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "tracker"
              ? "border-amber-400 text-amber-400 font-bold"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          Weekly Constellation
        </button>
        <button
          onClick={() => setActiveTab("milestones")}
          className={`flex-1 pb-2 text-center text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "milestones"
              ? "border-amber-400 text-amber-400 font-bold"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          Star Achievements
        </button>
      </div>

      {/* Tab content area */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar z-10 relative">
        <AnimatePresence mode="wait">
          {activeTab === "tracker" ? (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Weekday constellation nodes connected by a static energy path */}
              <div className="relative p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                
                {/* Constellation power line (subtle static gradient track, no fast light beam) */}
                <div className="absolute left-[8%] right-[8%] h-[2px] top-[40px] pointer-events-none z-0 rounded-full bg-gradient-to-r from-purple-600/30 via-amber-400/40 to-pink-500/30" />

                <div className="grid grid-cols-7 gap-1.5 relative z-10">
                  {weekDays.map((day) => {
                    const isHovered = hoveredDay === day.dateStr;
                    return (
                      <div
                        key={day.dateStr}
                        onMouseEnter={() => setHoveredDay(day.dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all duration-300 relative ${
                          day.hasCompleted
                            ? "bg-amber-400/[0.04] border-amber-400/25 text-white shadow-lg shadow-amber-400/5"
                            : "bg-white/[0.01] border-white/5 text-gray-500"
                        }`}
                      >
                        <span className="text-[9px] font-mono font-bold tracking-tight uppercase">
                          {day.label}
                        </span>

                        <div className="my-2.5 relative flex items-center justify-center w-6 h-6">
                          {day.hasCompleted ? (
                            <>
                              <motion.div
                                className="absolute w-5 h-5 bg-amber-400/20 blur-md rounded-full"
                                animate={{ scale: [1, 1.25, 1] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              />
                              <CustomStar className="w-5 h-5 cursor-pointer" active={true} glow={true} magicalGlow={true} />
                            </>
                          ) : (
                            <CustomStar className="w-5 h-5 cursor-pointer" active={false} />
                          )}
                        </div>

                        <span className={`text-[10px] font-mono font-bold ${day.hasCompleted ? "text-gray-200" : "text-gray-600"}`}>
                          {day.dayNum}
                        </span>

                        {/* Interactive floating popover detailing the focus minutes */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 5 }}
                              className="absolute bottom-full mb-2 w-28 bg-neutral-950/95 border border-white/10 rounded-lg p-2 text-center pointer-events-none z-50 shadow-2xl"
                            >
                              <div className="text-[10px] font-semibold text-gray-200">
                                {day.hasCompleted ? "Star Active 🌟" : "No Stars Yet"}
                              </div>
                              <div className="text-[9px] text-gray-400 mt-0.5">
                                {day.totalMin}m focused
                              </div>
                              {day.sessionsCount > 0 && (
                                <div className="text-[8px] text-amber-400/80 mt-0.5 font-mono">
                                  {day.sessionsCount} session{day.sessionsCount > 1 ? "s" : ""}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress towards daily goal bar */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px] font-sans text-gray-300">Today's Focus Goal:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-white/5 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-purple-500 h-full rounded-full"
                      style={{ width: `${todayProgressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold font-mono text-white">
                    {todayMinutes}/{dailyGoalMinutes}m
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="milestones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Gamified milestone progress header */}
              <div className="p-3 bg-gradient-to-b from-purple-950/20 to-transparent border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-gray-400 uppercase">Next Star Tier:</span>
                  <span className="text-amber-400 font-bold">{nextMilestone.name}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-purple-500 to-pink-500 h-full rounded-full"
                    style={{ width: `${milestonePercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] text-gray-500 font-sans">
                  <span>Current Streak: {currentStreak} days</span>
                  <span>Target: {nextMilestone.days} days</span>
                </div>
              </div>

              {/* Milestones cards */}
              <div className="space-y-2">
                {milestones.map((m) => {
                  const isUnlocked = currentStreak >= m.days;
                  return (
                    <motion.div
                      key={m.name}
                      whileHover={{ scale: isUnlocked ? 1.01 : 1 }}
                      className={`flex items-center justify-between p-3 rounded-xl border bg-gradient-to-r transition-all duration-300 ${
                        isUnlocked
                          ? `${m.color} shadow-md border-opacity-40`
                          : "from-white/[0.01] to-transparent border-white/5 opacity-45 text-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl filter drop-shadow-md select-none">{m.icon}</div>
                        <div>
                          <div className={`text-xs font-bold ${isUnlocked ? "text-white" : "text-gray-400"}`}>
                            {m.name}
                          </div>
                          <div className="text-[9px] text-gray-500 font-sans mt-0.5">{m.desc}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/20 border border-white/5 text-gray-400">
                          {m.days} {m.days === 1 ? "DAY" : "DAYS"}
                        </span>
                        {isUnlocked && (
                          <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-0.5 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" /> Unlocked
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

import React, { useState } from "react";
import {
  Award,
  Zap,
  Clock,
  AlertCircle,
  TrendingUp,
  Sun,
  Moon,
  Coffee,
  Hourglass,
  Flame,
  Sparkles,
  Activity,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { FocusSession } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

// Custom Recharts Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const progressPercent = Math.round((data.studyTime / data.dailyGoal) * 100);
    return (
      <div className="bg-neutral-950 border border-white/10 p-2.5 rounded-xl text-[10px] shadow-xl font-sans text-white">
        <p className="font-semibold text-gray-200 mb-1">{data.day} ({data.dateStr})</p>
        <p className="text-amber-400 font-mono">Study Time: {data.studyTime} mins</p>
        <p className="text-gray-400 font-mono">Goal: {data.dailyGoal} mins</p>
        <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${progressPercent >= 100 ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span className="text-gray-300 font-mono">{progressPercent}% of Goal</span>
        </div>
      </div>
    );
  }
  return null;
};

interface StatsWidgetProps {
  sessions: FocusSession[];
  dailyGoalMinutes: number;
}

export default function StatsWidget({ sessions, dailyGoalMinutes }: StatsWidgetProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "weekly" | "hourly">("summary");

  // Filter completed focus sessions (ignore short/long breaks)
  const completedFocusSessionsList = sessions.filter(
    (s) => s.completed && s.mode !== "shortBreak" && s.mode !== "longBreak"
  );

  const totalFocusSeconds = completedFocusSessionsList.reduce((acc, s) => acc + s.duration, 0);
  const totalFocusMins = Math.round(totalFocusSeconds / 60);
  const completedFocusSessionsCount = completedFocusSessionsList.length;

  // Total Focus Sessions started (including incomplete ones, excluding break sessions)
  const totalFocusSessionsStarted = sessions.filter(
    (s) => s.mode !== "shortBreak" && s.mode !== "longBreak"
  ).length;

  // Focus Completion Rate
  const completionRate = totalFocusSessionsStarted > 0
    ? Math.round((completedFocusSessionsCount / totalFocusSessionsStarted) * 100)
    : 100;

  // Average focus session length
  const avgSessionDuration = completedFocusSessionsCount > 0
    ? Math.round((totalFocusSeconds / completedFocusSessionsCount) / 60)
    : 0;

  // Simple Streak Calculator
  const getStreakCount = () => {
    if (sessions.length === 0) return 0;
    
    // Sort unique dates of completed focus sessions
    const dates = completedFocusSessionsList.map((s) => s.startTime.substring(0, 10));
    const uniqueDates = Array.from(new Set(dates)).sort();
    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    const todayStr = new Date().toISOString().substring(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    // If no session today or yesterday, streak is broken
    const lastSessionDate = uniqueDates[uniqueDates.length - 1];
    if (lastSessionDate !== todayStr && lastSessionDate !== yesterdayStr) {
      return 0;
    }

    streak = 1;
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const current = new Date(uniqueDates[i + 1]);
      const prev = new Date(uniqueDates[i]);
      const diffTime = Math.abs(current.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        break; // streak ended
      }
    }

    return streak;
  };

  const streak = getStreakCount();

  // Build Hourly Activity Graph (0 to 23 hours)
  const getHourlyDistribution = () => {
    const hours = Array(24).fill(0);
    completedFocusSessionsList.forEach((s) => {
      try {
        const hour = new Date(s.startTime).getHours();
        hours[hour] += Math.round(s.duration / 60);
      } catch (e) {
        // ignore date parse errors
      }
    });
    return hours;
  };

  const hourlyData = getHourlyDistribution();
  const maxMinsInAnHour = Math.max(...hourlyData, 1);

  // Time of Day Focus Analysis & Persona Generator
  const getTimeOfDayAnalysis = () => {
    const timeOfDays = {
      morning: 0,   // 5 AM to 11 AM
      afternoon: 0, // 11 AM to 5 PM
      evening: 0,   // 5 PM to 10 PM
      night: 0,     // 10 PM to 5 AM
    };

    completedFocusSessionsList.forEach((s) => {
      try {
        const hour = new Date(s.startTime).getHours();
        if (hour >= 5 && hour < 11) timeOfDays.morning += Math.round(s.duration / 60);
        else if (hour >= 11 && hour < 17) timeOfDays.afternoon += Math.round(s.duration / 60);
        else if (hour >= 17 && hour < 22) timeOfDays.evening += Math.round(s.duration / 60);
        else timeOfDays.night += Math.round(s.duration / 60);
      } catch (e) {}
    });

    const totalCalc = timeOfDays.morning + timeOfDays.afternoon + timeOfDays.evening + timeOfDays.night || 1;
    
    // Find peak period
    let peakPeriod: "morning" | "afternoon" | "evening" | "night" = "morning";
    let maxVal = timeOfDays.morning;
    if (timeOfDays.afternoon > maxVal) { peakPeriod = "afternoon"; maxVal = timeOfDays.afternoon; }
    if (timeOfDays.evening > maxVal) { peakPeriod = "evening"; maxVal = timeOfDays.evening; }
    if (timeOfDays.night > maxVal) { peakPeriod = "night"; maxVal = timeOfDays.night; }

    let personaTitle = "Steady Explorer";
    let personaDesc = "Log focus sessions to unlock your personalized study slot analysis.";
    let PersonaIcon = Hourglass;
    let personaColor = "text-amber-400 bg-amber-400/10 border-amber-400/20";

    if (maxVal > 0) {
      if (peakPeriod === "morning") {
        personaTitle = "Dawn Chaser";
        personaDesc = "You conquer your biggest tasks first thing in the morning when mental clarity is pristine.";
        PersonaIcon = Sun;
        personaColor = "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      } else if (peakPeriod === "afternoon") {
        personaTitle = "Midday Captain";
        personaDesc = "You harness peak afternoon momentum to sail through complex problems smoothly.";
        PersonaIcon = Coffee;
        personaColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
      } else if (peakPeriod === "evening") {
        personaTitle = "Sunset Sage";
        personaDesc = "As the day winds down, your mind sharpens into deep, reflective, quiet thinking.";
        PersonaIcon = Sparkles;
        personaColor = "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";
      } else {
        personaTitle = "Midnight Sorcerer";
        personaDesc = "You find ultimate clarity in the silence of the night, working while the world rests.";
        PersonaIcon = Moon;
        personaColor = "text-purple-400 bg-purple-400/10 border-purple-400/20";
      }
    }

    return {
      peakPeriod,
      maxVal,
      personaTitle,
      personaDesc,
      PersonaIcon,
      personaColor,
      shares: {
        morning: Math.round((timeOfDays.morning / totalCalc) * 100),
        afternoon: Math.round((timeOfDays.afternoon / totalCalc) * 100),
        evening: Math.round((timeOfDays.evening / totalCalc) * 100),
        night: Math.round((timeOfDays.night / totalCalc) * 100),
      }
    };
  };

  const analysis = getTimeOfDayAnalysis();

  // Focus Modes Distribution
  const getModesDistribution = () => {
    const modes: Record<string, number> = { pomodoro: 0, stopwatch: 0, countdown: 0 };
    completedFocusSessionsList.forEach((s) => {
      if (s.mode in modes) {
        modes[s.mode] += Math.round(s.duration / 60);
      }
    });

    const total = (modes.pomodoro + modes.stopwatch + modes.countdown) || 1;
    return {
      pomodoro: { mins: modes.pomodoro, pct: Math.round((modes.pomodoro / total) * 100) },
      stopwatch: { mins: modes.stopwatch, pct: Math.round((modes.stopwatch / total) * 100) },
      countdown: { mins: modes.countdown, pct: Math.round((modes.countdown / total) * 100) },
    };
  };

  const modesPct = getModesDistribution();

  // Build Weekly Progress data for recharts
  const getWeeklyProgressData = () => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = [];
    
    // Last 7 days starting from 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10); // YYYY-MM-DD
      const dayName = daysOfWeek[d.getDay()];
      
      const mins = sessions
        .filter((s) => s.completed && s.mode !== "shortBreak" && s.mode !== "longBreak" && s.startTime.startsWith(dateStr))
        .reduce((acc, s) => acc + Math.round(s.duration / 60), 0);
        
      data.push({
        dateStr,
        day: dayName,
        studyTime: mins,
        dailyGoal: dailyGoalMinutes,
      });
    }
    return data;
  };

  const weeklyData = getWeeklyProgressData();
  const goalPercentage = Math.min(100, Math.round((totalFocusMins / dailyGoalMinutes) * 100));

  // Find best focus day
  const bestDay = weeklyData.reduce((max, d) => (d.studyTime > max.studyTime ? d : max), { day: "N/A", studyTime: 0, dateStr: "" });

  return (
    <div id="stats-widget" className="bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4.5 shadow-2xl flex flex-col h-full text-white select-none">
      
      {/* Header with high-fidelity toggle switches */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-sans font-semibold text-sm text-gray-200 tracking-tight flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            Productivity Analytics
          </h3>
          <p className="font-sans text-[11px] text-gray-400">Track and optimize your cognitive momentum</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/5 border border-white/5 p-0.5 rounded-xl self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "summary"
                ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("weekly")}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "weekly"
                ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Weekly Goals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hourly")}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "hourly"
                ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Hourly Activity
          </button>
        </div>
      </div>

      {/* KPI Banner Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <Clock className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
          <span className="font-mono text-sm font-semibold tracking-tight text-white">{totalFocusMins}m</span>
          <span className="font-sans text-[9px] text-gray-500">Total focus</span>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <Award className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
          <span className="font-mono text-sm font-semibold tracking-tight text-white">{completedFocusSessionsCount}</span>
          <span className="font-sans text-[9px] text-gray-500">Completed</span>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <Flame className="w-3.5 h-3.5 text-orange-400 mb-0.5" />
          <span className="font-mono text-sm font-semibold tracking-tight text-white">{streak}d</span>
          <span className="font-sans text-[9px] text-gray-500">Streak</span>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-3.5 h-3.5 text-indigo-400 mb-0.5" />
          <span className="font-mono text-sm font-semibold tracking-tight text-white">{completionRate}%</span>
          <span className="font-sans text-[9px] text-gray-500">Completion</span>
        </div>
      </div>

      {/* Main Multi-Tab View Container */}
      <div className="flex-1 min-h-0">
        
        {/* TAB 1: SUMMARY & PERSONA */}
        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            
            {/* Left Box: Creative Bio-Rhythm Persona Card */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="font-sans text-[9px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Bio-Rhythm Profile
                </span>

                {/* Identity Icon & Badge */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${analysis.personaColor} flex items-center justify-center shrink-0 shadow-inner`}>
                    <analysis.PersonaIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-gray-150">{analysis.personaTitle}</h4>
                    <p className="font-sans text-[10px] text-gray-400">Peak study slot: {analysis.peakPeriod.toUpperCase()}</p>
                  </div>
                </div>

                <p className="font-sans text-[11px] text-gray-300 leading-relaxed pt-1">
                  {analysis.personaDesc}
                </p>
              </div>

              {/* Mini Horizontal Distribution Gauge */}
              <div className="space-y-1.5 pt-3 border-t border-white/5">
                <span className="font-sans text-[8px] text-gray-400 uppercase font-bold tracking-wider block">Diurnal Focus Shares</span>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                  <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${analysis.shares.morning}%` }} title={`Morning: ${analysis.shares.morning}%`} />
                  <div className="h-full bg-orange-400 transition-all duration-300" style={{ width: `${analysis.shares.afternoon}%` }} title={`Afternoon: ${analysis.shares.afternoon}%`} />
                  <div className="h-full bg-indigo-400 transition-all duration-300" style={{ width: `${analysis.shares.evening}%` }} title={`Evening: ${analysis.shares.evening}%`} />
                  <div className="h-full bg-purple-400 transition-all duration-300" style={{ width: `${analysis.shares.night}%` }} title={`Night: ${analysis.shares.night}%`} />
                </div>
                <div className="flex justify-between text-[8px] text-gray-500 font-mono">
                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" /> {analysis.shares.morning}%</span>
                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-orange-400 rounded-full" /> {analysis.shares.afternoon}%</span>
                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> {analysis.shares.evening}%</span>
                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> {analysis.shares.night}%</span>
                </div>
              </div>
            </div>

            {/* Right Box: Metrics Breakdown & Progress Tracker */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
              
              {/* Daily Goal Quick-Gauge */}
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      className="stroke-white/5"
                      strokeWidth="2.5"
                      fill="transparent"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      className="stroke-emerald-400 transition-all duration-500"
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 * (1 - goalPercentage / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="font-mono text-[10px] font-bold text-white">{goalPercentage}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-sans text-[9px] uppercase font-bold text-gray-400 tracking-wider">Today's Target Progress</span>
                  <p className="font-mono text-xs font-semibold mt-0.5 text-emerald-400">{totalFocusMins} / {dailyGoalMinutes}m</p>
                  <p className="font-sans text-[10px] text-gray-400 truncate leading-relaxed mt-0.5">
                    {goalPercentage >= 100 ? "Goal met! Stellar job." : `${Math.max(0, dailyGoalMinutes - totalFocusMins)}m left to complete goal.`}
                  </p>
                </div>
              </div>

              {/* Study Mode Breakdown */}
              <div className="space-y-1.5 pt-3 border-t border-white/5">
                <span className="font-sans text-[8px] text-gray-400 uppercase font-bold tracking-wider block">Focus Method Allocation</span>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-300 font-sans mb-0.5">
                      <span>Pomodoro Session (🍅)</span>
                      <span className="font-mono text-amber-400">{modesPct.pomodoro.mins}m ({modesPct.pomodoro.pct}%)</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${modesPct.pomodoro.pct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] text-gray-300 font-sans mb-0.5">
                      <span>Stopwatch Flow (⏱️)</span>
                      <span className="font-mono text-emerald-400">{modesPct.stopwatch.mins}m ({modesPct.stopwatch.pct}%)</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${modesPct.stopwatch.pct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] text-gray-300 font-sans mb-0.5">
                      <span>Classic Countdown (⏳)</span>
                      <span className="font-mono text-indigo-400">{modesPct.countdown.mins}m ({modesPct.countdown.pct}%)</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${modesPct.countdown.pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: WEEKLY GOALS RECHARTS BAR CHART */}
        {activeTab === "weekly" && (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-sans text-[9px] uppercase font-bold tracking-wider text-amber-400">Weekly Goal Accomplishments</span>
                {bestDay.studyTime > 0 && (
                  <span className="font-sans text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Peak Day: {bestDay.day} ({bestDay.studyTime}m)
                  </span>
                )}
              </div>
              <p className="font-sans text-[10px] text-gray-400 mb-2">Comparison of your daily focus duration against the {dailyGoalMinutes}m threshold target.</p>
            </div>

            {/* Recharts Bar Chart Wrapper */}
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 8, right: 10, left: -25, bottom: -5 }}>
                  <defs>
                    <linearGradient id="glowingBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#9ca3af', fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
                  <ReferenceLine
                    y={dailyGoalMinutes}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: "Goal",
                      fill: "#10b981",
                      fontSize: 8,
                      position: "right",
                      offset: 5
                    }}
                  />
                  <Bar
                    dataKey="studyTime"
                    fill="url(#glowingBarGrad)"
                    stroke="#fbbf24"
                    strokeWidth={1}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Analytical Footer Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2.5 mt-2 border-t border-white/5 text-[9px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-gray-400">Average Session:</span>
                <span className="font-mono font-bold text-white">{avgSessionDuration} mins</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-gray-400">Goal Meet Rate:</span>
                <span className="font-mono font-bold text-white">
                  {Math.round((weeklyData.filter((d) => d.studyTime >= dailyGoalMinutes).length / 7) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HOURLY ACTIVITY CHRONOLOGY */}
        {activeTab === "hourly" && (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-sans text-[9px] uppercase font-bold tracking-wider text-amber-400">Chronological Focus Grid</span>
                <span className="font-sans text-[9px] text-amber-400 font-semibold">
                  Peak Working Hour: {hourlyData.indexOf(Math.max(...hourlyData))}:00
                </span>
              </div>
              <p className="font-sans text-[10px] text-gray-400 mb-2">Hourly distribution of your completed deep work to recognize productivity surges during the 24-hour cycle.</p>
            </div>

            {/* Stylized custom SVG Bar Chart to display micro-chronological hours */}
            <div className="h-32 flex items-end gap-1.5 bg-black/20 border border-white/5 rounded-xl p-3 relative overflow-hidden">
              {hourlyData.map((mins, hour) => {
                const hPercent = (mins / maxMinsInAnHour) * 100;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                    
                    {/* Glowing indicator on hover */}
                    <div className="absolute bottom-full mb-1 bg-neutral-950 border border-white/10 text-white font-mono text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none whitespace-nowrap shadow-xl">
                      {mins}m focused at {hour}:00
                    </div>

                    <div
                      style={{ height: `${Math.max(4, hPercent)}%` }}
                      className={`w-full rounded-t transition-all duration-300 cursor-help ${
                        mins > 0 
                          ? "bg-gradient-to-t from-amber-500/80 to-amber-300 hover:from-amber-400 hover:to-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.1)]" 
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    />
                    
                    <span className="font-mono text-[7px] text-gray-500 mt-1.5 scale-90 group-hover:text-white transition-colors">
                      {hour % 6 === 0 ? `${hour}h` : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Informational Tip */}
            <div className="flex items-center gap-1.5 pt-2.5 text-[9px] text-gray-400">
              <AlertCircle className="w-3 h-3 text-amber-400/80" />
              <span>Schedule high-cognitive tasks during hours with higher bar heights to exploit your natural biological focus momentum.</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

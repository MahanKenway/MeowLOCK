import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, Settings, Maximize2, Minimize2, Bell, BellOff, ArrowRight } from "lucide-react";
import { TimerMode, TimerSettings, FocusSession, Task, WorkspaceProfile } from "../types";
import { getSystemTime } from "../utils/time";

import MinimalModeOverlay from "./MinimalModeOverlay";
import TiltedCard from "./TiltedCard";

interface TimerWidgetProps {
  settings: TimerSettings;
  onSettingsChange: (settings: TimerSettings) => void;
  onSessionComplete: (session: FocusSession) => void;
  activeProfileName: string;
  isMinimalMode?: boolean;
  onExitMinimalMode?: () => void;
  isImmersiveCenter?: boolean;
  clockFontClass?: string;
  clockSize?: number;
  onClockSizeChange?: (size: number) => void;
  clockColor?: string;
  onClockColorChange?: (color: string) => void;
  username?: string;
  windowRoundness?: number;
  onClose?: () => void;
  activeTask?: Task | null;
  isMobile?: boolean;
  activeProfile?: WorkspaceProfile;
  
  // Zen widgets support
  widgetsState?: {
    todo: boolean;
    music: boolean;
    notes: boolean;
    mixer: boolean;
    stats: boolean;
    streak: boolean;
    radio: boolean;
    calendar: boolean;
    space: boolean;
    wellness: boolean;
    weather: boolean;
    cat: boolean;
  };
  onToggleWidget?: (name: "todo" | "music" | "notes" | "mixer" | "stats" | "wellness") => void;
  onToggleRadio?: () => void;
  onToggleCalendar?: () => void;
  onToggleStreak?: () => void;
  onToggleSpace?: () => void;
  onToggleWeather?: () => void;
  onToggleCat?: () => void;
}

export default function TimerWidget({
  settings,
  onSettingsChange,
  onSessionComplete,
  activeProfileName,
  isMinimalMode = false,
  onExitMinimalMode,
  isImmersiveCenter = false,
  clockFontClass = "font-clock-outfit",
  clockSize = 120,
  onClockSizeChange,
  clockColor = "white",
  onClockColorChange,
  username = "Focus User",
  windowRoundness = 16,
  onClose,
  activeTask = null,
  isMobile = false,
  activeProfile,
  widgetsState,
  onToggleWidget,
  onToggleRadio,
  onToggleCalendar,
  onToggleStreak,
  onToggleSpace,
  onToggleWeather,
  onToggleCat
}: TimerWidgetProps) {
  const miniRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<TimerMode | "clock">(isImmersiveCenter ? "clock" : "pomodoro");
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [customCountdownMin, setCustomCountdownMin] = useState(settings.countdown);
  const [showConfig, setShowConfig] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(getSystemTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getSystemTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Manual time / date override states
  const [overrideEnabled, setOverrideEnabled] = useState(
    localStorage.getItem("focus_time_override_enabled") === "true"
  );
  
  // Calculate current simulated/manual date and time to initialize inputs
  const currentSimulatedTime = getSystemTime();
  const initDate = currentSimulatedTime.getFullYear() + "-" + 
                   String(currentSimulatedTime.getMonth() + 1).padStart(2, "0") + "-" + 
                   String(currentSimulatedTime.getDate()).padStart(2, "0");
  const initTime = `${String(currentSimulatedTime.getHours()).padStart(2, "0")}:${String(currentSimulatedTime.getMinutes()).padStart(2, "0")}`;
  
  const [overrideDate, setOverrideDate] = useState(initDate);
  const [overrideTime, setOverrideTime] = useState(initTime);

  // Sync state with storage changes (e.g. if updated from elsewhere)
  useEffect(() => {
    const handleStorageChange = () => {
      const isEnabled = localStorage.getItem("focus_time_override_enabled") === "true";
      setOverrideEnabled(isEnabled);
      const cur = getSystemTime();
      const dStr = cur.getFullYear() + "-" + 
                   String(cur.getMonth() + 1).padStart(2, "0") + "-" + 
                   String(cur.getDate()).padStart(2, "0");
      const tStr = `${String(cur.getHours()).padStart(2, "0")}:${String(cur.getMinutes()).padStart(2, "0")}`;
      setOverrideDate(dStr);
      setOverrideTime(tStr);
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus-time-override", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus-time-override", handleStorageChange);
    };
  }, []);

  const handleOverrideToggle = (enabled: boolean) => {
    setOverrideEnabled(enabled);
    localStorage.setItem("focus_time_override_enabled", String(enabled));
    if (!enabled) {
      localStorage.removeItem("focus_time_offset");
    } else {
      applyOverrideOffset(overrideDate, overrideTime);
    }
    // Fire storage events so other widgets refresh immediately
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("focus-time-override"));
  };

  const applyOverrideOffset = (dateStr: string, timeStr: string) => {
    try {
      const targetStr = `${dateStr}T${timeStr}:00`;
      const targetDate = new Date(targetStr);
      if (!isNaN(targetDate.getTime())) {
        const offset = targetDate.getTime() - Date.now();
        localStorage.setItem("focus_time_offset", String(offset));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOverrideDateChange = (date: string) => {
    setOverrideDate(date);
    if (overrideEnabled) {
      applyOverrideOffset(date, overrideTime);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("focus-time-override"));
    }
  };

  const handleOverrideTimeChange = (time: string) => {
    setOverrideTime(time);
    if (overrideEnabled) {
      applyOverrideOffset(overrideDate, time);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("focus-time-override"));
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<string | null>(null);

  // Sync timers when settings change
  useEffect(() => {
    if (!isRunning) {
      if (mode === "pomodoro") setTimeLeft(settings.pomodoro * 60);
      else if (mode === "shortBreak") setTimeLeft(settings.shortBreak * 60);
      else if (mode === "longBreak") setTimeLeft(settings.longBreak * 60);
      else if (mode === "countdown") setTimeLeft(settings.countdown * 60);
    }
  }, [settings, mode]);

  // Dispatch timer state for other widgets (like the Cat Companion)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("zen-timer-state", {
      detail: { isRunning, mode }
    }));
  }, [isRunning, mode]);

  // Synthesize notification bell completely in Web Audio API (meditation bowl chime)
  const playChimeSound = () => {
    if (!settings.soundEnabled) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const playTone = (freq: number, startDelay: number, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + startDelay + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startDelay + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      // Play rich chord representing a beautiful Japanese temple gong
      playTone(180, 0, 3.5, 0.4);
      playTone(270, 0.05, 3.0, 0.2);
      playTone(360, 0.1, 2.5, 0.15);
      playTone(450, 0.15, 2.0, 0.1);

      // Safely auto-close AudioContext to free browser resources
      setTimeout(() => {
        try {
          ctx.close();
        } catch (err) {}
      }, 4000);
    } catch (err) {
      console.error("Failed to synthesize audio notification:", err);
    }
  };

  // Run Countdown Timer
  useEffect(() => {
    if (isRunning && mode !== "stopwatch") {
      if (!startTimeRef.current) {
        startTimeRef.current = getSystemTime().toISOString();
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playChimeSound();

            // Record completed session
            const elapsed = mode === "pomodoro" ? settings.pomodoro * 60 
                          : mode === "shortBreak" ? settings.shortBreak * 60
                          : mode === "longBreak" ? settings.longBreak * 60
                          : settings.countdown * 60;
            
            onSessionComplete({
              id: Math.random().toString(36).substring(2),
              startTime: startTimeRef.current || getSystemTime().toISOString(),
              duration: elapsed,
              mode: mode as TimerMode,
              completed: true,
              profileName: activeProfileName,
            });

            startTimeRef.current = null;

            // Auto start next mode
            if (settings.autoStartNext) {
              if (mode === "pomodoro") {
                setMode("shortBreak");
                setTimeLeft(settings.shortBreak * 60);
                setTimeout(() => setIsRunning(true), 1000);
              } else if (mode === "shortBreak" || mode === "longBreak") {
                setMode("pomodoro");
                setTimeLeft(settings.pomodoro * 60);
                setTimeout(() => setIsRunning(true), 1000);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, settings, activeProfileName]);

  // Run Stopwatch Timer
  useEffect(() => {
    if (isRunning && mode === "stopwatch") {
      if (!startTimeRef.current) {
        startTimeRef.current = getSystemTime().toISOString();
      }

      stopwatchRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    }

    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isRunning, mode]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    startTimeRef.current = null;

    if (mode === "stopwatch") {
      // Record completed stopwatch time if any
      if (stopwatchTime > 10) {
        onSessionComplete({
          id: Math.random().toString(36).substring(2),
          startTime: getSystemTime().toISOString(),
          duration: stopwatchTime,
          mode: "stopwatch",
          completed: true,
          profileName: activeProfileName,
        });
      }
      setStopwatchTime(0);
    } else {
      if (mode === "pomodoro") setTimeLeft(settings.pomodoro * 60);
      else if (mode === "shortBreak") setTimeLeft(settings.shortBreak * 60);
      else if (mode === "longBreak") setTimeLeft(settings.longBreak * 60);
      else if (mode === "countdown") setTimeLeft(settings.countdown * 60);
    }
  };

  const handleModeChange = (newMode: TimerMode | "clock") => {
    setIsRunning(false);
    setMode(newMode);
    startTimeRef.current = null;

    if (newMode === "pomodoro") setTimeLeft(settings.pomodoro * 60);
    else if (newMode === "shortBreak") setTimeLeft(settings.shortBreak * 60);
    else if (newMode === "longBreak") setTimeLeft(settings.longBreak * 60);
    else if (newMode === "countdown") setTimeLeft(settings.countdown * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const saveTimerConfig = (field: keyof TimerSettings, value: any) => {
    const nextSettings = { ...settings, [field]: value };
    onSettingsChange(nextSettings);
  };

  const getPercentage = () => {
    if (mode === "clock" || mode === "stopwatch") return 100;
    let total = settings.pomodoro * 60;
    if (mode === "shortBreak") total = settings.shortBreak * 60;
    if (mode === "longBreak") total = settings.longBreak * 60;
    if (mode === "countdown") total = settings.countdown * 60;

    return (timeLeft / total) * 100;
  };

  // Fullscreen Minimal Mode Focus overlay
  if (isMinimalMode) {
    return (
      <MinimalModeOverlay
        timeLeft={timeLeft}
        stopwatchTime={stopwatchTime}
        mode={mode}
        isRunning={isRunning}
        onToggleStartPause={handleStartPause}
        onReset={handleReset}
        onExit={onExitMinimalMode || (() => {})}
        onModeChange={handleModeChange}
        clockFontClass={clockFontClass}
        clockSize={clockSize}
        onClockSizeChange={onClockSizeChange}
        clockColor={clockColor}
        onClockColorChange={onClockColorChange}
        settings={settings}
        onSettingsChange={onSettingsChange}
        activeProfileName={activeProfileName}
        activeProfile={activeProfile}
        widgetsState={widgetsState}
        onToggleWidget={onToggleWidget}
        onToggleRadio={onToggleRadio}
        onToggleCalendar={onToggleCalendar}
        onToggleStreak={onToggleStreak}
        onToggleSpace={onToggleSpace}
        onToggleWeather={onToggleWeather}
        onToggleCat={onToggleCat}
      />
    );
  }

  // Mini Floating Window view
  if (isMiniMode) {
    return (
      <motion.div
        drag={isMobile ? false : true}
        dragMomentum={true}
        dragElastic={0.1}
        dragTransition={{ power: 0.03, timeConstant: 1200 }}
        className="fixed bottom-6 right-6 z-50 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3 shadow-2xl flex items-center gap-4 text-white animate-bounce-subtle cursor-move"
      >
          <div className="flex flex-col">
            <span className="font-sans text-[10px] text-gray-400 capitalize">{mode}</span>
            <span className="font-mono text-lg font-semibold tracking-tight">
              {mode === "stopwatch" ? formatTime(stopwatchTime) : formatTime(timeLeft)}
            </span>
          </div>
          <button
            onClick={handleStartPause}
            className={`p-2 rounded-full transition-all ${
              isRunning ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white"
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            onClick={() => setIsMiniMode(false)}
            className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            title="Restore Full Timer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </motion.div>
    );
  }

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[currentTime.getDay()];

  const getTimerWidgetGreeting = (date: Date, name: string) => {
    const hours = date.getHours();
    const day = days[date.getDay()];
    const nameStr = name || "User";

    if (hours >= 5 && hours < 12) {
      return `Good morning, ${nameStr}! ☀️`;
    } else if (hours >= 12 && hours < 17) {
      return `Good afternoon, ${nameStr}! ☀️`;
    } else if (hours >= 17 && hours < 21) {
      return `Good evening, ${nameStr}! ☕`;
    } else {
      return `Good night, ${nameStr}! 🌌`;
    }
  };

  const formatCurrentTime = () => {
    let hrs = currentTime.getHours();
    const mins = currentTime.getMinutes().toString().padStart(2, "0");
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;
    return `${hrs}:${mins}`;
  };

  if (isImmersiveCenter) {
    return (
      <div className="flex flex-col items-center justify-center text-white h-full relative">
        {/* Dynamic greeting & day indicator */}
        <div className="text-center mb-6 animate-fade-in select-none">
          <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white drop-shadow-md">
            {getTimerWidgetGreeting(currentTime, username)}
          </h2>
          <p className="text-xs md:text-sm text-white/50 tracking-widest mt-1.5 font-medium">
            {dayName}'s been great!
          </p>
        </div>

        {/* Circular Ring and clock */}
        <div className="relative w-96 h-80 flex items-center justify-center my-2 animate-scale-up">
          {mode !== "clock" && (
            <svg className="absolute w-80 h-80 transform -rotate-90">
              <circle
                cx="160"
                cy="160"
                r="140"
                className="stroke-white/5"
                strokeWidth="3"
                fill="transparent"
              />
              <circle
                cx="160"
                cy="160"
                r="140"
                className="stroke-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)] transition-all duration-300"
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 140}
                strokeDashoffset={2 * Math.PI * 140 * (1 - getPercentage() / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
          )}
          <div className="flex flex-col items-center justify-center z-10 select-none">
            <span
              className={`${clockFontClass} font-light tracking-tighter text-white tabular-nums leading-none drop-shadow-2xl transition-all duration-500`}
              style={{ fontSize: `${clockSize}px` }}
            >
              {mode === "clock"
                ? formatCurrentTime()
                : mode === "stopwatch"
                ? formatTime(stopwatchTime)
                : formatTime(timeLeft)}
            </span>
            {mode !== "clock" && (
              <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-white/40 font-semibold mt-3">
                {mode === "shortBreak" ? "Short Break" : mode === "longBreak" ? "Long Break" : mode}
              </span>
            )}
          </div>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center gap-6 mt-2 z-10">
          {mode !== "clock" && (
            <button
              onClick={handleReset}
              className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-full transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {mode !== "clock" && (
            <button
              onClick={handleStartPause}
              className={`flex items-center gap-2 px-10 py-3 rounded-full font-sans font-semibold text-sm transition-all shadow-xl hover:scale-102 active:scale-98 ${
                isRunning
                  ? "bg-amber-500 hover:bg-amber-600 text-neutral-950 shadow-amber-500/10"
                  : "bg-white text-neutral-950 hover:bg-gray-100 shadow-white/10"
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? "Pause" : "Start"}
            </button>
          )}

          {/* Quick Config trigger */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-3 rounded-full transition-colors ${
              showConfig ? "bg-white/15 text-amber-400" : "bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            title="Timer Custom Durations"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector segment control */}
        <div className="flex gap-1 p-1 bg-neutral-950/40 backdrop-blur-md rounded-full border border-white/5 mt-8 z-10 shadow-lg">
          {(["clock", "pomodoro", "shortBreak", "longBreak", "stopwatch", "countdown"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-sans font-semibold transition-all capitalize cursor-pointer ${
                mode === m
                  ? "bg-amber-400 text-neutral-950 font-bold shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {m === "shortBreak" ? "Break" : m === "longBreak" ? "L. Break" : m}
            </button>
          ))}
        </div>

        {/* Config Overlay Modal */}
        {showConfig && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-scale-up">
              <h4 className="font-sans font-bold text-lg text-white mb-4">Focus Durations</h4>
              
              <div className="space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-sans text-xs text-gray-400 block mb-1">Pomodoro (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={settings.pomodoro}
                      onChange={(e) => saveTimerConfig("pomodoro", Math.max(1, parseInt(e.target.value) || 25))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-xs text-gray-400 block mb-1">Short Break (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.shortBreak}
                      onChange={(e) => saveTimerConfig("shortBreak", Math.max(1, parseInt(e.target.value) || 5))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-sans text-xs text-gray-400 block mb-1">Long Break (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.longBreak}
                      onChange={(e) => saveTimerConfig("longBreak", Math.max(1, parseInt(e.target.value) || 15))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-xs text-gray-400 block mb-1">Countdown (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={settings.countdown}
                      onChange={(e) => saveTimerConfig("countdown", Math.max(1, parseInt(e.target.value) || 10))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-white/10">
                  <span className="font-sans text-xs text-gray-300">Auto-start next session</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartNext}
                    onChange={(e) => saveTimerConfig("autoStartNext", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                {/* Manual Time & Date Override Section */}
                <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-sans font-semibold text-xs text-amber-400">Manual Time Override</h5>
                      <p className="font-sans text-[10px] text-gray-400">Adjust date & clock manually for testing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={overrideEnabled}
                        onChange={(e) => handleOverrideToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                    </label>
                  </div>

                  {overrideEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-3 pt-1"
                    >
                      <div>
                        <label className="font-sans text-[11px] text-gray-400 block mb-1">Set Date</label>
                        <input
                          type="date"
                          value={overrideDate}
                          onChange={(e) => handleOverrideDateChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="font-sans text-[11px] text-gray-400 block mb-1">Set Time</label>
                        <input
                          type="time"
                          value={overrideTime}
                          onChange={(e) => handleOverrideTimeChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none [color-scheme:dark]"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowConfig(false)}
                className="w-full bg-amber-400 hover:bg-amber-500 text-neutral-900 font-sans font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer"
              >
                Save & Apply Durations
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      drag={isMobile ? false : true}
      dragMomentum={true}
      dragElastic={0.06}
      dragTransition={{ power: 0.06, timeConstant: 180 }}
      id="timer-widget"
      data-window-title="Timer.exe"
      className={isMobile ? "relative w-full z-50 bg-[#0a0a0a]/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-white select-none retro-window" : "absolute top-6 right-6 z-50 bg-[#0a0a0a]/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-white select-none retro-window cursor-move"}
      style={{
        borderRadius: `${windowRoundness}px`,
        resize: isMobile ? 'none' : 'both',
        overflow: "auto",
        width: isMobile ? '100%' : 'auto',
        minWidth: isMobile ? '100%' : '320px',
        minHeight: isMobile ? 'auto' : '300px'
      }}
    >
      <TiltedCard
        imageSrc=""
        containerHeight="auto"
        containerWidth="100%"
        imageHeight="auto"
        imageWidth="100%"
        scaleOnHover={1.015}
        rotateAmplitude={4}
        showTooltip={false}
        noFallbackBg={true}
        relativeChildren={true}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
          {onClose && (
            <button
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
          <span className="font-sans text-[13px] font-bold text-white mb-2 capitalize">
            {mode === "shortBreak" ? "Short Break" : mode === "longBreak" ? "Long Break" : mode === "pomodoro" ? "Focus" : mode}
          </span>
          {activeTask && !activeTask.completed && mode === "pomodoro" && (
            <div className="mb-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-center max-w-[220px] truncate animate-pulse">
              <span className="text-[9px] text-amber-400 font-sans font-bold uppercase tracking-wider block">🎯 CURRENT FOCUS</span>
              <span className="text-[10px] text-gray-200 font-semibold truncate block mt-0.5">{activeTask.title}</span>
            </div>
          )}
          <span className={`${clockFontClass} text-[52px] font-bold tracking-tighter leading-none mb-4`}>
            {mode === "stopwatch" ? formatTime(stopwatchTime) : formatTime(timeLeft)}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartPause}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2 rounded-full font-sans font-bold text-[13px] transition-colors cursor-pointer w-[100px] shadow-lg"
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-full transition-all"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Mode Switcher inside the Floating Widget */}
          <div className="flex gap-1 p-0.5 bg-white/5 rounded-full border border-white/5 mt-4 select-none flex-wrap justify-center max-w-[250px]">
            {(["pomodoro", "shortBreak", "longBreak", "stopwatch", "countdown"] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold transition-all capitalize cursor-pointer ${
                  mode === m
                    ? "bg-white text-neutral-950 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "pomodoro" ? "Focus" : m === "shortBreak" ? "Break" : m === "longBreak" ? "L. Break" : m}
              </button>
            ))}
          </div>
        </div>
      </TiltedCard>
    </motion.div>
  );
}

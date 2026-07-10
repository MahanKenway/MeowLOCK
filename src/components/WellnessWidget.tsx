import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  HeartPulse, 
  Eye, 
  Coffee, 
  Droplets,
  BellRing,
  Volume2,
  VolumeX,
  Settings2
} from "lucide-react";
import { WellnessSettings } from "../types";

interface WellnessWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: WellnessSettings;
  onSettingsChange: (settings: WellnessSettings) => void;
}

const DEFAULT_SETTINGS: WellnessSettings = {
  breakReminderEnabled: false,
  breakInterval: 60,
  eyeCareEnabled: false,
  eyeCareInterval: 20,
  waterReminderEnabled: false,
  waterInterval: 45
};

export default function WellnessWidget({
  isOpen,
  onClose,
  settings = DEFAULT_SETTINGS,
  onSettingsChange
}: WellnessWidgetProps) {
  // Active alerts
  const [activeAlerts, setActiveAlerts] = useState<{ id: string; type: "break" | "eye" | "water"; message: string }[]>([]);

  // Refs for tracking time remaining without triggering re-renders every second for the UI
  const timersRef = useRef<{
    break: ReturnType<typeof setInterval> | null;
    eye: ReturnType<typeof setInterval> | null;
    water: ReturnType<typeof setInterval> | null;
  }>({ break: null, eye: null, water: null });

  // Handle playing a soft notification sound
  const playNotificationSound = () => {
    try {
      // A gentle, high-pitched "ding"
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // Drop to A4
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio play failed", e);
    }
  };

  const addAlert = (type: "break" | "eye" | "water", message: string) => {
    const id = Math.random().toString(36).substring(7);
    setActiveAlerts(prev => [...prev, { id, type, message }]);
    playNotificationSound();
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      dismissAlert(id);
    }, 15000);
  };

  const dismissAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // Setup Intervals
  useEffect(() => {
    // Clear existing
    if (timersRef.current.break) clearInterval(timersRef.current.break);
    if (timersRef.current.eye) clearInterval(timersRef.current.eye);
    if (timersRef.current.water) clearInterval(timersRef.current.water);

    if (settings.breakReminderEnabled && settings.breakInterval > 0) {
      timersRef.current.break = setInterval(() => {
        addAlert("break", "Time for a short break! Stand up and stretch.");
      }, settings.breakInterval * 60 * 1000);
    }

    if (settings.eyeCareEnabled && settings.eyeCareInterval > 0) {
      timersRef.current.eye = setInterval(() => {
        addAlert("eye", "20-20-20 Rule: Look at something 20 feet away for 20 seconds.");
      }, settings.eyeCareInterval * 60 * 1000);
    }

    if (settings.waterReminderEnabled && settings.waterInterval > 0) {
      timersRef.current.water = setInterval(() => {
        addAlert("water", "Hydration check! Drink a glass of water.");
      }, settings.waterInterval * 60 * 1000);
    }

    return () => {
      if (timersRef.current.break) clearInterval(timersRef.current.break);
      if (timersRef.current.eye) clearInterval(timersRef.current.eye);
      if (timersRef.current.water) clearInterval(timersRef.current.water);
    };
  }, [settings]);

  const toggleSetting = (key: keyof WellnessSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  const updateInterval = (key: keyof WellnessSettings, value: number) => {
    if (isNaN(value) || value < 1) return;
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <>
      {/* ALERTS OVERLAY (Always active regardless of widget being open) */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeAlerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-start gap-4 min-w-[300px] max-w-[400px]"
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                alert.type === 'break' ? 'bg-orange-500/20 text-orange-400' :
                alert.type === 'eye' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {alert.type === 'break' && <Coffee className="w-6 h-6" />}
                {alert.type === 'eye' && <Eye className="w-6 h-6" />}
                {alert.type === 'water' && <Droplets className="w-6 h-6" />}
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-white font-semibold mb-1 capitalize">{alert.type} Reminder</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{alert.message}</p>
              </div>
              <button 
                onClick={() => dismissAlert(alert.id)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* WIDGET UI */}
      <AnimatePresence mode="popLayout">
        {isOpen && (
          <motion.div
            key="wellness-widget"
            drag
            dragMomentum={true}
            dragElastic={0.1}
            className="pointer-events-auto absolute top-20 right-20 bg-neutral-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col retro-window p-5 z-40"
            style={{
              width: '380px',
              borderRadius: '16px'
            }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-500/20 rounded-lg">
                  <HeartPulse className="w-5 h-5 text-rose-400" />
                </div>
                <h2 className="text-white font-semibold tracking-tight font-sans">Wellness & Habits</h2>
              </div>
              <button
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Break Reminder */}
              <div className={`p-4 rounded-xl border transition-all ${settings.breakReminderEnabled ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Coffee className={`w-4 h-4 ${settings.breakReminderEnabled ? 'text-orange-400' : 'text-gray-500'}`} />
                    <span className={`font-medium ${settings.breakReminderEnabled ? 'text-orange-100' : 'text-gray-400'}`}>Take a Break</span>
                  </div>
                  <button 
                    onClick={() => toggleSetting('breakReminderEnabled')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.breakReminderEnabled ? 'bg-orange-500' : 'bg-neutral-700'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.breakReminderEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Notify me every</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={settings.breakInterval}
                      onChange={(e) => updateInterval('breakInterval', parseInt(e.target.value))}
                      className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-center text-white text-sm outline-none focus:border-orange-500/50"
                      min="1"
                    />
                    <span className="text-gray-500">min</span>
                  </div>
                </div>
              </div>

              {/* Eye Care */}
              <div className={`p-4 rounded-xl border transition-all ${settings.eyeCareEnabled ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className={`w-4 h-4 ${settings.eyeCareEnabled ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <span className={`font-medium ${settings.eyeCareEnabled ? 'text-emerald-100' : 'text-gray-400'}`}>20-20-20 Eye Care</span>
                  </div>
                  <button 
                    onClick={() => toggleSetting('eyeCareEnabled')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.eyeCareEnabled ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.eyeCareEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Look at something 20 feet away for 20 seconds.</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Notify me every</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={settings.eyeCareInterval}
                      onChange={(e) => updateInterval('eyeCareInterval', parseInt(e.target.value))}
                      className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-center text-white text-sm outline-none focus:border-emerald-500/50"
                      min="1"
                    />
                    <span className="text-gray-500">min</span>
                  </div>
                </div>
              </div>

              {/* Water Reminder */}
              <div className={`p-4 rounded-xl border transition-all ${settings.waterReminderEnabled ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets className={`w-4 h-4 ${settings.waterReminderEnabled ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className={`font-medium ${settings.waterReminderEnabled ? 'text-blue-100' : 'text-gray-400'}`}>Hydration</span>
                  </div>
                  <button 
                    onClick={() => toggleSetting('waterReminderEnabled')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.waterReminderEnabled ? 'bg-blue-500' : 'bg-neutral-700'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.waterReminderEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Notify me every</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={settings.waterInterval}
                      onChange={(e) => updateInterval('waterInterval', parseInt(e.target.value))}
                      className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-center text-white text-sm outline-none focus:border-blue-500/50"
                      min="1"
                    />
                    <span className="text-gray-500">min</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

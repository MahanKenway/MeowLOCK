import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, PictureInPicture2, Sparkles, Volume2, VolumeX, Flame, Wind, Coffee, Brain, Settings } from "lucide-react";
import { TimerMode, TimerSettings, WorkspaceProfile } from "../types";
import QuoteWidget from "./QuoteWidget";

interface MinimalModeOverlayProps {
  timeLeft: number;
  stopwatchTime: number;
  mode: TimerMode | "clock";
  isRunning: boolean;
  onToggleStartPause: () => void;
  onReset: () => void;
  onExit: () => void;
  onModeChange?: (mode: TimerMode | "clock") => void;
  clockFontClass?: string;
  clockSize?: number;
  clockColor?: string;
  onClockColorChange?: (color: string) => void;
  onClockSizeChange?: (size: number) => void;
  settings?: TimerSettings;
  onSettingsChange?: (settings: TimerSettings) => void;
  activeProfileName?: string;
  activeProfile?: WorkspaceProfile;
}

// Curated list of deep zen/mindfulness & study focus quotes
const DYNAMIC_FOCUS_QUOTES = {
  study: {
    morning: [
      { quote: "Focus on one thing at a time.", author: "Zen Wisdom" },
      { quote: "The secret of starting is beginning.", author: "Mark Twain" },
      { quote: "Learn today, lead tomorrow.", author: "Focus Wisdom" },
      { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
      { quote: "Today is a new opportunity to grow your mind and build your path.", author: "Daily Inspiration" },
      { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
      { quote: "Do not wait for inspiration. Go after it with a club.", author: "Jack London" },
      { quote: "Every morning brings a new choice to learn and improve.", author: "Study Guide" },
      { quote: "Wisdom begins with wonder and focused attention.", author: "Socrates" },
      { quote: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" }
    ],
    afternoon: [
      { quote: "Small persistent efforts create success.", author: "Robert Collier" },
      { quote: "Look away every 20 minutes to rest.", author: "Eye Health Tip" },
      { quote: "Every tiny step brings you closer.", author: "Daily Inspiration" },
      { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
      { quote: "Keep your eyes on the stars and your feet on the ground.", author: "Theodore Roosevelt" },
      { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
      { quote: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
      { quote: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
      { quote: "You do not have to see the whole staircase, just take the first step.", author: "Martin Luther King" }
    ],
    evening: [
      { quote: "It seems impossible until it is done.", author: "Nelson Mandela" },
      { quote: "Consistency is your greatest superpower.", author: "Study Guide" },
      { quote: "You are capable of immense growth.", author: "Belief" },
      { quote: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
      { quote: "Reviewing your day with clarity prepares your tomorrow for success.", author: "Wise Reflections" },
      { quote: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
      { quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
      { quote: "Do not let what you cannot do interfere with what you can do.", author: "John Wooden" },
      { quote: "A quiet review of today's progress builds lasting confidence.", author: "Learning Mentor" },
      { quote: "Celebrate the effort you put in today. Every bit of learning matters.", author: "Encouragement" }
    ],
    night: [
      { quote: "Quiet nights invite deep focus.", author: "Mindfulness Guide" },
      { quote: "Sleep is the best brain investment.", author: "Wellness Coach" },
      { quote: "Peaceful rest prepares the mind.", author: "Night Reflection" },
      { quote: "Your brain consolidates all your learning while you sleep.", author: "Neuroscience Fact" },
      { quote: "Rest when you are weary. Refresh and renew yourself.", author: "A.B. Alcott" },
      { quote: "The best preparation for tomorrow is doing your best tonight.", author: "H. Jackson Brown" },
      { quote: "Let your mind settle into the quiet of the evening.", author: "Peaceful Mind" },
      { quote: "There is a time for work, and there is a time for restful sleep.", author: "Balance Guide" },
      { quote: "Tomorrow is a fresh canvas. Sleep well to paint it beautifully.", author: "Optimism" },
      { quote: "A peaceful night sleep clears away all the mental clutter.", author: "Healthy Brain" }
    ]
  },
  tips: {
    morning: [
      { quote: "Tackle your hardest task first.", author: "Eat That Frog" },
      { quote: "Focus 25 minutes, then rest 5.", author: "Time Management" },
      { quote: "A clean desk brings clarity.", author: "Productivity Tip" },
      { quote: "Start by writing down your single most important goal for the day.", author: "Daily Habit" },
      { quote: "Minimize open browser tabs to stay on track.", author: "Digital Health" },
      { quote: "The first hour of your morning sets the tone for the entire day.", author: "Morning Guide" },
      { quote: "Keep water near your desk to stay fully hydrated.", author: "Health Tip" },
      { quote: "Prepare your workspace before you sit down to start.", author: "Workflow Tip" },
      { quote: "Block out social media during your deep focus blocks.", author: "Focus Rule" },
      { quote: "A simple checklist is your best ally against morning confusion.", author: "Organization" }
    ],
    afternoon: [
      { quote: "Mistakes are just lessons in disguise.", author: "Oscar Wilde" },
      { quote: "Sit straight and stretch your spine.", author: "Ergonomics Tip" },
      { quote: "Drink clean water to refresh.", author: "Health Tip" },
      { quote: "Take a deep breath and let go of mid-day tension.", author: "Mindfulness" },
      { quote: "A quick five-minute walk can completely reset your focus.", author: "Productivity Guide" },
      { quote: "Relax your eyes by looking at something far away.", author: "Eye Care" },
      { quote: "Stand up and stretch your arms and legs every hour.", author: "Ergonomics" },
      { quote: "Mid-day sluggishness is often solved by brief physical movement.", author: "Wellbeing" },
      { quote: "Reorganize your physical space if you feel mentally blocked.", author: "Clarity Guide" },
      { quote: "Stay calm. Take things one micro-step at a time.", author: "Anxiety Relief" }
    ],
    evening: [
      { quote: "Summarize today's wins in writing.", author: "Active Recall" },
      { quote: "Small progress is still progress.", author: "Mindset Tip" },
      { quote: "Write down tomorrow's top 3 tasks.", author: "Prep Tip" },
      { quote: "Spend five minutes filing away loose papers and notes.", author: "Workspace Cleanup" },
      { quote: "Review your completed tasks to feel a sense of accomplishment.", author: "Motivation" },
      { quote: "Transition out of work mode with a clear closing routine.", author: "Life Balance" },
      { quote: "Clear your screen of all workspace applications before you step away.", author: "Digital Boundaries" },
      { quote: "Reflect on one thing you did well today and write it down.", author: "Positive Mindset" },
      { quote: "Prepare a warm cup of herbal tea to invite deep relaxation.", author: "Unwind Routine" },
      { quote: "A tidy workspace at night guarantees a focused start tomorrow.", author: "Frictionless Morning" }
    ],
    night: [
      { quote: "Turn off screens before sleeping.", author: "Sleep Hygiene" },
      { quote: "Write lingering thoughts on paper.", author: "Brain Dump" },
      { quote: "Deep slow breathing calms the soul.", author: "Relaxation Tip" },
      { quote: "A dark, cool room is perfect for high-quality sleep.", author: "Restful Night" },
      { quote: "Avoid heavy reading or bright blue lights before bed.", author: "Sleep Health" },
      { quote: "Let go of today's concerns. They can be addressed tomorrow.", author: "Mental Release" },
      { quote: "A consistent sleep schedule is the foundation of high brain power.", author: "Cognitive Care" },
      { quote: "Quiet down your space to signal to your brain that it is time to sleep.", author: "Snooze Guide" },
      { quote: "Read a physical book to naturally tire your eyes.", author: "Off-screen Tip" },
      { quote: "Your sleep tonight is the fuel for your accomplishments tomorrow.", author: "Wellness Wisdom" }
    ]
  },
  relax: {
    morning: [
      { quote: "Smile, breathe, and go slowly.", author: "Thich Nhat Hanh" },
      { quote: "New day brings fresh strength.", author: "Eleanor Roosevelt" },
      { quote: "Start gently for a harmonious day.", author: "Daily Grace" },
      { quote: "Quiet minds find the beauty in simple beginnings.", author: "Zen Philosophy" },
      { quote: "Wake up with a peaceful determination to be kind to yourself.", author: "Self Love" },
      { quote: "There is no need to rush. The morning is generous.", author: "Calm Guidance" },
      { quote: "Inhale hope, exhale doubt and worry.", author: "Daily Affirmation" },
      { quote: "Appreciate the silent stillness of the early morning hours.", author: "Morning Peace" },
      { quote: "Start your day with a grateful heart and an open mind.", author: "Warm Thoughts" },
      { quote: "Every morning is a clean slate to write a peaceful story.", author: "Fresh Start" }
    ],
    afternoon: [
      { quote: "Unplug for a few minutes.", author: "Anne Lamott" },
      { quote: "Breathe deeply and let go.", author: "Zen Practice" },
      { quote: "Pause and listen to the ambient rain.", author: "Mindful Pause" },
      { quote: "Resting is not wasting time. It is recharging your soul.", author: "Balance Guide" },
      { quote: "In the middle of noise, find your inner pocket of silence.", author: "Inner Peace" },
      { quote: "Quiet your mind. Let your thoughts settle like dust in water.", author: "Zen Coach" },
      { quote: "Your worth is not defined by constant productivity.", author: "Gentle Reminder" },
      { quote: "Close your eyes for sixty seconds and focus purely on your breath.", author: "Quick Meditation" },
      { quote: "Take a break. The world will wait for you.", author: "Peaceful Reminder" },
      { quote: "A calm mind is a powerful creative engine.", author: "Clarity Wisdom" }
    ],
    evening: [
      { quote: "Relaxation is your natural state.", author: "Chinese Proverb" },
      { quote: "Quiet the mind, hear the soul.", author: "Ma Jaya" },
      { quote: "Unclench your jaw and rest.", author: "Evening Release" },
      { quote: "The day is behind you now. Soften your shoulders.", author: "Evening Release" },
      { quote: "Release the tension of today. You have done your best.", author: "Comfort" },
      { quote: "Let the quiet of the evening wash away all the noise.", author: "Serenity" },
      { quote: "Peace is a choice we make in the present moment.", author: "Peace Guide" },
      { quote: "Unwind your thoughts as you would unwind a tight thread.", author: "Mental Care" },
      { quote: "Enjoy the simple comfort of being still in your space.", author: "Cozy Living" },
      { quote: "Allow yourself to slow down. The rush is over.", author: "Gentle Pace" }
    ],
    night: [
      { quote: "Let your thoughts drift away.", author: "Mindful Sleep" },
      { quote: "Stars shine brightest in the dark.", author: "Night Sky" },
      { quote: "Tomorrow is a fresh page.", author: "Goodnight" },
      { quote: "Sleep in absolute peace. The night is safe and comforting.", author: "Restful Night" },
      { quote: "Embrace the soothing quiet of the night. Sleep deeply.", author: "Sweet Dreams" },
      { quote: "Your mind deserves a peaceful vacation. Let it sleep.", author: "Mental Health" },
      { quote: "In the depth of night, let all control fade into sweet rest.", author: "Surrender" },
      { quote: "Sleep with a light heart, knowing you did enough.", author: "Self Care" },
      { quote: "Wishing you a night of deep, undisturbed, healing rest.", author: "Wellbeing Coach" },
      { quote: "May your sleep be deep and your dreams be peaceful.", author: "Warm Wishes" }
    ]
  },
  general: {
    morning: [
      { quote: "Today is a beautiful fresh start.", author: "Ralph Emerson" },
      { quote: "Persistence conquers all things.", author: "Ben Franklin" },
      { quote: "A clean slate awaits you.", author: "Optimism" },
      { quote: "Approach today with curiosity and an open heart.", author: "Life Philosophy" },
      { quote: "Each day is a unique adventure. Live it fully.", author: "Daily Grace" },
      { quote: "Cultivate peace within yourself, and watch the day respond.", author: "Inner Peace" },
      { quote: "Small positive steps add up to remarkable achievements.", author: "Growth Guide" },
      { quote: "Start with an attitude of gratitude for simple things.", author: "Warm Heart" },
      { quote: "Your life is your story. Write a beautiful chapter today.", author: "Self Empowerment" },
      { quote: "Let your light shine brightly, one focused action at a time.", author: "Daily Spark" }
    ],
    afternoon: [
      { quote: "Keep your face to the sunshine.", author: "Walt Whitman" },
      { quote: "Stretch your body and mind now.", author: "Focus Coach" },
      { quote: "Focus is the art of saying no.", author: "Determination" },
      { quote: "No storm lasts forever. Stay patient and strong.", author: "Resilience" },
      { quote: "Remember that progress is a journey of small daily steps.", author: "Steady Mind" },
      { quote: "Trust your capabilities. You are stronger than you think.", author: "Confidence" },
      { quote: "Enjoy the process. The destination will take care of itself.", author: "Zen Journey" },
      { quote: "Stay in the present. It is the only place where life exists.", author: "Aesthetic Living" },
      { quote: "A peaceful heart can weather any busy afternoon.", author: "Calm Mind" },
      { quote: "Choose focus over busyness, and quality over quantity.", author: "Efficiency" }
    ],
    evening: [
      { quote: "Celebrate your tiny wins tonight.", author: "Growth Mindset" },
      { quote: "There is peace in doing your best.", author: "Self Care Guide" },
      { quote: "Look back on today with gratitude.", author: "Evening Peace" },
      { quote: "Let the day fade with the setting sun. Relax completely.", author: "Sunset Peace" },
      { quote: "Be gentle with your evaluation of today's progress.", author: "Kind Mind" },
      { quote: "You survived another day and learned valuable lessons.", author: "Strength" },
      { quote: "Slow down your actions, slow down your thoughts, and relax.", author: "Pace Change" },
      { quote: "Accept what was, let go of what is, and have hope for what will be.", author: "Acceptance" },
      { quote: "Spend your evening doing things that replenish your energy.", author: "Self Recharging" },
      { quote: "Resting this evening is the best preparation for a great tomorrow.", author: "Smart Strategy" }
    ],
    night: [
      { quote: "Let go of what you cannot control.", author: "Universe" },
      { quote: "Rest well for a beautiful tomorrow.", author: "New Day" },
      { quote: "Embrace the soothing silence.", author: "Deep Rest" },
      { quote: "The night is a silent companion. Let it bring you peace.", author: "Silent Night" },
      { quote: "Sleep with a peaceful conscience. You did your best today.", author: "Night Reflection" },
      { quote: "Surrender your thoughts to the comforting dark. Sleep well.", author: "Deep Snooze" },
      { quote: "Every night is an invitation to forget, forgive, and sleep.", author: "Forgiveness" },
      { quote: "Rest your mind. The answers will come when you sleep on them.", author: "Problem Solving" },
      { quote: "Close your eyes, breathe, and drift into peaceful dreams.", author: "Sweet Dreams" },
      { quote: "Sleep is the golden chain that ties health and focus together.", author: "Thomas Dekker" }
    ]
  }
};

export default function MinimalModeOverlay({
  timeLeft,
  stopwatchTime,
  mode,
  isRunning,
  onToggleStartPause,
  onReset,
  onExit,
  onModeChange,
  clockFontClass = "font-clock-outfit",
  clockSize = 120,
  clockColor = "white",
  onClockColorChange,
  onClockSizeChange,
  settings,
  onSettingsChange,
  activeProfileName = "General",
  activeProfile,
}: MinimalModeOverlayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [soundMuted, setSoundMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuotes, setShowQuotes] = useState<boolean>(() => {
    const saved = localStorage.getItem("zen_show_quotes");
    return saved !== "false";
  });
  const [showStatusLine, setShowStatusLine] = useState<boolean>(() => {
    const saved = localStorage.getItem("zen_show_status_line");
    return saved !== "false";
  });
  const [textSize, setTextSize] = useState<"sm" | "base" | "lg" | "xl" | "xxl">(() => {
    return (localStorage.getItem("zen_text_size") as any) || "base";
  });

  useEffect(() => {
    localStorage.setItem("zen_text_size", textSize);
    const sizeMap = {
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      xxl: "22px"
    };
    document.documentElement.style.fontSize = sizeMap[textSize];
  }, [textSize]);

  const handleToggleQuotes = () => {
    setShowQuotes(prev => {
      const next = !prev;
      localStorage.setItem("zen_show_quotes", next.toString());
      return next;
    });
  };

  const handleToggleStatusLine = () => {
    setShowStatusLine(prev => {
      const next = !prev;
      localStorage.setItem("zen_show_status_line", next.toString());
      return next;
    });
  };

  const getQuotesList = () => {
    const hours = currentTime.getHours();
    let timeOfDay = "night";
    if (hours >= 5 && hours < 12) timeOfDay = "morning";
    else if (hours >= 12 && hours < 17) timeOfDay = "afternoon";
    else if (hours >= 17 && hours < 21) timeOfDay = "evening";

    const m = (activeProfileName || "").toLowerCase();
    let category = "general";
    if (m.includes("study") || m.includes("read") || m.includes("learn")) {
      category = "study";
    } else if (m.includes("code") || m.includes("program") || m.includes("dev") || m.includes("tip")) {
      category = "tips";
    } else if (m.includes("relax") || m.includes("chill") || m.includes("rest") || m.includes("ambient")) {
      category = "relax";
    }

    return (DYNAMIC_FOCUS_QUOTES as any)[category][timeOfDay] || DYNAMIC_FOCUS_QUOTES.general.morning;
  };

  const quotesList = getQuotesList();
  const currentQuote = quotesList[quoteIdx % quotesList.length];

  // Rotation of quotes every 15 minutes
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setQuoteIdx((prev) => prev + 1);
    }, 900000);
    return () => clearInterval(quoteTimer);
  }, []);

  // Update clock time
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Soft breathing guide cycle: Inhale (4s) -> Hold (4s) -> Exhale (4s)
  useEffect(() => {
    let breathTimer: NodeJS.Timeout;
    const runBreathCycle = () => {
      setBreathPhase("inhale");
      breathTimer = setTimeout(() => {
        setBreathPhase("hold");
        breathTimer = setTimeout(() => {
          setBreathPhase("exhale");
          breathTimer = setTimeout(runBreathCycle, 4000);
        }, 4000);
      }, 4000);
    };

    runBreathCycle();
    return () => clearTimeout(breathTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCurrentTime = () => {
    let hrs = currentTime.getHours();
    const mins = currentTime.getMinutes().toString().padStart(2, "0");
    const secs = currentTime.getSeconds().toString().padStart(2, "0");
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;
    return `${hrs}:${mins}:${secs}`;
  };

  // Helper for sound volume toggle
  const toggleMuteAll = () => {
    setSoundMuted(!soundMuted);
    // Find all HTMLAudioElements or synth gain and silence them
    try {
      const activeEl = document.querySelectorAll("audio");
      activeEl.forEach((audio) => {
        audio.muted = !soundMuted;
      });
    } catch (e) {
      console.log("Could not mute audio tags", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between text-white overflow-hidden bg-black/90 select-none">
      
      {/* 1. Mindfulness Breathing Gradient Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep, slowly pulsating core of color */}
        <motion.div
          animate={{
            scale: breathPhase === "inhale" ? 1.25 : breathPhase === "hold" ? 1.3 : 1.0,
            opacity: breathPhase === "inhale" ? 0.35 : breathPhase === "hold" ? 0.45 : 0.2,
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-radial from-violet-600/30 via-indigo-900/10 to-transparent blur-[120px]"
        />
        <motion.div
          animate={{
            scale: breathPhase === "inhale" ? 1.15 : breathPhase === "hold" ? 1.2 : 0.95,
            opacity: breathPhase === "inhale" ? 0.2 : breathPhase === "hold" ? 0.3 : 0.15,
          }}
          transition={{ duration: 4, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-1/3 left-1/3 w-[450px] h-[450px] rounded-full bg-radial from-emerald-500/20 via-transparent to-transparent blur-[100px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* Top Header Controls: Mode Selector tabs */}
      <div className="w-full max-w-2xl px-6 pt-12 z-10 flex flex-col items-center gap-6">
        
        {/* Subtle breath guidance label */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={breathPhase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.6, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="font-sans text-[11px] font-semibold tracking-[0.35em] text-white/50 uppercase"
            >
              {isRunning 
                ? (breathPhase === "inhale" ? "Inhale..." : breathPhase === "hold" ? "Hold..." : "Exhale...")
                : "Mindfulness Workspace"
              }
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Elegant Glassy Tab Segmented Mode Controller */}
        <div className="p-1.5 bg-neutral-900/60 backdrop-blur-2xl border border-white/5 rounded-3xl flex items-center gap-1 shadow-2xl w-full max-w-2xl overflow-x-auto custom-scrollbar">
          {[
            { id: "clock", label: "Clock", icon: RotateCcw },
            { id: "pomodoro", label: "Focus", icon: Brain },
            { id: "shortBreak", label: "Short Break", icon: Coffee },
            { id: "longBreak", label: "Long Break", icon: Sparkles },
            { id: "stopwatch", label: "Stopwatch", icon: Play },
            { id: "countdown", label: "Countdown", icon: RotateCcw }
          ].map((item) => {
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModeChange && onModeChange(item.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-sans font-bold text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-violet-600/90 text-white shadow-lg shadow-violet-500/20"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Giant Visual Timer */}
      <div className="flex flex-col items-center justify-center z-10 select-none flex-1 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center"
          >
            {/* Soft, pulsating heart beat for timer */}
            <motion.span
              animate={isRunning ? {
                scale: [1, 1.015, 1],
              } : {}}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className={`${clockFontClass} font-semibold tracking-tighter tabular-nums drop-shadow-2xl text-center leading-none`}
              style={{ 
                fontSize: `${clockSize * 1.8}px`, 
                color: clockColor === "accent" ? "#7c3aed" : clockColor === "gray" ? "#9ca3af" : clockColor.startsWith("#") ? clockColor : "#ffffff" 
              }}
            >
              {mode === "clock"
                ? formatCurrentTime()
                : mode === "stopwatch"
                ? formatTime(stopwatchTime)
                : formatTime(timeLeft)}
            </motion.span>
            
            {/* Tiny Status indicator line */}
            {showStatusLine && (
              <span className="font-sans text-xs tracking-[0.4em] text-white/40 font-bold uppercase mt-2">
                {mode === "pomodoro" ? "Focusing Session" : mode === "shortBreak" ? "Short break time" : mode === "longBreak" ? "Long break time" : "Current Time"}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Zen Quote Display & Controls Footer */}
      <div className="w-full max-w-2xl px-6 pb-12 z-10 flex flex-col items-center gap-8">
        
        {/* Soft, glassy Zen Quote Panel */}
        {showQuotes && (
          activeProfile ? (
            <div className="w-full max-w-lg pointer-events-auto">
              <QuoteWidget activeProfile={activeProfile} />
            </div>
          ) : (
            <div className="h-20 flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.85, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-lg space-y-1"
                >
                  <p className="font-sans italic text-[14px] text-white/80 leading-relaxed">
                    "{currentQuote.quote}"
                  </p>
                  <span className="font-sans text-[10px] text-white/40 tracking-wider font-semibold uppercase">
                    — {currentQuote.author}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          )
        )}

        {/* Elegant control bar panel */}
        <div className="flex items-center justify-between bg-neutral-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl px-8 py-4 shadow-2xl w-full max-w-lg">
          
          {/* Left Controls: Sound / Mute */}
          <button
            onClick={toggleMuteAll}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              soundMuted
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                : "bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
            title={soundMuted ? "Unmute Environment" : "Mute Environment"}
          >
            {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Center Play/Pause button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleStartPause}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-sans font-extrabold text-sm transition-all cursor-pointer hover:scale-103 active:scale-97 shadow-xl ${
                isRunning
                  ? "bg-amber-500 text-neutral-950 shadow-amber-500/10 hover:bg-amber-600"
                  : "bg-white text-neutral-950 shadow-white/10 hover:bg-neutral-100"
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? "Pause" : "Start"}
            </button>

            <button
              onClick={onReset}
              className="p-3 bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 border rounded-2xl transition-all cursor-pointer ${
                showSettings
                  ? "bg-amber-500 text-neutral-950 border-amber-500 shadow-xl"
                  : "bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onExit}
              className="p-3 bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
              title="Exit Fullscreen"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Popover */}
      <AnimatePresence>
        {showSettings && settings && onSettingsChange && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-40 bg-neutral-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-6 z-50 w-full max-w-sm"
          >
            <h3 className="font-sans font-bold text-lg text-white">Timer Durations</h3>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <div className="flex justify-between text-xs text-white/70 mb-2 font-sans font-medium">
                  <span>Focus / Pomodoro</span>
                  <span className="text-amber-400 font-bold">{settings.pomodoro} min</span>
                </div>
                <input
                  type="range" min="1" max="120"
                  value={settings.pomodoro}
                  onChange={(e) => onSettingsChange({ ...settings, pomodoro: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-white/70 mb-2 font-sans font-medium">
                  <span>Short Break</span>
                  <span className="text-amber-400 font-bold">{settings.shortBreak} min</span>
                </div>
                <input
                  type="range" min="1" max="30"
                  value={settings.shortBreak}
                  onChange={(e) => onSettingsChange({ ...settings, shortBreak: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-white/70 mb-2 font-sans font-medium">
                  <span>Long Break</span>
                  <span className="text-amber-400 font-bold">{settings.longBreak} min</span>
                </div>
                <input
                  type="range" min="1" max="60"
                  value={settings.longBreak}
                  onChange={(e) => onSettingsChange({ ...settings, longBreak: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-white/70 mb-2 font-sans font-medium">
                  <span>Countdown</span>
                  <span className="text-amber-400 font-bold">{settings.countdown} min</span>
                </div>
                <input
                  type="range" min="1" max="60"
                  value={settings.countdown}
                  onChange={(e) => onSettingsChange({ ...settings, countdown: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="font-sans font-bold text-sm text-white mb-4">Clock Settings</h4>
                
                {onClockSizeChange && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-white/70 mb-2 font-sans font-medium">
                      <span>Clock Size</span>
                      <span className="text-amber-400 font-bold">{clockSize}px</span>
                    </div>
                    <input
                      type="range" min="60" max="240"
                      value={clockSize}
                      onChange={(e) => onClockSizeChange(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}

                {onClockColorChange && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-white/70 font-sans font-medium">Clock Color</span>
                    <input
                      type="color"
                      value={clockColor.startsWith("#") ? clockColor : "#ffffff"}
                      onChange={(e) => onClockColorChange(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-none outline-none appearance-none p-0"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 space-y-2.5">
                  <h4 className="font-sans font-bold text-xs text-amber-400 uppercase tracking-wider mb-2">Display Elements</h4>
                  
                  <button
                    onClick={handleToggleQuotes}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-sans font-bold transition-all border cursor-pointer ${
                      showQuotes
                        ? "bg-amber-500/20 border-amber-500/40 text-white shadow-lg shadow-amber-500/5"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>Zen Quotes</span>
                    <div className={`w-2 h-2 rounded-full transition-all ${showQuotes ? "bg-amber-500 scale-110" : "bg-gray-600"}`} />
                  </button>

                  <button
                    onClick={handleToggleStatusLine}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-sans font-bold transition-all border cursor-pointer ${
                      showStatusLine
                        ? "bg-amber-500/20 border-amber-500/40 text-white shadow-lg shadow-amber-500/5"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>Status Label</span>
                    <div className={`w-2 h-2 rounded-full transition-all ${showStatusLine ? "bg-amber-500 scale-110" : "bg-gray-600"}`} />
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  <h4 className="font-sans font-bold text-xs text-amber-400 uppercase tracking-wider mb-2">Text Size</h4>
                  <div className="grid grid-cols-5 gap-1">
                    {(["sm", "base", "lg", "xl", "xxl"] as const).map((size) => {
                      const labelMap = {
                        sm: "Small",
                        base: "Norm",
                        lg: "Large",
                        xl: "XL",
                        xxl: "Huge"
                      };
                      const isSelected = textSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => setTextSize(size)}
                          className={`py-1.5 rounded-lg text-[9px] font-sans font-bold text-center transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/5"
                              : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {labelMap[size]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-sans font-bold text-sm text-white/80 transition-colors"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

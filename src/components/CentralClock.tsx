import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

interface CentralClockProps {
  username: string;
  clockFontClass: string;
  showSeconds?: boolean;
  showGreeting?: boolean;
  showDate?: boolean;
  clockSize?: number;
  clockColor?: string;
  modeName?: string;
  isMobile?: boolean;
}

export default function CentralClock({
  username,
  clockFontClass,
  showSeconds = true,
  showGreeting = true,
  showDate = true,
  clockSize = 120,
  clockColor = "white",
  modeName = "General",
  isMobile = false,
}: CentralClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    const secondsStr = seconds < 10 ? "0" + seconds : seconds;
    return showSeconds 
      ? `${hours}:${minutesStr}:${secondsStr}` 
      : `${hours}:${minutesStr}`;
  };

  const getDynamicGreeting = (date: Date, name: string) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[date.getDay()];
    const nameStr = name || "User";

    if (hours >= 5 && hours < 12) {
      const morningGreetings = [
        `Good morning, ${nameStr}!`,
        `Rise & shine, ${nameStr}!`,
        `Happy ${day} morning!`
      ];
      return morningGreetings[minutes % morningGreetings.length];
    } else if (hours >= 12 && hours < 17) {
      const afternoonGreetings = [
        `Good afternoon, ${nameStr}!`,
        `Happy ${day} afternoon!`,
        `Stay focused, ${nameStr}!`
      ];
      return afternoonGreetings[minutes % afternoonGreetings.length];
    } else if (hours >= 17 && hours < 21) {
      const eveningGreetings = [
        `Good evening, ${nameStr}!`,
        `Time to relax, ${nameStr}!`,
        `Happy ${day} evening!`
      ];
      return eveningGreetings[minutes % eveningGreetings.length];
    } else {
      const nightGreetings = [
        `Good night, ${nameStr}!`,
        `Late night focus, ${nameStr}!`,
        `Sweet dreams, ${nameStr}!`
      ];
      return nightGreetings[minutes % nightGreetings.length];
    }
  };

  const getDayMessage = (date: Date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[date.getDay()];
    
    const hours = date.getHours();
    let timeOfDay = "night";
    if (hours >= 5 && hours < 12) timeOfDay = "morning";
    else if (hours >= 12 && hours < 17) timeOfDay = "afternoon";
    else if (hours >= 17 && hours < 21) timeOfDay = "evening";

    const m = (modeName || "").toLowerCase();
    let category = "general";
    if (m.includes("study") || m.includes("read") || m.includes("learn")) {
      category = "study";
    } else if (m.includes("code") || m.includes("program") || m.includes("dev") || m.includes("tip")) {
      category = "tips";
    } else if (m.includes("relax") || m.includes("chill") || m.includes("rest") || m.includes("ambient")) {
      category = "relax";
    }

    const messages = {
      study: {
        morning: [
          "Focus on one topic.",
          "Your brain is fresh now.",
          "Small steps lead to big wins.",
          "Clarity comes from action.",
          "Make a plan for today.",
          "Deep work starts with a single page.",
          "Feed your mind with knowledge.",
          "Take the first step.",
          "Progress is built daily.",
          "Challenge your mind.",
          "Stay curious and read.",
          "Learning is a journey."
        ],
        afternoon: [
          "Keep going, you are doing great.",
          "Review your progress.",
          "One task at a time.",
          "Stay hydrated and focused.",
          "Take a deep breath.",
          "Your effort is paying off.",
          "Maintain your posture.",
          "Keep distractions away.",
          "Consistency builds habits.",
          "Focus on understanding.",
          "Stay committed to your goal.",
          "Every page matters."
        ],
        evening: [
          "Summarize what you learned.",
          "Steady efforts bring results.",
          "Rest your eyes for a moment.",
          "Reflect on today's concepts.",
          "Knowledge compounds over time.",
          "Be proud of your focus.",
          "Celebrate your hard work.",
          "Consistency is the key.",
          "Keep a calm mind.",
          "Prepare for a restful break.",
          "Almost finished for today.",
          "Learning never truly stops."
        ],
        night: [
          "Sleep is essential for memory.",
          "Prepare your mind to rest.",
          "Quiet nights bring clarity.",
          "Review briefly, then sleep.",
          "Your future self will thank you.",
          "Rest well for tomorrow.",
          "Quiet focus is powerful.",
          "Wind down and relax.",
          "Dream big and learn deep.",
          "A quiet mind learns best.",
          "Great work tonight.",
          "Time to sleep soon."
        ]
      },
      tips: {
        morning: [
          "Start with your hardest task.",
          "Set three main goals today.",
          "Keep your desk clean.",
          "Turn off phone notifications.",
          "Take five-minute breaks.",
          "Plan your resting times.",
          "Clear your workspace first.",
          "Avoid multitasking.",
          "Use a simple checklist.",
          "Block out visual noise.",
          "Write down your intentions.",
          "Start with absolute clarity."
        ],
        afternoon: [
          "Stand up and stretch now.",
          "Take a brief screen break.",
          "Drink cold water to refresh.",
          "Relax your shoulders.",
          "Focus for twenty-five minutes.",
          "Blink often to rest your eyes.",
          "Step away from screens.",
          "Breathe deeply five times.",
          "Let your thoughts settle.",
          "Realign your focus now.",
          "Stretch your neck gently.",
          "Stay in the present moment."
        ],
        evening: [
          "Clean your desk for tomorrow.",
          "Note down what remains.",
          "Celebrate your small wins.",
          "Reflect on your efficiency.",
          "Prepare a friction-free start.",
          "Disconnect from work.",
          "Relax your mind and body.",
          "Spend five minutes in silence.",
          "Review your daily checklist.",
          "Let go of unfinished tasks.",
          "Focus on quality over speed.",
          "Give yourself some credit."
        ],
        night: [
          "Turn off all screens early.",
          "Plan tomorrow's top tasks.",
          "Relax with soft sounds.",
          "Read a physical book.",
          "Clear your mental load.",
          "Breathe slowly and deeply.",
          "Darken your room completely.",
          "Prepare for deep rest.",
          "Write down lingering ideas.",
          "Soft light helps wind down.",
          "Let your brain recharge.",
          "Sleep is your priority."
        ]
      },
      relax: {
        morning: [
          "Breathe in peace and calm.",
          "Start with absolute presence.",
          "Wake up at your own pace.",
          "Enjoy the morning quiet.",
          "No rush, just live now.",
          "Sip your morning drink slowly.",
          "Feel the gentle air.",
          "Welcome a brand new day.",
          "Start with a gentle smile.",
          "Be kind to yourself today.",
          "Appreciate the morning light.",
          "Live this moment fully."
        ],
        afternoon: [
          "Unplug for a few minutes.",
          "Inhale stillness, let go.",
          "Resting is highly productive.",
          "Listen to the ambient rain.",
          "Close your eyes and breathe.",
          "Appreciate your current path.",
          "Relax your facial muscles.",
          "Take a mindful walking break.",
          "Let go of any urgency.",
          "Be patient with yourself.",
          "Enjoy a cup of tea.",
          "Stillness is a strength."
        ],
        evening: [
          "Relax and release tension.",
          "Sip some tea and unwind.",
          "Loosen up, breathe slowly.",
          "Appreciate the calm evening.",
          "Let the day fade away.",
          "Enjoy a cozy quiet space.",
          "Soften your focus now.",
          "Let your thoughts slow down.",
          "Connect with the present.",
          "You have done enough today.",
          "Find peace in this evening.",
          "Rest your heart and mind."
        ],
        night: [
          "Sleep is the best meditation.",
          "Let your thoughts drift away.",
          "Wishing you restorative rest.",
          "Sleep in absolute peace.",
          "The world is quiet and safe.",
          "Embrace the deep darkness.",
          "Clear your heart of worries.",
          "Tonight is for letting go.",
          "Quiet mind, quiet room.",
          "Feel the gentle calm.",
          "Rest is a sacred gift.",
          "Peaceful dreams await you."
        ]
      },
      general: {
        morning: [
          "Every day is a fresh start.",
          "Set one key intention today.",
          "Make this beautiful day count.",
          "Today is a brand new page.",
          "Focus on what you can control.",
          "Approach today with gratitude.",
          "Stay open to new ideas.",
          "Cultivate a calm mindset.",
          "Small steps lead to growth.",
          "Believe in your capacity.",
          "Begin with a peaceful heart.",
          "Today brings endless potential."
        ],
        afternoon: [
          "Take a short mindful pause.",
          "Stay present in this moment.",
          "Appreciate your unique path.",
          "Keep moving forward steadily.",
          "Your efforts are meaningful.",
          "Trust your personal journey.",
          "Find balance in your work.",
          "Stay true to your values.",
          "Focus on progress, not perfection.",
          "Take life one step at a time.",
          "You are fully capable.",
          "Keep your focus sharp."
        ],
        evening: [
          "Sunsets are beautiful endings.",
          "Wind down and breathe slowly.",
          "Be proud of your effort.",
          "Reflect on today with peace.",
          "Let go of what did not happen.",
          "Enjoy the peaceful hours.",
          "Your dedication is admirable.",
          "Rest is a part of growth.",
          "Appreciate your small achievements.",
          "Relax into the quiet evening.",
          "Find peace in the transition.",
          "Tonight is yours to enjoy."
        ],
        night: [
          "Rest is essential preparation.",
          "Let your worries fade away.",
          "Sleep peacefully tonight.",
          "Tomorrow is a fresh start.",
          "Embrace the silent night.",
          "Release the day completely.",
          "Let your mind find peace.",
          "Recharge your inner strength.",
          "Sleep well and dream deep.",
          "Your efforts were enough.",
          "Trust the process of life.",
          "Goodnight and rest completely."
        ]
      }
    };

    const list = (messages as any)[category][timeOfDay] || messages.general.morning;
    // Rotate every 15 minutes instead of 6 seconds!
    const index = Math.floor(date.getTime() / 900000) % list.length;
    return list[index];
  };

  const textAndClockColor = clockColor === "accent" 
    ? "var(--accent)" 
    : clockColor === "gray" 
    ? "#9ca3af" 
    : clockColor.startsWith("#") 
    ? clockColor 
    : "#ffffff";

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center select-none pointer-events-auto cursor-move mt-10 retro-clock-container"
    >
        <div className="retro-clock-header hidden w-full bg-[#0000a8] text-white font-bold text-sm px-2 py-1 items-center justify-between">
          <span>Clock.exe</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-[#c0c0c0] border border-[#dfdfdf] border-b-[#808080] border-r-[#808080] shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#000]"></div>
            <div className="w-3 h-3 bg-[#c0c0c0] border border-[#dfdfdf] border-b-[#808080] border-r-[#808080] shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#000]"></div>
            <div className="w-3 h-3 bg-[#c0c0c0] border border-[#dfdfdf] border-b-[#808080] border-r-[#808080] shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#000] flex items-center justify-center text-[10px] text-black">x</div>
          </div>
        </div>
        <div className="retro-clock-content flex flex-col items-center justify-center p-8">
          {showGreeting && (
            <h2 className="font-sans font-bold text-2xl sm:text-[32px] text-white drop-shadow-md leading-tight retro-text mb-0" style={{ color: textAndClockColor }}>
              {getDynamicGreeting(time, username)}
            </h2>
          )}
          {showDate && (
            <h3 className="font-sans font-bold text-2xl sm:text-[32px] text-white drop-shadow-md mb-0.5 leading-tight retro-text" style={{ color: textAndClockColor }}>
              {getDayMessage(time)}
            </h3>
          )}
          <div
            className={`${clockFontClass} font-bold text-white tracking-tighter drop-shadow-2xl retro-clock-time`}
            style={{ 
              fontSize: isMobile ? `${Math.min(clockSize * 0.75, 78)}px` : `${clockSize * 1.8}px`, 
              lineHeight: "1",
              color: textAndClockColor
            }}
          >
            {formatTime(time)}
          </div>
        </div>
      </motion.div>
  );
}

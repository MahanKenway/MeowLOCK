import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getSystemTime, getLocalYYYYMMDD, getSessionLocalYYYYMMDD } from "../utils/time";
import {
  Sparkles,
  Heart,
  Moon,
  Volume2,
  VolumeX,
  X,
  Edit2,
  ChevronRight,
  TrendingUp,
  Award,
  CircleAlert,
  Cookie,
  Smile,
  ShieldCheck,
  RotateCcw
} from "lucide-react";

// Particle interfaces for canvas effects
interface PixelParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  type: "heart" | "dust" | "star" | "zzz" | "sparkle";
}

// Accessory/Hat types
interface Accessory {
  id: string;
  name: string;
  levelRequired: number;
  color: string;
  type: "wizard" | "crown" | "chef" | "sunglasses" | "ribbon" | "cowboy" | "none";
}

const ACCESSORIES: Accessory[] = [
  { id: "none", name: "Natural Cat", levelRequired: 1, color: "transparent", type: "none" },
  { id: "ribbon", name: "Cute Red Bow", levelRequired: 2, color: "#EF4444", type: "ribbon" },
  { id: "sunglasses", name: "Agent shades", levelRequired: 3, color: "#111827", type: "sunglasses" },
  { id: "chef", name: "Chef's Toque", levelRequired: 4, color: "#FFFFFF", type: "chef" },
  { id: "cowboy", name: "Cowboy Hat", levelRequired: 5, color: "#B45309", type: "cowboy" },
  { id: "wizard", name: "Wizard's Hat", levelRequired: 6, color: "#6D28D9", type: "wizard" },
  { id: "crown", name: "Imperial Crown", levelRequired: 7, color: "#FBBF24", type: "crown" }
];

export default function CatCompanion() {
  // Companion States saved to localStorage
  const [name, setName] = useState<string>(() => {
    const saved = localStorage.getItem("zen_cat_name");
    return saved && saved !== "Mochi" ? saved : "Zeytoon";
  });
  const [level, setLevel] = useState<number>(() => Number(localStorage.getItem("zen_cat_level")) || 1);
  const [xp, setXp] = useState<number>(() => Number(localStorage.getItem("zen_cat_xp")) || 0);
  const [hunger, setHunger] = useState<number>(() => {
    const saved = localStorage.getItem("zen_cat_hunger");
    return saved !== null ? Number(saved) : 100;
  });
  const [love, setLove] = useState<number>(() => {
    const saved = localStorage.getItem("zen_cat_love");
    return saved !== null ? Number(saved) : 100;
  });
  const [energy, setEnergy] = useState<number>(() => {
    const saved = localStorage.getItem("zen_cat_energy");
    return saved !== null ? Number(saved) : 100;
  });
  const [activeHat, setActiveHat] = useState<string>(() => localStorage.getItem("zen_cat_hat") || "none");
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem("zen_cat_muted");
    return saved !== null ? saved === "true" : true; // Default true (muted by default)
  });

  // UI / Interactive States
  const [isOpen, setIsOpen] = useState<boolean>(false); // Panel open
  const [isActive, setIsActive] = useState<boolean>(() => localStorage.getItem("zen_cat_companion_active") !== "false");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(name);
  const [animationState, setAnimationState] = useState<"idle" | "walk" | "sit" | "sleep" | "pet" | "eat" | "stretch" | "dance" | "wave" | "tilt">("idle");
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  
  // Custom speech bubble timing
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Position and Physics States
  const [catPos, setCatPos] = useState({ x: window.innerWidth - 180, y: window.innerHeight - 150 });
  const [targetX, setTargetX] = useState<number | null>(null);
  const [targetY, setTargetY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [facingLeft, setFacingLeft] = useState<boolean>(true);
  const [isFocusing, setIsFocusing] = useState<boolean>(false);
  const [laserActive, setLaserActive] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [ownerName, setOwnerName] = useState<string>(() => {
    return localStorage.getItem("focus_username") || "Mahan";
  });

  useEffect(() => {
    const syncUser = () => {
      const u = localStorage.getItem("focus_username") || "Mahan";
      setOwnerName(u);
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    const interval = setInterval(syncUser, 3000);
    return () => {
      window.removeEventListener("storage", syncUser);
      clearInterval(interval);
    };
  }, []);

  // Refs for animation loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const ticksRef = useRef<number>(0);
  const lastStateChangeRef = useRef<number>(Date.now());
  const particlesRef = useRef<PixelParticle[]>([]);
  const lastXpGainRef = useRef<number>(Date.now());
  const mousePosRef = useRef({ x: 0, y: 0 });
  const vxRef = useRef<number>(0); // Horizontal physical velocity for momentum drops
  const vyRef = useRef<number>(0); // Vertical physical velocity for gravity drops

  // Refs to avoid setInterval restart
  const catPosRef = useRef(catPos);
  const targetXRef = useRef(targetX);
  const targetYRef = useRef(targetY);
  const animationStateRef = useRef(animationState);
  const energyRef = useRef(energy);
  const nameRef = useRef(name);

  useEffect(() => {
    catPosRef.current = catPos;
  }, [catPos]);

  useEffect(() => {
    targetXRef.current = targetX;
  }, [targetX]);

  useEffect(() => {
    targetYRef.current = targetY;
  }, [targetY]);

  useEffect(() => {
    animationStateRef.current = animationState;
  }, [animationState]);

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  // Synthesize Meow Sound (completely offline, safe)
  const playChirpSound = (type: "meow" | "purr" | "levelUp" | "eat") => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "meow") {
        // High pitch cat meow chirp
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.12);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.25);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "purr") {
        // Low rhythmic purr rumble
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(45, ctx.currentTime);
        
        // Tremolo / LFO filter to make it purr
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 16; // 16Hz purr vibration
        lfoGain.gain.value = 15;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        lfo.start();
        osc.start();
        lfo.stop(ctx.currentTime + 0.8);
        osc.stop(ctx.currentTime + 0.8);
      } else if (type === "eat") {
        // Munching clicks
        for (let i = 0; i < 3; i++) {
          const delay = i * 0.15;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(250, ctx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + delay + 0.08);

          gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
          gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.08);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.08);
        }
      } else if (type === "levelUp") {
        // Magical upward arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const delay = idx * 0.08;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
          gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.25);
        });
      }

      // Safely auto-close AudioContext to free browser resources
      setTimeout(() => {
        try {
          ctx.close();
        } catch (err) {}
      }, 1000);
    } catch (e) {
      console.warn("Synth audio meow blocked by browser policy until interaction:", e);
    }
  };

  // Helper to trigger floating thoughts/bubble messages
  const showThought = (msg: string, duration = 3000) => {
    setSpeechBubble(msg);
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setSpeechBubble(null);
    }, duration);
  };

  // Advanced dynamic bio-rhythm and study behavioral thought generator
  const generateDynamicThought = () => {
    // 1. Check critical needs first
    if (hunger < 35) {
      const hungerThoughts = [
        `🐟 Zeytoon is so hungry, ${ownerName}! Can you get me some yummy fish? 😿`,
        `🐟 Meow... My tummy is rumbling, ${ownerName}! Could I have some fish, please?`,
        `🍪 Dear ${ownerName}, Zeytoon wants some cat food! My tummy is rumbling.`,
        `🐟 Zeytoon wants fish, ${ownerName}! My energy and fullness levels are dropping.`
      ];
      return hungerThoughts[Math.floor(Math.random() * hungerThoughts.length)];
    }
    if (energy < 35) {
      const energyThoughts = [
        `💤 I'm feeling so lazy and tired, ${ownerName}... time for a short cat nap? 😴`,
        `💤 Zeytoon is running low on battery, ${ownerName}! Time for a nap?`,
        `☕ Maybe it's time for a cup of coffee or green tea, ${ownerName}!`,
        `💤 *Yawns*... Let's take a short wellness break to recharge, ${ownerName}.`
      ];
      return energyThoughts[Math.floor(Math.random() * energyThoughts.length)];
    }
    if (love < 35) {
      const loveThoughts = [
        `💖 Zeytoon is feeling a bit lonely... ${ownerName}, can you pet me? 🐾`,
        `💖 I'm feeling a bit neglected, ${ownerName}! Pet me for a quick love boost!`,
        `🐾 Meow... Give Zeytoon a little hug or click to play, ${ownerName}!`,
        `💖 Oh yes! Pet me a bit, dear ${ownerName}, so I can purr with love for you!`
      ];
      return loveThoughts[Math.floor(Math.random() * loveThoughts.length)];
    }

    // 2. Time-of-day thoughts
    const hour = getSystemTime().getHours();
    if (hour >= 0 && hour < 5) {
      const nightThoughts = [
        `🌌 Still awake, ${ownerName}? Don't forget that good sleep does wonders for your brain! 🛌`,
        `🍵 Still studying, ${ownerName}? Here's a virtual cup of chamomile tea. Sleep soon!`,
        `🦉 We are night owl legends, ${ownerName}! But don't push your limits too hard.`,
        `✨ The stars are shining... Working in the silence of the night with ${ownerName} is sweet, but don't overdo it!`
      ];
      return nightThoughts[Math.floor(Math.random() * nightThoughts.length)];
    }
    if (hour >= 5 && hour < 11) {
      const morningThoughts = [
        `🌞 Good morning, champion ${ownerName}! The sun shines as bright and orange as Zeytoon's fur!`,
        `🌅 Good morning, champion ${ownerName}! Let's conquer our daily focus goal!`,
        `🍊 A perfect morning starts with a perfect focus, dear ${ownerName}. Get up and stretch your body!`,
        `🍵 Have you had your breakfast yet, ${ownerName}? Fuel your brain first!`
      ];
      return morningThoughts[Math.floor(Math.random() * morningThoughts.length)];
    }
    if (hour >= 11 && hour < 17) {
      const afternoonThoughts = [
        `💧 Don't forget to drink water, ${ownerName}! Staying hydrated boosts focus. 🥛`,
        `👀 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds, dear ${ownerName}, so your eyes don't get tired!`,
        `🧘‍♂️ Straighten your back, my friend ${ownerName}! Roll your shoulders and take a deep breath.`,
        `💤 Afternoon drowsiness? Let's do a breathing technique or walk around, ${ownerName}!`
      ];
      return afternoonThoughts[Math.floor(Math.random() * afternoonThoughts.length)];
    }
    if (hour >= 17 && hour < 24) {
      const eveningThoughts = [
        `🌅 Beautiful sunset, ${ownerName}... How is our progress? Your record today is amazing!`,
        `✨ Winding down, ${ownerName}? Celebrate the focus blocks you completed today!`,
        `🌟 You are wonderful, ${ownerName}! Zeytoon is so proud to have such a hardworking friend like you.`,
        `📖 Let's plan tomorrow's tasks before going to bed, dear ${ownerName}!`
      ];
      return eveningThoughts[Math.floor(Math.random() * eveningThoughts.length)];
    }

    // Default general thoughts
    const generalThoughts = [
      `🐾 Purr... You can absolutely complete your study goals, ${ownerName}! I believe in you!`,
      `🌸 You are studying so beautifully, ${ownerName}! Zeytoon is proud of you!`,
      `👀 Watching you study, ${ownerName}! You have such incredible focus!`,
      `✨ Zeytoon is always here to keep ${ownerName} motivated during study and work!`,
      `📖 Studying with ${ownerName} is Zeytoon's absolute favorite thing!`,
      `🐱 Orange cats are the most energetic co-workers in the world! Keep going strong, ${ownerName}!`
    ];
    return generalThoughts[Math.floor(Math.random() * generalThoughts.length)];
  };

  // Persist levels and stats
  useEffect(() => {
    localStorage.setItem("zen_cat_name", name);
    localStorage.setItem("zen_cat_level", String(level));
    localStorage.setItem("zen_cat_xp", String(xp));
    localStorage.setItem("zen_cat_hunger", String(hunger));
    localStorage.setItem("zen_cat_love", String(love));
    localStorage.setItem("zen_cat_energy", String(energy));
    localStorage.setItem("zen_cat_hat", activeHat);
    localStorage.setItem("zen_cat_muted", String(isMuted));
    localStorage.setItem("zen_cat_companion_active", String(isActive));
  }, [name, level, xp, hunger, love, energy, activeHat, isMuted, isActive]);

  // Helper to calculate current study streak from focus history
  const calculateCurrentStreak = () => {
    try {
      const saved = localStorage.getItem("focus_history");
      const sessions = saved ? JSON.parse(saved) : [];
      const completedSessions = sessions.filter(
        (s: any) => s.completed && s.mode !== "shortBreak" && s.mode !== "longBreak"
      );
      const uniqueDates: string[] = Array.from(
        new Set(completedSessions.map((s: any) => getSessionLocalYYYYMMDD(s.startTime)))
      ).sort() as string[];

      if (uniqueDates.length === 0) return 0;

      const todayStr = getLocalYYYYMMDD(getSystemTime());
      const yesterday = getSystemTime();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalYYYYMMDD(yesterday);

      const lastSessionDate = uniqueDates[uniqueDates.length - 1];
      if (lastSessionDate !== todayStr && lastSessionDate !== yesterdayStr) {
        return 0;
      }

      let streakCount = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const current = new Date(uniqueDates[i + 1] + "T00:00:00");
        const prev = new Date(uniqueDates[i] + "T00:00:00");
        const diffTime = Math.abs(current.getTime() - prev.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          streakCount++;
        } else if (diffDays > 1) {
          break;
        }
      }
      return streakCount;
    } catch (e) {
      return 0;
    }
  };

  // Helper to calculate total focus minutes completed today
  const getTodayFocusMinutes = () => {
    try {
      const saved = localStorage.getItem("focus_history");
      const sessions = saved ? JSON.parse(saved) : [];
      const todayStr = getLocalYYYYMMDD(getSystemTime());
      const completedSessions = sessions.filter(
        (s: any) => s.completed && s.mode !== "shortBreak" && s.mode !== "longBreak"
      );
      const todaySessions = completedSessions.filter(
        (s: any) => getSessionLocalYYYYMMDD(s.startTime) === todayStr
      );
      return todaySessions.reduce((acc: number, s: any) => acc + Math.round(s.duration / 60), 0);
    } catch (e) {
      return 0;
    }
  };

  // Synchronize Zeytoon's Level and XP directly with Streak and Daily Focus Goal Progress
  useEffect(() => {
    const syncWithStreakAndFocus = () => {
      const streak = calculateCurrentStreak();
      const nextLevel = Math.max(1, streak);
      
      const todayMinutes = getTodayFocusMinutes();
      
      setLevel(nextLevel);
      setXp(todayMinutes);
      
      localStorage.setItem("zen_cat_level", String(nextLevel));
      localStorage.setItem("zen_cat_xp", String(todayMinutes));
    };

    // Initial sync
    syncWithStreakAndFocus();

    // Check periodically every 2.5 seconds to instantly reflect completion of sessions
    const intervalId = setInterval(syncWithStreakAndFocus, 2500);

    // Also register on custom events
    window.addEventListener("zen-timer-state", syncWithStreakAndFocus);
    window.addEventListener("focus-history-updated", syncWithStreakAndFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("zen-timer-state", syncWithStreakAndFocus);
      window.removeEventListener("focus-history-updated", syncWithStreakAndFocus);
    };
  }, []);

  // Pomodoro Focus Timer Event Integration & External Toggle Sync
  useEffect(() => {
    const handleTimerState = (e: any) => {
      const { isRunning, mode } = e.detail;
      setIsFocusing(isRunning && mode === "pomodoro");
    };

    const handleActiveToggle = (e: any) => {
      setIsActive(e.detail.active);
    };

    window.addEventListener("zen-timer-state", handleTimerState);
    window.addEventListener("cat-active-toggle", handleActiveToggle);
    return () => {
      window.removeEventListener("zen-timer-state", handleTimerState);
      window.removeEventListener("cat-active-toggle", handleActiveToggle);
    };
  }, []);

  // Keep cat inside screen boundaries on window resize or initial render
  useEffect(() => {
    const clampPos = () => {
      setCatPos((pos) => {
        const maxX = Math.max(50, window.innerWidth - 180);
        const maxY = Math.max(50, window.innerHeight - 150);
        const x = Math.max(20, Math.min(maxX, pos.x));
        const y = Math.max(20, Math.min(maxY, pos.y));
        return { x, y };
      });
    };
    clampPos();
    window.addEventListener("resize", clampPos);
    return () => window.removeEventListener("resize", clampPos);
  }, [isActive]);

  // Sync Focus State to Cat Behavior
  useEffect(() => {
    if (!isActive) return;
    if (isFocusing) {
      setAnimationState("sit");
      showThought("😸 Focus Mode on! Shhh...");
      // Walk over to sit close to left side or right side depending on current timer layout
      setCatPos({ x: window.innerWidth - 300, y: window.innerHeight - 150 });
    } else {
      setAnimationState("idle");
      showThought("✨ Session Complete! Hurrah!");
      playChirpSound("levelUp");
      gainXp(12);
    }
  }, [isFocusing]);

  // Handle periodic needs depletion & random behaviors
  useEffect(() => {
    if (!isActive) return;

    const needsInterval = setInterval(() => {
      setHunger((h) => Math.max(0, h - 1));
      setEnergy((e) => Math.max(0, e - 1));
      setLove((l) => Math.max(0, l - 1));
    }, 12000); // deprives slowly

    const behaviorInterval = setInterval(() => {
      if (isDragging || isFocusing) return;

      const rand = Math.random();
      const currentAnimState = animationStateRef.current;
      const currentEnergy = energyRef.current;

      // Only trigger random behavior if not busy eating or deep sleeping
      if (currentAnimState !== "sleep" && currentAnimState !== "eat") {
        // High frequency walking! (40% chance of walking every 6 seconds to feel highly alive)
        if (rand < 0.40) {
          // Choose new walking target spanning the entire window width and height safely
          const safetyMarginX = 180;
          const safetyMarginY = 150;
          const maxTargetX = Math.max(100, window.innerWidth - safetyMarginX);
          const maxTargetY = Math.max(100, window.innerHeight - safetyMarginY);
          const newTargetX = Math.floor(20 + Math.random() * (maxTargetX - 20));
          const newTargetY = Math.floor(20 + Math.random() * (maxTargetY - 20));
          setTargetX(newTargetX);
          setTargetY(newTargetY);
          setAnimationState("walk");
          
          if (Math.random() < 0.40) {
            const walkThoughts = [
              `🐾 Let's take a little stroll around your workspace, ${ownerName}! 🚶‍♂️`,
              `✨ Zeytoon is patrolling your screen, ${ownerName}!`,
              `🐾 Just walking around to stretch my paws, you should also stand up and move, ${ownerName}!`,
              `🍊 What a lovely workspace you have! I'm just wandering from side to side.`
            ];
            showThought(walkThoughts[Math.floor(Math.random() * walkThoughts.length)]);
          }
        } else if (rand < 0.55) {
          // Curl up and sit / purr
          setAnimationState("sit");
          if (Math.random() < 0.50) {
            const thought = generateDynamicThought();
            showThought(thought);
            playChirpSound("purr");
          }
        } else if (rand < 0.65 && currentEnergy < 55) {
          // Nap if tired
          setAnimationState("sleep");
          showThought(`💤 Zeytoon is tired... I'll take a quick cat nap, dear ${ownerName}! 😴`);
        } else if (rand < 0.75) {
          // Cute wave paw
          setAnimationState("wave");
          showThought(`👋 How are you, champion ${ownerName}? Great job today, my friend! 😻`);
          playChirpSound("meow");
          setTimeout(() => setAnimationState("idle"), 2500);
        } else if (rand < 0.85) {
          // Cute head tilt
          setAnimationState("tilt");
          showThought(`🧐 What are you working on, ${ownerName}? Your project is going great!`);
          setTimeout(() => setAnimationState("idle"), 2000);
        } else if (rand < 0.95) {
          // Stretch paws
          setAnimationState("stretch");
          showThought(`🧘‍♂️ Mmm... what a satisfying stretch! Straighten your back too, ${ownerName}.`);
          setTimeout(() => setAnimationState("idle"), 3000);
        }
      }
    }, 45000); // 45 seconds cycle keeps Zeytoon active without being annoying

    // Initial warm greeting meow
    setTimeout(() => {
      showThought(`🐾 Mya! I'm ${nameRef.current}! Let's focus together!`);
      playChirpSound("meow");
    }, 1200);

    return () => {
      clearInterval(needsInterval);
      clearInterval(behaviorInterval);
    };
  }, [isActive, isDragging, isFocusing]);

  // Track Mouse movement relative to the cat for eyes to look at & Laser Chase logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      if (laserActive) {
        setLaserPos({ x: e.clientX, y: e.clientY });
        setTargetX(e.clientX - 64);
        setTargetY(e.clientY - 64);
        if (animationStateRef.current !== "walk") {
          setAnimationState("walk");
        }

        // Pounce check: if cat's center is close to the laser dot
        const catCenterX = catPosRef.current.x + 64;
        const catCenterY = catPosRef.current.y + 64;
        const dx = e.clientX - catCenterX;
        const dy = e.clientY - catCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 32) {
          // Got it!
          setLaserActive(false);
          setTargetX(null);
          setAnimationState("pet"); // Happy bounce!
          playChirpSound("meow");
          gainXp(30);
          setLove((l) => Math.min(100, l + 15));
          showThought("🔴 گرفتمش! گرفتمش! بالاخره لیزر رو شکار کردم! 😻");

          // Spawn star/sparkle particles
          for (let i = 0; i < 12; i++) {
            spawnParticle(16, 16, "sparkle");
          }
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [laserActive]);

  // Gain XP Function
  const gainXp = (amount: number) => {
    const now = Date.now();
    // Throttle XP gain slightly to prevent clicking spam cheat
    if (now - lastXpGainRef.current < 200) return;
    lastXpGainRef.current = now;

    setXp((prevXp) => {
      const nextXp = prevXp + amount;
      const xpNeeded = level * 100;
      if (nextXp >= xpNeeded) {
        // Level UP!
        setLevel((l) => {
          const nextL = l + 1;
          showThought(`🎉 LEVEL UP! Level ${nextL}!`);
          playChirpSound("levelUp");
          // Add massive sparkle particles
          for (let i = 0; i < 20; i++) {
            spawnParticle(16, 16, "sparkle");
          }
          return nextL;
        });
        return nextXp - xpNeeded;
      }
      return nextXp;
    });
  };

  // Particle Spawning Helper
  const spawnParticle = (cx: number, cy: number, type: "heart" | "dust" | "star" | "zzz" | "sparkle") => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5;
    
    let color = "#FDA4AF";
    if (type === "dust") color = "rgba(255, 255, 255, 0.2)";
    else if (type === "star" || type === "sparkle") color = "#FBBF24";
    else if (type === "zzz") color = "#3B82F6";

    const newP: PixelParticle = {
      id: Math.random(),
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: type === "zzz" ? -0.4 - Math.random() * 0.4 : Math.sin(angle) * speed - 0.5,
      life: 0,
      maxLife: type === "zzz" ? 80 : 35 + Math.floor(Math.random() * 20),
      color,
      type
    };

    particlesRef.current.push(newP);
  };

  // Movement and Gravity Physics loop
  useEffect(() => {
    if (!isActive) return;

    let lastTime = Date.now();
    const updatePhysics = () => {
      const now = Date.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000); // Clamp dt to prevent massive jumps on tab reactivations
      lastTime = now;

      if (isDragging) {
        vxRef.current = 0;
        vyRef.current = 0;
        return;
      }

      const currentTargetX = targetXRef.current;
      const currentAnimState = animationStateRef.current;
      const currentPos = catPosRef.current;

      let nextX = currentPos.x;
      let nextY = currentPos.y;

      const maxX = Math.max(50, window.innerWidth - 180);
      const maxY = Math.max(50, window.innerHeight - 150);

      // 1. Momentum & sliding deceleration after a throw
      if (Math.abs(vxRef.current) > 10 || Math.abs(vyRef.current) > 10) {
        nextX += vxRef.current * dt;
        nextY += vyRef.current * dt;

        // Apply friction decay
        vxRef.current *= Math.exp(-4 * dt);
        vyRef.current *= Math.exp(-4 * dt);

        // Bouncing logic on screen edges
        if (nextX <= 20) {
          nextX = 20;
          vxRef.current = -vxRef.current * 0.4;
        } else if (nextX >= maxX) {
          nextX = maxX;
          vxRef.current = -vxRef.current * 0.4;
        }

        if (nextY <= 20) {
          nextY = 20;
          vyRef.current = -vyRef.current * 0.4;
        } else if (nextY >= maxY) {
          nextY = maxY;
          vyRef.current = -vyRef.current * 0.4;
        }

        // Tilt slightly while sliding fast
        if ((Math.abs(vxRef.current) > 100 || Math.abs(vyRef.current) > 100) && animationStateRef.current !== "tilt" && animationStateRef.current !== "pet" && animationStateRef.current !== "sleep") {
          setAnimationState("tilt");
        }

        // Stop completely
        if (Math.abs(vxRef.current) <= 10 && Math.abs(vyRef.current) <= 10) {
          vxRef.current = 0;
          vyRef.current = 0;
          setAnimationState("idle");
          for (let i = 0; i < 8; i++) {
            spawnParticle(64, 110, "dust");
          }
        }
      }

      // 2. Walking/Chasing Target
      if (currentTargetX !== null && currentAnimState === "walk") {
        const currentTargetY = targetYRef.current !== null ? targetYRef.current : currentPos.y;
        const dx = currentTargetX - currentPos.x;
        const dy = currentTargetY - currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = laserActive ? 180 : 55; // Much faster when chasing a laser pointer!

        if (dist < 4) {
          nextX = currentTargetX;
          nextY = currentTargetY;
          setTargetX(null);
          setTargetY(null);
          setAnimationState("idle");
        } else {
          setFacingLeft(dx < 0);
          nextX = currentPos.x + (dx / dist) * speed * dt;
          nextY = currentPos.y + (dy / dist) * speed * dt;

          // Spawn walking dust occasionally
          if (ticksRef.current % 12 === 0) {
            spawnParticle(64, 110, "dust");
          }
        }
      }

      // Safe bounds clamping
      nextX = Math.max(20, Math.min(maxX, nextX));
      nextY = Math.max(20, Math.min(maxY, nextY));

      // Update state if anything changed
      if (nextX !== currentPos.x || nextY !== currentPos.y) {
        setCatPos({ x: nextX, y: nextY });
      }
    };

    const interval = setInterval(updatePhysics, 25);
    return () => clearInterval(interval);
  }, [isActive, isDragging, laserActive]);

  // Main Canvas Render Loop (60 FPS Procedural Pixel Art Drawing)
  useEffect(() => {
    if (!isActive) return;

    const drawFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ticksRef.current++;
      const ticks = ticksRef.current;

      // Reset & set crisp scaling
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      // Base Configs
      const P = 4; // Pixel Size multiplier (each retro pixel is 4x4 canvas pixels)
      const centerX = 16;
      const centerY = 16;

      // Palette
      const OUTLINE = "rgba(22, 11, 5, 0.95)";
      const BASE_ORANGE = "#F59E0B";      // Beautiful orange tabby
      const ORANGE_SHADOW = "#D97706";    // Tabby stripes/shading
      const CREAM = "#FFFEE5";            // Belly, cheeks
      const PINK = "#FEA3B4";             // Inner ears, nose, blush
      const EYE_COLOR = "#221105";

      // Animation parameters (Procedural Squash & Stretch!)
      let breathY = 0;
      let tailWag = 0;
      let eyeClosed = false;
      let walkBob = 0;
      let headY = 0;
      let bodyH = 0;
      let earTwitch = false;
      let stretchX = 0;
      let stretchY = 0;
      let tiltAngle = 0;

      // Blinking cycle: Blink for 5 ticks every 150 ticks
      if (ticks % 150 < 6) {
        eyeClosed = true;
      }

      // Compute values based on state
      if (animationState === "idle") {
        // Slow peaceful breathing
        breathY = Math.sin(ticks * 0.08) * 0.45;
        tailWag = Math.sin(ticks * 0.04) * 2;
      } else if (animationState === "walk") {
        // Quick bobbing cycle
        walkBob = Math.sin(ticks * 0.25) * 0.8;
        tailWag = Math.sin(ticks * 0.25) * 3;
        // Bob head out of sync
        headY = Math.cos(ticks * 0.25) * 0.5;
      } else if (animationState === "sit") {
        // Calm tight breathing, tail curls around body
        breathY = Math.sin(ticks * 0.05) * 0.25;
        tailWag = Math.sin(ticks * 0.02) * 0.8;
        bodyH = -1; // sit lower
      } else if (animationState === "sleep") {
        // Deep slow sleep respiration
        breathY = Math.sin(ticks * 0.035) * 0.35;
        tailWag = 0;
        eyeClosed = true;
        bodyH = -2; // flat snugly shape
        if (ticks % 65 === 0) {
          spawnParticle(facingLeft ? 50 : 78, 48, "zzz");
        }
      } else if (animationState === "pet") {
        // Happy bounce, purring particles
        breathY = Math.abs(Math.sin(ticks * 0.15)) * -1.8;
        tailWag = Math.sin(ticks * 0.2) * 5;
        eyeClosed = true;
        if (ticks % 10 === 0) {
          spawnParticle(40 + Math.random() * 48, 40 + Math.random() * 40, "heart");
        }
      } else if (animationState === "eat") {
        // Lean head down to chew
        headY = Math.max(0, Math.sin(ticks * 0.12) * 2);
        tailWag = Math.sin(ticks * 0.06) * 1.5;
        if (ticks % 20 === 0) {
          spawnParticle(facingLeft ? 38 : 90, 100, "dust");
        }
      } else if (animationState === "stretch") {
        // Arch posture
        stretchY = -Math.abs(Math.sin(ticks * 0.05)) * 1.5;
        stretchX = Math.cos(ticks * 0.05) * 1;
        tailWag = Math.sin(ticks * 0.1) * 2;
      } else if (animationState === "dance") {
        // Rapid rhythm bounce
        breathY = Math.abs(Math.sin(ticks * 0.18)) * -2.5;
        tailWag = Math.cos(ticks * 0.22) * 4;
        tiltAngle = Math.sin(ticks * 0.15) * 0.1;
        if (ticks % 15 === 0) {
          spawnParticle(40 + Math.random() * 48, 40 + Math.random() * 48, "star");
        }
      } else if (animationState === "wave") {
        // Raising front paw to greet
        breathY = Math.sin(ticks * 0.06) * 0.3;
        tailWag = Math.sin(ticks * 0.05) * 2.5;
      } else if (animationState === "tilt") {
        tiltAngle = 0.15;
        breathY = Math.sin(ticks * 0.08) * 0.3;
        tailWag = Math.sin(ticks * 0.04) * 1.5;
      }

      // Draw helper function
      const drawPixel = (px: number, py: number, color: string) => {
        // Support flipping facing left/right
        let finalX = px;
        if (facingLeft) {
          finalX = 31 - px;
        }
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(finalX * P), Math.floor(py * P), P, P);
      };

      // Draw horizontal line helper
      const drawHLine = (x1: number, x2: number, y: number, color: string) => {
        for (let x = x1; x <= x2; x++) drawPixel(x, y, color);
      };

      // Draw rect helper
      const drawRect = (x: number, y: number, w: number, h: number, color: string) => {
        for (let i = 0; i < w; i++) {
          for (let j = 0; j < h; j++) {
            drawPixel(x + i, y + j, color);
          }
        }
      };

      // Draw Soft Drop shadow under the cat
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.beginPath();
      ctx.ellipse(64, 112, 34, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw a tiny food bowl if eating!
      if (animationState === "eat") {
        const bowlX = 6;
        const bowlY = 25;
        // Bowl body
        drawRect(bowlX + 1, bowlY + 2, 6, 2, "#9CA3AF"); // dark metal bowl
        drawRect(bowlX + 2, bowlY + 3, 4, 1, "#4B5563");
        // Fish/Milk fill
        drawHLine(bowlX + 2, bowlX + 5, bowlY + 1, "#FFF7ED"); // milk
        drawPixel(bowlX + 3, bowlY + 1, "#3B82F6"); // blue fish eye
      }

      // Draw Tail
      const tailX = 8;
      const tailBaseY = 21 + Math.round(walkBob) + Math.round(bodyH);
      const wagOffset = Math.round(tailWag);

      // Tail base (black outline)
      drawRect(tailX - 2, tailBaseY - 1, 3, 4, OUTLINE);
      // Tail curves up and wags
      drawRect(tailX - 4 + Math.round(wagOffset * 0.3), tailBaseY - 3, 3, 3, OUTLINE);
      drawRect(tailX - 5 + Math.round(wagOffset * 0.6), tailBaseY - 6, 3, 4, OUTLINE);
      drawRect(tailX - 4 + wagOffset, tailBaseY - 9, 3, 4, OUTLINE);
      drawRect(tailX - 2 + wagOffset, tailBaseY - 10, 3, 2, OUTLINE);

      // Tail fill
      drawRect(tailX - 1, tailBaseY, 2, 2, ORANGE_SHADOW);
      drawRect(tailX - 3 + Math.round(wagOffset * 0.3), tailBaseY - 2, 2, 2, BASE_ORANGE);
      drawRect(tailX - 4 + Math.round(wagOffset * 0.6), tailBaseY - 5, 2, 3, BASE_ORANGE);
      drawRect(tailX - 3 + wagOffset, tailBaseY - 8, 2, 3, CREAM); // Cream tail tip!
      drawRect(tailX - 1 + wagOffset, tailBaseY - 9, 1, 1, CREAM);

      // Compute dynamic body bottom positions early for accurate legs attachment
      const bodyY = 16 + Math.round(walkBob) + Math.round(bodyH);
      const bH = 10 + Math.round(breathY);

      // Draw Legs
      const legY = 25;
      const stepOffset = ticks % 16 < 8 ? 1 : 0;

      if (animationState === "sleep") {
        // Tuck legs fully in sleeping position without any gaps
        drawHLine(10, 21, bodyY + bH + 1, OUTLINE);
        drawHLine(11, 20, bodyY + bH, ORANGE_SHADOW);
      } else if (animationState === "sit") {
        // Sitting legs flat and connected
        drawHLine(11, 21, bodyY + bH + 1, OUTLINE);
        drawHLine(12, 14, bodyY + bH, CREAM);
        drawHLine(17, 20, bodyY + bH, BASE_ORANGE);
      } else if (animationState === "walk") {
        // High-fidelity smooth dynamic leg swing!
        // We use a continuous sine wave based on ticks to make the legs swing forward/backward and bend up/down
        const swing = Math.sin(ticks * 0.45);
        const swingAbs = Math.abs(swing);
        
        // Leg 1 (Front Left) - Cream
        const leg1X = 12 + Math.round(swing * 2);
        const leg1Y = legY - (swing > 0 ? Math.round(swingAbs * 1.5) : 0);
        drawRect(leg1X, leg1Y, 2, 3, OUTLINE);
        drawRect(leg1X, leg1Y, 1, 2, CREAM);
        
        // Leg 2 (Front Right) - Orange Shadow
        const leg2X = 15 - Math.round(swing * 2);
        const leg2Y = legY - (swing < 0 ? Math.round(swingAbs * 1.5) : 0);
        drawRect(leg2X, leg2Y, 2, 3, OUTLINE);
        drawRect(leg2X, leg2Y, 1, 2, ORANGE_SHADOW);
        
        // Leg 3 (Back Left) - Base Orange
        const leg3X = 18 - Math.round(swing * 1.8);
        const leg3Y = legY - (swing < 0 ? Math.round(swingAbs * 1.5) : 0);
        drawRect(leg3X, leg3Y, 2, 3, OUTLINE);
        drawRect(leg3X, leg3Y, 1, 2, BASE_ORANGE);
        
        // Leg 4 (Back Right) - Orange Shadow
        const leg4X = 21 + Math.round(swing * 1.8);
        const leg4Y = legY - (swing > 0 ? Math.round(swingAbs * 1.5) : 0);
        drawRect(leg4X, leg4Y, 2, 3, OUTLINE);
        drawRect(leg4X, leg4Y, 1, 2, ORANGE_SHADOW);
      } else if (animationState === "wave" && ticks % 12 < 6) {
        // Wave paw! Lifts front left paw
        drawRect(12, legY - 3, 3, 3, OUTLINE);
        drawRect(13, legY - 3, 2, 2, PINK); // wave pink pads
        
        // Other normal legs down
        drawRect(16, legY, 2, 3, OUTLINE);
        drawRect(16, legY, 1, 2, BASE_ORANGE);
        drawRect(20, legY, 2, 3, OUTLINE);
        drawRect(20, legY, 1, 2, ORANGE_SHADOW);
      } else {
        // Default Idle standing legs
        drawRect(11, legY, 2, 3, OUTLINE);
        drawRect(11, legY, 1, 2, CREAM);

        drawRect(14, legY, 2, 3, OUTLINE);
        drawRect(14, legY, 1, 2, ORANGE_SHADOW);

        drawRect(18, legY, 2, 3, OUTLINE);
        drawRect(18, legY, 1, 2, BASE_ORANGE);

        drawRect(21, legY, 2, 3, OUTLINE);
        drawRect(21, legY, 1, 2, ORANGE_SHADOW);
      }

      // Draw Body
      // Body Outline
      drawRect(9, bodyY, 14, bH, OUTLINE);
      // Body Orange base
      drawRect(10, bodyY + 1, 12, bH - 2, BASE_ORANGE);
      
      // Cream belly patch (beautiful rounded center patch)
      drawRect(12, bodyY + 3, 6, bH - 4, CREAM);
      drawRect(13, bodyY + 2, 4, 1, CREAM);
      drawRect(14, bodyY + bH - 1, 2, 1, CREAM);

      // Cute Tabby Stripes on the back
      drawHLine(18, 21, bodyY + 3, ORANGE_SHADOW);
      drawHLine(19, 21, bodyY + 5, ORANGE_SHADOW);
      drawHLine(18, 21, bodyY + 7, ORANGE_SHADOW);

      // Draw Head (with dynamic tilt rotation if applicable)
      const headX = 11 + Math.round(stretchX);
      const headBaseY = 8 + Math.round(walkBob) + Math.round(headY) + Math.round(bodyH);
      const hH = 10;

      // Outer ears outline
      drawRect(headX + 1, headBaseY - 3, 3, 4, OUTLINE); // Left ear outline
      drawRect(headX + 8, headBaseY - 3, 3, 4, OUTLINE); // Right ear outline
      
      // Ear orange fill
      drawRect(headX + 2, headBaseY - 2, 1, 3, BASE_ORANGE);
      drawRect(headX + 9, headBaseY - 2, 1, 3, BASE_ORANGE);

      // Inner ears pink
      drawRect(headX + 2, headBaseY - 2, 1, 2, PINK);
      drawRect(headX + 9, headBaseY - 2, 1, 2, PINK);

      // Head Outline block
      drawRect(headX, headBaseY, 12, hH, OUTLINE);
      // Head base color
      drawRect(headX + 1, headBaseY + 1, 10, hH - 2, BASE_ORANGE);
      
      // Cream cheeks/muzzle
      drawRect(headX + 1, headBaseY + 6, 3, hH - 7, CREAM);
      drawRect(headX + 8, headBaseY + 6, 3, hH - 7, CREAM);
      drawRect(headX + 4, headBaseY + 7, 4, 2, CREAM);

      // Forehead Stripes
      drawHLine(headX + 5, headX + 6, headBaseY + 1, ORANGE_SHADOW);
      drawHLine(headX + 4, headX + 7, headBaseY + 2, ORANGE_SHADOW);

      // Rosy Cheeks blush
      drawPixel(headX + 2, headBaseY + 7, PINK);
      drawPixel(headX + 9, headBaseY + 7, PINK);

      // Eyes positioning & mouse tracking
      const leftEyeBaseX = headX + 2;
      const rightEyeBaseX = headX + 7;
      const eyeY = headBaseY + 3; // rows 3, 4, 5

      // Calculate pupillary offset based on mouse location
      const catCenterX = catPos.x + 64;
      const catCenterY = catPos.y + 64;
      const dx = mousePosRef.current.x - catCenterX;
      const dy = mousePosRef.current.y - catCenterY;
      
      let lookX = 0;
      let lookY = 0;
      if (animationState !== "sleep") {
        lookX = Math.abs(dx) > 20 ? Math.sign(dx) : 0;
        lookY = Math.abs(dy) > 20 ? Math.sign(dy) : 0;
      }

      if (eyeClosed) {
        // Blink / Sleep eyes: flat lines (3 pixels wide)
        drawHLine(leftEyeBaseX, leftEyeBaseX + 2, eyeY + 1, OUTLINE);
        drawHLine(rightEyeBaseX, rightEyeBaseX + 2, eyeY + 1, OUTLINE);
      } else if (animationState === "pet") {
        // Happy squinting curves ( ^ ^ ) over 3 pixels wide
        drawPixel(leftEyeBaseX, eyeY + 1, OUTLINE);
        drawPixel(leftEyeBaseX + 1, eyeY, OUTLINE);
        drawPixel(leftEyeBaseX + 2, eyeY + 1, OUTLINE);

        drawPixel(rightEyeBaseX, eyeY + 1, OUTLINE);
        drawPixel(rightEyeBaseX + 1, eyeY, OUTLINE);
        drawPixel(rightEyeBaseX + 2, eyeY + 1, OUTLINE);
      } else {
        // Expressive large, beautiful 3x3 yellow/amber cat eyes
        // Left Eye (3x3)
        drawRect(leftEyeBaseX + lookX, eyeY + lookY, 3, 3, "#EAB308"); // Golden Amber
        drawRect(leftEyeBaseX + lookX + 1, eyeY + lookY + 1, 1, 2, "#111827"); // Vertical slit black pupil
        drawPixel(leftEyeBaseX + lookX, eyeY + lookY, "#FFFFFF"); // Shiny white glint (top-left)

        // Right Eye (3x3)
        drawRect(rightEyeBaseX + lookX, eyeY + lookY, 3, 3, "#EAB308"); // Golden Amber
        drawRect(rightEyeBaseX + lookX + 1, eyeY + lookY + 1, 1, 2, "#111827"); // Vertical slit black pupil
        drawPixel(rightEyeBaseX + lookX, eyeY + lookY, "#FFFFFF"); // Shiny white glint (top-left)
      }

      // Small pink nose
      drawPixel(headX + 6, headBaseY + 6, PINK);
      
      // Cute mouth
      drawPixel(headX + 5, headBaseY + 7, OUTLINE);
      drawPixel(headX + 7, headBaseY + 7, OUTLINE);

      // Whiskers
      drawHLine(headX - 2, headX - 1, headBaseY + 5, "rgba(255, 255, 255, 0.45)");
      drawHLine(headX - 2, headX - 1, headBaseY + 7, "rgba(255, 255, 255, 0.45)");
      
      drawHLine(headX + 12, headX + 13, headBaseY + 5, "rgba(255, 255, 255, 0.45)");
      drawHLine(headX + 12, headX + 13, headBaseY + 7, "rgba(255, 255, 255, 0.45)");

      // DRAW ACTIVE HAT/ACCESSORY ON TOP
      if (activeHat !== "none") {
        const hat = ACCESSORIES.find((a) => a.id === activeHat);
        if (hat) {
          const hY = headBaseY;
          if (hat.type === "ribbon") {
            // Red bow on neck/chest
            drawRect(headX + 4, headBaseY + 9, 4, 1, hat.color);
            drawPixel(headX + 3, headBaseY + 9, OUTLINE);
            drawPixel(headX + 8, headBaseY + 9, OUTLINE);
          } else if (hat.type === "sunglasses") {
            // Cool shades
            drawHLine(headX + 1, headX + 10, eyeY, hat.color);
            drawRect(leftEyeBaseX - 1, eyeY, 3, 2, hat.color);
            drawRect(rightEyeBaseX - 1, eyeY, 3, 2, hat.color);
          } else if (hat.type === "chef") {
            // Big white puffy chef hat
            drawRect(headX + 3, hY - 6, 6, 4, "#F3F4F6"); // Puff body
            drawRect(headX + 2, hY - 5, 8, 3, "#FFFFFF");
            drawRect(headX + 3, hY - 2, 6, 2, "#E5E7EB"); // brim
            drawHLine(headX + 3, headX + 8, hY - 7, OUTLINE); // top outline
            drawHLine(headX + 3, headX + 8, hY - 1, OUTLINE); // brim outline
          } else if (hat.type === "cowboy") {
            // Brown cowboy hat
            drawHLine(headX, headX + 11, hY - 2, hat.color); // brim
            drawRect(headX + 3, hY - 5, 6, 3, hat.color); // crown
            drawHLine(headX + 3, headX + 8, hY - 3, "#EF4444"); // red belt stripe
            drawHLine(headX + 3, headX + 8, hY - 6, OUTLINE);
          } else if (hat.type === "wizard") {
            // Purple star wizard hat
            drawPixel(headX + 6, hY - 8, "#FBBF24"); // yellow gold tip star
            drawPixel(headX + 6, hY - 7, hat.color);
            drawRect(headX + 5, hY - 6, 3, 2, hat.color);
            drawRect(headX + 4, hY - 4, 5, 2, hat.color);
            drawHLine(headX + 2, headX + 9, hY - 2, hat.color); // brim
            drawPixel(headX + 6, hY - 4, "#FBBF24"); // little gold star decoration
          } else if (hat.type === "crown") {
            // Royal golden crown
            drawHLine(headX + 3, headX + 8, hY - 2, hat.color); // base
            drawPixel(headX + 3, hY - 4, hat.color); // peaks
            drawPixel(headX + 5, hY - 5, hat.color);
            drawPixel(headX + 7, hY - 5, hat.color);
            drawPixel(headX + 8, hY - 4, hat.color);
            // Red ruby gems
            drawPixel(headX + 5, hY - 2, "#EF4444");
            drawPixel(headX + 6, hY - 2, "#3B82F6"); // blue sapphire
          }
        }
      }

      // RENDER ALL FLOATING CANVAS PARTICLES (Hearts, Zzz, Sparkles)
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.type === "heart") {
          // 8-bit heart shape
          ctx.fillStyle = p.color;
          const px = Math.floor(p.x);
          const py = Math.floor(p.y);
          ctx.fillRect(px, py + 1, 1, 2);
          ctx.fillRect(px + 1, py, 1, 3);
          ctx.fillRect(px + 2, py + 1, 1, 3);
          ctx.fillRect(px + 3, py, 1, 3);
          ctx.fillRect(px + 4, py + 1, 1, 2);
          ctx.fillRect(px + 1, py + 3, 3, 1);
          ctx.fillRect(px + 2, py + 4, 1, 1);
        } else if (p.type === "zzz") {
          ctx.fillStyle = p.color;
          ctx.font = "bold 8px monospace";
          ctx.fillText("Zzz", p.x, p.y);
        } else if (p.type === "star" || p.type === "sparkle") {
          // Cross sparkle particle
          ctx.fillStyle = p.color;
          const px = Math.floor(p.x);
          const py = Math.floor(p.y);
          ctx.fillRect(px, py - 2, 1, 5);
          ctx.fillRect(px - 2, py, 5, 1);
        } else {
          // simple dust pixel
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
        }
      });

      // Filter out dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      // Queue next frame
      requestRef.current = requestAnimationFrame(drawFrame);
    };

    requestRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, animationState, activeHat, facingLeft]);

  // Handle direct Cat Clicks (Happy trigger)
  const handleCatClick = () => {
    if (isDragging) return;
    
    // Play happy purr and bounce
    setAnimationState("pet");
    playChirpSound("purr");
    gainXp(15);
    setLove((l) => Math.min(100, l + 15));

    // Open Tamagotchi dashboard
    setIsOpen(true);

    const clickGreetings = [
      "🌸 Prrrr! Kheyli doostet daram!",
      "✨ Ba tamarkoz dars bokhon, refigh!",
      "🍪 Zeytoon cookie doost dareh!",
      "🎵 Dance with me! Biya baham beraghsim!",
      "⭐ To herfeh-eyi, bepish!",
      "🐾 Ay joon! Khareh-khareh gollooye Zeytoon!",
      "🍊 Narenji-ye khodetam!",
      "💖 Solhe va aramesh baraye to!"
    ];
    showThought(clickGreetings[Math.floor(Math.random() * clickGreetings.length)]);
  };

  // feeding command
  const handleFeed = () => {
    if (hunger >= 100) {
      showThought("😸 I'm stuffed! No more fish!");
      return;
    }
    setAnimationState("eat");
    playChirpSound("eat");
    showThought("🐟 Nom nom! Yummy fish!");
    setHunger((h) => Math.min(100, h + 30));
    setEnergy((e) => Math.min(100, e + 10));
    gainXp(20);

    setTimeout(() => {
      setAnimationState("idle");
    }, 3000);
  };

  // playing command
  const handlePlay = () => {
    if (energy < 20) {
      showThought("💤 Too tired to dance. Nap first!");
      return;
    }
    setAnimationState("dance");
    playChirpSound("levelUp");
    showThought("🎵 Jamming to the focus beats!");
    setEnergy((e) => Math.max(0, e - 15));
    setLove((l) => Math.min(100, l + 20));
    gainXp(25);

    setTimeout(() => {
      setAnimationState("idle");
    }, 5000);
  };

  // sleep toggle
  const handleSleepToggle = () => {
    if (animationState === "sleep") {
      setAnimationState("idle");
      showThought("🌞 Good morning! Let's focus!");
      setEnergy(100);
      playChirpSound("meow");
    } else {
      setAnimationState("sleep");
      showThought("💤 Sleepy time...");
    }
  };

  const handleNameSave = () => {
    if (nameInput.trim()) {
      setName(nameInput.trim());
      setIsEditingName(false);
      showThought(`🐾 My new name is ${nameInput}!`);
      playChirpSound("meow");
    }
  };

  if (!isActive) {
    return null;
  }

  const xpNeeded = level * 100;
  const xpPercent = Math.min(100, (xp / xpNeeded) * 100);

  return (
    <>
      {/* FLOATING INTERACTIVE COMPANION (DRAGGABLE) */}
      <motion.div
        drag
        dragMomentum={true}
        dragElastic={0.06}
        dragTransition={{ power: 0.08, timeConstant: 200 }}
        onDragStart={() => {
          setIsDragging(true);
          setTargetX(null); // Stop any walking target
          setTargetY(null);
          vxRef.current = 0;
          vyRef.current = 0; // Reset momentum velocity
        }}
        onDrag={(event, info) => {
          setCatPos((prev) => ({
            x: prev.x + info.delta.x,
            y: prev.y + info.delta.y
          }));
        }}
        onDragEnd={(event, info) => {
          setIsDragging(false);
          vxRef.current = info.velocity.x; // Capture physical throw velocity!
          vyRef.current = info.velocity.y;
        }}
        style={{ left: 0, top: 0, x: catPos.x, y: catPos.y }}
        className="fixed z-[99] touch-none select-none cursor-grab active:cursor-grabbing group/cat flex flex-col items-center"
      >
        {/* SPEECH BUBBLE thought */}
        <AnimatePresence>
          {speechBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 5 }}
              className="absolute top-[-50px] bg-neutral-900/95 border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap z-20 font-sans tracking-wide"
            >
              {speechBubble}
              {/* Little down arrow for speech bubble */}
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 border-r border-b border-white/10 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Meow indicators */}
        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/cat:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1 rounded font-mono uppercase font-bold tracking-widest">
            PET ME
          </span>
        </div>

        {/* 60FPS Render Canvas */}
        <canvas
          ref={canvasRef}
          width={128}
          height={128}
          onClick={handleCatClick}
          className="w-[128px] h-[128px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
        />
      </motion.div>

      {/* MINIMAL HOLOGRAPHIC COMPANION DASHBOARD */}
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl font-sans relative overflow-hidden text-white"
            >
              {/* Neutral background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

              {/* Title Header */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-300 tracking-wider uppercase font-mono">
                    Companion Active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-all duration-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Minimal Main Information */}
              <div className="flex flex-col items-center text-center pt-2 pb-4 relative z-10 border-b border-white/5">
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center relative shadow-inner">
                    <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">Level</span>
                    <span className="text-3xl font-bold text-white font-mono">{level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 justify-center">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        maxLength={12}
                        className="bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-orange-500 w-24 text-center font-bold"
                      />
                      <button
                        onClick={handleNameSave}
                        className="bg-white text-black hover:bg-neutral-200 font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-200"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-lg font-bold text-white tracking-tight">{name}</h4>
                      <button
                        onClick={() => {
                          setNameInput(name);
                          setIsEditingName(true);
                        }}
                        className="text-white/40 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                        title="Edit Name"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-white/50 font-mono tracking-widest uppercase mt-0.5">Zeytoon's Hub</p>

                {/* Focus Timer Goal Progress Bar (Looks like weather precipitation/UV progress!) */}
                <div className="w-full mt-4 bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-3 flex flex-col gap-1 text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/60">
                    <span className="tracking-wider uppercase flex items-center gap-1">
                      <Award className="w-3 h-3 text-orange-400" />
                      DAILY STUDY GOAL
                    </span>
                    <span className="text-orange-400 font-bold">
                      {xp} / 50 MINS
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5 mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (xp / 50) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[pulse_1.5s_infinite]" />
                    </motion.div>
                  </div>
                  <p className="text-[9px] text-white/40 text-center mt-1">
                    Zeytoon's level increases directly with {ownerName}'s focus time!
                  </p>
                </div>
              </div>

              {/* STATS GRID - Looking like the weather app's Grid details (Humidity, Wind, Air Quality) */}
              <div className="grid grid-cols-3 gap-2 my-4 relative z-10">
                {/* Hunger Card */}
                <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all duration-200">
                  <Cookie className={`w-5 h-5 mb-1 ${hunger < 35 ? "text-red-400 animate-bounce" : "text-amber-400"}`} />
                  <span className="text-[8px] text-white/60 uppercase tracking-wider font-semibold">HUNGER</span>
                  <span className="text-xs font-bold font-mono mt-0.5">{hunger}%</span>
                  <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${hunger < 35 ? "bg-red-500 animate-pulse" : hunger < 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${hunger}%` }}
                    />
                  </div>
                </div>

                {/* Affection Card */}
                <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all duration-200">
                  <Heart className={`w-5 h-5 mb-1 ${love < 35 ? "text-rose-400 animate-pulse" : "text-rose-400"}`} />
                  <span className="text-[8px] text-white/60 uppercase tracking-wider font-semibold">AFFECTION</span>
                  <span className="text-xs font-bold font-mono mt-0.5">{love}%</span>
                  <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${love < 35 ? "bg-red-500 animate-pulse" : love < 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${love}%` }}
                    />
                  </div>
                </div>

                {/* Energy Card */}
                <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all duration-200">
                  <Moon className={`w-5 h-5 mb-1 ${energy < 35 ? "text-sky-400 animate-pulse" : "text-sky-400"}`} />
                  <span className="text-[8px] text-white/60 uppercase tracking-wider font-semibold">ENERGY</span>
                  <span className="text-xs font-bold font-mono mt-0.5">{energy}%</span>
                  <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${energy < 35 ? "bg-red-500 animate-pulse" : energy < 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${energy}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* INTERACT CONTROL DOCK - Designed like smart widgets */}
              <div className="space-y-2 mb-4 relative z-10">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider font-mono block">
                  Interactions
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleFeed}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 border border-white/10 text-white hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <Cookie className="w-3.5 h-3.5 text-amber-400" />
                    <span>Feed Treat</span>
                  </button>
                  <button
                    onClick={handlePlay}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 border border-white/10 text-white hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                    <span>Dance</span>
                  </button>
                  <button
                    onClick={handleSleepToggle}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 border border-white/10 text-white hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{animationState === "sleep" ? "Wake Up" : "Put to Sleep"}</span>
                  </button>
                  <button
                    onClick={() => {
                      playChirpSound("purr");
                      setLove((l) => Math.min(100, l + 10));
                      gainXp(10);
                      showThought(`🐾 Oh yes! Thank you so much, dear ${ownerName}! 😻`);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 border border-white/10 text-white hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Pet Cat</span>
                  </button>

                  {/* Premium Laser Chase Button */}
                  <button
                    onClick={() => {
                      setLaserActive(!laserActive);
                      if (!laserActive) {
                        setIsOpen(false); // Close dashboard so the user can see the laser dot on screen!
                        showThought(`🔴 Laser chase game started! Move your mouse and I'll chase it, dear ${ownerName}!`, 4500);
                        playChirpSound("meow");
                      } else {
                        showThought("🔴 Laser game stopped.", 1500);
                      }
                    }}
                    className={`col-span-2 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                      laserActive 
                        ? "bg-red-500/20 border border-red-500/50 text-red-100 animate-pulse shadow-red-500/10" 
                        : "bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444,0_0_15px_#ef4444] animate-ping" />
                    <span>{laserActive ? "Stop Laser" : "Laser Chase"}</span>
                  </button>
                </div>
              </div>

              {/* ACCESSORIES CLOSET - Designed like a weather app's daily checklist or forecast carousel */}
              <div className="space-y-2 border-t border-white/10 pt-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider font-mono">
                    Hat Dressing Room
                  </span>
                  <span className="text-[8px] text-orange-400 font-bold uppercase font-mono">
                    Unlock at streak levels
                  </span>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scrollbar-none">
                  {ACCESSORIES.map((hat) => {
                    const isUnlocked = level >= hat.levelRequired;
                    const isActive = activeHat === hat.id;
                    return (
                      <button
                        key={hat.id}
                        disabled={!isUnlocked}
                        onClick={() => {
                          setActiveHat(hat.id);
                          playChirpSound("meow");
                          showThought(`🎩 Wearing my ${hat.name}!`);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                          !isUnlocked
                            ? "bg-black/40 text-white/20 border border-transparent opacity-50 cursor-not-allowed"
                            : isActive
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.15)] font-black"
                            : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-transparent"
                        }`}
                        title={!isUnlocked ? `Requires level ${hat.levelRequired}` : hat.name}
                      >
                        {!isUnlocked ? "🔒" : null}
                        <span>{hat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer controls: Mute & Dismiss */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4 text-[10px] relative z-10">
                {/* Mute Synth Sound Toggle */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors cursor-pointer font-medium"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-white/70 animate-pulse" />}
                  <span>{isMuted ? "Unmute Sound" : "Mute Sound"}</span>
                </button>

                {/* Dismiss Button */}
                <button
                  onClick={() => {
                    setIsActive(false);
                    setIsOpen(false);
                  }}
                  className="text-red-400/80 hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                  title="Hide Companion"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Dismiss Zeytoon</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Glowing Laser Pointer Dot */}
      {laserActive && (
        <div
          style={{
            position: "fixed",
            left: laserPos.x,
            top: laserPos.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 9999,
          }}
          className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444,0_0_22px_#ef4444,0_0_40px_#ef4444] animate-pulse flex items-center justify-center"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-inner" />
        </div>
      )}
    </>
  );
}

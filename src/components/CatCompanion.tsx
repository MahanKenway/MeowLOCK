import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [facingLeft, setFacingLeft] = useState<boolean>(true);
  const [isFocusing, setIsFocusing] = useState<boolean>(false);

  // Refs for animation loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const ticksRef = useRef<number>(0);
  const lastStateChangeRef = useRef<number>(Date.now());
  const particlesRef = useRef<PixelParticle[]>([]);
  const lastXpGainRef = useRef<number>(Date.now());
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Refs to avoid setInterval restart
  const catPosRef = useRef(catPos);
  const targetXRef = useRef(targetX);
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
        new Set(completedSessions.map((s: any) => s.startTime.substring(0, 10)))
      ).sort() as string[];

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
    } catch (e) {
      return 0;
    }
  };

  // Helper to calculate total focus minutes completed today
  const getTodayFocusMinutes = () => {
    try {
      const saved = localStorage.getItem("focus_history");
      const sessions = saved ? JSON.parse(saved) : [];
      const todayStr = new Date().toISOString().substring(0, 10);
      const completedSessions = sessions.filter(
        (s: any) => s.completed && s.mode !== "shortBreak" && s.mode !== "longBreak"
      );
      const todaySessions = completedSessions.filter(
        (s: any) => s.startTime.substring(0, 10) === todayStr
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

      // Only trigger random movement if not busy eating/sleeping
      if (currentAnimState !== "sleep" && currentAnimState !== "eat") {
        if (rand < 0.25) {
          // Choose new walking target
          const newTarget = Math.floor(50 + Math.random() * (window.innerWidth - 200));
          setTargetX(newTarget);
          setAnimationState("walk");
        } else if (rand < 0.40) {
          // Curl up and rest
          setAnimationState("sit");
          if (Math.random() < 0.35) {
            const idleThoughts = [
              "🐾 Purr... You can absolutely complete your study goals! I believe in you!",
              "🌸 Meow! Let's stay focused and get this work done together!",
              "🐭 Seen any mice? Zeytoon is looking for some snacks!",
              "👀 Watching you study! You have such incredible focus!",
              "💤 Sleepy... Zeytoon is feeling a tiny bit cozy and drowsy.",
              "✨ Zeytoon is always here supporting you in your workspace!",
              "🍵 Remember to take a sip of water and keep your mind fresh!",
              "📖 Studying with you is Zeytoon's absolute favorite thing!",
              "🍊 I am just a lucky little orange cat spreading happy vibes!",
              "🌟 Make today the most productive day ever for yourself!",
              "⚡️ Did we start the focus timer yet, study buddy?",
              "🎵 These relaxing lofi beats are perfect for reading and studying!",
              "🐱 Orange cats are the sweetest companions. Let's stay focused!"
            ];
            showThought(idleThoughts[Math.floor(Math.random() * idleThoughts.length)]);
            playChirpSound("purr");
          }
        } else if (rand < 0.50 && currentEnergy < 60) {
          // Go to sleep if tired
          setAnimationState("sleep");
          showThought("💤 Zeytoon is getting sleepy... Nap time!");
        } else if (rand < 0.58) {
          // Waving
          setAnimationState("wave");
          showThought("👋 Hello friend! Zeytoon is right here!");
          playChirpSound("meow");
          setTimeout(() => setAnimationState("idle"), 2500);
        } else if (rand < 0.65) {
          // Curious tilt
          setAnimationState("tilt");
          showThought("🧐 What are we working on right now, my friend?");
          setTimeout(() => setAnimationState("idle"), 2000);
        } else if (rand < 0.70) {
          // Stretch
          setAnimationState("stretch");
          showThought("🧘‍♂️ Stretching out my paws! Stay active too!");
          setTimeout(() => setAnimationState("idle"), 3000);
        }
      }
    }, 12000); // dialogue frequency increased slightly from 15000 to 12000

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

  // Track Mouse movement relative to the cat for eyes to look at
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  // Movement Physics loop
  useEffect(() => {
    if (!isActive) return;

    let lastTime = Date.now();
    const updatePhysics = () => {
      if (isDragging) return;

      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const currentTargetX = targetXRef.current;
      const currentAnimState = animationStateRef.current;
      const currentPos = catPosRef.current;

      // Handle Walking Target
      if (currentTargetX !== null && currentAnimState === "walk") {
        const dx = currentTargetX - currentPos.x;
        const absDx = Math.abs(dx);
        const speed = 45; // pixels per second

        if (absDx < 4) {
          setCatPos({ x: currentTargetX, y: currentPos.y });
          setTargetX(null);
          setAnimationState("idle");
        } else {
          setFacingLeft(dx < 0);
          const step = Math.sign(dx) * speed * dt;
          setCatPos({ x: currentPos.x + step, y: currentPos.y });

          // Spawn occasional walking dust
          if (ticksRef.current % 12 === 0) {
            spawnParticle(64, 110, "dust");
          }
        }
      }
    };

    const interval = setInterval(updatePhysics, 30);
    return () => clearInterval(interval);
  }, [isActive, isDragging]);

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

      // Draw Legs
      const legY = 25;
      const stepOffset = ticks % 16 < 8 ? 1 : 0;

      if (animationState === "sleep") {
        // Tuck legs fully in sleeping position
        drawHLine(10, 21, 26, OUTLINE);
        drawHLine(11, 20, 25, ORANGE_SHADOW);
      } else if (animationState === "sit") {
        // Sitting legs flat
        drawHLine(11, 21, 26, OUTLINE);
        drawHLine(12, 14, 25, CREAM);
        drawHLine(17, 20, 25, BASE_ORANGE);
      } else if (animationState === "walk") {
        // Alternate walk frame legs
        if (stepOffset === 1) {
          // Leg 1 down, Leg 2 up
          drawRect(12, legY, 2, 3, OUTLINE);
          drawRect(12, legY, 1, 2, CREAM); // front
          
          drawRect(15, legY - 1, 2, 3, OUTLINE);
          drawRect(15, legY - 1, 1, 2, ORANGE_SHADOW);
          
          drawRect(18, legY, 2, 3, OUTLINE);
          drawRect(18, legY, 1, 2, BASE_ORANGE); // rear
          
          drawRect(21, legY - 1, 2, 3, OUTLINE);
          drawRect(21, legY - 1, 1, 2, ORANGE_SHADOW);
        } else {
          // Leg 1 up, Leg 2 down
          drawRect(12, legY - 1, 2, 3, OUTLINE);
          drawRect(12, legY - 1, 1, 2, CREAM);
          
          drawRect(15, legY, 2, 3, OUTLINE);
          drawRect(15, legY, 1, 2, ORANGE_SHADOW);
          
          drawRect(18, legY - 1, 2, 3, OUTLINE);
          drawRect(18, legY - 1, 1, 2, BASE_ORANGE);
          
          drawRect(21, legY, 2, 3, OUTLINE);
          drawRect(21, legY, 1, 2, ORANGE_SHADOW);
        }
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
      const bodyY = 16 + Math.round(walkBob) + Math.round(bodyH);
      const bH = 10 + Math.round(breathY);

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
      const leftEyeBaseX = headX + 3;
      const rightEyeBaseX = headX + 8;
      const eyeY = headBaseY + 4;

      // Calculate pupillary offset based on mouse location
      const catCenterX = catPos.x + 64;
      const catCenterY = catPos.y + 64;
      const dx = mousePosRef.current.x - catCenterX;
      const dy = mousePosRef.current.y - catCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let lookX = 0;
      let lookY = 0;
      if (dist > 30 && animationState !== "sleep") {
        lookX = Math.round((dx / dist) * 0.7);
        lookY = Math.round((dy / dist) * 0.5);
      }

      if (eyeClosed) {
        // Blink / Sleep eyes: flat lines
        drawHLine(leftEyeBaseX - 1, leftEyeBaseX + 1, eyeY, OUTLINE);
        drawHLine(rightEyeBaseX - 1, rightEyeBaseX + 1, eyeY, OUTLINE);
      } else if (animationState === "pet") {
        // Happy squinting curves ( ^ ^ )
        drawPixel(leftEyeBaseX - 1, eyeY + 1, OUTLINE);
        drawPixel(leftEyeBaseX, eyeY, OUTLINE);
        drawPixel(leftEyeBaseX + 1, eyeY + 1, OUTLINE);

        drawPixel(rightEyeBaseX - 1, eyeY + 1, OUTLINE);
        drawPixel(rightEyeBaseX, eyeY, OUTLINE);
        drawPixel(rightEyeBaseX + 1, eyeY + 1, OUTLINE);
      } else {
        // Expressive large Game Boy style yellow/amber oval eyes
        // Left Eye
        drawRect(leftEyeBaseX + lookX, eyeY + lookY - 1, 2, 3, OUTLINE);
        drawRect(leftEyeBaseX + lookX, eyeY + lookY - 1, 2, 3, "#EAB308"); // Amber/yellow base
        drawPixel(leftEyeBaseX + lookX + 1, eyeY + lookY, "#111827"); // Black pupil
        drawPixel(leftEyeBaseX + lookX, eyeY + lookY - 1, "#FFFFFF"); // White shiny glint

        // Right Eye
        drawRect(rightEyeBaseX + lookX, eyeY + lookY - 1, 2, 3, OUTLINE);
        drawRect(rightEyeBaseX + lookX, eyeY + lookY - 1, 2, 3, "#EAB308"); // Amber/yellow base
        drawPixel(rightEyeBaseX + lookX, eyeY + lookY, "#111827"); // Black pupil
        drawPixel(rightEyeBaseX + lookX + 1, eyeY + lookY - 1, "#FFFFFF"); // White shiny glint
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
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        style={{ x: catPos.x, y: catPos.y }}
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

      {/* ULTRA-PREMIUM HOLOGRAPHIC COMPANION DASHBOARD */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#09090b]/95 backdrop-blur-2xl border border-orange-500/20 rounded-3xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(249,115,22,0.15)] font-sans relative overflow-hidden"
            >
              {/* Starry ambient orange/violet background gradient glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15)_0%,rgba(124,58,237,0.08)_50%,transparent_100%)] pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

              {/* Title Header */}
              <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping absolute" />
                  <div className="w-2 h-2 rounded-full bg-orange-500 relative" />
                  <h3 className="text-[11px] font-bold text-orange-400 tracking-widest uppercase font-mono">
                    Zeytoon Companion HUD
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Name & Study Streak Level Badge */}
              <div className="bg-orange-500/[0.02] border border-orange-500/15 rounded-2xl p-4 space-y-3 mb-4 relative z-10 shadow-inner">
                <div className="flex items-center justify-between">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        maxLength={12}
                        className="bg-neutral-900 border border-orange-500/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-orange-500 w-28"
                      />
                      <button
                        onClick={handleNameSave}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-200"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-bold text-white tracking-tight">{name}</h4>
                      <button
                        onClick={() => {
                          setNameInput(name);
                          setIsEditingName(true);
                        }}
                        className="text-gray-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                        title="Edit Companion Name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Level tied directly to focus streak! */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                    <Award className="w-3.5 h-3.5" />
                    STREAK LVL {level}
                  </span>
                </div>

                {/* Focus Timer Goal Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-gray-400">
                    <span className="tracking-wider">TODAY'S STUDY SESSION</span>
                    <span className="text-orange-400 font-bold">
                      {xp} / 50 MINS GOAL
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/60 border border-white/5 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (xp / 50) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.15)_50%,transparent_100%)] animate-[pulse_1.5s_infinite]" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* STATUS METERS with Dynamic Warnings */}
              <div className="grid grid-cols-3 gap-2.5 mb-4 relative z-10">
                {/* Hunger Meter */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-2.5 text-center relative overflow-hidden shadow-inner group">
                  <div className={`absolute inset-0 bg-gradient-to-t ${hunger < 30 ? "from-red-500/10" : "from-orange-500/5"} to-transparent pointer-events-none`} />
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[8px] font-bold text-gray-400 font-mono uppercase">Hunger</span>
                    {hunger < 30 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm font-black font-mono mt-0.5 ${hunger < 30 ? "text-red-400" : "text-white"}`}>{hunger}%</p>
                  <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${hunger < 30 ? "bg-red-500 animate-pulse" : hunger < 70 ? "bg-amber-500" : "bg-orange-500"}`}
                      style={{ width: `${hunger}%` }}
                    />
                  </div>
                </div>

                {/* Affection Meter */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-2.5 text-center relative overflow-hidden shadow-inner">
                  <div className={`absolute inset-0 bg-gradient-to-t ${love < 30 ? "from-red-500/10" : "from-rose-500/5"} to-transparent pointer-events-none`} />
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[8px] font-bold text-gray-400 font-mono uppercase">Affection</span>
                    {love < 30 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm font-black font-mono mt-0.5 ${love < 30 ? "text-red-400" : "text-white"}`}>{love}%</p>
                  <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${love < 30 ? "bg-red-500 animate-pulse" : "bg-rose-500"}`}
                      style={{ width: `${love}%` }}
                    />
                  </div>
                </div>

                {/* Energy Meter */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-2.5 text-center relative overflow-hidden shadow-inner">
                  <div className={`absolute inset-0 bg-gradient-to-t ${energy < 30 ? "from-red-500/10" : "from-emerald-500/5"} to-transparent pointer-events-none`} />
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[8px] font-bold text-gray-400 font-mono uppercase">Energy</span>
                    {energy < 30 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm font-black font-mono mt-0.5 ${energy < 30 ? "text-red-400" : "text-white"}`}>{energy}%</p>
                  <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${energy < 30 ? "bg-red-500 animate-pulse" : energy < 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${energy}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ACTIONS CONTROL DOCK */}
              <div className="space-y-2 mb-4 relative z-10">
                <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  Interact Commands
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleFeed}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-500/10 border border-orange-500/20 text-orange-200 hover:bg-orange-500/20 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <Cookie className="w-3.5 h-3.5" />
                    <span>Feed Fish</span>
                  </button>
                  <button
                    onClick={handlePlay}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-500/10 border border-orange-500/20 text-orange-200 hover:bg-orange-500/20 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                    <span>Dance Beat</span>
                  </button>
                  <button
                    onClick={handleSleepToggle}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <Moon className="w-3.5 h-3.5 text-sky-400" />
                    <span>{animationState === "sleep" ? "Wake Up" : "Put to Sleep"}</span>
                  </button>
                  <button
                    onClick={() => {
                      playChirpSound("purr");
                      setLove((l) => Math.min(100, l + 10));
                      gainXp(10);
                      showThought("🐾 Mmm... Petting feels so warm!");
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Pet Zeytoon</span>
                  </button>
                </div>
              </div>

              {/* ACCESSORIES CLOSET */}
              <div className="space-y-2 border-t border-white/10 pt-4 relative z-10">
                <div className="flex items-center justify-between">
                  <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                    Hat Dressing Room
                  </h5>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">
                    Streak Level Unlocks
                  </span>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
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
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                          !isUnlocked
                            ? "bg-neutral-900/40 text-neutral-600 border border-transparent opacity-50 cursor-not-allowed"
                            : isActive
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                            : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
                        }`}
                        title={!isUnlocked ? `Requires streak level ${hat.levelRequired}` : hat.name}
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
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isMuted ? "Unmute Sound" : "Mute Sound"}</span>
                </button>

                {/* Dismiss Button */}
                <button
                  onClick={() => {
                    setIsActive(false);
                    setIsOpen(false);
                  }}
                  className="text-rose-400/80 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                  title="Hide Cat Companion"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Dismiss Zeytoon</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

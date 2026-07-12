/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GripVertical, Sliders,
  Sparkles,
  Eye,
  EyeOff,
  Settings,
  X,
  Plus,
  Play,
  Maximize2,
  Compass,
  Star,
  Quote,
  Loader2,
  Globe,
  LayoutGrid,
  BookOpen,
  Upload,
  Trash2,
  Video,
  Image as ImageIcon,
  Volume2,
  ListTodo,
  TrendingUp,
  Brain,
  Moon,
  Info,
  Music,
  Home,
  Lightbulb,
  Leaf,
  Maximize,
  Pen,
  Timer,
  Calendar,
  Check,
  Radio,
  HeartPulse,
  Telescope, CloudSun, Cat
} from "lucide-react";
import {
  WorkspaceProfile,
  Task,
  FocusSession,
  TimerSettings,
  AmbientSounds,
  WidgetLayout,
  FocusQuote,
  CustomCalendarEvent
} from "./types";
import DataHubWidget from "./components/DataHubWidget";

// --- INDEXEDDB HELPER FOR PERSISTING LOCAL CUSTOM BACKGROUND FILES ---
const DB_NAME = "flocus_bg_db";
const STORE_NAME = "backgrounds";

const saveBgToIndexedDB = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(file, "custom_bg");
      tx.oncomplete = () => {
        resolve(URL.createObjectURL(file));
      };
      tx.onerror = () => reject("Failed to save to DB");
    };
    request.onerror = () => reject("Failed to open DB");
  });
};

const deleteBgFromIndexedDB = (): Promise<void> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve();
        return;
      }
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete("custom_bg");
      tx.oncomplete = () => resolve();
    };
    request.onerror = () => resolve();
  });
};

const loadBgFromIndexedDB = (): Promise<{ url: string; type: "image" | "video" } | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve(null);
        return;
      }
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get("custom_bg");
      getReq.onsuccess = () => {
        const file = getReq.result;
        if (file instanceof File || file instanceof Blob) {
          const type = file.type.startsWith("video/") ? "video" : "image";
          resolve({ url: URL.createObjectURL(file), type });
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

import CentralClock from "./components/CentralClock";
import TimerWidget from "./components/TimerWidget";
import TodoListWidget from "./components/TodoListWidget";
import NotesWidget from "./components/NotesWidget";
import QuoteWidget from "./components/QuoteWidget";
import StatsWidget from "./components/StatsWidget";
import StreakWidget from "./components/StreakWidget";
import MusicWidget from "./components/MusicWidget";
import AmbientMixer from "./components/AmbientMixer";
import MinimalModeOverlay from "./components/MinimalModeOverlay";
import CalendarWidget from "./components/CalendarWidget";
import RadioWidget from "./components/RadioWidget";
import WeatherWidget from "./components/WeatherWidget";
import WellnessWidget from "./components/WellnessWidget";
import SpaceExplorer from "./components/SpaceExplorer";
import CatCompanion from "./components/CatCompanion";

// --- STATIC BACKGROUND IMAGE IMPORTS FOR ROBUST BUNDLING ---
import bgSetarehStudy from "./assets/images/setareh_pixel_study_v2_1783524583594.jpg";
import bgSetarehCoding from "./assets/images/setareh_pixel_coding_v2_1783524546639.jpg";
import bgSetarehRelax from "./assets/images/setareh_pixel_relax_v2_1783524564086.jpg";
import bgRainyCafe from "./assets/images/pixel_rainy_cafe_v1_1783524939912.jpg";
import bgSnowyCabin from "./assets/images/pixel_snowy_cabin_v1_1783524959716.jpg";
import bgSunsetSubway from "./assets/images/pixel_sunset_subway_v1_1783524979144.jpg";
import bgRooftopTwilight from "./assets/images/pixel_rooftop_twilight_1_1783526707514.jpg";
import bgRetroArcade from "./assets/images/pixel_retro_arcade_1_1783526723869.jpg";
import bgGreenhouseRain from "./assets/images/pixel_greenhouse_rain_1_1783526740989.jpg";
import bgMagicLibrary1 from "./assets/images/pixel_magic_library_1_1783526856865.jpg";
import bgUnderwaterRoom from "./assets/images/pixel_underwater_room_1_1783526880519.jpg";
import bgLaundromatNight from "./assets/images/pixel_laundromat_night_1_1783526896576.jpg";
import bgAutumnTreehouse from "./assets/images/pixel_autumn_treehouse_1783526999098.jpg";
import bgSpaceStation from "./assets/images/pixel_space_station_1783527015716.jpg";
import bgZenGarden from "./assets/images/pixel_zen_garden_1783527032340.jpg";
import bgGaragePixelArt from "./assets/images/garage_pixel_art_1783441014712.jpg";
import bgStudyGirl1 from "./assets/images/study_girl_1_1783458443182.jpg";
import bgStudyGirl2 from "./assets/images/study_girl_2_1783458463989.jpg";
import bgStudyCorner from "./assets/images/pixel_study_corner_1783255382430.jpg";
import bgRainCafe from "./assets/images/pixel_rain_cafe_1783255402157.jpg";
import bgCyberpunkTerminal from "./assets/images/pixel_cyberpunk_terminal_1783255416278.jpg";
import bgMistyForest from "./assets/images/pixel_misty_forest_1783255428671.jpg";
import bgCabinFireplace from "./assets/images/pixel_cabin_fireplace_1783255440529.jpg";
import bgMusicStudioTrue from "./assets/images/pixel_music_studio_true_1783620947171.jpg";
import bgRainyStudy from "./assets/images/pixel_rainy_study_1783621791241.jpg";
import bgZenGarden2 from "./assets/images/pixel_zen_garden_1783621805799.jpg";
import bgMagicLibrary2 from "./assets/images/pixel_magic_library_1783621820640.jpg";

// --- PATH RESOLUTION HELPER FOR GITHUB PAGES ---
const resolveAssetPath = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  
  // If the path is already an absolute/relative URL or starts with base url
  if (path.startsWith("/") || path.startsWith("./") || path.includes("/assets/")) {
    return path;
  }
  
  // Normalize legacy paths
  let cleanPath = path;
  if (cleanPath.includes("src/assets/images/")) {
    cleanPath = cleanPath.slice(cleanPath.indexOf("src/assets/images/") + "src/assets/images/".length);
    cleanPath = `images/${cleanPath}`;
  } else if (cleanPath.includes("assets/images/")) {
    cleanPath = cleanPath.slice(cleanPath.indexOf("assets/images/") + "assets/images/".length);
    cleanPath = `images/${cleanPath}`;
  }
  
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.slice(1);
  }
  
  // Statically resolvable BASE_URL for Vite
  const baseUrl = import.meta.env.BASE_URL || "/";
  if (baseUrl === "./") {
    return `./${cleanPath}`;
  }
  
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}${cleanPath}`;
};

// --- PIXEL ART GHOST LOGO ---

// Presets study room backdrops
const presetBgs = [
  {
    name: "Setareh Study Mode",
    url: bgSetarehStudy
  },
  {
    name: "Setareh Coding Mode",
    url: bgSetarehCoding
  },
  {
    name: "Setareh Relax Mode",
    url: bgSetarehRelax
  },
  {
    name: "Rainy Cyber Cafe",
    url: bgRainyCafe
  },
  {
    name: "Snowy Cabin",
    url: bgSnowyCabin
  },
  {
    name: "Sunset Subway",
    url: bgSunsetSubway
  },
  {
    name: "Twilight Rooftop",
    url: bgRooftopTwilight
  },
  {
    name: "Retro Arcade",
    url: bgRetroArcade
  },
  {
    name: "Rainy Greenhouse",
    url: bgGreenhouseRain
  },
  {
    name: "Magical Library",
    url: bgMagicLibrary1
  },
  {
    name: "Underwater Room",
    url: bgUnderwaterRoom
  },
  {
    name: "Midnight Laundromat",
    url: bgLaundromatNight
  },
  {
    name: "Autumn Treehouse",
    url: bgAutumnTreehouse
  },
  {
    name: "Space Station",
    url: bgSpaceStation
  },
  {
    name: "Zen Garden",
    url: bgZenGarden
  },
  {
    name: "Alternative Garage Studio",
    url: bgGaragePixelArt
  },
  {
    name: "Alternative Desk Study",
    url: bgStudyGirl1
  },
  {
    name: "Alternative Room Study",
    url: bgStudyGirl2
  },
  {
    name: "Cozy Study Corner",
    url: bgStudyCorner
  },
  {
    name: "Cozy Rain Cafe",
    url: bgRainCafe
  },
  {
    name: "Cyberpunk Study Terminal",
    url: bgCyberpunkTerminal
  },
  {
    name: "Peaceful Misty Forest",
    url: bgMistyForest
  },
  {
    name: "Cozy Cabin Fireplace",
    url: bgCabinFireplace
  },
  {
    name: "Music Studio",
    url: bgMusicStudioTrue
  },
  {
    name: "Rainy Night Study",
    url: bgRainyStudy
  },
  {
    name: "Peaceful Zen Garden",
    url: bgZenGarden2
  },
  {
    name: "Quiet Magic Library",
    url: bgMagicLibrary2
  }
];

const clockFonts = [
  { name: "Sleek Geometry (Outfit)", class: "font-clock-outfit" },
  { name: "Elegant Editorial (Playfair)", class: "font-clock-playfair" },
  { name: "Digital Neon (Share Tech)", class: "font-clock-sharetech" },
  { name: "Retro Deco (Righteous)", class: "font-clock-righteous" },
  { name: "Cyber Synth (Audiowide)", class: "font-clock-audiowide" },
  { name: "Classic 8-bit (VT323)", class: "font-clock-vt323" },
  { name: "Arcade Cabin (Press Start)", class: "font-clock-pressstart" },
  { name: "Multi-line Neon (Monoton)", class: "font-clock-monoton" },
  { name: "Digital Glitch (Rubik Glitch)", class: "font-clock-rubikglitch" },
  { name: "Gothic Cathedral (Unifraktur)", class: "font-clock-unifraktur" },
  { name: "Elegant Cursive (Sacramento)", class: "font-clock-sacramento" },
  { name: "Warm Script (Pacifico)", class: "font-clock-pacifico" },
  { name: "Retro Pixel (Silkscreen)", class: "font-clock-silkscreen" },
  { name: "Friendly Bubble (Comfortaa)", class: "font-clock-comfortaa" },
  { name: "Extreme Contrast (Abril)", class: "font-clock-abril" },
  { name: "Spooky Dripping (Creepster)", class: "font-clock-creepster" },
  { name: "Cozy Sketch (Architects)", class: "font-clock-architects" },
  { name: "Street Graffiti (Sedgwick)", class: "font-clock-sedgwick" },
  { name: "Abstract Avant (Major Mono)", class: "font-clock-majormono" },
  { name: "Retro Typewriter (Special Elite)", class: "font-clock-specialelite" },
  { name: "Sketchy Outline (Londrina)", class: "font-clock-londrina" },
  { name: "Grid Dot Matrix (DotGothic)", class: "font-clock-dotgothic" },
  { name: "90s MTV Blocky (Kablammo)", class: "font-clock-kablammo" },
  { name: "Avant-Garde (Syne)", class: "font-clock-syne" },
  { name: "Classical Roman (Cinzel)", class: "font-clock-cinzel" },
  { name: "Condensed Tall (Bebas)", class: "font-clock-bebas" },
  { name: "Playful Script (Lobster)", class: "font-clock-lobster" },
  { name: "High Contrast (DM Serif)", class: "font-clock-dm" },
  { name: "Coding Terminal (JetBrains)", class: "font-clock-mono" },
  { name: "Minimalist Sans (Inter)", class: "font-clock-inter" },
];

const initialProfiles: WorkspaceProfile[] = [
  {
    name: "Study Mode",
    themeId: "cozy",
    bgUrl: bgSetarehStudy,
    blur: 8,
    overlay: 40,
    widgets: {
      timer: true,
      todo: true,
      notes: false,
      goals: false,
      quote: false,
      music: false,
      stats: false,
      mixer: false,
      wellness: false
    },
    timerSettings: {
      pomodoro: 25,
      shortBreak: 5,
      longBreak: 15,
      countdown: 10,
      autoStartNext: false,
      soundEnabled: true
    },
    soundVolumes: {
      rain: 0.3,
      cafe: 0.1,
      whiteNoise: 0,
      fire: 0.15,
      wind: 0
    },
    spotifyUrl: "https://www.youtube.com/embed/jfKfPfyJRdk"
  },
  {
    name: "Coding Mode",
    themeId: "cyberpunk",
    bgUrl: bgSetarehCoding,
    blur: 15,
    overlay: 65,
    widgets: {

      timer: true,
      todo: true,
      notes: true,
      goals: false,
      quote: true,
      music: true,
      stats: true,
      mixer: true,
      wellness: true
    },
    timerSettings: {
      pomodoro: 45,
      shortBreak: 10,
      longBreak: 20,
      countdown: 15,
      autoStartNext: true,
      soundEnabled: true
    },
    soundVolumes: {
      rain: 0,
      cafe: 0,
      whiteNoise: 0.5,
      fire: 0,
      wind: 0.2
    },
    spotifyUrl: "https://www.youtube.com/embed/4xDzrJKXOOY"
  },
  {
    name: "Relax Mode",
    themeId: "ambient",
    bgUrl: bgSetarehRelax,
    blur: 4,
    overlay: 25,
    widgets: {

      timer: true,
      todo: false,
      notes: false,
      goals: false,
      quote: true,
      music: true,
      stats: false,
      mixer: true,
      wellness: false
    },
    timerSettings: {
      pomodoro: 15,
      shortBreak: 15,
      longBreak: 30,
      countdown: 5,
      autoStartNext: false,
      soundEnabled: true
    },
    soundVolumes: {
      rain: 0.4,
      cafe: 0,
      whiteNoise: 0,
      fire: 0.25,
      wind: 0.3
    },
    spotifyUrl: "https://www.youtube.com/embed/5mCReV31Sgw"
  }
];

const ACCENT_COLORS = [
  { id: "purple", name: "Purple", hex: "#7c3aed" },
  { id: "blue", name: "Blue", hex: "#3b82f6" },
  { id: "green", name: "Green", hex: "#10b981" },
  { id: "amber", name: "Amber", hex: "#f59e0b" },
  { id: "rose", name: "Rose", hex: "#f43f5e" },
  { id: "mono", name: "Mono", hex: "#ffffff" },
];

const UI_STYLES = [
  { id: "glass", name: "Dark Liquid" },
  { id: "glass-light", name: "Light Liquid" },
  { id: "retro", name: "Retro 95" },
] as const;

export default function App() {
  const todoRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const mixerRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const leftDockRef = useRef<HTMLDivElement>(null);
  const rightDockRef = useRef<HTMLDivElement>(null);

  // --- CORE STATE PERSISTENCE ---
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>(() => {
    const saved = localStorage.getItem("focus_profiles");
    return saved ? JSON.parse(saved) : initialProfiles;
  });

  const [currentProfileName, setCurrentProfileName] = useState<string>(() => {
    return localStorage.getItem("focus_active_profile") || "Study Mode";
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("focus_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    return localStorage.getItem("focus_active_task_id") || null;
  });

  const [calendarEvents, setCalendarEvents] = useState<CustomCalendarEvent[]>(() => {
    const saved = localStorage.getItem("calendar_events");
    return saved ? JSON.parse(saved) : [];
  });

  const [focusHistory, setFocusHistory] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem("focus_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [noteContent, setNoteContent] = useState<string>(() => {
    return localStorage.getItem("focus_notes") || "";
  });

  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("focus_daily_goal");
    return saved ? parseInt(saved) : 120;
  });

  const [quoteData, setQuoteData] = useState<FocusQuote>(() => {
    const saved = localStorage.getItem("focus_quote");
    return saved
      ? JSON.parse(saved)
      : {
          quote: "The only way to do great work is to love what you do.",
          author: "Steve Jobs",
          tips: ["Break large tasks into tiny Pomodoro units.", "Block out digital distractions entirely."]
        };
  });

  // --- CUSTOM CLOCK & USER CONFIGS ---
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("focus_username") || "Focus User";
  });
  const [clockFontClass, setClockFontClass] = useState<string>(() => {
    return localStorage.getItem("focus_clock_font") || "font-clock-outfit";
  });
  const [clockSize, setClockSize] = useState<number>(() => {
    const saved = localStorage.getItem("focus_clock_size");
    return saved ? parseInt(saved) : 120;
  });

  // --- ADDITIONAL WORKSPACE PERSONALIZATIONS ---
  const [customAccentColor, setCustomAccentColor] = useState<string>(() => {
    return localStorage.getItem("focus_custom_accent") || "#7c3aed";
  });
  const [glassOpacity, setGlassOpacity] = useState<number>(() => {
    const saved = localStorage.getItem("focus_glass_opacity");
    return saved ? parseInt(saved) : 50;
  });
  const [windowRoundness, setWindowRoundness] = useState<number>(() => {
    const saved = localStorage.getItem("focus_window_roundness");
    return saved ? parseInt(saved) : 16;
  });
  const [showSeconds, setShowSeconds] = useState<boolean>(() => {
    return localStorage.getItem("focus_show_seconds") !== "false";
  });
  const [showGreeting, setShowGreeting] = useState<boolean>(() => {
    return localStorage.getItem("focus_show_greeting") !== "false";
  });
  const [showDate, setShowDate] = useState<boolean>(() => {
    return localStorage.getItem("focus_show_date") !== "false";
  });
  const [clockColor, setClockColor] = useState<string>(() => {
    return localStorage.getItem("focus_clock_color") || "white";
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

  // --- UI STATES ---
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("GEMINI_API_KEY") || "");
  const [nasaKey, setNasaKey] = useState(() => localStorage.getItem("NASA_API_KEY") || "");

  const handleGeminiKeyChange = (val: string) => {
    setGeminiKey(val);
    localStorage.setItem("GEMINI_API_KEY", val);
  };

  const handleNasaKeyChange = (val: string) => {
    setNasaKey(val);
    localStorage.setItem("NASA_API_KEY", val);
  };

  const handleImportAllData = (data: any) => {
    if (!data) return;
    
    // Update individual state variables
    if (data.username !== undefined) {
      setUsername(data.username);
      localStorage.setItem("focus_username", data.username);
    }
    if (data.clockFontClass !== undefined) {
      setClockFontClass(data.clockFontClass);
      localStorage.setItem("focus_clock_font", data.clockFontClass);
    }
    if (data.clockSize !== undefined) {
      setClockSize(data.clockSize);
      localStorage.setItem("focus_clock_size", data.clockSize.toString());
    }
    if (data.customAccentColor !== undefined) {
      setCustomAccentColor(data.customAccentColor);
      localStorage.setItem("focus_custom_accent", data.customAccentColor);
    }
    if (data.glassOpacity !== undefined) {
      setGlassOpacity(data.glassOpacity);
      localStorage.setItem("focus_glass_opacity", data.glassOpacity.toString());
    }
    if (data.windowRoundness !== undefined) {
      setWindowRoundness(data.windowRoundness);
      localStorage.setItem("focus_window_roundness", data.windowRoundness.toString());
    }
    if (data.showSeconds !== undefined) {
      setShowSeconds(data.showSeconds);
      localStorage.setItem("focus_show_seconds", data.showSeconds.toString());
    }
    if (data.showGreeting !== undefined) {
      setShowGreeting(data.showGreeting);
      localStorage.setItem("focus_show_greeting", data.showGreeting.toString());
    }
    if (data.showDate !== undefined) {
      setShowDate(data.showDate);
      localStorage.setItem("focus_show_date", data.showDate.toString());
    }
    if (data.clockColor !== undefined) {
      setClockColor(data.clockColor);
      localStorage.setItem("focus_clock_color", data.clockColor);
    }
    if (data.textSize !== undefined) {
      setTextSize(data.textSize);
      localStorage.setItem("zen_text_size", data.textSize);
    }
    
    if (data.profiles !== undefined) {
      setProfiles(data.profiles);
      localStorage.setItem("focus_profiles", JSON.stringify(data.profiles));
    }
    if (data.currentProfileName !== undefined) {
      setCurrentProfileName(data.currentProfileName);
      localStorage.setItem("focus_active_profile", data.currentProfileName);
    }
    if (data.tasks !== undefined) {
      setTasks(data.tasks);
      localStorage.setItem("focus_tasks", JSON.stringify(data.tasks));
    }
    if (data.calendarEvents !== undefined) {
      setCalendarEvents(data.calendarEvents);
      localStorage.setItem("calendar_events", JSON.stringify(data.calendarEvents));
    }
    if (data.focusHistory !== undefined) {
      setFocusHistory(data.focusHistory);
      localStorage.setItem("focus_history", JSON.stringify(data.focusHistory));
    }

    if (data.geminiKey !== undefined) {
      setGeminiKey(data.geminiKey);
      localStorage.setItem("GEMINI_API_KEY", data.geminiKey);
    }
    if (data.nasaKey !== undefined) {
      setNasaKey(data.nasaKey);
      localStorage.setItem("NASA_API_KEY", data.nasaKey);
    }
  };

  const handleResetAllData = () => {
    // Clear localStorage keys
    const keysToRemove = [
      "focus_username",
      "focus_clock_font",
      "focus_clock_size",
      "focus_custom_accent",
      "focus_glass_opacity",
      "focus_window_roundness",
      "focus_show_seconds",
      "focus_show_greeting",
      "focus_show_date",
      "focus_clock_color",
      "zen_text_size",
      "focus_profiles",
      "focus_active_profile",
      "focus_tasks",
      "focus_active_task_id",
      "calendar_events",
      "focus_history"
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Reset React state variables
    setUsername("Focus User");
    setClockFontClass("font-clock-outfit");
    setClockSize(120);
    setCustomAccentColor("#7c3aed");
    setGlassOpacity(50);
    setWindowRoundness(16);
    setShowSeconds(true);
    setShowGreeting(true);
    setShowDate(true);
    setClockColor("white");
    setTextSize("base");
    setProfiles(initialProfiles);
    setCurrentProfileName("Study Mode");
    setTasks([]);
    setActiveTaskId(null);
    setCalendarEvents([]);
    setFocusHistory([]);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMinimalMode, setIsMinimalMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [musicViewMode, setMusicViewMode] = useState<"normal" | "mini" | "alt" | "alt_mini">("normal");
  const isMusicMini = musicViewMode === "mini" || musicViewMode === "alt_mini";
  const setIsMusicMini = (mini: boolean) => {
    setMusicViewMode(prev => {
      if (mini) {
        return prev === "alt" ? "alt_mini" : "mini";
      } else {
        return prev === "alt_mini" ? "alt" : "normal";
      }
    });
  };
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notesViewMode, setNotesViewMode] = useState<"normal" | "mini" | "alt" | "alt_mini">("normal");
  const isNotesMini = notesViewMode === "mini" || notesViewMode === "alt_mini";
  const setIsNotesMini = (mini: boolean) => {
    setNotesViewMode(prev => {
      if (mini) {
        return prev === "alt" ? "alt_mini" : "mini";
      } else {
        return prev === "alt_mini" ? "alt" : "normal";
      }
    });
  };
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [isStreakMini, setIsStreakMini] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSpaceExplorerOpen, setIsSpaceExplorerOpen] = useState(() => {
    return localStorage.getItem("zen_space_explorer_open") === "true";
  });
  useEffect(() => {
    localStorage.setItem("zen_space_explorer_open", isSpaceExplorerOpen ? "true" : "false");
  }, [isSpaceExplorerOpen]);

  const [nasaBgUrl, setNasaBgUrl] = useState<string>(() => localStorage.getItem("zen_space_bg_url") || "");
  const [nasaBgType, setNasaBgType] = useState<"image" | "video">(() => (localStorage.getItem("zen_space_bg_type") as any) || "image");
  const [nasaBgTitle, setNasaBgTitle] = useState<string>(() => localStorage.getItem("zen_space_bg_title") || "");
  const [nasaBgExplanation, setNasaBgExplanation] = useState<string>(() => localStorage.getItem("zen_space_bg_explanation") || "");
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [isRadioMini, setIsRadioMini] = useState(false);
  const [isWellnessOpen, setIsWellnessOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
  const [isCatActive, setIsCatActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("zen_cat_companion_active");
    return saved !== "false";
  });

  const toggleCatActive = () => {
    const nextVal = !isCatActive;
    setIsCatActive(nextVal);
    localStorage.setItem("zen_cat_companion_active", String(nextVal));
    window.dispatchEvent(new CustomEvent("cat-active-toggle", { detail: { active: nextVal } }));
  };

  const anyWidgetOpen = isTodoOpen || isMusicOpen || isNotesOpen || isMixerOpen || isStatsOpen || isStreakOpen || isCalendarOpen || isSpaceExplorerOpen || isWellnessOpen || isWeatherOpen || isRadioOpen;

  const closeAllWidgets = () => {
    // 1. Close local-only state widgets
    setIsStreakOpen(false);
    setIsCalendarOpen(false);
    setIsSpaceExplorerOpen(false);
    setIsWeatherOpen(false);
    setIsRadioOpen(false);

    // 2. Synchronize active profile widgets by setting all layout widgets to false except timer
    if (activeProfile?.widgets) {
      const updatedWidgets = { ...activeProfile.widgets };
      (Object.keys(updatedWidgets) as Array<keyof typeof activeProfile.widgets>).forEach((key) => {
        if (key !== "timer") {
          updatedWidgets[key] = false;
        }
      });
      updateProfileField("widgets", updatedWidgets);
    }

    // 3. Close profile-tied local state widgets
    setIsTodoOpen(false);
    setIsMusicOpen(false);
    setIsNotesOpen(false);
    setIsMixerOpen(false);
    setIsStatsOpen(false);
    setIsWellnessOpen(false);
  };

  useEffect(() => {
    const handleActiveToggle = (e: any) => {
      setIsCatActive(e.detail.active);
    };
    window.addEventListener("cat-active-toggle", handleActiveToggle);
    return () => window.removeEventListener("cat-active-toggle", handleActiveToggle);
  }, []);

  // Lock body scroll on mobile when any modal/widget is open
  useEffect(() => {
    if (isMobile) {
      const isAnyModalOpen = isTodoOpen || isNotesOpen || isCalendarOpen || isSpaceExplorerOpen || isMixerOpen || isMusicOpen || isRadioOpen || isStatsOpen || isStreakOpen || isWellnessOpen || isSidebarOpen || isWeatherOpen;
      if (isAnyModalOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isTodoOpen, isNotesOpen, isCalendarOpen, isSpaceExplorerOpen, isMixerOpen, isMusicOpen, isRadioOpen, isStatsOpen, isStreakOpen, isWellnessOpen, isSidebarOpen, isWeatherOpen]);

  const [currentRadioStation, setCurrentRadioStation] = useState<any | null>(() => {
    const saved = localStorage.getItem("current_radio_station");
    return saved ? JSON.parse(saved) : null;
  });
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(() => {
    const saved = localStorage.getItem("radio_volume");
    return saved ? parseFloat(saved) : 0.5;
  });
  const [radioMood, setRadioMood] = useState(() => {
    return localStorage.getItem("radio_mood") || "Midnight Lo-fi";
  });
  
  // Local background states
  const [localBgUrl, setLocalBgUrl] = useState<string | null>(null);
  const [localBgType, setLocalBgType] = useState<"image" | "video">("image");
  const [isDraggingBgFile, setIsDraggingBgFile] = useState(false);

  const activeProfile = profiles.find((p) => p.name === currentProfileName) || profiles[0];
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  // Load custom background from IndexedDB on initial mount
  useEffect(() => {
    loadBgFromIndexedDB().then((res) => {
      if (res) {
        setLocalBgUrl(res.url);
        setLocalBgType(res.type);
      }
    });
  }, []);

  const radioAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!radioAudioRef.current) {
      radioAudioRef.current = new Audio();
    }
    const audio = radioAudioRef.current;

    // Set volume
    audio.volume = radioVolume;

    // Stream handler
    if (currentRadioStation?.url_resolved || currentRadioStation?.url) {
      const url = currentRadioStation.url_resolved || currentRadioStation.url;
      if (audio.src !== url) {
        audio.src = url;
      }
      if (isRadioPlaying) {
        audio.play().catch(err => {
          console.warn("Audio playback failed:", err);
          setIsRadioPlaying(false);
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }

    // Persist radio settings
    localStorage.setItem("current_radio_station", JSON.stringify(currentRadioStation));
  }, [currentRadioStation, isRadioPlaying]);

  useEffect(() => {
    if (radioAudioRef.current) {
      radioAudioRef.current.volume = radioVolume;
    }
    localStorage.setItem("radio_volume", String(radioVolume));
  }, [radioVolume]);

  useEffect(() => {
    localStorage.setItem("radio_mood", radioMood);
  }, [radioMood]);

  useEffect(() => {
    const audio = radioAudioRef.current;
    if (!audio) return;

    const handleError = () => {
      console.warn("Radio stream error encountered. Disabling active stream.");
      setIsRadioPlaying(false);
    };

    audio.addEventListener("error", handleError);
    return () => {
      audio.removeEventListener("error", handleError);
    };
  }, [currentRadioStation]);

  const handleBgFileSelect = async (file: File) => {
    if (!file) return;
    try {
      const url = await saveBgToIndexedDB(file);
      const type = file.type.startsWith("video/") ? "video" : "image";
      setLocalBgUrl(url);
      setLocalBgType(type);
      updateProfileField("bgUrl", "custom_local");
    } catch (err) {
      console.error("Failed to persist background:", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBgFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingBgFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBgFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleBgFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLocalBg = async () => {
    await deleteBgFromIndexedDB();
    setLocalBgUrl(null);
    setLocalBgType("image");
    updateProfileField("bgUrl", presetBgs[0].url);
  };

  // Save changes to localStorage whenever core state updates
  useEffect(() => {
    localStorage.setItem("focus_username", username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem("focus_clock_font", clockFontClass);
  }, [clockFontClass]);

  useEffect(() => {
    localStorage.setItem("focus_clock_size", clockSize.toString());
  }, [clockSize]);

  useEffect(() => {
    localStorage.setItem("focus_custom_accent", customAccentColor);
  }, [customAccentColor]);

  useEffect(() => {
    localStorage.setItem("focus_glass_opacity", glassOpacity.toString());
  }, [glassOpacity]);

  useEffect(() => {
    localStorage.setItem("focus_window_roundness", windowRoundness.toString());
  }, [windowRoundness]);

  useEffect(() => {
    localStorage.setItem("focus_show_seconds", showSeconds.toString());
  }, [showSeconds]);

  useEffect(() => {
    localStorage.setItem("focus_show_greeting", showGreeting.toString());
  }, [showGreeting]);

  useEffect(() => {
    localStorage.setItem("focus_show_date", showDate.toString());
  }, [showDate]);

  useEffect(() => {
    localStorage.setItem("focus_clock_color", clockColor);
  }, [clockColor]);

  // Save changes to localStorage whenever core state updates
  useEffect(() => {
    localStorage.setItem("focus_profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem("focus_active_profile", currentProfileName);
  }, [currentProfileName]);

  useEffect(() => {
    localStorage.setItem("focus_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("focus_history", JSON.stringify(focusHistory));
  }, [focusHistory]);

  useEffect(() => {
    localStorage.setItem("focus_notes", noteContent);
  }, [noteContent]);

  useEffect(() => {
    localStorage.setItem("focus_daily_goal", dailyGoalMinutes.toString());
  }, [dailyGoalMinutes]);

  useEffect(() => {
    localStorage.setItem("focus_quote", JSON.stringify(quoteData));
  }, [quoteData]);

  useEffect(() => {
    localStorage.setItem("calendar_events", JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem("focus_active_task_id", activeTaskId);
    } else {
      localStorage.removeItem("focus_active_task_id");
    }
  }, [activeTaskId]);

  // --- WORKSPACE MODIFIERS ---
  const updateProfileField = <K extends keyof WorkspaceProfile>(field: K, value: WorkspaceProfile[K]) => {
    if (field === "bgUrl") {
      setNasaBgUrl("");
      setNasaBgTitle("");
      setNasaBgExplanation("");
      localStorage.removeItem("zen_space_bg_url");
      localStorage.removeItem("zen_space_bg_type");
      localStorage.removeItem("zen_space_bg_title");
      localStorage.removeItem("zen_space_bg_explanation");
    }
    setProfiles((prev) =>
      prev.map((p) => (p.name === currentProfileName ? { ...p, [field]: value } : p))
    );
  };

  const toggleWidget = (key: keyof WidgetLayout) => {
    const nextVal = !activeProfile.widgets[key];
    updateProfileField("widgets", {
      ...activeProfile.widgets,
      [key]: nextVal
    });
  };

  // Sync widgets when current profile or its widgets change
  useEffect(() => {
    if (activeProfile?.widgets) {
      setIsTodoOpen(!!activeProfile.widgets.todo);
      setIsMusicOpen(!!activeProfile.widgets.music);
      setIsNotesOpen(!!activeProfile.widgets.notes);
      setIsMixerOpen(!!activeProfile.widgets.mixer);
      setIsStatsOpen(!!activeProfile.widgets.stats);
      setIsWellnessOpen(!!activeProfile.widgets.wellness);
      setIsQuoteOpen(!!activeProfile.widgets.quote);
    }
  }, [activeProfile?.widgets, activeProfile?.name]);

  const handleSelectProfile = (name: string) => {
    setCurrentProfileName(name);
    setNasaBgUrl("");
    setNasaBgTitle("");
    setNasaBgExplanation("");
    localStorage.removeItem("zen_space_bg_url");
    localStorage.removeItem("zen_space_bg_type");
    localStorage.removeItem("zen_space_bg_title");
    localStorage.removeItem("zen_space_bg_explanation");
  };

  const handleSaveProfile = (updated: WorkspaceProfile) => {
    setProfiles((prev) => {
      const exists = prev.some((p) => p.name === updated.name);
      if (exists) {
        return prev.map((p) => (p.name === updated.name ? updated : p));
      } else {
        return [...prev, updated];
      }
    });
    setCurrentProfileName(updated.name);
  };

  const handleDeleteProfile = (name: string) => {
    if (profiles.length <= 1) return;
    setProfiles((prev) => prev.filter((p) => p.name !== name));
    if (currentProfileName === name) {
      const remaining = profiles.filter((p) => p.name !== name);
      setCurrentProfileName(remaining[0].name);
    }
  };

  // --- TASK ACTIONS ---
  const handleAddTask = (taskData: Omit<Task, "id" | "dateCreated">) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substring(2),
      dateCreated: new Date().toISOString()
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          // If a task is completed, we can also release the activeTaskId if it matches
          if (nextCompleted && activeTaskId === id) {
            setActiveTaskId(null);
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  };

  const handleResetTasks = () => {
    setTasks([]);
    setActiveTaskId(null);
  };

  // --- TIMER SESSIONS logger ---
  const handleSessionComplete = (session: FocusSession) => {
    setFocusHistory((prev) => [...prev, session]);
    
    // Automatically increment the actualSessions of the active focus task on Pomodoro completion
    if (session.completed && session.mode === "pomodoro" && activeTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId
            ? { ...t, actualSessions: t.actualSessions + 1 }
            : t
        )
      );
    }
  };

  const currentAccent = ACCENT_COLORS.find((c) => c.id === activeProfile.accentColor) || ACCENT_COLORS[0];
  const currentAccentHex = activeProfile.accentColor === "custom" ? customAccentColor : currentAccent.hex;
  const currentUiStyle = activeProfile.uiStyle || "glass";

  const isLocal = activeProfile.bgUrl === "custom_local";
  const standardBgUrl = isLocal ? (localBgUrl || "") : activeProfile.bgUrl;
  const rawBgUrlToRender = nasaBgUrl ? nasaBgUrl : standardBgUrl;
  const bgUrlToRender = rawBgUrlToRender
    ? resolveAssetPath(rawBgUrlToRender.replace(/^http:\/\//i, "https://"))
    : "";
  
  const isNonLocalVideo = activeProfile.bgUrl && (
    activeProfile.bgUrl.includes(".mp4") ||
    activeProfile.bgUrl.includes(".webm") ||
    activeProfile.bgUrl.includes(".mov") ||
    activeProfile.bgUrl.includes(".ogg") ||
    activeProfile.bgUrl.includes("video-download")
  );
  const standardBgType = isLocal ? localBgType : (isNonLocalVideo ? "video" : "image");
  const bgTypeToRender = nasaBgUrl ? nasaBgType : standardBgType;

  return (
    <div
      data-theme={currentUiStyle}
      className="h-screen overflow-hidden relative flex flex-col bg-neutral-950 transition-all duration-700"
    >
      <style>{`
        :root {
          --accent: ${currentAccentHex};
          --overlay: ${activeProfile.overlay};
        }
        .bg-\\[\\#7c3aed\\] { background-color: var(--accent) !important; }
        .text-\\[\\#7c3aed\\] { color: var(--accent) !important; }
        .border-\\[\\#7c3aed\\] { border-color: var(--accent) !important; }
        .shadow-\\[\\#7c3aed\\]\\/20 { box-shadow: 0 10px 15px -3px color-mix(in srgb, var(--accent) 20%, transparent), 0 4px 6px -4px color-mix(in srgb, var(--accent) 20%, transparent) !important; }
        .accent-\\[\\#7c3aed\\] { accent-color: var(--accent) !important; }

        /* Liquid Glass (Dark) */
        [data-theme="glass"] .bg-white\\/5 {
           background-color: rgba(255, 255, 255, 0.02) !important;
           border: 1px solid rgba(255, 255, 255, 0.08) !important;
           box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        [data-theme="glass"] .bg-\\[\\#0a0a0a\\]\\/80, [data-theme="glass"] .bg-\\[\\#0a0a0a\\]\\/60, [data-theme="glass"] .bg-\\[\\#0a0a0a\\]\\/40, [data-theme="glass"] .bg-neutral-950\\/50, [data-theme="glass"] .retro-window, [data-theme="glass"] .bg-neutral-900\\/40 {
           background-color: rgba(10, 10, 10, ${glassOpacity / 100}) !important;
           backdrop-filter: blur(40px) saturate(180%) !important;
           border: 1px solid rgba(255, 255, 255, 0.1) !important;
           box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.6) !important;
        }

        /* Liquid Glass (Light) - Fully Refined for Contrast & Customizable Opacity */
        [data-theme="glass-light"] .bg-white\\/5 {
           background-color: rgba(255, 255, 255, 0.45) !important;
           border: 1px solid rgba(0, 0, 0, 0.15) !important;
           box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(0,0,0,0.05) !important;
        }
        [data-theme="glass-light"] .bg-\\[\\#0a0a0a\\]\\/80, [data-theme="glass-light"] .bg-\\[\\#0a0a0a\\]\\/60, [data-theme="glass-light"] .bg-\\[\\#0a0a0a\\]\\/40, [data-theme="glass-light"] .bg-neutral-950\\/50, [data-theme="glass-light"] .retro-window, [data-theme="glass-light"] .bg-neutral-900\\/40 {
           background-color: rgba(255, 255, 255, ${glassOpacity / 100}) !important;
           backdrop-filter: blur(40px) saturate(180%) !important;
           border: 1px solid rgba(0, 0, 0, 0.18) !important;
           box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 8px 32px rgba(0, 0, 0, 0.12) !important;
        }
        [data-theme="glass-light"] .text-white,
        [data-theme="glass-light"] .text-white\\/90,
        [data-theme="glass-light"] .text-white\\/80,
        [data-theme="glass-light"] .text-white\\/75,
        [data-theme="glass-light"] .text-white\\/70,
        [data-theme="glass-light"] .text-white\\/60,
        [data-theme="glass-light"] .text-white\\/50,
        [data-theme="glass-light"] .text-white\\/40,
        [data-theme="glass-light"] .text-white\\/30,
        [data-theme="glass-light"] h1,
        [data-theme="glass-light"] h2,
        [data-theme="glass-light"] h3,
        [data-theme="glass-light"] h4,
        [data-theme="glass-light"] p,
        [data-theme="glass-light"] span,
        [data-theme="glass-light"] div,
        [data-theme="glass-light"] label,
        [data-theme="glass-light"] .text-neutral-200,
        [data-theme="glass-light"] .text-neutral-300,
        [data-theme="glass-light"] .text-neutral-400,
        [data-theme="glass-light"] .text-neutral-500,
        [data-theme="glass-light"] .text-slate-200,
        [data-theme="glass-light"] .text-slate-300,
        [data-theme="glass-light"] .text-slate-400,
        [data-theme="glass-light"] .text-slate-500,
        [data-theme="glass-light"] .text-zinc-200,
        [data-theme="glass-light"] .text-zinc-300,
        [data-theme="glass-light"] .text-zinc-400,
        [data-theme="glass-light"] .text-zinc-500,
        [data-theme="glass-light"] .text-gray-100,
        [data-theme="glass-light"] .text-gray-200,
        [data-theme="glass-light"] .text-gray-300,
        [data-theme="glass-light"] .text-gray-400,
        [data-theme="glass-light"] .text-gray-500 {
           color: #1a1a1a !important;
        }
        [data-theme="glass-light"] .text-white\\/50,
        [data-theme="glass-light"] .text-white\\/40,
        [data-theme="glass-light"] .text-white\\/30,
        [data-theme="glass-light"] .text-slate-400,
        [data-theme="glass-light"] .text-neutral-400,
        [data-theme="glass-light"] .text-zinc-400,
        [data-theme="glass-light"] .text-gray-400 {
           color: #4b5563 !important;
        }
        [data-theme="glass-light"] .text-white\\/20,
        [data-theme="glass-light"] .text-white\\/10,
        [data-theme="glass-light"] .text-slate-500,
        [data-theme="glass-light"] .text-neutral-500,
        [data-theme="glass-light"] .text-zinc-500,
        [data-theme="glass-light"] .text-gray-500 {
           color: #71717a !important;
        }
        [data-theme="glass-light"] .border-white\\/5, [data-theme="glass-light"] .border-white\\/10, [data-theme="glass-light"] .border-white\\/20 {
           border-color: rgba(0, 0, 0, 0.15) !important;
        }
        [data-theme="glass-light"] .hover\\:text-white:hover {
           color: #000000 !important;
        }
        [data-theme="glass-light"] .hover\\:bg-white\\/10:hover {
           background-color: rgba(0, 0, 0, 0.08) !important;
        }
        [data-theme="glass-light"] .overlay-bg {
           background-color: rgba(255, 255, 255, calc(var(--overlay) / 100)) !important;
        }
        [data-theme="glass-light"] .drop-shadow-md, [data-theme="glass-light"] .drop-shadow-2xl {
           filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.05)) !important;
        }
        [data-theme="glass-light"] input, [data-theme="glass-light"] textarea, [data-theme="glass-light"] select {
           background-color: rgba(0, 0, 0, 0.06) !important;
           border-color: rgba(0, 0, 0, 0.15) !important;
           color: #111111 !important;
        }
        [data-theme="glass-light"] input::placeholder, [data-theme="glass-light"] textarea::placeholder {
           color: #6b7280 !important;
        }
        [data-theme="glass-light"] .bg-neutral-900, [data-theme="glass-light"] .bg-neutral-950 {
           background-color: rgba(255, 255, 255, 0.9) !important;
        }
        [data-theme="glass-light"] .text-gray-200 {
           color: #1a1a1a !important;
        }
        [data-theme="glass-light"] .bg-white\\/5, [data-theme="glass-light"] .bg-black\\/25 {
           background-color: rgba(0, 0, 0, 0.05) !important;
           color: #111111 !important;
           border-color: rgba(0, 0, 0, 0.1) !important;
        }
        [data-theme="glass-light"] ::-webkit-scrollbar-thumb {
           background: rgba(0, 0, 0, 0.2) !important;
        }

         /* Retro 95 Theme Overrides */
         [data-theme="retro"] {
           background-color: #008080 !important;
           background-image: none !important;
         }
         [data-theme="retro"] .z-0, [data-theme="retro"] video, [data-theme="retro"] [class*="bg-cover"] {
           display: none !important;
         }
         [data-theme="retro"] .overlay-bg {
           background-color: transparent !important;
           backdrop-filter: none !important;
         }
         [data-theme="retro"] .rounded-xl, [data-theme="retro"] .rounded-2xl, [data-theme="retro"] .rounded-\\[28px\\], [data-theme="retro"] .rounded-lg, [data-theme="retro"] .rounded-full {
           border-radius: 0 !important;
         }
         [data-theme="retro"] .bg-white\\/5, [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/80, [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/60, [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/40, [data-theme="retro"] .bg-neutral-900\\/40, [data-theme="retro"] .bg-neutral-950\\/50, [data-theme="retro"] #stats-widget, [data-theme="retro"] .retro-window {
           background-color: #c0c0c0 !important;
           backdrop-filter: none !important;
           border: 2px solid !important;
           border-color: #dfdfdf #000000 #000000 #dfdfdf !important;
           box-shadow: inset 1px 1px #fff, inset -1px -1px #808080, 2px 2px 10px rgba(0,0,0,0.5) !important;
         }
         [data-theme="retro"] *:not([class*="font-clock-"]) {
           font-family: "MS Sans Serif", "Tahoma", "Geneva", sans-serif !important;
         }
         [data-theme="retro"] button.bg-\\[\\#7c3aed\\], [data-theme="retro"] button[class*="bg-brand-"], [data-theme="retro"] button[class*="bg-accent-"] {
           background-color: #c0c0c0 !important;
           border: 2px solid !important;
           border-color: #dfdfdf #000000 #000000 #dfdfdf !important;
           color: black !important;
           box-shadow: inset 1px 1px #fff, inset -1px -1px #808080 !important;
         }
         [data-theme="retro"] button.bg-\\[\\#7c3aed\\]:active, [data-theme="retro"] button:active {
           border-color: #000000 #dfdfdf #dfdfdf #000000 !important;
           box-shadow: inset 1px 1px #808080, inset -1px -1px #fff !important;
           padding-top: 2px !important;
           padding-left: 2px !important;
         }
         [data-theme="retro"] .text-white, [data-theme="retro"] .text-gray-150, [data-theme="retro"] .text-gray-200, [data-theme="retro"] .text-gray-300, [data-theme="retro"] .text-gray-400, [data-theme="retro"] .text-gray-500 {
           color: #000000 !important;
           text-shadow: none !important;
         }
         [data-theme="retro"] .text-gray-500 {
           color: #808080 !important;
         }
         [data-theme="retro"] .text-emerald-400, [data-theme="retro"] .text-emerald-500, [data-theme="retro"] .text-green-400 {
           color: #008000 !important;
         }
         [data-theme="retro"] .text-amber-400, [data-theme="retro"] .text-amber-500, [data-theme="retro"] .text-yellow-400 {
           color: #000080 !important;
         }
         [data-theme="retro"] .text-orange-400, [data-theme="retro"] .text-red-400, [data-theme="retro"] .text-rose-400 {
           color: #800000 !important;
         }
         [data-theme="retro"] .text-indigo-400, [data-theme="retro"] .text-purple-400, [data-theme="retro"] .text-pink-400 {
           color: #000080 !important;
         }
         [data-theme="retro"] input, [data-theme="retro"] textarea, [data-theme="retro"] select {
           background-color: #ffffff !important;
           border: 2px solid !important;
           border-color: #808080 #dfdfdf #dfdfdf #808080 !important;
           color: #000000 !important;
           box-shadow: inset 1px 1px #000000 !important;
         }
         /* Sunken subpanels / inner wells inside widgets */
         [data-theme="retro"] .bg-white\\/\\[0\\.03\\], [data-theme="retro"] .bg-black\\/20, [data-theme="retro"] .bg-white\\/5:not(button):not(div.flex) {
           background-color: #e2e2e2 !important;
           border: 2px solid !important;
           border-color: #808080 #dfdfdf #dfdfdf #808080 !important;
           box-shadow: inset 1px 1px #000000 !important;
           color: black !important;
         }
         /* Buttons inside tab selection blocks */
         [data-theme="retro"] .bg-white\\/5 button {
           background-color: #c0c0c0 !important;
           border: 2px solid !important;
           border-color: #dfdfdf #000000 #000000 #dfdfdf !important;
           box-shadow: inset 1px 1px #fff, inset -1px -1px #808080 !important;
           color: black !important;
           border-radius: 0 !important;
           font-weight: bold !important;
         }
         [data-theme="retro"] .bg-white\\/5 button.bg-amber-400, [data-theme="retro"] .bg-white\\/5 button[class*="bg-amber-"], [data-theme="retro"] .bg-white\\/5 button.bg-neutral-950, [data-theme="retro"] .bg-white\\/5 button[class*="text-neutral-"] {
           border-color: #000000 #dfdfdf #dfdfdf #000000 !important;
           box-shadow: inset 1px 1px #808080, inset -1px -1px #fff !important;
           background-color: #dfdfdf !important;
           background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rVrlwMTiBEkACRgwAAgwAAA7ABd9f6gDAAAAABJRU5ErkJggg==') !important;
           color: black !important;
         }
         /* Tooltips */
         [data-theme="retro"] .bg-neutral-950.border-white\\/10 {
           background-color: #ffffe1 !important;
           color: #000000 !important;
           border: 1px solid #000000 !important;
           border-radius: 0 !important;
           box-shadow: 2px 2px 0px rgba(0,0,0,0.5) !important;
         }
         [data-theme="retro"] .bg-neutral-950.border-white\\/10 * {
           color: #000000 !important;
         }
         /* Recharts SVG Elements */
         [data-theme="retro"] .recharts-cartesian-grid-horizontal line {
           stroke: #808080 !important;
           stroke-dasharray: none !important;
         }
         [data-theme="retro"] .recharts-text {
           fill: #000000 !important;
           font-family: "MS Sans Serif", sans-serif !important;
           font-size: 8px !important;
         }
         [data-theme="retro"] .recharts-reference-line line {
           stroke: #008000 !important;
           stroke-width: 2px !important;
           stroke-dasharray: 4 4 !important;
         }
         [data-theme="retro"] #glowingBarGrad stop, [data-theme="retro"] #studyProgressGrad stop {
           stop-color: #000080 !important;
           stop-opacity: 1 !important;
         }
         /* Style scrollbars to look more retro if possible */
         [data-theme="retro"] ::-webkit-scrollbar {
           width: 16px;
           height: 16px;
           background: #dfdfdf !important;
           border: none !important;
         }
         [data-theme="retro"] ::-webkit-scrollbar-track {
           background-color: #dfdfdf !important;
           background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rVrlwMTiBEkACRgwAAgwAAA7ABd9f6gDAAAAABJRU5ErkJggg==') !important;
         }
         [data-theme="retro"] ::-webkit-scrollbar-thumb {
           background-color: #c0c0c0 !important;
           border: 2px solid !important;
           border-color: #dfdfdf #000000 #000000 #dfdfdf !important;
           box-shadow: inset 1px 1px #ffffff, inset -1px -1px #808080 !important;
           border-radius: 0 !important;
         }
         [data-theme="retro"] ::-webkit-scrollbar-thumb:hover {
           background-color: #c0c0c0 !important;
         }
         [data-theme="retro"] ::-webkit-scrollbar-thumb:active {
           border-color: #000000 #dfdfdf #dfdfdf #000000 !important;
           box-shadow: inset 1px 1px #808080, inset -1px -1px #ffffff !important;
         }
         [data-theme="retro"] .bg-white\\/10 {
            background-color: #0000a8 !important;
            color: white !important;
         }
         [data-theme="retro"] .bg-white\\/10 * {
            color: white !important;
         }
         [data-theme="retro"] .border-b.border-white\\/5 {
           background-color: #0000a8 !important;
           color: white !important;
           margin: 2px 2px 8px 2px !important;
           padding: 4px 6px !important;
           border: none !important;
         }
         [data-theme="retro"] .border-b.border-white\\/5 h2, [data-theme="retro"] .border-b.border-white\\/5 svg {
           color: white !important;
         }
         [data-theme="retro"] .border-b.border-white\\/5 button {
           background-color: #c0c0c0 !important;
           border: 2px solid !important;
           border-color: #dfdfdf #000000 #000000 #dfdfdf !important;
           box-shadow: inset 1px 1px #fff, inset -1px -1px #808080 !important;
           padding: 2px !important;
           border-radius: 0 !important;
         }
         [data-theme="retro"] .border-b.border-white\\/5 button svg {
           color: black !important;
           width: 14px;
           height: 14px;
         }
         [data-theme="retro"] .border-b.border-white\\/5 button:active {
           border-color: #000000 #dfdfdf #dfdfdf #000000 !important;
           box-shadow: inset 1px 1px #808080, inset -1px -1px #fff !important;
           padding-top: 3px !important;
           padding-left: 3px !important;
         }
         [data-theme="retro"] .border-t.border-white\\/5 {
           border-top: 2px solid #808080 !important;
           box-shadow: inset 0 1px #dfdfdf !important;
         }
         
         /* Floating window headers */
         [data-theme="retro"] .retro-window {
            padding-top: 26px !important; 
         }
         [data-theme="retro"] .retro-window::before {
            content: attr(data-window-title);
            display: block;
            position: absolute;
            top: 2px;
            left: 2px;
            right: 2px;
            height: 18px;
            background: #0000a8;
            color: white;
            font-weight: bold;
            font-size: 11px;
            line-height: 18px;
            padding-left: 4px;
            font-family: "MS Sans Serif", "Tahoma", sans-serif;
            letter-spacing: 0.5px;
         }
         [data-theme="retro"] .retro-window > button.absolute {
            top: 4px !important;
            right: 4px !important;
            background-color: #c0c0c0 !important;
            border: 2px solid !important;
            border-color: #dfdfdf #000000 #000000 #dfdfdf !important;
            box-shadow: inset 1px 1px #fff, inset -1px -1px #808080 !important;
            padding: 0 !important;
            width: 14px !important;
            height: 14px !important;
            border-radius: 0 !important;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
         }
         [data-theme="retro"] .retro-window > button.absolute svg {
            color: black !important;
            width: 10px;
            height: 10px;
         }
         [data-theme="retro"] .retro-window > button.absolute:active {
            border-color: #000000 #dfdfdf #dfdfdf #000000 !important;
            box-shadow: inset 1px 1px #808080, inset -1px -1px #fff !important;
            padding-top: 1px !important;
            padding-left: 1px !important;
         }
         
         /* Fix docks */
         [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/60 {
            padding: 4px !important;
            gap: 4px !important;
         }
         [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/60 button {
            background-color: #c0c0c0 !important;
            border: 2px solid !important;
            border-color: #dfdfdf #000000 #000000 #dfdfdf !important;
            box-shadow: inset 1px 1px #fff, inset -1px -1px #808080 !important;
            border-radius: 0 !important;
         }
         [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/60 button svg {
            color: black !important;
         }
         [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/60 button:active, [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/60 button.text-white {
            border-color: #000000 #dfdfdf #dfdfdf #000000 !important;
            box-shadow: inset 1px 1px #808080, inset -1px -1px #fff !important;
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rVrlwMTiBEkACRgwAAgwAAA7ABd9f6gDAAAAABJRU5ErkJggg==') !important; /* Dither pattern for active buttons */
         }
         [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/60 button:active svg, [data-theme="retro"] .bg-\\[\\#0a0a0a\\]\\/60 button.text-white svg {
            padding-top: 1px;
            padding-left: 1px;
         }
 
         /* Central Clock retro overrides */
         [data-theme="retro"] .retro-clock-container {
            background-color: #c0c0c0 !important;
            border: 2px solid !important;
            border-color: #dfdfdf #000000 #000000 #dfdfdf !important;
            box-shadow: inset 1px 1px #fff, inset -1px -1px #808080 !important;
            pointer-events: auto; /* To let it act like a solid window */
            padding: 2px;
         }
         [data-theme="retro"] .retro-clock-header {
            display: flex !important;
            font-family: "MS Sans Serif", "Tahoma", sans-serif !important;
            letter-spacing: 0.5px;
         }
         [data-theme="retro"] .retro-clock-content {
            padding: 20px 40px !important;
         }
         [data-theme="retro"] .retro-text {
            color: #000000 !important;
            text-shadow: none !important;
            font-family: "MS Sans Serif", "Tahoma", sans-serif !important;
         }
         [data-theme="retro"] .retro-clock-time {
            color: #000000 !important;
            text-shadow: none !important;
            font-family: "MS Sans Serif", "Tahoma", sans-serif !important;
            border: 2px solid;
            border-color: #808080 #dfdfdf #dfdfdf #808080;
            background-color: #ffffff;
            box-shadow: inset 1px 1px #000000;
            padding: 0 20px;
            margin-top: 20px;
         }
      `}</style>
      {/* Background Renderer with Smooth Cross-Fade */}
      <AnimatePresence mode="popLayout">
        {bgTypeToRender === "video" && bgUrlToRender ? (
          <motion.video
            key={`video-${bgUrlToRender}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            src={bgUrlToRender || undefined}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
        ) : bgUrlToRender ? (
          <motion.div
            key={`image-${bgUrlToRender}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none z-0"
            style={{ backgroundImage: `url(${bgUrlToRender})` }}
          />
        ) : null}
      </AnimatePresence>

      {/* Visual Overlays: Blur & Darkness bounds */}
      <div
        className="absolute inset-0 transition-all duration-700 pointer-events-none overlay-bg"
        style={{
          backdropFilter: `blur(${activeProfile.blur}px)`,
          backgroundColor: currentUiStyle !== 'glass-light' ? `rgba(10, 10, 10, ${activeProfile.overlay / 100})` : undefined
        }}
      />

      {!isMinimalMode ? (
        <>
          {/* Backdrop for Workspace Studio sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 pointer-events-auto"
              />
            )}
          </AnimatePresence>

          {/* --- SIDEBAR PANEL (Collapsible Controls) --- */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[600px] bg-[#0a0a0a]/80 backdrop-blur-3xl border-l border-white/5 z-40 transform transition-transform duration-500 flex flex-col justify-between ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#7c3aed]/20 flex items-center justify-center">
                <Sliders className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <h2 className="font-sans font-bold text-lg text-white tracking-tight">Workspace Studio</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Settings Customizations */}
          <div className="space-y-4 pt-2">
            <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-widest">
              Profile Customization
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-sans">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 text-[13px] rounded-xl px-4 py-2.5 text-white focus:border-[#7c3aed] focus:bg-white/10 focus:outline-none font-sans transition-all placeholder:text-gray-600"
                  placeholder="Enter your name"
                />
              </div>


            </div>
          </div>

          {/* Interface Style & Accent Color */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-widest">
              Interface Styling
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-sans">
                  UI Vibe / Architecture
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {UI_STYLES.map((style) => {
                    const isSelected = activeProfile.uiStyle === style.id || (!activeProfile.uiStyle && style.id === "glass");
                    return (
                      <button
                        key={style.id}
                        onClick={() => updateProfileField("uiStyle", style.id)}
                        className={`px-3 py-2.5 rounded-xl text-[12px] font-sans font-medium text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20"
                            : "bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {style.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-sans">
                  Workspace Accent Color
                </label>
                <div className="flex gap-2">
                  {ACCENT_COLORS.map((color) => {
                    const isSelected = activeProfile.accentColor === color.id || (!activeProfile.accentColor && color.id === "purple");
                    return (
                      <button
                        key={color.id}
                        onClick={() => updateProfileField("accentColor", color.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border-2 ${
                          isSelected ? "border-white scale-110 shadow-lg shadow-white/20" : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-sans">
                  <span>Workspace Overlay Darkness</span>
                  <span className="font-mono text-gray-400">{activeProfile.overlay}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={activeProfile.overlay}
                  onChange={(e) => updateProfileField("overlay", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>
            </div>
          </div>

          {/* Text Sizing Scale segment */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-widest">
              Application Text Sizing
            </h3>
            <div className="space-y-2">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-sans font-semibold">
                Adjust General Text Size
              </label>
              <div className="grid grid-cols-5 gap-1.5">
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
                      className={`py-2 rounded-xl text-[10px] font-sans font-bold text-center transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#7c3aed] border-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20"
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

          {/* Clock Style & Typography Customizations */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-widest">
              Clock Typography Style
            </h3>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-sans">
                  <span>Clock Font Size</span>
                  <span className="font-mono text-gray-400">{clockSize}px</span>
                </div>
                <input
                  type="range"
                  min="64"
                  max="160"
                  value={clockSize}
                  onChange={(e) => setClockSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>

              {/* Interactive Clock Parameter Toggles */}
              <div className="space-y-2 py-2 border-t border-b border-white/5">
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-sans font-semibold mb-1">
                  Clock Elements & Features
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowSeconds(!showSeconds)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-sans font-bold transition-all border cursor-pointer ${
                      showSeconds
                        ? "bg-[#7c3aed]/20 border-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/5"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full transition-all ${showSeconds ? "bg-[#7c3aed] scale-110" : "bg-gray-600"}`} />
                    <span>Seconds Counter</span>
                  </button>

                  <button
                    onClick={() => setShowGreeting(!showGreeting)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-sans font-bold transition-all border cursor-pointer ${
                      showGreeting
                        ? "bg-[#7c3aed]/20 border-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/5"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full transition-all ${showGreeting ? "bg-[#7c3aed] scale-110" : "bg-gray-600"}`} />
                    <span>User Greeting</span>
                  </button>

                  <button
                    onClick={() => setShowDate(!showDate)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-sans font-bold transition-all border cursor-pointer ${
                      showDate
                        ? "bg-[#7c3aed]/20 border-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/5"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full transition-all ${showDate ? "bg-[#7c3aed] scale-110" : "bg-gray-600"}`} />
                    <span>Day & Date Display</span>
                  </button>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-sans font-bold transition-all border border-white/5 bg-white/5 text-gray-400">
                    <label htmlFor="clockColorPicker" className="flex items-center gap-2 cursor-pointer w-full justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-white/20 shrink-0" 
                          style={{ backgroundColor: clockColor === "accent" ? "#7c3aed" : clockColor === "gray" ? "#9ca3af" : clockColor === "white" ? "#ffffff" : clockColor }} 
                        />
                        <span>Custom Color</span>
                      </div>
                      <input
                        id="clockColorPicker"
                        type="color"
                        value={clockColor.startsWith("#") ? clockColor : "#ffffff"}
                        onChange={(e) => setClockColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-none outline-none appearance-none p-0"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-sans font-semibold">
                  Select Font Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto p-2 border border-white/10 bg-black/40 rounded-2xl custom-scrollbar">
                  {clockFonts.map((font) => {
                    const isSelected = clockFontClass === font.class;
                    return (
                      <button
                        key={font.class}
                        onClick={() => setClockFontClass(font.class)}
                        className={`flex flex-col items-stretch justify-between p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#7c3aed] border-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25 scale-[1.02]"
                            : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-sans truncate mb-2 block">
                          {font.name}
                        </span>
                        <span className={`${font.class} text-[26px] tracking-tight font-bold leading-none select-none text-right w-full block ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                          12:35
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>




          <div className="space-y-3 pt-4 border-t border-white/5">
            <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-widest">
              Active Widgets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(activeProfile.widgets) as Array<keyof WidgetLayout>).map((widgetKey) => {
                const isEnabled = activeProfile.widgets[widgetKey];
                return (
                  <button
                    key={widgetKey}
                    onClick={() => toggleWidget(widgetKey)}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-[12px] font-sans font-bold capitalize text-left transition-all cursor-pointer ${
                      isEnabled
                        ? "bg-[#7c3aed] border-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {isEnabled ? <Eye className="w-4 h-4 shrink-0" /> : <EyeOff className="w-4 h-4 shrink-0" />}
                    <span>{widgetKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backdrop Blur & overlay Darkness controls */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-widest">
              Visual Focus bounds
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-sans">
                  <span>Background Blur</span>
                  <span className="font-mono text-gray-400">{activeProfile.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={activeProfile.blur}
                  onChange={(e) => updateProfileField("blur", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>



              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-sans">
                  <span>Daily Study Target Goal</span>
                  <span className="font-mono text-gray-400">{dailyGoalMinutes}m</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="15"
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>
            </div>
          </div>

          {/* Curated Background Preset Gallery */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-widest">
              Stock Environments
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {presetBgs.map((preset) => {
                const isActive = activeProfile.bgUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    onClick={() => updateProfileField("bgUrl", preset.url)}
                    className={`h-14 rounded-lg overflow-hidden relative border transition-all cursor-pointer ${
                      isActive ? "border-[#7c3aed] shadow-lg shadow-[#7c3aed]/20 scale-[0.98]" : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={resolveAssetPath(preset.url)}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                      <span className="text-[8px] text-white font-sans font-medium truncate w-full">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Background Upload Zone (Images/GIFs/Videos) */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h3 className="font-sans font-semibold text-xs text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#7c3aed]" />
              Custom Local Background
            </h3>
            <p className="text-[10px] text-gray-500 font-sans">
              Drag & drop or select an image, animated GIF, or video file to set as your offline study backdrop.
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("bg-file-input")?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                isDraggingBgFile
                  ? "border-[#7c3aed] bg-[#7c3aed]/10 scale-[0.99]"
                  : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              }`}
            >
              <input
                id="bg-file-input"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    await handleBgFileSelect(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-white" />
              <div className="text-[11px] font-medium text-gray-300">
                {isDraggingBgFile ? "Drop file here!" : "Click to upload or drag & drop"}
              </div>
              <div className="text-[9px] text-gray-500 font-sans">
                Supports JPG, PNG, GIF, MP4, WebM (Max 50MB)
              </div>
            </div>

            {/* Active local background preview/clear block */}
            {localBgUrl && (
              <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {localBgType === "video" ? (
                      <Video className="w-4 h-4 text-gray-400" />
                    ) : (
                      <img
                        src={localBgUrl || undefined}
                        alt="Local thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-sans font-medium text-gray-200 truncate">
                      Custom Local Upload
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                      {localBgType === "video" ? (
                        <span className="flex items-center gap-0.5 text-blue-400">
                          <Video className="w-2.5 h-2.5" /> Video Format
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <ImageIcon className="w-2.5 h-2.5" /> Image/GIF Format
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateProfileField("bgUrl", "custom_local")}
                    className={`px-2 py-1 text-[10px] font-medium font-sans rounded-lg transition-colors cursor-pointer ${
                      activeProfile.bgUrl === "custom_local"
                        ? "bg-[#7c3aed] text-white"
                        : "bg-white/5 hover:bg-white/10 text-gray-300"
                    }`}
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleRemoveLocalBg}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                    title="Delete custom local background"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Data Storage & Transfer Hub */}
          <div className="pt-5 border-t border-white/5">
            <DataHubWidget
              username={username}
              clockFontClass={clockFontClass}
              clockSize={clockSize}
              customAccentColor={customAccentColor}
              glassOpacity={glassOpacity}
              windowRoundness={windowRoundness}
              showSeconds={showSeconds}
              showGreeting={showGreeting}
              showDate={showDate}
              clockColor={clockColor}
              textSize={textSize}
              profiles={profiles}
              currentProfileName={currentProfileName}
              tasks={tasks}
              calendarEvents={calendarEvents}
              focusHistory={focusHistory}
              onImportAll={handleImportAllData}
              onResetAll={handleResetAllData}
            />
          </div>


        </div>

        {/* Sidebar Info card */}
        <div className="p-5 bg-white/[0.02] border-t border-white/5 text-[11px] text-gray-500 font-sans leading-relaxed">
          <p className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#7c3aed]" />
            <span>Customize widgets, themes, and study loads dynamically.</span>
          </p>
        </div>
      </div>

      {/* --- FLOATING ATMOSPHERE GLOWS --- */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[150px]"></div>
        <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]"></div>
      </div>

      {/* --- MAIN HEADER BAR --- */}
      <header className="w-full z-30 px-4 lg:px-8 py-4 lg:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-transparent relative select-none">
        {/* Top-Left Branding */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start gap-1">
            <span className="font-sans font-black text-3xl tracking-tighter text-white leading-none">MeowLOCK</span>
            <span className="font-clock-sacramento text-lg text-white/70 leading-none mt-1 select-none cursor-default capitalize">
              To My Dear Star
            </span>
          </div>
        </div>

        {/* Top-Right Background Info */}
        {nasaBgUrl && nasaBgTitle && (
          <div className="group relative flex flex-col items-end gap-1 text-right pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-1000 z-50">
            <div className="flex flex-col items-end cursor-default bg-black/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5 hover:bg-black/40 transition-colors">
               <span className="text-xs font-bold text-white drop-shadow-md">
                 {nasaBgTitle}
               </span>
               <span className="text-[10px] text-amber-400 font-medium tracking-wide drop-shadow-md flex items-center gap-1.5 mt-0.5">
                 <Telescope className="w-3 h-3" />
                 NASA Astronomy Picture
               </span>
            </div>
            {nasaBgExplanation && (
              <div className="absolute top-full pt-2 right-0 w-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto z-50">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                  <p className="text-[11px] text-gray-300 leading-relaxed text-justify pr-1">
                    {nasaBgExplanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* --- MAIN DASHBOARD AREA --- */}
      <main className="flex-1 relative z-10 flex flex-col lg:flex-row w-full h-full lg:overflow-hidden overflow-y-auto p-4 lg:p-6 gap-6">
        {/* Mobile Backdrop Overlay */}
        <AnimatePresence>
          {isMobile && (isTodoOpen || isNotesOpen || isCalendarOpen || isSpaceExplorerOpen || isMixerOpen || isMusicOpen || isRadioOpen || isStatsOpen || isStreakOpen || isWellnessOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (isTodoOpen) toggleWidget("todo");
                if (isNotesOpen) toggleWidget("notes");
                if (isCalendarOpen) setIsCalendarOpen(false);
                if (isSpaceExplorerOpen) setIsSpaceExplorerOpen(false);
                if (isMixerOpen) toggleWidget("mixer");
                if (isMusicOpen) toggleWidget("music");
                if (isRadioOpen) setIsRadioOpen(false);
                if (isStatsOpen) toggleWidget("stats");
                if (isStreakOpen) setIsStreakOpen(false);
                if (isWellnessOpen) toggleWidget("wellness");
              }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-pointer pointer-events-auto"
            />
          )}
        </AnimatePresence>

        {/* --- LEFT SIDE FLOATING STACK --- */}
        <div className={isMobile ? "w-full z-50 flex flex-col gap-4 pointer-events-auto pb-4" : "fixed left-6 top-24 bottom-28 w-80 md:w-96 z-20 flex flex-col gap-4 pointer-events-none overflow-visible pb-4"}>
          <AnimatePresence mode="popLayout">
            {/* 1. Tasks Checklist Panel */}
            {isTodoOpen && (
              <motion.div
                key="todo-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title="Tasks.exe"
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col retro-window" : "pointer-events-auto relative bg-neutral-950/50 retro-window backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col"}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: 'both',
                  overflow: 'auto',
                  width: '420px',
                  height: '520px',
                  minWidth: '320px',
                  minHeight: '300px',
                  borderRadius: `${windowRoundness}px`
                }}
                initial={{ opacity: 0, scale: 0.95, x: -40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: -40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                <button
                  onClick={() => toggleWidget("todo")}
                  className={isMobile ? "absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : "absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10"}
                >
                  <X className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                </button>
                <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                  <TodoListWidget
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    onResetTasks={handleResetTasks}
                    activeTaskId={activeTaskId}
                    onSetActiveTaskId={setActiveTaskId}
                    onUpdateTask={handleUpdateTask}
                    onReorderTasks={setTasks}
                    onAddCalendarEvent={(title, tag) => {
                      const d = new Date();
                      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      const newEv = {
                        id: "event-" + Math.random().toString(36).substring(2, 9),
                        dateStr,
                        title,
                        category: "focus" as const,
                        notes: `Created from Focus Checklist [Tag: ${tag}]`
                      };
                      setCalendarEvents(prev => [...prev, newEv]);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {/* 2. Scratch Notes Panel */}
            {isNotesOpen && (
              <motion.div
                key="notes-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title={notesViewMode === "mini" ? "Sticky_Note.exe" : (notesViewMode === "alt" ? "Vintage_Journal.dat" : (notesViewMode === "alt_mini" ? "Compact_Journal.dat" : "Notepad.exe"))}
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col retro-window transition-all duration-300" : (notesViewMode === "alt" || notesViewMode === "alt_mini" ? "pointer-events-auto relative flex flex-col p-0 transition-all duration-300" : `pointer-events-auto relative bg-neutral-950/50 retro-window backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col transition-all duration-300 ${
                  isNotesMini ? "p-2" : "p-5"
                }`)}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: (notesViewMode === "alt" || notesViewMode === "alt_mini") ? 'none' : 'both',
                  overflow: 'auto',
                  width: notesViewMode === "mini" ? '250px' : (notesViewMode === "alt" ? '820px' : (notesViewMode === "alt_mini" ? '460px' : '440px')),
                  height: notesViewMode === "mini" ? '190px' : (notesViewMode === "alt" ? '550px' : (notesViewMode === "alt_mini" ? '355px' : '480px')),
                  minWidth: notesViewMode === "mini" ? '180px' : (notesViewMode === "alt" ? '820px' : (notesViewMode === "alt_mini" ? '460px' : '280px')),
                  minHeight: notesViewMode === "mini" ? '120px' : (notesViewMode === "alt" ? '550px' : (notesViewMode === "alt_mini" ? '355px' : '240px')),
                  borderRadius: (notesViewMode === "alt" || notesViewMode === "alt_mini") ? "0px" : `${windowRoundness}px`,
                  transitionProperty: 'width, height, min-width, min-height, padding, background-color, border-color, color, fill, stroke, opacity, box-shadow',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDuration: '300ms'
                }}
                initial={{ opacity: 0, scale: 0.95, x: -40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: -40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                {(notesViewMode === "normal" || isMobile) && (
                  <button
                    onClick={() => toggleWidget("notes")}
                    className={isMobile ? "absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : "absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10"}
                  >
                    <X className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                  </button>
                )}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <NotesWidget
                    noteContent={noteContent}
                    onChange={setNoteContent}
                    isMiniMode={isNotesMini}
                    setIsMiniMode={setIsNotesMini}
                    viewMode={notesViewMode}
                    setViewMode={setNotesViewMode}
                    onClose={() => toggleWidget("notes")}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {/* 5. Calendar & Planner Panel */}
            {isCalendarOpen && (
              <motion.div
                key="calendar-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title="Calendar_Planner.exe"
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col retro-window" : "pointer-events-auto relative bg-[#0a0a0a]/50 retro-window backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col"}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: 'both',
                  overflow: 'auto',
                  width: '440px',
                  height: '520px',
                  minWidth: '350px',
                  minHeight: '400px',
                  borderRadius: `${windowRoundness}px`,
                  transitionProperty: 'height, min-height, padding, background-color, border-color, color, fill, stroke, opacity, box-shadow',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDuration: '300ms'
                }}
                initial={{ opacity: 0, scale: 0.95, x: -40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: -40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={isMobile ? "absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : "absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10"}
                >
                  <X className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                </button>
                <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                  <CalendarWidget 
                    onClose={() => setIsCalendarOpen(false)} 
                    events={calendarEvents}
                    onAddEvent={(ev) => setCalendarEvents(prev => [...prev, ev])}
                    onDeleteEvent={(id) => setCalendarEvents(prev => prev.filter(e => e.id !== id))}
                    onDeleteAllEvents={() => setCalendarEvents([])}
                  />
                </div>
              </motion.div>
            )}

            {/* 5.1 Space Explorer Panel */}
            {isSpaceExplorerOpen && (
              <motion.div
                key="space-explorer-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title="Space_Explorer.exe"
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col retro-window" : "pointer-events-auto relative bg-[#0a0a0a]/50 retro-window backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col"}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: 'both',
                  overflow: 'auto',
                  width: '920px',
                  height: '760px',
                  minWidth: '500px',
                  minHeight: '550px',
                  borderRadius: `${windowRoundness}px`,
                  transitionProperty: 'height, min-height, padding, background-color, border-color, color, fill, stroke, opacity, box-shadow',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDuration: '300ms'
                }}
                initial={{ opacity: 0, scale: 0.95, x: -40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: -40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                <button
                  onClick={() => setIsSpaceExplorerOpen(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={isMobile ? "absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : "hidden"}
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                  <SpaceExplorer
                    onClose={() => setIsSpaceExplorerOpen(false)}
                    onSetBackground={(url, type, title, explanation) => {
                      setNasaBgUrl(url);
                      setNasaBgType(type);
                      setNasaBgTitle(title || "");
                      setNasaBgExplanation(explanation || "");
                      localStorage.setItem("zen_space_bg_url", url);
                      localStorage.setItem("zen_space_bg_type", type);
                      if (title) localStorage.setItem("zen_space_bg_title", title);
                      if (explanation) localStorage.setItem("zen_space_bg_explanation", explanation);
                    }}
                    onClearBackground={() => {
                      setNasaBgUrl("");
                      setNasaBgTitle("");
                      setNasaBgExplanation("");
                      localStorage.removeItem("zen_space_bg_url");
                      localStorage.removeItem("zen_space_bg_type");
                      localStorage.removeItem("zen_space_bg_title");
                      localStorage.removeItem("zen_space_bg_explanation");
                    }}
                    currentBgUrl={nasaBgUrl}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- CENTRAL IMMERSIVE TIMER AREA --- */}
        {!isMinimalMode && (
          <div className="flex-1 flex flex-col items-center justify-center h-full select-none pb-20 gap-8">
            <CentralClock
              username={username}
              clockFontClass={clockFontClass}
              clockSize={clockSize}
              showSeconds={showSeconds}
              showGreeting={showGreeting}
              showDate={showDate}
              clockColor={clockColor}
              modeName={activeProfile.name}
              isMobile={isMobile}
            />

            {/* Quick clock toggles row */}
            {isSidebarOpen && (
              <div className="flex items-center gap-3 bg-[#0a0a0a]/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5 opacity-50 hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                <button 
                  onClick={() => setShowGreeting(!showGreeting)}
                  className={`text-[10px] font-sans font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${showGreeting ? "text-[#7c3aed] bg-[#7c3aed]/10" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                >
                  Greeting: {showGreeting ? "ON" : "OFF"}
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button 
                  onClick={() => setShowDate(!showDate)}
                  className={`text-[10px] font-sans font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${showDate ? "text-[#7c3aed] bg-[#7c3aed]/10" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                >
                  Focus Tip: {showDate ? "ON" : "OFF"}
                </button>
              </div>
            )}
            {activeTask && !activeTask.completed && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
                className="bg-[#0a0a0a]/60 backdrop-blur-md border border-amber-400/30 hover:border-amber-400/50 shadow-lg px-6 py-3.5 rounded-2xl flex items-center gap-4 max-w-xl transition-all select-none pointer-events-auto relative"
                style={{ borderRadius: `${windowRoundness}px` }}
              >
                {/* Visual pulse indicator */}
                <div className="relative flex shrink-0">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-amber-400 font-sans uppercase font-bold tracking-widest flex items-center gap-1">
                    🎯 Current Focus
                  </span>
                  <span className="text-sm font-sans font-semibold text-gray-100 truncate mt-0.5 leading-tight">
                    {activeTask.title}
                  </span>
                  
                  {/* Progress info */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 font-mono">
                      Sessions: {activeTask.actualSessions} / {activeTask.estimateSessions}
                    </span>
                    <span className="text-[10px] text-gray-500">•</span>
                    <span className="text-[10px] text-gray-400 uppercase">
                      {activeTask.tag || "TASK"}
                    </span>
                  </div>
                </div>

                {/* Direct action to complete task from home screen */}
                <button
                  onClick={() => handleToggleTask(activeTask.id)}
                  className="ml-4 w-8 h-8 rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
                  title="Mark Task Completed"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Absolute floating Timer Widget */}
        {activeProfile.widgets.timer !== false && (
          <TimerWidget
            settings={activeProfile.timerSettings}
            onSettingsChange={(settings) => updateProfileField("timerSettings", settings)}
            onSessionComplete={handleSessionComplete}
            activeProfileName={activeProfile.name}
            isMinimalMode={isMinimalMode}
            onExitMinimalMode={() => setIsMinimalMode(false)}
            isImmersiveCenter={false}
            clockFontClass={clockFontClass}
            clockSize={clockSize}
            onClockSizeChange={setClockSize}
            clockColor={clockColor}
            onClockColorChange={setClockColor}
            username={username}
            windowRoundness={windowRoundness}
            onClose={() => toggleWidget("timer")}
            activeTask={activeTask}
            isMobile={isMobile}
            activeProfile={activeProfile}
          />
        )}

        <AnimatePresence>
          {isWeatherOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-sm">
              <WeatherWidget
                isExpanded={isWeatherExpanded}
                onToggleExpand={() => setIsWeatherExpanded(!isWeatherExpanded)}
                onClose={() => setIsWeatherOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>

        <WellnessWidget 
          isOpen={isWellnessOpen}
          onClose={() => toggleWidget("wellness")}
          settings={activeProfile.wellnessSettings}
          onSettingsChange={(settings) => updateProfileField("wellnessSettings", settings)}
          isMobile={isMobile}
        />
        

        {/* --- RIGHT SIDE FLOATING STACK --- */}
        <div className={isMobile ? "w-full z-50 flex flex-col gap-4 pointer-events-auto pb-4" : "fixed right-6 top-24 bottom-28 w-80 md:w-96 z-20 flex flex-col gap-4 pointer-events-none overflow-visible pb-4"}>
          <AnimatePresence mode="popLayout">
            {/* 1. Ambient sound procedural Mixer */}
            {isMixerOpen && (
              <motion.div
                key="mixer-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title="SoundMixer.exe"
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col retro-window" : "pointer-events-auto relative bg-neutral-950/50 retro-window backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col"}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: 'both',
                  overflow: 'auto',
                  width: '360px',
                  height: '320px',
                  minWidth: '280px',
                  minHeight: '180px',
                  borderRadius: `${windowRoundness}px`
                }}
                initial={{ opacity: 0, scale: 0.95, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: 40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                <button
                  onClick={() => toggleWidget("mixer")}
                  className={isMobile ? "absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : "absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10"}
                >
                  <X className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                </button>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <AmbientMixer
                    volumes={activeProfile.soundVolumes}
                    onChange={(volumes) => updateProfileField("soundVolumes", volumes)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {/* 2. Audio Player integration (YouTube/Spotify) */}
            {isMusicOpen && (
              <motion.div
                key="music-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title={musicViewMode === "mini" ? "Music_Mini.exe" : (musicViewMode === "alt" ? "iPod_Classic.exe" : (musicViewMode === "alt_mini" ? "iPod_Nano.exe" : "Music_Player.exe"))}
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col retro-window transition-all duration-300" : `pointer-events-auto relative bg-neutral-950/50 retro-window backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col transition-all duration-300 ${
                  musicViewMode === "mini" ? "p-2" : (musicViewMode === "alt" ? "p-3" : (musicViewMode === "alt_mini" ? "p-2" : "p-5"))
                }`}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: (musicViewMode === "alt" || musicViewMode === "alt_mini") ? 'none' : 'both',
                  overflow: 'auto',
                  width: musicViewMode === "mini" ? '520px' : (musicViewMode === "alt" ? '360px' : (musicViewMode === "alt_mini" ? '460px' : '520px')),
                  height: musicViewMode === "mini" ? '112px' : (musicViewMode === "alt" ? '610px' : (musicViewMode === "alt_mini" ? '255px' : '740px')),
                  minWidth: musicViewMode === "mini" ? '380px' : (musicViewMode === "alt" ? '360px' : (musicViewMode === "alt_mini" ? '460px' : '380px')),
                  minHeight: musicViewMode === "mini" ? '90px' : (musicViewMode === "alt" ? '610px' : (musicViewMode === "alt_mini" ? '255px' : '580px')),
                  borderRadius: `${windowRoundness}px`,
                  transitionProperty: 'width, height, min-width, min-height, padding, background-color, border-color, color, fill, stroke, opacity, box-shadow',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDuration: '300ms'
                }}
                initial={{ opacity: 0, scale: 0.95, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: 40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                <button
                  onClick={() => toggleWidget("music")}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={isMobile ? "absolute right-4 top-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : `absolute right-4 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10 ${
                    musicViewMode === "mini" ? "top-2.5" : (musicViewMode === "alt" ? "top-2.5" : (musicViewMode === "alt_mini" ? "top-2.5" : "top-4"))
                  }`}
                >
                  <X className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                </button>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <MusicWidget
                    isMiniMode={isMusicMini}
                    setIsMiniMode={setIsMusicMini}
                    viewMode={musicViewMode}
                    setViewMode={setMusicViewMode}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {/* 2.5 Underground Late-Night Radio integration */}
            {isRadioOpen && (
              <motion.div
                key="radio-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title={isRadioMini ? undefined : "Radio_Underground.exe"}
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col retro-window transition-all duration-300" : `pointer-events-auto relative bg-neutral-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col transition-all duration-300 ${
                  isRadioMini ? "p-2.5" : "retro-window p-5"
                }`}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: isRadioMini ? 'none' : 'both',
                  overflow: 'hidden',
                  width: isRadioMini ? '240px' : '640px',
                  height: isRadioMini ? '210px' : '520px',
                  minWidth: isRadioMini ? '240px' : '380px',
                  minHeight: isRadioMini ? '210px' : '400px',
                  borderRadius: `${windowRoundness}px`
                }}
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                {(!isRadioMini || isMobile) && (
                  <button
                    onClick={() => setIsRadioOpen(false)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={isMobile ? "absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : "absolute right-4 top-4 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10"}
                  >
                    <X className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                  </button>
                )}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <RadioWidget
                    onClose={() => setIsRadioOpen(false)}
                    currentStation={currentRadioStation}
                    onSelectStation={setCurrentRadioStation}
                    isPlaying={isRadioPlaying}
                    onSetIsPlaying={setIsRadioPlaying}
                    volume={radioVolume}
                    onSetVolume={setRadioVolume}
                    activeMood={radioMood}
                    onSetActiveMood={setRadioMood}
                    isMiniMode={isRadioMini}
                    setIsMiniMode={setIsRadioMini}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {/* 3. Study Session History & analytics */}
            {isStatsOpen && (
              <motion.div
                key="stats-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title="Statistics.exe"
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col retro-window" : "pointer-events-auto relative bg-neutral-950/50 retro-window backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col"}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: 'both',
                  overflow: 'auto',
                  width: '360px',
                  height: '350px',
                  minWidth: '280px',
                  minHeight: '180px',
                  borderRadius: `${windowRoundness}px`
                }}
                initial={{ opacity: 0, scale: 0.95, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: 40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                <button
                  onClick={() => toggleWidget("stats")}
                  className={isMobile ? "absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : "absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10"}
                >
                  <X className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                </button>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <StatsWidget sessions={focusHistory} dailyGoalMinutes={dailyGoalMinutes} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {/* 4. Study Streak & Star system */}
            {isStreakOpen && (
              <motion.div
                key="streak-widget"
                drag={isMobile ? false : true}
                dragMomentum={true}
                dragElastic={0.1}
                dragTransition={{ power: 0.03, timeConstant: 1200 }}
                data-window-title={isStreakMini ? "StarStreakPin" : "StellarStreak.exe"}
                className={isMobile ? "pointer-events-auto fixed inset-x-4 bottom-24 top-20 z-50 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl flex flex-col justify-center items-center retro-window" : `pointer-events-auto relative bg-neutral-950/60 retro-window backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col justify-center items-center ${
                  isStreakMini ? "p-1 overflow-hidden" : "p-5"
                }`}
                style={isMobile ? {
                  borderRadius: `${windowRoundness}px`
                } : {
                  resize: isStreakMini ? 'none' : 'both',
                  overflow: isStreakMini ? 'hidden' : 'auto',
                  width: isStreakMini ? '110px' : '360px',
                  height: isStreakMini ? '110px' : '425px',
                  minWidth: isStreakMini ? '110px' : '320px',
                  minHeight: isStreakMini ? '110px' : '350px',
                  borderRadius: isStreakMini ? '9999px' : `${windowRoundness}px`
                }}
                initial={{ opacity: 0, scale: 0.95, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: 40, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ opacity: { duration: 0.2 }, scale: { type: "spring", damping: 22, stiffness: 150 } }}
              >
                {(!isStreakMini || isMobile) && (
                  <button
                    onClick={() => setIsStreakOpen(false)}
                    className={isMobile ? "absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl cursor-pointer z-10 shadow-lg" : "absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer z-10"}
                  >
                    <X className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                  </button>
                )}
                <div className={`no-scrollbar ${isStreakMini ? "w-full h-full flex items-center justify-center" : "flex-1 w-full overflow-y-auto"}`}>
                  <StreakWidget
                    sessions={focusHistory}
                    onAddSession={(newSession) => {
                      setFocusHistory((prev) => [newSession, ...prev]);
                    }}
                    onClose={() => setIsStreakOpen(false)}
                    isMiniMode={isStreakMini}
                    setIsMiniMode={setIsStreakMini}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>
      {/* --- FLOATING DOCK CONTROLS --- */}
      {!isMobile ? (
        <>
          {/* --- LEFT FLOATING DOCK --- */}
          <motion.div
            drag={true}
            dragMomentum={true}
            dragElastic={0.1}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-6 z-30 flex items-center gap-1.5 select-none bg-[#0a0a0a]/60 backdrop-blur-md rounded-xl p-1.5 border border-white/5 cursor-move"
          >
            <div className="px-1 text-gray-500 hover:text-white transition-colors cursor-move">
              <GripVertical className="w-4 h-4" />
            </div>
            <button
              onClick={() => toggleWidget("todo")}
              className={`p-2 rounded-lg transition-all relative cursor-pointer hover:bg-white/10 ${
                isTodoOpen ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Daily Focus Checklist"
            >
              <ListTodo className="w-4 h-4" />
              {tasks.filter((t) => !t.completed).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => toggleWidget("music")}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isMusicOpen ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Audio Player"
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsRadioOpen(!isRadioOpen)}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isRadioOpen ? "text-emerald-400" : "text-gray-400 hover:text-white"
              }`}
              title="Underground Late-Night Radio"
            >
              <Radio className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleWidget("notes")}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isNotesOpen ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Scratchpad Notes Editor"
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isCalendarOpen ? "text-amber-400" : "text-gray-400 hover:text-white"
              }`}
              title="Dual Calendar & Study Planner"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSpaceExplorerOpen(!isSpaceExplorerOpen)}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isSpaceExplorerOpen ? "text-amber-400" : "text-gray-400 hover:text-white"
              }`}
              title="NASA Space Explorer"
            >
              <Telescope className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsWellnessOpen(!isWellnessOpen)}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isWellnessOpen ? "text-rose-400" : "text-gray-400 hover:text-white"
              }`}
              title="Wellness & Habits"
            >
              <HeartPulse className="w-4 h-4" />
            </button>
            <button onClick={() => setIsWeatherOpen(!isWeatherOpen)} className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${isWeatherOpen ? "text-sky-400" : "text-gray-400 hover:text-white"}`} title="Weather"><CloudSun className="w-4 h-4" /></button>
          </motion.div>

          {/* --- RIGHT FLOATING DOCK --- */}
          <motion.div
            drag={true}
            dragMomentum={true}
            dragElastic={0.1}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-1.5 select-none bg-[#0a0a0a]/60 backdrop-blur-md rounded-xl p-1.5 border border-white/5 cursor-move"
          >
            <div className="px-1 text-gray-500 hover:text-white transition-colors cursor-move">
              <GripVertical className="w-4 h-4" />
            </div>
            <button
              onClick={() => toggleWidget("timer")}
              className={`p-2 rounded-lg transition-all relative cursor-pointer hover:bg-white/10 ${
                activeProfile.widgets.timer !== false ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Focus Timer"
            >
              <Timer className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleWidget("mixer")}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isMixerOpen ? "bg-[#7c3aed] text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Layer Ambient Noise"
            >
              <Leaf className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 text-gray-400 hover:text-white"
              title="Home"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsStreakOpen(!isStreakOpen)}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isStreakOpen ? "text-amber-400" : "text-gray-400 hover:text-amber-400"
              }`}
              title="Stellar Study Streak"
            >
              <Star className={`w-4 h-4 ${isStreakOpen ? "fill-amber-400/20" : ""}`} />
            </button>
            <button
              onClick={() => toggleWidget("stats")}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isStatsOpen ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Daily Focus Analytics"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
            <button
              onClick={toggleCatActive}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white/10 ${
                isCatActive ? "text-amber-400" : "text-gray-400 hover:text-white"
              }`}
              title="Virtual Cat Companion (Zeytoon)"
            >
              <Cat className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Workspace Studio Config"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMinimalMode(true)}
              className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer ml-1"
              title="Enter Fullscreen Zen Mode"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </motion.div>
        </>
      ) : (
        /* --- UNIFIED MOBILE DOCK --- */
        <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
          {/* Left scroll indicator gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a]/95 to-transparent pointer-events-none z-10 rounded-l-xl" />
          {/* Right scroll indicator gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a]/95 to-transparent pointer-events-none z-10 rounded-r-xl" />



          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex items-center gap-1.5 select-none bg-[#0a0a0a]/90 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto no-scrollbar scroll-smooth pointer-events-auto"
          >
          {/* 1. Todo */}
          <button
            onClick={() => toggleWidget("todo")}
            className={`p-3 rounded-lg transition-all relative shrink-0 cursor-pointer ${
              isTodoOpen ? "text-white bg-white/10" : "text-gray-400"
            }`}
            title="Daily Focus Checklist"
          >
            <ListTodo className="w-5 h-5" />
            {tasks.filter((t) => !t.completed).length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {/* 2. Timer */}
          <button
            onClick={() => toggleWidget("timer")}
            className={`p-3 rounded-lg transition-all relative shrink-0 cursor-pointer ${
              activeProfile.widgets.timer !== false ? "text-white bg-white/10" : "text-gray-400"
            }`}
            title="Focus Timer"
          >
            <Timer className="w-5 h-5" />
          </button>

          {/* 3. Music */}
          <button
            onClick={() => toggleWidget("music")}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isMusicOpen ? "text-white bg-white/10" : "text-gray-400"
            }`}
            title="Audio Player"
          >
            <Music className="w-5 h-5" />
          </button>

          {/* 4. Mixer */}
          <button
            onClick={() => toggleWidget("mixer")}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isMixerOpen ? "text-white bg-white/10" : "text-gray-400"
            }`}
            title="Layer Ambient Noise"
          >
            <Leaf className="w-5 h-5" />
          </button>

          {/* 5. Radio */}
          <button
            onClick={() => setIsRadioOpen(!isRadioOpen)}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isRadioOpen ? "text-emerald-400 bg-white/10" : "text-gray-400"
            }`}
            title="Underground Radio"
          >
            <Radio className="w-5 h-5" />
          </button>

          {/* 6. Notes */}
          <button
            onClick={() => toggleWidget("notes")}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isNotesOpen ? "text-white bg-white/10" : "text-gray-400"
            }`}
            title="Scratchpad Notes Editor"
          >
            <Pen className="w-5 h-5" />
          </button>

          {/* 7. Calendar */}
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isCalendarOpen ? "text-amber-400 bg-white/10" : "text-gray-400"
            }`}
            title="Calendar & Planner"
          >
            <Calendar className="w-5 h-5" />
          </button>

          {/* 8. Stats */}
          <button
            onClick={() => toggleWidget("stats")}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isStatsOpen ? "text-white bg-white/10" : "text-gray-400"
            }`}
            title="Daily Focus Analytics"
          >
            <Lightbulb className="w-5 h-5" />
          </button>

          {/* 9. Streak */}
          <button
            onClick={() => setIsStreakOpen(!isStreakOpen)}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isStreakOpen ? "text-amber-400 bg-white/10" : "text-gray-400"
            }`}
            title="Stellar Study Streak"
          >
            <Star className={`w-5 h-5 ${isStreakOpen ? "fill-amber-400/20" : ""}`} />
          </button>

          {/* 10. Cat */}
          <button
            onClick={toggleCatActive}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isCatActive ? "text-amber-400 bg-white/10" : "text-gray-400"
            }`}
            title="Virtual Cat"
          >
            <Cat className="w-5 h-5" />
          </button>

          {/* 11. Space Explorer */}
          <button
            onClick={() => setIsSpaceExplorerOpen(!isSpaceExplorerOpen)}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isSpaceExplorerOpen ? "text-amber-400 bg-white/10" : "text-gray-400"
            }`}
            title="NASA Space Explorer"
          >
            <Telescope className="w-5 h-5" />
          </button>

          {/* 12. Wellness */}
          <button
            onClick={() => setIsWellnessOpen(!isWellnessOpen)}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isWellnessOpen ? "text-rose-400 bg-white/10" : "text-gray-400"
            }`}
            title="Wellness & Habits"
          >
            <HeartPulse className="w-5 h-5" />
          </button>

          {/* 13. Weather */}
          <button
            onClick={() => setIsWeatherOpen(!isWeatherOpen)}
            className={`p-3 rounded-lg transition-all shrink-0 cursor-pointer ${
              isWeatherOpen ? "text-sky-400 bg-white/10" : "text-gray-400"
            }`}
            title="Weather"
          >
            <CloudSun className="w-5 h-5" />
          </button>

          {/* 14. Settings */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 rounded-lg transition-all shrink-0 text-gray-400 cursor-pointer"
            title="Workspace Studio Config"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* 15. Zen Mode */}
          <button
            onClick={() => setIsMinimalMode(true)}
            className="p-3 rounded-lg transition-all shrink-0 text-gray-400 cursor-pointer"
            title="Enter Zen Mode"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
      )}
        </>
      ) : (
        <TimerWidget
          settings={activeProfile.timerSettings}
          onSettingsChange={(settings) => updateProfileField("timerSettings", settings)}
          onSessionComplete={handleSessionComplete}
          activeProfileName={activeProfile.name}
          isMinimalMode={true}
          onExitMinimalMode={() => setIsMinimalMode(false)}
          isImmersiveCenter={false}
          clockFontClass={clockFontClass}
          clockSize={clockSize}
          onClockSizeChange={setClockSize}
          clockColor={clockColor}
          onClockColorChange={setClockColor}
          username={username}
          activeTask={activeTask}
          activeProfile={activeProfile}
        />
      )}
  
      <CatCompanion />
    </div>
  );
}


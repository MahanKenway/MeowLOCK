import React, { useState, useEffect, useRef } from "react";
import { 
  Radio, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Heart, 
  Search, 
  RefreshCw, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  Music,
  HelpCircle,
  Disc,
  X,
  Minimize2,
  Maximize2
} from "lucide-react";

// Types
export interface Station {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  tags: string;
  favicon: string;
  country: string;
  votes: number;
  clickcount: number;
  codec?: string;
}

interface RadioWidgetProps {
  onClose?: () => void;
  currentStation: Station | null;
  onSelectStation: (station: Station | null) => void;
  isPlaying: boolean;
  onSetIsPlaying: (playing: boolean) => void;
  volume: number;
  onSetVolume: (vol: number) => void;
  activeMood: string;
  onSetActiveMood: (mood: string) => void;
  isMiniMode?: boolean;
  setIsMiniMode?: (mini: boolean) => void;
}

// Mood Config
interface MoodConfig {
  name: string;
  description: string;
  tags: string[];
  color: string; 
  glowColor: string;
  fallbackStations: Station[];
}

const FORBIDDEN_WORDS = [
  "pop", "top40", "top 40", "edm", "classical", "jazz", "country", "religious", 
  "gospel", "christian", "sermon", "church", "news", "talk", "sports", "mainstream",
  "hit", "hits", "rap", "hiphop", "rnb", "reggae"
];

const MOODS: MoodConfig[] = [
  {
    name: "Midnight Lo-fi",
    description: "Late-night bedroom beats, dusty vinyl crackles, and warm sub-bass.",
    tags: ["lofi", "chillhop", "lo-fi", "chillbeats", "instrumental beats"],
    color: "from-indigo-950/40 to-purple-950/40 border-indigo-500/30 text-indigo-400",
    glowColor: "rgba(99, 102, 241, 0.4)",
    fallbackStations: [
      {
        stationuuid: "lofi-fallback-1",
        name: "Lofi Radio Underground",
        url: "https://play.streamafrica.net/lofiradio",
        url_resolved: "https://play.streamafrica.net/lofiradio",
        tags: "lofi, chillhop, beats",
        favicon: "",
        country: "Germany",
        votes: 1200,
        clickcount: 2400
      },
      {
        stationuuid: "lofi-fallback-2",
        name: "Chillhop Cafe Underground",
        url: "https://stream.zeno.fm/f3vby666g0duv",
        url_resolved: "https://stream.zeno.fm/f3vby666g0duv",
        tags: "lofi, chill, instrumental",
        favicon: "",
        country: "United States",
        votes: 950,
        clickcount: 1800
      }
    ]
  },
  {
    name: "Deep Focus",
    description: "Expansive ambient textures, slow-drifting pads, and delicate drone melodies.",
    tags: ["ambient", "drone", "chillout", "post-rock", "minimalist"],
    color: "from-teal-950/40 to-cyan-950/40 border-teal-500/30 text-teal-400",
    glowColor: "rgba(20, 184, 166, 0.4)",
    fallbackStations: [
      {
        stationuuid: "focus-fallback-1",
        name: "SomaFM: Drone Zone",
        url: "https://ice1.somafm.com/dronezone-128-mp3",
        url_resolved: "https://ice1.somafm.com/dronezone-128-mp3",
        tags: "ambient, drone, space",
        favicon: "",
        country: "United States",
        votes: 4500,
        clickcount: 9000
      },
      {
        stationuuid: "focus-fallback-2",
        name: "SomaFM: Deep Space One",
        url: "https://ice1.somafm.com/deepspaceone-128-mp3",
        url_resolved: "https://ice1.somafm.com/deepspaceone-128-mp3",
        tags: "ambient, space, drone",
        favicon: "",
        country: "United States",
        votes: 3800,
        clickcount: 7500
      }
    ]
  },
  {
    name: "Melancholic Emo",
    description: "Emotional, heart-on-sleeve alternative, screamo, and indie gems.",
    tags: ["emo", "screamo", "midwest emo", "post-hardcore", "math rock"],
    color: "from-rose-950/40 to-pink-950/40 border-rose-500/30 text-rose-400",
    glowColor: "rgba(244, 63, 94, 0.4)",
    fallbackStations: [
      {
        stationuuid: "emo-fallback-1",
        name: "Screamo & Post-Hardcore Radio",
        url: "https://stream.zeno.fm/hshasb1q9reuv",
        url_resolved: "https://stream.zeno.fm/hshasb1q9reuv",
        tags: "screamo, post-hardcore, emo",
        favicon: "",
        country: "United States",
        votes: 410,
        clickcount: 1100
      }
    ]
  },
  {
    name: "Heavy Metal Energy",
    description: "High-octane riffs, double-bass thunder, and aggressive underground power.",
    tags: ["metal", "heavy metal", "metalcore", "death metal", "doom metal"],
    color: "from-red-950/40 to-amber-950/40 border-red-500/30 text-red-400",
    glowColor: "rgba(239, 68, 68, 0.4)",
    fallbackStations: [
      {
        stationuuid: "metal-fallback-1",
        name: "Classic Metal Radio",
        url: "https://classicmetal.stream.laut.fm/classicmetal",
        url_resolved: "https://classicmetal.stream.laut.fm/classicmetal",
        tags: "metal, heavy metal, gothic",
        favicon: "",
        country: "Germany",
        votes: 820,
        clickcount: 1950
      }
    ]
  },
  {
    name: "Punk Chaos",
    description: "Fast-paced DIY anthems, raw energy, and loud guitars.",
    tags: ["punk", "punk rock", "hardcore punk", "grunge", "ska punk"],
    color: "from-amber-950/40 to-orange-950/40 border-amber-500/30 text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.4)",
    fallbackStations: [
      {
        stationuuid: "punk-fallback-1",
        name: "Real Punk Radio",
        url: "https://punk.stream.laut.fm/punk",
        url_resolved: "https://punk.stream.laut.fm/punk",
        tags: "punk, punk rock, alternative",
        favicon: "",
        country: "Germany",
        votes: 1850,
        clickcount: 3100
      }
    ]
  },
  {
    name: "Underground Alternative",
    description: "Independent, shoegaze, and college-rock textures from the global scene.",
    tags: ["alternative rock", "indie rock", "shoegaze", "grunge", "college rock"],
    color: "from-emerald-950/40 to-green-950/40 border-emerald-500/30 text-emerald-400",
    glowColor: "rgba(16, 185, 129, 0.4)",
    fallbackStations: [
      {
        stationuuid: "alt-fallback-1",
        name: "KEXP Alternative",
        url: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3",
        url_resolved: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3",
        tags: "alternative, indie, live",
        favicon: "",
        country: "United States",
        votes: 5200,
        clickcount: 12000
      }
    ]
  },
  {
    name: "Dark Atmospheric Rock",
    description: "Haunting goth-rock, darkwave synth lines, and melancholic guitars.",
    tags: ["gothic rock", "darkwave", "post-punk", "industrial", "synthwave"],
    color: "from-purple-950/50 to-neutral-950/50 border-purple-900/40 text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.4)",
    fallbackStations: [
      {
        stationuuid: "dark-fallback-1",
        name: "Gothic Wave Underground",
        url: "https://goth.stream.laut.fm/goth",
        url_resolved: "https://goth.stream.laut.fm/goth",
        tags: "gothic, darkwave, post-punk",
        favicon: "",
        country: "Germany",
        votes: 790,
        clickcount: 1600
      }
    ]
  }
];

export default function RadioWidget({
  onClose,
  currentStation,
  onSelectStation,
  isPlaying,
  onSetIsPlaying,
  volume,
  onSetVolume,
  activeMood,
  onSetActiveMood,
  isMiniMode = false,
  setIsMiniMode
}: RadioWidgetProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Station[]>(() => {
    const saved = localStorage.getItem("radio_favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentMoodConfig = MOODS.find(m => m.name === activeMood) || MOODS[0];

  // Load / Fetch stations when mood or searchQuery changes
  useEffect(() => {
    if (showOnlyFavorites) return;
    fetchUndergroundStations();
  }, [activeMood, showOnlyFavorites]);

  const fetchUndergroundStations = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Fetch stations for each tag of the active mood
      const allFetched: Station[] = [];
      
      // Use the primary fast mirror api
      const apiEndpoint = `https://de1.api.radio-browser.info/json/stations/search`;
      
      // We will perform searches for the tags in the current mood
      const fetchPromises = currentMoodConfig.tags.slice(0, 3).map(async (tag) => {
        try {
          const res = await fetch(`${apiEndpoint}?tag=${encodeURIComponent(tag)}&limit=25&order=votes&reverse=true&hidebroken=true&https=true`);
          if (res.ok) {
            return await res.json() as Station[];
          }
        } catch (e) {
          console.error("API fetch error for tag:", tag, e);
        }
        return [] as Station[];
      });

      const results = await Promise.all(fetchPromises);
      results.forEach(list => {
        if (list && Array.isArray(list)) {
          allFetched.push(...list);
        }
      });

      // Deduplicate by UUID
      const uniqueStationsMap = new Map<string, Station>();
      allFetched.forEach(station => {
        if (station.stationuuid && station.url) {
          uniqueStationsMap.set(station.stationuuid, station);
        }
      });

      // Perform deep underground alternative filtering
      const filtered = Array.from(uniqueStationsMap.values()).filter(station => {
        const stationNameLower = station.name.toLowerCase();
        const stationTagsLower = (station.tags || "").toLowerCase();

        // Check against forbidden words list to exclude mainstream pop/jazz/classical/news/talk
        const isForbidden = FORBIDDEN_WORDS.some(word => 
          stationNameLower.includes(word) || stationTagsLower.includes(word)
        );

        // Keep it if not forbidden and contains at least one relevant tag/genre identifier
        return !isForbidden;
      });

      // Sort by votes
      filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      if (filtered.length === 0) {
        // Fallback to curate backup list
        setStations(currentMoodConfig.fallbackStations);
      } else {
        setStations(filtered);
      }
    } catch (err) {
      console.error("Error loading stations, using fallbacks.", err);
      setStations(currentMoodConfig.fallbackStations);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (station: Station, e: React.MouseEvent) => {
    e.stopPropagation();
    let updatedFavorites: Station[] = [];
    const isFav = favorites.some(fav => fav.stationuuid === station.stationuuid);
    
    if (isFav) {
      updatedFavorites = favorites.filter(fav => fav.stationuuid !== station.stationuuid);
    } else {
      updatedFavorites = [...favorites, station];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("radio_favorites", JSON.stringify(updatedFavorites));
  };

  // Skip to next or previous station
  const handleSkip = (direction: "forward" | "backward") => {
    const list = showOnlyFavorites ? favorites : stations;
    if (list.length === 0) return;

    if (!currentStation) {
      onSelectStation(list[0]);
      onSetIsPlaying(true);
      return;
    }

    const currentIndex = list.findIndex(s => s.stationuuid === currentStation.stationuuid);
    let nextIndex = 0;

    if (direction === "forward") {
      nextIndex = (currentIndex + 1) % list.length;
    } else {
      nextIndex = (currentIndex - 1 + list.length) % list.length;
    }

    onSelectStation(list[nextIndex]);
    onSetIsPlaying(true);
  };

  // Local filtered search list
  const displayList = (showOnlyFavorites ? favorites : stations).filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.tags.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isMiniMode) {
    return (
      <div className="w-full h-full flex flex-col font-sans select-none text-gray-100 items-center justify-between pb-0.5 relative group">
        {/* Absolute Hover Action Overlay on Top Right */}
        <div className="absolute right-1 top-1 flex items-center gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-neutral-900/90 backdrop-blur-md px-1.5 py-1 rounded-lg border border-white/5">
          <button
            onClick={() => setIsMiniMode && setIsMiniMode(false)}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Expand View"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Cassette SVG */}
        <div className="w-full flex flex-col items-center justify-center relative mt-1 flex-1">
          <svg 
            viewBox="0 0 240 144" 
            className="w-full max-w-[195px] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-all duration-500"
            style={{
              filter: isPlaying 
                ? `drop-shadow(0 0 15px ${currentMoodConfig.glowColor}) drop-shadow(0 4px 6px rgba(0,0,0,0.6))` 
                : "drop-shadow(0 4px 12px rgba(0,0,0,0.6))"
            }}
          >
            {/* Cassette Outer Body */}
            <rect x="5" y="5" width="230" height="134" rx="10" fill="#141417" stroke="#374151" strokeWidth="2.5" />
            <rect x="12" y="12" width="216" height="120" rx="6" fill="#1c1c21" />
            
            {/* Top Screw Holes */}
            <circle cx="18" cy="18" r="3" fill="#374151" />
            <circle cx="222" cy="18" r="3" fill="#374151" />
            {/* Bottom Screw Holes */}
            <circle cx="18" cy="126" r="3" fill="#374151" />
            <circle cx="222" cy="126" r="3" fill="#374151" />

            {/* Label Sticker */}
            <path d="M 25 25 L 215 25 L 205 105 L 35 105 Z" fill="#2d2d35" rx="3" />
            <rect x="35" y="32" width="170" height="22" rx="3" fill="#101014" />
            <text x="120" y="46" fontFamily="monospace" fontSize="8.5" fill="#9ca3af" textAnchor="middle" letterSpacing="0.5">
              {currentStation ? currentStation.name.toUpperCase().substring(0, 20) : "RADIO_UNDERGROUND"}
            </text>

            {/* Tape Window Area */}
            <rect x="65" y="62" width="110" height="34" rx="4" fill="#0d0d11" stroke="#4b5563" strokeWidth="1.5" />
            
            {/* Spinning Reels (Cassette Spools) */}
            <g className={isPlaying ? "animate-spin" : ""} style={{ transformOrigin: "90px 79px", animationDuration: "10s" }}>
              {/* Left Spool */}
              <circle cx="90" cy="79" r="14" fill="#374151" />
              <circle cx="90" cy="79" r="6" fill="#111827" />
              <rect x="88" y="68" width="4" height="22" fill="#111827" />
              <rect x="79" y="77" width="22" height="4" fill="#111827" />
            </g>

            <g className={isPlaying ? "animate-spin" : ""} style={{ transformOrigin: "150px 79px", animationDuration: "10s" }}>
              {/* Right Spool */}
              <circle cx="150" cy="79" r="14" fill="#374151" />
              <circle cx="150" cy="79" r="6" fill="#111827" />
              <rect x="148" y="68" width="4" height="22" fill="#111827" />
              <rect x="139" y="77" width="22" height="4" fill="#111827" />
            </g>

            {/* Tape roll background effect */}
            <circle cx="90" cy="79" r="22" fill="none" stroke="#6b7280" strokeWidth="2.5" opacity="0.3" />
            <circle cx="150" cy="79" r="22" fill="none" stroke="#6b7280" strokeWidth="2.5" opacity="0.3" />

            {/* Goth/Alternative aesthetic lines */}
            <line x1="30" y1="114" x2="210" y2="114" stroke="#4b5563" strokeWidth="1" />
            <line x1="30" y1="118" x2="210" y2="118" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
          </svg>
        </div>

        {/* Mini Controls */}
        <div className="w-full bg-black/40 p-1.5 rounded-xl border border-white/5 flex flex-col gap-1.5 mt-2">
          {/* Main action buttons */}
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => handleSkip("backward")}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => currentStation && onSetIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-full flex items-center justify-center transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer ${
                isPlaying 
                  ? "bg-rose-500 text-white shadow" 
                  : "bg-emerald-500 text-neutral-950 shadow"
              } ${!currentStation ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!currentStation}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-neutral-950 ml-0.5" />}
            </button>
            <button 
              onClick={() => handleSkip("forward")}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-1.5 px-1">
            <button 
              onClick={() => onSetVolume(volume === 0 ? 0.5 : 0)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 h-0.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col font-sans select-none text-gray-100">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Underground Late-Night Radio
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </h3>
            <p className="text-[10px] text-gray-400">Atmospheric communities & independent underground waves</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pr-10">
          {setIsMiniMode && (
            <button
              onClick={() => setIsMiniMode(true)}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Cassette Mini-View"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0 overflow-hidden">
        
        {/* --- LEFT HAND CASSETTE DECK / PLAYER CONTROLS (5 cols) --- */}
        <div className="md:col-span-5 flex flex-col justify-between bg-black/40 border border-white/5 rounded-2xl p-4 min-h-0 relative overflow-hidden shadow-xl">
          {/* Subtle background glow based on current mood */}
          <div 
            className="absolute -top-16 -left-16 w-36 h-36 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: currentMoodConfig.glowColor }}
          />

          {/* CASSETTE SVG DISPLAY */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <svg 
              viewBox="0 0 240 144" 
              className="w-full max-w-[220px] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-all duration-500"
              style={{
                filter: isPlaying 
                  ? `drop-shadow(0 0 15px ${currentMoodConfig.glowColor}) drop-shadow(0 4px 6px rgba(0,0,0,0.6))` 
                  : "drop-shadow(0 4px 12px rgba(0,0,0,0.6))"
              }}
            >
              {/* Cassette Outer Body */}
              <rect x="5" y="5" width="230" height="134" rx="10" fill="#141417" stroke="#374151" strokeWidth="2.5" />
              <rect x="12" y="12" width="216" height="120" rx="6" fill="#1c1c21" />
              
              {/* Top Screw Holes */}
              <circle cx="18" cy="18" r="3" fill="#374151" />
              <circle cx="222" cy="18" r="3" fill="#374151" />
              {/* Bottom Screw Holes */}
              <circle cx="18" cy="126" r="3" fill="#374151" />
              <circle cx="222" cy="126" r="3" fill="#374151" />

              {/* Label Sticker */}
              <path d="M 25 25 L 215 25 L 205 105 L 35 105 Z" fill="#2d2d35" rx="3" />
              <rect x="35" y="32" width="170" height="22" rx="3" fill="#101014" />
              <text x="120" y="46" fontFamily="monospace" fontSize="9" fill="#9ca3af" textAnchor="middle" letterSpacing="0.5">
                {currentStation ? currentStation.name.toUpperCase().substring(0, 22) : "NO STATION SELECTED"}
              </text>

              {/* Tape Window Area */}
              <rect x="65" y="62" width="110" height="34" rx="4" fill="#0d0d11" stroke="#4b5563" strokeWidth="1.5" />
              
              {/* Spinning Reels (Cassette Spools) */}
              <g className={isPlaying ? "animate-spin" : ""} style={{ transformOrigin: "90px 79px", animationDuration: "10s" }}>
                {/* Left Spool */}
                <circle cx="90" cy="79" r="14" fill="#374151" />
                <circle cx="90" cy="79" r="6" fill="#111827" />
                {/* Spool teeth */}
                <rect x="88" y="68" width="4" height="22" fill="#111827" />
                <rect x="79" y="77" width="22" height="4" fill="#111827" />
              </g>

              <g className={isPlaying ? "animate-spin" : ""} style={{ transformOrigin: "150px 79px", animationDuration: "10s" }}>
                {/* Right Spool */}
                <circle cx="150" cy="79" r="14" fill="#374151" />
                <circle cx="150" cy="79" r="6" fill="#111827" />
                {/* Spool teeth */}
                <rect x="148" y="68" width="4" height="22" fill="#111827" />
                <rect x="139" y="77" width="22" height="4" fill="#111827" />
              </g>

              {/* Tape roll background effect (shows tape wrapping) */}
              <circle cx="90" cy="79" r="22" fill="none" stroke="#6b7280" strokeWidth="2.5" opacity="0.3" />
              <circle cx="150" cy="79" r="22" fill="none" stroke="#6b7280" strokeWidth="2.5" opacity="0.3" />

              {/* Goth/Alternative aesthetic lines */}
              <line x1="30" y1="114" x2="210" y2="114" stroke="#4b5563" strokeWidth="1" />
              <line x1="30" y1="118" x2="210" y2="118" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
            </svg>

            {/* EQ Virtualizer Lights */}
            {isPlaying && (
              <div className="flex gap-1 mt-4 items-end h-8">
                {[...Array(12)].map((_, i) => {
                  const randomHeight = Math.floor(Math.random() * 24) + 4;
                  return (
                    <div 
                      key={i} 
                      className="w-1 rounded-t transition-all duration-150"
                      style={{ 
                        height: `${randomHeight}px`, 
                        backgroundColor: currentMoodConfig.glowColor || "rgba(16, 185, 129, 0.8)",
                        animation: `bounce 1s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* DETAILED STATION INFO / MOOD */}
          <div className="my-3 space-y-1 text-center px-2">
            {currentStation ? (
              <>
                <h4 className="font-bold text-xs text-white truncate" title={currentStation.name}>
                  {currentStation.name}
                </h4>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] uppercase font-mono tracking-wider">
                    {currentStation.codec || "MP3"}
                  </span>
                  <span className="truncate max-w-[120px]" title={currentStation.tags}>
                    {currentStation.tags ? currentStation.tags.split(",").slice(0, 2).join(", ") : "Alternative"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h4 className="font-bold text-xs text-gray-400">
                  No Station Playing
                </h4>
                <p className="text-[10px] text-gray-500">
                  Select a mood or station to begin listening
                </p>
              </>
            )}
          </div>

          {/* CONTROLLER MODULE */}
          <div className="space-y-3.5 bg-black/30 p-3 rounded-xl border border-white/5">
            {/* Playback Button Row */}
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => handleSkip("backward")}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Previous Station"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button 
                onClick={() => currentStation && onSetIsPlaying(!isPlaying)}
                className={`p-3.5 rounded-full flex items-center justify-center transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer ${
                  isPlaying 
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20" 
                    : "bg-emerald-500 hover:bg-emerald-600 text-neutral-950 shadow-lg shadow-emerald-500/20"
                } ${!currentStation ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!currentStation}
                title={isPlaying ? "Pause Stream" : "Play Stream"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />}
              </button>

              <button 
                onClick={() => handleSkip("forward")}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Next Station"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Volume Control Slider */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onSetVolume(volume === 0 ? 0.5 : 0)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-400 bg-white/10 h-1 rounded-full cursor-pointer appearance-none"
              />
              <span className="font-mono text-[10px] text-gray-500 w-6 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* --- RIGHT HAND MOOD SELECTION & STATION LISTING (7 cols) --- */}
        <div className="md:col-span-7 flex flex-col min-h-0">
          
          {/* MOOD HORIZONTAL STRIP */}
          <div className="mb-3.5">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Select Midnight Mood
            </h4>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {MOODS.map((mood) => {
                const isSelected = activeMood === mood.name;
                return (
                  <button
                    key={mood.name}
                    onClick={() => {
                      onSetActiveMood(mood.name);
                      setShowOnlyFavorites(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected 
                        ? "bg-white/15 border-white/20 text-white shadow-md font-bold" 
                        : "bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {mood.name}
                  </button>
                );
              })}
              <button
                onClick={() => setShowOnlyFavorites(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1 ${
                  showOnlyFavorites 
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold" 
                    : "bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 hover:text-gray-200"
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" /> Favorites
              </button>
            </div>
            {/* Mood description panel */}
            {!showOnlyFavorites && (
              <div className="mt-2 bg-white/[0.02] border border-white/5 p-2 rounded-xl text-[10.5px] text-gray-400 italic">
                {currentMoodConfig.description}
              </div>
            )}
          </div>

          {/* SEARCH & REFRESH ACTION ROW */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-white/5 rounded-xl px-2.5 py-1.5 border border-white/5 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search station or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
              />
            </div>
            <button
              onClick={fetchUndergroundStations}
              disabled={loading || showOnlyFavorites}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
              title="Refresh Underground Stations"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>

          {/* STATIONS LIST SCROLL */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1.5 pr-0.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <span className="text-xs">Scanning underground streams...</span>
              </div>
            ) : displayList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <HelpCircle className="w-6 h-6 stroke-[1.5] mb-2 text-gray-600" />
                <span className="text-xs">No active stations found</span>
                <p className="text-[10px] text-gray-600 mt-1">Try resetting search, or clicking Refresh</p>
              </div>
            ) : (
              displayList.map((station) => {
                const isActive = currentStation?.stationuuid === station.stationuuid;
                const isFav = favorites.some(fav => fav.stationuuid === station.stationuuid);
                
                return (
                  <div
                    key={station.stationuuid}
                    onClick={() => {
                      onSelectStation(station);
                      onSetIsPlaying(true);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isActive 
                        ? "border-emerald-500/40 bg-emerald-500/[0.04]" 
                        : "border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-lg bg-neutral-900 border flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 ${
                          isActive ? "border-emerald-500 text-emerald-400" : "border-white/10 text-gray-400"
                        }`}>
                          {station.favicon ? (
                            <img 
                              src={station.favicon || undefined} 
                              alt="" 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <Music className="w-3.5 h-3.5" />
                          )}
                        </div>
                        {isActive && isPlaying && (
                          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className={`text-xs font-semibold truncate ${isActive ? "text-emerald-400" : "text-gray-200"}`}>
                          {station.name}
                        </h5>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5 uppercase tracking-wider font-mono">
                          {station.tags ? station.tags.split(",").slice(0, 3).join(" • ") : "No tags"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[9px] font-mono text-gray-500">
                        {station.votes ? `${Math.round(station.votes)} votes` : ""}
                      </span>
                      <button
                        onClick={(e) => handleToggleFavorite(station, e)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isFav 
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                            : "bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10 opacity-60 group-hover:opacity-100"
                        }`}
                        title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-rose-500" : ""}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* MINI ADVISORY FOOTNOTE */}
          <div className="mt-3 text-[9px] text-gray-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-gray-600 shrink-0" />
            <span>Radio Browser is community sourced. Broken streams are automatically bypassed.</span>
          </div>

        </div>

      </div>
    </div>
  );
}

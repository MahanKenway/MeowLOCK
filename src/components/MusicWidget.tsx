import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Shuffle, 
  Volume2, 
  VolumeX, 
  Music, 
  Disc, 
  Upload, 
  FileAudio, 
  Headphones, 
  Check, 
  Minimize2, 
  Maximize2,
  Mic,
  ListMusic,
  Loader2,
  Sparkles,
  Compass,
  X,
  Tablet,
  Smartphone
} from "lucide-react";
import DiscoverMusic from "./DiscoverMusic";
import { getLyricsClientSide, resolveArchiveStream, resolveLastfmStream } from "../services/music";
import { SpotifyService, SpotifyTrack } from "../services/SpotifyService";

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
  cover: string;
  format: string;
  duration: string;
}

const DEFAULT_FALLBACK_TRACK: Track = {
  id: "none",
  name: "No Track Loaded",
  artist: "Drag & drop local files to start",
  url: "",
  cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&fit=crop",
  format: "SYSTEM",
  duration: "00:00"
};

// Hash a string to a beautiful, vibrant HSL color
const getThemeColorFromText = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 45%)`;
};

function generateBeautifulFallbackCover(title: string, artist: string): string {
  const color1 = getThemeColorFromText(title || "Audio");
  const color2 = getThemeColorFromText(artist || "Local");
  const color3 = getThemeColorFromText((title || "") + " " + (artist || ""));
  
  const cleanTitle = (title || "Music").trim();
  const initials = (cleanTitle.length >= 2 ? cleanTitle.substring(0, 2) : cleanTitle.substring(0, 1) || "MP").toUpperCase();
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${color3};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.25" />
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="#0d0c11" />
      <rect width="400" height="400" fill="url(#grad)" opacity="0.8" />
      <circle cx="200" cy="200" r="180" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1.5" />
      <circle cx="200" cy="200" r="140" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
      <circle cx="200" cy="200" r="100" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.5" />
      <circle cx="200" cy="200" r="60" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="0.5" />
      <circle cx="130" cy="130" r="50" fill="url(#glow)" />
      <circle cx="270" cy="270" r="70" fill="url(#glow)" />
      <circle cx="200" cy="200" r="35" fill="#09080c" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2" />
      <text x="200" y="207" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        ${initials}
      </text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function readID3TextFrame(bytes: Uint8Array, offset: number, size: number): string {
  if (size <= 1) return "";
  const encoding = bytes[offset];
  const payload = bytes.subarray(offset + 1, offset + size);
  if (encoding === 0) {
    let str = "";
    for (let i = 0; i < payload.length; i++) {
      if (payload[i] === 0) break;
      str += String.fromCharCode(payload[i]);
    }
    return str;
  } else if (encoding === 3) {
    try {
      return new TextDecoder("utf-8").decode(payload).replace(/\0+$/, "");
    } catch (e) {
      let str = "";
      for (let i = 0; i < payload.length; i++) {
        if (payload[i] === 0) break;
        str += String.fromCharCode(payload[i]);
      }
      return str;
    }
  } else if (encoding === 1 || encoding === 2) {
    try {
      return new TextDecoder("utf-16").decode(payload).replace(/\0+$/, "");
    } catch (e) {
      return "";
    }
  }
  return "";
}

async function extractID3Metadata(file: File): Promise<{ name?: string; artist?: string; cover?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer || buffer.byteLength < 10) {
          resolve({});
          return;
        }
        const view = new DataView(buffer);
        if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) {
          resolve({});
          return;
        }

        const bytes = new Uint8Array(buffer);
        const versionMajor = bytes[3];
        
        let offset = 10;
        let title: string | undefined;
        let artist: string | undefined;
        let coverUrl: string | undefined;

        while (offset < bytes.length - 10) {
          const frameID = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);
          if (!/^[A-Z0-9]{4}$/.test(frameID)) {
            break;
          }

          let frameSize = 0;
          if (versionMajor === 4) {
            const b1 = bytes[offset + 4];
            const b2 = bytes[offset + 5];
            const b3 = bytes[offset + 6];
            const b4 = bytes[offset + 7];
            frameSize = (b1 << 21) | (b2 << 14) | (b3 << 7) | b4;
          } else {
            frameSize = view.getUint32(offset + 4, false);
          }

          if (frameSize <= 0 || offset + 10 + frameSize > bytes.length) {
            break;
          }

          const frameDataOffset = offset + 10;

          if (frameID === "TIT2") {
            const text = readID3TextFrame(bytes, frameDataOffset, frameSize);
            if (text) title = text;
          } else if (frameID === "TPE1") {
            const text = readID3TextFrame(bytes, frameDataOffset, frameSize);
            if (text) artist = text;
          } else if (frameID === "APIC") {
            try {
              let apicPtr = frameDataOffset;
              const textEncoding = bytes[apicPtr];
              apicPtr += 1;

              let mimeType = "";
              while (bytes[apicPtr] !== 0 && apicPtr < bytes.length) {
                mimeType += String.fromCharCode(bytes[apicPtr]);
                apicPtr++;
              }
              apicPtr++;

              const picType = bytes[apicPtr];
              apicPtr++;

              if (textEncoding === 1 || textEncoding === 2) {
                while (!(bytes[apicPtr] === 0 && bytes[apicPtr+1] === 0) && apicPtr < bytes.length) {
                  apicPtr += 2;
                }
                apicPtr += 2;
              } else {
                while (bytes[apicPtr] !== 0 && apicPtr < bytes.length) {
                  apicPtr++;
                }
                apicPtr++;
              }

              const imageDataSize = frameSize - (apicPtr - frameDataOffset);
              if (imageDataSize > 0 && apicPtr + imageDataSize <= bytes.length) {
                const imgBytes = bytes.subarray(apicPtr, apicPtr + imageDataSize);
                const blob = new Blob([imgBytes], { type: mimeType || "image/jpeg" });
                coverUrl = URL.createObjectURL(blob);
              }
            } catch (err) {
              console.error("Failed to parse APIC:", err);
            }
          }

          offset += 10 + frameSize;
        }

        resolve({ name: title, artist, cover: coverUrl });
      } catch (err) {
        console.error("Failed to read ID3 tags:", err);
        resolve({});
      }
    };

    reader.readAsArrayBuffer(file.slice(0, 3 * 1024 * 1024));
  });
}

interface MusicWidgetProps {
  isMiniMode?: boolean;
  setIsMiniMode?: (mini: boolean) => void;
  viewMode?: "normal" | "mini" | "alt" | "alt_mini";
  setViewMode?: (mode: "normal" | "mini" | "alt" | "alt_mini") => void;
}

export default function MusicWidget({ 
  isMiniMode: externalMini, 
  setIsMiniMode: setExternalMini,
  viewMode: externalViewMode,
  setViewMode: externalSetViewMode
}: MusicWidgetProps = {}) {
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem("focus_music_queue");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((t: any) => t && t.url && !t.url.startsWith("blob:"));
        return filtered;
      }
    } catch {}
    return [
      {
        id: "lofi-stargazing",
        name: "Stargazing (Lofi Edit)",
        artist: "Lofi Study Club",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=400&h=400&fit=crop",
        format: "Audio stream",
        duration: "06:12"
      },
      {
        id: "lofi-midnight",
        name: "Midnight Coffee",
        artist: "Retro Beats",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        cover: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=400&h=400&fit=crop",
        format: "Audio stream",
        duration: "07:05"
      },
      {
        id: "synth-deep",
        name: "Deep Coding Space",
        artist: "Synthwave Focus",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=400&fit=crop",
        format: "Audio stream",
        duration: "05:02"
      },
      {
        id: "piano-solitude",
        name: "Relaxing Piano Solitude",
        artist: "Classical Dreams",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        cover: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=400&h=400&fit=crop",
        format: "Audio stream",
        duration: "05:38"
      },
      {
        id: "rp-mellow",
        name: "Radio Paradise (Mellow Mix)",
        artist: "Indie, Folk & Chill Alternative",
        url: "https://stream.radioparadise.com/mellow-128",
        cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&h=400&fit=crop",
        format: "Live stream",
        duration: "LIVE"
      },
      {
        id: "rp-rock",
        name: "Radio Paradise (Rock Mix)",
        artist: "Underground, Post-Punk & Rock",
        url: "https://stream.radioparadise.com/rock-128",
        cover: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400&h=400&fit=crop",
        format: "Live stream",
        duration: "LIVE"
      },
      {
        id: "somafm-lush",
        name: "SomaFM Lush",
        artist: "Sensuous Shoegaze & Dream Pop",
        url: "https://ice1.somafm.com/lush-128-mp3",
        cover: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=400&h=400&fit=crop",
        format: "Live stream",
        duration: "LIVE"
      }
    ];
  });
  const [currentTrackIdx, setCurrentTrackIdx] = useState(() => {
    try {
      const saved = localStorage.getItem("focus_music_current_idx");
      if (saved) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0) return idx;
      }
    } catch {}
    return 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    return parseFloat(localStorage.getItem("focus_music_volume") || "0.7");
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(() => {
    return localStorage.getItem("focus_music_loop") === "true";
  });
  const [isShuffle, setIsShuffle] = useState(() => {
    return localStorage.getItem("focus_music_shuffle") === "true";
  });
  
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  // Get current active track (local / default fallback)
  const currentTrack: Track = currentTrackIdx >= 0 && tracks[currentTrackIdx] 
    ? tracks[currentTrackIdx] 
    : DEFAULT_FALLBACK_TRACK;
  
  const [localViewMode, setLocalViewMode] = useState<"normal" | "mini" | "alt" | "alt_mini">("normal");
  const viewMode = externalViewMode !== undefined ? externalViewMode : (externalMini ? "mini" : localViewMode);
  
  const setViewMode = (mode: "normal" | "mini" | "alt" | "alt_mini") => {
    if (externalSetViewMode) {
      externalSetViewMode(mode);
    } else {
      setLocalViewMode(mode);
      if (setExternalMini) {
        setExternalMini(mode === "mini" || mode === "alt_mini");
      }
    }
  };

  useEffect(() => {
    if (externalViewMode === undefined) {
      setLocalViewMode(externalMini ? "mini" : "normal");
    }
  }, [externalMini, externalViewMode]);

  useEffect(() => {
    const migrationKey = "meowlock_preset_music_v1";
    if (!localStorage.getItem(migrationKey)) {
      const initialTracks = [
        {
          id: "lofi-stargazing",
          name: "Stargazing (Lofi Edit)",
          artist: "Lofi Study Club",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=400&h=400&fit=crop",
          format: "Audio stream",
          duration: "06:12"
        },
        {
          id: "lofi-midnight",
          name: "Midnight Coffee",
          artist: "Retro Beats",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          cover: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=400&h=400&fit=crop",
          format: "Audio stream",
          duration: "07:05"
        },
        {
          id: "synth-deep",
          name: "Deep Coding Space",
          artist: "Synthwave Focus",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
          cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=400&fit=crop",
          format: "Audio stream",
          duration: "05:02"
        },
        {
          id: "piano-solitude",
          name: "Relaxing Piano Solitude",
          artist: "Classical Dreams",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
          cover: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=400&h=400&fit=crop",
          format: "Audio stream",
          duration: "05:38"
        },
        {
          id: "rp-mellow",
          name: "Radio Paradise (Mellow Mix)",
          artist: "Indie, Folk & Chill Alternative",
          url: "https://stream.radioparadise.com/mellow-128",
          cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&h=400&fit=crop",
          format: "Live stream",
          duration: "LIVE"
        },
        {
          id: "rp-rock",
          name: "Radio Paradise (Rock Mix)",
          artist: "Underground, Post-Punk & Rock",
          url: "https://stream.radioparadise.com/rock-128",
          cover: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400&h=400&fit=crop",
          format: "Live stream",
          duration: "LIVE"
        },
        {
          id: "somafm-lush",
          name: "SomaFM Lush",
          artist: "Sensuous Shoegaze & Dream Pop",
          url: "https://ice1.somafm.com/lush-128-mp3",
          cover: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=400&h=400&fit=crop",
          format: "Live stream",
          duration: "LIVE"
        }
      ];
      setTracks(initialTracks);
      setCurrentTrackIdx(0);
      localStorage.setItem("focus_music_queue", JSON.stringify(initialTracks));
      localStorage.setItem("focus_music_current_idx", "0");
      localStorage.setItem(migrationKey, "true");
    }
  }, []);

  // iPod Classic specific states & handlers
  const [ipodStyle, setIpodStyle] = useState<"silver" | "black">("silver");
  const toggleIpodStyle = () => setIpodStyle(prev => prev === "silver" ? "black" : "silver");
  const [wheelRotation, setWheelRotation] = useState(0);
  const isDraggingRef = useRef(false);
  const lastAngleRef = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement | null>(null);

  // iPod classic list menu state
  const [isIpodMenuOpen, setIsIpodMenuOpen] = useState(true);
  const [ipodCurrentMenu, setIpodCurrentMenu] = useState<"main" | "queue" | "themes">("main");
  const [ipodSelectedIndex, setIpodSelectedIndex] = useState(0);
  const accumulatedRotationRef = useRef(0);

  const handleIpodScroll = (steps: number) => {
    let listLength = 0;
    if (ipodCurrentMenu === "main") {
      listLength = 6;
    } else if (ipodCurrentMenu === "queue") {
      listLength = tracks.length;
    } else if (ipodCurrentMenu === "themes") {
      listLength = 2;
    }
    
    if (listLength === 0) return;
    
    setIpodSelectedIndex(prev => {
      let nextIdx = prev + steps;
      if (nextIdx < 0) nextIdx = listLength - 1;
      if (nextIdx >= listLength) nextIdx = 0;
      return nextIdx;
    });
  };

  const handleIpodMenuBtn = () => {
    if (!isIpodMenuOpen) {
      setIsIpodMenuOpen(true);
      setIpodCurrentMenu("main");
      setIpodSelectedIndex(0);
    } else {
      if (ipodCurrentMenu === "main") {
        setIsIpodMenuOpen(false);
      } else {
        setIpodCurrentMenu("main");
        setIpodSelectedIndex(0);
      }
    }
  };

  const handleIpodSelect = (overrideIdx?: number) => {
    let indexToUse = ipodSelectedIndex;
    if (overrideIdx !== undefined) {
      indexToUse = overrideIdx;
      setIpodSelectedIndex(overrideIdx);
    }

    if (!isIpodMenuOpen) {
      // Toggle menu if center clicked on "Now Playing" screen
      setIsIpodMenuOpen(true);
      setIpodCurrentMenu("main");
      setIpodSelectedIndex(0);
      return;
    }
    
    if (ipodCurrentMenu === "main") {
      switch (indexToUse) {
        case 0: // Now Playing
          setIsIpodMenuOpen(false);
          break;
        case 1: // Music Queue
          setIpodCurrentMenu("queue");
          setIpodSelectedIndex(0);
          break;
        case 2: // Shuffle
          handleToggleShuffle();
          break;
        case 3: // Repeat
          handleToggleLoop();
          break;
        case 4: // Theme
          setIpodCurrentMenu("themes");
          setIpodSelectedIndex(0);
          break;
        case 5: // Exit
          setViewMode("normal");
          break;
        default:
          break;
      }
    } else if (ipodCurrentMenu === "queue") {
      if (tracks[indexToUse]) {
        setCurrentTrackIdx(indexToUse);
        setIsPlaying(true);
        setIsIpodMenuOpen(false);
      }
    } else if (ipodCurrentMenu === "themes") {
      if (indexToUse === 0) {
        setIpodStyle("silver");
      } else {
        setIpodStyle("black");
      }
      setIpodCurrentMenu("main");
      setIpodSelectedIndex(4);
    }
  };

  const handleWheelPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent custom window drag when twisting the click wheel
    isDraggingRef.current = true;
    
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    lastAngleRef.current = angle;
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleWheelPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || lastAngleRef.current === null) return;
    
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
    let deltaAngle = currentAngle - lastAngleRef.current;
    
    // Normalize deltaAngle to [-PI, PI] to handle wrapping
    if (deltaAngle > Math.PI) {
      deltaAngle -= 2 * Math.PI;
    } else if (deltaAngle < -Math.PI) {
      deltaAngle += 2 * Math.PI;
    }
    
    const deltaDegrees = deltaAngle * (180 / Math.PI);
    setWheelRotation(prev => prev + deltaDegrees);
    
    if (isIpodMenuOpen) {
      accumulatedRotationRef.current += deltaDegrees;
      const threshold = 18; // degrees to scroll one item
      if (Math.abs(accumulatedRotationRef.current) >= threshold) {
        // Symmetrical floor/ceil truncation to avoid scroll tremor jitter
        const steps = accumulatedRotationRef.current > 0 
          ? Math.floor(accumulatedRotationRef.current / threshold)
          : Math.ceil(accumulatedRotationRef.current / threshold);
        handleIpodScroll(steps);
        accumulatedRotationRef.current -= steps * threshold;
      }
    } else {
      // sensitivity: 270 degrees of rotation maps to 100% volume change
      const volumeChange = deltaDegrees / 270;
      setVolume(prev => {
        const newVal = Math.min(1, Math.max(0, prev + volumeChange));
        return newVal;
      });
      setIsMuted(false);
    }
    
    lastAngleRef.current = currentAngle;
  };

  const handleWheelPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    lastAngleRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleMouseWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    // Spin the click wheel visually
    const deltaDeg = e.deltaY < 0 ? 12 : -12;
    setWheelRotation(prev => prev + deltaDeg);

    if (isIpodMenuOpen) {
      const steps = e.deltaY < 0 ? -1 : 1;
      handleIpodScroll(steps);
    } else {
      // scroll up (negative deltaY) increases volume, scroll down decreases
      const volumeChange = e.deltaY < 0 ? 0.04 : -0.04;
      setVolume(prev => {
        const newVal = Math.min(1, Math.max(0, prev + volumeChange));
        return newVal;
      });
      setIsMuted(false);
    }
  };

  const isMiniMode = viewMode === "mini" || viewMode === "alt_mini";
  const setIsMiniMode = (mini: boolean) => {
    if (mini) {
      setViewMode(viewMode === "alt" ? "alt_mini" : "mini");
    } else {
      setViewMode(viewMode === "alt_mini" ? "alt" : "normal");
    }
  };

  const [dragOver, setDragOver] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Web Audio API refs and visualizer scale state
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [visualizerScale, setVisualizerScale] = useState(1);

  // Dynamic dominant/accent colors
  const [dominantColor, setDominantColor] = useState("rgb(124, 58, 237)");
  const [dominantColorGlow, setDominantColorGlow] = useState("rgba(124, 58, 237, 0.15)");

  // --- Lyrics Integration ---
  const [activeTab, setActiveTab] = useState<"queue" | "lyrics" | "discover" | "spotify">("queue");
  const [lyricsData, setLyricsData] = useState<{ song: string; artist: string; lyrics: { text: string; time: number }[] } | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const lastFetchedTrackRef = useRef<string | null>(null);

  // --- Spotify Integration & Faking Booster State ---
  const [spotifyTokens, setSpotifyTokens] = useState<{ accessToken: string; refreshToken: string; expiresAt: number } | null>(() => {
    try {
      const saved = localStorage.getItem("zen_spotify_tokens");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [spotifyMode, setSpotifyMode] = useState<"silent" | "external">(() => {
    return (localStorage.getItem("zen_spotify_mode") as "silent" | "external") || "silent";
  });

  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string | null>(null);
  const [spotifyCurrentTrack, setSpotifyCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [spotifyFakingStatus, setSpotifyFakingStatus] = useState<"idle" | "searching" | "playing" | "paused" | "failed" | "unauthorized">("idle");
  const [spotifyUserProfile, setSpotifyUserProfile] = useState<any>(null);
  const [spotifyConnecting, setSpotifyConnecting] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

  const spotifyPlayerRef = useRef<any>(null);

  const [spotifyConfigured, setSpotifyConfigured] = useState<boolean | null>(null);

  // Check configuration on mount
  useEffect(() => {
    let active = true;
    SpotifyService.checkConfiguration(window.location.origin).then((isOk) => {
      if (active) {
        setSpotifyConfigured(isOk);
        if (!isOk) {
          // If SPOTIFY_CLIENT_ID is missing or invalid, clear stale credentials
          setSpotifyTokens(null);
          localStorage.removeItem("zen_spotify_tokens");
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Safely refresh access token if needed
  const getOrRefreshAccessToken = async (): Promise<string | null> => {
    if (!spotifyTokens) return null;
    if (spotifyTokens.expiresAt - 120 * 1000 < Date.now()) {
      try {
        console.log("Spotify access token expired. Refreshing...");
        const refreshed = await SpotifyService.refreshAccessToken(spotifyTokens.refreshToken);
        if (!refreshed) {
          throw new Error("Failed to refresh Spotify token");
        }
        const updated = {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken || spotifyTokens.refreshToken,
          expiresAt: refreshed.expiresAt
        };
        setSpotifyTokens(updated);
        localStorage.setItem("zen_spotify_tokens", JSON.stringify(updated));
        return refreshed.accessToken;
      } catch (err) {
        console.error("Failed to auto-refresh Spotify token:", err);
        setSpotifyTokens(null);
        localStorage.removeItem("zen_spotify_tokens");
        return null;
      }
    }
    return spotifyTokens.accessToken;
  };

  // 1. Initialize Spotify Web Playback SDK for SILENT virtual playback
  useEffect(() => {
    if (!spotifyTokens || spotifyMode !== "silent") {
      if (spotifyPlayerRef.current) {
        try {
          spotifyPlayerRef.current.disconnect();
        } catch (e) {}
        spotifyPlayerRef.current = null;
        setSpotifyDeviceId(null);
      }
      return;
    }

    let active = true;

    const initSpotifyPlayer = async () => {
      const token = await getOrRefreshAccessToken();
      if (!token || !active) return;

      // Inject the Spotify SDK script if it's not present
      if (!(window as any).Spotify) {
        if (!document.getElementById("spotify-player-sdk-script")) {
          const script = document.createElement("script");
          script.id = "spotify-player-sdk-script";
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          document.body.appendChild(script);
        }
      }

      const setupPlayer = () => {
        if (spotifyPlayerRef.current) {
          try {
            spotifyPlayerRef.current.disconnect();
          } catch (e) {}
        }

        const player = SpotifyService.createSilentPlayer(
          async () => {
            const freshToken = await getOrRefreshAccessToken();
            return freshToken;
          },
          (deviceId) => {
            console.log("Spotify Silent Player Ready with Device ID:", deviceId);
            if (active) {
              setSpotifyDeviceId(deviceId);
            }
          },
          () => {
            console.log("Spotify Device offline");
            if (active) {
              setSpotifyDeviceId(null);
            }
          },
          async () => {
            console.warn("Spotify SDK Auth error, refreshing...");
            await getOrRefreshAccessToken();
          },
          (message) => {
            console.error("Spotify Premium status required for SDK:", message);
            if (active) {
              setSpotifyMode("external");
              localStorage.setItem("zen_spotify_mode", "external");
            }
          },
          (message) => {
            console.error("Spotify SDK Init error:", message);
          }
        );

        if (player) {
          spotifyPlayerRef.current = player;
        }
      };

      if ((window as any).Spotify) {
        setupPlayer();
      } else {
        (window as any).onSpotifyWebPlaybackSDKReady = () => {
          if (active) {
            setupPlayer();
          }
        };
      }
    };

    initSpotifyPlayer();

    return () => {
      active = false;
      if (spotifyPlayerRef.current) {
        try {
          spotifyPlayerRef.current.disconnect();
        } catch (e) {}
        spotifyPlayerRef.current = null;
      }
    };
  }, [spotifyTokens?.accessToken, spotifyMode]);

  // 2. Load Spotify User Profile
  useEffect(() => {
    if (!spotifyTokens) {
      setSpotifyUserProfile(null);
      return;
    }

    let active = true;
    const loadProfile = async () => {
      const token = await getOrRefreshAccessToken();
      if (!token || !active) return;

      try {
        const resp = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.status === 401) {
          const refreshedToken = await getOrRefreshAccessToken();
          if (refreshedToken && active) {
            const retryResp = await fetch("https://api.spotify.com/v1/me", {
              headers: { Authorization: `Bearer ${refreshedToken}` }
            });
            if (retryResp.ok && active) {
              setSpotifyUserProfile(await retryResp.json());
            }
          }
        } else if (resp.ok && active) {
          setSpotifyUserProfile(await resp.json());
        }
      } catch (err) {
        console.error("Failed to load Spotify profile:", err);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [spotifyTokens?.accessToken]);

  // 3. Dynamic background playback sync trigger (Whenever song or play-state changes)
  useEffect(() => {
    if (!spotifyTokens || !currentTrack || currentTrack.id === "none") {
      setSpotifyCurrentTrack(null);
      return;
    }

    let active = true;
    let playTimeout: any = null;

    const syncSpotifyPlayback = async () => {
      const token = await getOrRefreshAccessToken();
      if (!token || !active) return;

      if (isPlaying && !isResolvingUrl) {
        setSpotifyFakingStatus("searching");
        try {
          const resolved = await SpotifyService.searchTrack(currentTrack.name, currentTrack.artist, token);
          if (!active) return;

          if (resolved) {
            setSpotifyCurrentTrack(resolved);
            setSpotifyFakingStatus("playing");

            const targetDevice = spotifyMode === "silent" ? spotifyDeviceId : null;
            await SpotifyService.playTrack(resolved.uri, targetDevice, token);
          } else {
            setSpotifyFakingStatus("failed");
          }
        } catch (err: any) {
          console.error("Spotify sync failed:", err);
          if (active) {
            if (err.message === "SPOTIFY_UNAUTHORIZED") {
              setSpotifyFakingStatus("unauthorized");
            } else {
              setSpotifyFakingStatus("failed");
            }
          }
        }
      } else {
        setSpotifyFakingStatus("paused");
        try {
          const targetDevice = spotifyMode === "silent" ? spotifyDeviceId : null;
          await SpotifyService.pausePlayback(targetDevice, token);
        } catch (e) {
          console.error("Spotify sync pause failed:", e);
        }
      }
    };

    playTimeout = setTimeout(() => {
      syncSpotifyPlayback();
    }, 800);

    return () => {
      active = false;
      if (playTimeout) clearTimeout(playTimeout);
    };
  }, [isPlaying, currentTrack.id, isResolvingUrl, spotifyTokens?.accessToken, spotifyMode, spotifyDeviceId]);

  // 4. Handle success/error postMessages from the Spotify Auth Popup
  useEffect(() => {
    const handleSpotifyMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }

      if (event.data?.type === "SPOTIFY_AUTH_SUCCESS") {
        const { payload } = event.data;
        setSpotifyTokens(payload);
        localStorage.setItem("zen_spotify_tokens", JSON.stringify(payload));
        console.log("Spotify linked successfully via browser postMessage!");
      } else if (event.data?.type === "SPOTIFY_AUTH_ERROR") {
        console.error("Spotify login failed:", event.data.error);
      }
    };

    window.addEventListener("message", handleSpotifyMessage);
    return () => window.removeEventListener("message", handleSpotifyMessage);
  }, []);

  // 5. Periodic Activity Heartbeat to backend API route
  useEffect(() => {
    if (!spotifyTokens) return;

    let active = true;
    const sendHeartbeat = async () => {
      try {
        const token = await getOrRefreshAccessToken();
        if (!token || !active) return;

        const result = await SpotifyService.sendHeartbeat({
          trackName: currentTrack?.name || "None",
          artist: currentTrack?.artist || "None",
          isPlaying: isPlaying && !isResolvingUrl,
          mode: spotifyMode,
          deviceId: spotifyDeviceId,
          token,
          origin: window.location.origin
        });

        if (result.status === "Disconnected" && active) {
          console.warn("[MusicWidget] Spotify heartbeat disconnected status returned:", result.message);
          setSpotifyTokens(null);
          localStorage.removeItem("zen_spotify_tokens");
          setSpotifyError("Spotify is Disconnected because SPOTIFY_CLIENT_ID is not configured.");
        }
      } catch (err) {
        console.error("Failed to send Spotify heartbeat status:", err);
      }
    };

    // Send immediate heartbeat on state changes
    sendHeartbeat();

    // Send status heartbeats periodically every 30 seconds to simulate constant active playback on backend
    const interval = setInterval(sendHeartbeat, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isPlaying, currentTrack?.id, isResolvingUrl, spotifyTokens, spotifyMode, spotifyDeviceId]);

  const handleConnectSpotify = async () => {
    try {
      setSpotifyConnecting(true);
      setSpotifyError(null);

      // Perform a safety check on configuration before opening popup or making auth requests
      const isOk = await SpotifyService.checkConfiguration(window.location.origin);
      if (!isOk) {
        setSpotifyError("Spotify keys are not configured yet. To activate the Spotify Integration, please open the Settings menu (top right), go to the Secrets panel, and add your: 1) SPOTIFY_CLIENT_ID and 2) SPOTIFY_CLIENT_SECRET.");
        setSpotifyConnecting(false);
        return;
      }

      const authUrl = await SpotifyService.getAuthUrl(window.location.origin);
      if (!authUrl) {
        throw new Error("Could not fetch auth URL");
      }

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        "spotify_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no`
      );

      if (!popup) {
        setSpotifyError("Please allow pop-ups for this site so that the Spotify connection window can open.");
      }
    } catch (err: any) {
      console.error(err);
      setSpotifyError("Error connecting to Spotify. Please make sure SPOTIFY_CLIENT_ID is configured correctly on the server.");
    } finally {
      setSpotifyConnecting(false);
    }
  };

  const handleDisconnectSpotify = () => {
    setSpotifyTokens(null);
    setSpotifyUserProfile(null);
    setSpotifyCurrentTrack(null);
    setSpotifyFakingStatus("idle");
    localStorage.removeItem("zen_spotify_tokens");

    if (spotifyPlayerRef.current) {
      try {
        spotifyPlayerRef.current.disconnect();
      } catch (e) {}
      spotifyPlayerRef.current = null;
    }
    setSpotifyDeviceId(null);
  };

  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const lastUrlRef = useRef<string>("");

  // Save changes to localStorage
  useEffect(() => {
    try {
      const nonBlobTracks = tracks.filter(t => t && t.url && !t.url.startsWith("blob:"));
      localStorage.setItem("focus_music_queue", JSON.stringify(nonBlobTracks));
    } catch (err) {
      console.error(err);
    }
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem("focus_music_current_idx", currentTrackIdx.toString());
  }, [currentTrackIdx]);

  const handlePlayDiscoverTrack = (track: Track) => {
    const existingIdx = tracks.findIndex(t => t.id === track.id || (t.name === track.name && t.artist === track.artist));
    if (existingIdx >= 0) {
      handleTrackSelect(existingIdx);
    } else {
      const updatedTracks = [...tracks, track];
      setTracks(updatedTracks);
      setDuration(0);
      setCurrentTime(0);
      setCurrentTrackIdx(updatedTracks.length - 1);
      setIsPlaying(true);
    }
  };

  const handleAddDiscoverTrackToQueue = (track: Track) => {
    const exists = tracks.some(t => t.id === track.id || (t.name === track.name && t.artist === track.artist));
    if (!exists) {
      setTracks(prev => [...prev, track]);
    }
  };

  // Initialize Web Audio API AudioContext and Analyser Node
  const initAudioContext = () => {
    if (!audioRef.current) return;
    if (audioContextRef.current) return;

    // Check if the URL is local/same-origin or a blob
    const url = resolvedUrl || "";
    const isLocalBlob = url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("file:");
    const isSameOrigin = url.startsWith("/") || url.startsWith("./") || url.startsWith(window.location.origin);

    // ONLY initialize Web Audio Context for local blobs or same-origin files to prevent CORS audio silencing!
    if (!isLocalBlob && !isSameOrigin) {
      console.log("External/cross-origin audio source detected. Bypassing AudioContext routing to prevent CORS blocks.");
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Low fftSize for rapid amplitude calculation

      const audioElement = audioRef.current as any;
      let source;
      if (audioElement.__sourceNode) {
        source = audioElement.__sourceNode;
      } else {
        source = ctx.createMediaElementSource(audioRef.current);
        audioElement.__sourceNode = source;
      }

      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch (e) {
      console.error("Failed to initialize Web Audio Context:", e);
    }
  };

  // Capture playback frequencies and drive visualizer scale animation
  useEffect(() => {
    if (isPlaying) {
      initAudioContext();
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const updateScale = () => {
        const url = resolvedUrl || "";
        const isLocalBlob = url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("file:");
        const isSameOrigin = url.startsWith("/") || url.startsWith("./") || url.startsWith(window.location.origin);

        if (analyserRef.current && (isLocalBlob || isSameOrigin)) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Get average frequency amplitude
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength; // Range: 0 to 255

          // Drive a smooth, responsive breathing scale transition (up to +6% size boost at peak volume)
          const targetScale = 1 + (average / 255) * 0.06;
          setVisualizerScale((prev) => prev + (targetScale - prev) * 0.18); // Soft Lerp
        } else {
          // Simulated smooth pulsing visualizer scale when playing external audio streams that bypass Web Audio
          const time = Date.now() * 0.005;
          const beat = Math.pow(Math.sin(time), 4) * 0.04 + Math.sin(time * 0.2) * 0.01;
          const targetScale = 1 + Math.max(0, beat);
          setVisualizerScale((prev) => prev + (targetScale - prev) * 0.12);
        }
        animationFrameIdRef.current = requestAnimationFrame(updateScale);
      };

      animationFrameIdRef.current = requestAnimationFrame(updateScale);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      // Smooth decay animation back to a baseline scale of 1.0
      let decayId: number;
      const decay = () => {
        setVisualizerScale((prev) => {
          if (prev <= 1.001) return 1;
          decayId = requestAnimationFrame(decay);
          return prev + (1 - prev) * 0.15;
        });
      };
      decayId = requestAnimationFrame(decay);
      return () => cancelAnimationFrame(decayId);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, resolvedUrl]);

  // Resolve special URL schemes client-side on-the-fly
  useEffect(() => {
    if (!currentTrack || !currentTrack.url) {
      setResolvedUrl("");
      return;
    }

    let active = true;
    const resolveAndLoad = async () => {
      setIsResolvingUrl(true);
      try {
        let target = currentTrack.url;
        if (target.startsWith("resolve-archive://")) {
          const identifier = target.replace("resolve-archive://", "");
          target = await resolveArchiveStream(identifier);
        } else if (target.startsWith("resolve-lastfm://")) {
          const parts = target.replace("resolve-lastfm://", "").split("/");
          const artist = decodeURIComponent(parts[0]);
          const song = decodeURIComponent(parts[1]);
          target = await resolveLastfmStream(artist, song);
        }
        
        if (active) {
          setResolvedUrl(target);
        }
      } catch (err) {
        console.error("Failed to resolve stream client-side:", err);
        if (active) {
          setResolvedUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
        }
      } finally {
        if (active) {
          setIsResolvingUrl(false);
        }
      }
    };

    resolveAndLoad();

    return () => {
      active = false;
    };
  }, [currentTrack.url]);

  // Fetch lyrics when current track changes or its duration loads
  useEffect(() => {
    if (!currentTrack || currentTrack.id === "none") {
      setLyricsData(null);
      setLyricsError(null);
      lastFetchedTrackRef.current = null;
      return;
    }

    if (currentTrack.duration === "LIVE" || (currentTrack.format && currentTrack.format.toLowerCase().includes("stream"))) {
      setLyricsData(null);
      setLyricsError("Lyrics unavailable for live radio streams.");
      lastFetchedTrackRef.current = "LIVE-" + currentTrack.id;
      return;
    }

    // Determine the active duration for fetching/caching key
    const activeDuration = duration > 0 ? Math.round(duration) : 180;
    const fetchKey = `${currentTrack.id}-${activeDuration}`;

    if (lastFetchedTrackRef.current === fetchKey) return;
    lastFetchedTrackRef.current = fetchKey;

    let active = true;
    const fetchLyrics = async () => {
      setLyricsLoading(true);
      setLyricsError(null);
      setLyricsData(null); // Clear previous track's lyrics immediately to prevent stale visual display
      try {
        const data = await getLyricsClientSide(
          currentTrack.name,
          currentTrack.artist,
          activeDuration
        );

        if (active) {
          setLyricsData(data);
        }
      } catch (err: any) {
        console.error("Lyrics fetch failed:", err);
        if (active) {
          setLyricsError(err.message || "Failed to fetch lyrics automatically");
        }
      } finally {
        if (active) {
          setLyricsLoading(false);
        }
      }
    };

    fetchLyrics();

    return () => {
      active = false;
    };
  }, [currentTrack.id, duration]);

  // Determine the active lyric line
  const activeLyricIdx = (() => {
    if (!lyricsData || !lyricsData.lyrics || lyricsData.lyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < lyricsData.lyrics.length; i++) {
      if (currentTime >= lyricsData.lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  })();

  // Smoothly scroll active lyric into view
  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [activeLyricIdx]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem("focus_music_volume", volume.toString());
  }, [volume, isMuted]);

  // Sync play state and handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // If the track URL changed, load the new source
    if (resolvedUrl !== lastUrlRef.current) {
      lastUrlRef.current = resolvedUrl || "";
      audio.load();
    }

    if (isPlaying && !isResolvingUrl) {
      if (tracks.length > 0 && resolvedUrl) {
        audio.play().catch((err) => {
          console.warn("Audio play failed or was interrupted:", err);
          if (err && err.name !== "AbortError") {
            setIsPlaying(false);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIdx, tracks, resolvedUrl, isResolvingUrl]);

  // Extract Dynamic Dominant Accent Color
  useEffect(() => {
    const activeCover = currentTrack.cover;
    const activeName = currentTrack.name;

    if (!activeCover) return;

    // Fast image dominant color analysis
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeCover;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          const rgbStr = `rgb(${r}, ${g}, ${b})`;
          const glowStr = `rgba(${r}, ${g}, ${b}, 0.2)`;
          setDominantColor(rgbStr);
          setDominantColorGlow(glowStr);
        }
      } catch (e) {
        const fallbackColor = getThemeColorFromText(activeName);
        setDominantColor(fallbackColor);
        setDominantColorGlow(`${fallbackColor.replace("hsl", "hsla").replace(")", ", 0.2)")}`);
      }
    };
    img.onerror = () => {
      const fallbackColor = getThemeColorFromText(activeName);
      setDominantColor(fallbackColor);
      setDominantColorGlow(`${fallbackColor.replace("hsl", "hsla").replace(")", ", 0.2)")}`);
    };
  }, [currentTrack]);

  const handleTrackSelect = (idx: number) => {
    if (idx !== currentTrackIdx) {
      setDuration(0);
      setCurrentTime(0);
    }
    setCurrentTrackIdx(idx);
    setIsPlaying(true);
  };

  const handleRemoveTrack = (idxToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const nextTracks = tracks.filter((_, i) => i !== idxToRemove);
    setTracks(nextTracks);

    if (nextTracks.length === 0) {
      setCurrentTrackIdx(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    if (idxToRemove === currentTrackIdx) {
      const newIdx = idxToRemove >= nextTracks.length ? nextTracks.length - 1 : idxToRemove;
      setCurrentTrackIdx(newIdx);
      setDuration(0);
      setCurrentTime(0);
    } else if (idxToRemove < currentTrackIdx) {
      setCurrentTrackIdx(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    if (tracks.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    if (isLoop) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    setDuration(0);
    setCurrentTime(0);
    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIdx(randomIdx);
    } else {
      setCurrentTrackIdx((prev) => (prev + 1) % tracks.length);
    }
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      setDuration(0);
      setCurrentTime(0);
      setCurrentTrackIdx((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || currentTrackIdx < 0) return;
    
    const url = URL.createObjectURL(file);
    setTracks((prev) => {
      const copy = [...prev];
      if (copy[currentTrackIdx]) {
        copy[currentTrackIdx] = {
          ...copy[currentTrackIdx],
          cover: url
        };
      }
      return copy;
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    const newTracks: Track[] = [...tracks];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      
      const ext = file.name.split(".").pop()?.toUpperCase() || "AUDIO";
      let formatText = `${ext} | Local High-Fi`;
      if (ext === "FLAC") formatText = "FLAC | 24-bit Studio Lossless";
      if (ext === "WAV") formatText = "WAV | Uncompressed CD Master";
      if (ext === "ALAC" || ext === "M4A") formatText = "ALAC | Apple High-Res Lossless";
      if (ext === "AIFF") formatText = "AIFF | Studio Standard Interchange";

      let metaName = file.name.replace(/\.[^/.]+$/, "");
      let metaArtist = "Local Audio File";
      let metaCover = "";

      try {
        const metadata = await extractID3Metadata(file);
        if (metadata.name) metaName = metadata.name;
        if (metadata.artist) metaArtist = metadata.artist;
        if (metadata.cover) metaCover = metadata.cover;
      } catch (err) {
        console.error("Error extracting metadata for file", file.name, err);
      }

      // Generate a dynamic fallback cover design
      if (!metaCover) {
        metaCover = generateBeautifulFallbackCover(metaName, metaArtist);
      }

      const localTrack: Track = {
        id: `local-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        name: metaName,
        artist: metaArtist,
        url: url,
        cover: metaCover,
        format: formatText,
        duration: "--:--"
      };

      newTracks.push(localTrack);
    }

    setTracks(newTracks);
    const firstNewTrackIdx = tracks.length;
    if (firstNewTrackIdx !== currentTrackIdx) {
      setDuration(0);
      setCurrentTime(0);
    }
    setCurrentTrackIdx(firstNewTrackIdx);
    setIsPlaying(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const audioFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file && file.type.startsWith("audio/")) {
          audioFiles.push(file);
        }
      }
      
      if (audioFiles.length > 0) {
        const dt = new DataTransfer();
        audioFiles.forEach(f => dt.items.add(f));
        handleFileUpload(dt.files);
      }
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleToggleLoop = () => {
    const nextVal = !isLoop;
    setIsLoop(nextVal);
    localStorage.setItem("focus_music_loop", nextVal.toString());
  };

  const handleToggleShuffle = () => {
    const nextVal = !isShuffle;
    setIsShuffle(nextVal);
    localStorage.setItem("focus_music_shuffle", nextVal.toString());
  };

  // MINI MODE (Condensed Capsule or iPod Nano Landscape)
  if (isMiniMode) {
    if (viewMode === "alt_mini") {
      const displayAlbum = currentTrack.id.startsWith("rp-") 
        ? "Radio Paradise Mix" 
        : (currentTrack.id.startsWith("somafm-") 
            ? "SomaFM Broadcast" 
            : "Local High-Fi Collection");
            
      const totalDurationStr = duration ? formatTime(duration) : currentTrack.duration;
      const isLiveStream = currentTrack.duration === "LIVE" || (currentTrack.format && currentTrack.format.toLowerCase().includes("stream"));

      return (
        <div 
          id="music-widget-ipod-nano"
          className="w-full h-full p-4 flex items-center justify-between gap-6 relative select-none rounded-2xl"
          style={{
            background: ipodStyle === "silver" 
              ? "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)" 
              : "linear-gradient(135deg, #27272a 0%, #18181b 50%, #09090b 100%)",
            boxShadow: ipodStyle === "silver"
              ? "0 10px 30px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)"
              : "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.15)",
            border: ipodStyle === "silver" ? "1px solid #b4c6e7" : "1px solid #3f3f46"
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <audio
            ref={audioRef}
            src={resolvedUrl || undefined}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
            loop={isLoop}
          />

          {/* Screen area */}
          <div 
            className="rounded-lg border p-2.5 flex flex-col justify-between font-sans shadow-inner overflow-hidden select-none shrink-0"
            style={{
              width: "220px",
              height: "172px",
              backgroundColor: ipodStyle === "silver" ? "#f8fafc" : "#0f0f11",
              borderColor: ipodStyle === "silver" ? "#cbd5e1" : "#27272a",
              boxShadow: "inset 0 2px 5px rgba(0,0,0,0.15)"
            }}
          >
            {/* Top Status Bar */}
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-zinc-800 pb-1 text-[9px] font-extrabold text-slate-500 tracking-wide shrink-0">
              <div className="flex items-center gap-1">
                {isPlaying ? (
                  <span className="text-[8px] text-emerald-600 animate-pulse">▶</span>
                ) : (
                  <span className="text-[8px] text-amber-600">⏸</span>
                )}
                <span className="font-extrabold text-[8px] text-slate-500 dark:text-zinc-400">iPod Nano</span>
              </div>
              <div className="w-6 h-2.5 border border-slate-400/50 dark:border-zinc-700 rounded-sm p-0.5 flex items-center relative shrink-0">
                <div className="h-full bg-emerald-500 rounded-2xs" style={{ width: "85%" }} />
                <div className="w-0.5 h-1 bg-slate-400 dark:border-zinc-700 absolute -right-1 rounded-r-xs" />
              </div>
            </div>

            {isIpodMenuOpen ? (
              /* iPod Classic Menus */
              <div className="flex-1 flex flex-col justify-between min-h-0 mt-1">
                {ipodCurrentMenu === "main" ? (
                  <div className="flex-1 flex gap-1.5 min-h-0 select-none text-left">
                    {/* Left Side: Scrollable Menu */}
                    <div className="w-[58%] border-r border-slate-300 dark:border-zinc-800 pr-1 flex flex-col justify-start text-[9px] font-bold text-slate-700 dark:text-zinc-300 font-sans space-y-0.5">
                      {[
                        "Now Playing",
                        "Music Queue",
                        `Shuffle: ${isShuffle ? "On" : "Off"}`,
                        `Repeat: ${isLoop ? "On" : "Off"}`,
                        `iPod Casing`,
                        "Exit Nano View"
                      ].map((item, idx) => {
                        const isSelected = idx === ipodSelectedIndex;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleIpodSelect(idx)}
                            className={`px-1 py-0.5 rounded flex items-center justify-between text-[8px] font-black tracking-tight transition-colors cursor-pointer ${
                              isSelected 
                                ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm" 
                                : "text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span className="truncate">{item}</span>
                            <span className={`text-[7px] ${isSelected ? "text-white" : "text-slate-400"}`}>▶</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Right Side: Split Art preview */}
                    <div className="w-[42%] flex flex-col items-center justify-center pl-1">
                      <div className="relative shrink-0 shadow border border-slate-300 dark:border-zinc-800 rounded overflow-hidden bg-slate-200 w-[50px] h-[50px]">
                        <img 
                          src={currentTrack.cover || undefined} 
                          alt={currentTrack.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isPlaying && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <Disc className="w-3.5 h-3.5 animate-spin-slow text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-1 w-full overflow-hidden">
                        <p className="text-[8px] font-black text-slate-800 dark:text-zinc-200 truncate leading-none px-0.5 font-sans">
                          {currentTrack.name}
                        </p>
                        <p className="text-[7px] font-semibold text-slate-500 dark:text-zinc-400 truncate leading-normal px-0.5 mt-0.5">
                          {currentTrack.artist}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : ipodCurrentMenu === "queue" ? (
                  <div className="flex-1 flex flex-col min-h-0 text-left py-0.5">
                    <div className="flex items-center justify-between border-b border-slate-300 dark:border-zinc-800 pb-0.5 mb-1 shrink-0">
                      <span className="text-[8px] font-black text-slate-500 tracking-wide">MUSIC QUEUE</span>
                      <span className="text-[7px] text-slate-400 font-bold">{tracks.length} tracks</span>
                    </div>
                    {/* Scrollable list of tracks */}
                    <div className="flex-1 overflow-y-auto pr-0.5 space-y-0.5 scrollbar-none max-h-[110px]">
                      {tracks.map((track, idx) => {
                        const isSelected = idx === ipodSelectedIndex;
                        const isPlayingThis = idx === currentTrackIdx;
                        return (
                          <div
                            key={track.id}
                            onClick={() => handleIpodSelect(idx)}
                            className={`px-1 py-0.5 rounded flex items-center justify-between text-[8px] font-black tracking-tight transition-all cursor-pointer ${
                              isSelected 
                                ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm" 
                                : "text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1 pr-1">
                              <span className="text-slate-400 shrink-0 text-[7px] w-3 text-right">
                                {idx + 1}
                              </span>
                              <img src={track.cover || undefined} className="w-3 h-3 rounded-xs object-cover shrink-0" referrerPolicy="no-referrer" />
                              <span className="truncate flex-1 font-bold">
                                {track.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[7px] shrink-0 font-bold">
                              {isPlayingThis && (
                                <span className={isSelected ? "text-white animate-bounce" : "text-sky-500"}>🔊</span>
                              )}
                              <span className={isSelected ? "text-white" : "text-slate-400"}>
                                {track.duration}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : ipodCurrentMenu === "themes" ? (
                  <div className="flex-1 flex flex-col min-h-0 text-left py-0.5">
                    <div className="flex items-center justify-between border-b border-slate-300 dark:border-zinc-800 pb-0.5 mb-1.5 shrink-0">
                      <span className="text-[8px] font-black text-slate-500 tracking-wide font-sans">COLOR THEMES</span>
                    </div>
                    <div className="space-y-0.5">
                      {["Silver Casing", "Black Casing"].map((theme, idx) => {
                        const isSelected = idx === ipodSelectedIndex;
                        const isActive = (idx === 0 && ipodStyle === "silver") || (idx === 1 && ipodStyle === "black");
                        return (
                          <div
                            key={theme}
                            onClick={() => handleIpodSelect(idx)}
                            className={`px-1.5 py-0.5 rounded flex items-center justify-between text-[9px] font-black tracking-tight transition-colors cursor-pointer ${
                              isSelected 
                                ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm" 
                                : "text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span>{theme}</span>
                            {isActive && <span className={isSelected ? "text-white" : "text-sky-500 font-bold"}>✔</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              /* Classic Now Playing screen */
              <div className="flex-1 flex flex-col justify-between min-h-0 mt-1">
                <div className="flex items-center gap-2.5 py-1 min-h-0">
                  <div className="relative shrink-0 shadow border border-slate-300 dark:border-zinc-800 rounded overflow-hidden bg-slate-200 w-[60px] h-[60px]">
                    <AnimatePresence mode="popLayout">
                      <motion.img 
                        key={currentTrack.cover}
                        src={currentTrack.cover || undefined} 
                        alt={currentTrack.name} 
                        referrerPolicy="no-referrer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    {isPlaying && (
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-0.5">
                        <Disc className="w-2.5 h-2.5 animate-spin-slow text-white" />
                      </div>
                    )}
                  </div>

                  {/* Text Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                      {tracks.length > 0 ? `${currentTrackIdx + 1} of ${tracks.length}` : "0 of 0"}
                    </p>
                    <h4 className="text-[10px] font-black text-slate-800 dark:text-zinc-100 truncate tracking-tight mb-0.5 leading-tight">
                      {currentTrack.name}
                    </h4>
                    <p className="text-[9px] font-extrabold text-slate-600 dark:text-zinc-400 truncate mb-0.5">
                      {currentTrack.artist}
                    </p>
                    <p className="text-[8px] font-semibold text-slate-400 truncate">
                      {displayAlbum}
                    </p>
                  </div>
                </div>

                {/* Bottom Progress Bar & Timers */}
                <div className="mt-1 shrink-0">
                  <div className="w-full h-1.5 bg-slate-300 dark:bg-zinc-800 border border-slate-400/40 dark:border-zinc-700 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-400 to-sky-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] rounded-full transition-all duration-100" 
                      style={{ width: `${isLiveStream ? 100 : (currentTime / (duration || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-extrabold text-slate-500 mt-1">
                    <span>{isLiveStream ? "LIVE" : formatTime(currentTime)}</span>
                    <span>{isLiveStream ? "" : (duration ? `-${formatTime(duration - currentTime)}` : totalDurationStr)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Click Wheel Area */}
          <div className="relative flex items-center justify-center shrink-0 w-[130px] h-[130px]">
            <div
              ref={wheelRef}
              onPointerDown={handleWheelPointerDown}
              onPointerMove={handleWheelPointerMove}
              onPointerUp={handleWheelPointerUp}
              onWheel={handleMouseWheelScroll}
              className="w-[124px] h-[124px] rounded-full absolute flex items-center justify-center select-none shadow-lg cursor-pointer transition-colors duration-300 z-10"
              style={{
                background: ipodStyle === "silver" 
                  ? "radial-gradient(circle, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 70%, #cbd5e1 100%)" 
                  : "radial-gradient(circle, #27272a 0%, #1c1c1f 40%, #141416 70%, #0d0d0f 100%)",
                borderWidth: "1px",
                borderColor: ipodStyle === "silver" ? "#cbd5e1" : "#3f3f46",
                boxShadow: ipodStyle === "silver"
                  ? "0 4px 10px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.8)"
                  : "0 4px 10px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)",
                transform: `rotate(${wheelRotation}deg)`,
                touchAction: "none"
              }}
            >
              {/* Click wheel label: MENU at the top */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleIpodMenuBtn}
                className="absolute top-1 left-1/2 -translate-x-1/2 p-1.5 text-[8px] font-black tracking-widest text-center select-none cursor-pointer pointer-events-auto transition-colors z-20"
                style={{
                  color: ipodStyle === "silver" ? "#64748b" : "#a1a1aa"
                }}
                title="iPod Menu / Back"
              >
                MENU
              </motion.button>

              {/* Skip forward on the right */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-center select-none cursor-pointer pointer-events-auto transition-colors z-20"
                style={{
                  color: ipodStyle === "silver" ? "#64748b" : "#a1a1aa"
                }}
                title="Next Track"
              >
                <SkipForward className="w-3.5 h-3.5 fill-current stroke-none" />
              </motion.button>

              {/* Skip backward on the left */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handlePrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-center select-none cursor-pointer pointer-events-auto transition-colors z-20"
                style={{
                  color: ipodStyle === "silver" ? "#64748b" : "#a1a1aa"
                }}
                title="Previous Track"
              >
                <SkipBack className="w-3.5 h-3.5 fill-current stroke-none" />
              </motion.button>

              {/* Play/Pause at the bottom */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={togglePlay}
                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 p-1 text-center select-none cursor-pointer pointer-events-auto transition-colors z-20"
                style={{
                  color: ipodStyle === "silver" ? "#64748b" : "#a1a1aa"
                }}
                title="Play / Pause"
              >
                <div className="flex items-center gap-0.5">
                  <Play className="w-2.5 h-2.5 fill-current stroke-none" />
                  <Pause className="w-2.5 h-2.5 fill-current stroke-none" />
                </div>
              </motion.button>
            </div>

            {/* Center select button */}
            <motion.div 
              whileTap={{ scale: 0.94 }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => handleIpodSelect()}
              className="w-[44px] h-[44px] rounded-full absolute z-30 flex items-center justify-center border shadow-inner cursor-pointer transition-all duration-300"
              style={{
                background: ipodStyle === "silver"
                  ? "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)"
                  : "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)",
                borderColor: ipodStyle === "silver" ? "#94a3b8" : "#27272a",
                boxShadow: ipodStyle === "silver"
                  ? "inset 0 1px 3px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.1)"
                  : "inset 0 1px 3px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)"
              }}
              title="Select Item / Toggle Menu"
            />
          </div>

          {/* Quick toggle view button at bottom-left */}
          <button 
            onClick={() => setViewMode("alt")}
            className="absolute bottom-1 right-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-[9px] font-black cursor-pointer transition-colors"
            style={{ color: ipodStyle === "silver" ? "#475569" : "#a1a1aa" }}
            title="Expand to Full iPod Classic"
          >
            Expand
          </button>
        </div>
      );
    }

    const playingTitle = currentTrack.name;
    const playingArtist = currentTrack.artist;
    const playingCover = currentTrack.cover;

    return (
      <div 
        id="music-widget-mini" 
        className="bg-neutral-950/95 backdrop-blur-3xl border rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 text-white w-full h-full transition-all duration-75 ease-out"
        style={{ 
          boxShadow: `0 10px 35px ${dominantColorGlow}, inset 0 0 20px ${dominantColorGlow}`,
          borderColor: isPlaying ? `${dominantColor}40` : "rgba(255, 255, 255, 0.1)",
          transform: `scale(${visualizerScale})`
        }}
      >
        <audio
          ref={audioRef}
          src={resolvedUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          loop={isLoop}
        />
        
        <div className="relative group shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <img 
            src={playingCover || undefined} 
            alt="Cover" 
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-xl border object-cover transition-all duration-500 shadow-lg"
            style={{ borderColor: isPlaying ? dominantColor : "rgba(255,255,255,0.2)" }}
          />
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Disc 
              className="w-6 h-6" 
              style={{ color: dominantColor, transform: isPlaying ? "rotate(360deg)" : "none", transition: "transform 10s linear infinite" }} 
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-xs md:text-sm font-sans font-extrabold truncate text-gray-100 block tracking-tight">
              {playingTitle}
            </span>
            <span 
              className="text-[9px] font-mono shrink-0 uppercase tracking-widest leading-none border px-1.5 py-0.5 rounded font-semibold"
              style={{ color: dominantColor, borderColor: `${dominantColor}40`, backgroundColor: `${dominantColor}15` }}
            >
              {currentTrack.format.split("|")[0].trim()}
            </span>
          </div>
          <p className="text-[10px] font-sans font-medium mt-0.5 flex items-center gap-1 min-h-[16px] overflow-hidden select-text">
            {lyricsLoading ? (
              <span className="text-gray-500 italic flex items-center gap-1 text-[9px] animate-pulse">
                <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" style={{ color: dominantColor }} />
                Fetching Live Sync Lyrics...
              </span>
            ) : lyricsError ? (
              <span className="text-gray-500 truncate">{playingArtist}</span>
            ) : activeLyricIdx >= 0 && lyricsData?.lyrics?.[activeLyricIdx] ? (
              <span 
                className="font-bold transition-all duration-300 inline-block animate-fade-in truncate flex items-center gap-1 text-[11px]"
                style={{ color: dominantColor }}
              >
                <Sparkles className="w-3 h-3 shrink-0 animate-pulse" style={{ color: dominantColor }} />
                {lyricsData.lyrics[activeLyricIdx].text}
              </span>
            ) : (
              <span className="text-gray-400 truncate">{playingArtist}</span>
            )}
          </p>
          
          <div className="flex items-center gap-2 mt-2 w-full">
            <span className="text-[8px] font-mono text-gray-500 leading-none">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
              <div 
                className="h-full rounded-full transition-all duration-100" 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%`, backgroundColor: dominantColor }}
              />
            </div>
            <span className="text-[8px] font-mono text-gray-500 leading-none">
              {duration ? formatTime(duration) : currentTrack.duration}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-1.5 border-l border-white/5" onPointerDown={(e) => e.stopPropagation()}>
          <button 
            onClick={handlePrev}
            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Previous"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="p-2 text-white rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg flex items-center justify-center"
            style={{ backgroundColor: dominantColor }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button 
            onClick={handleNext}
            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Next"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setViewMode("alt_mini")}
            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            title="iPod Nano Landscape (ALT Mini)"
          >
            <Tablet className="w-4 h-4" style={{ color: dominantColor }} />
          </button>

          <button 
            onClick={() => setViewMode("alt")}
            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            title="iPod Classic Portrait (ALT)"
          >
            <Sparkles className="w-4 h-4" style={{ color: dominantColor }} />
          </button>

          <button 
            onClick={() => setViewMode("normal")}
            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="Expand Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ALT MODE (iPod Classic inspired visualization)
  if (viewMode === "alt") {
    const displayAlbum = currentTrack.id.startsWith("rp-") 
      ? "Radio Paradise Mix" 
      : (currentTrack.id.startsWith("somafm-") 
          ? "SomaFM Broadcast" 
          : "Local High-Fi Collection");
          
    const totalDurationStr = duration ? formatTime(duration) : currentTrack.duration;
    const isLiveStream = currentTrack.duration === "LIVE" || (currentTrack.format && currentTrack.format.toLowerCase().includes("stream"));

    return (
      <div 
        id="music-widget-ipod"
        className="w-full h-full rounded-[32px] p-5 flex flex-col justify-between shadow-2xl relative select-none overflow-hidden border transition-all duration-500"
        style={{
          background: ipodStyle === "silver" 
            ? "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #94a3b8 100%)" 
            : "linear-gradient(135deg, #27272a 0%, #18181b 50%, #09090b 100%)",
          borderColor: ipodStyle === "silver" ? "#cbd5e1" : "#3f3f46",
          boxShadow: ipodStyle === "silver"
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(0, 0, 0, 0.2)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.15), inset 0 -4px 8px rgba(0, 0, 0, 0.8)",
        }}
      >
        <audio
          ref={audioRef}
          src={resolvedUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          loop={isLoop}
        />

        {/* Subtle metallic reflection overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.8), rgba(255,255,255,0) 70%)"
          }}
        />

        {/* Casing edge shine highlight */}
        <div className="absolute inset-[1px] rounded-[31px] pointer-events-none border border-white/20" />

        {/* iPod Display Window */}
        <div 
          className="w-full rounded-xl p-2 shadow-2xl border flex flex-col justify-between h-[215px] relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: ipodStyle === "silver" ? "#0a0a0a" : "#050505",
            borderColor: ipodStyle === "silver" ? "#475569" : "#18181b",
            boxShadow: "inset 0 4px 10px rgba(0, 0, 0, 0.9)"
          }}
        >
          {/* Outer high-gloss glass reflection */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none transform -skew-y-6 origin-top-left z-20" />

          {/* LCD Screen Content Area */}
          <div 
            className="w-full h-full rounded bg-[#e8edf2] text-[#1e293b] p-3 flex flex-col justify-between relative overflow-hidden font-sans border border-black/40 shadow-inner"
            style={{
              background: "linear-gradient(to bottom, #eef2f6 0%, #dbe3eb 100%)",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,0.15)"
            }}
          >
            {/* Top Status Bar */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 text-[10px] font-bold text-slate-500 tracking-wide shrink-0">
              <div className="flex items-center gap-1.5">
                {isPlaying ? (
                  <span className="text-[9px] text-emerald-600 animate-pulse">▶</span>
                ) : (
                  <span className="text-[9px] text-slate-400">‖</span>
                )}
                {isLoop && <span className="text-[8px] border border-slate-300 px-0.5 rounded leading-none">L</span>}
                {isShuffle && <span className="text-[8px] border border-slate-300 px-0.5 rounded leading-none">S</span>}
              </div>
              <span className="text-[9px] font-sans tracking-widest text-slate-600">iPod</span>
              <div className="flex items-center gap-1">
                {/* Volume bar right in status bar */}
                <div className="flex items-center gap-0.5" title={`Volume: ${Math.round(volume * 100)}%`}>
                  {isMuted || volume === 0 ? (
                    <span className="text-[8px] text-slate-400">🔇</span>
                  ) : (
                    <span className="text-[8px] text-slate-600">🔊</span>
                  )}
                  <div className="w-8 h-2 bg-slate-300 rounded-sm overflow-hidden flex items-center p-0.5">
                    <div 
                      className="h-full bg-sky-500 rounded-sm"
                      style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                    />
                  </div>
                </div>
                {/* Battery */}
                <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center relative gap-0.5">
                  <div className="h-full bg-emerald-500 rounded-[1px]" style={{ width: '80%' }} />
                  <div className="w-[1.5px] h-1 bg-slate-400 absolute -right-[2.5px] rounded-r-sm" />
                </div>
              </div>
            </div>

            {isIpodMenuOpen ? (
              /* iPod Classic Menus */
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {ipodCurrentMenu === "main" ? (
                  <div className="flex-1 flex gap-2 min-h-0 py-1.5 select-none text-left">
                    {/* Left Side: Scrollable Menu */}
                    <div className="w-[58%] border-r border-slate-300 pr-1 flex flex-col justify-start text-[11px] font-bold text-slate-700 font-sans space-y-0.5">
                      {[
                        "Now Playing",
                        "Music Queue",
                        `Shuffle: ${isShuffle ? "On" : "Off"}`,
                        `Repeat: ${isLoop ? "On" : "Off"}`,
                        `iPod Theme: ${ipodStyle === "silver" ? "Silver" : "Black"}`,
                        "Exit iPod Mode"
                      ].map((item, idx) => {
                        const isSelected = idx === ipodSelectedIndex;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleIpodSelect(idx)}
                            className={`px-1.5 py-0.5 rounded flex items-center justify-between text-[10px] font-black tracking-tight transition-colors cursor-pointer ${
                              isSelected 
                                ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm" 
                                : "text-slate-800 hover:bg-slate-200 dark:hover:bg-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            <span className="truncate">{item}</span>
                            <span className={`text-[8px] ${isSelected ? "text-white" : "text-slate-400"}`}>▶</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Right Side: Split Art preview */}
                    <div className="w-[42%] flex flex-col items-center justify-center pl-1">
                      <div className="relative shrink-0 shadow-md border border-slate-300 dark:border-zinc-800 rounded overflow-hidden bg-slate-200 w-[65px] h-[65px]">
                        <img 
                          src={currentTrack.cover || undefined} 
                          alt={currentTrack.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isPlaying && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <Disc className="w-4 h-4 animate-spin-slow text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-1 w-full overflow-hidden">
                        <p className="text-[9px] font-black text-slate-800 dark:text-zinc-200 truncate leading-none px-1 font-sans">
                          {currentTrack.name}
                        </p>
                        <p className="text-[8px] font-semibold text-slate-500 dark:text-zinc-400 truncate leading-normal px-1 mt-0.5">
                          {currentTrack.artist}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : ipodCurrentMenu === "queue" ? (
                  <div className="flex-1 flex flex-col min-h-0 text-left py-1">
                    <div className="flex items-center justify-between border-b border-slate-300 dark:border-zinc-800 pb-0.5 mb-1 shrink-0">
                      <span className="text-[9px] font-black text-slate-500 tracking-wide">MUSIC QUEUE</span>
                      <span className="text-[8px] text-slate-400 font-bold">{tracks.length} tracks</span>
                    </div>
                    {/* Scrollable list of tracks */}
                    <div className="flex-1 overflow-y-auto pr-0.5 space-y-0.5 scrollbar-thin max-h-[145px]">
                      {tracks.map((track, idx) => {
                        const isSelected = idx === ipodSelectedIndex;
                        const isPlayingThis = idx === currentTrackIdx;
                        return (
                          <div
                            key={track.id}
                            onClick={() => handleIpodSelect(idx)}
                            className={`px-1.5 py-0.5 rounded flex items-center justify-between text-[9px] font-black tracking-tight transition-all cursor-pointer ${
                              isSelected 
                                ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm" 
                                : "text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1 pr-1">
                              <span className="text-slate-400 shrink-0 text-[8px] w-3 text-right">
                                {idx + 1}
                              </span>
                              <img src={track.cover || undefined} className="w-3.5 h-3.5 rounded-sm object-cover shrink-0" referrerPolicy="no-referrer" />
                              <span className="truncate flex-1 font-bold">
                                {track.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[8px] shrink-0 font-bold">
                              {isPlayingThis && (
                                <span className={isSelected ? "text-white animate-bounce" : "text-sky-500"}>🔊</span>
                              )}
                              <span className={isSelected ? "text-white" : "text-slate-400"}>
                                {track.duration}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : ipodCurrentMenu === "themes" ? (
                  <div className="flex-1 flex flex-col min-h-0 text-left py-1.5">
                    <div className="flex items-center justify-between border-b border-slate-300 dark:border-zinc-800 pb-0.5 mb-2 shrink-0">
                      <span className="text-[9px] font-black text-slate-500 tracking-wide">COLOR THEMES</span>
                    </div>
                    <div className="space-y-1">
                      {["Silver Casing", "Black Casing"].map((theme, idx) => {
                        const isSelected = idx === ipodSelectedIndex;
                        const isActive = (idx === 0 && ipodStyle === "silver") || (idx === 1 && ipodStyle === "black");
                        return (
                          <div
                            key={theme}
                            onClick={() => handleIpodSelect(idx)}
                            className={`px-2 py-1 rounded flex items-center justify-between text-[10px] font-black tracking-tight transition-colors cursor-pointer ${
                              isSelected 
                                ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm" 
                                : "text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span>{theme}</span>
                            {isActive && <span className={isSelected ? "text-white" : "text-sky-500 font-bold"}>✔</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              /* Classic Now Playing screen */
              <>
                {/* Now Playing Screen Layout */}
                <div className="flex-1 flex items-center gap-3 py-2 min-h-0">
                  {/* Album Art Cover with smooth key animation */}
                  <div className="relative shrink-0 shadow-md border border-slate-300 rounded overflow-hidden bg-slate-200">
                    <AnimatePresence mode="popLayout">
                      <motion.img 
                        key={currentTrack.cover}
                        src={currentTrack.cover || undefined} 
                        alt={currentTrack.name} 
                        referrerPolicy="no-referrer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="w-[85px] h-[85px] object-cover"
                      />
                    </AnimatePresence>
                    {isPlaying && (
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-0.5">
                        <Disc className="w-2.5 h-2.5 animate-spin-slow text-white" />
                      </div>
                    )}
                  </div>

                  {/* Text Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                      {tracks.length > 0 ? `${currentTrackIdx + 1} of ${tracks.length}` : "0 of 0"}
                    </p>
                    <h4 className="text-xs font-bold text-slate-800 truncate tracking-tight mb-0.5 leading-tight">
                      {currentTrack.name}
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-600 truncate mb-0.5">
                      {currentTrack.artist}
                    </p>
                    <p className="text-[9px] font-medium text-slate-400 truncate">
                      {displayAlbum}
                    </p>
                  </div>
                </div>

                {/* Bottom Progress Bar & Timers */}
                <div className="mt-1">
                  <div className="w-full h-2 bg-slate-300 border border-slate-400 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-400 to-sky-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] rounded-full transition-all duration-100" 
                      style={{ width: `${isLiveStream ? 100 : (currentTime / (duration || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mt-1">
                    <span>{isLiveStream ? "LIVE" : formatTime(currentTime)}</span>
                    <span>{isLiveStream ? "" : (duration ? `-${formatTime(duration - currentTime)}` : totalDurationStr)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Style selection pill overlay */}
        <div className="flex justify-center gap-2.5 my-1.5 z-10">
          <button
            onClick={() => setIpodStyle("silver")}
            className={`px-2.5 py-1 text-[9px] rounded-full font-bold transition-all border ${
              ipodStyle === "silver"
                ? "bg-white border-slate-300 text-slate-800 shadow-sm"
                : "bg-transparent border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Silver
          </button>
          <button
            onClick={() => setIpodStyle("black")}
            className={`px-2.5 py-1 text-[9px] rounded-full font-bold transition-all border ${
              ipodStyle === "black"
                ? "bg-zinc-800 border-zinc-700 text-white shadow-sm"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Black
          </button>
        </div>

        {/* Click Wheel Area */}
        <div className="flex items-center justify-center my-auto relative select-none">
          {/* The Click Wheel Outer Circle */}
          <div 
            ref={wheelRef}
            onPointerDown={handleWheelPointerDown}
            onPointerMove={handleWheelPointerMove}
            onPointerUp={handleWheelPointerUp}
            onPointerLeave={handleWheelPointerUp}
            onWheel={handleMouseWheelScroll}
            className="w-[180px] h-[180px] rounded-full relative select-none flex items-center justify-center border shadow-2xl transition-all duration-300 touch-none active:scale-[0.98]"
            style={{
              backgroundColor: ipodStyle === "silver" ? "#f8fafc" : "#18181b",
              borderColor: ipodStyle === "silver" ? "#cbd5e1" : "#27272a",
              boxShadow: ipodStyle === "silver"
                ? "inset 0 4px 8px rgba(0,0,0,0.06), inset 0 -4px 8px rgba(255,255,255,0.8), 0 8px 16px rgba(0,0,0,0.15)"
                : "inset 0 4px 8px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(255,255,255,0.05), 0 8px 16px rgba(0,0,0,0.4)",
              transform: `rotate(${wheelRotation}deg)`,
              transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {/* Click Wheel Buttons (unrotated absolutely, so text stays straight!) */}
            <div 
              className="absolute inset-0 select-none pointer-events-none"
              style={{ transform: `rotate(${-wheelRotation}deg)` }}
            >
              {/* MENU Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleIpodMenuBtn}
                className="absolute top-2 left-1/2 -translate-x-1/2 p-2 rounded-lg text-[10px] font-black tracking-widest text-center select-none cursor-pointer pointer-events-auto transition-colors z-20"
                style={{
                  color: ipodStyle === "silver" ? "#64748b" : "#a1a1aa"
                }}
                title="iPod Menu / Back"
              >
                MENU
              </motion.button>

              {/* PREVIOUS Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handlePrev}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-sm font-bold cursor-pointer pointer-events-auto transition-colors z-20"
                style={{
                  color: ipodStyle === "silver" ? "#64748b" : "#a1a1aa"
                }}
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </motion.button>

              {/* NEXT Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleNext}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-sm font-bold cursor-pointer pointer-events-auto transition-colors z-20"
                style={{
                  color: ipodStyle === "silver" ? "#64748b" : "#a1a1aa"
                }}
                title="Next Track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </motion.button>

              {/* PLAY / PAUSE Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={togglePlay}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 rounded-lg text-sm font-bold cursor-pointer pointer-events-auto transition-colors z-20"
                style={{
                  color: ipodStyle === "silver" ? "#64748b" : "#a1a1aa"
                }}
                title="Play / Pause"
              >
                {isPlaying ? (
                  <div className="flex gap-0.5 justify-center items-center">
                    <span className="w-1 h-3 bg-current rounded-sm inline-block" />
                    <span className="w-1 h-3 bg-current rounded-sm inline-block" />
                  </div>
                ) : (
                  <span className="text-[11px] font-black leading-none pl-0.5">▶‖</span>
                )}
              </motion.button>
            </div>

            {/* Inner Center Select Button */}
            <motion.div 
              whileTap={{ scale: 0.94 }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => handleIpodSelect()}
              className="w-[58px] h-[58px] rounded-full absolute z-30 flex items-center justify-center border shadow-inner cursor-pointer transition-all duration-300"
              style={{
                background: ipodStyle === "silver"
                  ? "linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 40%, #94a3b8 100%)"
                  : "linear-gradient(135deg, #3f3f46 0%, #27272a 40%, #18181b 100%)",
                borderColor: ipodStyle === "silver" ? "#cbd5e1" : "#3f3f46",
                boxShadow: ipodStyle === "silver"
                  ? "inset 0 1px 3px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.1)"
                  : "inset 0 1px 3px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)"
              }}
              title="Select Item / Toggle Menu"
            >
              {/* Brushed center accent */}
              <div 
                className="w-[48px] h-[48px] rounded-full opacity-20"
                style={{
                  background: "conic-gradient(from 0deg, #fff 0deg, #000 90deg, #fff 180deg, #000 270deg, #fff 360deg)"
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // FULL PLAYER DECK MODE
  const finalTitle = currentTrack.name;
  const finalArtist = currentTrack.artist;
  const finalCover = currentTrack.cover;
  const finalFormat = currentTrack.format;

  return (
    <div 
      id="music-widget-full" 
      className="bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-white justify-between select-none relative overflow-hidden transition-all duration-75 ease-out"
      style={{ 
        boxShadow: `inset 0 0 40px ${dominantColorGlow}, 0 12px 40px rgba(0,0,0,0.5)`,
        transform: `scale(${visualizerScale})`
      }}
    >
      <audio
        ref={audioRef}
        src={resolvedUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        loop={isLoop}
      />

      {/* Decorative Glow backdrop effect */}
      <div 
        className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: dominantColor }}
      />

      {/* Header section */}
      <div className="flex items-center justify-between mb-4 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-white/5 border border-white/10">
            <Headphones className="w-4 h-4 animate-pulse" style={{ color: dominantColor }} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-gray-100 tracking-tight flex items-center gap-1.5 flex-wrap">
              <span>Music Player</span>
              <span 
                className="text-[9px] border px-1 py-0.5 rounded font-mono uppercase tracking-widest font-normal animate-fade-in"
                style={{ color: dominantColor, borderColor: `${dominantColor}30`, backgroundColor: `${dominantColor}10` }}
              >
                Hi-Fi Local
              </span>
            </h3>
            <p className="font-sans text-[10px] text-gray-400">Pure lossless local play & focus sounds</p>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setViewMode("mini")}
            className="flex items-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-[10px] text-gray-400 transition-all cursor-pointer font-sans"
            title="Convert to mini floating deck"
          >
            <Minimize2 className="w-3.5 h-3.5" style={{ color: dominantColor }} />
            <span>Mini View</span>
          </button>
          
          <button
            onClick={() => setViewMode("alt")}
            className="flex items-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-[10px] text-gray-400 transition-all cursor-pointer font-sans"
            title="Switch to iPod Classic view"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: dominantColor }} />
            <span>ALT View</span>
          </button>
        </div>
      </div>

      {/* Active Track Cover Art */}
      <div className="flex gap-4 items-center bg-black/30 border border-white/5 rounded-2xl p-4 mb-4 z-10">
        <div 
          className={`relative shrink-0 w-20 h-20 group ${currentTrackIdx >= 0 ? "cursor-pointer" : ""}`} 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            if (currentTrackIdx >= 0) {
              coverInputRef.current?.click();
            }
          }}
          title={currentTrackIdx >= 0 ? "Click to change cover art" : undefined}
        >
          <div 
            className="absolute inset-0 rounded-2xl blur-md transition-all duration-700 opacity-20" 
            style={{ backgroundColor: dominantColor, transform: isPlaying ? "scale(1.15)" : "scale(1.0)" }}
          />
          <img 
            src={finalCover || undefined} 
            alt={finalTitle} 
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-xl object-cover border relative z-10 transition-all duration-500 group-hover:scale-[1.03]"
            style={{ borderColor: isPlaying ? dominantColor : "rgba(255,255,255,0.1)" }}
          />
          {currentTrackIdx >= 0 && (
            <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-white/10">
              <Upload className="w-5 h-5 text-white mb-1 animate-bounce" />
              <span className="text-[8px] font-sans font-bold text-gray-200">Change Art</span>
            </div>
          )}
          {isPlaying && (
            <div 
              className="absolute -bottom-1 -right-1 text-white p-1 rounded-lg z-20 shadow-lg border border-white/10"
              style={{ backgroundColor: dominantColor }}
            >
              <Disc className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span 
              className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded leading-none"
              style={{ color: dominantColor, backgroundColor: `${dominantColor}15` }}
            >
              {finalFormat}
            </span>
          </div>
          <h4 className="text-sm font-sans font-extrabold truncate text-white tracking-tight leading-snug">
            {finalTitle}
          </h4>
          <p className="text-[11px] text-gray-400 truncate font-sans">{finalArtist}</p>
        </div>
      </div>

      {/* Progress & Seeking */}
      <div className="space-y-1 mb-4 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{duration ? formatTime(duration) : currentTrack.duration}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#7c3aed] transition-all hover:h-2"
          style={{ accentColor: dominantColor }}
        />
      </div>

      {/* Playback controls */}
      <div className="flex flex-col gap-3.5 mb-4 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-black/15 border border-white/5 rounded-2xl px-4 py-2">
          {/* Repeat */}
          <button 
            onClick={handleToggleLoop}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isLoop 
                ? "bg-white/10 border border-white/20 text-white" 
                : "text-gray-400 hover:text-white border border-transparent"
            }`}
            style={{ color: isLoop ? dominantColor : undefined }}
            title="Repeat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button 
            onClick={handlePrev}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Prev"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button 
            onClick={togglePlay}
            className="p-3 text-white rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
            style={{ backgroundColor: dominantColor }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button 
            onClick={handleNext}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Next"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Shuffle */}
          <button 
            onClick={handleToggleShuffle}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isShuffle 
                ? "bg-white/10 border border-white/20 text-white" 
                : "text-gray-400 hover:text-white border border-transparent"
            }`}
            style={{ color: isShuffle ? dominantColor : undefined }}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-2.5 px-1">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: dominantColor }}
          />
        </div>
      </div>

      {/* Tab Switcher: Queue vs Lyrics vs Discover */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("queue")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === "queue" ? `${dominantColor}15` : "transparent",
              color: activeTab === "queue" ? dominantColor : "#9ca3af"
            }}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Queue</span>
          </button>
          
          <button
            onClick={() => setActiveTab("lyrics")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative"
            style={{
              backgroundColor: activeTab === "lyrics" ? `${dominantColor}15` : "transparent",
              color: activeTab === "lyrics" ? dominantColor : "#9ca3af"
            }}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Lyrics</span>
            {lyricsLoading && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("discover")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative"
            style={{
              backgroundColor: activeTab === "discover" ? `${dominantColor}15` : "transparent",
              color: activeTab === "discover" ? dominantColor : "#9ca3af"
            }}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>

          <button
            onClick={() => setActiveTab("spotify")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative"
            style={{
              backgroundColor: activeTab === "spotify" ? `${dominantColor}15` : "transparent",
              color: activeTab === "spotify" ? (spotifyTokens ? "#1ED760" : dominantColor) : "#9ca3af"
            }}
          >
            <div className="relative flex items-center justify-center">
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" style={{ color: spotifyTokens ? "#1ED760" : undefined }}>
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.075-.668-.135-.744-.47-.075-.336.135-.668.47-.744 3.856-.88 7.15-.5 9.822 1.135.295.178.387.563.206.854zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.077-1.182-.413.125-.847-.107-.972-.52-.125-.413.107-.847.52-.972 3.666-1.112 8.232-.574 11.343 1.34.367.227.487.708.26 1.074zm.106-2.833C14.385 8.8 8.412 8.6 4.966 9.648a1.018 1.018 0 0 1-1.21-.767 1.02 1.02 0 0 1 .767-1.21C8.423 6.447 15 6.67 19.11 9.11a1.018 1.018 0 1 1-1.192 1.647z"/>
              </svg>
              {spotifyTokens && spotifyFakingStatus === "playing" && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#1ED760] animate-ping" />
              )}
            </div>
            <span>Spotify</span>
          </button>
        </div>
        
        {activeTab === "lyrics" && lyricsData && (
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" style={{ color: dominantColor }} />
            {(lyricsData as any).source || "AI Synced"}
          </span>
        )}
      </div>

      {/* MAIN CONTAINER CONTENT */}
      <div className="flex-1 flex flex-col justify-between min-h-0 z-10" onPointerDown={(e) => e.stopPropagation()}>
        {activeTab === "queue" ? (
          <>
            {/* Drag & Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleTriggerUpload}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center mb-2 min-h-[90px] ${
                dragOver
                  ? "border-white bg-white/10 scale-[1.01]"
                  : "border-white/10 bg-white/5 text-gray-400 hover:border-white/25 hover:bg-white/10"
              }`}
              style={{ borderColor: dragOver ? dominantColor : undefined }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files)}
                accept="audio/*"
                multiple
                className="hidden"
              />
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverUpload}
                accept="image/*"
                className="hidden"
              />
              <Upload className="w-5 h-5 mb-1 text-gray-400" style={{ color: dragOver ? dominantColor : undefined }} />
              <span className="text-[10px] font-sans font-bold text-gray-200">
                Drag & drop audio files here or click to choose
              </span>
              <span className="text-[8px] text-gray-500 font-mono mt-0.5 uppercase tracking-wide leading-none">
                FLAC, WAV, ALAC, AIFF, M4A, MP3, OGG
              </span>
            </div>

            {/* Local files list */}
            <div className="overflow-y-auto max-h-[110px] pr-1 gap-1 flex flex-col custom-scrollbar w-full">
              {tracks.length === 0 ? (
                <div className="text-center py-5 text-gray-500 text-[10px] font-sans flex flex-col items-center justify-center gap-1.5">
                  <Music className="w-6 h-6 opacity-30" />
                  <span>No local tracks uploaded yet</span>
                </div>
              ) : (
                tracks.map((track, idx) => {
                  const isSelected = currentTrack.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleTrackSelect(idx)}
                      className="group flex items-center justify-between gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer w-full"
                      style={{
                        backgroundColor: isSelected ? `${dominantColor}15` : "rgba(255,255,255,0.03)",
                        borderColor: isSelected ? `${dominantColor}40` : "transparent"
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileAudio className="w-5 h-5 shrink-0" style={{ color: isSelected ? dominantColor : "#9ca3af" }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-sans font-bold truncate leading-tight text-gray-200">{track.name}</p>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-gray-500">{track.format.split("|")[0].trim()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: dominantColor }} />}
                        <button
                          onClick={(e) => handleRemoveTrack(idx, e)}
                          className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                          title="Remove from queue"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : activeTab === "lyrics" ? (
          /* Lyrics Tab content */
          <div className="flex-1 flex flex-col justify-between min-h-0 relative select-text w-full">
            {lyricsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2.5 py-6">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: dominantColor }} />
                <div className="space-y-1">
                  <p className="text-xs font-sans font-bold text-gray-200 animate-pulse">Syncing Lyrics with Track</p>
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Generating timestamp alignment...</p>
                </div>
              </div>
            ) : lyricsError && !lyricsData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
                <p className="text-xs text-gray-400 font-sans font-semibold">{lyricsError}</p>
                <button
                  onClick={async () => {
                    // Trigger manual reload
                    setLyricsError(null);
                    setLyricsLoading(true);
                    setLyricsData(null); // Clear previous state
                    try {
                      const data = await getLyricsClientSide(
                        currentTrack.name,
                        currentTrack.artist,
                        duration || 180
                      );
                      setLyricsData(data);
                    } catch (err: any) {
                      console.error(err);
                      setLyricsError(err.message || "Failed to fetch lyrics again.");
                    } finally {
                      setLyricsLoading(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold text-white transition-all cursor-pointer shadow-md"
                  style={{ backgroundColor: dominantColor }}
                >
                  Retry Lyrics Sync
                </button>
              </div>
            ) : !lyricsData || lyricsData.lyrics.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-6">
                <Mic className="w-6 h-6 text-gray-600 animate-pulse" />
                <p className="text-xs text-gray-400 font-sans">No lyrics active for fallback state.</p>
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Upload or play a track to begin.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[190px] pr-1.5 space-y-3.5 scroll-smooth custom-scrollbar relative py-2">
                {lyricsData.lyrics.map((lyric, idx) => {
                  const isActive = idx === activeLyricIdx;
                  return (
                    <div
                      key={idx}
                      ref={isActive ? activeLyricRef : null}
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = lyric.time;
                          setCurrentTime(lyric.time);
                        }
                      }}
                      className={`text-left transition-all duration-300 cursor-pointer py-1 px-2 rounded-xl border select-none group/lyric ${
                        isActive
                          ? "scale-105 font-extrabold text-white text-sm"
                          : "text-gray-400/80 hover:text-gray-200 text-xs hover:bg-white/5 border-transparent"
                      }`}
                      style={{
                        backgroundColor: isActive ? `${dominantColor}15` : undefined,
                        borderColor: isActive ? `${dominantColor}30` : "transparent",
                        textShadow: isActive ? `0 0 10px ${dominantColor}50` : "none"
                      }}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <span className="leading-relaxed font-sans">{lyric.text}</span>
                        <span className="font-mono text-[8px] opacity-0 group-hover/lyric:opacity-80 transition-opacity shrink-0 py-0.5 px-1 bg-white/5 rounded border border-white/5">
                          {formatTime(lyric.time)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "discover" ? (
          /* Discover Tab content */
          <DiscoverMusic
            currentTrack={currentTrack}
            tracks={tracks}
            onPlayTrack={handlePlayDiscoverTrack}
            onAddTrackToQueue={handleAddDiscoverTrackToQueue}
            dominantColor={dominantColor}
          />
        ) : (
          /* Spotify Tab content */
          <div className="flex-1 flex flex-col justify-start min-h-0 w-full overflow-y-auto no-scrollbar py-1 text-left">
            {spotifyTokens ? (
              <div className="space-y-3.5 text-left">
                {/* Profile header */}
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                  {spotifyUserProfile?.images?.[0]?.url ? (
                    <img
                      src={spotifyUserProfile.images[0].url}
                      alt="Spotify Profile"
                      className="w-10 h-10 rounded-full border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      {spotifyUserProfile?.display_name?.charAt(0) || "S"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 ml-1.5 text-left">
                    <p className="text-[10px] text-gray-400 leading-none">Connected to Spotify</p>
                    <p className="text-xs font-bold text-white truncate mt-1">
                      {spotifyUserProfile?.display_name || "Spotify User"}
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnectSpotify}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[10px] font-bold transition-all cursor-pointer shrink-0"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Modes selector */}
                <div className="bg-neutral-900/60 p-3 rounded-2xl border border-white/5 space-y-2 text-left">
                  <p className="text-[11px] font-bold text-gray-300">Playback Simulation Mode:</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSpotifyMode("silent");
                        localStorage.setItem("zen_spotify_mode", "silent");
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        spotifyMode === "silent"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-white/3 border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-[10px] font-black">Silent Playback (Premium)</span>
                      <span className="text-[8px] opacity-75 leading-tight">Fully silent background playback</span>
                    </button>

                    <button
                      onClick={() => {
                        setSpotifyMode("external");
                        localStorage.setItem("zen_spotify_mode", "external");
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        spotifyMode === "external"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-white/3 border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-[10px] font-black">External Controller (Free)</span>
                      <span className="text-[8px] opacity-75 leading-tight">Sync status with active tracks</span>
                    </button>
                  </div>
                </div>

                {/* Faking Playback Status Card */}
                <div className="bg-gradient-to-br from-emerald-950/15 to-zinc-950/90 p-4 rounded-2xl border border-emerald-500/25 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[140px]">
                  {spotifyFakingStatus === "playing" && (
                    <div className="absolute w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl animate-pulse" />
                  )}

                  {spotifyFakingStatus === "searching" && (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                      <p className="text-xs font-bold text-gray-300">Searching track on Spotify...</p>
                      <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">{currentTrack.name}</p>
                    </div>
                  )}

                  {spotifyFakingStatus === "playing" && spotifyCurrentTrack && (
                    <div className="flex flex-col items-center gap-2.5 w-full">
                      {/* CD / Vinyl rotating artwork preview */}
                      <div className="relative w-14 h-14 rounded-full border border-emerald-500/30 overflow-hidden shadow-lg shadow-emerald-500/15 shrink-0">
                        <img
                          src={spotifyCurrentTrack.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=150&h=150&fit=crop"}
                          alt={spotifyCurrentTrack.name}
                          className="w-full h-full object-cover animate-spin-slow"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                          <div className="w-3.5 h-3.5 bg-zinc-950 rounded-full border border-white/25" />
                        </div>
                      </div>

                      <div className="text-center w-full max-w-[210px]">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#1ED760] text-[8px] font-black leading-none mb-1.5 animate-pulse">
                          ● Recording Silent Listen & Heartbeat
                        </span>
                        <p className="text-xs font-bold text-white truncate leading-snug select-text">
                          {spotifyCurrentTrack.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5 select-text">
                          {spotifyCurrentTrack.artist}
                        </p>
                      </div>

                      {spotifyMode === "silent" && !spotifyDeviceId && (
                        <p className="text-[8px] text-amber-400 font-bold leading-tight mt-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/15">
                          Info: Background player is initializing sync.
                        </p>
                      )}
                    </div>
                  )}

                  {spotifyFakingStatus === "paused" && (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center text-gray-400 shadow-inner">
                        <Pause className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-gray-400">Simulation Paused</p>
                      <p className="text-[8px] text-gray-600 leading-tight">Your active workspace music player is paused.</p>
                    </div>
                  )}

                  {spotifyFakingStatus === "failed" && (
                    <div className="flex flex-col items-center gap-1.5 text-center px-4 py-2">
                      <span className="text-amber-500 font-bold text-sm">⚠</span>
                      <p className="text-xs font-bold text-gray-400">Track Not Found on Spotify</p>
                      <p className="text-[9px] text-gray-500">
                        Song "{currentTrack.name}" could not be matched on Spotify.
                      </p>
                    </div>
                  )}

                  {spotifyFakingStatus === "idle" && (
                    <div className="flex flex-col items-center gap-2.5 text-center py-5">
                      <Music className="w-8 h-8 text-emerald-500 animate-pulse opacity-40" />
                      <p className="text-xs font-bold text-gray-400">Waiting for local player...</p>
                      <p className="text-[9px] text-gray-500 leading-snug">
                        Play any track in the queue to trigger the Spotify background simulation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Info Tip */}
                <div className="bg-white/2 p-3 rounded-2xl border border-white/5 text-[9px] text-gray-400 leading-relaxed text-left">
                  💡 **Smart Tip**: In Premium (Silent Playback) mode, a background playback session named **"Zen Workspace"** runs completely silently to boost your listening stats without interfering with your active lofi/focus audio streams!
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                {/* Custom SVG Spotify Logo */}
                <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-400 animate-pulse">
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.075-.668-.135-.744-.47-.075-.336.135-.668.47-.744 3.856-.88 7.15-.5 9.822 1.135.295.178.387.563.206.854zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.077-1.182-.413.125-.847-.107-.972-.52-.125-.413.107-.847.52-.972 3.666-1.112 8.232-.574 11.343 1.34.367.227.487.708.26 1.074zm.106-2.833C14.385 8.8 8.412 8.6 4.966 9.648a1.018 1.018 0 0 1-1.21-.767 1.02 1.02 0 0 1 .767-1.21C8.423 6.447 15 6.67 19.11 9.11a1.018 1.018 0 1 1-1.192 1.647z"/>
                  </svg>
                </div>

                <h3 className="text-sm font-black text-white">Boost Spotify Listening Hours 🚀</h3>
                
                <p className="text-[11px] text-gray-300 leading-relaxed mt-2.5 max-w-[280px]">
                  Want to increase your Spotify listening stats (for Spotify Wrapped and activity logs) without actual audio playing and interfering with your workspace focus and lofi tracks?
                </p>

                <p className="text-[10px] text-gray-400 mt-2 max-w-[280px]">
                  By linking your Spotify account, whenever you play a track inside this Zen Workspace, a matching track is streamed **silently** on your Spotify account completely in the background!
                </p>

                {spotifyError && (
                  <div className="mt-4 w-full max-w-[280px] bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] p-3 rounded-xl flex items-start gap-2 text-left relative">
                    <span className="flex-1 leading-normal">{spotifyError}</span>
                    <button 
                      onClick={() => setSpotifyError(null)}
                      className="text-red-400 hover:text-red-200 p-0.5 rounded cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={handleConnectSpotify}
                  disabled={spotifyConnecting}
                  className="mt-5 w-full max-w-[220px] py-2.5 rounded-xl bg-[#1ED760] hover:bg-[#1db954] text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {spotifyConnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Link Spotify Account</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

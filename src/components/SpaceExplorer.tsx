import React, { useState, useEffect, useRef } from "react";
import { fetchAPODClient } from "../services/nasa";
import {
  Telescope,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Heart,
  Share2,
  Download,
  Copy,
  ExternalLink,
  BookOpen,
  History as HistoryIcon,
  X,
  RefreshCw,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Rocket
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SpaceXDashboard from "./SpaceXDashboard";

interface APODData {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: "image" | "video";
  copyright?: string;
}

interface SpaceExplorerProps {
  onClose: () => void;
  onSetBackground: (url: string, type: "image" | "video", title?: string, explanation?: string) => void;
  onClearBackground: () => void;
  currentBgUrl: string;
}

const FALLBACK_SPACE_IMAGES = [
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80", // Space galaxy
  "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80", // Universe starry
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80", // Earth from space
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80", // Nebula
  "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1200&q=80"  // Space exploration telescope
];

export default function SpaceExplorer({
  onClose,
  onSetBackground,
  onClearBackground,
  currentBgUrl
}: SpaceExplorerProps) {
  // Helpers
  const getProxiedUrl = (url: string) => {
    if (!url) return "";
    return url.replace(/^http:\/\//i, "https://");
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getFallbackImageForDate = (dateStr: string) => {
    if (!dateStr) return FALLBACK_SPACE_IMAGES[0];
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % FALLBACK_SPACE_IMAGES.length;
    return FALLBACK_SPACE_IMAGES[index];
  };

  const getApodImageUrl = (entry: APODData | null) => {
    if (!entry) return "";
    if (mediaHasError && entry.date === selectedDate) {
      return getFallbackImageForDate(entry.date);
    }
    if (entry.media_type === "video") {
      const ytId = getYoutubeId(entry.url);
      if (ytId) {
        return getProxiedUrl(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
      }
    }
    return getProxiedUrl(entry.hdurl || entry.url);
  };

  const sanitizeAPODData = (entry: any): APODData => {
    if (!entry || typeof entry !== "object") {
      return {
        title: "Untitled Space Discovery",
        date: new Date().toISOString().split("T")[0],
        explanation: "No description available for this astronomy discovery.",
        url: "",
        media_type: "image"
      };
    }
    const secureUrl = typeof entry.url === "string" ? entry.url.replace(/^http:\/\//i, "https://") : "";
    const secureHdUrl = typeof entry.hdurl === "string" ? entry.hdurl.replace(/^http:\/\//i, "https://") : "";
    return {
      title: typeof entry.title === "string" ? entry.title : "Untitled Space Discovery",
      date: typeof entry.date === "string" ? entry.date : new Date().toISOString().split("T")[0],
      explanation: typeof entry.explanation === "string" ? entry.explanation : "No description available for this astronomy discovery.",
      url: secureUrl,
      hdurl: secureHdUrl || undefined,
      media_type: entry.media_type === "video" || entry.media_type === "image" ? entry.media_type : "image",
      copyright: typeof entry.copyright === "string" ? entry.copyright : undefined,
    };
  };

  const parseDateUTC = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(Date.UTC(year, month, day));
    }
    return new Date();
  };

  const getUTCDateString = (d: Date) => {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDayOfWeekAndFormattedDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(Date.UTC(year, month, day));
        
        // English Format
        const enOptions: Intl.DateTimeFormatOptions = { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          timeZone: 'UTC'
        };
        const enDate = date.toLocaleDateString('en-US', enOptions);

        // Persian Format
        const faOptions: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC'
        };
        const faDate = date.toLocaleDateString('fa-IR', faOptions);

        return { enDate, faDate };
      }
    } catch (e) {
      console.error(e);
    }
    return { enDate: dateStr, faDate: "" };
  };

  const todayStr = getUTCDateString(new Date());

  // State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [apodData, setApodData] = useState<APODData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [mediaHasError, setMediaHasError] = useState<boolean>(false);
  const [preferPoster, setPreferPoster] = useState<boolean>(false);

  // Reset states when selected date changes
  useEffect(() => {
    setMediaHasError(false);
    setPreferPoster(false);
  }, [selectedDate]);

  // View States
  const [activeTab, setActiveTab] = useState<"explore" | "favorites" | "history" | "spacex">("explore");
  const [isReadingMode, setIsReadingMode] = useState<boolean>(false);
  const [showShareDropdown, setShowShareDropdown] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<"image" | "apod" | null>(null);

  // Local Storage States
  const [favorites, setFavorites] = useState<APODData[]>(() => {
    const saved = localStorage.getItem("zen_space_favorites");
    return saved ? JSON.parse(saved).map(sanitizeAPODData) : [];
  });

  const [history, setHistory] = useState<APODData[]>(() => {
    const saved = localStorage.getItem("zen_space_history");
    return saved ? JSON.parse(saved).map(sanitizeAPODData) : [];
  });

  // Fetch Logic
  const fetchAPOD = async (date: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsOfflineMode(false);

    try {
      const data = await fetchAPODClient(date);
      setApodData(data);
      addToHistory(data);
    } catch (err: any) {
      console.log("APOD Fetch failed (handled gracefully)", err);

      // Offline/Fallback Support
      // Try to load from requested date's cache
      const latestFallback = localStorage.getItem("zen_space_cache_latest");
      if (latestFallback) {
        try {
          const parsed = sanitizeAPODData(JSON.parse(latestFallback));
          setApodData(parsed);
          setIsOfflineMode(true);
        } catch (e) {
          setErrorMsg("Could not contact NASA API. Please check your internet connection.");
        }
      } else {
        setErrorMsg("Could not contact NASA API and no cached content is available.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Fetch when date or tab changes to explore
  useEffect(() => {
    if (activeTab === "explore") {
      fetchAPOD(selectedDate);
    }
  }, [selectedDate, activeTab]);

  // Auto-apply background when date changes, if a NASA background is currently active
  useEffect(() => {
    if (apodData && currentBgUrl) {
      const targetUrl = getApodImageUrl(apodData);
      if (targetUrl && currentBgUrl !== targetUrl) {
        // Verify if current background is indeed a NASA APOD image
        const isNasaBgActive = currentBgUrl.includes("apod.nasa.gov");
        if (isNasaBgActive) {
          onSetBackground(targetUrl, "image", apodData.title, apodData.explanation);
        }
      }
    }
  }, [apodData]);

  // History Helper
  const addToHistory = (entry: APODData) => {
    setHistory((prev) => {
      // Avoid duplicate consecutive or same-date history entries
      const filtered = prev.filter((item) => item.date !== entry.date);
      const updated = [entry, ...filtered].slice(0, 15); // keep last 15
      localStorage.setItem("zen_space_history", JSON.stringify(updated));
      return updated;
    });
  };

  // Favorites Handlers
  const toggleFavorite = (entry: APODData) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.date === entry.date);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item.date !== entry.date);
      } else {
        updated = [entry, ...prev];
      }
      localStorage.setItem("zen_space_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorited = (date: string) => {
    return favorites.some((item) => item.date === date);
  };

  // Date Navigation
  const handlePrevDate = () => {
    const current = parseDateUTC(selectedDate);
    current.setUTCDate(current.getUTCDate() - 1);
    setSelectedDate(getUTCDateString(current));
  };

  const handleNextDate = () => {
    if (selectedDate >= todayStr) return;
    const current = parseDateUTC(selectedDate);
    current.setUTCDate(current.getUTCDate() + 1);
    setSelectedDate(getUTCDateString(current));
  };

  // Official APOD Page URL constructor
  const getOfficialApodUrl = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const yy = parts[0].substring(2);
      const mm = parts[1];
      const dd = parts[2];
      return `https://apod.nasa.gov/apod/ap${yy}${mm}${dd}.html`;
    }
    return "https://apod.nasa.gov/apod/astropix.html";
  };

  // Sharing handlers
  const copyToClipboard = (text: string, type: "image" | "apod") => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Background toggle
  const isCurrentBg = apodData && currentBgUrl === (apodData.hdurl || apodData.url);

  return (
    <div className="flex flex-col h-full text-gray-200 select-none font-sans relative pr-1">
      {/* HEADER SECTION */}
      {!isReadingMode && (
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Telescope className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">NASA Space Explorer</h2>
              <p className="text-[9px] text-gray-400 font-mono">Astronomy Picture of the Day</p>
            </div>
          </div>

          {/* Quick Tabs & Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activeTab === "explore"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "favorites"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Heart className="w-3 h-3 fill-current" />
              <span>{favorites.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "history"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <HistoryIcon className="w-3 h-3" />
              <span>History</span>
            </button>

            <button
              onClick={() => setActiveTab("spacex")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "spacex"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Rocket className="w-3 h-3 text-purple-400" />
              <span>SpaceX</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            <button
              onClick={onClose}
              className="p-1 hover:bg-rose-500/20 rounded-lg text-gray-400 hover:text-rose-400 cursor-pointer transition-colors"
              title="Close Space Explorer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* OFFLINE BANNER */}
      {isOfflineMode && !isReadingMode && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-xl text-[10px] mb-3">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode: Showing latest cached picture of the day.</span>
        </div>
      )}

      {/* MAIN LAYOUT CONTAINER */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
        <AnimatePresence mode="wait">
          {/* 1. EXPLORE TAB */}
          {activeTab === "explore" && (
            <motion.div
              key="explore-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              {/* DATE PICKER & NAVIGATION DOCK */}
              {!isReadingMode && (
                <div className="flex flex-col gap-2.5 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    {/* Previous Button */}
                    <button
                      onClick={handlePrevDate}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-all"
                      title="Previous Entry"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Custom Styled Date Input */}
                    <div className="flex items-center gap-2 bg-black/30 border border-white/10 px-2.5 py-1 rounded-lg">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                      <input
                        type="date"
                        value={selectedDate}
                        max={todayStr}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedDate(e.target.value);
                          }
                        }}
                        className="bg-transparent border-none text-[11px] text-white focus:outline-none cursor-pointer font-mono font-semibold"
                      />
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={handleNextDate}
                      disabled={selectedDate >= todayStr}
                      className={`p-1.5 rounded-lg transition-all ${
                        selectedDate >= todayStr
                          ? "text-gray-600 cursor-not-allowed"
                          : "text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                      }`}
                      title="Next Entry"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dynamic Day of the Week and Beautiful Date Display */}
                  <div className="flex flex-col items-center justify-center border-t border-white/5 pt-2 text-center">
                    <span className="text-[11px] font-bold text-amber-400 font-sans tracking-wide">
                      {getDayOfWeekAndFormattedDate(selectedDate).enDate}
                    </span>
                    {getDayOfWeekAndFormattedDate(selectedDate).faDate && (
                      <span className="text-[10px] text-gray-400 font-sans mt-0.5" dir="rtl">
                        {getDayOfWeekAndFormattedDate(selectedDate).faDate}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* LOADING STATE */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
                    <Telescope className="w-5 h-5 text-amber-400 absolute top-3.5 left-3.5 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">Scanning deep space...</p>
                    <p className="text-[9px] text-gray-400 font-mono mt-1">Fetching NASA Astronomy archives</p>
                  </div>
                </div>
              ) : errorMsg ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mb-3" />
                  <p className="text-xs font-bold text-white">{errorMsg}</p>
                  <button
                    onClick={() => fetchAPOD(selectedDate)}
                    className="mt-4 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try Reconnecting</span>
                  </button>
                </div>
              ) : apodData ? (
                <div className="space-y-4">
                  {/* MEDIA BOX CONTAINER */}
                  <div className="group relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-lg aspect-video flex items-center justify-center">
                    {apodData.media_type === "video" && !preferPoster && getYoutubeId(apodData.url) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(apodData.url)}?autoplay=0&rel=0`}
                        title={apodData.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-none rounded-2xl pointer-events-auto"
                      />
                    ) : (
                      <img
                        src={(mediaHasError ? getFallbackImageForDate(apodData.date) : getApodImageUrl(apodData)) || undefined}
                        alt={apodData.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setMediaHasError(true)}
                        className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                      />
                    )}

                    {/* OVERLAYS FOR READABILITY / QUICK ACTION BUTTONS */}
                    {!isReadingMode && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 pointer-events-none">
                        {/* Top action row */}
                        <div className="flex items-center justify-between w-full pointer-events-auto">
                          {/* Favorite trigger */}
                          <button
                            onClick={() => toggleFavorite(apodData)}
                            className={`p-2 rounded-xl transition-all cursor-pointer backdrop-blur-md border ${
                              isFavorited(apodData.date)
                                ? "bg-rose-500 border-rose-600 text-white scale-110 shadow-lg"
                                : "bg-black/50 border-white/10 text-white hover:bg-black/70 hover:scale-105"
                            }`}
                            title={isFavorited(apodData.date) ? "Remove from Favorites" : "Save to Favorites"}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorited(apodData.date) ? "fill-current" : ""}`} />
                          </button>

                          {/* Share Trigger */}
                          <div className="relative">
                            <button
                              onClick={() => setShowShareDropdown(!showShareDropdown)}
                              className="p-2 rounded-xl backdrop-blur-md bg-black/50 border border-white/10 text-white hover:bg-black/70 hover:scale-105 cursor-pointer transition-all"
                              title="Share Space Discovery"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Custom Share Dropdown Popup */}
                            {showShareDropdown && (
                              <div className="absolute right-0 top-10 w-44 bg-neutral-900/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                  onClick={() => {
                                    copyToClipboard(getApodImageUrl(apodData), "image");
                                    setShowShareDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[10px] text-gray-300 hover:text-white hover:bg-white/5 flex items-center justify-between cursor-pointer"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Copy className="w-3 h-3" />
                                    Copy Image URL
                                  </span>
                                  {copiedText === "image" && <Check className="w-3 h-3 text-emerald-400" />}
                                </button>
                                <button
                                  onClick={() => {
                                    copyToClipboard(getOfficialApodUrl(apodData.date), "apod");
                                    setShowShareDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[10px] text-gray-300 hover:text-white hover:bg-white/5 flex items-center justify-between cursor-pointer"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <ExternalLink className="w-3 h-3" />
                                    Copy APOD Link
                                  </span>
                                  {copiedText === "apod" && <Check className="w-3 h-3 text-emerald-400" />}
                                </button>
                                <a
                                  href={getApodImageUrl(apodData)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full text-left px-3 py-1.5 text-[10px] text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer decoration-transparent block"
                                >
                                  <Download className="w-3 h-3" />
                                  Download Image
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom action row */}
                        <div className="flex items-center justify-between w-full pointer-events-auto">
                          {/* Set Background Button */}
                          <button
                            onClick={() => {
                              const targetWallpaperUrl = getApodImageUrl(apodData);
                              if (currentBgUrl === targetWallpaperUrl) {
                                onClearBackground();
                              } else {
                                onSetBackground(targetWallpaperUrl, "image", apodData.title, apodData.explanation);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md transition-all cursor-pointer flex items-center gap-1 border ${
                              currentBgUrl === getApodImageUrl(apodData)
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : "bg-black/50 border-white/10 text-white hover:bg-amber-500 hover:border-amber-600"
                            }`}
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>
                              {currentBgUrl === getApodImageUrl(apodData)
                                ? "Wallpaper Applied"
                                : "Set as App Background"}
                            </span>
                          </button>

                          {/* Reading Mode trigger */}
                          <button
                            onClick={() => setIsReadingMode(true)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md bg-black/50 border border-white/10 text-white hover:bg-white/10 cursor-pointer transition-all flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Reading Mode</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Anti-Censorship Video Notice & Toggle (ضد تحریم) */}
                  {apodData.media_type === "video" && !isReadingMode && (
                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-xl text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                        <span>
                          {preferPoster 
                            ? "Showing static video poster image." 
                            : "Video is embedded. If it does not load, click to show static poster image."}
                        </span>
                      </div>
                      <button
                        onClick={() => setPreferPoster(!preferPoster)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-[9px] font-bold rounded-lg cursor-pointer transition-all shrink-0 ml-2"
                      >
                        {preferPoster ? "Load Video Player" : "Show Poster Image"}
                      </button>
                    </div>
                  )}

                  {/* READING MODE HEADER (only displayed when reading mode is active) */}
                  {isReadingMode && (
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-gray-300">Space Discovery Reading Mode</span>
                      </div>
                      <button
                        onClick={() => setIsReadingMode(false)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold rounded-lg cursor-pointer transition-all border border-white/10"
                      >
                        Exit Reading Mode
                      </button>
                    </div>
                  )}

                  {/* TEXT DETAILS SECTION */}
                  <div className="space-y-2 bg-[#0c0c0c]/40 backdrop-blur-sm border border-white/5 p-4 rounded-2xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-sm font-extrabold text-white leading-tight tracking-tight">
                          {apodData.title}
                        </h1>
                        <div className="flex items-center gap-2.5 mt-1 text-[10px] text-gray-400 font-mono">
                          <span>{apodData.date}</span>
                          {apodData.copyright && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="truncate max-w-[150px]">© {apodData.copyright}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Floating indicators when reading mode is on */}
                      {isReadingMode && (
                        <button
                          onClick={() => toggleFavorite(apodData)}
                          className={`p-2 rounded-xl transition-all cursor-pointer border shrink-0 ${
                            isFavorited(apodData.date)
                              ? "bg-rose-500 border-rose-600 text-white"
                              : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          }`}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      )}
                    </div>

                    {/* Rich Explanation text */}
                    <p className="text-[11px] leading-relaxed text-gray-300 text-justify font-sans select-text">
                      {apodData.explanation}
                    </p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* 2. FAVORITES TAB */}
          {activeTab === "favorites" && (
            <motion.div
              key="favorites-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Saved Discoveries</h3>
                <span className="text-[9px] text-gray-500 font-mono">{favorites.length} Entries</span>
              </div>

              {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <Heart className="w-8 h-8 text-rose-500/30 mb-3" />
                  <p className="text-xs font-bold text-white">No saved discoveries yet</p>
                  <p className="text-[9px] text-gray-500 max-w-[200px] mt-1">
                    Explore deep space, dates and picture entries and tap the heart icon to save them!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {favorites.map((entry) => (
                    <div
                      key={entry.date}
                      className="group bg-white/[0.02] border border-white/5 hover:border-amber-500/30 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
                      onClick={() => {
                        setSelectedDate(entry.date);
                        setActiveTab("explore");
                      }}
                    >
                      <div className="relative aspect-video bg-black/40 overflow-hidden">
                        <img
                          src={getApodImageUrl(entry) || undefined}
                          alt={entry.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFallbackImageForDate(entry.date);
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(entry);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-rose-400 hover:text-white rounded-md cursor-pointer transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="p-2.5 space-y-1">
                        <h4 className="text-[10px] font-bold text-white truncate line-clamp-1">{entry.title}</h4>
                        <p className="text-[9px] text-gray-400 font-mono">{entry.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 3. HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Recent Discoveries</h3>
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("zen_space_history");
                  }}
                  className="text-[9px] text-rose-400 hover:text-rose-300 cursor-pointer transition-colors font-bold uppercase"
                >
                  Clear History
                </button>
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <HistoryIcon className="w-8 h-8 text-purple-500/30 mb-3" />
                  <p className="text-xs font-bold text-white">Your logbook is empty</p>
                  <p className="text-[9px] text-gray-500 max-w-[200px] mt-1">
                    Recently viewed space pictures and entries will be stored here for instant recall.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div
                      key={entry.date}
                      onClick={() => {
                        setSelectedDate(entry.date);
                        setActiveTab("explore");
                      }}
                      className="flex items-center gap-3 p-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden shrink-0">
                        <img
                          src={getApodImageUrl(entry) || undefined}
                          alt={entry.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFallbackImageForDate(entry.date);
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-bold text-white truncate">{entry.title}</h4>
                        <p className="text-[8px] text-gray-400 font-mono mt-0.5">{entry.date}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 4. SPACEX TAB */}
          {activeTab === "spacex" && (
            <motion.div
              key="spacex-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3 animate-in fade-in duration-350"
            >
              <SpaceXDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

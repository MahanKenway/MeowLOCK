import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Disc, 
  Plus, 
  Play, 
  Loader2, 
  Heart, 
  Music,
  Globe,
  Database,
  Volume2,
  Check,
  Youtube
} from "lucide-react";
import { searchMusicClient } from "../services/music";

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
  cover: string;
  format: string;
  duration: string;
}

interface DiscoverMusicProps {
  currentTrack: Track | null;
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onAddTrackToQueue: (track: Track) => void;
  dominantColor: string;
  spotifyToken?: string;
}

export default function DiscoverMusic({
  currentTrack,
  tracks,
  onPlayTrack,
  onAddTrackToQueue,
  dominantColor,
  spotifyToken
}: DiscoverMusicProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchEngine, setSearchEngine] = useState<"global" | "spotify" | "youtube" | "archive">("global");
  const [likedTracks, setLikedTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem("focus_music_liked");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Curated quick-search tags
  const quickSearches: string[] = [
    "Lofi beats", 
    "Nature study ambient", 
    "Deep Focus", 
    "Classical piano", 
    "Synthwave focus", 
    "Vintage Jazz",
    "Radiohead",
    "Chopin"
  ];

  // Perform search
  const performSearch = async (queryToSearch: string, engineOverride?: "global" | "spotify" | "youtube" | "archive") => {
    if (!queryToSearch.trim()) return;
    setIsLoading(true);
    setError(null);
    const engine = engineOverride || searchEngine;
    try {
      const results = await searchMusicClient(queryToSearch, engine, spotifyToken);
      setSearchResults(results);
    } catch (err: any) {
      console.error("Search failed:", err);
      setError("Failed to retrieve results. Please try another search engine or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    performSearch(term);
  };

  // Perform a default search on load
  useEffect(() => {
    performSearch("Lofi beats");
  }, []);

  const toggleLikeTrack = (track: Track) => {
    let nextLikes = [...likedTracks];
    const isLiked = likedTracks.some(t => t.id === track.id);
    if (isLiked) {
      nextLikes = nextLikes.filter(t => t.id !== track.id);
    } else {
      nextLikes.push(track);
    }
    setLikedTracks(nextLikes);
    localStorage.setItem("focus_music_liked", JSON.stringify(nextLikes));
  };

  return (
    <div className="flex-1 flex flex-col justify-start min-h-0 w-full overflow-hidden select-none" onPointerDown={(e) => e.stopPropagation()}>
      {/* Search Input bar */}
      <form onSubmit={handleSubmit} className="flex gap-1.5 mb-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search Global Music, Spotify, YouTube..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-white/20 transition-all font-sans"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
        </div>
        <button
          type="submit"
          className="px-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-gray-200 hover:text-white transition-all cursor-pointer"
        >
          Go
        </button>
      </form>

      {/* Search Engine Switcher */}
      <div className="flex gap-1 mb-2.5 bg-black/40 p-1 rounded-xl border border-white/5">
        {(["global", "spotify", "youtube", "archive"] as const).map((eng) => {
          const isActive = searchEngine === eng;
          const isSpotifyAndNoToken = eng === "spotify" && !spotifyToken;
          
          return (
            <button
              key={eng}
              type="button"
              disabled={isSpotifyAndNoToken}
              onClick={() => {
                setSearchEngine(eng);
                if (searchQuery.trim()) {
                  performSearch(searchQuery, eng);
                }
              }}
              title={isSpotifyAndNoToken ? "Please link your Spotify account first" : undefined}
              className={`flex-1 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isSpotifyAndNoToken ? "opacity-30 cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor: isActive ? dominantColor : "transparent",
                color: isActive ? "#ffffff" : "#9ca3af"
              }}
            >
              {eng === "global" ? "🌐 Global" : eng === "spotify" ? "Spotify" : eng === "youtube" ? "YouTube" : "Archive"}
            </button>
          );
        })}
      </div>

      {/* Quick Search Tag Suggestions */}
      <div className="mb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
          {quickSearches.map((tag) => (
            <button
              key={tag}
              onClick={() => handleQuickSearch(tag)}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-[9px] font-medium text-gray-400 hover:text-white rounded-lg transition-all shrink-0 cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Active Results Container */}
      <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: dominantColor }} />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              Searching vaults...
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4 text-gray-400 text-[10px]">
            <p className="text-rose-400 mb-1 leading-normal font-medium">{error}</p>
            <button 
              onClick={() => performSearch(searchQuery)}
              className="text-[9px] font-mono text-sky-400 hover:underline"
            >
              Retry Search
            </button>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-500 text-[10px] gap-1.5">
            <Disc className="w-7 h-7 opacity-20 animate-spin" style={{ animationDuration: "12s" }} />
            <span>Type a query or tap a tag to search</span>
          </div>
        ) : (
          /* Results Scroll List */
          <div className="flex-1 overflow-y-auto pr-1 gap-1.5 flex flex-col custom-scrollbar w-full min-h-0">
            {searchResults.map((track) => {
              const isSelected = currentTrack?.id === track.id || (currentTrack?.name === track.name && currentTrack?.artist === track.artist);
              const isLiked = likedTracks.some(t => t.id === track.id || (t.name === track.name && t.artist === track.artist));
              
              // Platform styling
              const isSpotify = track.id.startsWith("spotify");
              const isYoutube = track.id.startsWith("youtube") || track.url.includes("youtube") || track.url.includes("youtu.be");
              
              let platformBadge = "Archive";
              let badgeColor = "text-sky-400 border-sky-400/20 bg-sky-400/5";
              if (isSpotify) {
                platformBadge = "Spotify";
                badgeColor = "text-emerald-400 border-emerald-400/20 bg-emerald-400/5";
              } else if (isYoutube) {
                platformBadge = "YouTube";
                badgeColor = "text-red-400 border-red-400/20 bg-red-400/5";
              }

              return (
                <div
                  key={track.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all w-full bg-white/5 border-white/5 hover:border-white/10"
                  style={{
                    borderColor: isSelected ? `${dominantColor}40` : undefined,
                    backgroundColor: isSelected ? `${dominantColor}10` : undefined
                  }}
                >
                  <img
                    src={track.cover || undefined}
                    alt={track.name}
                    className="w-9 h-9 rounded-lg object-cover border border-white/5 shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&fit=crop";
                    }}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[11px] font-sans font-bold truncate leading-tight text-gray-200">{track.name}</p>
                    <p className="text-[9px] text-gray-400 truncate mt-0.5 leading-none">{track.artist}</p>
                    
                    {/* Secondary metadata badge */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`font-mono text-[8px] uppercase tracking-wider px-1 py-0.5 rounded border ${badgeColor}`}>
                        {platformBadge}
                      </span>
                      <span className="font-mono text-[8px] text-gray-500 leading-none">
                        {track.duration}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Favorite */}
                    <button
                      onClick={() => toggleLikeTrack(track)}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer ${
                        isLiked ? "text-rose-500" : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                    </button>

                    {/* Add to Queue */}
                    <button
                      onClick={() => onAddTrackToQueue(track)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Add to Queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Play */}
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="p-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-white transition-all cursor-pointer"
                      style={{ backgroundColor: isSelected ? dominantColor : undefined }}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Static help footer */}
      <div className="mt-2.5 pt-2 border-t border-white/5 text-[9px] text-gray-500 font-sans flex items-center justify-between">
        <span>Integrated Search Network</span>
        <span className="font-mono text-[8px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
          Multi-Source
        </span>
      </div>
    </div>
  );
}

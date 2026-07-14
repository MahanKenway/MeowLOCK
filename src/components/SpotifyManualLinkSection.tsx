import React, { useState, useEffect } from "react";
import { Search, Loader2, Music, Check, ArrowRight } from "lucide-react";
import { SpotifyService, SpotifyTrack } from "../services/SpotifyService";

interface SpotifyManualLinkSectionProps {
  currentTrack: {
    name: string;
    artist: string;
  };
  token: string | undefined;
  onTrackSelected: (track: SpotifyTrack) => void;
}

export default function SpotifyManualLinkSection({
  currentTrack,
  token,
  onTrackSelected
}: SpotifyManualLinkSectionProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate search query with clean track name
  useEffect(() => {
    const cleanName = currentTrack.name
      .replace(/^[0-9]+[\s\-._]+/g, "") // Remove track number prefix
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .trim();
    
    const initialQuery = currentTrack.artist && 
      !["unknown", "lofi study club", "retro beats", "synthwave focus", "local", "system"].some(fake => currentTrack.artist.toLowerCase().includes(fake))
      ? `${cleanName} ${currentTrack.artist}`
      : cleanName;
    
    setQuery(initialQuery);
    if (token) {
      handleSearch(initialQuery);
    }
  }, [currentTrack, token]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !token) return;
    setLoading(true);
    setError(null);
    try {
      const tracks = await SpotifyService.searchTracksRaw(searchQuery, token, 4);
      setResults(tracks);
      if (tracks.length === 0) {
        setError("No matching songs found on Spotify.");
      }
    } catch (err: any) {
      console.error("[SpotifyManualLink] Search error:", err);
      setError("Failed to search Spotify.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-3 p-3 bg-black/40 border border-white/5 rounded-2xl text-left select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 font-bold text-xs">⚠</span>
          <span className="text-[10px] font-bold text-gray-300 tracking-wide">MATCH TRACK ON SPOTIFY</span>
        </div>
        <span className="text-[8px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded font-bold">Manual Link</span>
      </div>

      {/* Input query field */}
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search for song or artist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(query);
            }
          }}
          className="w-full bg-neutral-900/90 border border-white/10 rounded-xl pl-8 pr-16 py-1.5 text-[10px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-all font-sans"
        />
        <Search className="absolute left-2.5 w-3 h-3 text-gray-500" />
        
        <button
          onClick={() => handleSearch(query)}
          disabled={loading}
          className="absolute right-1.5 px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[9px] rounded-lg transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin mx-auto text-black" />
          ) : (
            "SEARCH"
          )}
        </button>
      </div>

      {/* Results or message box */}
      <div className="space-y-1.5 min-h-[100px] flex flex-col justify-center">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span className="text-[9px] text-gray-500">Searching Spotify directory...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center py-4">
            <Music className="w-5 h-5 text-gray-600 opacity-60" />
            <span className="text-[9px] text-gray-500 font-medium">{error}</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-1.5 w-full">
            <p className="text-[8px] font-black text-gray-500 tracking-wider">CHOOSE MATCHING TRACK:</p>
            <div className="space-y-1 max-h-[150px] overflow-y-auto pr-0.5 scrollbar-none">
              {results.map((track) => (
                <div
                  key={track.uri}
                  onClick={() => onTrackSelected(track)}
                  className="flex items-center justify-between p-1.5 rounded-xl bg-white/2 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img
                      src={track.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=40&h=40&fit=crop"}
                      alt={track.name}
                      className="w-7 h-7 rounded-md object-cover border border-white/5 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9.5px] font-bold text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">
                        {track.name}
                      </p>
                      <p className="text-[8px] text-gray-400 truncate leading-normal">
                        {track.artist}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 group-hover:bg-emerald-500 group-hover:text-black text-gray-400 transition-all ml-1.5 shrink-0">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4">
            <Music className="w-5 h-5 text-gray-600 opacity-40 animate-pulse" />
            <span className="text-[9px] text-gray-500 font-medium text-center px-4">
              Enter track details above to match this song manually.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

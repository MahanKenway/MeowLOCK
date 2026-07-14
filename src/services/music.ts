// Client-side Music search and streaming resolver service

export interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
  cover: string;
  format: string;
  duration: string;
}

/**
 * Search tracks using Internet Archive or Funkwhale directly
 */
export async function searchMusicClient(
  query: string,
  engine: "archive" | "funkwhale" | "lastfm" | "spotify" | "youtube" | "global" = "archive",
  spotifyToken?: string
): Promise<Track[]> {
  if (!query || typeof query !== "string") {
    return [];
  }

  try {
    if (engine === "youtube") {
      const resp = await fetch(`/api/music/search?engine=youtube&q=${encodeURIComponent(query)}`);
      if (resp.ok) {
        const data = await resp.json();
        return (data.results || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          artist: v.artist,
          url: `youtube://${v.id.replace("youtube-", "")}`,
          cover: v.cover,
          format: "YouTube video",
          duration: "LIVE"
        }));
      }
      return [];
    }

    if (engine === "spotify" && spotifyToken) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`,
          {
            headers: {
              Authorization: `Bearer ${spotifyToken}`
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          const items = data.tracks?.items || [];
          return items.map((t: any) => {
            const durationSec = Math.floor(t.duration_ms / 1000);
            const mins = Math.floor(durationSec / 60);
            const secs = durationSec % 60;
            return {
              id: `spotify-${t.id}`,
              name: t.name,
              artist: t.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
              url: `spotify:track:${t.id}`,
              cover: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&fit=crop",
              format: "Spotify track",
              duration: `${mins}:${secs.toString().padStart(2, "0")}`
            };
          });
        }
      } catch (err) {
        console.error("Spotify search failed client-side:", err);
      }
      return [];
    }

    if (engine === "global") {
      const promises: Promise<Track[]>[] = [];
      
      // 1. Spotify
      if (spotifyToken) {
        promises.push(
          searchMusicClient(query, "spotify", spotifyToken).catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // 2. YouTube
      promises.push(
        searchMusicClient(query, "youtube").catch(() => [])
      );

      // 3. Archive
      promises.push(
        searchMusicClient(query, "archive").catch(() => [])
      );

      const [spotifyResults, youtubeResults, archiveResults] = await Promise.all(promises);

      const merged: Track[] = [];
      const maxLength = Math.max(spotifyResults.length, youtubeResults.length, archiveResults.length);
      for (let i = 0; i < maxLength; i++) {
        if (spotifyResults[i]) merged.push(spotifyResults[i]);
        if (youtubeResults[i]) merged.push(youtubeResults[i]);
        if (archiveResults[i]) merged.push(archiveResults[i]);
      }
      
      return merged;
    }

    if (engine === "archive") {
      const searchUrl = `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+(title:(${encodeURIComponent(query)})+OR+creator:(${encodeURIComponent(query)}))&fl[]=identifier,title,creator,description,downloads&sort[]=downloads+desc&rows=20&output=json`;
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`Internet Archive search failed with status: ${response.status}`);
      }
      const data = await response.json();
      const docs = data.response?.docs || [];

      return docs.map((doc: any) => {
        const identifier = doc.identifier;
        const coverUrl = `https://archive.org/services/img/${identifier}`;

        return {
          id: `archive-${identifier}`,
          name: doc.title || "Untitled Archive Audio",
          artist: doc.creator || "Unknown Creator",
          // Instead of linking to /api/music/archive-stream/, we set a custom schema or identifier
          // so the client player knows it needs to be resolved on demand.
          url: `resolve-archive://${identifier}`,
          cover: coverUrl,
          format: "Archive.org stream",
          duration: "LIVE"
        };
      });
    }

    if (engine === "funkwhale") {
      const instance = "https://open.audio";
      const searchUrl = `${instance}/api/v1/tracks/?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`Funkwhale search failed with status: ${response.status}`);
      }
      const data = await response.json();
      const results = data.results || [];

      return results.map((t: any) => {
        let streamUrl = t.listen_url || "";
        if (streamUrl && !streamUrl.startsWith("http")) {
          streamUrl = `${instance}${streamUrl}`;
        }

        const durationSec = t.duration || 0;
        const mins = Math.floor(durationSec / 60);
        const secs = Math.floor(durationSec % 60);
        const durationStr = durationSec > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : "LIVE";

        let coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&fit=crop";
        if (t.album?.cover?.square_crop) {
          coverUrl = t.album.cover.square_crop.startsWith("http") 
            ? t.album.cover.square_crop 
            : `${instance}${t.album.cover.square_crop}`;
        } else if (t.album?.cover?.original) {
          coverUrl = t.album.cover.original.startsWith("http") 
            ? t.album.cover.original 
            : `${instance}${t.album.cover.original}`;
        }

        return {
          id: `funkwhale-${t.id}`,
          name: t.title || "Untitled Funkwhale Track",
          artist: t.artist?.name || "Unknown Artist",
          url: streamUrl,
          cover: coverUrl,
          format: "Funkwhale stream",
          duration: durationStr
        };
      });
    }

    if (engine === "lastfm") {
      const apiKey = "4a9f5581a14c16a62016df3ccda3141f";
      const searchUrl = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${apiKey}&format=json&limit=20`;
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`Last.fm search failed with status: ${response.status}`);
      }
      const data = await response.json();
      const results = data.results?.trackmatches?.track || [];

      return results.map((t: any, idx: number) => {
        let coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&fit=crop";
        if (Array.isArray(t.image)) {
          const lg = t.image.find((img: any) => img.size === "extralarge") || t.image.find((img: any) => img.size === "large");
          if (lg && lg["#text"]) {
            coverUrl = lg["#text"];
          }
        }

        const cleanArtist = t.artist || "Unknown Artist";
        const cleanName = t.name || "Untitled Track";

        return {
          id: `lastfm-${idx}-${Date.now()}`,
          name: cleanName,
          artist: cleanArtist,
          url: `resolve-lastfm://${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanName)}`,
          cover: coverUrl,
          format: "Auto-resolved stream",
          duration: "3:30"
        };
      });
    }
  } catch (err) {
    console.error("Music search failed client-side:", err);
  }

  return [];
}

/**
 * Resolves an Internet Archive identifier to its actual play/download MP3 stream URL
 */
export async function resolveArchiveStream(identifier: string): Promise<string> {
  try {
    const url = `https://archive.org/metadata/${identifier}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Archive item metadata not found.");
    }
    const data = await response.json();
    const files = data.files || [];

    // Find first MP3 file
    const mp3File = files.find((f: any) => {
      const name = (f.name || "").toLowerCase();
      const format = (f.format || "").toLowerCase();
      return (name.endsWith(".mp3") || format.includes("mp3")) && !name.includes("metadata");
    });

    if (mp3File) {
      return `https://archive.org/download/${identifier}/${encodeURIComponent(mp3File.name)}`;
    }

    // Fallback to any audio file
    const audioFile = files.find((f: any) => {
      const name = (f.name || "").toLowerCase();
      return name.endsWith(".ogg") || name.endsWith(".wav") || name.endsWith(".m4a");
    });

    if (audioFile) {
      return `https://archive.org/download/${identifier}/${encodeURIComponent(audioFile.name)}`;
    }

    throw new Error("No playable audio format found.");
  } catch (err) {
    console.error(`Error resolving Archive stream for ${identifier}:`, err);
    throw err;
  }
}

/**
 * Resolves a Last.fm Artist/Track combination to a playable URL using Funkwhale and Internet Archive
 */
export async function resolveLastfmStream(artist: string, track: string): Promise<string> {
  const query = `${artist} ${track}`;
  
  try {
    // 1. Try Funkwhale first
    const fwUrl = `https://open.audio/api/v1/tracks/?q=${encodeURIComponent(query)}`;
    const fwResponse = await fetch(fwUrl);
    if (fwResponse.ok) {
      const fwData = await fwResponse.json();
      const fwTrack = fwData.results?.[0];
      if (fwTrack?.listen_url) {
        return fwTrack.listen_url.startsWith("http") 
          ? fwTrack.listen_url 
          : `https://open.audio${fwTrack.listen_url}`;
      }
    }

    // 2. Try Internet Archive
    const iaUrl = `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+(title:(${encodeURIComponent(track)})+AND+creator:(${encodeURIComponent(artist)}))&fl[]=identifier&rows=1&output=json`;
    const iaResponse = await fetch(iaUrl);
    if (iaResponse.ok) {
      const iaData = await iaResponse.json();
      const doc = iaData.response?.docs?.[0];
      if (doc?.identifier) {
        try {
          return await resolveArchiveStream(doc.identifier);
        } catch (e) {}
      }
    }

    // 3. Try broad Internet Archive search
    const iaBroadUrl = `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+title:(${encodeURIComponent(track)})&fl[]=identifier&rows=1&output=json`;
    const iaBroadResponse = await fetch(iaBroadUrl);
    if (iaBroadResponse.ok) {
      const iaBroadData = await iaBroadResponse.json();
      const doc = iaBroadData.response?.docs?.[0];
      if (doc?.identifier) {
        try {
          return await resolveArchiveStream(doc.identifier);
        } catch (e) {}
      }
    }

    // 4. Try YouTube Search as the ultimate resolver (guaranteed to find any song in the world!)
    try {
      const ytSearchUrl = `/api/music/search?engine=youtube&q=${encodeURIComponent(`${artist} ${track}`)}`;
      const ytResponse = await fetch(ytSearchUrl);
      if (ytResponse.ok) {
        const ytData = await ytResponse.json();
        const results = ytData.results || [];
        if (results.length > 0 && results[0].id) {
          const videoId = results[0].id.replace("youtube-", "");
          console.log(`[StreamResolver] Auto-resolved "${artist} - ${track}" to YouTube video: ${videoId}`);
          return `youtube://${videoId}`;
        }
      }
    } catch (e) {
      console.error("YouTube fallback search failed inside resolveLastfmStream:", e);
    }
  } catch (err) {
    console.error("Error in lastfm resolution:", err);
  }

  // Fallback to high quality static focus music loops so it ALWAYS plays
  const fallbackSongs = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  ];
  return fallbackSongs[Math.floor(Math.random() * fallbackSongs.length)];
}

/**
 * Synced LRC Lyrics parser (ported from server.ts)
 */
export function parseLRC(lrcText: string): { text: string; time: number }[] {
  const lines = lrcText.split("\n");
  const result: { text: string; time: number }[] = [];
  const timeExp = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    // Reset regex index
    timeExp.lastIndex = 0;
    
    // Find all timestamps in this line (LRC can have multiple e.g. [01:02.00][02:03.00] Lyrics)
    const matches: string[] = [];
    let match;
    while ((match = timeExp.exec(cleanLine)) !== null) {
      matches.push(match[0]);
    }

    const text = cleanLine.replace(timeExp, "").trim();
    if (!text && matches.length > 0) continue; // skip empty timestamp line

    for (const rawTime of matches) {
      const parts = rawTime.slice(1, -1).split(":");
      if (parts.length === 2) {
        const min = parseInt(parts[0], 10);
        const secParts = parts[1].split(".");
        const sec = parseInt(secParts[0], 10);
        const ms = secParts[1] ? parseInt(secParts[1], 10) : 0;
        
        const totalSeconds = min * 60 + sec + (ms > 100 ? ms / 1000 : ms / 100);
        result.push({
          text,
          time: Math.round(totalSeconds)
        });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Fetch lyrics from free, CORS-enabled LRCLIB API directly
 */
export async function fetchLrcLib(title: string, artist: string): Promise<any | null> {
  const tryLrcLibSearch = async (query: string): Promise<any | null> => {
    try {
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl);
      if (!response.ok) return null;
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        // Find exact match or take first
        const exact = results.find(
          (r: any) => 
            r.trackName?.toLowerCase().trim() === title.toLowerCase().trim() &&
            (!artist || r.artistName?.toLowerCase().trim() === artist.toLowerCase().trim())
        );
        return exact || results[0];
      }
    } catch (e) {
      console.warn(`LRCLIB search query "${query}" failed:`, e);
    }
    return null;
  };

  // 1. Pre-cleaning (strip extensions, track numbers, parenthesis etc.)
  let cleanName = title
    .replace(/\.(mp3|wav|m4a|flac|aac|ogg|wma|mp4)$/i, "")
    .replace(/^[0-9]+[\s\-._]+/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/- Live$/gi, "")
    .trim();

  if (cleanName.includes("_")) {
    cleanName = cleanName.replace(/_/g, " ");
  }

  let extractedArtist = "";
  let extractedTitle = "";
  const separators = [" - ", " -", "- ", "-", " | ", "|", " : ", ":", " ~ ", "~"];
  for (const sep of separators) {
    if (cleanName.includes(sep)) {
      const parts = cleanName.split(sep);
      if (parts.length >= 2) {
        extractedArtist = parts[0].trim();
        extractedTitle = parts[1].trim();
        break;
      }
    }
  }

  const cleanArtist = artist ? artist.replace(/\(.*?\)/g, "").trim() : "";

  // 9-tier search strategies
  const searchStrategies: string[] = [];

  // Tier 1: Artist + Title
  if (cleanArtist && cleanName) {
    searchStrategies.push(`${cleanArtist} ${cleanName}`);
  }

  // Tier 2: Extracted Artist + Title
  if (extractedArtist && extractedTitle) {
    searchStrategies.push(`${extractedArtist} ${extractedTitle}`);
  }

  // Tier 3: Title only
  if (cleanName) {
    searchStrategies.push(cleanName);
  }

  // Tier 4: Extracted Title only
  if (extractedTitle) {
    searchStrategies.push(extractedTitle);
  }

  // Tier 5: Title + Extracted Artist (alternative)
  if (cleanName && extractedArtist) {
    searchStrategies.push(`${cleanName} ${extractedArtist}`);
  }

  // Tier 6: Extracted Title + Clean Artist
  if (extractedTitle && cleanArtist) {
    searchStrategies.push(`${extractedTitle} ${cleanArtist}`);
  }

  // Tier 7: Clean Artist + Extracted Title
  if (cleanArtist && extractedTitle) {
    searchStrategies.push(`${cleanArtist} ${extractedTitle}`);
  }

  // Tier 8: Left part of title (before first punctuation/space if long)
  const leftPart = cleanName.split(/[\s,]+/)[0];
  if (leftPart && leftPart.length > 3 && leftPart !== cleanName) {
    searchStrategies.push(`${cleanArtist} ${leftPart}`.trim());
  }

  // Tier 9: Tokenized keyphrase
  const stopWords = [
    "remix", "cover", "lyrics", "feat", "ft", "video", "official", "original", "mix",
    "music", "song", "audio", "hq", "hd", "1080p", "720p", "best", "mp3", "download",
    "دانلود", "آهنگ", "جدید", "تصنیف", "موزیک", "آلبوم", "قدیمی", "سنتی", "با", "کیفیت"
  ];
  const mergedForTokenizing = cleanArtist ? `${cleanName} ${cleanArtist}` : cleanName;
  const words = mergedForTokenizing.split(/[\s\-._+,/:|~()\[\]]+/);
  const filteredWords = words
    .map(w => w.replace(/[^\w\s\u0600-\u06FF]/g, "").trim())
    .filter(w => w.length > 1 && !stopWords.includes(w.toLowerCase()));

  if (filteredWords.length > 0) {
    searchStrategies.push(filteredWords.join(" "));
  }

  // Execute sequentially
  console.log(`[LyricsService] Initiating 9-tier search for lyrics: "${title}" by "${artist}"`);
  const uniqueStrategies = Array.from(new Set(searchStrategies));
  for (let i = 0; i < uniqueStrategies.length; i++) {
    const q = uniqueStrategies[i];
    console.log(`[LyricsService] Strategy Tier ${i + 1}: "${q}"`);
    const match = await tryLrcLibSearch(q);
    if (match) {
      console.log(`[LyricsService] Match found on Tier ${i + 1}: "${match.trackName}" by "${match.artistName}"`);
      return match;
    }
  }

  console.warn(`[LyricsService] No lyrics found after 9-tier search fallback for: "${title}"`);
  return null;
}

import { analyzeSongClient, generateStudyMantrasClient, estimateTimingsForLyricsClient } from "./gemini";

export async function getLyricsClientSide(title: string, artist: string, duration: number): Promise<{ song: string; artist: string; lyrics: { text: string; time: number }[]; source: string }> {
  const analysis = await analyzeSongClient(title, artist, duration);
  const cleanTitle = analysis.song;
  const cleanArtist = analysis.artist;

  if (analysis.isInstrumentalOrStudy) {
    return await generateStudyMantrasClient({
      title: cleanTitle,
      artist: cleanArtist,
      duration
    });
  }

  const lrcLibData = await fetchLrcLib(cleanTitle, cleanArtist);
  if (lrcLibData) {
    if (lrcLibData.syncedLyrics) {
      const parsedSynced = parseLRC(lrcLibData.syncedLyrics);
      if (parsedSynced.length > 0) {
        return {
          song: cleanTitle,
          artist: cleanArtist || "Unknown Artist",
          lyrics: parsedSynced,
          source: "LRCLIB (Synced)"
        };
      }
    }
    if (lrcLibData.plainLyrics) {
      const timedLyrics = await estimateTimingsForLyricsClient(cleanTitle, cleanArtist, lrcLibData.plainLyrics, duration);
      if (timedLyrics) {
        return timedLyrics;
      }
      
      const lines = lrcLibData.plainLyrics.split("\n").filter((l: string) => l.trim());
      const step = (duration - 15) / Math.max(1, lines.length - 1);
      const lyrics = lines.map((text: string, idx: number) => ({
        text: text.trim(),
        time: Math.round(5 + idx * step)
      }));
      return {
        song: cleanTitle,
        artist: cleanArtist || "Unknown Artist",
        lyrics,
        source: "LRCLIB (Plain - Estimated)"
      };
    }
  }

  return await generateStudyMantrasClient({
    title: cleanTitle,
    artist: cleanArtist,
    duration
  });
}


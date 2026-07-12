interface SpotifyTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function getSpotifyAuthUrl(origin: string): Promise<string> {
  const resp = await fetch(`/api/auth/spotify/url?origin=${encodeURIComponent(origin)}`);
  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(data.error || "Failed to fetch Spotify auth URL.");
  }
  const { url } = await resp.json();
  return url;
}

export async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const resp = await fetch("/api/auth/spotify/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if (!resp.ok) {
    throw new Error("Failed to refresh Spotify session.");
  }

  return resp.json();
}

export interface SpotifyTrack {
  uri: string;
  name: string;
  artist: string;
  coverUrl: string;
  durationMs: number;
}

export async function searchSpotifyTrack(
  trackName: string,
  trackArtist: string,
  accessToken: string
): Promise<SpotifyTrack | null> {
  if (!trackName || trackName === "No Track Loaded") return null;

  // Clean track name and artist of common noise to improve search match accuracy
  const cleanName = trackName
    .replace(/\(.*?\)/g, "") // Remove parentheses contents like (Remastered), (Live)
    .replace(/\[.*?\]/g, "") // Remove brackets contents
    .replace(/- Live$/gi, "")
    .replace(/- Remastered$/gi, "")
    .trim();

  const cleanArtist = trackArtist && trackArtist !== "Local" && trackArtist !== "System"
    ? trackArtist.replace(/\(.*?\)/g, "").trim()
    : "";

  let query = `track:${cleanName}`;
  if (cleanArtist) {
    query += ` artist:${cleanArtist}`;
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (response.status === 401) {
      throw new Error("SPOTIFY_UNAUTHORIZED");
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const tracks = data.tracks?.items;

    if (tracks && tracks.length > 0) {
      const t = tracks[0];
      return {
        uri: t.uri,
        name: t.name,
        artist: t.artists?.map((a: any) => a.name).join(", ") || "",
        coverUrl: t.album?.images?.[0]?.url || "",
        durationMs: t.duration_ms
      };
    }
  } catch (err: any) {
    if (err.message === "SPOTIFY_UNAUTHORIZED") {
      throw err;
    }
    console.error("Spotify search failed:", err);
  }

  // Fallback broad search if specific field search yielded no results
  try {
    const queryBroad = `${cleanName} ${cleanArtist}`.trim();
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(queryBroad)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const tracks = data.tracks?.items;

    if (tracks && tracks.length > 0) {
      const t = tracks[0];
      return {
        uri: t.uri,
        name: t.name,
        artist: t.artists?.map((a: any) => a.name).join(", ") || "",
        coverUrl: t.album?.images?.[0]?.url || "",
        durationMs: t.duration_ms
      };
    }
  } catch (e) {
    console.error("Spotify broad search failed:", e);
  }

  return null;
}

export async function playSpotifyTrack(
  trackUri: string,
  deviceId: string | null,
  accessToken: string
): Promise<boolean> {
  try {
    const url = deviceId 
      ? `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`
      : "https://api.spotify.com/v1/me/player/play";

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uris: [trackUri]
      })
    });

    if (response.status === 401) {
      throw new Error("SPOTIFY_UNAUTHORIZED");
    }

    return response.ok;
  } catch (err: any) {
    if (err.message === "SPOTIFY_UNAUTHORIZED") {
      throw err;
    }
    console.error("Spotify play request failed:", err);
    return false;
  }
}

export async function pauseSpotifyPlayback(
  deviceId: string | null,
  accessToken: string
): Promise<boolean> {
  try {
    const url = deviceId 
      ? `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`
      : "https://api.spotify.com/v1/me/player/pause";

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (response.status === 401) {
      throw new Error("SPOTIFY_UNAUTHORIZED");
    }

    return response.ok;
  } catch (err: any) {
    if (err.message === "SPOTIFY_UNAUTHORIZED") {
      throw err;
    }
    console.error("Spotify pause request failed:", err);
    return false;
  }
}

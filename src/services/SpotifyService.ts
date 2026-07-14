export interface SpotifyTrack {
  uri: string;
  name: string;
  artist: string;
  coverUrl: string;
  durationMs: number;
}

export interface SpotifyTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class SpotifyService {
  private static isConfiguredCache: boolean | null = null;

  /**
   * Checks if SPOTIFY_CLIENT_ID is configured on the backend.
   * If it is not configured, it returns false.
   */
  static async checkConfiguration(origin: string): Promise<boolean> {
    if (this.isConfiguredCache !== null) {
      return this.isConfiguredCache;
    }
    try {
      const resp = await fetch(`/api/auth/spotify/url?origin=${encodeURIComponent(origin)}`);
      if (resp.status === 500) {
        const data = await resp.json().catch(() => ({}));
        if (data.error && data.error.includes("SPOTIFY_CLIENT_ID")) {
          this.isConfiguredCache = false;
          return false;
        }
      }
      if (resp.ok) {
        this.isConfiguredCache = true;
        return true;
      }
      return false;
    } catch (e) {
      console.error("[SpotifyService] Error checking backend configuration:", e);
      return false;
    }
  }

  /**
   * Safely gets the authorization URL.
   */
  static async getAuthUrl(origin: string): Promise<string | null> {
    try {
      const resp = await fetch(`/api/auth/spotify/url?origin=${encodeURIComponent(origin)}`);
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        console.warn("[SpotifyService] Failed to fetch Spotify authorization URL:", data.error || resp.statusText);
        return null;
      }
      const { url } = await resp.json();
      return url;
    } catch (err) {
      console.error("[SpotifyService] getAuthUrl failed with unhandled exception:", err);
      return null;
    }
  }

  /**
   * Safely refreshes the access token.
   */
  static async refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse | null> {
    if (!refreshToken) return null;
    try {
      const resp = await fetch("/api/auth/spotify/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        console.warn("[SpotifyService] Token refresh failed:", data.error || resp.statusText);
        return null;
      }

      return await resp.json();
    } catch (err) {
      console.error("[SpotifyService] Token refresh failed with exception:", err);
      return null;
    }
  }

  /**
   * Searches for a track on Spotify securely.
   */
  static async searchTrack(
    trackName: string,
    trackArtist: string,
    accessToken: string
  ): Promise<SpotifyTrack | null> {
    if (!trackName || trackName === "No Track Loaded" || !accessToken) return null;

    // Clean track name and artist of common noise to improve search match accuracy
    const cleanName = trackName
      .replace(/^[0-9]+[\s\-._]+/g, "") // Remove leading track numbers like "10 - ", "01. ", "02 "
      .replace(/\(.*?\)/g, "") // Remove parentheses contents like (Remastered), (Live)
      .replace(/\[.*?\]/g, "") // Remove brackets contents
      .replace(/- Live$/gi, "")
      .replace(/- Remastered$/gi, "")
      .trim();

    const FAKE_ARTISTS = [
      "lofi study club",
      "retro beats",
      "synthwave focus",
      "classical dreams",
      "indie, folk & chill alternative",
      "underground, post-punk & rock",
      "sensuous shoegaze & dream pop",
      "unknown artist",
      "unknown",
      "local",
      "system"
    ];

    const isFakeArtist = trackArtist && FAKE_ARTISTS.some(fake => trackArtist.toLowerCase().includes(fake));

    const cleanArtist = trackArtist && !isFakeArtist
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
      console.error("[SpotifyService] Search failed:", err);
    }

    // Fallback broad search if specific field search yielded no results
    try {
      const queryBroad = cleanArtist ? `${cleanName} ${cleanArtist}`.trim() : cleanName;
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(queryBroad)}&type=track&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (response.status === 401) {
        throw new Error("SPOTIFY_UNAUTHORIZED");
      }

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
    } catch (err: any) {
      if (err.message === "SPOTIFY_UNAUTHORIZED") {
        throw err;
      }
      console.error("[SpotifyService] Broad search failed:", err);
    }

    return null;
  }

  /**
   * Searches for tracks by a raw text query on Spotify.
   */
  static async searchTracksRaw(
    query: string,
    accessToken: string,
    limit = 5
  ): Promise<SpotifyTrack[]> {
    if (!query || !accessToken) return [];
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (response.status === 401) {
        throw new Error("SPOTIFY_UNAUTHORIZED");
      }

      if (!response.ok) return [];

      const data = await response.json();
      const items = data.tracks?.items || [];
      return items.map((t: any) => ({
        uri: t.uri,
        name: t.name,
        artist: t.artists?.map((a: any) => a.name).join(", ") || "",
        coverUrl: t.album?.images?.[0]?.url || "",
        durationMs: t.duration_ms
      }));
    } catch (err: any) {
      if (err.message === "SPOTIFY_UNAUTHORIZED") {
        throw err;
      }
      console.error("[SpotifyService] Raw search failed:", err);
      return [];
    }
  }

  /**
   * Sends play command to Spotify API.
   */
  static async playTrack(
    trackUri: string,
    deviceId: string | null,
    accessToken: string
  ): Promise<boolean> {
    if (!accessToken || !trackUri) return false;
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
      console.error("[SpotifyService] Play request failed:", err);
      return false;
    }
  }

  /**
   * Sends pause command to Spotify API.
   */
  static async pausePlayback(
    deviceId: string | null,
    accessToken: string
  ): Promise<boolean> {
    if (!accessToken) return false;
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
      console.error("[SpotifyService] Pause request failed:", err);
      return false;
    }
  }

  /**
   * Initializes and wraps the Spotify Web Playback SDK Player inside a try-catch sandbox.
   * Listens to the necessary player events and prevents uncaught errors from crashing.
   */
  static createSilentPlayer(
    accessTokenFetcher: () => Promise<string | null>,
    onReady: (deviceId: string) => void,
    onNotReady: () => void,
    onAuthError: () => void,
    onAccountError: (message: string) => void,
    onInitError: (message: string) => void
  ): any {
    if (!(window as any).Spotify) {
      console.warn("[SpotifyService] Spotify Web Playback SDK script is not available in window.");
      return null;
    }

    try {
      const player = new (window as any).Spotify.Player({
        name: "Zen Workspace Silent Player",
        getOAuthToken: async (cb: any) => {
          try {
            const token = await accessTokenFetcher();
            cb(token || "");
          } catch (e) {
            console.error("[SpotifyService] Error in SDK getOAuthToken:", e);
            cb("");
          }
        },
        volume: 0 // silent playback
      });

      player.addListener("ready", ({ device_id }: any) => {
        try {
          onReady(device_id);
        } catch (e) {
          console.error("[SpotifyService] Error inside ready callback:", e);
        }
      });

      player.addListener("not_ready", ({ device_id }: any) => {
        try {
          onNotReady();
        } catch (e) {
          console.error("[SpotifyService] Error inside not_ready callback:", e);
        }
      });

      player.addListener("initialization_error", ({ message }: any) => {
        try {
          onInitError(message);
        } catch (e) {
          console.error("[SpotifyService] Error inside initialization_error callback:", e);
        }
      });

      player.addListener("authentication_error", ({ message }: any) => {
        try {
          onAuthError();
        } catch (e) {
          console.error("[SpotifyService] Error inside authentication_error callback:", e);
        }
      });

      player.addListener("account_error", ({ message }: any) => {
        try {
          onAccountError(message);
        } catch (e) {
          console.error("[SpotifyService] Error inside account_error callback:", e);
        }
      });

      player.connect().then((success: boolean) => {
        if (!success) {
          console.warn("[SpotifyService] Connect call returned false.");
        }
      }).catch((err: any) => {
        console.error("[SpotifyService] Error connecting silent player:", err);
      });

      return player;
    } catch (err) {
      console.error("[SpotifyService] Unhandled error during Spotify.Player initialization:", err);
      return null;
    }
  }

  /**
   * Sends a periodic activity heartbeat status update to the backend api route.
   * Gracefully handles cases where SPOTIFY_CLIENT_ID is not configured by returning a 'Disconnected' state.
   */
  static async sendHeartbeat(payload: {
    trackName: string;
    artist: string;
    isPlaying: boolean;
    mode: string;
    deviceId: string | null;
    token: string;
    origin: string;
  }): Promise<{ status: string; message: string }> {
    const isConfigured = await this.checkConfiguration(payload.origin);
    if (!isConfigured) {
      return { status: "Disconnected", message: "Spotify integration is not configured on the server." };
    }

    try {
      const response = await fetch("/api/spotify/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${payload.token}`
        },
        body: JSON.stringify({
          trackName: payload.trackName,
          artist: payload.artist,
          isPlaying: payload.isPlaying,
          mode: payload.mode,
          deviceId: payload.deviceId,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("SPOTIFY_UNAUTHORIZED");
        }
        return { status: "Error", message: `Heartbeat endpoint returned status ${response.status}` };
      }

      const data = await response.json();
      return { status: data.status || "success", message: data.message || "Heartbeat sent successfully" };
    } catch (err: any) {
      if (err.message === "SPOTIFY_UNAUTHORIZED") {
        throw err;
      }
      console.error("[SpotifyService] Heartbeat proxy failed:", err);
      return { status: "Error", message: err.message || "Unknown error during heartbeat" };
    }
  }
}

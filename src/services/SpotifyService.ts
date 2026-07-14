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
  private static cachedClientId: string | null = null;

  /**
   * Checks if cryptographic subtle is available in the current browser context.
   */
  static hasSubtleCrypto(): boolean {
    return !!(window.crypto && window.crypto.subtle);
  }

  /**
   * Dynamically constructs the redirect URI that is used for authorization and exchange,
   * supporting local dev, Cloud Run previews, and custom/GitHub Pages static URLs.
   */
  static getRedirectUri(): string {
    if (window.location.hostname.includes("github.io")) {
      return window.location.origin + window.location.pathname;
    }
    return `${window.location.origin}/auth/spotify/callback`;
  }

  /**
   * Generates a high-entropy cryptographically secure random code verifier for PKCE.
   */
  static generateCodeVerifier(): string {
    const array = new Uint8Array(44);
    window.crypto.getRandomValues(array);
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let verifier = "";
    for (let i = 0; i < array.length; i++) {
      verifier += possible.charAt(array[i] % possible.length);
    }
    return verifier;
  }

  /**
   * Generates a SHA-256 PKCE code challenge from a verifier. Falls back to "plain" text challenge
   * if Web Crypto is unavailable.
   */
  static async generateCodeChallenge(codeVerifier: string): Promise<string> {
    if (!this.hasSubtleCrypto()) {
      console.warn("[SpotifyService] Crypto Subtle not available, returning plain verifier as challenge");
      return codeVerifier;
    }
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      
      const bytes = new Uint8Array(digest);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    } catch (err) {
      console.error("[SpotifyService] Error generating challenge, falling back to plain:", err);
      return codeVerifier;
    }
  }

  /**
   * Exposes or retrieves the Spotify Client ID securely from the backend or client-side env.
   */
  static async getClientId(): Promise<string | null> {
    if (import.meta.env.VITE_SPOTIFY_CLIENT_ID) {
      return import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    }
    if (this.cachedClientId) {
      return this.cachedClientId;
    }
    try {
      const resp = await fetch("/api/auth/spotify/client-id");
      if (resp.ok) {
        const data = await resp.json();
        this.cachedClientId = data.clientId || null;
        return this.cachedClientId;
      }
    } catch (e) {
      console.error("[SpotifyService] Failed to fetch client ID from backend:", e);
    }
    return null;
  }

  /**
   * Exchanges an authorization code and verifier for access & refresh tokens on the client side.
   */
  static async exchangeCodeWithPkce(
    code: string,
    codeVerifier: string,
    redirectUri: string,
    clientId: string
  ): Promise<SpotifyTokenResponse | null> {
    try {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
      });

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[SpotifyService] PKCE Token exchange failed:", errorText);
        return null;
      }

      const tokenData = await response.json();
      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || "",
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
      };
    } catch (err) {
      console.error("[SpotifyService] PKCE token exchange exception:", err);
      return null;
    }
  }

  /**
   * Checks if SPOTIFY_CLIENT_ID is configured on the backend.
   * If it is not configured, it returns false.
   */
  static async checkConfiguration(origin: string): Promise<boolean> {
    const clientId = await this.getClientId();
    if (clientId) {
      this.isConfiguredCache = true;
      return true;
    }
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
   * Safely refreshes the access token via PKCE or server-side fallback.
   */
  static async refreshAccessToken(refreshToken: string, clientId: string): Promise<SpotifyTokenResponse | null> {
    if (!refreshToken) return null;
    try {
      // 1. Try client-side PKCE refresh first
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId
      });

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      });

      if (response.ok) {
        const tokenData = await response.json();
        return {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || refreshToken,
          expiresAt: Date.now() + (tokenData.expires_in * 1000)
        };
      }

      console.warn("[SpotifyService] Client-side token refresh failed, trying server-side proxy fallback...");

      // 2. Fall back to server-side proxy
      const resp = await fetch("/api/auth/spotify/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        console.warn("[SpotifyService] Server-side token refresh failed:", data.error || resp.statusText);
        return null;
      }

      return await resp.json();
    } catch (err) {
      console.error("[SpotifyService] Token refresh failed with exception:", err);
      return null;
    }
  }

  /**
   * Searches for a track on Spotify securely using a highly resilient multi-stage fallback system.
   */
  static async searchTrack(
    trackName: string,
    trackArtist: string,
    accessToken: string
  ): Promise<SpotifyTrack | null> {
    if (!trackName || trackName === "No Track Loaded" || !accessToken) return null;

    // Helper to execute a single search query against the Spotify API
    const tryQuery = async (q: string): Promise<SpotifyTrack | null> => {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`,
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
        console.error(`[SpotifyService] Query "${q}" failed:`, err);
      }
      return null;
    };

    // 1. Initial pre-cleaning of the track title (remove file extensions, numbers, parenthetical noise)
    let cleanName = trackName
      .replace(/\.(mp3|wav|m4a|flac|aac|ogg|wma|mp4)$/i, "") // Strip common media extensions
      .replace(/^[0-9]+[\s\-._]+/g, "") // Remove leading track numbers (e.g., "01 - ", "12. ")
      .replace(/\(.*?\)/g, "") // Remove parentheses contents like (Remastered), (Live)
      .replace(/\[.*?\]/g, "") // Remove brackets contents
      .replace(/- Live$/gi, "")
      .replace(/- Remastered$/gi, "")
      .trim();

    // Replace underscores with spaces (very common in local filenames)
    if (cleanName.includes("_")) {
      cleanName = cleanName.replace(/_/g, " ");
    }

    // 2. Identify potential Artist and Title embedded in the song title itself via separators
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

    // 3. Clean and validate artist
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

    // 4. Construct list of search configurations to execute sequentially (best match to broadest match)
    const searchStrategies: { name: string; query: string }[] = [];

    // Tier 1: Strict metadata field search
    if (cleanArtist) {
      searchStrategies.push({
        name: "Tier 1: Strict metadata",
        query: `track:${cleanName} artist:${cleanArtist}`
      });
    }

    // Tier 2: Strict extracted metadata field search
    if (extractedArtist && extractedTitle) {
      searchStrategies.push({
        name: "Tier 2: Extracted metadata",
        query: `track:${extractedTitle} artist:${extractedArtist}`
      });
    }

    // Tier 3: Strict title field search
    searchStrategies.push({
      name: "Tier 3: Strict title",
      query: `track:${cleanName}`
    });

    // Tier 4: Strict extracted title field search
    if (extractedTitle) {
      searchStrategies.push({
        name: "Tier 4: Strict extracted title",
        query: `track:${extractedTitle}`
      });
    }

    // Tier 5: Broad keyword search (Title + Artist)
    if (cleanArtist) {
      searchStrategies.push({
        name: "Tier 5: Broad Title + Artist",
        query: `${cleanName} ${cleanArtist}`.trim()
      });
    }

    // Tier 6: Broad extracted keyword search (Extracted Title + Extracted Artist)
    if (extractedArtist && extractedTitle) {
      searchStrategies.push({
        name: "Tier 6: Broad Extracted Title + Artist",
        query: `${extractedArtist} ${extractedTitle}`.trim()
      });
    }

    // Tier 7: Broad Title search
    searchStrategies.push({
      name: "Tier 7: Broad Title only",
      query: cleanName
    });

    // Tier 8: Broad extracted Title search
    if (extractedTitle) {
      searchStrategies.push({
        name: "Tier 8: Broad extracted Title only",
        query: extractedTitle
      });
    }

    // Tier 9: Tokenized key-phrase keyword search (Persian/English stop-word and noise filtering)
    const stopWords = [
      "remix", "cover", "lyrics", "feat", "ft", "video", "official", "original", "mix",
      "music", "song", "audio", "hq", "hd", "1080p", "720p", "best", "mp3", "download",
      "دانلود", "آهنگ", "جدید", "تصنیف", "موزیک", "آلبوم", "قدیمی", "سنتی", "با", "کیفیت"
    ];
    const mergedForTokenizing = cleanArtist ? `${cleanName} ${cleanArtist}` : cleanName;
    const words = mergedForTokenizing.split(/[\s\-._+,/:|~()\[\]]+/);
    const filteredWords = words
      .map(w => w.replace(/[^\w\s\u0600-\u06FF]/g, "").trim()) // keep alpha characters + Persian/Arabic Unicode blocks
      .filter(w => w.length > 1 && !stopWords.includes(w.toLowerCase()));

    if (filteredWords.length > 0) {
      searchStrategies.push({
        name: "Tier 9: Tokenized key-phrase search",
        query: filteredWords.join(" ")
      });
    }

    // 5. Execute search strategies sequentially until a valid match is found
    console.log(`[SpotifyService] Initiating multi-tier search for track: "${trackName}" (${trackArtist || "Unknown Artist"})`);
    for (const strategy of searchStrategies) {
      console.log(`[SpotifyService] Trying ${strategy.name}: "${strategy.query}"`);
      const match = await tryQuery(strategy.query);
      if (match) {
        console.log(`[SpotifyService] Found match with ${strategy.name}: "${match.name}" by "${match.artist}" (URI: ${match.uri})`);
        return match;
      }
    }

    console.warn(`[SpotifyService] All search tiers exhausted. No match found for track: "${trackName}"`);
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

// Client-side NASA APOD API service

export interface APODData {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: "image" | "video";
  copyright?: string;
}

const DEFAULT_NASA_KEY = "8jJgk4CQmPvzmmyuxwwSQKyGam7IbwHhTxCkCBVu";

export function getNasaApiKey(): string {
  const saved = localStorage.getItem("NASA_API_KEY") || localStorage.getItem("zen_nasa_api_key");
  if (saved) return saved.trim();
  return DEFAULT_NASA_KEY;
}

export function saveNasaApiKey(key: string) {
  if (key) {
    localStorage.setItem("zen_nasa_api_key", key.trim());
  } else {
    localStorage.removeItem("zen_nasa_api_key");
  }
}

export function sanitizeAPODData(entry: any): APODData {
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
}

export async function fetchAPODClient(date: string): Promise<APODData> {
  const cacheKey = `zen_space_cache_${date}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return sanitizeAPODData(JSON.parse(cached));
    } catch (e) {
      console.warn("Error parsing cached APOD", e);
    }
  }

  const apiKey = getNasaApiKey();
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NASA API returned error: ${response.status} ${response.statusText}`);
  }

  const rawData = await response.json();
  const data = sanitizeAPODData(rawData);

  // Cache results locally
  localStorage.setItem(cacheKey, JSON.stringify(data));
  const todayStr = new Date().toISOString().split("T")[0];
  if (date === todayStr) {
    localStorage.setItem("zen_space_cache_latest", JSON.stringify(data));
  }

  return data;
}

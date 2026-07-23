import { GoogleGenAI, Modality, Type, GenerateVideosOperation } from "@google/genai";

// Helpers to get API Key securely in static client-side environment
export function getGeminiApiKey(): string {
  const saved = localStorage.getItem("GEMINI_API_KEY") || localStorage.getItem("zen_gemini_api_key");
  if (saved) return saved.trim();
  // Support compile-time injected key if available as standard for static site configurations
  const envKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || "";
  return envKey.trim();
}

export function hasGeminiApiKey(): boolean {
  return !!getGeminiApiKey();
}

export function saveGeminiApiKey(key: string) {
  if (key) {
    localStorage.setItem("zen_gemini_api_key", key.trim());
  } else {
    localStorage.removeItem("zen_gemini_api_key");
  }
}

// Client factory - completely deactivated per user instruction to remove AI
export function getGeminiClient(): GoogleGenAI | null {
  return null;
}

/**
 * Client-Side Image Generation
 */
export async function generateImageClient(params: {
  prompt: string;
  size?: string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  model?: string;
}): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini API Key is not configured. Please add your key in Settings.");
  }

  const selectedModel = params.model || "gemini-3.1-flash-image";
  const ratio = params.aspectRatio || "16:9";
  const size = params.size || "1K";

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [{ text: params.prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: ratio,
          imageSize: size as any,
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData?.data) {
      // Find any text part to see if there's an error message
      const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
      throw new Error(textPart?.text || "No image data was returned by the model.");
    }

    return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
  } catch (err: any) {
    console.error("Client-side image generation failed:", err);
    throw new Error(err.message || "Failed to generate image.");
  }
}

/**
 * Client-Side Video Generation (Veo)
 */
export async function generateVideoClient(params: {
  prompt?: string;
  base64Image?: string;
  mimeType?: string;
  aspectRatio?: "16:9" | "9:16";
}): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini API Key is not configured. Please add your key in Settings.");
  }

  try {
    const config: any = {
      numberOfVideos: 1,
      resolution: "720p",
      aspectRatio: params.aspectRatio || "16:9",
    };

    const modelInput: any = {
      model: "veo-3.1-lite-generate-preview",
      config,
    };

    if (params.prompt) {
      modelInput.prompt = params.prompt;
    }

    if (params.base64Image) {
      modelInput.image = {
        imageBytes: params.base64Image.split(",")[1] || params.base64Image,
        mimeType: params.mimeType || "image/png"
      };
    }

    const operation = await ai.models.generateVideos(modelInput);
    if (!operation || !operation.name) {
      throw new Error("Failed to start video generation operation.");
    }

    return operation.name;
  } catch (err: any) {
    console.error("Client-side video generation failed:", err);
    throw new Error(err.message || "Failed to start video generation.");
  }
}

/**
 * Poll Video Status
 */
export async function pollVideoStatusClient(operationName: string): Promise<{ done: boolean; uri?: string }> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini API Key is not configured.");
  }

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName;
    
    const updated = await ai.operations.getVideosOperation({ operation: op });
    if (updated.done) {
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      return { done: true, uri };
    }
    return { done: false };
  } catch (err: any) {
    console.error("Error polling video operation:", err);
    throw err;
  }
}

/**
 * Download Video Direct to Blob URL
 */
export async function downloadVideoClient(uri: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured.");
  }

  try {
    // We fetch the video file using the direct URI and include the API key in the headers as required by Google
    const res = await fetch(uri, {
      headers: { "x-goog-api-key": apiKey }
    });

    if (!res.ok) {
      throw new Error(`Failed to download video file: ${res.statusText}`);
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    console.error("Error fetching video blob:", err);
    throw new Error("Failed to download video file. Please check CORS settings or retry.");
  }
}

/**
 * Generate Study Mantras using Gemini
 */
export async function generateStudyMantrasClient(params: {
  title: string;
  artist: string;
  duration: number;
}): Promise<{ song: string; artist: string; lyrics: { text: string; time: number }[]; source: string }> {
  const ai = getGeminiClient();
  if (!ai) {
    return getOfflineStudyMantras(params.title, params.artist, params.duration);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a meditation, focus, and study coordinator.
The track playing is an instrumental study beat or lo-fi track named "${params.title}" by "${params.artist}" with a duration of ${params.duration} seconds.
Since this track does not have verbal singing lyrics, craft a sequence of beautiful, inspiring, calming study mantras, focus quotes, or meditative sentences that fit the track name and mood perfectly.
Distribute them evenly and chronologically across the active duration of ${params.duration} seconds (e.g. starting at 5s, 15s, 30s, 45s... up to ${params.duration - 10}s).
Return the data as a clean JSON object following the schema precisely.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            song: { type: Type.STRING, description: "The song title" },
            artist: { type: Type.STRING, description: "The artist name" },
            lyrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "One line of lyric/mantra" },
                  time: { type: Type.INTEGER, description: "The timeline offset in seconds when this line is shown" }
                },
                required: ["text", "time"]
              },
              description: "The chronologically ordered mantras with estimated timestamps"
            }
          },
          required: ["song", "artist", "lyrics"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return {
      song: parsed.song || params.title,
      artist: parsed.artist || params.artist || "Focus Artist",
      lyrics: parsed.lyrics || [],
      source: "Gemini Study Mantras"
    };
  } catch (err) {
    console.warn("Client-side study mantra generation failed, falling back offline.", err);
    return getOfflineStudyMantras(params.title, params.artist, params.duration);
  }
}

/**
 * Offline fallback study mantras (ported from server.ts)
 */
export function getOfflineStudyMantras(
  title: string,
  artist: string,
  duration: number
): { song: string; artist: string; lyrics: { text: string; time: number }[]; source: string } {
  const defaultMantras = [
    "Welcome to your focus zone. Let the music settle your mind.",
    "Breathe in deeply, hold, and release. Find your natural rhythm.",
    "Your attention is here, fully present in this moment.",
    "Step by step, line by line. Great things are built with patience.",
    "Release any tension in your shoulders, jaw, and brow.",
    "Deep focus is a quiet lake. Let thoughts ripple and dissolve.",
    "You are doing great. Keep going, calmly and steady.",
    "A quiet mind achieves brilliant focus.",
    "Breathe in clarity, breathe out distraction.",
    "Almost there. Let the peaceful sounds carry you through."
  ];

  const startTime = 5;
  const endTime = Math.max(startTime + 15, duration - 10);
  const activeDuration = endTime - startTime;
  const step = activeDuration / (defaultMantras.length - 1);

  const lyrics = defaultMantras.map((text, idx) => ({
    text,
    time: Math.round(startTime + idx * step)
  }));

  return {
    song: title,
    artist: artist || "Focus Artist",
    lyrics,
    source: "Focus Mantras (Offline Fallback)"
  };
}

/**
 * Analyze Song (canonicalize/guess metadata & check if instrumental)
 */
export async function analyzeSongClient(
  title: string,
  artist: string,
  duration: number
): Promise<{ song: string; artist: string; isInstrumentalOrStudy: boolean; explanation: string }> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      song: title,
      artist: artist || "Unknown Artist",
      isInstrumentalOrStudy: duration < 100 || title.toLowerCase().includes("lofi") || title.toLowerCase().includes("study") || title.toLowerCase().includes("ambient") || title.toLowerCase().includes("rain") || title.toLowerCase().includes("nature") || title.toLowerCase().includes("relax") || title.toLowerCase().includes("focus") || title.toLowerCase().includes("synthwave") || artist.toLowerCase().includes("lofi") || artist.toLowerCase().includes("relax"),
      explanation: "Offline heuristics analysis."
    };
  }

  try {
    const prompt = `Analyze the song title and artist.
Track Title: "${title}"
Track Artist: "${artist || "Unknown"}"
Track Duration: ${duration} seconds

Goal:
1. Correct any typos or messy symbols in the title and artist (guess the real song name).
2. Determine if the track is likely an instrumental study/relaxation/lo-fi beat or a nature ambient sounds track (which do NOT have singing vocals, so we should display focus quotes/mantras instead of searching for lyrics).
3. Return a JSON response precisely matching the required schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            song: { type: Type.STRING, description: "The cleaned canonical song title" },
            artist: { type: Type.STRING, description: "The cleaned canonical artist name" },
            isInstrumentalOrStudy: { type: Type.BOOLEAN, description: "True if instrumental/lofi/study/nature track with no spoken lyrics" },
            explanation: { type: Type.STRING, description: "Brief 1-sentence reason for your classification" }
          },
          required: ["song", "artist", "isInstrumentalOrStudy", "explanation"]
        }
      }
    });

    return JSON.parse(response.text?.trim() || "{}") as any;
  } catch (err) {
    console.warn("Client-side song analysis failed, using fallback heuristics.", err);
    return {
      song: title,
      artist: artist || "Unknown Artist",
      isInstrumentalOrStudy: duration < 100 || title.toLowerCase().includes("lofi") || title.toLowerCase().includes("study") || title.toLowerCase().includes("ambient") || title.toLowerCase().includes("rain") || title.toLowerCase().includes("nature") || title.toLowerCase().includes("relax") || title.toLowerCase().includes("focus") || title.toLowerCase().includes("synthwave") || artist.toLowerCase().includes("lofi") || artist.toLowerCase().includes("relax"),
      explanation: "Fallback heuristics."
    };
  }
}

/**
 * Estimate Timings for plain lyrics via Gemini
 */
export async function estimateTimingsForLyricsClient(
  title: string,
  artist: string,
  plainLyrics: string,
  duration: number
): Promise<{ song: string; artist: string; lyrics: { text: string; time: number }[]; source: string } | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    const prompt = `The following are the plain lyrics for the song "${title}" by "${artist}". The duration of the song is ${duration} seconds.
Your job is to read these lyrics, select up to 30 key lines (or all if short), and assign estimated timestamps in seconds (between 5 and ${duration - 15}) showing when they are likely sung in the song, distributed chronologically.
Return a beautiful, chronologically ordered JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            song: { type: Type.STRING },
            artist: { type: Type.STRING },
            lyrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  time: { type: Type.INTEGER }
                },
                required: ["text", "time"]
              }
            }
          },
          required: ["song", "artist", "lyrics"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return {
      song: parsed.song || title,
      artist: parsed.artist || artist,
      lyrics: parsed.lyrics || [],
      source: "Gemini Dynamic Timestamp Alignment"
    };
  } catch (err) {
    console.warn("Client lyrics timing alignment failed.", err);
    return null;
  }
}

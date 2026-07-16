import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel, GenerateVideosOperation } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini AI with safe guards
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI client successfully initialized server-side.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI Client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI features will ask for configuration.");
}

// ----------------- CACHING SYSTEMS & FALLBACKS FOR GEMINI -----------------
const songGuessCache = new Map<string, { song: string; artist: string; isInstrumentalOrStudy: boolean; explanation: string }>();
const lyricTimingCache = new Map<string, any>();
const lyricsEndpointCache = new Map<string, any>();
const apodCache = new Map<string, any>();

const fallbackImages = [
  "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80"
];

const fallbackQuotes = [
  {
    quote: "Focus is a muscle, and you build it by choosing to stay here.",
    author: "Deep Work Coach",
    tips: [
      "Put your phone in another room or out of arm's reach to eliminate instant gratification loops.",
      "Work in a single browser window. Close all irrelevant tabs to reduce visual load."
    ]
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    tips: [
      "Use the 5-Minute Rule: commit to focusing on your task for just five minutes. Often, momentum takes over.",
      "Clear your physical desk before starting. A clutter-free space supports a clutter-free mind."
    ]
  },
  {
    quote: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
    tips: [
      "Deconstruct complex study topics into 3 small bullet points before attempting to memorize them.",
      "Listen to ambient white noise or low-lyric lo-fi tracks to mask disruptive background noise."
    ]
  }
];

const fallbackRecommendations = [
  {
    name: "Ceremony",
    artist: "Joy Division",
    genre: "Post-Punk / Gothic Rock",
    description: "An absolute shoegaze and post-punk blueprint with echoing drum machines and driving basslines that define alternative history.",
    searchQuery: "Joy Division - Ceremony"
  },
  {
    name: "Svefn-g-englar",
    artist: "Sigur Rós",
    genre: "Post-Rock / Ambient",
    description: "An immersive, ethereal masterclass in bowing guitars and atmospheric soundscapes that helps soothe your mind for pure concentration.",
    searchQuery: "Sigur Rós - Svefn-g-englar"
  },
  {
    name: "Alison",
    artist: "Slowdive",
    genre: "Shoegaze / Dream Pop",
    description: "A gorgeous wall of hazy, reverb-drenched guitar textures that wraps around you like a warm blanket, perfect for deep creative work.",
    searchQuery: "Slowdive - Alison"
  },
  {
    name: "In The Midst Of It All",
    artist: "Tom Misch",
    genre: "Lo-fi / Neo-Soul",
    description: "A breezy, melodic groove with laid-back guitar riffs that will keep your productivity flowing naturally and calmly.",
    searchQuery: "Tom Misch - In The Midst Of It All"
  }
];

function getProgrammaticNoteBackup(action: string, content: string): string {
  const cleanContent = content.trim();
  switch (action) {
    case "summarize":
      return `### 📝 Study Note Summary (Offline Fallback)
Here is a structured summary of your note to boost retention:

- **Core Concept**: ${cleanContent.split("\n")[0] || "General Topic"}
- **Key Details**: Organized into systematic segments for quick review.
- **Actionable Takeaways**:
  - Review the key terms in this text.
  - Relate this concept to practical applications.
  - Test yourself with active recall.

*Note: AI assistant is currently in offline fallback mode due to high service demand.*`;

    case "expand":
      return `### 📚 Study Guide & Deep-Dive (Offline Fallback)
Here is an expanded breakdown of your note to deepen your understanding:

#### 1. Fundamental Overview
${cleanContent}

#### 2. Practical Application & Examples
- **Real-world connection**: How this topic behaves in practice.
- **Mental Model**: Connect this topic to prior knowledge to form an associative web.
- **Active Exploration**: Write down 3 questions you have about this content.

*Note: AI assistant is currently in offline fallback mode due to high service demand.*`;

    case "academic":
      return `### 🎓 Academic Translation (Offline Fallback)
**Subject Matter Analysis**:
The provided text details various dimensions of the specified topic. A formal perspective is outlined below:

"${cleanContent}"

**Key Professional Recommendations**:
- Maintain a structured bibliography of related concepts.
- Adopt rigorous terminologies when describing these mechanisms.

*Note: AI assistant is currently in offline fallback mode due to high service demand.*`;

    case "actions":
      const lines = cleanContent.split("\n").map(l => l.trim()).filter(l => l.length > 5);
      const checklists = lines.slice(0, 5).map(l => `- [ ] **Action**: Review and clarify: *"${l.substring(0, 60)}${l.length > 60 ? "..." : ""}"*`);
      if (checklists.length === 0) {
        checklists.push("- [ ] **Action**: Conduct a 15-minute deep-focused reading session of this note.");
      }
      return `### 🎯 Action Items Checklist (Offline Fallback)
Based on your note, here are your structured next steps:

${checklists.join("\n")}
- [ ] **Follow-up**: Test your memory of these points tomorrow morning.

*Note: AI assistant is currently in offline fallback mode due to high service demand.*`;

    case "quiz":
      return `### 🧠 Study Quiz (Offline Fallback)
Test your comprehension of this note with this diagnostic quiz:

**Question 1**: What is the most critical first step to mastering the material in this note?
- A) Rereading it 10 times passively
- B) Active recall and explaining it in your own words (Correct)
- C) Highlighting every single line with different colors
- D) Postponing review until the night before an exam
*Explanation*: Active recall and active elaboration (explaining concepts) are scientifically proven to build stronger neural connections than passive review.

**Question 2**: How can you apply spacing effects to this content?
- A) Study it all in one giant 8-hour session
- B) Review it briefly today, then in 2 days, then next week (Correct)
- C) Store it and never look at it again
- D) Only study it during loud music playback
*Explanation*: The Spacing Effect indicates that spaced repetition prevents forgetting curves from decaying.

*Note: AI assistant is currently in offline fallback mode due to high service demand.*`;

    default:
      return `### ✨ Improved Study Note (Offline Fallback)
Here is a clean, structured version of your note:

---
${cleanContent}
---

*Note: AI assistant is currently in offline fallback mode due to high service demand.*`;
  }
}

function getProgrammaticFocusInsights(logs: any[]): string {
  const totalSessions = logs.length;
  const totalDurationMin = Math.round(logs.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60);
  
  return `### ⚡ Your Focus Analytics & Insights (Offline Fallback)

Awesome job! You have logged **${totalSessions} focus sessions** totaling **${totalDurationMin} minutes** of high-quality study. 

Here is your cognitive performance synthesis:
- **Peak Flow Pattern**: Your sessions show strong consistency. Building a steady habit is the single most powerful way to anchor your long-term study routines.
- **Key Recommendation**: Try implementing the **Ultradian Rhythm** technique—focus intensely for 50-90 minutes, followed by a mandatory 15-minute complete brain rest (no screens, just stretching or walking). This aligns perfectly with your natural neural cycles.

*Keep up the fantastic momentum! Success is a series of small wins repeated daily.*`;
}

// ----------------- NASA APOD & MEDIA PROXY ENDPOINTS (ضد تحریم / GEO-BYPASS) -----------------

// NASA APOD API Proxy with backend caching
app.get("/api/nasa/apod", async (req, res) => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split("T")[0];

  if (apodCache.has(dateStr)) {
    console.log(`[NASA APOD Proxy] Serving cached APOD for date: ${dateStr}`);
    return res.json(apodCache.get(dateStr));
  }

  // Use configured environment key or default shared key
  const NASA_API_KEY = process.env.NASA_API_KEY || "8jJgk4CQmPvzmmyuxwwSQKyGam7IbwHhTxCkCBVu";
  const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${dateStr}`;

  try {
    console.log(`[NASA APOD Proxy] Fetching fresh APOD for date: ${dateStr} from NASA API...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA APOD API returned status ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    if (data && typeof data === "object") {
      const validatedData = {
        title: typeof data.title === "string" ? data.title : "Untitled Space Discovery",
        date: typeof data.date === "string" ? data.date : dateStr,
        explanation: typeof data.explanation === "string" ? data.explanation : "No description available for this astronomy discovery.",
        url: typeof data.url === "string" ? data.url : "",
        hdurl: typeof data.hdurl === "string" ? data.hdurl : undefined,
        media_type: data.media_type === "video" || data.media_type === "image" ? data.media_type : "image",
        copyright: typeof data.copyright === "string" ? data.copyright : undefined
      };

      if (validatedData.url) {
        apodCache.set(dateStr, validatedData);
      }
      res.json(validatedData);
    } else {
      throw new Error("Invalid NASA API response format");
    }
  } catch (err: any) {
    console.error(`[NASA APOD Proxy] Error fetching NASA APOD for date ${dateStr}:`, err);

    // If it's a future or today's date that failed, try latest fallback without date
    try {
      console.log(`[NASA APOD Proxy] Trying latest fallback without specific date...`);
      const fallbackUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
      const response = await fetch(fallbackUrl);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      // ignore fallback error
    }

    res.status(500).json({ error: err.message || "Failed to fetch NASA APOD data" });
  }
});

// NASA Media Streaming/Image Proxy to bypass local geoblocking & censorship (ضد تحریم)
app.get("/api/nasa/proxy", async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    res.status(400).send("Missing target media URL parameter.");
    return;
  }

  try {
    const isHttp = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
    if (!isHttp) {
      res.status(400).send("Invalid URL scheme. Must be http or https.");
      return;
    }

    console.log(`[NASA Proxy] Proxying media request for: ${imageUrl}`);
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/*,video/*,application/*,text/*"
    };

    const imgResponse = await fetch(imageUrl, { headers });
    if (!imgResponse.ok) {
      throw new Error(`Proxy target returned status ${imgResponse.status} ${imgResponse.statusText}`);
    }

    // Forward status code
    res.status(imgResponse.status);

    // Forward relevant headers
    imgResponse.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if ([
        "content-type",
        "content-length",
        "cache-control",
        "expires",
        "last-modified",
        "content-range",
        "accept-ranges"
      ].includes(k)) {
        res.setHeader(key, value);
      }
    });

    // Add strong caching for assets proxy to make the load lightning fast & lower server loads
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (imgResponse.body) {
      const { Readable } = await import("stream");
      Readable.fromWeb(imgResponse.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error(`[NASA Proxy] Failed to proxy media at ${imageUrl}:`, err.message || err);
    if (!res.headersSent) {
      res.status(500).send("Failed to proxy media stream.");
    }
  }
});

// ----------------- AI API ENDPOINTS -----------------

// Helper to check if AI is available
function checkAi(res: express.Response): boolean {
  if (!ai) {
    res.status(400).json({
      error: "Gemini API client is not initialized. Please add your GEMINI_API_KEY in the Settings > Secrets panel of AI Studio.",
    });
    return false;
  }
  return true;
}

// 1a. Generate Image from Prompt (Paid model flow: gemini-3.1-pro-image-preview)
app.post("/api/gemini/generate-image", async (req, res) => {
  if (!checkAi(res)) return;
  const { prompt, size = "1K", aspectRatio = "16:9", model = "gemini-3.1-flash-image" } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "A descriptive visual prompt is required." });
    return;
  }

  try {
    const response = await ai!.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: size as any,
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      res.status(500).json({ error: "No candidates returned from Gemini image generation." });
      return;
    }

    const parts = candidates[0].content.parts;
    let base64Image = "";

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      res.status(500).json({ error: "Failed to extract image data from response." });
      return;
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      res.status(429).json({ error: "Rate limited/quota exceeded for image generation." });
    } else {
      console.error("Error generating image:", err);
      res.status(500).json({ error: err.message || "Failed to generate image." });
    }
  }
});

// 1b. Generate Video from Prompt and optional Image (veo-3.1-fast-generate-preview)
app.post("/api/gemini/generate-video", async (req, res) => {
  if (!checkAi(res)) return;
  const { prompt, aspectRatio = "16:9", base64Image, mimeType } = req.body;

  try {
    const config: any = {
      numberOfVideos: 1,
      aspectRatio: aspectRatio
    };

    const requestBody: any = {
      model: "veo-3.1-fast-generate-preview",
      config
    };

    if (prompt) {
      requestBody.prompt = prompt;
    }

    if (base64Image) {
      requestBody.image = {
        imageBytes: base64Image.split(',')[1] || base64Image,
        mimeType: mimeType || 'image/jpeg'
      };
    }
    
    const operation = await ai!.models.generateVideos(requestBody);
    res.json({ operationName: operation.name });
  } catch (err: any) {
    console.error("Error generating video:", err);
    res.status(500).json({ error: err.message || "Failed to start video generation." });
  }
});

app.post("/api/gemini/video-status", async (req, res) => {
  if (!checkAi(res)) return;
  const { operationName } = req.body;

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai!.operations.getVideosOperation({ operation: op });
    res.json({ done: updated.done, uri: updated.response?.generatedVideos?.[0]?.video?.uri });
  } catch (err: any) {
    console.error("Error checking video status:", err);
    res.status(500).json({ error: err.message || "Failed to check video status." });
  }
});

app.get("/api/gemini/video-download", async (req, res) => {
  const { operationName } = req.query;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(400).send("API key required.");
    return;
  }

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName as string;
    const updated = await ai!.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!uri) {
      res.status(404).send("Video URI not found.");
      return;
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });
    
    res.setHeader('Content-Type', 'video/mp4');
    
    if (videoRes.body) {
       const { Readable } = await import("stream");
       Readable.fromWeb(videoRes.body as any).pipe(res);
    } else {
       res.end();
    }
  } catch (err: any) {
    console.error("Error downloading video:", err);
    res.status(500).send("Failed to download video.");
  }
});

app.post("/api/gemini/generate-bg", async (req, res) => {
  if (!checkAi(res)) return;
  const { prompt, size = "1K", aspectRatio = "16:9" } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "A descriptive visual prompt is required." });
    return;
  }

  try {
    // Generate image using high-quality image generation model
    const response = await ai!.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: {
        parts: [
          {
            text: `High-quality, beautiful, aesthetically pleasing study/work atmosphere focus dashboard background, suitable for deep work: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: size as any,
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      res.status(500).json({ error: "No candidates returned from Gemini image generation." });
      return;
    }

    const parts = candidates[0].content.parts;
    let base64Image = "";

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      res.status(500).json({ error: "Failed to extract image data from response." });
      return;
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn("[Background Gen] Rate limited/quota exceeded. Serving a beautiful cached nature/study image.");
      const randomImg = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
      res.json({ imageUrl: randomImg });
    } else {
      console.error("Error generating background image:", err);
      res.status(500).json({ error: err.message || "Failed to generate background." });
    }
  }
});

// 2. Note Assistant: Summarize, Expand, Rewrite, Action Items, Quiz (gemini-3.5-flash / gemini-3.1-pro-preview)
app.post("/api/gemini/notes-assistant", async (req, res) => {
  if (!checkAi(res)) return;
  const { action, content, enableHighThinking = false } = req.body;

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Note content is required." });
    return;
  }

  // Choose model based on complexity and user selection
  // Complex tasks or high-thinking requested uses gemini-3.1-pro-preview
  const modelToUse = enableHighThinking ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";

  let promptInstruction = "";
  switch (action) {
    case "summarize":
      promptInstruction = "Provide a concise, beautiful markdown summary of this note. Use bullet points and bold key terms.";
      break;
    case "expand":
      promptInstruction = "Expand upon this note. Add relevant context, explanations, and structure it beautifully in markdown. Maintain a clear and academic tone.";
      break;
    case "academic":
      promptInstruction = "Rewrite this note in a highly polished, professional, and clear academic tone. Format cleanly in markdown.";
      break;
    case "actions":
      promptInstruction = "Extract actionable to-do items from this note. Format them as a clear markdown checklist (- [ ] task name).";
      break;
    case "quiz":
      promptInstruction = "Generate an interactive, high-quality multiple choice study quiz (3-5 questions) based on this note material. Provide questions, options (A, B, C, D), and clearly mark the correct answer with explanations in markdown.";
      break;
    default:
      promptInstruction = "Improve this note. Format beautifully in markdown.";
  }

  try {
    const config: any = {};
    if (enableHighThinking) {
      // Configure high-thinking mode (strictly following system instructions)
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const response = await ai!.models.generateContent({
      model: modelToUse,
      contents: [
        {
          text: `${promptInstruction}\n\nNote Content:\n"""\n${content}\n"""`,
        },
      ],
      config,
    });

    res.json({ result: response.text });
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn("[Notes Assistant] Rate limited/quota exceeded. Serving programmatic note improvement.");
      res.json({ result: getProgrammaticNoteBackup(action, content) });
    } else {
      console.error("Error in notes-assistant:", err);
      res.status(500).json({ error: err.message || "Failed to process notes assistant." });
    }
  }
});

// 3. Search Grounding for Study Tips & Motivational Quotes (gemini-3.5-flash)
app.post("/api/gemini/search-quotes", async (req, res) => {
  if (!checkAi(res)) return;
  const { topic = "deep focus and studying" } = req.body;

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Search the web and find a highly inspiring, famous, authentic quote about "${topic}". Also, provide 2 short, practical productivity/study tips related to it. Format as JSON with fields "quote" (string), "author" (string), and "tips" (array of strings). Do not return any markdown code block fences other than plain JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: "An authentic, inspiring quote" },
            author: { type: Type.STRING, description: "Author of the quote" },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Two quick practical study tips",
            },
          },
          required: ["quote", "author", "tips"],
        },
      },
    });

    const data = JSON.parse(response.text.trim());
    
    // Extract grounding URLs for full transparency
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks ? chunks.map((chunk: any) => ({
      title: chunk.web?.title || "Search Source",
      uri: chunk.web?.uri || ""
    })).filter(s => s.uri) : [];

    res.json({ ...data, sources });
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn("[Quotes Search] Rate limited/quota exceeded. Serving beautiful fallback quotes and tips.");
      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      res.json({ ...randomQuote, sources: [] });
    } else {
      console.error("Error in search-quotes:", err);
      res.status(500).json({ error: err.message || "Failed to fetch custom quotes." });
    }
  }
});

// 4. Productivity Focus Insights (gemini-3.5-flash)
app.post("/api/gemini/focus-insights", async (req, res) => {
  if (!checkAi(res)) return;
  const { logs, currentGoals } = req.body;

  if (!logs || !Array.isArray(logs)) {
    res.status(400).json({ error: "Focus sessions logs are required." });
    return;
  }

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert student productivity mentor and cognitive performance coach.
Analyze the following user focus history and goals, then provide short, personalized, highly encouraging study insights (under 150 words).
Identify patterns (e.g. favorite modes, peak focus times, task priorities), celebrate their streak or milestones, and suggest one specific cognitive technique (like active recall, spacing, or ultra-radian rhythm) that matches their logs.

Focus History (last several sessions):
${JSON.stringify(logs.slice(-10), null, 2)}

Current Daily Goal:
${JSON.stringify(currentGoals || {})}

Provide your feedback in beautiful markdown. Highlight key insights using bold text.`,
    });

    res.json({ insights: response.text });
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn("[Focus Insights] Rate limited/quota exceeded. Serving programmatic focus analytics.");
      res.json({ insights: getProgrammaticFocusInsights(logs) });
    } else {
      console.error("Error in focus-insights:", err);
      res.status(500).json({ error: err.message || "Failed to generate focus insights." });
    }
  }
});

// Helper: Parse LRC synced lyrics format into structured chronological timeline
function parseLRC(lrcText: string): { text: string; time: number }[] {
  const lines = lrcText.split("\n");
  const result: { text: string; time: number }[] = [];
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    // Match timestamps like [01:23.45], [01:23] or [01:23:45]
    const match = /^\[(\d+):(\d+)(?:[:.](\d+))?\](.*)/.exec(cleanLine);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const text = match[4].trim();
      const timeInSecs = minutes * 60 + seconds;
      
      if (text) {
        result.push({ text, time: timeInSecs });
      }
    }
  }
  return result;
}

// Helper: 1. LRCLIB Fetcher
async function fetchLrcLib(title: string, artist: string): Promise<{ plainLyrics: string; syncedLyrics?: string; source: string } | null> {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "FocusStudyPlayer/1.0 (https://ai.studio/build)" }
    });
    if (res.ok) {
      const data = await res.json() as any;
      if (data && (data.plainLyrics || data.syncedLyrics)) {
        return {
          plainLyrics: data.plainLyrics || "",
          syncedLyrics: data.syncedLyrics || undefined,
          source: "LRCLIB"
        };
      }
    }
  } catch (err) {
    console.warn("LRCLIB fetch failed:", err);
  }
  return null;
}

// Helper: 2. Musixmatch Desktop API Fetcher
async function fetchMusixmatch(title: string, artist: string): Promise<{ plainLyrics: string; syncedLyrics?: string; source: string } | null> {
  try {
    // 1. Get dynamic usertoken
    const tokenRes = await fetch("https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-v1.0", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json() as any;
    const token = tokenData?.message?.body?.user_token;
    if (!token) return null;

    // 2. Search track
    const searchUrl = `https://apic-desktop.musixmatch.com/ws/1.1/track.search?app_id=web-desktop-v1.0&q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}&usertoken=${token}`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json() as any;
    const trackList = searchData?.message?.body?.track_list || [];
    if (trackList.length === 0) return null;
    const trackId = trackList[0]?.track?.track_id;
    if (!trackId) return null;

    // 3. Try to get synced subtitle first
    const subtitleUrl = `https://apic-desktop.musixmatch.com/ws/1.1/track.subtitle.get?app_id=web-desktop-v1.0&track_id=${trackId}&usertoken=${token}`;
    const subtitleRes = await fetch(subtitleUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (subtitleRes.ok) {
      const subtitleData = await subtitleRes.json() as any;
      const subtitleBody = subtitleData?.message?.body?.subtitle?.subtitle_body;
      if (subtitleBody) {
        return {
          plainLyrics: subtitleBody.replace(/\[\d+:\d+\.\d+\]/g, ""), // clean timestamps for plain
          syncedLyrics: subtitleBody,
          source: "Musixmatch"
        };
      }
    }

    // 4. Fallback to plain lyrics
    const lyricsUrl = `https://apic-desktop.musixmatch.com/ws/1.1/track.lyrics.get?app_id=web-desktop-v1.0&track_id=${trackId}&usertoken=${token}`;
    const lyricsRes = await fetch(lyricsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (lyricsRes.ok) {
      const lyricsData = await lyricsRes.json() as any;
      const lyricsBody = lyricsData?.message?.body?.lyrics?.lyrics_body;
      if (lyricsBody) {
        return {
          plainLyrics: lyricsBody,
          source: "Musixmatch"
        };
      }
    }
  } catch (err) {
    console.warn("Musixmatch fetch failed:", err);
  }
  return null;
}

// Helper: 3. Genius Public Multi-Search Scraper
async function fetchGenius(title: string, artist: string): Promise<{ plainLyrics: string; source: string } | null> {
  try {
    const query = `${artist} ${title}`;
    const searchUrl = `https://genius.com/api-search/multi?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json() as any;
    
    const sections = searchData?.response?.sections || [];
    const topHit = sections.flatMap((s: any) => s.hits || [])
      .find((hit: any) => hit.type === "song")?.result;
      
    if (!topHit?.path) return null;
    
    const pageUrl = `https://genius.com${topHit.path}`;
    const pageRes = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();
    
    const regex = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    let rawLyrics = "";
    while ((match = regex.exec(html)) !== null) {
      rawLyrics += match[1] + "\n";
    }
    
    if (rawLyrics) {
      const clean = rawLyrics
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?[a-z][a-z0-9]*[^>]*>/gi, "") // strip html
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, "\n\n")
        .trim();
        
      if (clean) {
        return {
          plainLyrics: clean,
          source: "Genius"
        };
      }
    }
  } catch (err) {
    console.warn("Genius fetch failed:", err);
  }
  return null;
}

// Helper: 4. Lyrics.ovh Fetcher
async function fetchLyricsOvh(title: string, artist: string): Promise<{ plainLyrics: string; source: string } | null> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json() as any;
      if (data && data.lyrics) {
        return {
          plainLyrics: data.lyrics,
          source: "Lyrics.ovh"
        };
      }
    }
  } catch (err) {
    console.warn("Lyrics.ovh fetch failed:", err);
  }
  return null;
}

// Helper: Estimate timings for raw/plain lyrics using Gemini
async function estimateTimingsForLyrics(
  title: string,
  artist: string,
  plainLyrics: string,
  duration: number
): Promise<{ song: string; artist: string; lyrics: { text: string; time: number }[]; source: string } | null> {
  if (!ai) return null;

  const cacheKey = `${title.trim().toLowerCase()}|${(artist || "").trim().toLowerCase()}|${duration}|${plainLyrics.length}`;
  if (lyricTimingCache.has(cacheKey)) {
    console.log(`[Timing Estimator] Returning cached timing estimation for "${title}" - "${artist}"`);
    return lyricTimingCache.get(cacheKey);
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert music timing coordinator.
We have found the actual, authentic plain lyrics of the song "${title}" by "${artist}".
The song has an active playback duration of ${duration} seconds.

Your task is to:
1. Divide these lyrics into logical lines (under 80 characters per line).
2. Estimate a realistic timeline offset in seconds (e.g. 5, 12, 18, 24...) for each line of the lyrics, mapped chronologically and distributed proportionally across the active duration of ${duration} seconds.
3. Timestamps must start at 2-10 seconds, increase monotonically, and end around 5-10 seconds before the total duration of ${duration} seconds.
4. Output the result as a clean JSON object following the schema precisely.

Here are the authentic plain lyrics:
"""
${plainLyrics}
"""`,
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
                  text: { type: Type.STRING, description: "One line of lyric" },
                  time: { type: Type.INTEGER, description: "The timeline offset in seconds when this line is sung" }
                },
                required: ["text", "time"]
              },
              description: "The chronologically ordered lyric lines with their estimated timestamps"
            }
          },
          required: ["song", "artist", "lyrics"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    lyricTimingCache.set(cacheKey, parsed);
    return parsed;
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn(`[Timing Estimator] Rate limited/quota exceeded inside estimateTimingsForLyrics. Falling back to programmatic timings.`);
    } else {
      console.warn("Gemini timing estimation failed:", err.message || err);
    }
    return null;
  }
}

// Helper: Clean parentheticals, sound noise and generic names from title/artist for searching
function cleanSearchQuery(title: string, artist: string): { title: string; artist: string } {
  let cleanTitle = title;
  let cleanArtist = artist;

  // Remove common suffixes in parentheses or brackets like (Live), [Official Video], (Remastered), (Mellow Mix), (Rock Mix)
  cleanTitle = cleanTitle.replace(/\s*[([].*?(?:remaster|live|mix|edit|version|feat|ft\.|with|cover|studio|lyrics|audio|hq|video|official)[\])]/gi, "").trim();
  
  // If artist is just generic study text or station names, blank it
  if (
    /radio paradise|somafm|chill|ambient|lofi|study|meditation|unknown|local audio/gi.test(cleanArtist)
  ) {
    cleanArtist = "";
  }

  return { title: cleanTitle.trim(), artist: cleanArtist.trim() };
}

// Programmatic fallback for dividing plain lyrics with evenly distributed timestamps
function estimateTimingsProgrammatically(
  title: string,
  artist: string,
  plainLyrics: string,
  duration: number
): { song: string; artist: string; lyrics: { text: string; time: number }[]; source: string } | null {
  const lines = plainLyrics
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("[") && !line.startsWith("("));

  if (lines.length === 0) return null;

  const startTime = 5;
  const endTime = Math.max(startTime + 10, duration - 10);
  const activeDuration = endTime - startTime;
  const step = lines.length > 1 ? activeDuration / (lines.length - 1) : 0;

  const lyrics = lines.map((text, idx) => ({
    text,
    time: Math.round(startTime + idx * step)
  }));

  return {
    song: title,
    artist: artist || "Unknown Artist",
    lyrics,
    source: "Local Timings (Offline Fallback)"
  };
}

// Programmatic fallback for generating focus mantras when Gemini is unavailable
function getProgrammaticStudyMantras(
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

// Helper: Use Gemini 3.5-flash to identify, correct and guess canonical song details
async function identifyOrGuessSong(
  rawTitle: string,
  rawArtist: string,
  duration: number
): Promise<{ song: string; artist: string; isInstrumentalOrStudy: boolean; explanation: string }> {
  if (!ai) {
    return {
      song: rawTitle,
      artist: rawArtist,
      isInstrumentalOrStudy: false,
      explanation: "No AI client initialized."
    };
  }

  const cacheKey = `${rawTitle.trim().toLowerCase()}|${(rawArtist || "").trim().toLowerCase()}`;
  if (songGuessCache.has(cacheKey)) {
    console.log(`[Song Guesser] Returning cached result for ["${rawTitle}" - "${rawArtist}"]`);
    return songGuessCache.get(cacheKey)!;
  }

  try {
    const prompt = `You are an expert music curator, track identifier, and song database matching assistant.
We have received music metadata from an active player stream or user upload. It may be messy, contain radio/station prefixes, track numbers, file extensions (like .mp3), live performance markers, remaster labels, or stream noise. It could also be a study beat, lo-fi tune, instrumental track, or a slightly misspelled famous song.

Raw Song Title: "${rawTitle}"
Raw Artist Name: "${rawArtist || "Unknown"}"
Track Duration: ${duration} seconds (approx. ${Math.round(duration / 60)}m ${duration % 60}s)

Your task:
1. Identify and Guess the true canonical song title and the real artist name.
   - If it is a famous song with spelling mistakes, stream noise, or bracketed info (e.g., "01. Awake (Remastered 2020)"), identify the official canonical title ("Awake") and artist ("Tycho").
   - If the artist or title contains radio station names, stream noise, or DJ set names (e.g., "Radio Paradise", "SomaFM", "Chill Mix"), look past that to see if you can guess the underlying track.
   - If it is clearly a study track, ambient loop, lo-fi sound, background meditation beat, or sound effect with no real lyrics, identify it and mark it as \`isInstrumentalOrStudy = true\`.
   - Even if the input is extremely obscure or vague, make your absolute best, most logical guess based on the words, duration, or typical music matching patterns.
2. Return a clean, corrected title and artist that can be used for standard lyrics databases search (like LRCLIB, Musixmatch, Genius, or lyrics.ovh).

Provide the output as a valid JSON object matching this schema precisely.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            song: { type: Type.STRING, description: "The guessed/canonical song title (clean)" },
            artist: { type: Type.STRING, description: "The guessed/canonical artist name (clean)" },
            isInstrumentalOrStudy: { type: Type.BOOLEAN, description: "Whether this is a study beat, lo-fi, ambient, meditation track, or instrumental with no singing lyrics" },
            explanation: { type: Type.STRING, description: "Brief explanation of how the song was identified/guessed" }
          },
          required: ["song", "artist", "isInstrumentalOrStudy", "explanation"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    console.log(`[Song Guesser] Identified raw ["${rawTitle}" - "${rawArtist}"] as canonical ["${parsed.song}" by "${parsed.artist}"] (Instrumental/Study: ${parsed.isInstrumentalOrStudy}). Reason: ${parsed.explanation}`);
    songGuessCache.set(cacheKey, parsed);
    return parsed;
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn(`[Song Guesser] Rate limited/quota exceeded inside identifyOrGuessSong. Falling back to raw metadata gracefully.`);
    } else {
      console.warn("Error in identifyOrGuessSong:", err.message || err);
    }
    return {
      song: rawTitle,
      artist: rawArtist,
      isInstrumentalOrStudy: false,
      explanation: "Failed to query guesser due to rate limit/error"
    };
  }
}

// 5. Lyrics Fetcher & Estimator (Multi-source Fallback Hierarchy: LRCLIB -> Musixmatch -> Genius -> Lyrics.ovh -> Gemini AI generator)
app.post("/api/gemini/lyrics", async (req, res) => {
  const { title, artist, duration = 180, nocache = false } = req.body;

  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Song title is required to fetch lyrics." });
    return;
  }

  const inputArtist = artist && artist !== "Local Audio File" && artist !== "Unknown Artist" ? artist : "";

  const endpointCacheKey = `${title.trim().toLowerCase()}|${inputArtist.trim().toLowerCase()}|${duration}`;
  if (!nocache && lyricsEndpointCache.has(endpointCacheKey)) {
    console.log(`[Lyrics Flow] Returning cached lyrics endpoint response for "${title}" - "${artist}"`);
    res.json(lyricsEndpointCache.get(endpointCacheKey));
    return;
  }
  
  try {
    let result: { song: string; artist: string; lyrics: { text: string; time: number }[]; source: string } | null = null;

    // A. Run Gemini-powered Song Guesser first to identify/canonicalize metadata & check if instrumental
    console.log(`[Lyrics Flow] Guessing/canonicalizing: "${title}" - "${inputArtist}" (${duration}s)`);
    const guessed = await identifyOrGuessSong(title, inputArtist, duration);
    const cleanTitle = guessed.song;
    const cleanArtist = guessed.artist;

    // B. If the guesser identified this as an instrumental/study/lo-fi beat, immediately skip DB search and generate soothing study mantras
    if (guessed.isInstrumentalOrStudy) {
      console.log(`[Lyrics Flow] Track identified as Instrumental/Study beat. Generating study mantras via Gemini...`);
      if (!!ai) {
        try {
          const response = await ai!.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `You are a meditation, focus, and study coordinator.
The track playing is an instrumental study beat or lo-fi track named "${cleanTitle}" by "${cleanArtist}" with a duration of ${duration} seconds.
Since this track does not have verbal singing lyrics, craft a sequence of beautiful, inspiring, calming study mantras, focus quotes, or meditative sentences that fit the track name and mood perfectly.
Distribute them evenly and chronologically across the active duration of ${duration} seconds (e.g. starting at 5s, 15s, 30s, 45s... up to ${duration - 10}s).
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

          const parsed = JSON.parse(response.text.trim());
          result = { 
            ...parsed, 
            source: `Study Mantras (${guessed.explanation})` 
          };
        } catch (err: any) {
          console.warn("[Lyrics Flow] Instrumental mantra generation with Gemini failed or rate-limited. Falling back programmatically.", err.message || err);
          result = getProgrammaticStudyMantras(cleanTitle, cleanArtist, duration);
        }
      } else {
        result = getProgrammaticStudyMantras(cleanTitle, cleanArtist, duration);
      }
    }

    // C. Otherwise, search external lyric APIs using canonicalized metadata
    if (!result) {
      // 1. Try LRCLIB
      console.log(`[Lyrics Flow] 1. Requesting LRCLIB for canonical: ${cleanTitle} - ${cleanArtist}`);
      const lrcLibData = await fetchLrcLib(cleanTitle, cleanArtist);
      if (lrcLibData) {
        if (lrcLibData.syncedLyrics) {
          const parsedSynced = parseLRC(lrcLibData.syncedLyrics);
          if (parsedSynced.length > 0) {
            result = {
              song: cleanTitle,
              artist: cleanArtist || "Unknown Artist",
              lyrics: parsedSynced,
              source: "LRCLIB (Synced)"
            };
          }
        }
        if (!result && lrcLibData.plainLyrics) {
          console.log(`[Lyrics Flow] LRCLIB plain lyrics found. Estimating timestamps...`);
          const timedLyrics = await estimateTimingsForLyrics(cleanTitle, cleanArtist, lrcLibData.plainLyrics, duration);
          if (timedLyrics) {
            result = { ...timedLyrics, source: "LRCLIB (Timed via AI)" };
          } else {
            const progLyrics = estimateTimingsProgrammatically(cleanTitle, cleanArtist, lrcLibData.plainLyrics, duration);
            if (progLyrics) {
              result = progLyrics;
            }
          }
        }
      }
    }

    // 2. Try Musixmatch API
    if (!result) {
      console.log(`[Lyrics Flow] 2. Requesting Musixmatch for canonical: ${cleanTitle} - ${cleanArtist}`);
      const mxData = await fetchMusixmatch(cleanTitle, cleanArtist);
      if (mxData) {
        if (mxData.syncedLyrics) {
          const parsedSynced = parseLRC(mxData.syncedLyrics);
          if (parsedSynced.length > 0) {
            result = {
              song: cleanTitle,
              artist: cleanArtist || "Unknown Artist",
              lyrics: parsedSynced,
              source: "Musixmatch (Synced)"
            };
          }
        }
        if (!result && mxData.plainLyrics) {
          console.log(`[Lyrics Flow] Musixmatch plain lyrics found. Estimating timestamps...`);
          const timedLyrics = await estimateTimingsForLyrics(cleanTitle, cleanArtist, mxData.plainLyrics, duration);
          if (timedLyrics) {
            result = { ...timedLyrics, source: "Musixmatch (Timed via AI)" };
          } else {
            const progLyrics = estimateTimingsProgrammatically(cleanTitle, cleanArtist, mxData.plainLyrics, duration);
            if (progLyrics) {
              result = progLyrics;
            }
          }
        }
      }
    }

    // 3. Try Genius API Scraper
    if (!result) {
      console.log(`[Lyrics Flow] 3. Requesting Genius for canonical: ${cleanTitle} - ${cleanArtist}`);
      const geniusData = await fetchGenius(cleanTitle, cleanArtist);
      if (geniusData && geniusData.plainLyrics) {
        console.log(`[Lyrics Flow] Genius plain lyrics found. Estimating timestamps...`);
        const timedLyrics = await estimateTimingsForLyrics(cleanTitle, cleanArtist, geniusData.plainLyrics, duration);
        if (timedLyrics) {
          result = { ...timedLyrics, source: "Genius (Timed via AI)" };
        } else {
          const progLyrics = estimateTimingsProgrammatically(cleanTitle, cleanArtist, geniusData.plainLyrics, duration);
          if (progLyrics) {
            result = progLyrics;
          }
        }
      }
    }

    // 4. Try Lyrics.ovh
    if (!result) {
      console.log(`[Lyrics Flow] 4. Requesting Lyrics.ovh for canonical: ${cleanTitle} - ${cleanArtist}`);
      const ovhData = await fetchLyricsOvh(cleanTitle, cleanArtist);
      if (ovhData && ovhData.plainLyrics) {
        console.log(`[Lyrics Flow] Lyrics.ovh plain lyrics found. Estimating timestamps...`);
        const timedLyrics = await estimateTimingsForLyrics(cleanTitle, cleanArtist, ovhData.plainLyrics, duration);
        if (timedLyrics) {
          result = { ...timedLyrics, source: "Lyrics.ovh (Timed via AI)" };
        } else {
          const progLyrics = estimateTimingsProgrammatically(cleanTitle, cleanArtist, ovhData.plainLyrics, duration);
          if (progLyrics) {
            result = progLyrics;
          }
        }
      }
    }

    // 5. Ultimate Fallback (Gemini fully generative + motivational mantras if instrumental/lofi)
    if (!result) {
      console.log(`[Lyrics Flow] 5. Fallback: Requesting Gemini Generative Search...`);
      if (!!ai) {
        try {
          const query = cleanArtist ? `"${cleanTitle}" by ${cleanArtist}` : `"${cleanTitle}"`;
          const response = await ai!.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `You are an expert music lyrics coordinator.
Find or estimate the authentic lyrics for the song: ${query}.
The song has an active playback duration of ${duration} seconds.
Your task:
1. Provide the actual lyrics of this song line-by-line.
2. Estimate the singing timestamp (in seconds from start, e.g., 5, 12, 18, 25...) for each line of lyrics so that it maps correctly to the song duration of ${duration} seconds. Ensure the timestamps start around 2-10 seconds, and end around 5-10 seconds before the total duration of ${duration} seconds.
3. If this is a study beat, lo-fi track, or you cannot find the official lyrics, craft a sequence of beautiful, inspiring, calming study mantras, quotes, or meditative sentences that fit the track name "${cleanTitle}" perfectly, distributed evenly across the ${duration} seconds.
4. Return the data as a clean JSON object following the schema precisely.`,
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
                        text: { type: Type.STRING, description: "One line of lyric" },
                        time: { type: Type.INTEGER, description: "The timeline offset in seconds when this line is sung/spoken" }
                      },
                      required: ["text", "time"]
                    },
                    description: "The chronologically ordered lyric lines with their estimated timestamps"
                  }
                },
                required: ["song", "artist", "lyrics"]
              }
            }
          });

          const parsed = JSON.parse(response.text.trim());
          result = { ...parsed, source: `Gemini Generative (${guessed.explanation})` };
        } catch (err: any) {
          console.warn("[Lyrics Flow] Gemini generative fallback failed or rate-limited.", err.message || err);
          if (guessed.isInstrumentalOrStudy) {
            result = getProgrammaticStudyMantras(cleanTitle, cleanArtist, duration);
          } else {
            return res.status(429).json({ error: "Lyrics unavailable. AI rate limit exceeded." });
          }
        }
      } else {
        if (guessed.isInstrumentalOrStudy) {
          result = getProgrammaticStudyMantras(cleanTitle, cleanArtist, duration);
        } else {
          return res.status(404).json({ error: "No lyrics found and AI fallback disabled." });
        }
      }
    }

    if (result && !result.source.includes("Offline Fallback")) {
      lyricsEndpointCache.set(endpointCacheKey, result);
    }

    res.json(result);
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn("[Lyrics Flow] Rate limited/quota exceeded inside outer lyrics endpoint.");
      return res.status(429).json({ error: "Lyrics unavailable. AI rate limit exceeded." });
    } else {
      console.error("Error in lyrics fallback API:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve lyrics." });
    }
  }
});

// 5.5 Underground Music Recommendations (gemini-3.5-flash)
app.post("/api/gemini/music-recommendations", async (req, res) => {
  if (!checkAi(res)) return;
  const { currentTrack, selectedMode, likedTracks = [] } = req.body;

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an elite underground music curator, a vinyl crate digger, and an alternative music historian.
Generate 4 highly-curated, obscure underground or alternative tracks/artists recommendations based on the user's current context.
Only recommend genres from: Lo-fi, Alternative rock, Indie rock, Post-rock, Shoegaze, Emo, Screamo, Post-hardcore, Punk rock, Pop punk, Heavy metal, Metalcore, Gothic rock, Dark alternative.
Strictly avoid mainstream pop, commercial EDM, classical, country, news, or talk content.

User Context:
- Currently Listening: "${currentTrack?.name || "None"}" by ${currentTrack?.artist || "None"}
- Selected Discovery Mode: "${selectedMode || "Underground Discovery"}"
- Liked/Saved Tracks: ${JSON.stringify(likedTracks.map((t: any) => `${t.name} - ${t.artist}`).slice(-5))}

Your response must be a valid JSON object containing a list of 4 recommendations. For each recommendation, provide:
1. "name": Title of the song (make it a real, existing, cool underground track)
2. "artist": Name of the alternative artist
3. "genre": The precise subgenre (e.g. "Shoegaze", "Emo Revival", "Post-Rock")
4. "description": A highly engaging 1-2 sentence description explaining why this fits their vibe and the aesthetic lore behind the track.
5. "searchQuery": A clean, simple search query containing the song name and artist to search on Audius (e.g. "artist name - song name").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  artist: { type: Type.STRING },
                  genre: { type: Type.STRING },
                  description: { type: Type.STRING },
                  searchQuery: { type: Type.STRING }
                },
                required: ["name", "artist", "genre", "description", "searchQuery"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn("[Music Recs] Rate limited/quota exceeded. Serving high-quality curated offline recommendations.");
      res.json({ recommendations: fallbackRecommendations });
    } else {
      console.error("Error in music-recommendations API:", err);
      res.status(500).json({ error: err.message || "Failed to generate recommendations." });
    }
  }
});

// 6. Iran Holidays API with pre-seeded cache and fallback search grounding (gemini-3.5-flash)
const holidaysCache: Record<number, any[]> = {
  1404: [
    { jy: 1404, jm: 1, jd: 1, titleFa: "عید نوروز", titleEn: "Nowruz (New Year)", isOfficial: true },
    { jy: 1404, jm: 1, jd: 2, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jy: 1404, jm: 1, jd: 3, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jy: 1404, jm: 1, jd: 4, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jy: 1404, jm: 1, jd: 12, titleFa: "روز جمهوری اسلامی", titleEn: "Islamic Republic Day", isOfficial: true },
    { jy: 1404, jm: 1, jd: 13, titleFa: "روز طبیعت (سیزده بدر)", titleEn: "Sizdah Bedar (Nature Day)", isOfficial: true },
    { jy: 1404, jm: 3, jd: 14, titleFa: "رحلت امام خمینی", titleEn: "Demise of Imam Khomeini", isOfficial: true },
    { jy: 1404, jm: 3, jd: 15, titleFa: "قیام ۱۵ خرداد", titleEn: "Revolt of Khordad 15", isOfficial: true },
    { jy: 1404, jm: 11, jd: 22, titleFa: "پیروزی انقلاب اسلامی", titleEn: "Islamic Revolution Day", isOfficial: true },
    { jy: 1404, jm: 12, jd: 29, titleFa: "ملی شدن صنعت نفت", titleEn: "Nationalization of Oil Industry", isOfficial: true },
    // Lunar holidays mapped for 1404:
    { jy: 1404, jm: 1, jd: 21, titleFa: "شهادت حضرت علی (ع)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
    { jy: 1404, jm: 1, jd: 22, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr", isOfficial: true },
    { jy: 1404, jm: 1, jd: 23, titleFa: "تعطیل عید سعید فطر", titleEn: "Eid al-Fitr Holiday", isOfficial: true },
    { jy: 1404, jm: 2, jd: 23, titleFa: "شهادت امام جعفر صادق (ع)", titleEn: "Martyrdom of Imam Sadiq", isOfficial: true },
    { jy: 1404, jm: 3, jd: 16, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha", isOfficial: true },
    { jy: 1404, jm: 3, jd: 24, titleFa: "عید سعید غدیر خم", titleEn: "Eid al-Ghadir", isOfficial: true },
    { jy: 1404, jm: 4, jd: 14, titleFa: "تاسوعای حسینی", titleEn: "Tasua", isOfficial: true },
    { jy: 1404, jm: 4, jd: 15, titleFa: "عاشورای حسینی", titleEn: "Ashura", isOfficial: true },
    { jy: 1404, jm: 4, jd: 24, titleFa: "شهادت امام زین‌العابدین (ع)", titleEn: "Martyrdom of Imam Sajjad", isOfficial: true },
    { jy: 1404, jm: 5, jd: 24, titleFa: "اربعین حسینی", titleEn: "Arbaeen", isOfficial: true },
    { jy: 1404, jm: 6, jd: 1, titleFa: "رحلت پیامبر (ص) و شهادت امام حسن مجتبی (ع)", titleEn: "Demise of Prophet & Imam Hassan", isOfficial: true },
    { jy: 1404, jm: 6, jd: 3, titleFa: "شهادت امام رضا (ع)", titleEn: "Martyrdom of Imam Reza", isOfficial: true },
    { jy: 1404, jm: 6, jd: 11, titleFa: "شهادت امام حسن عسکری (ع)", titleEn: "Martyrdom of Imam Askari", isOfficial: true },
    { jy: 1404, jm: 6, jd: 20, titleFa: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", titleEn: "Milad of Prophet & Imam Sadiq", isOfficial: true },
    { jy: 1404, jm: 8, jd: 14, titleFa: "شهادت حضرت فاطمه زهرا (س)", titleEn: "Martyrdom of Hazrat Fatima", isOfficial: true },
    { jy: 1404, jm: 10, jd: 10, titleFa: "ولادت حضرت امام علی (ع)", titleEn: "Birth of Imam Ali", isOfficial: true },
    { jy: 1404, jm: 10, jd: 24, titleFa: "مبعث حضرت رسول اکرم (ص)", titleEn: "Mabaas of Prophet", isOfficial: true },
    { jy: 1404, jm: 11, jd: 12, titleFa: "ولادت حضرت قائم (عج)", titleEn: "Birth of Imam Mahdi", isOfficial: true },
    { jy: 1404, jm: 12, jd: 20, titleFa: "شهادت حضرت علی (ع) (سال دوم)", titleEn: "Martyrdom of Imam Ali", isOfficial: true }
  ],
  1405: [
    { jy: 1405, jm: 1, jd: 1, titleFa: "عید نوروز", titleEn: "Nowruz (New Year)", isOfficial: true },
    { jy: 1405, jm: 1, jd: 2, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jy: 1405, jm: 1, jd: 3, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jy: 1405, jm: 1, jd: 4, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jy: 1405, jm: 1, jd: 12, titleFa: "روز جمهوری اسلامی", titleEn: "Islamic Republic Day", isOfficial: true },
    { jy: 1405, jm: 1, jd: 13, titleFa: "روز طبیعت (سیزده بدر)", titleEn: "Sizdah Bedar (Nature Day)", isOfficial: true },
    { jy: 1405, jm: 3, jd: 14, titleFa: "رحلت امام خمینی", titleEn: "Demise of Imam Khomeini", isOfficial: true },
    { jy: 1405, jm: 3, jd: 15, titleFa: "قیام ۱۵ خرداد", titleEn: "Revolt of Khordad 15", isOfficial: true },
    { jy: 1405, jm: 11, jd: 22, titleFa: "پیروزی انقلاب اسلامی", titleEn: "Islamic Revolution Day", isOfficial: true },
    { jy: 1405, jm: 12, jd: 29, titleFa: "ملی شدن صنعت نفت", titleEn: "Nationalization of Oil Industry", isOfficial: true },
    // Lunar holidays mapped for 1405:
    { jy: 1405, jm: 1, jd: 4, titleFa: "شهادت حضرت علی (ع)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
    { jy: 1405, jm: 1, jd: 22, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr", isOfficial: true },
    { jy: 1405, jm: 1, jd: 23, titleFa: "تعطیل عید سعید فطر", titleEn: "Eid al-Fitr Holiday", isOfficial: true },
    { jy: 1405, jm: 2, jd: 23, titleFa: "شهادت امام جعفر صادق (ع)", titleEn: "Martyrdom of Imam Sadiq", isOfficial: true },
    { jy: 1405, jm: 3, jd: 18, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha", isOfficial: true },
    { jy: 1405, jm: 3, jd: 26, titleFa: "عید سعید غدیر خم", titleEn: "Eid al-Ghadir", isOfficial: true },
    { jy: 1405, jm: 4, jd: 14, titleFa: "تاسوعای حسینی", titleEn: "Tasua", isOfficial: true },
    { jy: 1405, jm: 4, jd: 15, titleFa: "عاشورای حسینی", titleEn: "Ashura", isOfficial: true },
    { jy: 1405, jm: 4, jd: 24, titleFa: "شهادت امام زین‌العابدین (ع)", titleEn: "Martyrdom of Imam Sajjad", isOfficial: true },
    { jy: 1405, jm: 5, jd: 24, titleFa: "اربعین حسینی", titleEn: "Arbaeen", isOfficial: true },
    { jy: 1405, jm: 6, jd: 1, titleFa: "رحلت پیامبر (ص) و شهادت امام حسن مجتبی (ع)", titleEn: "Demise of Prophet & Imam Hassan", isOfficial: true },
    { jy: 1405, jm: 6, jd: 3, titleFa: "شهادت امام رضا (ع)", titleEn: "Martyrdom of Imam Reza", isOfficial: true },
    { jy: 1405, jm: 6, jd: 11, titleFa: "شهادت امام حسن عسکری (ع)", titleEn: "Martyrdom of Imam Askari", isOfficial: true },
    { jy: 1405, jm: 6, jd: 20, titleFa: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", titleEn: "Milad of Prophet & Imam Sadiq", isOfficial: true },
    { jy: 1405, jm: 8, jd: 14, titleFa: "شهادت حضرت فاطمه زهرا (س)", titleEn: "Martyrdom of Hazrat Fatima", isOfficial: true },
    { jy: 1405, jm: 10, jd: 10, titleFa: "شهادت حضرت علی (ع) (سال دوم)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
    { jy: 1405, jm: 10, jd: 29, titleFa: "عید سعید فطر (سال دوم)", titleEn: "Eid al-Fitr", isOfficial: true },
    { jy: 1405, jm: 10, jd: 30, titleFa: "تعطیل عید فطر (سال دوم)", titleEn: "Eid al-Fitr Holiday", isOfficial: true }
  ]
};

let cachedRawNews: any[] = [];
let lastNewsFetchTime = 0;
const NEWS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

async function fetchRawNewsFeed(): Promise<any[]> {
  const now = Date.now();
  if (cachedRawNews.length > 0 && (now - lastNewsFetchTime < NEWS_CACHE_DURATION)) {
    return cachedRawNews;
  }

  const items: any[] = [];

  try {
    // 1. Fetch Hacker News Top Stories
    const topStoriesRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (topStoriesRes.ok) {
      const ids = await topStoriesRes.json();
      const topIds = Array.isArray(ids) ? ids.slice(0, 8) : [];
      
      const hnPromises = topIds.map(async (id) => {
        try {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (itemRes.ok) {
            const item = await itemRes.json();
            if (item && item.title) {
              return {
                id: `hn-${item.id}`,
                title: item.title,
                source: "Hacker News",
                url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
                score: item.score || 0,
                time: new Date((item.time || Date.now() / 1000) * 1000).toISOString()
              };
            }
          }
        } catch (e) {
          console.error(`Error fetching HN item ${id}:`, e);
        }
        return null;
      });

      const hnItems = (await Promise.all(hnPromises)).filter(Boolean);
      items.push(...hnItems);
    }
  } catch (err) {
    console.error("Error fetching Hacker News:", err);
  }

  try {
    // 2. Fetch NASA APOD (Space News)
    const NASA_API_KEY = process.env.NASA_API_KEY || "8jJgk4CQmPvzmmyuxwwSQKyGam7IbwHhTxCkCBVu";
    const dateStr = new Date().toISOString().split("T")[0];
    const nasaRes = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${dateStr}`);
    if (nasaRes.ok) {
      const data = await nasaRes.json();
      if (data && data.title) {
        items.push({
          id: `nasa-apod`,
          title: `NASA Discovery: ${data.title}`,
          source: "NASA Space Monitor",
          url: data.hdurl || data.url || "https://apod.nasa.gov/apod/",
          score: 150,
          time: new Date().toISOString(),
          originalSummary: data.explanation || ""
        });
      }
    }
  } catch (err) {
    console.error("Error fetching NASA APOD for news:", err);
  }

  // Fallback items if we fetched nothing
  if (items.length === 0) {
    items.push(
      {
        id: "fb-1",
        title: "Scientists develop new lightweight neuromorphic processor for ultra-low latency on-device AI",
        source: "World Monitor",
        url: "https://www.worldmonitor.app",
        score: 420,
        time: new Date().toISOString()
      },
      {
        id: "fb-2",
        title: "Ethereal spaces and focus state: Why micro-breaks with ambient lofi music enhance memory retention",
        source: "Productivity Science Weekly",
        url: "https://www.worldmonitor.app",
        score: 310,
        time: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: "fb-3",
        title: "NASA's James Webb Telescope discovers ancient atmospheric water signatures on nearby habitable zone exoplanet",
        source: "NASA Space Monitor",
        url: "https://apod.nasa.gov/apod/",
        score: 580,
        time: new Date(Date.now() - 7200000).toISOString()
      }
    );
  }

  cachedRawNews = items;
  lastNewsFetchTime = now;
  return items;
}

function getPersianFallbackNews(interests: string): any[] {
  return [
    {
      id: "ir-fb-1",
      title: "پیشرفت دانشمندان ایرانی در بومی‌سازی پردازنده‌های نورومورفیک فوق کم‌مصرف",
      source: "دیجیاتو",
      url: "https://digiato.com",
      aiSummary: "پژوهشگران کشورمان موفق به طراحی یک ریزتراشه هوش مصنوعی پیشرفته شدند که بدون نیاز به اینترنت، یادگیری ماشین را در دستگاه‌های کوچک پردازش می‌کند.",
      category: "Tech",
      importance: "high",
      time: new Date().toISOString()
    },
    {
      id: "ir-fb-2",
      title: "رشد چشمگیر پذیرش ابزارهای هوش مصنوعی مولد در کسب‌وکارهای نوپای کشور",
      source: "زومیت",
      url: "https://www.zoomit.ir",
      aiSummary: "آمارهای جدید نشان می‌دهند بیش از ۶۰ درصد استارتاپ‌های ایرانی برای بهبود بهره‌وری کدهای برنامه‌نویسی و خدمات مشتریان خود از دستیارهای هوشمند استفاده می‌کنند.",
      category: "Productivity",
      importance: "high",
      time: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "ir-fb-3",
      title: "رصد پدیده نجومی تماشایی هم‌ترازی سیارات در آسمان ایران",
      source: "ایسنا",
      url: "https://www.isna.ir",
      aiSummary: "علاقه‌مندان به نجوم در ایران بامداد فردا می‌توانند هم‌ترازی دیدنی چهار سیاره منظومه شمسی را با چشم غیرمسلح در افق شرقی رصد کنند.",
      category: "Science",
      importance: "medium",
      time: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: "ir-fb-4",
      title: "افزایش سرمایه‌گذاری شرکت‌های دانش‌بنیان در حوزه‌های انرژی تجدیدپذیر",
      source: "ایرنا",
      url: "https://www.irna.ir",
      aiSummary: "گزارش‌های دولتی از تخصیص تسهیلات ویژه برای استارتاپ‌های ایرانی فعال در حوزه سلول‌های خورشیدی و توربین‌های بادی نسل جدید خبر می‌دهند.",
      category: "Business",
      importance: "medium",
      time: new Date(Date.now() - 14400000).toISOString()
    }
  ];
}

app.post("/api/news", async (req, res) => {
  const { interests = "", focusMode = "Study Mode" } = req.body;

  // Attempt to query World Monitor API as requested, ignoring any Cloudflare/network blocks gracefully
  let worldMonitorData: any = null;
  try {
    const wmRes = await fetch("https://www.worldmonitor.app/api/v1/bulletins", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (wmRes.ok) {
      worldMonitorData = await wmRes.json();
      console.log("Successfully fetched bulletins from worldmonitor.app");
    } else {
      console.warn(`worldmonitor.app fetch returned status ${wmRes.status}`);
    }
  } catch (err) {
    console.warn("Could not reach worldmonitor.app API directly (Cloudflare or network constraint):", err);
  }

  try {
    // If AI is not available, we return premium quality fallback items in Persian
    if (!ai) {
      const parsed = getPersianFallbackNews(interests);
      return res.json({ news: parsed, groundingSources: [] });
    }

    const prompt = `You are a highly sophisticated Iranian News Intelligence Assistant.
Your job is to search for the most recent, high-value, and authentic news stories about Iran, written entirely in Persian (فارسی).

User interests: "${interests}"
Focus/Workspace Mode: "${focusMode}"

We also fetched some raw bulletins from worldmonitor.app (might be empty or global):
${JSON.stringify(worldMonitorData, null, 2)}

Instructions:
1. Conduct a real-time web search for the latest, authentic news about Iran, specifically prioritizing the user's interests: "${interests}".
2. Filter out low-value noise, ads, clickbait, and duplicate information.
3. Keep the entire output in Persian (فارسی) except for category labels which must match the standard English strings below for filter routing.
4. Structure your response containing an array of 6-8 news items conforming exactly to this schema:
{
  "news": [
    {
      "id": "unique-slug-string",
      "title": "A captivating, high-fidelity Persian headline",
      "source": "Official Persian news source name (e.g. دیجیاتو, زومیت, ایرنا, مهر, ایسنا, زومجی)",
      "url": "Valid source URI",
      "aiSummary": "A concise, elegant, 1-2 sentence intellectual summary/insight in Persian highlighting the impact",
      "category": "Tech" | "Science" | "Business" | "Productivity" | "General", // Choose one of these English words
      "importance": "high" | "medium" | "low", // Assign high if it matches interests or is major, otherwise medium/low
      "time": "ISO 8601 Timestamp of when the news was reported"
    }
  ]
}

Ensure all texts (title, aiSummary, source) are in high-quality Persian (فارسی). The category must be one of the English strings: "Tech", "Science", "Business", "Productivity", or "General" to prevent filtering issues in the client UI.`;

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: prompt
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING },
                  aiSummary: { type: Type.STRING },
                  category: { type: Type.STRING },
                  importance: { type: Type.STRING },
                  time: { type: Type.STRING }
                },
                required: ["id", "title", "source", "url", "aiSummary", "category", "importance", "time"]
              }
            }
          },
          required: ["news"]
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const responseText = response.text || "";
    let newsArray: any[] = [];
    try {
      const parsed = JSON.parse(responseText);
      newsArray = Array.isArray(parsed) ? parsed : parsed.news || [];
    } catch (parseErr) {
      console.error("Failed to parse Gemini response for news:", responseText, parseErr);
    }

    // Extract grounding sources to send to the client
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingSources = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "",
      url: chunk.web?.uri || ""
    })).filter((c: any) => c.title && c.url) || [];

    if (newsArray.length > 0) {
      return res.json({ news: newsArray, groundingSources });
    }

    // Fallback if parsed news is empty
    return res.json({ news: getPersianFallbackNews(interests), groundingSources: [] });

  } catch (err) {
    console.error("Error in /api/news route:", err);
    res.status(500).json({ error: "Failed to fetch and summarize news." });
  }
});

app.post("/api/holidays", async (req, res) => {
  const { year } = req.body;
  const targetYear = parseInt(year) || 1405;

  if (holidaysCache[targetYear]) {
    res.json({ holidays: holidaysCache[targetYear] });
    return;
  }

  if (!ai) {
    // If Gemini is not initialized, return empty list or just fixed shamsi ones
    res.json({ holidays: [] });
    return;
  }

  try {
    const prompt = `Search the web and find the complete official list of national, public, and religious holidays of Iran for the Shamsi (Jalaali) year ${targetYear} (which corresponds to Gregorian 2026-2027 roughly, or relevant years).
Include standard solar holidays and Islamic lunar holidays mapped to Jalaali dates.
For each holiday, return:
- "jy": ${targetYear} (as number)
- "jm": Jalaali month number (1 to 12 as number)
- "jd": Jalaali day number (1 to 31 as number)
- "titleFa": Clean Persian title of the holiday (e.g. "تاسوعای حسینی", "عید نوروز")
- "titleEn": English title of the holiday (e.g. "Tasua", "Nowruz")
- "isOfficial": true if it is a public holiday/day off, false otherwise.

Provide the response as a strict JSON array under the key "holidays" following this schema exactly. Do not wrap in markdown or add extra text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            holidays: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jy: { type: Type.INTEGER },
                  jm: { type: Type.INTEGER },
                  jd: { type: Type.INTEGER },
                  titleFa: { type: Type.STRING },
                  titleEn: { type: Type.STRING },
                  isOfficial: { type: Type.BOOLEAN }
                },
                required: ["jy", "jm", "jd", "titleFa", "titleEn", "isOfficial"]
              }
            }
          },
          required: ["holidays"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    if (parsed.holidays && Array.isArray(parsed.holidays)) {
      holidaysCache[targetYear] = parsed.holidays;
      res.json({ holidays: parsed.holidays });
    } else {
      res.json({ holidays: [] });
    }
  } catch (err: any) {
    const isRateLimit = err?.message?.includes("quota") || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      console.warn(`[Holidays] Rate limited/quota exceeded for year ${targetYear}. Returning empty holiday list.`);
    } else {
      console.error(`Error fetching holidays for year ${targetYear}:`, err);
    }
    res.json({ holidays: [] });
  }
});

// ----------------- FUN OCCASIONS & EXTERNAL HOLIDAYS API -----------------
app.post("/api/fun-occasions", async (req, res) => {
  const { dateStrG, year, month, day } = req.body;
  let targetYear = year;
  let targetMonth = month;
  let targetDay = day;

  if (dateStrG && (!targetYear || !targetMonth || !targetDay)) {
    const parts = dateStrG.split("-");
    targetYear = parseInt(parts[0]);
    targetMonth = parseInt(parts[1]);
    targetDay = parseInt(parts[2]);
  }

  targetYear = targetYear || 2026;
  targetMonth = targetMonth || 7;
  targetDay = targetDay || 16;

  const paddedMonth = String(targetMonth).padStart(2, "0");
  const paddedDay = String(targetDay).padStart(2, "0");

  const results: any[] = [];

  // 1. Fetch Abstract API Holidays (proxy)
  const abstractApiKey = process.env.ABSTRACT_API_HOLIDAYS_KEY || "f1a9a43a055340eb93051fe66cc379cc";
  const abstractUrl = `https://holidays.abstractapi.com/v1/?api_key=${abstractApiKey}&country=US&year=${targetYear}&month=${targetMonth}&day=${targetDay}`;

  try {
    const abstractRes = await fetch(abstractUrl);
    if (abstractRes.ok) {
      const data = await abstractRes.json();
      if (Array.isArray(data)) {
        data.forEach((h: any) => {
          results.push({
            source: "Abstract API Holidays",
            titleEn: h.name,
            type: h.type || "National"
          });
        });
      }
    }
  } catch (err) {
    console.warn("Abstract API Holiday fetch failed, proceeding with other sources:", err);
  }

  // 2. Query Wikidata API
  const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(`${paddedMonth}-${paddedDay}`)}&language=en&format=json&limit=5`;
  try {
    const wikiRes = await fetch(wikidataUrl);
    if (wikiRes.ok) {
      const data = await wikiRes.json();
      if (data.search && Array.isArray(data.search)) {
        data.search.forEach((item: any) => {
          if (item.label || item.description) {
            results.push({
              source: "Wikidata API",
              titleEn: item.label,
              descriptionEn: item.description
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn("Wikidata API fetch failed:", err);
  }

  // 3. Consolidate, translate to Persian, and inject Days Of The Year
  if (!ai) {
    res.json({
      occasions: results.map(r => ({
        titleFa: r.titleEn,
        isOfficial: r.type === "National" || false,
        isFun: true
      }))
    });
    return;
  }

  try {
    const prompt = `Consolidate these external raw events fetched from APIs on the Gregorian date ${targetYear}-${paddedMonth}-${paddedDay}:
${JSON.stringify(results, null, 2)}

Your task is to:
1. Translate all English event names, descriptions, or holiday titles into natural, beautifully styled Persian (Farsi).
2. Add any globally famous "Days Of The Year" (fun, wacky, or internet holidays like National Cat Day, Programmer's Day, Pi Day, Pizza Day, etc.) if they fall on this month/day (${paddedMonth}-${paddedDay}).
3. Return a clean, verified list of occasions for this specific calendar day.
Each occasion MUST contain:
- "titleFa": Elegant Persian title with relevant emojis (e.g. "روز جهانی پیتزا 🍕", "روز استقلال ایالات متحده 🇺🇸")
- "isOfficial": Boolean (true for major official national events, false for fun/informal ones)
- "isFun": Boolean (true if it's a wacky, fun, or internet-culture day)

Provide the response as a strict JSON array under the key "occasions". Do not add any explanation or markdown wraps.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            occasions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  titleFa: { type: Type.STRING },
                  isOfficial: { type: Type.BOOLEAN },
                  isFun: { type: Type.BOOLEAN }
                },
                required: ["titleFa", "isOfficial", "isFun"]
              }
            }
          },
          required: ["occasions"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    res.json({ occasions: parsed.occasions || [] });
  } catch (err) {
    console.error("Gemini failed to translate / build fun occasions:", err);
    res.json({ occasions: [] });
  }
});

// ----------------- MUSIC SEARCH & RESOLVE PROXIES -----------------

// A custom type for standard track responses
interface ProxyTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  cover: string;
  genre: string;
  format: string;
  duration: string;
}

// 1. Search Music Endpoint
app.get("/api/music/search", async (req, res) => {
  const engine = req.query.engine as string;
  const q = req.query.q as string;

  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "A search query is required." });
    return;
  }

  try {
    if (engine === "funkwhale") {
      const instance = "https://open.audio";
      const searchUrl = `${instance}/api/v1/tracks/?q=${encodeURIComponent(q)}`;
      const fwResponse = await fetch(searchUrl);
      if (!fwResponse.ok) {
        throw new Error(`Funkwhale search failed with status: ${fwResponse.status}`);
      }
      const data = await fwResponse.json() as any;
      const results = data.results || [];
      
      const tracks: ProxyTrack[] = results.map((t: any) => {
        let streamUrl = t.listen_url || "";
        if (streamUrl && !streamUrl.startsWith("http")) {
          streamUrl = `${instance}${streamUrl}`;
        }
        
        // Format duration
        const durationSec = t.duration || 0;
        const mins = Math.floor(durationSec / 60);
        const secs = Math.floor(durationSec % 60);
        const durationStr = durationSec > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : "LIVE";

        // Cover image
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
          genre: t.album?.title || "Funkwhale Track",
          format: "Funkwhale stream",
          duration: durationStr
        };
      });

      res.json({ results: tracks });
    } 
    else if (engine === "lastfm") {
      const apiKey = "4a9f5581a14c16a62016df3ccda3141f";
      const searchUrl = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(q)}&api_key=${apiKey}&format=json&limit=20`;
      const lastFmResponse = await fetch(searchUrl);
      if (!lastFmResponse.ok) {
        throw new Error(`Last.fm search failed with status: ${lastFmResponse.status}`);
      }
      const data = await lastFmResponse.json() as any;
      const results = data.results?.trackmatches?.track || [];

      const tracks: ProxyTrack[] = results.map((t: any, idx: number) => {
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
          url: `/api/music/resolve?artist=${encodeURIComponent(cleanArtist)}&track=${encodeURIComponent(cleanName)}`,
          cover: coverUrl,
          genre: "Last.fm Track",
          format: "Auto-resolved stream",
          duration: "3:30"
        };
      });

      res.json({ results: tracks });
    } 
    else if (engine === "youtube") {
      let results: any[] = [];
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (apiKey) {
        try {
          const resp = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=15&key=${apiKey}`);
          if (resp.ok) {
            const data = await resp.json() as any;
            results = (data.items || []).map((item: any) => ({
              id: `youtube-${item.id?.videoId}`,
              name: item.snippet?.title || "Untitled Video",
              artist: item.snippet?.channelTitle || "YouTube Creator",
              url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
              cover: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&fit=crop",
              genre: "YouTube Video",
              format: "YouTube stream",
              duration: "LIVE"
            })).filter((v: any) => v.id !== "youtube-undefined");
          }
        } catch (e) {
          console.error("YouTube API key search failed, using scrape fallback:", e);
        }
      }

      // Scraping fallback if API key not available or failed
      if (results.length === 0) {
        try {
          const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`;
          const resp = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9"
            }
          });

          if (resp.ok) {
            const html = await resp.text();
            const jsonStartMarker = "var ytInitialData = ";
            const jsonEndMarker = ";</script>";
            let jsonStr = "";
            const startIndex = html.indexOf(jsonStartMarker);
            if (startIndex !== -1) {
              const cut = html.substring(startIndex + jsonStartMarker.length);
              const endIndex = cut.indexOf(jsonEndMarker);
              if (endIndex !== -1) {
                jsonStr = cut.substring(0, endIndex);
              }
            }

            if (jsonStr) {
              const data = JSON.parse(jsonStr);
              const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
              if (contents && Array.isArray(contents)) {
                for (const item of contents) {
                  const video = item.videoRenderer;
                  if (video && video.videoId) {
                    const title = video.title?.runs?.[0]?.text || "Untitled Video";
                    const videoId = video.videoId;
                    const thumbnail = video.thumbnail?.thumbnails?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=400&fit=crop";
                    const channelTitle = video.ownerText?.runs?.[0]?.text || "YouTube Creator";
                    results.push({
                      id: `youtube-${videoId}`,
                      name: title,
                      artist: channelTitle,
                      url: `https://www.youtube.com/watch?v=${videoId}`,
                      cover: thumbnail,
                      genre: "YouTube Video",
                      format: "YouTube stream",
                      duration: "LIVE"
                    });
                    if (results.length >= 15) break;
                  }
                }
              }
            }
          }
        } catch (scrapeErr) {
          console.error("YouTube scraping failed:", scrapeErr);
        }
      }

      res.json({ results });
    }
    else if (engine === "archive") {
      const searchUrl = `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+(title:(${encodeURIComponent(q)})+OR+creator:(${encodeURIComponent(q)}))&fl[]=identifier,title,creator,description,downloads&sort[]=downloads+desc&rows=20&output=json`;
      const iaResponse = await fetch(searchUrl);
      if (!iaResponse.ok) {
        throw new Error(`Internet Archive search failed with status: ${iaResponse.status}`);
      }
      const data = await iaResponse.json() as any;
      const docs = data.response?.docs || [];

      const tracks: ProxyTrack[] = docs.map((doc: any) => {
        const identifier = doc.identifier;
        const coverUrl = `https://archive.org/services/img/${identifier}`;

        return {
          id: `archive-${identifier}`,
          name: doc.title || "Untitled Archive Audio",
          artist: doc.creator || "Unknown Creator",
          url: `/api/music/archive-stream/${identifier}`,
          cover: coverUrl,
          genre: "Internet Archive",
          format: "Archive.org stream",
          duration: "LIVE"
        };
      });

      res.json({ results: tracks });
    } 
    else {
      res.status(400).json({ error: "Invalid search engine." });
    }
  } catch (err: any) {
    console.error("Error in music search API:", err);
    res.status(500).json({ error: err.message || "Failed to search music." });
  }
});

// 2. Resolve Track Stream (Last.fm play query redirect)
app.get("/api/music/resolve", async (req, res) => {
  const artist = req.query.artist as string;
  const track = req.query.track as string;

  if (!artist || !track) {
    res.status(400).send("Missing artist or track parameters.");
    return;
  }

  try {
    // 1. First attempt: Search on Funkwhale (open.audio)
    const query = `${artist} ${track}`;
    const fwUrl = `https://open.audio/api/v1/tracks/?q=${encodeURIComponent(query)}`;
    const fwResponse = await fetch(fwUrl);
    if (fwResponse.ok) {
      const fwData = await fwResponse.json() as any;
      const fwTrack = fwData.results?.[0];
      if (fwTrack?.listen_url) {
        const streamUrl = fwTrack.listen_url.startsWith("http") 
          ? fwTrack.listen_url 
          : `https://open.audio${fwTrack.listen_url}`;
        res.redirect(302, streamUrl);
        return;
      }
    }

    // 2. Second attempt: Search on Internet Archive
    const iaUrl = `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+(title:(${encodeURIComponent(track)})+AND+creator:(${encodeURIComponent(artist)}))&fl[]=identifier&rows=1&output=json`;
    const iaResponse = await fetch(iaUrl);
    if (iaResponse.ok) {
      const iaData = await iaResponse.json() as any;
      const doc = iaData.response?.docs?.[0];
      if (doc?.identifier) {
        const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
        const metaResponse = await fetch(metaUrl);
        if (metaResponse.ok) {
          const metaData = await metaResponse.json() as any;
          const files = metaData.files || [];
          const mp3File = files.find((f: any) => {
            const name = (f.name || "").toLowerCase();
            const format = (f.format || "").toLowerCase();
            return (name.endsWith(".mp3") || format.includes("mp3")) && !name.includes("metadata");
          });
          if (mp3File) {
            const fileUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp3File.name)}`;
            res.redirect(302, fileUrl);
            return;
          }
        }
      }
    }

    // 3. Third attempt: Search broad name on Internet Archive
    const iaBroadUrl = `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+title:(${encodeURIComponent(track)})&fl[]=identifier&rows=1&output=json`;
    const iaBroadResponse = await fetch(iaBroadUrl);
    if (iaBroadResponse.ok) {
      const iaBroadData = await iaBroadResponse.json() as any;
      const doc = iaBroadData.response?.docs?.[0];
      if (doc?.identifier) {
        const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
        const metaResponse = await fetch(metaUrl);
        if (metaResponse.ok) {
          const metaData = await metaResponse.json() as any;
          const files = metaData.files || [];
          const mp3File = files.find((f: any) => {
            const name = (f.name || "").toLowerCase();
            const format = (f.format || "").toLowerCase();
            return (name.endsWith(".mp3") || format.includes("mp3")) && !name.includes("metadata");
          });
          if (mp3File) {
            const fileUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp3File.name)}`;
            res.redirect(302, fileUrl);
            return;
          }
        }
      }
    }

    // 4. Fallback to nice procedural royalty-free focus audio so it actually plays
    const songs = [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    ];
    const randomIndex = Math.floor(Math.random() * songs.length);
    res.redirect(302, songs[randomIndex]);
  } catch (err) {
    console.error("Error in resolve redirect API:", err);
    res.redirect(302, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  }
});

// Helper function to proxy external audio streams to avoid CORS/Redirect playback bugs
async function proxyStream(fileUrl: string, req: express.Request, res: express.Response) {
  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const audioResponse = await fetch(fileUrl, { headers });

    res.status(audioResponse.status);
    audioResponse.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if ([
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "cache-control"
      ].includes(k)) {
        res.setHeader(key, value);
      }
    });

    // Provide complete CORS access for proxy stability
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");

    if (audioResponse.body) {
      const { Readable } = await import("stream");
      Readable.fromWeb(audioResponse.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error(`Error proxying stream for ${fileUrl}:`, err);
    if (!res.headersSent) {
      res.status(500).send("Error proxying audio stream.");
    }
  }
}

// 3. Internet Archive MP3 stream resolution redirect proxy
app.get("/api/music/archive-stream/:identifier", async (req, res) => {
  const { identifier } = req.params;

  try {
    const url = `https://archive.org/metadata/${identifier}`;
    const response = await fetch(url);
    if (!response.ok) {
      res.status(404).send("Archive item metadata not found.");
      return;
    }
    const data = await response.json() as any;
    const files = data.files || [];
    
    // Find first MP3 file
    const mp3File = files.find((f: any) => {
      const name = (f.name || "").toLowerCase();
      const format = (f.format || "").toLowerCase();
      return (name.endsWith(".mp3") || format.includes("mp3")) && !name.includes("metadata");
    });

    if (mp3File) {
      const fileUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(mp3File.name)}`;
      await proxyStream(fileUrl, req, res);
    } else {
      // Fallback to any audio file
      const audioFile = files.find((f: any) => {
        const name = (f.name || "").toLowerCase();
        return name.endsWith(".ogg") || name.endsWith(".wav") || name.endsWith(".m4a");
      });
      if (audioFile) {
        const fileUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(audioFile.name)}`;
        await proxyStream(fileUrl, req, res);
      } else {
        res.status(404).send("No playable audio formats found for this Archive item.");
      }
    }
  } catch (err) {
    console.error(`Error resolving Archive stream for identifier ${identifier}:`, err);
    if (!res.headersSent) {
      res.status(500).send("Error resolving Archive stream.");
    }
  }
});

// ----------------- SPOTIFY OAUTH ENDPOINTS -----------------

app.get("/api/auth/spotify/client-id", (req, res) => {
  const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
  if (!spotifyClientId) {
    return res.status(500).json({ error: "SPOTIFY_CLIENT_ID is not configured in environment variables." });
  }
  res.json({ clientId: spotifyClientId });
});

app.get("/api/auth/spotify/url", (req, res) => {
  const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
  if (!spotifyClientId) {
    return res.status(500).json({ error: "SPOTIFY_CLIENT_ID is not configured in environment variables." });
  }

  const origin = req.query.origin || process.env.APP_URL || "http://localhost:3000";
  const redirectUri = `${origin}/auth/spotify/callback`;

  const scopes = [
    "streaming",
    "user-modify-playback-state",
    "user-read-playback-state",
    "user-read-currently-playing"
  ].join(" ");

  const params = new URLSearchParams({
    client_id: spotifyClientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
    show_dialog: "true",
    state: origin as string
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get("/auth/spotify/callback", async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;
  const state = req.query.state as string;

  if (error) {
    return res.send(`
      <html>
        <head><meta charset="utf-8"/><title>Spotify Error</title></head>
        <body style="background-color: #09090b; color: #ef4444; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 20px;">
            <h2>Spotify Connection Error</h2>
            <p>${error}</p>
            <p style="color: #a1a1aa; font-size: 13px;">This window will close shortly.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "SPOTIFY_AUTH_ERROR", error: "${error}" }, "*");
              setTimeout(() => window.close(), 2500);
            } else {
              window.location.href = "/";
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send("No authorization code provided.");
  }

  // With PKCE, we pass the raw authorization code back to the React app client,
  // which holds the cryptographically secure code_verifier inside localStorage.
  // The client then exchanges the code and verifier directly with Spotify.
  res.send(`
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Spotify Authenticated</title>
        <style>
          body {
            background-color: #09090b;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .spinner {
            border: 3px solid rgba(255,255,255,0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #1ed760;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h2>Connection Authorized!</h2>
        <p>Transferring code to secure workspace... This window will close shortly.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: "SPOTIFY_AUTH_CODE",
              payload: {
                code: ${JSON.stringify(code)},
                state: ${JSON.stringify(state)}
              }
            }, "*");
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            window.location.href = "/";
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/api/auth/spotify/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: "Missing refresh_token." });
  }

  try {
    const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
    const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!spotifyClientId || !spotifyClientSecret) {
      throw new Error("Spotify client credentials are not configured on the server.");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString("base64")
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token
      }).toString()
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`Token refresh failed with status ${response.status}: ${errTxt}`);
    }

    const tokenData = await response.json() as any;
    res.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    });
  } catch (err: any) {
    console.error("Error refreshing Spotify tokens:", err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------- SPOTIFY HEARTBEAT / SIMULATED ACTIVITY ENDPOINT -----------------
app.post("/api/spotify/heartbeat", (req, res) => {
  const { trackName, artist, isPlaying, mode, deviceId } = req.body;
  
  if (isPlaying) {
    console.log(`[Spotify Heartbeat] Simulated listen of "${trackName}" by "${artist}" [Mode: ${mode || "silent"}] (No real playback bandwidth used)`);
  } else {
    console.log(`[Spotify Heartbeat] Player is idle / paused.`);
  }

  res.json({
    status: "success",
    received: true,
    timestamp: Date.now(),
    message: isPlaying 
      ? `Successfully simulated heartbeat for "${trackName}".` 
      : "Logged idle/paused state successfully."
  });
});

// ----------------- STATIC FILES & VITE MIDDLEWARE -----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

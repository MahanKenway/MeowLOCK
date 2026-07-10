# Flocus - Next-Gen Focus Workspace 🌌

Flocus is a highly customizable, aesthetic, and distraction-free digital environment designed for students, deep workers, and creators. It is much more than a simple timer app—it is a unified sensory environment where time, organic procedural soundscapes, generative visuals, and structured task management merge into a singular, highly focused flow state.

---

## 🎨 Architectural Highlights & Features

### 1. Unified Sensory Environment & Personalization Engine
*   **Workspace Presets**: Instantly switch between custom modes like *Study Mode*, *Coding Mode*, *Relax Mode*, or save your active visuals, sounds, timer parameters, and widget visibility as a brand new profile.
*   **Glassmorphic Design**: An elegant glassmorphic dashboard that sits over a high-resolution background with responsive visual bounds (adjustable background blur and darkness overlays).

### 2. Multi-Mode Focus Timer System
*   **Four Integrated Modes**: Pomodoro (25/5), Stopwatch (for raw flow state tracking), Countdown Timer (custom duration), and Breaks.
*   **Procedural Meditation Bowl Chimes**: Using the client-side Web Audio API, Flocus synthesizes authentic, rich harmonic chime tones representing a meditation bowl—avoiding any heavy network requests.
*   **Floating Mini-Timer**: Pop open a floating micro-timer that hovers at the bottom corner of your workspace to monitor focus while referencing notes.

### 3. Procedural Organic Ambient Sound Mixer
*   *Zero network bandwidth white noise!* Using Web Audio API audio synthesis oscillators, standard white noise, pink noise, heavy rolling rainstorms, cafe chatter, and crackling log fires are synthesized entirely in code, giving users fine-grained volume sliders.

### 4. Grounded Quote & Cognitive Advice Engine
*   Includes a search-grounded quote module. Users can search for specific study advice, cognitive science tips, or motivating quotes by inputting topics (e.g., *quantum mechanics*, *literature*, *deep mathematics*). Powered by **Gemini 3.5 Flash** with Google Search grounding enabled, complete with source citations.

### 5. AI Study Assistant & Markdown Notes
*   A fully fledged note-taking panel with instant local persistence. Includes a powerful built-in **Gemini 3.1 Pro** assistant to summarize, expand, outline, structure, or generate flashcards directly from active notes. Includes a toggle to switch to high thinking mode for complex logical queries.

### 6. Generative Custom Wallpapers
*   Type a visual visual description (e.g., *cozy rain studio, warm lighting, anime watercolor*) and use **Gemini 3.1 Flash Image** to generate high-resolution backgrounds (choice of 1K, 2K, or 4K quality) instantly inside your browser.

---

## 🛠️ Tech Stack & Model Routing

*   **Frontend**: React 19, TypeScript, Tailwind CSS 4.0, Lucide Icons, Recharts (visual analytics), HTML5 Web Audio API.
*   **Backend**: Express.js server, TSX/Esbuild server compiler, Vite middleware.
*   **Model Routing**:
    *   `gemini-3.5-flash` (with Search Grounding): Motivational Quotes, cognitive tips, and search queries.
    *   `gemini-3.1-pro-preview` (with Thinking): AI Notes processing, summarizing, flashcard generation, and high thinking.
    *   `gemini-3.1-flash-image`: Custom high-fidelity wallpaper generation (1K, 2K, 4K resolutions).

---

## 🚀 Getting Started

### 1. Installation
To install the workspace dependencies, run:
```bash
npm run install
```

### 2. Start Development Server
Boot up the integrated Express backend server with Vite middleware support:
```bash
npm run dev
```
The server binds to port `3000` on your host.

### 3. Production Build
Compile both static frontend and compiled CommonJS backend:
```bash
npm run build
```
This will compile client files to `dist/` and generate a single self-contained `dist/server.cjs` bundle containing the backend server. Run it via:
```bash
npm start
```

---

## 🛡️ Key Security Guidelines
*   **No Exposed Credentials**: The Gemini API Key (`GEMINI_API_KEY`) is stored securely server-side and is never exposed to the client browser.
*   **API Proxies**: All AI calls are safely routed via standard POST endpoints (`/api/gemini/*`) to ensure client safety.

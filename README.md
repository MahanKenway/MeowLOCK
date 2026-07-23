# 🌌 Flocus — The Ultimate Retro-Futuristic Cognitive Workspace

[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-0052cc?style=flat-squared&logo=react)](https://react.dev)
[![Styles: Tailwind CSS 4.0](https://img.shields.io/badge/Styles-Tailwind%20CSS%204.0-38bdf8?style=flat-squared&logo=tailwind-css)](https://tailwindcss.com)
[![Engine: Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-ff6b6b?style=flat-squared&logo=soundcharts)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![AI Power: Gemini Pro/Flash](https://img.shields.io/badge/AI-Gemini%20Pro%20%26%20Flash-9b5de5?style=flat-squared&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

> **Flocus** is a highly premium, aesthetic, and distraction-free cognitive desktop designed for deep workers, programmers, and creators. It blends an elegant retro-futuristic operating system aesthetic with organic audio synthesis, generative AI tools, and structured task management into a singular, highly immersive flow-state environment.

---

## 🎨 Architectural Masterpieces & Core Subsystems

### 1. Retro OS Interface & Glassmorphism
*   **Fully Windowed Desktop:** Experience custom glassmorphic windows (e.g., `Tasks.exe`, `Notepad.exe`, `SoundMixer.exe`, `iPod_Classic.exe`, `Statistics.exe`) that are fully draggable with physical micro-animations.
*   **Aesthetic Background Damping:** Adjust background visual blur and dark overlay depth on the fly to tune your environmental sensory input.
*   **Dynamic Profiles:** Instantly hot-swap workspaces with pre-configured settings like *Study Mode*, *Coding Mode*, or *Relax Mode*, or construct and save your own layouts.

### 2. Synthesized Organic Audio Mixer (0% Bandwidth)
*   **Code-Generated Waveforms:** No heavy static sound assets or network requests! Flocus utilizes low-level `Web Audio API` oscillators and noise generators to construct organic soundscapes completely in-code:
    *   🌧️ *Heavy Rolling Rainstorms*
    *   🔥 *Crackling Log Fires*
    *   ☕ *Dynamic Cafe Chatter*
    *   🍃 *Forest Whispers*
    *   🌫️ *Procedural White, Pink, and Brown Noise*
*   **Zen Meditation Bowl Chimes:** Authentic harmonic chime sequences synthesized mathematically to represent traditional Tibetan bowls.

### 3. Integrated iPod Classic & Nano Music Suite
*   **Retro Simulation:** Switch between the complete full-scale `iPod Classic` (including a functional click-wheel scrolling simulator) or the minimal `iPod Nano` player interface.
*   **Aesthetic Presets:** Preloaded with rich, high-fidelity lofi study tracks, ambient coding space synths, and classical piano, along with live Radio Paradise and SomaFM shoegaze streams.
*   **Discover Live Archive Feed:** Search and stream millions of live concerts, bootlegs, and historic tapes directly from the *Internet Archive* and *Last.fm* API backends (fully updated to prioritize *My Chemical Romance* concert tapes out of the box).

### 4. Interactive Virtual Cat Companion (`CatCompanion.dat`)
*   Meet your procedural companion cat who roams, plays, naps, and sits on your active workspace cards.
*   Features physics-based dragging, contextual status responses, mood reactions, and click-to-pet feedback with dynamic text reactions.

### 5. Gemini AI Cognitive Hub
*   **Grounded Quotes & Cognitive Advice:** Search-grounded contextual search queries (e.g., *"How to beat procrastination in math"* or *"Best pomodoro schedules for programming"*). Backed by **Gemini 3.5 Flash** with Google Search Grounding to present authentic research citations.
*   **AI Markdown Notes Assistant:** A premium workspace note taker with instant local persistence and an embedded high-thinking **Gemini 3.1 Pro** engine to summarize, expand, outline, structure, or generate interactive study flashcards directly from active text.
*   **Generative Wallpapers:** Create breathtaking custom high-resolution canvas backdrops (1K, 2K, 4K quality options) by describing any visual mood (e.g., *"Cozy cyberpunk room, warm neon lights, rainy day anime pastel style"*) using **Gemini 3.1 Flash Image** generation.

---

## 🛠️ The Premium Technology Stack

```
   ┌───────────────────────────────────────────────────────────────┐
   │                       FLOCUS FRONTEND                         │
   │      React 19  •  TypeScript  •  Tailwind CSS 4.0             │
   └───────────────┬───────────────────────────────────────────────┘
                   │
                   ▼ (Express API Proxy / Static Assets)
   ┌───────────────────────────────────────────────────────────────┐
   │                        EXPRESS SERVER                         │
   │               Vite Middleware  •  Node.js ESM                 │
   └───────────────┬───────────────────────────────────────────────┘
                   │
                   ▼ (Server-Side Secure Gemini Handshake)
   ┌───────────────────────────────────────────────────────────────┐
   │                       GOOGLE GEMINI SDK                       │
   │  gemini-3.1-pro-preview  •  gemini-3.5-flash  •  Imagen 3     │
   └───────────────────────────────────────────────────────────────┘
```

*   **Audio DSP:** Web Audio API (gain nodes, biquad filters, dynamics compressors, brownian/white noise buffer source synthesis).
*   **Analytics Visualization:** SVG-rendered responsive trend charts powered by `Recharts`.
*   **Physics & Animation Engine:** Staggered spring dynamics and inertia controls courtesy of `motion/react`.

---

## 🚀 Getting Started

### 1. Environment Configuration
Create a secure `.env` file in the root folder (see `.env.example` as a template):
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 2. Dependency Installation
Initialize the clean, modular local package dependencies:
```bash
npm install
```

### 3. Run the Local Development Environment
Boot up the full-stack server running Vite's hot development server in-middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your retro-futuristic digital terminal!

### 4. Enterprise Production Compilation
Compile the static webapp and bundle the Express server into a standalone, ultra-fast executing server payload:
```bash
npm run build
```
Launch the compiled Node bundle:
```bash
npm run start
```

---

## 🛡️ Enterprise Security Architecture
*   **Secure API Encapsulation:** All sensitive API calls to the Gemini endpoints are proxied server-side via `/api/gemini/*` endpoints. **No API keys are ever leaked or accessible inside client network tabs.**
*   **Safe File I/O Sandbox:** User notes, task checklists, statistics, and theme preferences are bound securely to browser `localStorage` or cached in-sandbox, providing a rapid, seamless offline-first experience with zero tracking.

---

<p align="center">
  <i>"Simplicity is the ultimate sophistication. Focus is the ultimate weapon."</i><br>
  <b>Flocus Space Technologies © 2026. All rights reserved.</b>
</p>

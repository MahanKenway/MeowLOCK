<div align="center">

# 🐱 MeowLOCK

### *A retro-futuristic focus workspace that makes productivity feel like an aesthetic experience.*

<br/>

![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white&labelColor=20232a)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1e1e2e)
![Web Audio](https://img.shields.io/badge/Audio-Synthesized-ff6b6b?style=for-the-badge&labelColor=1a1a2e)
![Zero Tracking](https://img.shields.io/badge/Privacy-Zero_Tracking-00c853?style=for-the-badge&labelColor=1a1a2e)

<br/>

**Pomodoro timer. Ambient soundscapes. AI study assistant. iPod music player. Virtual cat companion.**

**All in one glassmorphic desktop that makes you *want* to focus.**

<br/>

---

</div>

<br/>

## 🌌 What is this?

MeowLOCK (codename: **Flocus**) is a fully customizable cognitive workspace that combines:

- A **retro OS desktop** with draggable glassmorphic windows
- **Procedurally generated ambient sounds** (rain, fire, cafe, forest — zero bandwidth)
- An **iPod Classic simulator** with real click-wheel navigation
- A **Gemini AI assistant** for notes, flashcards, and study help
- A **virtual cat** that roams your workspace and reacts to your clicks
- **Generative AI wallpapers** — describe a mood, get a 4K backdrop

It's what happens when you combine lofi hip hop radio with a Linux rice and an AI tutor.

<br/>

## ✨ Feature Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MeowLOCK WORKSPACE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🖥️ RETRO OS INTERFACE                                              │
│  ├── Glassmorphic draggable windows (Tasks.exe, Notepad.exe...)    │
│  ├── Dynamic blur & overlay controls                                │
│  ├── Hot-swappable profiles (Study / Coding / Relax)               │
│  └── Custom layout builder                                          │
│                                                                     │
│  🎵 SYNTHESIZED AUDIO MIXER (0% bandwidth)                          │
│  ├── 🌧️ Rainstorms (procedural noise synthesis)                     │
│  ├── 🔥 Crackling fire (oscillator-based)                           │
│  ├── ☕ Cafe chatter (generated, not sampled)                       │
│  ├── 🍃 Forest whispers                                             │
│  ├── 🌫️ White / Pink / Brown noise                                  │
│  └── 🔔 Tibetan bowl chimes (harmonic synthesis)                    │
│                                                                     │
│  🎶 iPOD CLASSIC & NANO PLAYER                                      │
│  ├── Functional click-wheel simulator                               │
│  ├── Lofi / Ambient / Classical presets                             │
│  ├── Live Radio Paradise & SomaFM streams                          │
│  └── Internet Archive concert search                                │
│                                                                     │
│  🐱 VIRTUAL CAT COMPANION                                           │
│  ├── Physics-based movement & dragging                              │
│  ├── Mood reactions & contextual responses                          │
│  ├── Sits on your active workspace cards                            │
│  └── Click-to-pet with dynamic text feedback                        │
│                                                                     │
│  🧠 GEMINI AI HUB                                                   │
│  ├── Search-grounded study advice (with citations)                  │
│  ├── AI notes assistant (summarize, expand, flashcards)             │
│  └── Generative wallpapers (describe mood → 4K image)              │
│                                                                     │
│  📊 ANALYTICS & TRACKING                                            │
│  ├── Focus session statistics                                       │
│  ├── Streak tracking                                                │
│  ├── SVG trend charts (Recharts)                                    │
│  └── Pomodoro / Stopwatch / Custom timers                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

<br/>

## 🎧 The Audio Engine

Most focus apps ship 50MB of audio files. MeowLOCK ships **zero**.

Every sound is synthesized in real-time using the Web Audio API — oscillators, noise buffers, biquad filters, and dynamics compressors. The result? Infinite, non-looping ambient soundscapes that never repeat and never buffer.

```javascript
// This is how rain sounds are made here:
// Not: <audio src="rain.mp3">
// But: BrownianNoise → BiquadFilter → DynamicsCompressor → GainNode → 🔊
```

<br/>

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| AI Engine | Google Gemini 3.1 Pro + Flash |
| Image Gen | Gemini Flash Image / Imagen 3 |
| Audio | Web Audio API (pure synthesis) |
| Styling | Tailwind CSS 4 |
| Animations | Motion (Framer Motion) |
| Charts | Recharts |
| Backend | Express.js (secure API proxy) |
| Build | Vite + esbuild |
| Calendar | Jalaali.js (Persian calendar support) |

<br/>

## 🚀 Quick Start

```bash
git clone https://github.com/MahanKenway/MeowLOCK.git
cd MeowLOCK
npm install
```

## 🛡️ Privacy

- All API calls proxied server-side — **no keys exposed to client**
- Notes, tasks, and preferences stored in **localStorage only**
- **Zero tracking. Zero analytics. Zero telemetry.**
- Your focus data stays on your machine. Period.

<br/>

## 🎨 The Philosophy

> Productivity tools shouldn't feel like spreadsheets. They should feel like *spaces* — places you want to inhabit while doing deep work.

MeowLOCK is built on the belief that aesthetics and function are not opposites. That a virtual cat walking across your task list makes you *more* productive, not less. That the sound of rain should be synthesized, not streamed. That your workspace should look like it belongs in a cyberpunk anime, because why not.

<br/>

## 📜 License

MIT — Focus freely.

---

<div align="center">

**Built with 🐱 by [Mahan Tavakoli](https://github.com/MahanKenway)**

*Lock in. Focus up. Pet the cat.*

<br/>

[![Star this repo](https://img.shields.io/github/stars/MahanKenway/MeowLOCK?style=social)](https://github.com/MahanKenway/MeowLOCK/stargazers)

</div>

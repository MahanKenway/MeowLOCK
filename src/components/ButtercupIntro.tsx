import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Stars, ChevronDown, Check } from "lucide-react";

interface ButtercupIntroProps {
  onEnter: () => void;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  opacity: number;
  fadeSpeed: number;
}

const FONTS = [
  { id: "cormorant", name: "Cormorant Italic (Poetic)", family: "'Cormorant Garamond', serif", italic: true, tracking: "tracking-wide" },
  { id: "alex-brush", name: "Alex Brush (Dreamy Script)", family: "'Alex Brush', cursive", italic: false, tracking: "tracking-normal" },
  { id: "playfair", name: "Playfair Display (Serif)", family: "'Playfair Display', serif", italic: true, tracking: "tracking-wide" },
  { id: "cinzel", name: "Cinzel (Celestial)", family: "'Cinzel', serif", italic: false, tracking: "tracking-widest" },
  { id: "parisienne", name: "Parisienne (Romance)", family: "'Parisienne', cursive", italic: false, tracking: "tracking-normal" }
];

export default function ButtercupIntro({ onEnter }: ButtercupIntroProps) {
  const [selectedFont, setSelectedFont] = useState(FONTS[0].id);
  const [isClosing, setIsClosing] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Canvas Galaxy & Starfield with Shooting Stars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Track mouse for subtle parallax
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.targetX = (e.clientX - width / 2) * 0.02;
      mousePos.current.targetY = (e.clientY - height / 2) * 0.02;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Generate Stars
    const starCount = Math.floor(Math.min(width, 1920) / 10);
    const starColors = [
      "rgba(255, 255, 255, ",
      "rgba(235, 245, 255, ",
      "rgba(224, 231, 255, ",
      "rgba(240, 249, 255, "
    ];

    const stars: Star[] = Array.from({ length: starCount }).map(() => {
      const baseAlpha = Math.random() * 0.65 + 0.25;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() < 0.85 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.2 + 1.2,
        alpha: baseAlpha,
        baseAlpha,
        twinkleSpeed: Math.random() * 0.025 + 0.008,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      };
    });

    const shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();

    const spawnShootingStar = () => {
      const startX = Math.random() * (width * 0.8) + width * 0.1;
      const startY = Math.random() * (height * 0.4);
      const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1); // ~45 degrees downward
      const speed = Math.random() * 12 + 14;

      shootingStars.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: Math.random() * 90 + 70,
        speed,
        opacity: 0.9,
        fadeSpeed: Math.random() * 0.015 + 0.012
      });
    };

    let tick = 0;
    const render = () => {
      tick++;
      // Smooth mouse follow
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Periodically trigger a shooting star
      const now = Date.now();
      if (now - lastShootingStarTime > 4500 && Math.random() < 0.03) {
        spawnShootingStar();
        lastShootingStarTime = now;
      }

      // Draw and update stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // Twinkle sinusoidal formula
        const twinkle = Math.sin(tick * s.twinkleSpeed + s.twinkleOffset);
        s.alpha = s.baseAlpha * (0.65 + 0.35 * twinkle);

        const renderX = s.x - mousePos.current.x * (s.size * 0.4);
        const renderY = s.y - mousePos.current.y * (s.size * 0.4);

        ctx.beginPath();
        ctx.arc(renderX, renderY, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${s.alpha})`;
        ctx.fill();

        // Extra outer glow for larger bright stars
        if (s.size > 1.8 && s.alpha > 0.6) {
          ctx.beginPath();
          ctx.arc(renderX, renderY, s.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${s.color}${s.alpha * 0.25})`;
          ctx.fill();
        }
      }

      // Draw and update shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.dx;
        ss.y += ss.dy;
        ss.opacity -= ss.fadeSpeed;

        if (ss.opacity <= 0 || ss.x > width || ss.y > height) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - (ss.dx / ss.speed) * ss.length;
        const tailY = ss.y - (ss.dy / ss.speed) * ss.length;

        const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
        grad.addColorStop(0.3, `rgba(224, 231, 255, ${ss.opacity * 0.6})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.stroke();

        // Bright star head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${ss.opacity})`;
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onEnter();
    }, 550);
  };

  // Keyboard shortcut: Press Enter or Space to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isClosing]);

  const activeFontObj = useMemo(() => {
    return FONTS.find((f) => f.id === selectedFont) || FONTS[0];
  }, [selectedFont]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: isClosing ? 0 : 1,
        scale: isClosing ? 1.03 : 1,
        filter: isClosing ? "blur(14px)" : "blur(0px)"
      }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden select-none backdrop-blur-2xl bg-slate-950/30 text-white"
    >
      {/* 1. Underlying App Transparency: The backdrop-blur-2xl bg-slate-950/30 allows the desktop wallpaper to shine through */}
      
      {/* 2. Soft Cosmic Nebula Glows (Ethereal translucent violet/indigo/cyan) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[25%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-indigo-500/[0.12] via-purple-500/[0.08] to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-cyan-500/[0.10] via-blue-500/[0.07] to-transparent blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[45vh] rounded-full bg-indigo-400/[0.06] blur-[140px]" />
      </div>

      {/* 3. Starry Galaxy & Shooting Stars Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full z-0"
      />

      {/* 4. Top Glass Controls: Font Customizer Pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.8 }}
        className="absolute top-6 right-6 z-20"
      >
        <div className="relative">
          <button
            onClick={() => setShowFontMenu(!showFontMenu)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/20 text-xs font-light text-slate-200 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline text-slate-400 text-[11px]">Font:</span>
            <span className="font-normal">{activeFontObj.name.split(" ")[0]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <AnimatePresence>
            {showFontMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 rounded-2xl backdrop-blur-2xl bg-slate-900/80 border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-2 z-30"
              >
                <div className="text-[10px] uppercase tracking-wider text-slate-400 px-3 py-1 font-medium">
                  Select Typography
                </div>
                <div className="space-y-1">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedFont(f.id);
                        setShowFontMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                        selectedFont === f.id
                          ? "bg-white/20 text-white font-medium"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span
                        style={{ fontFamily: f.family, fontStyle: f.italic ? "italic" : "normal" }}
                        className="text-sm"
                      >
                        {f.name}
                      </span>
                      {selectedFont === f.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 5. Central Ethereal Galaxy Workspace */}
      <div className="relative z-10 max-w-4xl px-6 sm:px-12 flex flex-col items-center text-center">
        {/* Celestial Star Constellation Spark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex items-center justify-center gap-3 mb-5 sm:mb-7"
        >
          <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="flex items-center gap-1.5 text-white/80">
            <span className="text-xs text-white/50">⋆</span>
            <span className="text-base sm:text-lg text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">✦</span>
            <span className="text-xs text-white/50">⋆</span>
          </div>
          <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </motion.div>

        {/* The Grand Title: Pure Moonlit White & Silver (No Gold/Amber) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative px-4"
        >
          <h1
            style={{
              fontFamily: activeFontObj.family,
              fontStyle: activeFontObj.italic ? "italic" : "normal"
            }}
            className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[1.12] ${activeFontObj.tracking} text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.7)] transition-all duration-300 font-light`}
          >
            i miss you buttercup
          </h1>

          {/* Starlight cosmic glow aura */}
          <div className="absolute inset-0 -z-10 bg-white/[0.08] blur-3xl rounded-full scale-110 pointer-events-none" />
        </motion.div>

        {/* Delicate Starlight Orbit Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="my-6 sm:my-8 flex items-center justify-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          <div className="w-1 h-1 rounded-full bg-white/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        </motion.div>

        {/* 6. Pure Frosted Glass Button (ترنسپرنت و شیشه‌ای) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          className="flex flex-col items-center gap-3.5"
        >
          <button
            onClick={handleClose}
            className="group relative px-10 sm:px-14 py-4 rounded-full backdrop-blur-2xl bg-white/[0.08] hover:bg-white/[0.18] active:bg-white/[0.12] border border-white/25 hover:border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[0_0_30px_rgba(255,255,255,0.35)] transition-all duration-500 hover:scale-[1.04] active:scale-[0.98] flex items-center gap-3 cursor-pointer"
          >
            {/* Shimmer pulse inside frosted button */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <span className="relative text-xs sm:text-sm font-light tracking-[0.3em] uppercase text-slate-100 group-hover:text-white transition-colors">
              Enter Space
            </span>

            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
          </button>

          {/* Quick keyboard hint */}
          <p className="text-[11px] text-slate-400 font-light tracking-wide">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/15 text-slate-300 font-mono text-[10px]">Enter</kbd> or click to open
          </p>
        </motion.div>
      </div>

      {/* 7. Bottom Cosmic Subtle Signoff */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="absolute bottom-6 flex items-center gap-2 text-[11px] text-slate-400 font-light tracking-widest uppercase"
      >
        <span>✧</span>
        <span>starlight memories</span>
        <span>✧</span>
      </motion.div>
    </motion.div>
  );
}

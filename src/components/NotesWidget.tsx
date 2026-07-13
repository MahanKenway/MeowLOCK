import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Copy,
  Check,
  Download,
  Trash2,
  Edit3,
  Eraser,
  RotateCcw,
  RotateCw,
  Plus,
  FileText,
  Palette,
  Pin,
  PinOff,
  ChevronDown,
  Tablet,
  Save,
  Sparkles,
  RefreshCw
} from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { motion, AnimatePresence } from "motion/react";

interface DrawPoint {
  x: number;
  y: number;
}

interface DrawPath {
  points: DrawPoint[];
  color: string;
  width: number;
}

interface PolaroidItem {
  id: string;
  src: string;
  caption: string;
  x: number;
  y: number;
  rotate: number;
}

interface StickerItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
  rotate: number;
  scale?: number;
}

interface NotePage {
  id: string;
  title: string;
  type: "text" | "whiteboard";
  content: string;
  drawPaths: DrawPath[];
  polaroids?: PolaroidItem[];
  stickers?: StickerItem[];
  fontFamily?: string;
  textureStyle?: string;
}

const PHOTO_PRESETS = [
  { name: "📜 Old Desk", url: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=200&auto=format&fit=crop" },
  { name: "☕ Cozy Cafe", url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=200&auto=format&fit=crop" },
  { name: "🌌 Night Sky", url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=200&auto=format&fit=crop" },
  { name: "📻 Old Radio", url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop" },
  { name: "🌲 Forest Camp", url: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=200&auto=format&fit=crop" }
];

const playVintageSound = (type: "flip" | "scratch" | "pin" | "burn") => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === "flip") {
      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.setValueAtTime(4, now);
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (type === "scratch") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.05);
      
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "pin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === "burn") {
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(1200, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    }
  } catch (e) {
    // Audio Context is blocked or not supported
  }
};

interface NotesWidgetProps {
  noteContent: string;
  onChange: (content: string) => void;
  isMiniMode?: boolean;
  setIsMiniMode?: (mini: boolean) => void;
  viewMode?: "normal" | "mini" | "alt" | "alt_mini";
  setViewMode?: (mode: "normal" | "mini" | "alt" | "alt_mini") => void;
  onClose?: () => void;
}

export default function NotesWidget({
  noteContent,
  onChange,
  isMiniMode = false,
  setIsMiniMode,
  viewMode = "normal",
  setViewMode,
  onClose
 }: NotesWidgetProps) {
  const [altPreview, setAltPreview] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const notebookRef = useRef<HTMLDivElement | null>(null);

  // Load pages from localStorage, or setup standard default pages
  const [pages, setPages] = useState<NotePage[]>(() => {
    try {
      const saved = localStorage.getItem("flocus_notepad_pages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading notepad pages", e);
    }

    return [
      {
        id: "default-text",
        title: "📝 Study Goals & Notes",
        type: "text",
        content: noteContent || `# 🎓 Welcome to Notepad!\n\nUse this space to write lecture summaries, build plans, or organize study chapters. \n\n* **Markdown support** is fully enabled!\n* Click the **Pin icon** above to turn this into a minimal sticky note.\n* Create a **Whiteboard canvas** to sketch diagrams!`,
        drawPaths: []
      },
      {
        id: "default-board",
        title: "🎨 Sketchboard",
        type: "whiteboard",
        content: "",
        drawPaths: []
      }
    ];
  });

  const [activePageId, setActivePageId] = useState<string>(pages[0]?.id || "default-text");
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [copied, setCopied] = useState(false);

  // Whiteboard drawing options
  const [brushColor, setBrushColor] = useState("#8b5cf6"); // Purple default
  const [brushWidth, setBrushWidth] = useState(4);
  const [drawTool, setDrawTool] = useState<"pen" | "eraser">("pen");
  const [redoStack, setRedoStack] = useState<DrawPath[]>([]);

  // Refs for whiteboard drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<DrawPath | null>(null);
  const isInternalChangeRef = useRef(false);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // Sync pages to localStorage
  useEffect(() => {
    localStorage.setItem("flocus_notepad_pages", JSON.stringify(pages));
    
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    // Maintain outer compatibility
    const mainTextPage = pages.find((p) => p.type === "text");
    if (mainTextPage && mainTextPage.content !== noteContent) {
      onChange(mainTextPage.content);
    }
  }, [pages]);

  // Keep internal page content synced with parent if prop updates from outside
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    if (activePage && activePage.type === "text" && activePage.content !== noteContent) {
      setPages((prev) =>
        prev.map((p) => (p.id === activePage.id ? { ...p, content: noteContent } : p))
      );
    }
  }, [noteContent]);

  // Create a new page
  const handleCreatePage = (type: "text" | "whiteboard") => {
    const newId = `page-${Date.now()}`;
    const newPage: NotePage = {
      id: newId,
      title: type === "text" ? `📝 Document ${pages.length + 1}` : `🎨 Drawing Board ${pages.length + 1}`,
      type,
      content: type === "text" ? "# New Lecture Notes\n\nWrite down your concepts here..." : "",
      drawPaths: []
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageId(newId);
    setShowPageSelector(false);
    setIsRenaming(true);
    setRenameValue(newPage.title);
  };

  // Delete current page
  const handleDeletePage = () => {
    if (pages.length <= 1) return; // Must have at least one page
    const remaining = pages.filter((p) => p.id !== activePageId);
    setPages(remaining);
    setActivePageId(remaining[0].id);
  };

  // Rename current page
  const handleRenamePage = () => {
    if (!renameValue.trim()) return;
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, title: renameValue.trim() } : p))
    );
    setIsRenaming(false);
  };

  // Copy Markdown note to clipboard
  const handleCopy = () => {
    if (activePage.type !== "text") return;
    navigator.clipboard.writeText(activePage.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export current file
  const handleDownload = () => {
    if (activePage.type === "text") {
      const element = document.createElement("a");
      const file = new Blob([activePage.content], { type: "text/markdown" });
      element.href = URL.createObjectURL(file);
      element.download = `${activePage.title.replace(/[^\w\s-]/gi, "").trim()}.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      // Export whiteboard canvas as image
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const element = document.createElement("a");
      element.href = dataUrl;
      element.download = `${activePage.title.replace(/[^\w\s-]/gi, "").trim()}.png`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // --- WHITEBOARD CANVAS DRAWING UTILITIES ---

  // Draws all stored paths + active drawing path to the HTML5 canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Smooth canvas drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid guide lines (subtle blueprint background)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const paths = activePage.drawPaths || [];

    // Redraw all vectors
    paths.forEach((path) => {
      if (!path.points || path.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current active path
    if (currentPathRef.current && currentPathRef.current.points.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = currentPathRef.current.color;
      ctx.lineWidth = currentPathRef.current.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(currentPathRef.current.points[0].x, currentPathRef.current.points[0].y);
      for (let i = 1; i < currentPathRef.current.points.length; i++) {
        ctx.lineTo(currentPathRef.current.points[i].x, currentPathRef.current.points[i].y);
      }
      ctx.stroke();
    }
  };

  // Manage Resize and responsive canvas drawing
  useEffect(() => {
    if (activePage?.type !== "whiteboard") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // set display dimensions correctly
        canvas.width = width || 320;
        canvas.height = height || 240;
        drawCanvas();
      }
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [activePageId, activePage?.drawPaths, activePage?.type]);

  // Pointer Event listeners
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    const strokeColor = drawTool === "eraser" ? "#0a0a0a" : brushColor;
    const strokeWidth = drawTool === "eraser" ? brushWidth * 3 : brushWidth;

    currentPathRef.current = {
      points: [{ x, y }],
      color: strokeColor,
      width: strokeWidth
    };

    drawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (!isDrawingRef.current || !currentPathRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPathRef.current.points.push({ x, y });
    drawCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (!isDrawingRef.current || !currentPathRef.current) return;
    isDrawingRef.current = false;

    // Add current path to our list of drawings
    const finishedPath = currentPathRef.current;
    currentPathRef.current = null;

    setPages((prev) =>
      prev.map((p) => {
        if (p.id === activePageId) {
          return {
            ...p,
            drawPaths: [...(p.drawPaths || []), finishedPath]
          };
        }
        return p;
      })
    );
    // Clear Redo stack on new drawing
    setRedoStack([]);
  };

  // Clear Board drawing
  const handleClearBoard = () => {
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, drawPaths: [] } : p))
    );
    setRedoStack([]);
  };

  // Whiteboard Undo
  const handleUndo = () => {
    const paths = activePage.drawPaths || [];
    if (paths.length === 0) return;
    const last = paths[paths.length - 1];
    setRedoStack((prev) => [...prev, last]);
    
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === activePageId) {
          return {
            ...p,
            drawPaths: p.drawPaths.slice(0, -1)
          };
        }
        return p;
      })
    );
  };

  // Whiteboard Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    setPages((prev) =>
      prev.map((p) => {
        if (p.id === activePageId) {
          return {
            ...p,
            drawPaths: [...(p.drawPaths || []), next]
          };
        }
        return p;
      })
    );
  };

  // Get word count
  const getWordCount = () => {
    if (activePage.type !== "text") return 0;
    const clean = activePage.content.trim();
    if (!clean) return 0;
    return clean.split(/\s+/).length;
  };

  // Colors list for Whiteboard sketching
  const colorsList = [
    { name: "Purple", value: "#8b5cf6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Emerald", value: "#10b981" },
    { name: "White", value: "#ffffff" }
  ];

  // Render Mini View (Sticky Desk mode)
  if (isMiniMode) {
    return (
      <div 
        id="notes-widget-mini" 
        className="w-full h-full flex flex-col justify-between text-white select-none relative group h-full"
        data-color-mode="dark"
      >
        {/* Header sticker label with unpin trigger */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1.5 select-none z-50">
          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
            📌 Sticky • {activePage.title}
          </span>
          <button
            onClick={() => setIsMiniMode?.(false)}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 hover:bg-white/10 text-amber-400 hover:text-amber-300 rounded-lg cursor-pointer transition-transform hover:scale-110"
            title="Unpin Sticky Note"
          >
            <PinOff className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1" onPointerDown={(e) => e.stopPropagation()}>
          {activePage.type === "text" ? (
            <div className="text-[11px] font-sans text-gray-300 leading-relaxed max-w-full overflow-hidden whitespace-pre-wrap select-text markdown-body">
              <MDEditor.Markdown source={activePage.content || "*Empty quick-note*"} style={{ backgroundColor: 'transparent', fontSize: '11px' }} />
            </div>
          ) : (
            <div className="w-full h-full min-h-[90px] relative rounded-lg overflow-hidden bg-[#0c0c0c]/40 border border-white/5">
              <canvas
                ref={canvasRef}
                className="w-full h-full pointer-events-none opacity-90"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderAltMode = () => {
    const isAltMini = viewMode === "alt_mini";

    const activePolaroids: PolaroidItem[] = activePage.polaroids || [
      {
        id: "default-p1",
        src: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=200&auto=format&fit=crop",
        caption: "Focus Chamber",
        x: 6,
        y: 53,
        rotate: 3
      }
    ];

    const activeStickers: StickerItem[] = activePage.stickers || [
      {
        id: "default-s1",
        emoji: "☕",
        x: 62,
        y: 12,
        rotate: -12,
        scale: 1.2
      },
      {
        id: "default-s2",
        emoji: "🌿",
        x: 84,
        y: 72,
        rotate: 15,
        scale: 1.1
      }
    ];

    const pageFontFamily = activePage.fontFamily || "font-clock-architects";
    const pageTextureStyle = activePage.textureStyle || "parchment";

    const updateActivePageField = (field: string, value: any) => {
      setPages(prev => prev.map(p => p.id === activePageId ? { ...p, [field]: value } : p));
    };

    const getPageBackground = (side: "left" | "right", styleName: string) => {
      const align = side === "left" ? "30% 20%" : "70% 20%";
      if (styleName === "kraft") {
        return `radial-gradient(circle at ${align}, #e3cca6 0%, #cbaf81 60%, #a28250 100%)`;
      }
      if (styleName === "math") {
        return `radial-gradient(circle at ${align}, #f3f5f8 0%, #e6ecf2 100%)`;
      }
      if (styleName === "ivory") {
        return `radial-gradient(circle at ${align}, #ffffff 0%, #faf8f5 100%)`;
      }
      return `radial-gradient(circle at ${align}, #fefcf8 0%, #f9f5e8 60%, #ecdbb2 100%)`;
    };

    return (
      <div 
        className="w-full h-full flex items-center justify-center select-none font-clock-architects relative"
        style={{
          background: "radial-gradient(circle, rgba(40,32,22,0.1) 0%, rgba(20,15,10,0.3) 100%)",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Bookmark Ribbon at the top to switch back to normal view */}
        {setViewMode && (
          <button
            onClick={() => {
              setViewMode("normal");
              if (soundEnabled) playVintageSound("flip");
            }}
            className="absolute top-0 right-8 z-50 bg-red-800 hover:bg-red-700 text-amber-100 text-[10px] font-bold px-2 py-3 shadow-md rounded-b-md transition-all duration-300 hover:py-4 border-x border-b border-red-950 flex flex-col items-center gap-0.5 cursor-pointer"
            title="Switch back to Modern UI"
          >
            <span className="uppercase tracking-widest text-[7px]" style={{ writingMode: "vertical-lr" }}>Modern</span>
            <span className="text-[8px]">✕</span>
          </button>
        )}

        {/* The open notebook structure */}
        <div 
          ref={notebookRef}
          className="relative flex rounded-2xl transition-all duration-300 overflow-visible"
          style={{
            width: isAltMini ? "440px" : "780px",
            height: isAltMini ? "315px" : "510px",
          }}
        >
          {/* Leather cover background */}
          <div 
            className="absolute -inset-1.5 bg-gradient-to-br from-[#4a2e13] via-[#2c1b0a] to-[#160d04] rounded-[18px] shadow-[0_20px_45px_rgba(0,0,0,0.85)] border border-amber-950/40 pointer-events-none"
            style={{
              boxShadow: "0 20px 50px -10px rgba(0,0,0,0.9), inset 0 1px 3px rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute inset-1.5 border border-amber-600/10 rounded-[14px] pointer-events-none" />
          </div>

          {/* LEFT PAGE */}
          <div 
            className="w-1/2 h-full rounded-l-[12px] relative overflow-hidden flex flex-col p-3.5 border-r border-amber-950/25 shadow-[-8px_8px_16px_rgba(0,0,0,0.25)]"
            style={{
              background: getPageBackground("left", pageTextureStyle),
            }}
          >
            {/* Grid background for math theme */}
            {pageTextureStyle === "math" && (
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(rgba(139,90,43,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,90,43,0.15) 1px, transparent 1px)",
                  backgroundSize: "14px 14px"
                }}
              />
            )}

            {/* Lined paper lines */}
            {pageTextureStyle !== "math" && (
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(#8b5a2b 1px, transparent 1px)",
                  backgroundSize: "100% 24px",
                  top: "40px"
                }}
              />
            )}

            {/* Book crease shadow gradient */}
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/25 pointer-events-none" />

            {/* Binder ring hole strip */}
            <div className="absolute top-0 right-1 bottom-0 w-3 flex flex-col justify-around py-8 opacity-75 pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-1.5 h-3 bg-stone-900 rounded-full shadow-inner border border-stone-950/40" />
              ))}
            </div>

            {/* Left Page Title / Header */}
            <div className="relative z-10 text-center mb-1.5 select-none border-b border-amber-900/10 pb-1 mt-0.5">
              <span className="text-[11px] text-amber-900/60 font-black tracking-widest uppercase font-mono">My Journal</span>
            </div>

            {/* Left Page Content Wrapper */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-between overflow-hidden py-1">
              {/* Note Selector Paper Card (Index) */}
              <div 
                className="w-[94%] bg-[#faf5ec] p-2 rounded-lg shadow border border-amber-900/10 relative -rotate-1 transform hover:rotate-0 transition-transform duration-300 flex flex-col"
                style={{
                  maxHeight: isAltMini ? "95px" : "155px",
                }}
              >
                {/* Red pushpin at top center */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-red-600 rounded-full shadow-md border-b-2 border-red-800 z-20" />
                
                <span className="text-[8px] text-amber-800/60 font-black tracking-wider uppercase mb-1 border-b border-amber-900/5 pb-0.5">Chapters</span>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5 text-left text-amber-950 text-[10px]">
                  {pages.map((p) => {
                    const isSelected = p.id === activePageId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActivePageId(p.id);
                          setAltPreview(false);
                          if (soundEnabled) playVintageSound("flip");
                        }}
                        className={`w-full text-left truncate py-0.5 px-1 rounded hover:bg-amber-900/5 flex items-center gap-1 cursor-pointer transition-colors ${
                          isSelected ? "font-bold text-amber-800 underline decoration-amber-600/50 underline-offset-1" : "text-amber-900/70"
                        }`}
                      >
                        <span>{p.type === "text" ? "📝" : "🎨"}</span>
                        <span>{p.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stationeries & Scrapbooking Box */}
              <div 
                className="w-[94%] bg-[#f7eed9] p-2 rounded-lg border border-amber-900/15 shadow-inner relative flex flex-col gap-1 text-left font-sans"
                style={{
                  minHeight: isAltMini ? "110px" : "195px"
                }}
              >
                {/* Brass corner brackets */}
                <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-amber-800/40" />
                <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-amber-800/40" />
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-amber-800/40" />
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-amber-800/40" />

                <span className="text-[8px] text-amber-800/70 font-black uppercase tracking-widest border-b border-amber-900/10 pb-0.5 mb-0.5 flex items-center justify-between">
                  <span>🛠 Stationery & Craft</span>
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="text-[9px] hover:text-amber-950 focus:outline-none flex items-center gap-0.5 cursor-pointer"
                    title={soundEnabled ? "Disable Sounds" : "Enable Sounds"}
                  >
                    {soundEnabled ? "🔊" : "🔇"}
                  </button>
                </span>

                <div className="space-y-1 text-[8px] text-amber-950">
                  {/* Row 1: Font & Paper */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[6px] text-amber-800/50 font-bold uppercase">Ink Font</span>
                      <select
                        value={pageFontFamily}
                        onChange={(e) => {
                          updateActivePageField("fontFamily", e.target.value);
                          if (soundEnabled) playVintageSound("flip");
                        }}
                        className="bg-[#faf5ec] border border-amber-900/10 rounded px-1 py-0.5 text-[7.5px] text-amber-900 focus:outline-none cursor-pointer font-bold"
                      >
                        <option value="font-clock-architects">✍ Whimsical</option>
                        <option value="font-clock-specialelite">⌨ Typewriter</option>
                        <option value="font-clock-sacramento">🖋 Cursive</option>
                        <option value="font-clock-cinzel">🏛 Classic</option>
                        <option value="font-clock-mono">💻 Monospace</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[6px] text-amber-800/50 font-bold uppercase">Page Style</span>
                      <select
                        value={pageTextureStyle}
                        onChange={(e) => {
                          updateActivePageField("textureStyle", e.target.value);
                          if (soundEnabled) playVintageSound("flip");
                        }}
                        className="bg-[#faf5ec] border border-amber-900/10 rounded px-1 py-0.5 text-[7.5px] text-amber-900 focus:outline-none cursor-pointer font-bold"
                      >
                        <option value="parchment">📜 Parchment</option>
                        <option value="kraft">📦 Kraft Paper</option>
                        <option value="math">📐 Vintage Grid</option>
                        <option value="ivory">✉ Ivory Clean</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Add Stickers */}
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <span className="text-[6px] text-amber-800/50 font-bold uppercase">Affix Stamps (Click to Stamp & Drag!)</span>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 bg-[#faf5ec]/60 border border-amber-900/5 rounded px-1">
                      {["☕", "🪐", "🌿", "🕯", "🎞", "📌", "⭐", "🧸", "💮", "🗝", "📮", "🦖"].map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            const newSticker = {
                              id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                              emoji: st,
                              x: 20 + Math.random() * 45,
                              y: 20 + Math.random() * 45,
                              rotate: -15 + Math.random() * 30,
                              scale: 1 + Math.random() * 0.2
                            };
                            updateActivePageField("stickers", [...activeStickers, newSticker]);
                            if (soundEnabled) playVintageSound("pin");
                          }}
                          className="text-[11px] hover:scale-125 hover:bg-amber-900/5 p-0.5 rounded cursor-pointer transition-all duration-200"
                          title={`Pin ${st} Stamp`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 3: Polaroid Keepsakes */}
                  <div className="flex flex-col gap-1 pt-1 border-t border-amber-900/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[6px] text-amber-800/50 font-bold uppercase">Polaroid Keepsakes</span>
                      <button
                        onClick={() => setShowAddPhotoModal(true)}
                        className="text-[7px] bg-amber-800 hover:bg-amber-700 text-amber-50 px-1.5 py-0.5 rounded shadow-sm cursor-pointer font-bold flex items-center gap-0.5 transition-colors"
                      >
                        📸 Add Photo
                      </button>
                    </div>

                    <div className="text-[6.5px] text-amber-900/60 flex items-center gap-1 truncate max-w-full">
                      <span className="font-bold">Keepsakes:</span>
                      {activePolaroids.length === 0 ? (
                        <span>None pinned</span>
                      ) : (
                        <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-full">
                          {activePolaroids.map((p, idx) => (
                            <span key={p.id} className="bg-amber-900/5 px-1 py-0.2 rounded inline-block whitespace-nowrap text-[6px]">
                              🖼 {p.caption || `Pic ${idx + 1}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Left Page Footer navigation */}
            <div className="relative z-10 flex items-center justify-between text-[8px] text-amber-900/40 border-t border-amber-900/5 pt-1 mt-0.5 font-mono">
              <span>Vol. II</span>
              <span>Page {pages.findIndex(p => p.id === activePageId) * 2 + 1}</span>
            </div>
          </div>

          {/* RIGHT PAGE */}
          <div 
            className="w-1/2 h-full rounded-r-[12px] relative overflow-hidden flex flex-col p-3.5 shadow-[8px_8px_16px_rgba(0,0,0,0.25)]"
            style={{
              background: getPageBackground("right", pageTextureStyle),
            }}
          >
            {/* Grid background for math theme */}
            {pageTextureStyle === "math" && (
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(rgba(139,90,43,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,90,43,0.15) 1px, transparent 1px)",
                  backgroundSize: "14px 14px"
                }}
              />
            )}

            {/* Lined paper lines - only show if active page is TEXT */}
            {pageTextureStyle !== "math" && activePage.type === "text" && (
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(#8b5a2b 1px, transparent 1px)",
                  backgroundSize: "100% 24px",
                  top: "40px"
                }}
              />
            )}

            {/* Book crease shadow gradient */}
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-l from-transparent to-black/25 pointer-events-none" />

            {/* Binder ring hole strip */}
            <div className="absolute top-0 left-1 bottom-0 w-3 flex flex-col justify-around py-8 opacity-75 pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-1.5 h-3 bg-stone-900 rounded-full shadow-inner border border-stone-950/40" />
              ))}
            </div>

            {/* Paper Clip Memo Card at Top Right */}
            <div 
              onClick={() => {
                if (activePage.type === "text") {
                  setAltPreview(!altPreview);
                  if (soundEnabled) playVintageSound("flip");
                }
              }}
              className={`absolute top-2 right-4 z-25 bg-[#fdfbf6] border border-amber-900/10 shadow p-1 px-1.5 flex flex-col cursor-pointer transition-transform duration-300 hover:scale-105 ${
                isAltMini ? "-rotate-1" : "-rotate-3"
              }`}
              style={{
                width: isAltMini ? "90px" : "120px"
              }}
              title="Click to toggle Markdown Preview!"
            >
              {/* Paperclip */}
              <div className="absolute -top-3.5 left-4 w-3 h-7 border-2 border-stone-400 rounded-full -rotate-12 bg-transparent" />
              
              <span className="text-[6.5px] text-amber-800/70 font-bold uppercase tracking-wider">Memo Sticker</span>
              <span className="text-[7.5px] text-amber-950 font-black truncate mt-0.5">
                {activePage.type === "text" ? `${getWordCount()} Words` : "Sketch Canvas"}
              </span>
              {activePage.type === "text" && (
                <span className="text-[6px] text-emerald-700 font-bold mt-0.5 animate-pulse">
                  {altPreview ? "🖋 Click to Write" : "👁 Click to Read"}
                </span>
              )}
            </div>

            {/* Active page title editable field */}
            <div className="relative z-10 flex items-center gap-1 mb-1.5 mt-0.5 select-none pr-[95px] border-b border-amber-900/10 pb-1">
              <span className="text-[11px]">{activePage.type === "text" ? "🖋" : "🎨"}</span>
              <input
                type="text"
                value={activePage.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setPages(prev => prev.map(p => p.id === activePageId ? { ...p, title: val } : p));
                }}
                className={`bg-transparent border-none text-[10.5px] font-black text-amber-900 focus:outline-none w-full hover:bg-amber-900/5 focus:bg-amber-900/5 px-1 rounded ${pageFontFamily}`}
                title="Click to rename note"
              />
            </div>

            {/* Core writing or sketch area */}
            <div className="relative z-10 flex-1 flex flex-col min-h-0">
              {activePage.type === "text" ? (
                altPreview ? (
                  /* MD PREVIEW HANDWRITTEN */
                  <div className="flex-1 overflow-y-auto no-scrollbar pr-1 select-text text-[11px] leading-[24px] text-amber-950/90 py-1">
                    <div className="markdown-body opacity-90 prose prose-stone prose-sm">
                      <MDEditor.Markdown 
                        source={activePage.content || "*Empty creative note...*"} 
                        style={{ 
                          backgroundColor: 'transparent', 
                          fontSize: '11px', 
                          fontFamily: pageFontFamily === "font-clock-specialelite" ? '"Special Elite", monospace' : 
                                      pageFontFamily === "font-clock-sacramento" ? '"Sacramento", cursive' : 
                                      pageFontFamily === "font-clock-cinzel" ? '"Cinzel", serif' : 
                                      pageFontFamily === "font-clock-mono" ? '"JetBrains Mono", monospace' : 
                                      '"Architects Daughter", cursive',
                          color: '#3d2f1d',
                          lineHeight: '24px'
                        }} 
                      />
                    </div>
                  </div>
                ) : (
                  /* LINED HANDWRITTEN TEXTAREA EDITOR */
                  <textarea
                    value={activePage.content}
                    onChange={(e) => {
                      const updatedVal = e.target.value;
                      isInternalChangeRef.current = true;
                      setPages((prev) =>
                        prev.map((p) => (p.id === activePageId ? { ...p, content: updatedVal } : p))
                      );
                      onChange(updatedVal);
                      if (soundEnabled && Math.random() < 0.15) {
                        playVintageSound("scratch");
                      }
                    }}
                    className={`flex-1 w-full bg-transparent border-none focus:outline-none resize-none text-[11.5px] text-amber-950 leading-[24px] py-[3px] select-text custom-scrollbar pr-1 ${pageFontFamily}`}
                    style={{
                      backgroundImage: "none",
                      lineHeight: "24px",
                      caretColor: "#8b5a2b",
                    }}
                    placeholder="Write your creative plans or notes here..."
                  />
                )
              ) : (
                /* SKETCHBOARD CANVAS inside book */
                <div className="flex-1 flex flex-col min-h-0 relative select-none">
                  {/* Floating drawing toolbar inside book page */}
                  <div className="absolute top-1 left-1 right-1 z-20 bg-[#faf5eb]/95 border border-amber-900/10 rounded-lg p-1 shadow flex items-center justify-between gap-1">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setDrawTool("pen")}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          drawTool === "pen" ? "bg-amber-800 text-amber-100" : "text-amber-900/60 hover:text-amber-900 hover:bg-amber-900/5"
                        }`}
                        title="Pen"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDrawTool("eraser")}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          drawTool === "eraser" ? "bg-amber-800 text-amber-100" : "text-amber-900/60 hover:text-amber-900 hover:bg-amber-900/5"
                        }`}
                        title="Eraser"
                      >
                        <Eraser className="w-3 h-3" />
                      </button>
                    </div>

                    {drawTool === "pen" && (
                      <div className="flex items-center gap-0.5 border-l border-amber-900/10 pl-1">
                        {colorsList.slice(0, 5).map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setBrushColor(c.value)}
                            className="w-2.5 h-2.5 rounded-full transition-transform hover:scale-110 cursor-pointer relative"
                            style={{ backgroundColor: c.value }}
                          >
                            {brushColor === c.value && (
                              <span className="absolute inset-0 border border-neutral-900 rounded-full scale-50 bg-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-0.5 border-l border-amber-900/10 pl-1">
                      <button
                        onClick={handleUndo}
                        disabled={(activePage.drawPaths || []).length === 0}
                        className="p-1 disabled:opacity-20 text-amber-900/60 hover:text-amber-900 cursor-pointer"
                        title="Undo"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleClearBoard}
                        disabled={(activePage.drawPaths || []).length === 0}
                        className="p-1 disabled:opacity-20 text-amber-900/60 hover:text-amber-900 cursor-pointer"
                        title="Clear"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Canvas container inside book right page */}
                  <div className="flex-1 w-full relative rounded-lg overflow-hidden border border-amber-900/10 bg-[#fbf9f2] flex items-stretch mt-7">
                    <canvas
                      ref={canvasRef}
                      onPointerDownCapture={(e) => {
                        e.stopPropagation();
                        handlePointerDown(e);
                        if (soundEnabled && Math.random() < 0.4) {
                          playVintageSound("scratch");
                        }
                      }}
                      onPointerMove={(e) => {
                        handlePointerMove(e);
                        if (soundEnabled && isDrawingRef.current && Math.random() < 0.08) {
                          playVintageSound("scratch");
                        }
                      }}
                      onPointerUp={handlePointerUp}
                      className="flex-1 cursor-crosshair touch-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Handwritten Doodle Buttons at bottom margins of Right Page */}
            <div className="relative z-10 flex items-center justify-around text-[9px] text-amber-900/70 border-t border-amber-900/10 pt-1 mt-1 select-none font-sans font-bold">
              <button
                onClick={() => {
                  handleCreatePage("text");
                  if (soundEnabled) playVintageSound("flip");
                }}
                className="hover:text-amber-950 hover:underline cursor-pointer transition-colors"
                title="Add a new page"
              >
                ✎ +Note
              </button>
              <button
                onClick={() => {
                  handleCreatePage("whiteboard");
                  if (soundEnabled) playVintageSound("flip");
                }}
                className="hover:text-amber-950 hover:underline cursor-pointer transition-colors"
                title="Add a new sketch"
              >
                🎨 +Sketch
              </button>
              <button
                onClick={() => {
                  handleDeletePage();
                  if (soundEnabled) playVintageSound("burn");
                }}
                disabled={pages.length <= 1}
                className="hover:text-rose-800 disabled:opacity-30 cursor-pointer transition-colors"
                title="Burn/Delete this page"
              >
                🔥 Burn
              </button>
            </div>

            {/* Right Page Footer navigation */}
            <div className="relative z-10 flex items-center justify-between text-[7.5px] text-amber-900/40 mt-0.5 font-mono">
              <span>Page {pages.findIndex(p => p.id === activePageId) * 2 + 2}</span>
              <span>Anno Domini 2026</span>
            </div>
          </div>

          {/* DYNAMIC STICKERS (ABSOLUTE DRAGGABLE) */}
          {activeStickers.map((item) => (
            <motion.div
              key={item.id}
              drag={true}
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={notebookRef}
              onDragEnd={(event, info) => {
                if (!notebookRef.current) return;
                const rect = notebookRef.current.getBoundingClientRect();
                const relX = info.point.x - rect.left;
                const relY = info.point.y - rect.top;
                
                const xPercent = Math.max(0, Math.min(94, (relX / rect.width) * 100));
                const yPercent = Math.max(0, Math.min(94, (relY / rect.height) * 100));
                
                const updatedStickers = activeStickers.map(s => 
                  s.id === item.id ? { ...s, x: xPercent, y: yPercent } : s
                );
                updateActivePageField("stickers", updatedStickers);
                if (soundEnabled) playVintageSound("pin");
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing text-2xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] select-none group/sticker flex items-center justify-center transition-shadow"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `rotate(${item.rotate}deg) scale(${item.scale || 1})`,
              }}
            >
              <span>{item.emoji}</span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedStickers = activeStickers.filter(s => s.id !== item.id);
                  updateActivePageField("stickers", updatedStickers);
                  if (soundEnabled) playVintageSound("burn");
                }}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-700 hover:bg-red-600 text-white flex items-center justify-center text-[7px] opacity-0 group-hover/sticker:opacity-100 transition-opacity shadow duration-200 cursor-pointer z-50"
                title="Remove Sticker"
              >
                ✕
              </button>
            </motion.div>
          ))}

          {/* DYNAMIC POLAROIDS (ABSOLUTE DRAGGABLE) */}
          {activePolaroids.map((item) => (
            <motion.div
              key={item.id}
              drag={true}
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={notebookRef}
              onDragEnd={(event, info) => {
                if (!notebookRef.current) return;
                const rect = notebookRef.current.getBoundingClientRect();
                const relX = info.point.x - rect.left;
                const relY = info.point.y - rect.top;
                
                const xPercent = Math.max(0, Math.min(90, (relX / rect.width) * 100));
                const yPercent = Math.max(0, Math.min(90, (relY / rect.height) * 100));
                
                const updatedPolaroids = activePolaroids.map(p => 
                  p.id === item.id ? { ...p, x: xPercent, y: yPercent } : p
                );
                updateActivePageField("polaroids", updatedPolaroids);
                if (soundEnabled) playVintageSound("pin");
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing bg-[#fcfaf4] p-1.5 pb-2.5 border border-amber-900/10 shadow-[0_8px_16px_rgba(0,0,0,0.35)] flex flex-col items-center group/polaroid"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `rotate(${item.rotate}deg)`,
                width: isAltMini ? "90px" : "110px",
              }}
            >
              {/* Metallic clip overlay */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-5 border-2 border-stone-500 rounded-full rotate-3 bg-transparent z-40 shadow-sm pointer-events-none" />
              
              <div className="w-full aspect-square bg-[#eedcb5] overflow-hidden border border-amber-900/10 rounded-sm relative pointer-events-none">
                <img 
                  src={item.src || undefined} 
                  alt={item.caption}
                  className="w-full h-full object-cover filter sepia contrast-[1.1] brightness-[0.93] grayscale-[10%]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 to-transparent mix-blend-overlay" />
              </div>
              
              <span className="text-[6.5px] text-amber-900/60 mt-1 font-black tracking-tight truncate w-full text-center select-none pointer-events-none">
                {item.caption}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedPolaroids = activePolaroids.filter(p => p.id !== item.id);
                  updateActivePageField("polaroids", updatedPolaroids);
                  if (soundEnabled) playVintageSound("burn");
                }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-700 hover:bg-red-600 text-white flex items-center justify-center text-[8px] opacity-0 group-hover/polaroid:opacity-100 transition-opacity shadow duration-200 cursor-pointer z-50 animate-fade-in"
                title="Remove Polaroid"
              >
                ✕
              </button>
            </motion.div>
          ))}

          {/* BRASS SPINE RINGS COLUMN */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-40 flex flex-col justify-around py-8 pointer-events-none h-full w-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="relative w-full h-10 flex items-center justify-center">
                <div className="absolute w-3.5 h-8 border-[2px] border-black/35 rounded-full blur-[1px] translate-x-0.5 translate-y-0.5" />
                <div 
                  className="w-4 h-8 border-[2px] border-amber-800/90 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #6a4f1a 0%, #b89c56 25%, #f7e6a1 50%, #b89c56 75%, #4a3811 100%)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.4)"
                  }}
                />
              </div>
            ))}
          </div>

        </div>

        {/* Add Polaroid Keepsake Modal Dialogue */}
        {showAddPhotoModal && (
          <div className="absolute inset-0 bg-amber-950/45 backdrop-blur-sm rounded-2xl z-50 flex items-center justify-center font-sans">
            <div className="bg-[#fcfaf4] border-2 border-amber-900/30 p-4 rounded-xl shadow-2xl max-w-[290px] w-full text-left relative rotate-1">
              <div className="absolute -top-3 left-6 w-3 h-7 border-2 border-stone-500 rounded-full rotate-12 bg-transparent z-10 pointer-events-none" />

              <h3 className="text-[10px] font-black text-amber-900 tracking-wider uppercase border-b border-amber-900/15 pb-1 mb-2.5 flex items-center gap-1">
                📸 Add Polaroid Keepsake
              </h3>

              <div className="space-y-2 text-[8.5px] text-amber-950">
                {/* Preset Picker */}
                <div>
                  <span className="text-[7px] text-amber-800/60 font-black uppercase block mb-1">Select Vintage Preset</span>
                  <div className="grid grid-cols-2 gap-1 bg-[#faf5ec] p-1.5 rounded border border-amber-900/10">
                    {PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setNewPhotoUrl(preset.url);
                          setNewPhotoCaption(preset.name.substring(2));
                          if (soundEnabled) playVintageSound("scratch");
                        }}
                        className={`text-left p-1 rounded hover:bg-amber-900/10 text-[7.5px] cursor-pointer truncate font-bold transition-colors ${
                          newPhotoUrl === preset.url ? "bg-amber-800 text-amber-50" : "text-amber-900/70"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[7px] text-amber-800/60 font-black uppercase">Custom Image URL</span>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="w-full bg-[#faf5ec] border border-amber-900/15 rounded p-1 text-[8px] text-amber-950 focus:outline-none focus:border-amber-900/30"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[7px] text-amber-800/60 font-black uppercase">Keepsake Caption</span>
                  <input
                    type="text"
                    placeholder="E.g., Winter Coffee"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="w-full bg-[#faf5ec] border border-amber-900/15 rounded p-1 text-[8px] text-amber-950 focus:outline-none focus:border-amber-900/30"
                    maxLength={16}
                  />
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-amber-900/10">
                  <button
                    onClick={() => {
                      setShowAddPhotoModal(false);
                      setNewPhotoUrl("");
                      setNewPhotoCaption("");
                    }}
                    className="px-2 py-1 text-stone-500 hover:bg-stone-100 rounded text-[8px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newPhotoUrl) return;
                      const newPolaroid = {
                        id: `p-${Date.now()}`,
                        src: newPhotoUrl,
                        caption: newPhotoCaption || "Memories",
                        x: 35 + Math.random() * 20,
                        y: 30 + Math.random() * 20,
                        rotate: -10 + Math.random() * 20
                      };
                      updateActivePageField("polaroids", [...activePolaroids, newPolaroid]);
                      setShowAddPhotoModal(false);
                      setNewPhotoUrl("");
                      setNewPhotoCaption("");
                      if (soundEnabled) playVintageSound("pin");
                    }}
                    disabled={!newPhotoUrl}
                    className="px-3 py-1 bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-50 rounded text-[8px] font-bold cursor-pointer shadow-sm"
                  >
                    Pin Polaroid
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  if (viewMode === "alt" || viewMode === "alt_mini") {
    return renderAltMode();
  }

  return (
    <div
      id="notes-widget"
      className="bg-[#0a0a0a]/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-white"
      data-color-mode="dark"
    >
      {/* 1. WIDGET CONTROLS HEADER */}
      <div className="flex items-center justify-between mb-4 select-none relative z-40">
        <div className="flex items-center gap-2">
          {/* Page drop-down selector */}
          <div className="relative">
            <button
              onClick={() => setShowPageSelector(!showPageSelector)}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[12px] font-sans font-bold cursor-pointer transition-colors"
            >
              {activePage.type === "text" ? "📝" : "🎨"}
              <span className="max-w-[120px] truncate">{activePage.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Selector list dropdown */}
            {showPageSelector && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute left-0 mt-1.5 w-56 bg-neutral-950/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-scale-up"
              >
                <div className="text-[10px] text-gray-500 font-bold px-2 py-1 select-none">
                  Switch Study Document
                </div>
                <div className="max-h-48 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePageId(p.id);
                        setShowPageSelector(false);
                      }}
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-[11px] font-sans cursor-pointer transition-colors ${
                        p.id === activePageId
                          ? "bg-[#7c3aed] text-white font-semibold"
                          : "text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {p.type === "text" ? "📝" : "🎨"} {p.title}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/5 my-1" />
                <div className="grid grid-cols-2 gap-1 select-none">
                  <button
                    onClick={() => handleCreatePage("text")}
                    className="flex items-center justify-center gap-1 py-1 px-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 font-semibold cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Note
                  </button>
                  <button
                    onClick={() => handleCreatePage("whiteboard")}
                    className="flex items-center justify-center gap-1 py-1 px-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 font-semibold cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Sketch
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Renamer Toggle */}
          {isRenaming ? (
            <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenamePage}
                onKeyDown={(e) => e.key === "Enter" && handleRenamePage()}
                className="bg-neutral-900 border border-amber-400/50 rounded-lg px-2 py-0.5 text-[11px] text-white focus:outline-none w-32 font-sans"
                autoFocus
              />
              <button
                onClick={handleRenamePage}
                className="p-1 text-emerald-400 hover:text-emerald-300 bg-white/5 rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsRenaming(true);
                setRenameValue(activePage.title);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Rename active notebook"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Toolbar actions */}
        <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          {/* Vintage Diary View Mode triggers */}
          {setViewMode && (
            <>
              <button
                onClick={() => setViewMode("alt_mini")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  (viewMode as string) === "alt_mini"
                    ? "bg-[#7c3aed] text-white"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title="Compact Vintage Diary (ALT Mini)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("alt")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  (viewMode as string) === "alt"
                    ? "bg-[#7c3aed] text-white"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title="Vintage Journal Diary (ALT)"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Pin/Sticky Desk mode trigger */}
          {setIsMiniMode && (
            <button
              onClick={() => setIsMiniMode(true)}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
              title="Pin Sticky Note to Desktop"
            >
              <Pin className="w-4 h-4" />
            </button>
          )}

          {/* Copy markdown text */}
          {activePage.type === "text" && (
            <button
              onClick={handleCopy}
              disabled={!activePage.content}
              className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Copy to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          {/* Export File / canvas */}
          <button
            onClick={handleDownload}
            disabled={activePage.type === "text" ? !activePage.content : false}
            className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={activePage.type === "text" ? "Download .MD Document" : "Download PNG Sketch"}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete Page */}
          <button
            onClick={handleDeletePage}
            disabled={pages.length <= 1}
            className="p-1.5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 disabled:opacity-20 rounded-lg text-gray-400 transition-colors cursor-pointer"
            title="Delete this page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN ACTIVE PAGE CONTAINER */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {activePage.type === "text" ? (
          /* ================= MARKDOWN WRITING CONSOLE ================= */
          <div className="flex-1 flex flex-col min-h-0" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex-1 overflow-hidden border border-white/10 rounded-xl bg-neutral-900/10 backdrop-blur-3xl">
              <MDEditor
                value={activePage.content}
                onChange={(val) => {
                  const updatedVal = val || "";
                  isInternalChangeRef.current = true;
                  setPages((prev) =>
                    prev.map((p) => (p.id === activePageId ? { ...p, content: updatedVal } : p))
                  );
                  onChange(updatedVal);
                }}
                height="100%"
                style={{
                  borderRadius: "0.75rem",
                  border: "none",
                  backgroundColor: "transparent",
                  height: "100%"
                }}
                previewOptions={{
                  style: {
                    backgroundColor: "transparent"
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-[9px] text-gray-500 font-mono select-none pointer-events-none">
              <span>{getWordCount()} Words</span>
              <span>{activePage.content.length} Characters</span>
            </div>
          </div>
        ) : (
          /* ================= PROCEDURAL VECTOR WHITEBOARD ================= */
          <div className="flex-1 flex flex-col min-h-0 relative select-none" onPointerDown={(e) => e.stopPropagation()}>
            {/* Drawing toolkit floating rail */}
            <div
              className="absolute top-2 left-2 z-10 bg-neutral-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-3.5 shadow-xl"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Tool (Pen vs Eraser) */}
              <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                <button
                  onClick={() => setDrawTool("pen")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    drawTool === "pen" ? "bg-[#7c3aed] text-white" : "text-gray-400 hover:text-white"
                  }`}
                  title="Sketch Brush"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDrawTool("eraser")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    drawTool === "eraser" ? "bg-[#7c3aed] text-white" : "text-gray-400 hover:text-white"
                  }`}
                  title="Eraser"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Color swatch selector */}
              {drawTool === "pen" && (
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 select-none">
                  {colorsList.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setBrushColor(c.value)}
                      className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-115 cursor-pointer relative"
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {brushColor === c.value && (
                        <span className="absolute inset-0 border border-neutral-950 rounded-full scale-75 bg-transparent" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Slider for brush size */}
              <div className="flex items-center gap-1.5 border-r border-white/10 pr-2">
                <span className="text-[9px] font-mono text-gray-500">Size</span>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={brushWidth}
                  onChange={(e) => setBrushWidth(Number(e.target.value))}
                  className="w-14 accent-[#7c3aed] bg-white/10 h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Undo/Redo & clear stack */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={(activePage.drawPaths || []).length === 0}
                  className="p-1 hover:bg-white/10 disabled:opacity-20 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Undo Stroke"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1 hover:bg-white/10 disabled:opacity-20 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Redo Stroke"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleClearBoard}
                  disabled={(activePage.drawPaths || []).length === 0}
                  className="p-1 hover:bg-rose-500/20 disabled:opacity-20 rounded-lg text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Clear whiteboard canvas"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Drawing Area Canvas container */}
            <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden bg-[#0a0a0a]/50 border border-white/10 flex items-stretch">
              <canvas
                ref={canvasRef}
                onPointerDownCapture={(e) => {
                  e.stopPropagation();
                  handlePointerDown(e);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="flex-1 cursor-crosshair touch-none"
              />
            </div>
            <div className="mt-1 px-1 text-[9px] text-gray-500 font-mono select-none pointer-events-none">
              <span>🎨 Vector Engine • {(activePage.drawPaths || []).length} lines drawn • Smooth anti-alias on</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

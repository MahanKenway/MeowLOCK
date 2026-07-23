import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Search, Lock, Unlock, Settings, Download, Plus, X,
  Bookmark, Highlighter, MessageSquare, Clock, Sparkles, RotateCcw,
  FileText, ChevronLeft, ChevronRight, AlertCircle, Trash, ExternalLink, HelpCircle, Globe,
  ZoomIn, ZoomOut, RotateCw, Eye, EyeOff, Maximize2, Minimize2, Printer,
  Award, Layers
} from "lucide-react";
import TiltedCard from "./TiltedCard";

// Types for Library and Study Workspace
interface Book {
  id: string;
  name: string;
  isbn?: string;
  authors: string[];
  cover?: string;
  publisher?: string;
  year?: string;
  language?: string;
  extension?: string;
  size?: string;
  rating?: string;
  download_url?: string;
  url?: string;
}

interface StudyHighlight {
  id: string;
  text: string;
  page: number;
  color: "yellow" | "green" | "blue" | "pink";
  timestamp: string;
}

interface StudyBookmark {
  id: string;
  page: number;
  label: string;
  timestamp: string;
}

interface StudyFlashcard {
  id: string;
  question: string;
  answer: string;
  correctCount: number;
  incorrectCount: number;
}

interface BookStudyData {
  bookId: string;
  bookTitle: string;
  notes: string;
  highlights: StudyHighlight[];
  bookmarks: StudyBookmark[];
  flashcards?: StudyFlashcard[];
}

interface LibraryWidgetProps {
  onClose?: () => void;
  accentColor?: string;
  glassStyle?: string;
}

const getBookColor = (book: Book | null) => {
  if (!book) return {
    primary: "#10b981", // Emerald
    primaryRgb: "16, 185, 129",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    gradient: "from-emerald-500/20 to-teal-500/20",
    text: "text-emerald-400"
  };
  // Hash the book title to get a stable, beautiful color!
  let hash = 0;
  const title = book.name || "";
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    { primary: "#ef4444", primaryRgb: "239, 68, 68", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", gradient: "from-red-500/20 to-orange-500/20", text: "text-red-400" }, // Red
    { primary: "#f97316", primaryRgb: "249, 115, 22", bg: "rgba(249, 115, 22, 0.15)", border: "rgba(249, 115, 22, 0.3)", gradient: "from-orange-500/20 to-amber-500/20", text: "text-orange-400" }, // Orange
    { primary: "#eab308", primaryRgb: "234, 179, 8", bg: "rgba(234, 179, 8, 0.15)", border: "rgba(234, 179, 8, 0.3)", gradient: "from-yellow-500/20 to-amber-500/20", text: "text-yellow-400" }, // Yellow
    { primary: "#22c55e", primaryRgb: "34, 197, 94", bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", gradient: "from-green-500/20 to-emerald-500/20", text: "text-green-400" }, // Green
    { primary: "#10b981", primaryRgb: "16, 185, 129", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", gradient: "from-emerald-500/20 to-teal-500/20", text: "text-emerald-400" }, // Emerald
    { primary: "#06b6d4", primaryRgb: "6, 182, 212", bg: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.3)", gradient: "from-cyan-500/20 to-blue-500/20", text: "text-cyan-400" }, // Cyan
    { primary: "#3b82f6", primaryRgb: "59, 130, 246", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", gradient: "from-blue-500/20 to-indigo-500/20", text: "text-blue-400" }, // Blue
    { primary: "#6366f1", primaryRgb: "99, 102, 241", bg: "rgba(99, 102, 241, 0.15)", border: "rgba(99, 102, 241, 0.3)", gradient: "from-indigo-500/20 to-purple-500/20", text: "text-indigo-400" }, // Indigo
    { primary: "#a855f7", primaryRgb: "168, 85, 247", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", gradient: "from-purple-500/20 to-pink-500/20", text: "text-purple-400" }, // Purple
    { primary: "#ec4899", primaryRgb: "236, 72, 153", bg: "rgba(236, 72, 153, 0.15)", border: "rgba(236, 72, 153, 0.3)", gradient: "from-pink-500/20 to-rose-500/20", text: "text-pink-400" } // Pink
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3, delayMs = 1200): Promise<Response> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      const errText = await response.text().catch(() => "");
      throw new Error(`Server status ${response.status}: ${errText || response.statusText || "Query failed"}`);
    } catch (err: any) {
      lastError = err;
      if (i < retries - 1) {
        console.warn(`Fetch to ${url} failed (attempt ${i + 1}/${retries}). Retrying in ${delayMs}ms...`, err);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

export default function LibraryWidget({
  onClose,
  accentColor = "from-emerald-500 to-teal-500",
  glassStyle = "bg-slate-900/80 border-slate-700/50 text-white"
}: LibraryWidgetProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"search" | "reader" | "history">("search");
  
  // Search & Mirror Configuration
  const [query, setQuery] = useState("");
  const [mirror, setMirror] = useState(() => {
    return localStorage.getItem("meowlock_zlib_mirror") || "https://z-library.se";
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<"all" | "gutenberg" | "open_library" | "z_library">("all");

  // Authentication Settings
  const [showConfig, setShowConfig] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [cookies, setCookies] = useState<any>(() => {
    const saved = localStorage.getItem("meowlock_zlib_cookies");
    return saved ? JSON.parse(saved) : null;
  });

  // Active Reading Book Info
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Native clean e-book reader states
  const [nativeText, setNativeText] = useState<string | null>(null);
  const [nativeHtml, setNativeHtml] = useState<string | null>(null);
  const [readerFontSize, setReaderFontSize] = useState<number>(16);
  const [readerFontFamily, setReaderFontFamily] = useState<"serif" | "sans" | "mono">("serif");
  const [readerTheme, setReaderTheme] = useState<"dark" | "light" | "sepia">("dark");

  // Active Book Study / Annotation States
  const [studyData, setStudyData] = useState<BookStudyData>({
    bookId: "",
    bookTitle: "",
    notes: "",
    highlights: [],
    bookmarks: []
  });
  const [studyTab, setStudyTab] = useState<"notes" | "highlights" | "bookmarks" | "quiz">("notes");
  
  // Inputs inside Study Panel
  const [newHighlightText, setNewHighlightText] = useState("");
  const [newHighlightColor, setNewHighlightColor] = useState<"yellow" | "green" | "blue" | "pink">("yellow");
  const [newHighlightPage, setNewHighlightPage] = useState<number>(1);
  
  const [newBookmarkLabel, setNewBookmarkLabel] = useState("");
  const [newBookmarkPage, setNewBookmarkPage] = useState<number>(1);

  // Interactive Quiz & Flashcard States
  const [quizActiveCardIdx, setQuizActiveCardIdx] = useState<number | null>(null);
  const [quizShowAnswer, setQuizShowAnswer] = useState<boolean>(false);
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);

  // Local History of Viewed/Read Books
  const [historyList, setHistoryList] = useState<Book[]>(() => {
    const saved = localStorage.getItem("meowlock_zlib_read_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Google Search Grounding States
  const [searchingLinksBookId, setSearchingLinksBookId] = useState<string | null>(null);
  const [foundLinks, setFoundLinks] = useState<Array<{title: string; url: string; format: string; source: string}>>([]);
  const [isSearchingLinks, setIsSearchingLinks] = useState(false);

  // Professional PDF Reader layout & control states
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [pdfRotation, setPdfRotation] = useState<number>(0);
  const [pdfInvertColors, setPdfInvertColors] = useState<boolean>(false);
  const [pdfFitToWidth, setPdfFitToWidth] = useState<boolean>(true);
  const [isImmersiveReading, setIsImmersiveReading] = useState<boolean>(false);

  // Save mirror setting when updated
  const saveMirror = (newMirror: string) => {
    setMirror(newMirror);
    localStorage.setItem("meowlock_zlib_mirror", newMirror);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoggingIn(true);
    setError(null);

    try {
      const response = await fetch("/api/zlib/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, mirror })
      });
      const data = await response.json();
      if (data.status === "success") {
        setCookies(data.cookies);
        localStorage.setItem("meowlock_zlib_cookies", JSON.stringify(data.cookies));
        if (data.mirror) {
          saveMirror(data.mirror);
        }
        setShowConfig(false);
      } else {
        setError(data.message || "Login failed. Please check credentials or mirror.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCookies(null);
    localStorage.removeItem("meowlock_zlib_cookies");
  };

  // Search handler
  const handleSearch = async (targetPage = 1) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setPage(targetPage);

    try {
      const response = await fetchWithRetry("/api/zlib/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          cookies: cookies || {},
          page: targetPage,
          source: searchSource,
          mirror
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setBooks(data.books || []);
        setTotalPages(data.total_pages || 1);
      } else {
        setError(data.message || "Could not parse search results. Z-Library may require you to be logged in to view public search results, or the mirror might be blocked.");
      }
    } catch (err: any) {
      setError(`Network delay or service issue: ${err.message || "Failed to contact proxy server."} Try clicking "Retry Connection" below.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle local file selection
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadLocalPdf(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadLocalPdf(e.target.files[0]);
    }
  };

  const loadLocalPdf = (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are currently supported for custom inline reading.");
      return;
    }
    setError(null);
    setLocalFile(file);
    const objectUrl = URL.createObjectURL(file);
    setReaderUrl(objectUrl);
    
    const mockBook: Book = {
      id: `local-${file.name}`,
      name: file.name.replace(/\.pdf$/i, ""),
      authors: ["Local User"],
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      extension: "pdf"
    };
    
    setActiveBook(mockBook);
    addToHistory(mockBook);
    setActiveTab("reader");
  };

  // Add book to history
  const addToHistory = (book: Book) => {
    setHistoryList(prev => {
      const filtered = prev.filter(b => b.id !== book.id);
      const updated = [book, ...filtered].slice(0, 15);
      localStorage.setItem("meowlock_zlib_read_history", JSON.stringify(updated));
      return updated;
    });
  };

  // Find real direct download links via deterministic public repositories
  const handleSearchDownloadLinks = async (book: Book) => {
    setSearchingLinksBookId(book.id);
    setIsSearchingLinks(true);
    setFoundLinks([]);
    setError(null);

    try {
      const res = await fetch("/api/zlib/search-direct-copies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: book.name,
          authors: book.authors
        })
      });
      const data = await res.json();
      if (data.status === "success" && data.links) {
        setFoundLinks(data.links);
        if (data.links.length === 0) {
          setError("No direct copies found in standard catalogs. Try searching with a different keyword.");
        }
      } else {
        throw new Error(data.error || "Catalog search could not find direct links.");
      }
    } catch (err: any) {
      setError(`Search failed: ${err.message || "An unexpected error occurred during direct catalog search."}`);
    } finally {
      setIsSearchingLinks(false);
    }
  };



  // Load and read a Z-Library book in our reader via proxy
  const handleReadBook = async (book: Book) => {
    setIsLoading(true);
    setError(null);
    setNativeText(null);
    setNativeHtml(null);
    setIsPdfLoading(false);
    try {
      // 1. Check if the book is an Open Library catalog page reference
      if (book.id.startsWith("ol-")) {
        // Intercept catalog references! Automatically set as active, switch to reader, and run AI search for direct links!
        setActiveBook(book);
        setLocalFile(null);
        setReaderUrl(null);
        addToHistory(book);
        setActiveTab("reader");
        
        // Auto-trigger direct readable copy finder
        handleSearchDownloadLinks(book);
        setIsLoading(false);
        return;
      }

      // 2. Direct read of custom web links, AI grounded links, or local PDFs!
      if (book.id.startsWith("web-") || book.id.startsWith("local-")) {
        const readUrl = book.download_url || book.url || "";
        const proxyUrl = readUrl.startsWith("http") 
          ? `/api/zlib/download-proxy?url=${encodeURIComponent(readUrl)}&cookies=${encodeURIComponent(JSON.stringify(cookies || {}))}`
          : readUrl;
          
        setActiveBook(book);
        setLocalFile(null);
        setReaderUrl(proxyUrl);
        addToHistory(book);
        setActiveTab("reader");

        // Try load text content directly if it's plain text or html
        if (book.extension === "txt" || book.extension === "html" || readUrl.toLowerCase().includes(".txt") || readUrl.toLowerCase().includes(".html")) {
          setIsPdfLoading(true);
          try {
            const contentRes = await fetchWithRetry(proxyUrl);
            if (contentRes.ok) {
              const contentType = contentRes.headers.get("Content-Type") || "";
              const text = await contentRes.text();
              if (contentType.includes("html") || readUrl.toLowerCase().includes(".html") || text.trim().startsWith("<") || text.trim().startsWith("<!DOCTYPE")) {
                setNativeHtml(text);
              } else {
                setNativeText(text);
              }
            }
          } catch (e) {
            console.error("Failed to load native text stream:", e);
          } finally {
            setIsPdfLoading(false);
          }
        }
        setIsLoading(false);
        return;
      }

      // 3. Project Gutenberg books
      if (book.id.startsWith("gut-")) {
        // Direct read of free/public books!
        const response = await fetchWithRetry("/api/zlib/fetch_book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: book.id,
            cookies: cookies || {},
            mirror
          })
        });
        const data = await response.json();
        if (data.status === "success" && data.book) {
          const fullBook = data.book;
          const readUrl = fullBook.read_url || fullBook.download_url || fullBook.url;
          
          // Proxy the content stream so the iframe loads it with correct headers
          const proxyUrl = readUrl.startsWith("http") 
            ? `/api/zlib/download-proxy?url=${encodeURIComponent(readUrl)}&cookies=${encodeURIComponent(JSON.stringify(cookies || {}))}`
            : readUrl;
            
          setActiveBook(fullBook);
          setLocalFile(null);
          setReaderUrl(proxyUrl);
          addToHistory(fullBook);
          setActiveTab("reader");

          // Natively load book content to display clean text/HTML directly
          setIsPdfLoading(true);
          try {
            const contentRes = await fetchWithRetry(proxyUrl);
            if (contentRes.ok) {
              const contentType = contentRes.headers.get("Content-Type") || "";
              const text = await contentRes.text();
              if (contentType.includes("html") || readUrl.toLowerCase().includes(".html") || text.trim().startsWith("<") || text.trim().startsWith("<!DOCTYPE")) {
                setNativeHtml(text);
              } else {
                setNativeText(text);
              }
            }
          } catch (e) {
            console.error("Failed to load native book stream, fallback to iframe:", e);
          } finally {
            setIsPdfLoading(false);
          }
        } else {
          throw new Error(data.message || "Failed to fetch book specifications.");
        }
      } else {
        // 4. Z-Library books
        const response = await fetchWithRetry("/api/zlib/fetch_book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: book.id,
            cookies: cookies || {},
            mirror
          })
        });
        const data = await response.json();
        if (data.status === "success" && data.book) {
          const fullBook = data.book;
          if (!fullBook.download_url) {
            throw new Error("This book is marked as unavailable, or requires an active account to read.");
          }
          
          // Construct our local server-side download-proxy path
          const proxyUrl = `/api/zlib/download-proxy?url=${encodeURIComponent(fullBook.download_url)}&cookies=${encodeURIComponent(JSON.stringify(cookies || {}))}`;
          
          setActiveBook(fullBook);
          setLocalFile(null);
          setReaderUrl(proxyUrl);
          addToHistory(fullBook);
          setActiveTab("reader");

          // Try native txt reader for Z-Lib TXT books
          if (fullBook.extension === "txt") {
            setIsPdfLoading(true);
            try {
              const contentRes = await fetchWithRetry(proxyUrl);
              if (contentRes.ok) {
                const text = await contentRes.text();
                setNativeText(text);
              }
            } catch (e) {
              console.error("Failed to load native txt:", e);
            } finally {
              setIsPdfLoading(false);
            }
          }
        } else {
          throw new Error(data.message || "Failed to fetch book specifications. Z-Library might be limiting your account or IP access.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to open book stream.");
    } finally {
      setIsLoading(false);
    }
  };

  // Persistent notes/bookmark tracker
  useEffect(() => {
    if (!activeBook) return;
    const saveKey = `meowlock_book_study_${activeBook.id}`;
    const saved = localStorage.getItem(saveKey);
    if (saved) {
      setStudyData(JSON.parse(saved));
    } else {
      setStudyData({
        bookId: activeBook.id,
        bookTitle: activeBook.name,
        notes: "",
        highlights: [],
        bookmarks: []
      });
    }
  }, [activeBook]);

  // Initial Search on mount so the widget is populated and ready immediately!
  useEffect(() => {
    const initialQuery = "literature";
    setQuery(initialQuery);
    const triggerInitialSearch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchWithRetry("/api/zlib/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: initialQuery,
            cookies: cookies || {},
            page: 1,
            source: "all",
            mirror
          })
        });
        const data = await response.json();
        if (data.status === "success") {
          setBooks(data.books || []);
          setTotalPages(data.total_pages || 1);
        } else {
          console.warn("Initial search returned error:", data.message);
          setError("The search service returned a status update. If books didn't load, please try clicking 'Retry Connection' below.");
        }
      } catch (err) {
        console.warn("Initial search failed:", err);
        setError("Connecting to book streams... If loading is delayed, please check your connection and click 'Retry Connection' below.");
      } finally {
        setIsLoading(false);
      }
    };
    triggerInitialSearch();
  }, []);

  // Autosave study data
  const saveStudyData = (updated: BookStudyData) => {
    if (!activeBook) return;
    setStudyData(updated);
    localStorage.setItem(`meowlock_book_study_${activeBook.id}`, JSON.stringify(updated));
  };

  const handleUpdateNotes = (text: string) => {
    const updated = { ...studyData, notes: text };
    saveStudyData(updated);
  };

  // Add highlight
  const handleAddHighlight = () => {
    if (!newHighlightText.trim()) return;
    const newHighlight: StudyHighlight = {
      id: `hl-${Date.now()}`,
      text: newHighlightText.trim(),
      page: newHighlightPage || currentPage,
      color: newHighlightColor,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const updated = {
      ...studyData,
      highlights: [...studyData.highlights, newHighlight].sort((a, b) => a.page - b.page)
    };
    saveStudyData(updated);
    setNewHighlightText("");
  };

  // Delete highlight
  const handleDeleteHighlight = (id: string) => {
    const updated = {
      ...studyData,
      highlights: studyData.highlights.filter(hl => hl.id !== id)
    };
    saveStudyData(updated);
  };

  // Add bookmark
  const handleAddBookmark = () => {
    if (!newBookmarkLabel.trim()) return;
    const newBookmark: StudyBookmark = {
      id: `bm-${Date.now()}`,
      page: newBookmarkPage || currentPage,
      label: newBookmarkLabel.trim(),
      timestamp: new Date().toLocaleDateString()
    };
    
    const updated = {
      ...studyData,
      bookmarks: [...studyData.bookmarks, newBookmark].sort((a, b) => a.page - b.page)
    };
    saveStudyData(updated);
    setNewBookmarkLabel("");
  };

  // Delete bookmark
  const handleDeleteBookmark = (id: string) => {
    const updated = {
      ...studyData,
      bookmarks: studyData.bookmarks.filter(bm => bm.id !== id)
    };
    saveStudyData(updated);
  };

  // Interactive Study Flashcards handlers
  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) return;

    const newCard: StudyFlashcard = {
      id: `card-${Date.now()}`,
      question: newCardQuestion.trim(),
      answer: newCardAnswer.trim(),
      correctCount: 0,
      incorrectCount: 0
    };

    const updated = {
      ...studyData,
      flashcards: [...(studyData.flashcards || []), newCard]
    };

    saveStudyData(updated);
    setNewCardQuestion("");
    setNewCardAnswer("");
    setIsAddingCard(false);
  };

  const handleDeleteFlashcard = (id: string) => {
    const updated = {
      ...studyData,
      flashcards: (studyData.flashcards || []).filter(c => c.id !== id)
    };
    saveStudyData(updated);
    if (quizActiveCardIdx !== null) {
      setQuizActiveCardIdx(null);
    }
  };

  const handleAnswerFlashcard = (id: string, gotItCorrect: boolean) => {
    const updatedCards = (studyData.flashcards || []).map(c => {
      if (c.id === id) {
        return {
          ...c,
          correctCount: c.correctCount + (gotItCorrect ? 1 : 0),
          incorrectCount: c.incorrectCount + (gotItCorrect ? 0 : 1)
        };
      }
      return c;
    });

    const updated = {
      ...studyData,
      flashcards: updatedCards
    };

    saveStudyData(updated);
    setQuizShowAnswer(false);
    
    if (quizActiveCardIdx !== null) {
      const nextIdx = quizActiveCardIdx + 1;
      if (nextIdx < (studyData.flashcards || []).length) {
        setQuizActiveCardIdx(nextIdx);
      } else {
        setQuizActiveCardIdx(null);
      }
    }
  };

  const bookTheme = getBookColor(activeBook);

  return (
    <div className={`flex flex-col h-full rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-3xl overflow-hidden shadow-2xl transition-all duration-300 relative text-white`} style={{ contentVisibility: "auto" }}>
      
      {/* Liquid Floating Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-30">
        <motion.div
          animate={{
            x: [0, 45, -25, 0],
            y: [0, -35, 45, 0],
            scale: [1, 1.25, 0.85, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute -top-16 -left-16 w-80 h-80 rounded-full filter blur-[90px] bg-gradient-to-r ${bookTheme.gradient}`}
        />
        <motion.div
          animate={{
            x: [0, -55, 35, 0],
            y: [0, 45, -35, 0],
            scale: [1, 0.8, 1.15, 1],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute -bottom-16 -right-16 w-96 h-96 rounded-full filter blur-[100px] bg-gradient-to-r ${bookTheme.gradient}`}
        />
      </div>

      {/* Header Panel */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/30 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 transition-colors duration-300" style={{ color: bookTheme.primary }} />
          <h2 className="text-lg font-bold tracking-tight">Study Book | استادی بوک</h2>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border ${activeTab === "search" ? "" : "text-gray-400 hover:text-white border-transparent"}`}
            style={activeTab === "search" ? {
              backgroundColor: bookTheme.bg,
              color: bookTheme.primary,
              borderColor: bookTheme.border
            } : {}}
          >
            Z-Library Search
          </button>
          <button
            onClick={() => setActiveTab("reader")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border ${activeTab === "reader" ? "" : "text-gray-400 hover:text-white border-transparent"} ${!activeBook ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!activeBook}
            style={activeTab === "reader" ? {
              backgroundColor: bookTheme.bg,
              color: bookTheme.primary,
              borderColor: bookTheme.border
            } : {}}
          >
            Active Reader
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border ${activeTab === "history" ? "" : "text-gray-400 hover:text-white border-transparent"}`}
            style={activeTab === "history" ? {
              backgroundColor: bookTheme.bg,
              color: bookTheme.primary,
              borderColor: bookTheme.border
            } : {}}
          >
            Study Logs
          </button>
          
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Mirror and Account Settings"
            className={`p-1.5 rounded-lg transition-colors border border-transparent`}
            style={showConfig ? {
              backgroundColor: bookTheme.bg,
              color: bookTheme.primary,
              borderColor: bookTheme.border
            } : {}}
          >
            <Settings className="w-4 h-4" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body content area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Collapsible Mirror / Login configuration settings */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute top-0 inset-x-0 z-30 bg-slate-900 border-b border-white/10 px-6 py-4 overflow-hidden"
            >
              <div className="max-w-2xl mx-auto space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Settings className="w-4 h-4" /> Z-Library Mirror & Account Setup
                  </h3>
                  <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mirror Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-300">Z-Library Active Domain Mirror</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 rounded bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-xs font-mono"
                      value={mirror}
                      onChange={(e) => saveMirror(e.target.value)}
                      placeholder="e.g. https://z-library.se"
                    />
                    <p className="text-[10px] text-gray-400">
                      If searching fails or gets blocked, update to another active domain or IP address.
                    </p>
                  </div>
                  
                  {/* Account Login */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-gray-300">Z-Library Account</label>
                      {cookies ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-mono">
                          <Unlock className="w-3 h-3" /> Signed In
                        </span>
                      ) : (
                        <span className="text-[10px] text-yellow-500 flex items-center gap-0.5 font-mono">
                          <Lock className="w-3 h-3" /> Anonymous
                        </span>
                      )}
                    </div>
                    
                    {cookies ? (
                      <div className="bg-slate-800 p-2 rounded border border-white/5 space-y-1">
                        <div className="text-[10px] text-gray-300 truncate font-mono">
                          Session Key: {cookies.remix_userkey ? `${cookies.remix_userkey.substring(0,8)}...` : "not set"}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-center py-1 text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 rounded border border-red-500/20"
                        >
                          Sign Out of Z-Library
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleLogin} className="space-y-2">
                        <input
                          type="email"
                          placeholder="Z-Library Email"
                          className="w-full px-3 py-1.5 rounded bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-xs"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          className="w-full px-3 py-1.5 rounded bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-xs"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="submit"
                          disabled={isLoggingIn}
                          className="w-full py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded"
                        >
                          {isLoggingIn ? "Signing In..." : "Sign In & Extract Cookies"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TAB 1: Z-LIBRARY SEARCH --- */}
        {activeTab === "search" && (
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            {/* Direct Local PDF Drop Zone wrapped in interactive 3D TiltedCard */}
            <div className="mb-6">
              <TiltedCard
                imageSrc=""
                containerHeight="130px"
                containerWidth="100%"
                scaleOnHover={1.02}
                rotateAmplitude={6}
                showTooltip={false}
              >
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="w-full h-full p-6 rounded-xl border-2 border-dashed border-emerald-500/10 hover:border-emerald-500/40 bg-slate-800/30 hover:bg-slate-800/50 text-center transition-all duration-200 cursor-pointer group relative flex flex-col items-center justify-center"
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <FileText className="w-8 h-8 text-emerald-400/80 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-white">Drag & Drop a local PDF here</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Or click to browse from your device (opens local instant workspace)
                  </p>
                </div>
              </TiltedCard>
            </div>



            {/* Search Input Bar */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books (e.g. Sherlock Holmes, Clean Code, Psychology, Dracula...)"
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
                />
              </div>
              <button
                onClick={() => handleSearch(1)}
                disabled={isLoading}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50 flex items-center space-x-1.5 shadow-lg shadow-emerald-950/20"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>

            {/* Search Source Selector */}
            <div className="flex items-center gap-1.5 mb-6 overflow-x-auto no-scrollbar py-1 text-xs">
              <span className="text-gray-400 font-medium shrink-0 mr-1">Source:</span>
              <button
                onClick={() => setSearchSource("all")}
                className={`px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  searchSource === "all"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold"
                    : "bg-slate-800/40 text-gray-400 border-white/5 hover:border-white/10 hover:text-white"
                }`}
              >
                All (Merged)
              </button>
              <button
                onClick={() => setSearchSource("gutenberg")}
                className={`px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  searchSource === "gutenberg"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold"
                    : "bg-slate-800/40 text-gray-400 border-white/5 hover:border-white/10 hover:text-white"
                }`}
              >
                Project Gutenberg (100% Free Classics)
              </button>
              <button
                onClick={() => setSearchSource("open_library")}
                className={`px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  searchSource === "open_library"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold"
                    : "bg-slate-800/40 text-gray-400 border-white/5 hover:border-white/10 hover:text-white"
                }`}
              >
                Open Library
              </button>
              <button
                onClick={() => setSearchSource("z_library")}
                className={`px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  searchSource === "z_library"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold"
                    : "bg-slate-800/40 text-gray-400 border-white/5 hover:border-white/10 hover:text-white"
                }`}
              >
                Z-Library
              </button>
            </div>

            {/* Notification / Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex flex-col space-y-3">
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Network Notification</p>
                    <p className="mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSearch(page)}
                  className="w-fit px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-white/10 text-gray-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            )}

            {/* Glowing Loader Overlay for search & stream initialization */}
            {isLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <BookOpen className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-semibold text-white">Connecting Online Book Stream...</h4>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    Connecting to digital repositories. This may take a moment depending on network speed.
                  </p>
                </div>
              </div>
            ) : books.length > 0 ? (
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      className="p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:border-white/15 hover:bg-slate-800/60 transition-all flex flex-col space-y-3 group"
                    >
                      <div className="flex space-x-4">
                        {/* Cover image wrapped in 3D perspective TiltedCard */}
                        <div className="w-16 h-22 rounded flex-shrink-0 overflow-hidden relative shadow">
                          <TiltedCard
                            imageSrc={book.cover || ""}
                            altText={book.name}
                            containerHeight="88px"
                            containerWidth="64px"
                            imageHeight="88px"
                            imageWidth="64px"
                            scaleOnHover={1.12}
                            rotateAmplitude={15}
                            showTooltip={false}
                          >
                            {!book.cover && (
                              <div className="w-full h-full bg-slate-700/60 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-slate-500" />
                              </div>
                            )}
                          </TiltedCard>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-bold truncate group-hover:text-emerald-400 transition-colors" title={book.name}>
                              {book.name}
                            </h4>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {book.authors.join(", ") || "Unknown Author"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {book.extension && (
                                <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] uppercase text-gray-300 font-bold tracking-wider">
                                  {book.extension}
                                </span>
                              )}
                              {book.size && (
                                <span className="text-[11px] text-gray-500">
                                  {book.size}
                                </span>
                              )}
                              {book.year && (
                                <span className="text-[11px] text-gray-500">• {book.year}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              onClick={() => handleReadBook(book)}
                              disabled={isLoading}
                              className="flex-1 text-center py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" /> Read inline
                            </button>

                            <button
                              onClick={() => handleSearchDownloadLinks(book)}
                              disabled={isSearchingLinks}
                              className="px-2 py-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 rounded-lg hover:bg-emerald-500/25 transition-all flex items-center gap-0.5 cursor-pointer"
                              title="Search Direct PDF/EPUB Download Links on Web"
                            >
                              <Search className="w-3 h-3" />
                              <span className="hidden sm:inline">Get Links</span>
                            </button>

                            {book.download_url && (
                              <a
                                href={`/api/zlib/download-proxy?url=${encodeURIComponent(book.download_url)}&cookies=${encodeURIComponent(JSON.stringify(cookies || {}))}`}
                                download={`${book.name}.${book.extension || "pdf"}`}
                                className="p-1.5 rounded-lg bg-slate-700/40 text-gray-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Direct Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Web Grounding direct download/stream links results */}
                      {searchingLinksBookId === book.id && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold border-b border-white/5 pb-1">
                            <span>Google Grounding Search results:</span>
                            <button onClick={() => setSearchingLinksBookId(null)} className="hover:text-white">✕</button>
                          </div>

                          {isSearchingLinks ? (
                            <div className="flex items-center space-x-2 text-gray-400 py-1 font-mono text-[11px]">
                              <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              <span>Searching real web indexes & repositories...</span>
                            </div>
                          ) : foundLinks && foundLinks.length > 0 ? (
                            <div className="space-y-1.5">
                              {foundLinks.map((link, i) => (
                                <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 hover:bg-slate-800/80 transition-colors border border-white/5">
                                  <div className="flex flex-col truncate pr-2">
                                    <span className="font-semibold text-gray-200 truncate">{link.title}</span>
                                    <span className="text-[10px] text-gray-500 font-mono truncate">{link.source || "Web"}</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5 shrink-0">
                                    <span className="px-1 py-0.5 text-[9px] font-bold font-mono bg-white/10 text-gray-300 rounded uppercase">{link.format || "PDF"}</span>
                                    <button
                                      onClick={() => {
                                        const mockBook: Book = {
                                          id: `web-${Date.now()}-${i}`,
                                          name: `${book.name} [${link.source || "Stream"}]`,
                                          authors: book.authors,
                                          extension: link.format?.toLowerCase() || "pdf",
                                          size: "Web Stream",
                                          download_url: link.url
                                        };
                                        handleReadBook(mockBook);
                                      }}
                                      className="px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded hover:bg-emerald-500/10 cursor-pointer"
                                    >
                                      Read
                                    </button>
                                    <a
                                      href={`/api/zlib/download-proxy?url=${encodeURIComponent(link.url)}`}
                                      download={`${book.name}.${link.format?.toLowerCase() || "pdf"}`}
                                      className="p-1 rounded bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors"
                                      title="Download File"
                                    >
                                      <Download className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-[11px]">No direct open links found on Google search. Try another search query.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <button
                    onClick={() => page > 1 && handleSearch(page - 1)}
                    disabled={page <= 1 || isLoading}
                    className="p-2 rounded-lg bg-slate-800 text-gray-400 hover:text-white disabled:opacity-40 transition-opacity"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-400">
                    Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => page < totalPages && handleSearch(page + 1)}
                    disabled={page >= totalPages || isLoading}
                    className="p-2 rounded-lg bg-slate-800 text-gray-400 hover:text-white disabled:opacity-40 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                    <HelpCircle className="w-6 h-6 text-emerald-400/60" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">No active search</h4>
                  <p className="text-xs max-w-sm mt-1 leading-relaxed">
                    Log in with your Z-Library account to search millions of books, or drop/browse a local PDF to start reading immediately.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* --- TAB 2: ACTIVE READER (SPLIT SCREEN SPLIT PANEL WORKSPACE) --- */}
        {activeTab === "reader" && activeBook && (
          <div className="h-full flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Panel: Web PDF viewer embed iframe */}
            <div className="flex-1 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-white/10 relative flex flex-col bg-slate-950">
              {/* PDF Navigation Overlay */}
              <div className="px-4 py-2 bg-slate-900 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-semibold text-emerald-400 truncate max-w-[150px] md:max-w-[200px]" title={activeBook.name}>
                    {activeBook.name}
                  </span>
                  <span className="text-gray-500 text-[10px] shrink-0">
                    ({localFile ? "Local File" : activeBook.id.startsWith("gut-") ? "Gutenberg" : activeBook.id.startsWith("ol-") ? "Open Library" : "Z-Library"})
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 shrink-0">
                  {activeBook && activeBook.download_url && (
                    <a
                      href={`/api/zlib/download-proxy?url=${encodeURIComponent(activeBook.download_url)}&cookies=${encodeURIComponent(JSON.stringify(cookies || {}))}`}
                      download={`${activeBook.name}.${activeBook.extension || "epub"}`}
                      className="px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Download book file directly"
                    >
                      <Download className="w-3 h-3" />
                      <span className="hidden sm:inline">Save Offline</span>
                    </a>
                  )}
                  {/* Manual Sync Page Number */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-gray-400 text-[10px]">Page:</span>
                    <input
                      type="number"
                      min="1"
                      className="w-10 text-center bg-slate-800 border border-white/10 text-white rounded py-0.5 text-[10px] focus:outline-none font-mono"
                      value={currentPage}
                      onChange={(e) => setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>
              </div>

              {/* The Iframe or Native Clean E-Book Reader */}
              <div className="flex-1 relative overflow-hidden flex flex-col">
                {isPdfLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-gray-400 space-y-3 z-20 backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <span className="text-xs">Streaming clean book text directly...</span>
                  </div>
                )}

                {nativeHtml || nativeText ? (
                  <div className={`flex-1 overflow-hidden flex flex-col ${
                    readerTheme === "dark" 
                      ? "bg-slate-950 text-slate-100" 
                      : readerTheme === "sepia" 
                        ? "bg-[#f4ecd8] text-[#5c4033]" 
                        : "bg-white text-slate-900"
                  }`}>
                    {/* Formatting toolbar */}
                    <div className={`px-4 py-2.5 flex items-center justify-between border-b shrink-0 ${
                      readerTheme === "dark" 
                        ? "border-white/10 bg-slate-900/60" 
                        : readerTheme === "sepia" 
                          ? "border-[#ebdcb9] bg-[#ebdcb9]/40" 
                          : "border-gray-200 bg-gray-50"
                    } text-xs`}>
                      {/* Font selector */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setReaderFontFamily("serif")}
                          className={`px-2 py-1 rounded text-[10px] cursor-pointer transition-colors ${
                            readerFontFamily === "serif"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                              : "text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-white"
                          } font-serif`}
                        >
                          Serif
                        </button>
                        <button
                          onClick={() => setReaderFontFamily("sans")}
                          className={`px-2 py-1 rounded text-[10px] cursor-pointer transition-colors ${
                            readerFontFamily === "sans"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                              : "text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-white"
                          } font-sans`}
                        >
                          Sans
                        </button>
                        <button
                          onClick={() => setReaderFontFamily("mono")}
                          className={`px-2 py-1 rounded text-[10px] cursor-pointer transition-colors ${
                            readerFontFamily === "mono"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                              : "text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-white"
                          } font-mono`}
                        >
                          Mono
                        </button>
                      </div>

                      {/* Font size and themes */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setReaderFontSize(Math.max(12, readerFontSize - 1))}
                            className="w-5 h-5 rounded flex items-center justify-center border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer font-bold text-xs text-gray-400 hover:text-white"
                            title="Decrease text size"
                          >
                            A-
                          </button>
                          <span className="w-8 text-center font-mono text-[10px] shrink-0">{readerFontSize}px</span>
                          <button
                            onClick={() => setReaderFontSize(Math.min(32, readerFontSize + 1))}
                            className="w-5 h-5 rounded flex items-center justify-center border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer font-bold text-xs text-gray-400 hover:text-white"
                            title="Increase text size"
                          >
                            A+
                          </button>
                        </div>

                        {/* Themes */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setReaderTheme("light")}
                            className={`w-4 h-4 rounded-full bg-white border border-gray-300 cursor-pointer ${readerTheme === "light" ? "ring-2 ring-emerald-500" : ""}`}
                            title="Light Theme"
                          />
                          <button
                            onClick={() => setReaderTheme("sepia")}
                            className={`w-4 h-4 rounded-full bg-[#f4ecd8] border border-[#ebdcb9] cursor-pointer ${readerTheme === "sepia" ? "ring-2 ring-emerald-500" : ""}`}
                            title="Sepia Theme"
                          />
                          <button
                            onClick={() => setReaderTheme("dark")}
                            className={`w-4 h-4 rounded-full bg-slate-950 border border-white/20 cursor-pointer ${readerTheme === "dark" ? "ring-2 ring-emerald-500" : ""}`}
                            title="Dark Theme"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Book text reading container */}
                    <div 
                      className="flex-1 overflow-y-auto p-6 md:p-8 select-text selection:bg-emerald-500/30 leading-relaxed font-display"
                      style={{
                        fontSize: `${readerFontSize}px`,
                        fontFamily: readerFontFamily === "serif" ? 'Georgia, Cambria, "Times New Roman", Times, serif' : readerFontFamily === "mono" ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : 'ui-sans-serif, system-ui, sans-serif'
                      }}
                    >
                      {nativeHtml ? (
                        <div 
                          className="prose-clean max-w-2xl mx-auto space-y-4"
                          dangerouslySetInnerHTML={{ __html: cleanGutenbergHtml(nativeHtml) }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap max-w-2xl mx-auto space-y-4">
                          {nativeText}
                        </div>
                      )}
                    </div>
                  </div>
                ) : readerUrl ? (
                  <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
                    {/* Real PDF Reader Custom Control Toolbar */}
                    <div className="px-4 py-2 bg-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs select-none z-10 shrink-0">
                      {/* Zoom Controls */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPdfFitToWidth(false);
                            setPdfZoom(prev => Math.max(50, prev - 10));
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-mono w-10 text-center text-gray-300">{pdfZoom}%</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPdfFitToWidth(false);
                            setPdfZoom(prev => Math.min(250, prev + 10));
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPdfFitToWidth(!pdfFitToWidth);
                            if (!pdfFitToWidth) setPdfZoom(100);
                          }}
                          className={`px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${pdfFitToWidth ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-gray-400 hover:text-white"}`}
                        >
                          {pdfFitToWidth ? "Custom Zoom" : "Fit Width"}
                        </button>
                      </div>

                      {/* Rotation and Inversion Controls */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setPdfRotation(prev => (prev + 90) % 360)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer text-[10px]"
                          title="Rotate 90° Clockwise"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span className="hidden sm:inline">Rotate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPdfInvertColors(!pdfInvertColors)}
                          className={`p-1.5 rounded transition-all flex items-center gap-1 cursor-pointer text-[10px] ${
                            pdfInvertColors 
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold" 
                              : "bg-slate-800 text-gray-300 hover:text-white"
                          }`}
                          title="Invert PDF page colors (Best for night study)"
                        >
                          {pdfInvertColors ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>Dark Filter</span>
                        </button>
                      </div>

                      {/* Printing and Fullscreen Immersion Mode */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => window.open(readerUrl, "_blank")}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer text-[10px]"
                          title="Open PDF in Full Browser tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Popout</span>
                        </button>
                      </div>
                    </div>

                    {/* PDF Frame Canvas */}
                    <div className="flex-1 w-full h-full overflow-auto p-4 flex justify-center items-start relative bg-slate-950 scrollbar-thin">
                      <div 
                        className="transition-all duration-300 origin-top shadow-2xl rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center"
                        style={{
                          transform: `rotate(${pdfRotation}deg) scale(${pdfZoom / 100})`,
                          width: pdfFitToWidth ? "100%" : `${pdfZoom}%`,
                          maxWidth: pdfFitToWidth ? "950px" : "none",
                          height: "100%",
                          minHeight: "550px",
                          filter: pdfInvertColors ? "invert(0.9) hue-rotate(180deg) brightness(1.05) contrast(1.15)" : "none",
                        }}
                      >
                        <object
                          data={readerUrl}
                          type="application/pdf"
                          className="w-full h-full rounded-md"
                        >
                          <iframe
                            src={readerUrl}
                            className="w-full h-full border-none rounded-md"
                            title="PDF Fallback Canvas"
                          />
                        </object>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shadow-lg">
                      <BookOpen className="w-7 h-7 text-amber-400 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">Direct Book Reader Stream</h3>
                    <p className="text-xs text-gray-400 max-w-sm leading-relaxed mb-6">
                      "{activeBook?.name || "This book"}" is listed as a web metadata reference. Web pages cannot be rendered raw in the reader frame.
                    </p>

                    <div className="w-full max-w-md bg-slate-900/60 rounded-xl border border-white/5 p-4 space-y-4 shadow-xl">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Deterministic Catalog Search Solution:</span>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          Query public domain digital repositories (Gutenberg, Internet Archive, open PDF catalogs) directly to locate and fetch a readable copy instantly!
                        </p>
                      </div>

                      {isSearchingLinks ? (
                        <div className="flex items-center justify-center space-x-2 py-4 text-emerald-400 font-mono text-[11px]">
                          <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          <span>Searching digital repositories...</span>
                        </div>
                      ) : foundLinks && foundLinks.length > 0 ? (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                          <span className="text-[10px] text-gray-400 font-bold block mb-1 text-left">Direct Copies Discovered:</span>
                          {foundLinks.map((link, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-white/5 hover:border-emerald-500/30 transition-all">
                              <div className="flex flex-col text-left truncate pr-2">
                                <span className="font-semibold text-gray-200 text-xs truncate">{link.title}</span>
                                <span className="text-[9px] text-gray-500 font-mono truncate">{link.source || "Archive Stream"}</span>
                              </div>
                              <button
                                onClick={() => {
                                  const mockBook: Book = {
                                    id: `web-${Date.now()}-${i}`,
                                    name: `${activeBook?.name || "Book"} [${link.source || "Stream"}]`,
                                    authors: activeBook?.authors || [],
                                    extension: link.format?.toLowerCase() || "pdf",
                                    size: "Web Stream",
                                    download_url: link.url
                                  };
                                  handleReadBook(mockBook);
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-all cursor-pointer shadow"
                              >
                                Read
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => activeBook && handleSearchDownloadLinks(activeBook)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                          >
                            <Search className="w-3.5 h-3.5" /> Search Direct Copies in Public Catalogs
                          </button>
                          
                          {activeBook?.url && (
                            <a
                              href={activeBook.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/5 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open Catalog Page in New Tab
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Interactive Study Workspace */}
            {!isImmersiveReading && (
              <div className="w-full md:w-[380px] h-1/2 md:h-full flex flex-col bg-slate-900/40 shrink-0 border-l border-white/10">
              
              {/* Study Workspace Tabs */}
              <div className="grid grid-cols-4 border-b border-white/10 text-center text-xs">
                <button
                  onClick={() => setStudyTab("notes")}
                  className={`py-2.5 font-medium border-b-2 transition-colors ${studyTab === "notes" ? "border-emerald-500 text-white bg-white/5" : "border-transparent text-gray-400 hover:text-white"}`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setStudyTab("highlights")}
                  className={`py-2.5 font-medium border-b-2 transition-colors ${studyTab === "highlights" ? "border-emerald-500 text-white bg-white/5" : "border-transparent text-gray-400 hover:text-white"}`}
                >
                  Highlights
                </button>
                <button
                  onClick={() => setStudyTab("bookmarks")}
                  className={`py-2.5 font-medium border-b-2 transition-colors ${studyTab === "bookmarks" ? "border-emerald-500 text-white bg-white/5" : "border-transparent text-gray-400 hover:text-white"}`}
                >
                  Bookmarks
                </button>
                <button
                  onClick={() => setStudyTab("quiz")}
                  className={`py-2.5 font-medium border-b-2 transition-colors ${studyTab === "quiz" ? "border-emerald-500 text-white bg-white/5" : "border-transparent text-gray-400 hover:text-white"}`}
                >
                  Flashcards
                </button>
              </div>

              {/* Study Area Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* TAB CONTENT: STUDY NOTES */}
                {studyTab === "notes" && (
                  <div className="space-y-3 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Book Study Journal
                      </h4>
                      <span className="text-[10px] text-gray-500 font-mono">Autosaved</span>
                    </div>
                    <textarea
                      placeholder="Write your custom study notes, capture formulas, structure answers, or copy important concepts here. Notes are persisted per-book automatically."
                      className="w-full flex-grow min-h-[180px] p-3 bg-slate-800/80 border border-white/10 rounded-xl text-xs leading-relaxed text-gray-200 focus:outline-none focus:border-emerald-500/50 resize-y"
                      value={studyData.notes}
                      onChange={(e) => handleUpdateNotes(e.target.value)}
                    />
                  </div>
                )}

                {/* TAB CONTENT: HIGHLIGHTS */}
                {studyTab === "highlights" && (
                  <div className="space-y-4">
                    {/* Add Highlight Clip */}
                    <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                        <span>Save Clipped/Highlighted text</span>
                        <div className="flex items-center space-x-1.5">
                          <span>Page:</span>
                          <input
                            type="number"
                            min="1"
                            className="w-10 bg-slate-900 border border-white/10 text-white rounded px-1 py-0.5 text-[10px] text-center focus:outline-none"
                            value={newHighlightPage}
                            onChange={(e) => setNewHighlightPage(Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>
                      </div>
                      <textarea
                        placeholder="Paste or type captured quotation highlight snippet..."
                        className="w-full h-16 p-2 bg-slate-900 border border-white/5 rounded text-xs focus:outline-none focus:border-emerald-500"
                        value={newHighlightText}
                        onChange={(e) => setNewHighlightText(e.target.value)}
                      />
                      
                      {/* Color selections & Save button */}
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center space-x-2">
                          {(["yellow", "green", "blue", "pink"] as const).map((color) => {
                            const colors = {
                              yellow: "bg-yellow-400",
                              green: "bg-green-400",
                              blue: "bg-blue-400",
                              pink: "bg-pink-400"
                            };
                            return (
                              <button
                                key={color}
                                onClick={() => setNewHighlightColor(color)}
                                className={`w-3.5 h-3.5 rounded-full ${colors[color]} border-2 transition-all ${newHighlightColor === color ? "border-white scale-110" : "border-transparent"}`}
                              />
                            );
                          })}
                        </div>
                        <button
                          onClick={handleAddHighlight}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[11px] font-bold text-white flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Save highlight
                        </button>
                      </div>
                    </div>

                    {/* Highlights List */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1">
                        <Highlighter className="w-3.5 h-3.5" /> Highlights List ({studyData.highlights.length})
                      </h4>
                      {studyData.highlights.length > 0 ? (
                        <div className="space-y-2">
                          {studyData.highlights.map((hl) => {
                            const borderColors = {
                              yellow: "border-l-yellow-400",
                              green: "border-l-green-400",
                              blue: "border-l-blue-400",
                              pink: "border-l-pink-400"
                            };
                            const bgColors = {
                              yellow: "bg-yellow-500/5",
                              green: "bg-green-500/5",
                              blue: "bg-blue-500/5",
                              pink: "bg-pink-500/5"
                            };
                            return (
                              <div
                                key={hl.id}
                                className={`p-2.5 rounded border border-white/5 border-l-4 ${borderColors[hl.color]} ${bgColors[hl.color]} space-y-1 relative group`}
                              >
                                <button
                                  onClick={() => handleDeleteHighlight(hl.id)}
                                  className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash className="w-3 h-3" />
                                </button>
                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                  <span>Page {hl.page}</span>
                                  <span>{hl.timestamp}</span>
                                </div>
                                <p className="text-xs text-gray-200 leading-relaxed italic pr-4">
                                  "{hl.text}"
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 italic">No highlights recorded yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: BOOKMARKS */}
                {studyTab === "bookmarks" && (
                  <div className="space-y-4">
                    {/* Add Bookmark Form */}
                    <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-gray-300 block">Mark current location</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="e.g. Intro, Chapter 2, Formula..."
                            className="w-full px-2 py-1 bg-slate-900 border border-white/5 rounded text-xs focus:outline-none focus:border-emerald-500"
                            value={newBookmarkLabel}
                            onChange={(e) => setNewBookmarkLabel(e.target.value)}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            className="w-full px-2 py-1 bg-slate-900 border border-white/5 rounded text-xs text-center focus:outline-none focus:border-emerald-500"
                            value={newBookmarkPage}
                            onChange={(e) => setNewBookmarkPage(Math.max(1, parseInt(e.target.value) || 1))}
                            title="Page"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleAddBookmark}
                        className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[11px] font-bold text-white flex items-center justify-center gap-1"
                      >
                        <Bookmark className="w-3 h-3" /> Bookmark Page
                      </button>
                    </div>

                    {/* Bookmarks List */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5" /> Bookmarks ({studyData.bookmarks.length})
                      </h4>
                      {studyData.bookmarks.length > 0 ? (
                        <div className="space-y-1.5">
                          {studyData.bookmarks.map((bm) => (
                            <div
                              key={bm.id}
                              className="px-3 py-2 rounded bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-2">
                                <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs font-bold text-white">{bm.label}</span>
                                <span className="text-[10px] text-gray-500 font-mono">Page {bm.page}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setCurrentPage(bm.page)}
                                  className="text-[10px] text-emerald-400 hover:underline font-semibold"
                                >
                                  Jump
                                </button>
                                <button
                                  onClick={() => handleDeleteBookmark(bm.id)}
                                  className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 italic">No bookmarks saved yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: INTERACTIVE STUDY FLASHCARDS */}
                {studyTab === "quiz" && (
                  <div className="flex flex-col h-full space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Study Cards & Quizzes
                      </span>
                      {(!studyData.flashcards || studyData.flashcards.length === 0) && !isAddingCard && (
                        <button
                          onClick={() => setIsAddingCard(true)}
                          className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-[10px] font-bold text-emerald-400 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Create Card
                        </button>
                      )}
                    </div>

                    {isAddingCard ? (
                      /* Add Flashcard Form */
                      <form onSubmit={handleAddFlashcard} className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-3 text-left">
                        <h4 className="text-xs font-bold text-white">Create New Study Card</h4>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Question or Concept</label>
                          <textarea
                            placeholder="e.g., What is the definition of dark matter?"
                            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 min-h-[60px]"
                            value={newCardQuestion}
                            onChange={(e) => setNewCardQuestion(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Answer / Definition</label>
                          <textarea
                            placeholder="e.g., An unknown form of matter that does not emit radiation..."
                            className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 min-h-[60px]"
                            value={newCardAnswer}
                            onChange={(e) => setNewCardAnswer(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-[11px] font-bold pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingCard(false)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer shadow"
                          >
                            Save Card
                          </button>
                        </div>
                      </form>
                    ) : quizActiveCardIdx !== null && studyData.flashcards && studyData.flashcards.length > 0 ? (
                      /* Active Quiz Practice Mode */
                      <div className="space-y-4 text-center">
                        <div className="flex justify-between items-center text-[11px] text-gray-400">
                          <span className="font-mono">Card {quizActiveCardIdx + 1} of {studyData.flashcards.length}</span>
                          <button
                            onClick={() => setQuizActiveCardIdx(null)}
                            className="text-red-400 hover:underline font-semibold"
                          >
                            Exit Quiz
                          </button>
                        </div>

                        {/* Flashcard Component */}
                        <div className="min-h-[170px] flex flex-col justify-between p-4 rounded-xl bg-slate-900 border border-white/10 relative overflow-hidden group shadow-xl">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                          
                          <div className="my-auto space-y-2">
                            {!quizShowAnswer ? (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Question</span>
                                <p className="text-xs font-semibold text-white leading-relaxed">
                                  {studyData.flashcards[quizActiveCardIdx].question}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1 animate-fadeIn">
                                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">Correct Answer</span>
                                <p className="text-xs font-medium text-gray-200 leading-relaxed whitespace-pre-wrap">
                                  {studyData.flashcards[quizActiveCardIdx].answer}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-white/5 flex flex-col gap-2.5">
                            {!quizShowAnswer ? (
                              <button
                                onClick={() => setQuizShowAnswer(true)}
                                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg transition-all cursor-pointer shadow"
                              >
                                Reveal Answer
                              </button>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                                <button
                                  onClick={() => handleAnswerFlashcard(studyData.flashcards![quizActiveCardIdx].id, false)}
                                  className="py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                                >
                                  ❌ Needs Work
                                </button>
                                <button
                                  onClick={() => handleAnswerFlashcard(studyData.flashcards![quizActiveCardIdx].id, true)}
                                  className="py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-400 rounded-lg transition-all cursor-pointer"
                                >
                                  Got It!
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Flashcards Manager List */
                      <div className="space-y-3">
                        {studyData.flashcards && studyData.flashcards.length > 0 ? (
                          <>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setQuizActiveCardIdx(0);
                                  setQuizShowAnswer(false);
                                }}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow"
                              >
                                <Award className="w-3.5 h-3.5" /> Start Practice Quiz
                              </button>
                              <button
                                onClick={() => setIsAddingCard(true)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-gray-300 rounded-lg transition-all cursor-pointer"
                              >
                                Add Card
                              </button>
                            </div>

                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar text-left">
                              {studyData.flashcards.map((card) => {
                                const total = card.correctCount + card.incorrectCount;
                                const accuracy = total > 0 ? Math.round((card.correctCount / total) * 100) : null;
                                return (
                                  <div
                                    key={card.id}
                                    className="p-2.5 rounded bg-slate-800/20 border border-white/5 hover:border-white/10 transition-all flex items-start justify-between gap-2 group"
                                  >
                                    <div className="space-y-1 truncate flex-grow text-left">
                                      <h5 className="text-[11px] font-bold text-white truncate">{card.question}</h5>
                                      <p className="text-[10px] text-gray-400 truncate italic">{card.answer}</p>
                                      {accuracy !== null && (
                                        <span className={`inline-block text-[9px] font-mono font-bold px-1 py-0.5 rounded ${accuracy >= 70 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                          Accuracy: {accuracy}% ({card.correctCount}/{total})
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteFlashcard(card.id)}
                                      className="text-gray-500 hover:text-red-400 transition-all cursor-pointer p-0.5 shrink-0"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="py-8 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl space-y-3">
                            <Layers className="w-8 h-8 text-gray-500 animate-pulse" />
                            <div className="text-center">
                              <h5 className="text-xs font-bold text-white">No Study Cards Created</h5>
                              <p className="text-[10px] text-gray-400 max-w-xs px-4 mt-0.5 leading-relaxed">
                                Create flashcards with important questions, vocabulary, and definitions to review offline deterministically!
                              </p>
                            </div>
                            <button
                              onClick={() => setIsAddingCard(true)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white rounded-lg transition-all cursor-pointer"
                            >
                              Add First Card
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          </div>
        )}

        {/* --- TAB 3: STUDY HISTORY LOGS --- */}
        {activeTab === "history" && (
          <div className="h-full p-6 overflow-y-auto space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> Recent Book Workspaces
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Your study journal history. Click on any book to reload your readings, bookmarks, highlights, and notes workspace.
              </p>
            </div>

            {historyList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyList.map((book) => (
                  <div key={book.id} className="relative h-[110px]">
                    <TiltedCard
                      imageSrc=""
                      containerHeight="110px"
                      containerWidth="100%"
                      scaleOnHover={1.03}
                      rotateAmplitude={8}
                      showTooltip={false}
                    >
                      <div
                        onClick={() => {
                          if (book.id.startsWith("local-")) {
                            setError("Local files must be re-dropped or picked locally to load them for safety protocols.");
                          } else {
                            handleReadBook(book);
                          }
                        }}
                        className="w-full h-full p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:border-emerald-500/25 hover:bg-slate-800/60 cursor-pointer transition-all flex space-x-3 group text-left"
                      >
                        <BookOpen className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold truncate text-white group-hover:text-emerald-400 transition-colors">
                            {book.name}
                          </h4>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {book.authors.join(", ") || "Unknown Author"}
                          </p>
                          {book.size && (
                            <span className="text-[10px] text-gray-500 inline-block mt-2">
                              File size: {book.size}
                            </span>
                          )}
                        </div>
                      </div>
                    </TiltedCard>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-xs">
                Your reading and study journal list is currently empty. Open some books to start tracking!
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const cleanGutenbergHtml = (rawHtml: string): string => {
  if (!rawHtml) return "";
  // Try to find body content to strip heavy html, header metadata, scripts, etc.
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let html = bodyMatch ? bodyMatch[1] : rawHtml;
  
  // Safe regex strip of any <script> tags to ensure no malicious code runs
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Clean custom styles that impose fixed large white margins or fixed heights/widths
  html = html.replace(/margin-left:\s*[^;]+/gi, "");
  html = html.replace(/margin-right:\s*[^;]+/gi, "");
  
  return html;
};

import React, { useState, useRef } from "react";
import {
  Database,
  Download,
  Upload,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  FileJson,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { WorkspaceProfile, Task, CustomCalendarEvent, FocusSession } from "../types";

interface DataHubWidgetProps {
  username: string;
  clockFontClass: string;
  clockSize: number;
  customAccentColor: string;
  glassOpacity: number;
  windowRoundness: number;
  showSeconds: boolean;
  showGreeting: boolean;
  showDate: boolean;
  clockColor: string;
  textSize: string;
  profiles: WorkspaceProfile[];
  currentProfileName: string;
  tasks: Task[];
  calendarEvents: CustomCalendarEvent[];
  focusHistory: FocusSession[];
  
  // Callback to update states on import
  onImportAll: (data: any) => void;
  // Callback to reset workspace
  onResetAll: () => void;
}

export default function DataHubWidget({
  username,
  clockFontClass,
  clockSize,
  customAccentColor,
  glassOpacity,
  windowRoundness,
  showSeconds,
  showGreeting,
  showDate,
  clockColor,
  textSize,
  profiles,
  currentProfileName,
  tasks,
  calendarEvents,
  focusHistory,
  onImportAll,
  onResetAll
}: DataHubWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [pastedCode, setPastedCode] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "overwrite">("merge");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate complete serializable state object
  const getPayload = () => {
    return {
      version: "1.0.0",
      timestamp: Date.now(),
      username,
      clockFontClass,
      clockSize,
      customAccentColor,
      glassOpacity,
      windowRoundness,
      showSeconds,
      showGreeting,
      showDate,
      clockColor,
      textSize,
      profiles,
      currentProfileName,
      tasks,
      calendarEvents,
      focusHistory,
      // also grab API Keys if they exist in localStorage so user can transfer everything
      geminiKey: localStorage.getItem("GEMINI_API_KEY") || "",
      nasaKey: localStorage.getItem("NASA_API_KEY") || ""
    };
  };

  // Export as downloadable file
  const handleExportFile = () => {
    try {
      const payload = getPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `meowlock-backup-${username.toLowerCase().replace(/\s+/g, "-")}-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccessMsg("دیتا با موفقیت صادر شد! / Data exported successfully!");
      clearMessagesLater();
    } catch (err: any) {
      setErrorMsg("خطا در خروجی گرفتن داده‌ها: " + err.message);
    }
  };

  // Copy serialized JSON to clipboard
  const handleCopyCode = async () => {
    try {
      const payload = getPayload();
      const minifiedJson = JSON.stringify(payload);
      await navigator.clipboard.writeText(minifiedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      setSuccessMsg("کد انتقال در حافظه کپی شد! / Transfer code copied!");
      clearMessagesLater();
    } catch (err: any) {
      setErrorMsg("خطا در کپی کردن کد: " + err.message);
    }
  };

  // Clear messages helper
  const clearMessagesLater = () => {
    setTimeout(() => {
      setErrorMsg(null);
      setSuccessMsg(null);
    }, 4500);
  };

  // Validate and apply imported JSON
  const processImportText = (text: string) => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      if (!text.trim()) {
        setErrorMsg("لطفاً ابتدا کد یا فایل را قرار دهید. / Please enter a valid JSON or code.");
        return;
      }
      
      const parsed = JSON.parse(text);
      
      // Simple structure checks
      if (!parsed || (typeof parsed !== "object")) {
        throw new Error("فرمت وارد شده نامعتبر است. / Invalid JSON format.");
      }

      // Check key pieces or set defaults
      const validatedData: any = {
        username: parsed.username || username,
        clockFontClass: parsed.clockFontClass || clockFontClass,
        clockSize: Number(parsed.clockSize) || clockSize,
        customAccentColor: parsed.customAccentColor || customAccentColor,
        glassOpacity: Number(parsed.glassOpacity) || glassOpacity,
        windowRoundness: Number(parsed.windowRoundness) || windowRoundness,
        showSeconds: typeof parsed.showSeconds === "boolean" ? parsed.showSeconds : showSeconds,
        showGreeting: typeof parsed.showGreeting === "boolean" ? parsed.showGreeting : showGreeting,
        showDate: typeof parsed.showDate === "boolean" ? parsed.showDate : showDate,
        clockColor: parsed.clockColor || clockColor,
        textSize: parsed.textSize || textSize,
        geminiKey: parsed.geminiKey || "",
        nasaKey: parsed.nasaKey || ""
      };

      // Handle profiles
      if (Array.isArray(parsed.profiles)) {
        if (importMode === "overwrite") {
          validatedData.profiles = parsed.profiles;
          validatedData.currentProfileName = parsed.currentProfileName || parsed.profiles[0]?.name || "Study Mode";
        } else {
          // Merge profiles by name uniqueness
          const mergedProfiles = [...profiles];
          parsed.profiles.forEach((p: WorkspaceProfile) => {
            if (p && p.name && !mergedProfiles.some(existing => existing.name === p.name)) {
              mergedProfiles.push(p);
            }
          });
          validatedData.profiles = mergedProfiles;
          validatedData.currentProfileName = currentProfileName;
        }
      } else {
        validatedData.profiles = profiles;
        validatedData.currentProfileName = currentProfileName;
      }

      // Handle tasks
      if (Array.isArray(parsed.tasks)) {
        if (importMode === "overwrite") {
          validatedData.tasks = parsed.tasks;
        } else {
          // Merge tasks based on id
          const mergedTasks = [...tasks];
          parsed.tasks.forEach((t: Task) => {
            if (t && t.id && !mergedTasks.some(existing => existing.id === t.id)) {
              mergedTasks.push(t);
            }
          });
          validatedData.tasks = mergedTasks;
        }
      } else {
        validatedData.tasks = tasks;
      }

      // Handle calendar events
      if (Array.isArray(parsed.calendarEvents)) {
        if (importMode === "overwrite") {
          validatedData.calendarEvents = parsed.calendarEvents;
        } else {
          const mergedEvents = [...calendarEvents];
          parsed.calendarEvents.forEach((ev: CustomCalendarEvent) => {
            if (ev && ev.id && !mergedEvents.some(existing => existing.id === ev.id)) {
              mergedEvents.push(ev);
            }
          });
          validatedData.calendarEvents = mergedEvents;
        }
      } else {
        validatedData.calendarEvents = calendarEvents;
      }

      // Handle focus sessions history
      if (Array.isArray(parsed.focusHistory)) {
        if (importMode === "overwrite") {
          validatedData.focusHistory = parsed.focusHistory;
        } else {
          const mergedHistory = [...focusHistory];
          parsed.focusHistory.forEach((h: FocusSession) => {
            if (h && h.id && !mergedHistory.some(existing => existing.id === h.id)) {
              mergedHistory.push(h);
            }
          });
          validatedData.focusHistory = mergedHistory;
        }
      } else {
        validatedData.focusHistory = focusHistory;
      }

      // Trigger the callback to restore all states
      onImportAll(validatedData);
      
      // Save imported API Keys to localstorage if included
      if (validatedData.geminiKey) localStorage.setItem("GEMINI_API_KEY", validatedData.geminiKey);
      if (validatedData.nasaKey) localStorage.setItem("NASA_API_KEY", validatedData.nasaKey);

      setSuccessMsg(
        importMode === "overwrite"
          ? "تمامی اطلاعات جایگزین و همگام شد! / All data overwritten and imported!"
          : "اطلاعات جدید با موفقیت ادغام شد! / New data successfully merged!"
      );
      setPastedCode("");
      clearMessagesLater();
    } catch (err: any) {
      setErrorMsg("قالب اطلاعات وارد شده اشتباه است یا ناقص می‌باشد. / Invalid backup syntax: " + err.message);
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === "string") {
          processImportText(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  // Drag and Drop files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === "string") {
          processImportText(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  // Reset confirmation
  const handleWipeData = () => {
    onResetAll();
    setShowConfirmReset(false);
    setSuccessMsg("فضای کاری شما به حالت اولیه بازنشانی شد. / Workspace resetted successfully.");
    clearMessagesLater();
  };

  return (
    <div className="bg-[#0c0c0c]/90 border border-white/5 rounded-2xl p-5 space-y-4 text-white font-sans max-w-full">
      {/* Header and Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#7c3aed]/10 flex items-center justify-center border border-[#7c3aed]/20">
            <Database className="w-4 h-4 text-[#7c3aed]" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-xs tracking-wider text-white">
              ذخیره و انتقال داده
            </h3>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-medium">
              Data Storage & Transfer
            </span>
          </div>
        </div>
        <div className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>محلی ایمن / Local Storage</span>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5 text-center">
        <div>
          <span className="text-xs text-gray-500 block">پروفایل‌ها</span>
          <span className="text-sm font-bold text-white font-mono">{profiles.length}</span>
          <span className="text-[8px] text-gray-600 block uppercase font-mono">Profiles</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block">کارها</span>
          <span className="text-sm font-bold text-[#7c3aed] font-mono">{tasks.length}</span>
          <span className="text-[8px] text-gray-600 block uppercase font-mono">Tasks</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block">تقویم</span>
          <span className="text-sm font-bold text-amber-400 font-mono">{calendarEvents.length}</span>
          <span className="text-[8px] text-gray-600 block uppercase font-mono">Events</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block">تمرکزها</span>
          <span className="text-sm font-bold text-blue-400 font-mono">{focusHistory.length}</span>
          <span className="text-[8px] text-gray-600 block uppercase font-mono">Sessions</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleExportFile}
          className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-gray-200 hover:text-white transition-all cursor-pointer group"
        >
          <Download className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
          <div className="text-right">
            <span className="block text-[10px] font-bold">دانلود فایل پشتیبان</span>
            <span className="block text-[8px] text-gray-500 font-mono">Export .JSON File</span>
          </div>
        </button>

        <button
          onClick={handleCopyCode}
          className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-gray-200 hover:text-white transition-all cursor-pointer group"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          )}
          <div className="text-right">
            <span className="block text-[10px] font-bold">کپی سریع کد انتقال</span>
            <span className="block text-[8px] text-gray-500 font-mono">Copy Config Code</span>
          </div>
        </button>
      </div>

      {/* Notifications block */}
      {errorMsg && (
        <div className="flex gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-[10px] leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <div>{errorMsg}</div>
        </div>
      )}
      {successMsg && (
        <div className="flex gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[10px] leading-relaxed">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Import Settings Zone */}
      <div className="space-y-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            وارد کردن و همگام‌سازی داده
          </span>
          <span className="text-[8px] text-gray-500 font-mono">Import & Sync</span>
        </div>

        {/* Merge vs Overwrite Selection */}
        <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setImportMode("merge")}
            className={`py-1 px-2 text-[9px] rounded-md font-sans transition-all cursor-pointer ${
              importMode === "merge"
                ? "bg-[#7c3aed] text-white shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ادغام با داده‌های فعلی (Merge)
          </button>
          <button
            type="button"
            onClick={() => setImportMode("overwrite")}
            className={`py-1 px-2 text-[9px] rounded-md font-sans transition-all cursor-pointer ${
              importMode === "overwrite"
                ? "bg-rose-500/80 text-white shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            جایگزینی کامل (Overwrite)
          </button>
        </div>

        {/* Drag & Drop File Upload */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
            isDragging
              ? "border-[#7c3aed] bg-[#7c3aed]/10 scale-[0.99]"
              : "border-white/10 hover:border-white/20 bg-white/[0.01]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFileSelect}
          />
          <Upload className="w-5 h-5 text-gray-400 group-hover:text-white" />
          <div className="text-[10px] font-medium text-gray-300">
            فایل بک‌آپ <span className="font-mono text-purple-400">.json</span> را اینجا بکشید یا انتخاب کنید
          </div>
          <span className="text-[8px] text-gray-500 block font-mono">Drag & Drop or browse backup file</span>
        </div>

        {/* Quick Paste Code Option */}
        <div className="space-y-1.5">
          <label className="block text-[9px] text-gray-400">یا کد انتقال را در کادر زیر قرار دهید:</label>
          <div className="flex gap-1.5">
            <textarea
              value={pastedCode}
              onChange={(e) => setPastedCode(e.target.value)}
              placeholder='{"version":"1.0.0", "username": ...}'
              className="flex-1 bg-white/5 border border-white/5 text-[10px] font-mono rounded-lg px-2 py-1.5 text-white h-9 focus:border-[#7c3aed] focus:outline-none transition-all placeholder:text-gray-600 resize-none min-w-0"
            />
            <button
              onClick={() => processImportText(pastedCode)}
              className="px-3 bg-gradient-to-r from-[#7c3aed] to-indigo-600 hover:opacity-90 text-white rounded-lg font-sans font-bold text-[10px] cursor-pointer flex items-center justify-center shrink-0 transition-opacity"
            >
              اجرا / Load
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-3 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">منطقه حساس / Danger Zone</span>
          <span className="text-[8px] text-gray-600 font-mono">Reset Workspace</span>
        </div>
        
        {showConfirmReset ? (
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-2.5 space-y-2">
            <p className="text-[9px] text-rose-200 leading-normal">
              آیا مطمئن هستید؟ تمام داده‌ها، پروفایل‌ها، وظایف و تنظیمات شما برای همیشه حذف خواهند شد.
              <span className="block font-bold text-rose-400 mt-1">This action is permanent and cannot be undone.</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleWipeData}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-1.5 text-[10px] font-bold cursor-pointer transition-colors"
              >
                بله، بازنشانی کامل / Wipe All
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg py-1.5 text-[10px] cursor-pointer transition-colors"
              >
                انصراف / Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/20 rounded-xl py-1.5 text-[9px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>حذف تمام اطلاعات و ریست فکتوری / Restore Factory Settings</span>
          </button>
        )}
      </div>
    </div>
  );
}

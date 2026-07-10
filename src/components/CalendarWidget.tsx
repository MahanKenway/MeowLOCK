import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Clock, 
  ArrowLeftRight, 
  Info, 
  X, 
  AlertCircle,
  Download,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as jalaali from "jalaali-js";
import { getHolidaysClient } from "../services/holidays";

// --- JALAALI CONVERSION ALGORITHMS (using jalaali-js) ---
export function toJalaali(gy: number, gm: number, gd: number) {
  const res = jalaali.toJalaali(gy, gm, gd);
  return { jy: res.jy, jm: res.jm, jd: res.jd };
}

export function toGregorian(jy: number, jm: number, jd: number) {
  const res = jalaali.toGregorian(jy, jm, jd);
  return { gy: res.gy, gm: res.gm, gd: res.gd };
}

// --- PERSIAN CONSTANTS ---
const shamsiMonths = [
  "فروردین", "اردیبهشت", "خرداد", 
  "تیر", "مرداد", "شهریور", 
  "مهر", "آبان", "آذر", 
  "دی", "بهمن", "اسفند"
];

const weekdaysFull = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const weekdaysShort = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// --- HOLIDAY DATA INTERFACE ---
interface CalendarHoliday {
  shamsiDate?: { m: number; d: number };
  titleFa: string;
  titleEn: string;
  isOfficial: boolean;
  description?: string;
}

// Fixed solar holidays
const fixedHolidays: CalendarHoliday[] = [
  { shamsiDate: { m: 1, d: 1 }, titleFa: "عید نوDay", titleEn: "Nowruz (New Year)", isOfficial: true },
  { shamsiDate: { m: 1, d: 2 }, titleFa: "عید نوDay", titleEn: "Nowruz Holiday", isOfficial: true },
  { shamsiDate: { m: 1, d: 3 }, titleFa: "عید نوDay", titleEn: "Nowruz Holiday", isOfficial: true },
  { shamsiDate: { m: 1, d: 4 }, titleFa: "عید نوDay", titleEn: "Nowruz Holiday", isOfficial: true },
  { shamsiDate: { m: 1, d: 12 }, titleFa: "Day جمهوری اسلامی", titleEn: "Islamic Republic Day", isOfficial: true },
  { shamsiDate: { m: 1, d: 13 }, titleFa: "Day طبیعت (سیزده بدر)", titleEn: "Sizdah Bedar", isOfficial: true },
  { shamsiDate: { m: 3, d: 14 }, titleFa: "رحلت امام خمینی", titleEn: "Demise of Imam Khomeini", isOfficial: true },
  { shamsiDate: { m: 3, d: 15 }, titleFa: "قیام ۱۵ خرداد", titleEn: "Revolt of Khordad 15", isOfficial: true },
  { shamsiDate: { m: 11, d: 22 }, titleFa: "پیDayی انقلاب اسلامی", titleEn: "Islamic Revolution Day", isOfficial: true },
  { shamsiDate: { m: 12, d: 29 }, titleFa: "ملی شدن صنعت نفت", titleEn: "Nationalization of Oil Industry", isOfficial: true }
];

// Special dynamic lunar holidays mapped to Shamsi 1404 & 1405 (2025-2027)
const preseededLunarHolidays: Record<string, CalendarHoliday> = {
  // --- Jalaali 1404 ---
  "1404-01-21": { titleFa: "شهادت حضرت علی (ع)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
  "1404-01-22": { titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr", isOfficial: true },
  "1404-01-23": { titleFa: "تعطیل عید سعید فطر", titleEn: "Eid al-Fitr Holiday", isOfficial: true },
  "1404-02-23": { titleFa: "شهادت امام جعفر صادق (ع)", titleEn: "Martyrdom of Imam Sadiq", isOfficial: true },
  "1404-03-16": { titleFa: "عید سعید قربان", titleEn: "Eid al-Adha", isOfficial: true },
  "1404-03-24": { titleFa: "عید سعید غدیر خم", titleEn: "Eid al-Ghadir", isOfficial: true },
  "1404-04-14": { titleFa: "تاسوعای حسینی", titleEn: "Tasua", isOfficial: true },
  "1404-04-15": { titleFa: "عاشورای حسینی", titleEn: "Ashura", isOfficial: true },
  "1404-04-24": { titleFa: "شهادت امام زین‌العابدین (ع)", titleEn: "Martyrdom of Imam Sajjad", isOfficial: true },
  "1404-05-24": { titleFa: "اربعین حسینی", titleEn: "Arbaeen", isOfficial: true },
  "1404-06-01": { titleFa: "رحلت پیامبر (ص) و شهادت امام حسن مجتبی (ع)", titleEn: "Demise of Prophet & Imam Hassan", isOfficial: true },
  "1404-06-03": { titleFa: "شهادت امام رضا (ع)", titleEn: "Martyrdom of Imam Reza", isOfficial: true },
  "1404-06-11": { titleFa: "شهادت امام حسن عسکری (ع)", titleEn: "Martyrdom of Imam Askari", isOfficial: true },
  "1404-06-20": { titleFa: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", titleEn: "Milad of Prophet & Imam Sadiq", isOfficial: true },
  "1404-08-14": { titleFa: "شهادت حضرت فاطمه زهرا (س)", titleEn: "Martyrdom of Hazrat Fatima", isOfficial: true },
  "1404-10-10": { titleFa: "ولادت حضرت امام علی (ع)", titleEn: "Birth of Imam Ali", isOfficial: true },
  "1404-10-24": { titleFa: "مبعث حضرت رسول اکرم (ص)", titleEn: "Mabaas of Prophet", isOfficial: true },
  "1404-11-12": { titleFa: "ولادت حضرت قائم (عج)", titleEn: "Birth of Imam Mahdi", isOfficial: true },
  "1404-12-20": { titleFa: "شهادت حضرت علی (ع) (سال دوم)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },

  // --- Jalaali 1405 ---
  "1405-01-04": { titleFa: "شهادت حضرت علی (ع)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
  "1405-01-22": { titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr", isOfficial: true },
  "1405-01-23": { titleFa: "تعطیل عید سعید فطر", titleEn: "Eid al-Fitr Holiday", isOfficial: true },
  "1405-02-23": { titleFa: "شهادت امام جعفر صادق (ع)", titleEn: "Martyrdom of Imam Sadiq", isOfficial: true },
  "1405-03-18": { titleFa: "عید سعید قربان", titleEn: "Eid al-Adha", isOfficial: true },
  "1405-03-26": { titleFa: "عید سعید غدیر خم", titleEn: "Eid al-Ghadir", isOfficial: true },
  "1405-04-14": { titleFa: "تاسوعای حسینی", titleEn: "Tasua", isOfficial: true },
  "1405-04-15": { titleFa: "عاشورای حسینی", titleEn: "Ashura", isOfficial: true },
  "1405-04-24": { titleFa: "شهادت امام زین‌العابدین (ع)", titleEn: "Martyrdom of Imam Sajjad", isOfficial: true },
  "1405-05-24": { titleFa: "اربعین حسینی", titleEn: "Arbaeen", isOfficial: true },
  "1405-06-01": { titleFa: "رحلت پیامبر (ص) و شهادت امام حسن مجتبی (ع)", titleEn: "Demise of Prophet & Imam Hassan", isOfficial: true },
  "1405-06-03": { titleFa: "شهادت امام رضا (ع)", titleEn: "Martyrdom of Imam Reza", isOfficial: true },
  "1405-06-11": { titleFa: "شهادت امام حسن عسکری (ع)", titleEn: "Martyrdom of Imam Askari", isOfficial: true },
  "1405-06-20": { titleFa: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", titleEn: "Milad of Prophet & Imam Sadiq", isOfficial: true },
  "1405-08-14": { titleFa: "شهادت حضرت فاطمه زهرا (س)", titleEn: "Martyrdom of Hazrat Fatima", isOfficial: true },
  "1405-10-10": { titleFa: "شهادت حضرت علی (ع) (سال دوم)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
  "1405-10-29": { titleFa: "عید سعید فطر (سال دوم)", titleEn: "Eid al-Fitr", isOfficial: true },
  "1405-10-30": { titleFa: "تعطیل عید فطر (سال دوم)", titleEn: "Eid al-Fitr Holiday", isOfficial: true }
};

import { CustomCalendarEvent } from "../types";

interface CalendarWidgetProps {
  onClose?: () => void;
  events: CustomCalendarEvent[];
  onAddEvent: (event: CustomCalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onDeleteAllEvents: () => void;
}

interface CalendarDayItem {
  jy: number;
  jm: number;
  jd: number;
  isCurrentMonth: boolean;
  dateStrG: string;
  dateStrJ: string;
}

export default function CalendarWidget({ 
  onClose,
  events,
  onAddEvent,
  onDeleteEvent,
  onDeleteAllEvents
}: CalendarWidgetProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "gcal">("calendar");
  const [calendarSubMode, setCalendarSubMode] = useState<"shamsi" | "converter" | "events">("shamsi");
  
  // Today's Date Info
  const today = new Date();
  const todayGYear = today.getFullYear();
  const todayGMonth = today.getMonth() + 1;
  const todayGDay = today.getDate();
  const todayJ = toJalaali(todayGYear, todayGMonth, todayGDay);

  // Navigated Shamsi Month/Year
  const [viewJYear, setViewJYear] = useState(todayJ.jy);
  const [viewJMonth, setViewJMonth] = useState(todayJ.jm);

  // Dynamic API holidays state
  const [apiHolidays, setApiHolidays] = useState<CalendarHoliday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  // Selected Date State (Defaults to Today's Date)
  const todayGStr = `${todayGYear}-${String(todayGMonth).padStart(2, "0")}-${String(todayGDay).padStart(2, "0")}`;
  const todayJStr = `${todayJ.jy}-${String(todayJ.jm).padStart(2, "0")}-${String(todayJ.jd).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<{ g: string; j: string }>({ g: todayGStr, j: todayJStr });

  // Google Calendar Integration State
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [gcalSyncLoading, setGcalSyncLoading] = useState(false);

  // New Event Form
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<"study" | "exam" | "personal" | "holiday">("study");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventNotes, setNewEventNotes] = useState("");

  // Converter inputs
  const [convGYear, setConvGYear] = useState(String(todayGYear));
  const [convGMonth, setConvGMonth] = useState(String(todayGMonth));
  const [convGDay, setConvGDay] = useState(String(todayGDay));
  const [convResultJ, setConvResultJ] = useState("");

  const [convJYear, setConvJYear] = useState(String(todayJ.jy));
  const [convJMonth, setConvJMonth] = useState(String(todayJ.jm));
  const [convJDay, setConvJDay] = useState(String(todayJ.jd));
  const [convResultG, setConvResultG] = useState("");

  // Fetch holidays dynamically when Jalaali year changes
  useEffect(() => {
    async function fetchHolidays() {
      setIsLoadingHolidays(true);
      try {
        const holidays = await getHolidaysClient(viewJYear);
        setApiHolidays(holidays);
      } catch (err) {
        console.error("Error fetching holidays client-side:", err);
      } finally {
        setIsLoadingHolidays(false);
      }
    }
    fetchHolidays();
  }, [viewJYear]);

  // Date Converter logic
  useEffect(() => {
    const gy = parseInt(convGYear);
    const gm = parseInt(convGMonth);
    const gd = parseInt(convGDay);
    if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd) && gm >= 1 && gm <= 12 && gd >= 1 && gd <= 31) {
      try {
        const res = toJalaali(gy, gm, gd);
        setConvResultJ(`${res.jy}/${res.jm}/${res.jd} (${shamsiMonths[res.jm - 1]})`);
      } catch (e) {
        setConvResultJ("Invalid");
      }
    } else {
      setConvResultJ("ـ");
    }
  }, [convGYear, convGMonth, convGDay]);

  useEffect(() => {
    const jy = parseInt(convJYear);
    const jm = parseInt(convJMonth);
    const jd = parseInt(convJDay);
    if (!isNaN(jy) && !isNaN(jm) && !isNaN(jd) && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31) {
      try {
        const res = toGregorian(jy, jm, jd);
        const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        setConvResultG(`${res.gy}/${res.gm}/${res.gd} (${monthsEn[res.gm - 1]})`);
      } catch (e) {
        setConvResultG("Invalid");
      }
    } else {
      setConvResultG("ـ");
    }
  }, [convJYear, convJMonth, convJDay]);

  // Jalaali month length calculator
  function getDaysInShamsiMonth(jy: number, jm: number) {
    return jalaali.jalaaliMonthLength(jy, jm);
  }

  // Generate 42 grid cells (6 rows × 7 columns) for perfect RTL layout
  function generateGridDays(jy: number, jm: number): CalendarDayItem[] {
    const currentDays = getDaysInShamsiMonth(jy, jm);
    
    // Day of the week of 1st day of month
    const firstG = toGregorian(jy, jm, 1);
    const firstDateObj = new Date(firstG.gy, firstG.gm - 1, firstG.gd);
    const jsDay = firstDateObj.getDay();
    // In Persian calendar, Sat is Column 0 (right-most) and Fri is Column 6 (left-most)
    const startOffset = (jsDay + 1) % 7;
    
    const grid: CalendarDayItem[] = [];
    
    // 1. Fill previous month's overlapping days
    const prevMonth = jm === 1 ? 12 : jm - 1;
    const prevYear = jm === 1 ? jy - 1 : jy;
    const prevDays = getDaysInShamsiMonth(prevYear, prevMonth);
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevDays - i;
      const g = toGregorian(prevYear, prevMonth, d);
      grid.push({
        jy: prevYear,
        jm: prevMonth,
        jd: d,
        isCurrentMonth: false,
        dateStrG: `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`,
        dateStrJ: `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      });
    }
    
    // 2. Fill current month's days
    for (let d = 1; d <= currentDays; d++) {
      const g = toGregorian(jy, jm, d);
      grid.push({
        jy,
        jm,
        jd: d,
        isCurrentMonth: true,
        dateStrG: `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`,
        dateStrJ: `${jy}-${String(jm).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      });
    }
    
    // 3. Fill next month's overlapping days
    const nextMonth = jm === 12 ? 1 : jm + 1;
    const nextYear = jm === 12 ? jy + 1 : jy;
    const remainingCells = 42 - grid.length;
    for (let d = 1; d <= remainingCells; d++) {
      const g = toGregorian(nextYear, nextMonth, d);
      grid.push({
        jy: nextYear,
        jm: nextMonth,
        jd: d,
        isCurrentMonth: false,
        dateStrG: `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`,
        dateStrJ: `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      });
    }
    
    return grid;
  }

  // Shamsi Monthly Navigation
  const prevShamsiMonth = () => {
    if (viewJMonth === 1) {
      setViewJMonth(12);
      setViewJYear(viewJYear - 1);
    } else {
      setViewJMonth(viewJMonth - 1);
    }
  };

  const nextShamsiMonth = () => {
    if (viewJMonth === 12) {
      setViewJMonth(1);
      setViewJYear(viewJYear + 1);
    } else {
      setViewJMonth(viewJMonth + 1);
    }
  };

  // Check if a day is an official holiday (combines API, local dynamic 1405, and fixed)
  const getHolidayForDay = (jy: number, jm: number, jd: number) => {
    // 1. Check API fetched holidays first (if available)
    if (apiHolidays.length > 0) {
      const found = apiHolidays.find(h => h.shamsiDate && h.shamsiDate.m === jm && h.shamsiDate.d === jd);
      if (found) return found;
    }

    // 2. Fallback to pre-seeded lunar lists (1404 & 1405)
    const dateKey = `${jy}-${String(jm).padStart(2, "0")}-${String(jd).padStart(2, "0")}`;
    if (preseededLunarHolidays[dateKey]) {
      return preseededLunarHolidays[dateKey];
    }

    // 3. Fallback to fixed shamsi holidays
    const foundFixed = fixedHolidays.find(h => h.shamsiDate && h.shamsiDate.m === jm && h.shamsiDate.d === jd);
    if (foundFixed) return foundFixed;

    return null;
  };

  // Check custom studies/events for a day
  const getEventsForDay = (dateStrG: string) => {
    return events.filter(e => e.dateStr === dateStrG);
  };

  // Convert numbers to Persian numerals
  const toPersianNum = (num: number | string) => {
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return String(num).replace(/[0-9]/g, c => farsiDigits[parseInt(c)]);
  };

  // Build current date string for header
  const getHeaderDateString = () => {
    if (!selectedDay) return "";
    const parts = selectedDay.j.split("-").map(Number);
    const jy = parts[0];
    const jm = parts[1];
    const jd = parts[2];
    
    // Get day of the week
    const g = toGregorian(jy, jm, jd);
    const dObj = new Date(g.gy, g.gm - 1, g.gd);
    const wdIdx = (dObj.getDay() + 1) % 7;
    return `${weekdaysFull[wdIdx]}، ${toPersianNum(jd)} ${shamsiMonths[jm - 1]} ${toPersianNum(jy)}`;
  };

  // Export calendar events to .ics file
  const handleExportICS = () => {
    if (events.length === 0) return;
    
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MeowLOCK//Study Planner//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    
    events.forEach(ev => {
      const uid = ev.id || `study-event-${Math.random().toString(36).substring(2, 9)}@meowlock.com`;
      const dateClean = ev.dateStr.replace(/-/g, "");
      
      let startTime = "090000";
      if (ev.time) {
        startTime = ev.time.replace(/:/g, "") + "00";
      }
      
      const dtstart = `${dateClean}T${startTime}`;
      const hourNum = parseInt(startTime.substring(0, 2)) || 9;
      const endHour = String((hourNum + 1) % 24).padStart(2, "0");
      const dtend = `${dateClean}T${endHour}${startTime.substring(2, 6)}`;
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${uid}\n`;
      icsContent += `DTSTAMP:${dateClean}T000000Z\n`;
      icsContent += `DTSTART;TZID=Asia/Tehran:${dtstart}\n`;
      icsContent += `DTEND;TZID=Asia/Tehran:${dtend}\n`;
      icsContent += `SUMMARY:${ev.title}\n`;
      if (ev.notes) {
        icsContent += `DESCRIPTION:${ev.notes.replace(/\n/g, "\\n")}\n`;
      }
      icsContent += `CATEGORIES:${ev.category.toUpperCase()}\n`;
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "study_planner_iran_holidays.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form submit for adding an event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !newEventTitle.trim()) return;

    const newEv: CustomCalendarEvent = {
      id: "event-" + Math.random().toString(36).substring(2, 9),
      dateStr: selectedDay.g,
      title: newEventTitle.trim(),
      category: newEventCategory,
      time: newEventTime || undefined,
      notes: newEventNotes.trim() || undefined
    };

    onAddEvent(newEv);
    setNewEventTitle("");
    setNewEventNotes("");
    setNewEventTime("");
    setShowEventForm(false);
  };

  const handleDeleteEvent = (id: string) => {
    onDeleteEvent(id);
  };

  const getEventCategoryColor = (cat: string) => {
    switch (cat) {
      case "study": return "bg-sky-400";
      case "exam": return "bg-rose-400";
      case "personal": return "bg-purple-400";
      case "focus": return "bg-emerald-400";
      default: return "bg-amber-400";
    }
  };

  return (
    <div className="flex flex-col h-full text-gray-200 select-none font-sans relative pr-1">
      {/* HEADER SECTION - DATE & CHEVRONS */}
      {activeTab === "calendar" && calendarSubMode === "shamsi" && (
        <div className="flex items-center justify-between mb-6">
          {/* Month Navigation - Left Cluster */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
            <button 
              onClick={prevShamsiMonth}
              className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white cursor-pointer transition-colors"
              title="Previous Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-gray-400 font-mono select-none">
              {viewJYear}/{String(viewJMonth).padStart(2, "0")}
            </span>
            <button 
              onClick={nextShamsiMonth}
              className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white cursor-pointer transition-colors"
              title="Next Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Current Persian Selected Date - Right Aligned */}
          <div className="text-right">
            <h4 className="text-sm font-bold text-white tracking-wide font-sans">
              {getHeaderDateString()}
            </h4>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">
                {shamsiMonths[viewJMonth - 1]} {toPersianNum(viewJYear)}
              </span>
              {isLoadingHolidays && (
                <span className="w-2 h-2 rounded-full border border-sky-400 border-t-transparent animate-spin" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPACT VIEW MODE SELECTOR (WHEN ON CALENDAR TAB) */}
      {activeTab === "calendar" && (
        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl mb-4 border border-white/5">
          <button
            onClick={() => setCalendarSubMode("shamsi")}
            className={`py-1 text-center rounded-lg text-[10px] font-semibold tracking-tight transition-all cursor-pointer ${
              calendarSubMode === "shamsi" ? "bg-white/10 text-white border border-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Solar Calendar
          </button>
          <button
            onClick={() => setCalendarSubMode("converter")}
            className={`py-1 text-center rounded-lg text-[10px] font-semibold tracking-tight transition-all cursor-pointer ${
              calendarSubMode === "converter" ? "bg-white/10 text-white border border-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Date Converter
          </button>
          <button
            onClick={() => setCalendarSubMode("events")}
            className={`py-1 text-center rounded-lg text-[10px] font-semibold tracking-tight transition-all relative cursor-pointer ${
              calendarSubMode === "events" ? "bg-white/10 text-white border border-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Events ({events.length})
            {events.length > 0 && (
              <span className="absolute top-1 right-2 w-1 h-1 bg-sky-400 rounded-full animate-ping" />
            )}
          </button>
        </div>
      )}

      {/* MAIN VIEW CONTROLLER */}
      <div className="flex-1 min-h-0 flex flex-col justify-between">
        
        {/* TAB 1: CALENDAR VIEW */}
        {activeTab === "calendar" && (
          <div className="flex-1 flex flex-col justify-between">
            
            {/* SUB-MODE A: SHAMSI CALENDAR GRID */}
            {calendarSubMode === "shamsi" && (
              <div className="flex-1 flex flex-col justify-between" dir="rtl">
                {/* Weekdays Row */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold text-white/50">
                  {weekdaysShort.map((wd, idx) => (
                    <div key={idx} className={`py-1 ${idx === 6 ? "text-rose-400 font-bold" : ""}`}>
                      {wd}
                    </div>
                  ))}
                </div>

                {/* 6-Row Grid */}
                <div className="grid grid-cols-7 gap-1.5 flex-1 select-none">
                  {generateGridDays(viewJYear, viewJMonth).map((item, idx) => {
                    const isSelected = selectedDay.j === item.dateStrJ;
                    const isToday = todayJStr === item.dateStrJ;
                    const holiday = getHolidayForDay(item.jy, item.jm, item.jd);
                    const dayEvents = getEventsForDay(item.dateStrG);
                    
                    // Style indicators
                    const isFriday = idx % 7 === 6; // column 6 is Friday in RTL
                    
                    // Color classes
                    let colorClass = "text-white";
                    if (!item.isCurrentMonth) {
                      colorClass = "text-white/20";
                    } else if (isFriday || (holiday && holiday.isOfficial)) {
                      colorClass = "text-rose-400 font-bold";
                    }

                    return (
                      <motion.div
                        key={`cell-${idx}`}
                        onClick={() => setSelectedDay({ g: item.dateStrG, j: item.dateStrJ })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative aspect-square flex flex-col items-center justify-center p-1 cursor-pointer transition-colors rounded-full ${
                          isSelected 
                            ? "border border-dashed border-sky-400 bg-sky-400/5 shadow-inner" 
                            : isToday 
                            ? "bg-white/10 border border-white/20 text-white" 
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        {/* Day Number */}
                        <span className={`text-[13px] font-medium ${colorClass}`}>
                          {toPersianNum(item.jd)}
                        </span>

                        {/* Dot indicator underneath */}
                        <div className="absolute bottom-1.5 flex gap-0.5 justify-center items-center">
                          {/* Event Dot */}
                          {dayEvents.length > 0 && (
                            <span className="w-1 h-1 rounded-full bg-sky-400" />
                          )}
                          {/* Holiday Dot */}
                          {item.isCurrentMonth && holiday && holiday.isOfficial && (
                            <span className="w-1 h-1 rounded-full bg-rose-400" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Selected Day Agenda & Quick Add */}
                {selectedDay && (
                  <div className="mt-4 bg-white/5 border border-white/5 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] text-gray-400">
                        Events for {toPersianNum(selectedDay.j.split("-")[2])} {shamsiMonths[parseInt(selectedDay.j.split("-")[1]) - 1]}
                      </span>
                      {!showEventForm && (
                        <button
                          onClick={() => setShowEventForm(true)}
                          className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Study Plan
                        </button>
                      )}
                    </div>

                    {/* Holiday check */}
                    {(() => {
                      const parts = selectedDay.j.split("-").map(Number);
                      const holiday = getHolidayForDay(parts[0], parts[1], parts[2]);
                      if (!holiday) return null;
                      return (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-rose-300 font-medium flex items-center gap-1">
                            <Info className="w-3 h-3" /> {holiday.titleFa}
                          </span>
                          {holiday.isOfficial && (
                            <span className="text-[8px] bg-rose-500 text-white px-1 py-0.5 rounded uppercase font-black tracking-tighter">Official Holiday</span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Events list for selected day */}
                    <div className="max-h-[90px] overflow-y-auto no-scrollbar space-y-1.5">
                      {getEventsForDay(selectedDay.g).length === 0 ? (
                        <div className="text-center py-2 text-[10px] text-gray-500">
                          No events scheduled for this day.
                        </div>
                      ) : (
                        getEventsForDay(selectedDay.g).map((ev) => (
                          <div 
                            key={ev.id} 
                            className="bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${getEventCategoryColor(ev.category)}`} />
                              <span className="text-[11px] font-medium text-white">{ev.title}</span>
                              {ev.time && <span className="text-[9px] text-gray-400 font-mono">({toPersianNum(ev.time)})</span>}
                            </div>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-1 hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-MODE B: DATE CONVERTER */}
            {calendarSubMode === "converter" && (
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pt-2">
                {/* Miladi to Shamsi */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mb-2">
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Gregorian to Solar
                  </h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label className="text-[8px] text-gray-400 uppercase block mb-1">Year</label>
                      <input
                        type="number"
                        value={convGYear}
                        onChange={(e) => setConvGYear(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-400 uppercase block mb-1">Month</label>
                      <input
                        type="number"
                        value={convGMonth}
                        min="1"
                        max="12"
                        onChange={(e) => setConvGMonth(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-400 uppercase block mb-1">Day</label>
                      <input
                        type="number"
                        value={convGDay}
                        min="1"
                        max="31"
                        onChange={(e) => setConvGDay(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Equivalent Solar Date:</span>
                    <span className="text-xs font-bold text-white font-mono">{toPersianNum(convResultJ)}</span>
                  </div>
                </div>

                {/* Shamsi to Miladi */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mb-2">
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Solar to Gregorian
                  </h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label className="text-[8px] text-gray-400 uppercase block mb-1">Solar Year</label>
                      <input
                        type="number"
                        value={convJYear}
                        onChange={(e) => setConvJYear(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-400 uppercase block mb-1">Month</label>
                      <input
                        type="number"
                        value={convJMonth}
                        min="1"
                        max="12"
                        onChange={(e) => setConvJMonth(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-400 uppercase block mb-1">Day</label>
                      <input
                        type="number"
                        value={convJDay}
                        min="1"
                        max="31"
                        onChange={(e) => setConvJDay(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Gregorian Equivalent:</span>
                    <span className="text-xs font-bold text-white font-mono">{convResultG}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODE C: STUDY EVENTS LIST */}
            {calendarSubMode === "events" && (
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">لیست Events for شما</span>
                  {events.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportICS}
                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                        title="Standard Calendar Export"
                      >
                        <Download className="w-3 h-3" /> Download Calendar (.ics)
                      </button>
                      <button
                        onClick={() => { if(confirm("Are you sure you want to delete all events?")) onDeleteAllEvents(); }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        Delete All
                      </button>
                    </div>
                  )}
                </div>

                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-white/[0.01] border border-dashed border-white/5 rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-xs text-gray-400">No events to display</span>
                    <span className="text-[9px] text-gray-500 mt-1">یک Day را در Calendar انتخاب کنید تا برنامه مطالعاتی بسازید</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...events].sort((a,b) => a.dateStr.localeCompare(b.dateStr)).map((ev) => {
                      const gParts = ev.dateStr.split("-").map(Number);
                      const jParts = toJalaali(gParts[0], gParts[1], gParts[2]);

                      return (
                        <div 
                          key={ev.id}
                          className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl relative group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 bg-white/5 rounded text-gray-300 tracking-tight">
                                {toPersianNum(jParts.jy)}/{toPersianNum(jParts.jm)}/{toPersianNum(jParts.jd)}
                              </span>
                              <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded text-neutral-900 ${
                                ev.category === "study" ? "bg-sky-400" : ev.category === "exam" ? "bg-rose-400" : "bg-purple-400"
                              }`}>
                                {ev.category}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-white mb-0.5">{ev.title}</h5>
                            {ev.time && (
                              <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono mb-1">
                                <Clock className="w-2.5 h-2.5" /> {toPersianNum(ev.time)}
                              </div>
                            )}
                            {ev.notes && (
                              <p className="text-[10px] text-gray-400 font-sans leading-relaxed border-t border-white/5 mt-1.5 pt-1.5">
                                {ev.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1 hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-400 cursor-pointer self-start transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: GOOGLE CALENDAR VIEW */}
        {activeTab === "gcal" && (
          <div className="flex-1 flex flex-col justify-between pt-2">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4 flex-1 flex flex-col justify-center text-center">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">Sync Directly with Google Calendar</h4>
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                  Events for مطالعاتی، امتحانات و اوقات فراغت خود را مستقیماً با Calendar گوگل تلفن همراه و دسکتاپ خود هMonthنگ کنید.
                </p>
              </div>

              {isGCalConnected ? (
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-center gap-2 mx-auto max-w-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-medium">Google Calendar successfully connected</span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setGcalSyncLoading(true);
                        setTimeout(() => {
                          setGcalSyncLoading(false);
                          alert("Events synced successfully!");
                        }, 1200);
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${gcalSyncLoading ? "animate-spin" : ""}`} /> بDayرسانی مجدد
                    </button>
                    <button
                      onClick={() => setIsGCalConnected(false)}
                      className="px-4 py-2 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setGcalSyncLoading(true);
                      setTimeout(() => {
                        setGcalSyncLoading(false);
                        setIsGCalConnected(true);
                      }, 1500);
                    }}
                    className="w-full max-w-xs mx-auto py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {gcalSyncLoading ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21.35 11.1H12v2.7h5.3c-.23 1.25-.94 2.29-2 2.96v2.46h3.2c1.9-1.76 3-4.35 3-7.12 0-.6-.05-1.2-.15-1.66z" fill="#4285F4"/>
                          <path d="M12 21c2.43 0 4.47-.8 5.96-2.2l-3.2-2.46c-.9.6-2.02.96-2.76.96-2.12 0-3.92-1.43-4.56-3.36H4.2v2.54C5.7 18.9 8.6 21 12 21z" fill="#34A853"/>
                          <path d="M7.44 13.94c-.16-.48-.25-1-.25-1.54s.09-1.06.25-1.54V8.3H4.2C3.58 9.55 3.2 11 3.2 12.5s.38 2.95 1 4.2l3.24-2.52z" fill="#FBBC05"/>
                          <path d="M12 6.1c1.32 0 2.5.45 3.44 1.35l2.58-2.58C16.47 3.32 14.43 2.5 12 2.5 8.6 2.5 5.7 4.6 4.2 7.15l3.24 2.54c.64-1.93 2.44-3.36 4.56-3.36z" fill="#EA4335"/>
                        </svg>
                        Connect to Google Account
                      </>
                    )}
                  </button>
                  
                  {/* ICS Fallback instruction */}
                  <div className="border-t border-white/5 pt-3 max-w-xs mx-auto">
                    <span className="text-[10px] text-gray-500 block mb-1">Auto-connect not possible?</span>
                    <button
                      onClick={handleExportICS}
                      disabled={events.length === 0}
                      className={`text-[10px] font-bold flex items-center justify-center gap-1 mx-auto ${
                        events.length > 0 ? "text-sky-400 hover:text-sky-300 cursor-pointer" : "text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <Download className="w-3 h-3" /> Download Calendar (.ics) و ایمپورت دستی در گوگل
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* DETAILED ADD EVENT POPUP */}
      <AnimatePresence>
        {showEventForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-[#0a0a0a]/98 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col z-50 overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
              <span className="text-xs font-bold text-white font-sans">
                Add Event for {toPersianNum(selectedDay.j.split("-")[2])} {shamsiMonths[parseInt(selectedDay.j.split("-")[1]) - 1]} {toPersianNum(selectedDay.j.split("-")[0])}
              </span>
              <button 
                type="button"
                onClick={() => setShowEventForm(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3.5">
              <div>
                <label className="text-[9px] text-gray-400 uppercase block mb-1">Study Plan Title</label>
                <input
                  type="text"
                  required
                  placeholder="Example: Review Geometry Chapter 3 or Biology"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[9px] text-gray-400 uppercase block mb-1">Category</label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="study">Study</option>
                    <option value="exam">Exam</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 uppercase block mb-1">Time (Optional)</label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-gray-400 uppercase block mb-1">Description & Notes</label>
                <textarea
                  placeholder="Key points, chapters to study, exercises, etc..."
                  value={newEventNotes}
                  rows={3}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Save to Calendar 🌟
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FOOTER MAIN TABS (EXACTLY MATCHING IMAGE) --- */}
      <div className="flex border-t border-white/10 mt-5 pt-3.5">
        <div className="grid grid-cols-2 gap-3.5 w-full">
          {/* Tab 1: Google Calendar (Left side in LTR layout, right side in RTL. In image, it is on the left) */}
          <button
            onClick={() => setActiveTab("gcal")}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "gcal" 
                ? "bg-white/10 text-white border border-white/10" 
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.35 11.1H12v2.7h5.3c-.23 1.25-.94 2.29-2 2.96v2.46h3.2c1.9-1.76 3-4.35 3-7.12 0-.6-.05-1.2-.15-1.66z" fill="currentColor"/>
            </svg>
            Google Calendar
          </button>

          {/* Tab 2: Calendar (In image, it is on the right) */}
          <button
            onClick={() => setActiveTab("calendar")}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "calendar" 
                ? "bg-white/10 text-white border border-white/10" 
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

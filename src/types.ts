export type TimerMode = "pomodoro" | "shortBreak" | "longBreak" | "stopwatch" | "countdown";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dateCreated: string;
  estimateSessions: number;
  actualSessions: number;
  subtasks?: { id: string; title: string; completed: boolean }[];
  notes?: string;
  tag?: string;
  isPinned?: boolean;
}

export interface FocusSession {
  id: string;
  startTime: string;
  duration: number; // in seconds
  mode: "pomodoro" | "stopwatch" | "countdown" | "shortBreak" | "longBreak";
  completed: boolean;
  profileName: string;
}

export interface PresetTheme {
  id: string;
  name: string;
  bgUrl: string;
  blur: number;
  overlay: number;
  textColor: string;
  accentColor: string;
  cardBg: string;
  borderColor: string;
  fontFamily: string; // sans, mono, display
}

export interface TimerSettings {
  pomodoro: number; // minutes
  shortBreak: number;
  longBreak: number;
  countdown: number;
  autoStartNext: boolean;
  soundEnabled: boolean;
}

export interface AmbientSounds {
  rain: number; // 0 to 1
  cafe: number;
  whiteNoise: number;
  fire: number;
  wind: number;
}

export interface WellnessSettings {
  breakReminderEnabled: boolean;
  breakInterval: number; // minutes
  eyeCareEnabled: boolean;
  eyeCareInterval: number; // minutes
  waterReminderEnabled: boolean;
  waterInterval: number; // minutes
}

export interface WidgetLayout {
  timer: boolean;
  todo: boolean;
  notes: boolean;
  goals: boolean;
  quote: boolean;
  music: boolean;
  stats: boolean;
  mixer: boolean;
  wellness: boolean;
}

export interface WorkspaceProfile {
  name: string;
  themeId: string;
  uiStyle?: "glass" | "glass-light" | "retro";
  accentColor?: string;
  bgUrl: string;
  blur: number;
  overlay: number;
  widgets: WidgetLayout;
  timerSettings: TimerSettings;
  soundVolumes: AmbientSounds;
  spotifyUrl: string;
  wellnessSettings?: WellnessSettings;
}

export interface FocusQuote {
  quote: string;
  author: string;
  tips: string[];
  sources?: { title: string; uri: string }[];
}

export interface FocusStats {
  totalTime: number; // minutes
  completedSessions: number;
  streak: number;
  history: FocusSession[];
}

export interface CustomCalendarEvent {
  id: string;
  dateStr: string; // "YYYY-MM-DD" Gregorian format
  title: string;
  category: "study" | "exam" | "personal" | "holiday" | "focus";
  time?: string;
  notes?: string;
}

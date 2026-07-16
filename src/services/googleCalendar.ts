import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/calendar.events");

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Try to restore from localStorage first
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem("gcal_access_token");
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        cachedAccessToken = localStorage.getItem("gcal_access_token");
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem("gcal_access_token");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google sign-in with popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google Auth");
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem("gcal_access_token", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Logout
export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem("gcal_access_token");
};

// Helper: Get exclusive next day string for all-day events
function getNextDayDateStr(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// Map mood string to Google Calendar color ID and beautiful text/emoji
export interface MoodInfo {
  label: string;
  emoji: string;
  colorId: string; // Google Calendar Event Colors: 1 (Lavender), 2 (Sage), 3 (Grape), 4 (Flamingo), 5 (Yellow), 7 (Peacock), 10 (Basil), 11 (Tomato)
}

export const MOODS_MAP: Record<string, MoodInfo> = {
  happy: { label: "سرحالم", emoji: "😃", colorId: "10" }, // Basil (Green)
  ok: { label: "اوکی‌ام", emoji: "😐", colorId: "7" },  // Peacock (Turquoise)
  tired: { label: "خستم", emoji: "😪", colorId: "5" }, // Banana (Yellow)
  sad: { label: "ناراحتم", emoji: "😔", colorId: "11" } // Tomato (Red)
};

/**
 * Syncs the selected mood and occasions of a day with Google Calendar.
 * First deletes existing app-created events on that day, then creates new ones.
 */
export const syncMoodAndOccasionsToGoogle = async (
  dateStrG: string,
  moodKey: string,
  occasions: string[]
): Promise<{ success: boolean; message?: string }> => {
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem("gcal_access_token");
  }
  if (!cachedAccessToken) {
    return { success: false, message: "توکن دسترسی معتبر یافت نشد. لطفاً ابتدا وارد شوید." };
  }

  try {
    const nextDayStr = getNextDayDateStr(dateStrG);
    
    // 1. Fetch events on that day to find and delete duplicates
    const timeMin = `${dateStrG}T00:00:00Z`;
    const timeMax = `${dateStrG}T23:59:59Z`;
    
    const listUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;
    
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${cachedAccessToken}` }
    });
    
    if (!listRes.ok) {
      const errText = await listRes.text();
      console.error("Failed to list events for cleanup:", errText);
      throw new Error("خطا در برقراری ارتباط با تقویم گوگل");
    }
    
    const listData = await listRes.json();
    const items = listData.items || [];
    
    // Find our specific events: starting with 'حس و حال من:' or 'مناسبت:'
    const eventsToDelete = items.filter((item: any) => {
      const summary = item.summary || "";
      return summary.startsWith("حس و حال من:") || summary.startsWith("مناسبت:");
    });
    
    // Delete duplicate events
    for (const ev of eventsToDelete) {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${ev.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${cachedAccessToken}` }
      });
    }

    // 2. Create the new Mood Event
    const moodInfo = MOODS_MAP[moodKey];
    if (moodInfo) {
      const moodEvent = {
        summary: `حس و حال من: ${moodInfo.label} ${moodInfo.emoji}`,
        description: `ثبت شده از طریق برنامه‌ریز هوشمند تحصیلی\n\nمناسبت‌های این روز:\n${occasions.map(o => `• ${o}`).join("\n")}`,
        start: { date: dateStrG },
        end: { date: nextDayStr },
        colorId: moodInfo.colorId
      };
      
      const createRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(moodEvent)
      });
      
      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("Failed to create mood event:", errText);
        throw new Error("خطا در ایجاد رویداد حس و حال");
      }
    }

    // 3. Create separate events for each Occasion
    for (const occasion of occasions) {
      const occasionEvent = {
        summary: `مناسبت: ${occasion}`,
        description: `ثبت خودکار مناسبت در تقویم توسط برنامه‌ریز هوشمند تحصیلی`,
        start: { date: dateStrG },
        end: { date: nextDayStr },
        colorId: "9" // Cobalt (Blue)
      };
      
      await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(occasionEvent)
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error syncing to Google Calendar:", err);
    return { success: false, message: err.message || "خطا در همگام‌سازی" };
  }
};

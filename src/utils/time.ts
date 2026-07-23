/**
 * Centralized Time Utility for Simulated / Manual Time Override
 * This utility allows the user to offset the system clock for testing or manually adjusting
 * study times, ensuring perfect synchronization across all components and widgets (Streak, Stats, Clock, etc.)
 */

export const getSystemTime = (): Date => {
  const isEnabled = localStorage.getItem("focus_time_override_enabled") === "true";
  if (!isEnabled) {
    return new Date();
  }
  const offsetStr = localStorage.getItem("focus_time_offset");
  const offset = offsetStr ? parseInt(offsetStr) : 0;
  return new Date(Date.now() + offset);
};

export const getLocalYYYYMMDD = (date: Date = getSystemTime()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getSessionLocalYYYYMMDD = (startTimeStr: string): string => {
  if (!startTimeStr) return "";
  try {
    const d = new Date(startTimeStr);
    if (isNaN(d.getTime())) {
      return startTimeStr.substring(0, 10);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    return startTimeStr.substring(0, 10);
  }
};

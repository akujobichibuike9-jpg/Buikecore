"use client";

export const LS_APP_KILL = "buikecore:kill_app";
export const LS_AI_KILL = "buikecore:kill_ai";

/**
 * Check if the current page is an admin route
 */
function isAdminRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/admin");
}

/**
 * Check if the app is "killed" — don't block /admin
 */
export function isAppKilled(): boolean {
  if (isAdminRoute()) return false; // Bypass the app kill for /admin route
  return readKillSwitch(LS_APP_KILL); // Check for app kill flag
}

/**
 * Check if the AI is killed (not bypassed for admin)
 */
export function isAiKilled(): boolean {
  return readKillSwitch(LS_AI_KILL); // AI kill logic remains the same for all routes
}

/**
 * Read the kill switch state
 */
export function readKillSwitch(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
}

/**
 * Write the kill switch state to localStorage
 */
export function writeKillSwitch(key: string, value: boolean) {
  if (typeof window === "undefined") return;

  // Set "1" to activate kill switch, otherwise remove it
  if (value) window.localStorage.setItem(key, "1");
  else window.localStorage.removeItem(key);

  // Trigger event for all tabs
  window.dispatchEvent(new Event("buikecore:killSwitch"));
}

/**
 * Emergency clear of both kill switches
 */
export function clearAllKillSwitches() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_APP_KILL);
  window.localStorage.removeItem(LS_AI_KILL);
  window.dispatchEvent(new Event("buikecore:killSwitch"));
}

/**
 * Subscribe to changes in the kill switches
 */
export function subscribeKillSwitch(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (!e.key) return;
    if (e.key === LS_APP_KILL || e.key === LS_AI_KILL) cb();
  };

  const onCustom = () => cb();

  window.addEventListener("storage", onStorage);
  window.addEventListener("buikecore:killSwitch", onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("buikecore:killSwitch", onCustom);
  };
}

/**
 * Fires a short vibration if the device supports it and the caller says it's
 * enabled. Doesn't know what a "settings" object looks like — the game reads
 * its own settings and passes the bool in.
 */
export function vibrate(enabled: boolean, ms = 12) {
  if (enabled && "vibrate" in navigator) navigator.vibrate(ms);
}

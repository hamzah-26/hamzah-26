/**
 * MangoDL Notification Sound Engine
 * Synthesizes a subtle, pleasant, professional agricultural alert chime
 * using the Web Audio API. Respects browser autoplay policies and user sound settings.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Check if notification sound is enabled in user preferences / localStorage.
 * Default is true.
 */
export function isNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem("mangodl_notification_sound");
    if (stored !== null) {
      return stored === "true";
    }
  } catch (e) {
    // LocalStorage unavailable
  }
  return true;
}

/**
 * Update notification sound preference in localStorage.
 */
export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mangodl_notification_sound", enabled ? "true" : "false");
  } catch (e) {
    // Ignore error
  }
}

/**
 * Plays a subtle, melodic 2-tone notification chime (D5 -> A5 with soft decay).
 */
export function playNotificationSound(): void {
  if (!isNotificationSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Browser autoplay policy handling
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    if (ctx.state !== "running") return;

    const now = ctx.currentTime;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now); // subtle volume
    masterGain.connect(ctx.destination);

    // Tone 1: 587.33 Hz (D5) - soft bell attack
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Tone 2: 880 Hz (A5) - uplifting harmonic chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.1);

    gain2.gain.setValueAtTime(0.001, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.45, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.66);
  } catch (err) {
    // Audio synthesis skipped silently if blocked by browser policy
    console.debug("[NotificationSound] Audio play note:", err);
  }
}

/**
 * Tracks seen articles in localStorage and triggers the chime ONLY for genuinely new, unseen articles.
 */
export function trackAndNotifyNewArticles(
  articleIds: string[],
  soundEnabled: boolean = true
): boolean {
  if (typeof window === "undefined" || !articleIds || articleIds.length === 0) {
    return false;
  }

  const STORAGE_KEY = "mangodl_seen_news_ids";
  try {
    const rawStored = localStorage.getItem(STORAGE_KEY);
    if (!rawStored) {
      // First initialization on this browser session: register existing IDs without playing chime
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articleIds));
      return false;
    }

    const seenIds: string[] = JSON.parse(rawStored);
    const seenSet = new Set(seenIds);

    // Detect genuinely new unseen articles
    const newArticles = articleIds.filter((id) => !seenSet.has(id));

    // Update the seen set
    const updatedSeen = Array.from(new Set([...seenIds, ...articleIds])).slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSeen));

    if (newArticles.length > 0 && soundEnabled) {
      playNotificationSound();
      return true;
    }
  } catch (e) {
    // Fallback gracefully
  }
  return false;
}

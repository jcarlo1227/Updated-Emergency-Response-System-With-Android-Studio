// Generated alert beep using the Web Audio API. No asset files required.

export type AlertPriority = 'normal' | 'high' | 'critical';

let ctx: AudioContext | null = null;
let emergencyLoop: ReturnType<typeof setInterval> | null = null;
let emergencyBlockedHandler: ((blocked: boolean) => void) | null = null;
const activeEmergencyAlerts = new Map<string, AlertPriority>();

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx && ctx.state !== 'closed') return ctx;
  const W = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = window.AudioContext ?? W.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

function tone(audio: AudioContext, freq: number, startAt: number, duration: number, gain = 0.18) {
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, audio.currentTime + startAt);
  g.gain.exponentialRampToValueAtTime(gain, audio.currentTime + startAt + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + startAt + duration);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(audio.currentTime + startAt);
  osc.stop(audio.currentTime + startAt + duration + 0.05);
}

async function getRunningContext(): Promise<AudioContext | null> {
  const audio = getContext();
  if (!audio) return null;
  if (audio.state === 'suspended') {
    try {
      await audio.resume();
    } catch {
      return null;
    }
  }
  return audio.state === 'running' ? audio : null;
}

function highestEmergencyPriority(): AlertPriority {
  if ([...activeEmergencyAlerts.values()].includes('critical')) return 'critical';
  if ([...activeEmergencyAlerts.values()].includes('high')) return 'high';
  return 'normal';
}

export async function playAlert(priority: AlertPriority): Promise<boolean> {
  const audio = await getRunningContext();
  if (!audio) return false;

  if (priority === 'critical') {
    tone(audio, 880, 0.0, 0.18, 0.22);
    tone(audio, 660, 0.22, 0.18, 0.22);
    tone(audio, 880, 0.44, 0.22, 0.22);
  } else if (priority === 'high') {
    tone(audio, 740, 0.0, 0.16, 0.18);
    tone(audio, 880, 0.18, 0.20, 0.18);
  } else {
    tone(audio, 660, 0.0, 0.14, 0.14);
  }
  return true;
}

function playEmergencyAlert() {
  if (activeEmergencyAlerts.size === 0) return;
  void playAlert(highestEmergencyPriority()).then((played) => {
    emergencyBlockedHandler?.(!played);
  });
}

export function startEmergencyAlert(id: string, priority: AlertPriority = 'critical'): void {
  activeEmergencyAlerts.set(id, priority);
  playEmergencyAlert();
  if (!emergencyLoop) {
    emergencyLoop = setInterval(playEmergencyAlert, 2000);
  }
}

export function stopEmergencyAlert(id?: string): void {
  if (id) {
    activeEmergencyAlerts.delete(id);
  } else {
    activeEmergencyAlerts.clear();
  }

  if (activeEmergencyAlerts.size === 0) {
    if (emergencyLoop) {
      clearInterval(emergencyLoop);
      emergencyLoop = null;
    }
    emergencyBlockedHandler?.(false);
  }
}

export function hasActiveEmergencyAlert(): boolean {
  return activeEmergencyAlerts.size > 0;
}

export function setEmergencyAlertBlockedHandler(
  handler: ((blocked: boolean) => void) | null,
): void {
  emergencyBlockedHandler = handler;
}

export async function retryEmergencyAlertAudio(): Promise<boolean> {
  if (activeEmergencyAlerts.size === 0) {
    emergencyBlockedHandler?.(false);
    return true;
  }
  const played = await playAlert(highestEmergencyPriority());
  emergencyBlockedHandler?.(!played);
  return played;
}

// Generated alert beep using the Web Audio API. No asset files required.
// Pattern: two short tones for high, three urgent tones for critical.

let ctx: AudioContext | null = null;

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

export function playAlert(priority: 'normal' | 'high' | 'critical'): void {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === 'suspended') {
    void audio.resume().catch(() => {});
  }

  if (priority === 'critical') {
    // Three rapid urgent beeps, descending–ascending pattern
    tone(audio, 880, 0.0, 0.18, 0.22);
    tone(audio, 660, 0.22, 0.18, 0.22);
    tone(audio, 880, 0.44, 0.22, 0.22);
  } else if (priority === 'high') {
    // Two pleasant tones
    tone(audio, 740, 0.0, 0.16, 0.18);
    tone(audio, 880, 0.18, 0.20, 0.18);
  } else {
    tone(audio, 660, 0.0, 0.14, 0.14);
  }
}

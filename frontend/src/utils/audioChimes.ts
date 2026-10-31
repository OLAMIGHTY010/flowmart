// Web Audio API Milestone Chimes for FlowMart Orders
// Pure browser-synthesized audio: zero external assets, instant playback, zero network latency.

class SoundSynth {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Play a sequence of harmonic pure tones with smooth attack/decay
  playNotes(frequencies: { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number }[]) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      frequencies.forEach(({ freq, start, duration, type = 'sine', gain = 0.15 }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + start);

        // Smooth envelope: quick fade-in, exponential decay
        gainNode.gain.setValueAtTime(0.001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch (err) {
      console.warn('Audio chime playback omitted or blocked:', err);
    }
  }

  // 1. Order Placed: Ascending bright chime (C5 -> E5 -> G5)
  orderPlaced() {
    this.playNotes([
      { freq: 523.25, start: 0, duration: 0.18, type: 'sine', gain: 0.16 },
      { freq: 659.25, start: 0.12, duration: 0.22, type: 'sine', gain: 0.18 },
      { freq: 783.99, start: 0.24, duration: 0.45, type: 'sine', gain: 0.2 },
    ]);
  }

  // 2. Rider Assigned / On the Way: Crisp double-ping
  riderAssigned() {
    this.playNotes([
      { freq: 880.0, start: 0, duration: 0.14, type: 'triangle', gain: 0.18 },
      { freq: 1174.66, start: 0.12, duration: 0.35, type: 'sine', gain: 0.22 },
    ]);
  }

  // 3. Rider Arrived: Classic warm 2-tone doorbell (High -> Low)
  riderArrived() {
    this.playNotes([
      { freq: 659.25, start: 0, duration: 0.35, type: 'sine', gain: 0.22 },
      { freq: 523.25, start: 0.28, duration: 0.6, type: 'sine', gain: 0.24 },
    ]);
  }

  // 5. Voice Concierge Mic Activated: Crisp high-tech sonar beep (880Hz -> 1320Hz)
  voiceListeningStarted() {
    this.playNotes([
      { freq: 880.0, start: 0, duration: 0.08, type: 'sine', gain: 0.12 },
      { freq: 1320.0, start: 0.06, duration: 0.15, type: 'sine', gain: 0.15 },
    ]);
  }

  // 6. Voice Order Parsed & Assembled: Sparkling confirmation melody (D5 -> F#5 -> A5 -> D6)
  voiceOrderSuccess() {
    this.playNotes([
      { freq: 587.33, start: 0, duration: 0.12, type: 'sine', gain: 0.14 },
      { freq: 739.99, start: 0.08, duration: 0.14, type: 'sine', gain: 0.16 },
      { freq: 880.0, start: 0.16, duration: 0.16, type: 'sine', gain: 0.18 },
      { freq: 1174.66, start: 0.24, duration: 0.45, type: 'triangle', gain: 0.22 },
    ]);
  }

  // 4. Delivered / Success: Celebratory harmonic fanfare
  orderDelivered() {
    this.playNotes([
      { freq: 523.25, start: 0, duration: 0.15, type: 'sine', gain: 0.15 },
      { freq: 659.25, start: 0.1, duration: 0.15, type: 'sine', gain: 0.18 },
      { freq: 783.99, start: 0.2, duration: 0.18, type: 'sine', gain: 0.2 },
      { freq: 1046.5, start: 0.32, duration: 0.7, type: 'triangle', gain: 0.25 },
    ]);
  }
}

export const audioChimes = new SoundSynth();

// Tiny WebAudio bleeps for Solmara Skies.
// No audio files: every sound is a short oscillator phrase built at
// run time, started only after the player has pressed a key or clicked,
// so the game stays silent until it is played.

export class SoundBank {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  unlock() {
    if (!this.context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.context = new AudioContext();
      } catch {
        this.context = null;
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  tone(frequency, duration, type, volume, slideTo) {
    if (!this.enabled || !this.context) return;
    try {
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    } catch {
      // Sound is garnish; a failed beep must never break the flight.
    }
  }

  ring() {
    this.tone(880, 0.16, 'sine', 0.16, 1320);
    setTimeout(() => this.tone(1320, 0.2, 'sine', 0.12, 1760), 70);
  }

  star() {
    this.tone(1174, 0.12, 'triangle', 0.14, 1568);
  }

  thud() {
    this.tone(140, 0.3, 'sawtooth', 0.2, 55);
  }

  win() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      setTimeout(() => this.tone(freq, 0.28, 'triangle', 0.15), index * 110);
    });
  }

  lose() {
    [392, 330, 262, 196].forEach((freq, index) => {
      setTimeout(() => this.tone(freq, 0.3, 'triangle', 0.13), index * 130);
    });
  }
}

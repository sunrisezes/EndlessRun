export class AudioManager {
  private static instance: AudioManager | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private masterVol: number = 0.8;
  private bgmVol: number = 0.6;
  private sfxVol: number = 0.8;

  private isMuted: boolean = false;
  private bgmIntervalId: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    this.initAudioContext();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initAudioContext(): void {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioCtx) {
      this.ctx = new AudioCtx();

      // Master -> Destination
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // BGM -> Master
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // SFX -> Master
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('click', unlock);
  }

  private ensureUnlocked(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Volume Control API ---

  public setMasterVolume(vol: number): void {
    this.masterVol = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
  }

  public getMasterVolume(): number {
    return this.masterVol;
  }

  public setBgmVolume(vol: number): void {
    this.bgmVol = Math.max(0, Math.min(1, vol));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
    }
  }

  public getBgmVolume(): number {
    return this.bgmVol;
  }

  public setSfxVolume(vol: number): void {
    this.sfxVol = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVol;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Sound Effects ---

  public playCoin(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ensureUnlocked();

    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.12);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1975.5, now + 0.06);
    gain2.gain.setValueAtTime(0.25, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.2);
  }

  public playJump(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ensureUnlocked();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSlide(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ensureUnlocked();

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
  }

  public playCrash(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ensureUnlocked();

    const now = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.45);
  }

  public playPowerup(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.ensureUnlocked();

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const startTime = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // --- Smooth Catchy Lo-Fi / Synthwave BGM Track ---

  public playBGM(): void {
    if (this.bgmIntervalId !== null) return;
    if (!this.ctx || !this.bgmGain) return;
    this.ensureUnlocked();

    // 4-Bar Soothing Chord Progression (Cmaj7 -> Am7 -> Fmaj7 -> G7)
    const chords = [
      { bass: 130.81, pad: [261.63, 329.63, 392.0, 493.88] }, // Cmaj7 (C3, C4, E4, G4, B4)
      { bass: 110.0, pad: [220.0, 261.63, 329.63, 392.0] }, // Am7 (A2, A3, C4, E4, G4)
      { bass: 87.31, pad: [174.61, 220.0, 261.63, 329.63] }, // Fmaj7 (F2, F3, A3, C4, E4)
      { bass: 98.0, pad: [196.0, 246.94, 293.66, 349.23] }, // G7 (G2, G3, B3, D4, F4)
    ];

    // Soft catchy 16-step melody pattern
    const melody: (number | null)[] = [
      523.25, null, 659.25, 783.99, // C5, -, E5, G5
      659.25, 587.33, 523.25, null, // E5, D5, C5, -
      440.0, 523.25, 659.25, 587.33, // A4, C5, E5, D5
      523.25, 493.88, 523.25, null, // C5, B4, C5, -
    ];

    const stepMs = 240; // ~125 BPM quarter step
    this.bgmStep = 0;

    this.bgmIntervalId = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.bgmGain) return;

      const now = this.ctx.currentTime;
      const stepIndex = this.bgmStep % 16;
      const chordIndex = Math.floor(stepIndex / 4);

      // Play soft pad chord on every 4th step (start of bar)
      if (stepIndex % 4 === 0) {
        const chord = chords[chordIndex];

        // Soft sine bass
        const bassOsc = this.ctx.createOscillator();
        const bassGainNode = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(chord.bass, now);

        bassGainNode.gain.setValueAtTime(0.001, now);
        bassGainNode.gain.linearRampToValueAtTime(0.06, now + 0.1);
        bassGainNode.gain.exponentialRampToValueAtTime(0.0001, now + (stepMs * 4) / 1000);

        bassOsc.connect(bassGainNode);
        bassGainNode.connect(this.bgmGain);
        bassOsc.start(now);
        bassOsc.stop(now + (stepMs * 4) / 1000);

        // Lush harmony pad
        chord.pad.forEach((freq) => {
          if (!this.ctx || !this.bgmGain) return;
          const padOsc = this.ctx.createOscillator();
          const padGainNode = this.ctx.createGain();

          padOsc.type = 'sine';
          padOsc.frequency.setValueAtTime(freq, now);

          padGainNode.gain.setValueAtTime(0.001, now);
          padGainNode.gain.linearRampToValueAtTime(0.025, now + 0.2);
          padGainNode.gain.exponentialRampToValueAtTime(0.0001, now + (stepMs * 4) / 1000);

          padOsc.connect(padGainNode);
          padGainNode.connect(this.bgmGain);
          padOsc.start(now);
          padOsc.stop(now + (stepMs * 4) / 1000);
        });
      }

      // Play catchy soft lead note if present
      const noteFreq = melody[stepIndex];
      if (noteFreq) {
        const leadOsc = this.ctx.createOscillator();
        const leadGainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(noteFreq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);

        leadGainNode.gain.setValueAtTime(0.001, now);
        leadGainNode.gain.linearRampToValueAtTime(0.035, now + 0.03);
        leadGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        leadOsc.connect(filter);
        filter.connect(leadGainNode);
        leadGainNode.connect(this.bgmGain);

        leadOsc.start(now);
        leadOsc.stop(now + 0.4);
      }

      this.bgmStep++;
    }, stepMs);
  }

  public stopBGM(): void {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

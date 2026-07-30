import { Howl, Howler } from 'howler';

export class AudioManager {
  private static instance: AudioManager | null = null;

  public bgm: Howl | null = null;
  public sfxCoin: Howl | null = null;
  public sfxJump: Howl | null = null;
  public sfxSlide: Howl | null = null;
  public sfxCrash: Howl | null = null;
  public sfxPowerup: Howl | null = null;

  private isMuted: boolean = false;
  private isAudioUnlocked: boolean = false;

  constructor() {
    this.initSynthesizedAudio();
    this.initAudioUnlockListeners();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Generates procedural Web Audio sound buffers converted to Howl instances
   * ensuring zero network latency and 100% reliable audio triggers.
   */
  private initSynthesizedAudio(): void {
    try {
      this.sfxCoin = this.createSynthesizedHowl(44100 * 0.15, (i, sampleRate) => {
        // High pitched arpeggio chime (880Hz to 1760Hz)
        const t = i / sampleRate;
        const freq = t < 0.07 ? 880 : 1320;
        return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 15);
      });

      this.sfxJump = this.createSynthesizedHowl(44100 * 0.25, (i, sampleRate) => {
        // Upward pitch sweep (200Hz to 600Hz)
        const t = i / sampleRate;
        const freq = 200 + t * 1600;
        return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6);
      });

      this.sfxSlide = this.createSynthesizedHowl(44100 * 0.3, (i, sampleRate) => {
        // Downward noise friction woosh
        const t = i / sampleRate;
        const noise = (Math.random() - 0.5) * 0.8;
        return noise * Math.exp(-t * 8);
      });

      this.sfxCrash = this.createSynthesizedHowl(44100 * 0.5, (i, sampleRate) => {
        // Heavy low boom explosion noise
        const t = i / sampleRate;
        const noise = (Math.random() - 0.5) * 1.5;
        const sub = Math.sin(2 * Math.PI * 65 * t) * 0.8;
        return (noise + sub) * Math.exp(-t * 5);
      });

      this.sfxPowerup = this.createSynthesizedHowl(44100 * 0.4, (i, sampleRate) => {
        // Ascending chord powerup sound
        const t = i / sampleRate;
        const freq = 440 * (1 + Math.floor(t * 12) * 0.25);
        return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 4);
      });

      // BGM Synthwave Groove Loop
      this.bgm = this.createSynthesizedHowl(44100 * 2.0, (i, sampleRate) => {
        const t = i / sampleRate;
        // Synth bassline + pulse rhythm
        const bassFreq = (Math.floor(t * 4) % 2 === 0) ? 110 : 82.4;
        const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.4;
        const hat = (Math.floor(t * 8) % 2 === 1) ? (Math.random() - 0.5) * 0.15 : 0;
        return (bass + hat) * 0.4;
      }, true);

    } catch (e) {
      console.warn('Audio synthesis initialization fallback warning:', e);
    }
  }

  private createSynthesizedHowl(
    lengthSamples: number,
    generateSample: (i: number, sampleRate: number) => number,
    loop: boolean = false
  ): Howl {
    const sampleRate = 44100;
    const buffer = new Float32Array(lengthSamples);
    for (let i = 0; i < lengthSamples; i++) {
      buffer[i] = generateSample(i, sampleRate);
    }

    // Convert Float32Array into WAV Data URI
    const dataUri = this.encodeWAV(buffer, sampleRate);

    return new Howl({
      src: [dataUri],
      format: ['wav'],
      loop,
      volume: 0.5,
    });
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): string {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    this.writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF format */
    this.writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    this.writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw PCM) */
    view.setUint16(20, 1, true);
    /* channel count (1 = mono) */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate */
    view.setUint32(28, sampleRate * 2, true);
    /* block align */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    this.writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private initAudioUnlockListeners(): void {
    const unlock = () => {
      if (this.isAudioUnlocked) return;
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      this.isAudioUnlocked = true;
      if (this.bgm && !this.bgm.playing() && !this.isMuted) {
        this.bgm.play();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  public playCoin(): void {
    if (!this.isMuted && this.sfxCoin) this.sfxCoin.play();
  }

  public playJump(): void {
    if (!this.isMuted && this.sfxJump) this.sfxJump.play();
  }

  public playSlide(): void {
    if (!this.isMuted && this.sfxSlide) this.sfxSlide.play();
  }

  public playCrash(): void {
    if (!this.isMuted && this.sfxCrash) this.sfxCrash.play();
  }

  public playPowerup(): void {
    if (!this.isMuted && this.sfxPowerup) this.sfxPowerup.play();
  }

  public playBGM(): void {
    if (!this.isMuted && this.bgm && !this.bgm.playing()) {
      this.bgm.play();
    }
  }

  public stopBGM(): void {
    if (this.bgm) this.bgm.stop();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    Howler.mute(this.isMuted);
    return this.isMuted;
  }
}

/**
 * Procedural WebAudio SFX & Ambient Sound Engine
 * Generates all sound effects, mechanical feedback, and atmospheric drones
 * dynamically via Web Audio API oscillators, noise buffers, and filters.
 * 100% original, zero external audio assets, works instantly in browser.
 */

function readSetting(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeSetting(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // blocked storage: the setting lasts until the page closes
  }
}

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1);

export class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted = false;
  private isInitialized = false;
  private isAmbientPlaying = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientTickTimer: number | null = null;
  /** Effects volume 0..1 (settings) and the background hum 0..1 (0 = off). */
  private volume = 1;
  private ambientVolume = 1;
  private listeners = new Set<() => void>();

  private constructor() {
    // saved preferences (storage may be blocked: then the defaults stay)
    this.isMuted = readSetting('brassreel_muted') === 'true';
    this.volume = clamp01(Number(readSetting('brassreel_volume') ?? 1));
    this.ambientVolume = clamp01(Number(readSetting('brassreel_ambient') ?? 1));
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * Initializes AudioContext upon user gesture.
   */
  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterLevel(), this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientLevel(), this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch {
      // Audio not supported or blocked
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    writeSetting('brassreel_muted', String(muted));
    this.applyLevels();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /** Effects volume, 0..1. */
  public getVolume(): number {
    return this.volume;
  }

  public setVolume(v: number): void {
    this.volume = clamp01(v);
    writeSetting('brassreel_volume', String(this.volume));
    this.applyLevels();
  }

  /** Background factory hum, 0..1 (0 = off). */
  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public setAmbientVolume(v: number): void {
    this.ambientVolume = clamp01(v);
    writeSetting('brassreel_ambient', String(this.ambientVolume));
    this.applyLevels();
  }

  /** Called after any sound setting changes (the HUD speaker icon follows the settings window). */
  public onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private masterLevel(): number {
    return this.isMuted ? 0 : 0.4 * this.volume;
  }

  private ambientLevel(): number {
    return 0.15 * this.ambientVolume;
  }

  private applyLevels(): void {
    if (this.masterGain && this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterLevel(), now);
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(this.ambientLevel(), now);
    }
    this.listeners.forEach((fn) => fn());
  }

  // ==========================================
  // SFX GENERATORS
  // ==========================================

  /**
   * Mechanical gear ratchet tick for slot reel spinning
   */
  public playReelTick(pitchMult = 1.0): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 * pitchMult, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  /**
   * Heavy mechanical clunk-bounce on reel stop
   */
  public playReelStop(reelIndex = 0): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const baseFreq = 160 - reelIndex * 15;

    // Body punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    // Mechanical click transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(800, now);
    click.frequency.exponentialRampToValueAtTime(120, now + 0.04);
    clickGain.gain.setValueAtTime(0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    click.connect(clickGain);
    clickGain.connect(this.masterGain);

    osc.start(now);
    click.start(now);
    osc.stop(now + 0.16);
    click.stop(now + 0.045);
  }

  /**
   * Payline hit chime (pentatonic scale notes)
   */
  public playPaylineWin(linesCount = 1): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const notes = [523.25, 659.25, 783.99, 880.0, 1046.5]; // C5, E5, G5, A5, C6
    const count = Math.min(5, Math.max(1, linesCount));

    for (let i = 0; i < count; i++) {
      const now = this.ctx.currentTime + i * 0.08;
      const freq = notes[i % notes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.36);
    }
  }

  /**
   * 3-Crown JACKPOT fanfare
   */
  public playJackpot(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const chords = [
      [523.25, 659.25, 783.99], // C major
      [587.33, 739.99, 880.0],  // D major
      [659.25, 830.61, 987.77], // E major
      [783.99, 987.77, 1174.66] // G major triumphant
    ];

    chords.forEach((chord, step) => {
      const stepTime = this.ctx!.currentTime + step * 0.16;
      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.25, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(stepTime);
        osc.stop(stepTime + 0.32);
      });
    });
  }

  /**
   * Steam release hiss for Emergency Valve or Overheat Jam
   */
  public playValveHiss(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const duration = 0.8;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + duration);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  /**
   * Smelt Crucible anvil strike & furnace flame
   */
  public playSmelt(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Metallic anvil ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // A6
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Unit faction specific attack sound
   */
  public playAttack(faction: string): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;

    switch (faction) {
      case 'cog': {
        // Heavy blade slash
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'spring': {
        // High tension bowstring release
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'fuse': {
        // Cannon blast / detonation
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.21);
        break;
      }
      case 'coil': {
        // Tesla spark zap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.setValueAtTime(800, now + 0.02);
        osc.frequency.setValueAtTime(1800, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.09);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
    }
  }

  /**
   * Enemy destruction crunch
   */
  public playEnemyDeath(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Industrial Boss Warning Klaxon Siren
   */
  public playBossAlarm(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.15);
    osc.frequency.setValueAtTime(440, now + 0.3);
    osc.frequency.setValueAtTime(330, now + 0.45);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  /**
   * UI tactile button click
   */
  public playButtonClick(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * Ambient steampunk drone generator (low 55Hz boiler hum + rhythmic subtle clock tick)
   */
  public startAmbientHum(): void {
    if (this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;
    this.resume();

    try {
      this.ambientOsc = this.ctx.createOscillator();
      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // 55Hz low A hum

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.ambientOsc.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientOsc.start();
      this.isAmbientPlaying = true;
    } catch {
      // Audio node error safeguard
    }
  }

  public stopAmbientHum(): void {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch {
        // Ignored
      }
      this.ambientOsc = null;
    }
    if (this.ambientTickTimer !== null) {
      clearInterval(this.ambientTickTimer);
      this.ambientTickTimer = null;
    }
    this.isAmbientPlaying = false;
  }
}


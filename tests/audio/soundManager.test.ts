import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundManager } from '../../src/audio/SoundManager';

describe('SoundManager Procedural WebAudio Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('instantiates as a singleton', () => {
    const s1 = SoundManager.getInstance();
    const s2 = SoundManager.getInstance();
    expect(s1).toBe(s2);
  });

  it('safely handles mute toggle and state persistence', () => {
    const sm = SoundManager.getInstance();
    const initial = sm.getMuted();
    const toggled = sm.toggleMute();
    expect(toggled).toBe(!initial);
    expect(sm.getMuted()).toBe(toggled);
    // Toggle back
    sm.toggleMute();
  });

  it('safely invokes SFX methods in headless / node environment without throwing', () => {
    const sm = SoundManager.getInstance();
    expect(() => {
      sm.init();
      sm.resume();
      sm.playReelTick(1.0);
      sm.playReelStop(0);
      sm.playPaylineWin(3);
      sm.playJackpot();
      sm.playValveHiss();
      sm.playSmelt();
      sm.playAttack('cog');
      sm.playAttack('spring');
      sm.playAttack('fuse');
      sm.playAttack('coil');
      sm.playEnemyDeath();
      sm.playBossAlarm();
      sm.playButtonClick();
      sm.startAmbientHum();
      sm.stopAmbientHum();
    }).not.toThrow();
  });
});


describe('SoundManager volume settings', () => {
  it('keeps volumes within 0..1 and tells listeners', () => {
    const sm = SoundManager.getInstance();
    let calls = 0;
    const off = sm.onChange(() => calls++);
    sm.setVolume(1.7);
    expect(sm.getVolume()).toBe(1);
    sm.setVolume(-0.2);
    expect(sm.getVolume()).toBe(0);
    sm.setAmbientVolume(0.3);
    expect(sm.getAmbientVolume()).toBeCloseTo(0.3);
    sm.setMuted(true);
    expect(sm.getMuted()).toBe(true);
    sm.setMuted(false);
    expect(calls).toBe(5);
    off();
    sm.setVolume(1);
    expect(calls).toBe(5);
    sm.setAmbientVolume(1);
  });
});

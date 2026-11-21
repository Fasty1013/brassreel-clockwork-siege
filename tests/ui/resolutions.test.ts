import { describe, expect, it } from 'vitest';
import { pickResolution, RESOLUTIONS } from '../../src/ui/resolutions';

describe('auto resolution', () => {
  it('matches the real pixels of the game area', () => {
    // Mi 13 Lite: 2400×1080 screen, 411 CSS px × 2.625 = 1079 px tall
    expect(pickResolution(1079).id).toBe('1920x1080');
    // 1600×720 phone, 1366×768 laptop, 1440p monitor, 4K monitor
    expect(pickResolution(720).id).toBe('1280x720');
    expect(pickResolution(768).id).toBe('1280x720');
    expect(pickResolution(1440).id).toBe('2560x1440');
    expect(pickResolution(2160).id).toBe('2560x1440');
  });

  it('never goes below the smallest preset', () => {
    expect(pickResolution(300)).toBe(RESOLUTIONS[0]);
  });

  it('presets are 16:9 and ordered by size', () => {
    RESOLUTIONS.forEach((r, i) => {
      expect(r.w * 9).toBe(r.h * 16);
      expect(r.id).toBe(`${r.w}x${r.h}`);
      if (i > 0) expect(r.h).toBeGreaterThan(RESOLUTIONS[i - 1].h);
    });
  });
});

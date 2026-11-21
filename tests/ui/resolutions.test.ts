import { describe, expect, it } from 'vitest';
import { canvasSize, pickResolution, RESOLUTIONS, worldWidthFor } from '../../src/ui/resolutions';

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

describe('world width', () => {
  it('follows the screen between 16:9 and 21:9', () => {
    expect(worldWidthFor(1920, 1080)).toBe(1920);
    // Mi 13 Lite in the app: 2400×1080 minus a 105 px cut-out → 2295×1080 → ~2296
    expect(worldWidthFor(874, 411)).toBe(2296);
    // the same phone in a browser without the cut-out padding: 20:9
    expect(worldWidthFor(915, 412)).toBe(2400);
    // ultrawide stops at 2560; 4:3 tablets keep 1920 (bars above and below)
    expect(worldWidthFor(3440, 1440)).toBe(2560);
    expect(worldWidthFor(1024, 768)).toBe(1920);
  });

  it('is a multiple of 8 so the ×4 battlefield stays pixel-exact on both sides', () => {
    for (let w = 900; w < 3000; w += 37) expect(worldWidthFor(w, 412) % 8).toBe(0);
  });

  it('gives the canvas the world shape at the preset height', () => {
    const p1080 = RESOLUTIONS.find((r) => r.h === 1080)!;
    expect(canvasSize(p1080, 1920)).toEqual({ w: 1920, h: 1080 });
    expect(canvasSize(p1080, 2400)).toEqual({ w: 2400, h: 1080 });
  });

  it('rejects broken sizes', () => {
    expect(worldWidthFor(0, 0)).toBe(1920);
  });
});

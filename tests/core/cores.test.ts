import { describe, it, expect } from 'vitest';
import { CoreEngine } from '@core/cores/coreEngine';

describe('Engine Cores & Synergy Tags Suite', () => {
  it('equips up to 3 cores and rejects duplicates or exceeding capacity', () => {
    const engine = new CoreEngine();
    expect(engine.equipCore('core_mirror_piston')).toBe(true);
    expect(engine.equipCore('core_lucky_cam')).toBe(true);
    expect(engine.equipCore('core_recycler')).toBe(true);

    // 4th core should be rejected
    expect(engine.equipCore('core_pressure_valve')).toBe(false);
    // Duplicate core should be rejected
    expect(engine.equipCore('core_mirror_piston')).toBe(false);
  });

  it('detects Tag Resonances when 2+ cores share a tag', () => {
    // core_mirror_piston: tags: ['reel', 'combo']
    // core_lucky_cam: tags: ['reel', 'wild']
    const engine = new CoreEngine(['core_mirror_piston', 'core_lucky_cam']);

    const resonances = engine.getActiveTagResonances();
    expect(resonances).toContain('reel');
    expect(engine.hasTagResonance('reel')).toBe(true);
    expect(engine.hasTagResonance('wild')).toBe(false);
  });

  it('correctly reads rule modifiers and numeric parameters', () => {
    const engine = new CoreEngine(['core_mirror_piston']);
    expect(engine.hasModifier('mirror_horizontal_lines')).toBe(true);
    expect(engine.getModifierParam('mirror_horizontal_lines', 'multiplier')).toBe(2);
    expect(engine.hasModifier('boost_center_crown')).toBe(false);
  });
});


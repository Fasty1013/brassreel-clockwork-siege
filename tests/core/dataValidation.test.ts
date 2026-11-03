import { describe, it, expect } from 'vitest';
import { UnitSchema } from '@data/schemas/unitSchema';
import { ModSchema } from '@data/schemas/modSchema';
import { EngineCoreSchema } from '@data/schemas/coreSchema';
import { GadgetSchema } from '@data/schemas/gadgetSchema';
import { EnemySchema } from '@data/schemas/enemySchema';
import { WaveDefinitionSchema } from '@data/schemas/waveSchema';
import { UNITS_DATA } from '@data/units';
import { MODS_DATA } from '@data/mods';
import { CORES_DATA } from '@data/cores';
import { GADGETS_DATA } from '@data/gadgets';
import { ENEMIES_DATA } from '@data/enemies';
import { WAVES_DATA } from '@data/waves';
import { QUIRKS_DATA } from '@data/quirks';
import { t, setLocale } from '@data/i18n';

describe('Data Catalog Validation Suite', () => {
  it('validates all 32 unit definitions against UnitSchema', () => {
    const units = Object.values(UNITS_DATA);
    expect(units.length).toBe(32); // 28 faction + 1 scrap + 3 legendary

    for (const unit of units) {
      const res = UnitSchema.safeParse(unit);
      if (!res.success) {
        console.error('Unit validation failed for:', unit.id, res.error);
      }
      expect(res.success).toBe(true);
    }
  });

  it('validates all 40 mod definitions against ModSchema', () => {
    const mods = Object.values(MODS_DATA);
    expect(mods.length).toBe(40);

    for (const mod of mods) {
      const res = ModSchema.safeParse(mod);
      if (!res.success) {
        console.error('Mod validation failed for:', mod.id, res.error);
      }
      expect(res.success).toBe(true);
    }
  });

  it('validates all 20 engine core definitions against EngineCoreSchema', () => {
    const cores = Object.values(CORES_DATA);
    expect(cores.length).toBe(20);

    for (const core of cores) {
      const res = EngineCoreSchema.safeParse(core);
      if (!res.success) {
        console.error('Core validation failed for:', core.id, res.error);
      }
      expect(res.success).toBe(true);
    }
  });

  it('validates all 30 gadget definitions against GadgetSchema', () => {
    const gadgets = Object.values(GADGETS_DATA);
    expect(gadgets.length).toBe(30);

    for (const gadget of gadgets) {
      const res = GadgetSchema.safeParse(gadget);
      if (!res.success) {
        console.error('Gadget validation failed for:', gadget.id, res.error);
      }
      expect(res.success).toBe(true);
    }
  });

  it('validates all 23 enemy definitions against EnemySchema', () => {
    const enemies = Object.values(ENEMIES_DATA);
    expect(enemies.length).toBe(23); // Act 1 (12 + 1 boss) + Act 2 (4 + 1 boss) + Act 3 (4 + 1 boss)

    for (const enemy of enemies) {
      const res = EnemySchema.safeParse(enemy);
      if (!res.success) {
        console.error('Enemy validation failed for:', enemy.id, res.error);
      }
      expect(res.success).toBe(true);
    }
  });

  it('validates all 30 wave definitions against WaveDefinitionSchema', () => {
    expect(WAVES_DATA.length).toBe(30); // 3 Acts x 10 waves

    for (const wave of WAVES_DATA) {
      const res = WaveDefinitionSchema.safeParse(wave);
      if (!res.success) {
        console.error('Wave validation failed for wave:', wave.waveNumber, res.error);
      }
      expect(res.success).toBe(true);
    }
  });

  it('checks i18n lookup and interpolation in both EN and RU', () => {
    setLocale('en');
    expect(t('ui.wave', { current: 3, total: 10 })).toBe('Wave 3 / 10');
    expect(t('unit.cog_knight.name')).toBe('Cog Knight');

    setLocale('ru');
    expect(t('ui.wave', { current: 3, total: 10 })).toBe('Волна 3 / 10');
    expect(t('unit.cog_knight.name')).toBe('Рыцарь Шестерни');
  });

  it('verifies 100% key parity between EN and RU dictionaries', async () => {
    const enDict = (await import('@data/i18n/en.json')).default;
    const ruDict = (await import('@data/i18n/ru.json')).default;

    function flattenKeys(obj: any, prefix = ''): string[] {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          keys = keys.concat(flattenKeys(v, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const enKeys = new Set(flattenKeys(enDict));
    const ruKeys = new Set(flattenKeys(ruDict));

    const missingInRu = [...enKeys].filter((k) => !ruKeys.has(k));
    const missingInEn = [...ruKeys].filter((k) => !enKeys.has(k));

    if (missingInRu.length > 0) {
      console.warn('Keys missing in RU:', missingInRu);
    }
    if (missingInEn.length > 0) {
      console.warn('Keys missing in EN:', missingInEn);
    }

    expect(missingInRu).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it('verifies all content definitions reference valid translation keys', () => {
    for (const unit of Object.values(UNITS_DATA)) {
      expect(t(unit.nameKey)).not.toContain('[MISSING');
      expect(t(unit.descKey)).not.toContain('[MISSING');
    }

    for (const quirk of Object.values(QUIRKS_DATA)) {
      expect(t(quirk.nameKey)).not.toContain('[MISSING');
      expect(t(quirk.descKey)).not.toContain('[MISSING');
    }

    for (const mod of Object.values(MODS_DATA)) {
      expect(t(mod.nameKey)).not.toContain('[MISSING');
      expect(t(mod.descKey)).not.toContain('[MISSING');
    }

    for (const core of Object.values(CORES_DATA)) {
      expect(t(core.nameKey)).not.toContain('[MISSING');
      expect(t(core.descKey)).not.toContain('[MISSING');
    }

    for (const gadget of Object.values(GADGETS_DATA)) {
      expect(t(gadget.nameKey)).not.toContain('[MISSING');
      expect(t(gadget.descKey)).not.toContain('[MISSING');
    }

    for (const enemy of Object.values(ENEMIES_DATA)) {
      expect(t(enemy.nameKey)).not.toContain('[MISSING');
      expect(t(enemy.descKey)).not.toContain('[MISSING');
    }

    for (const wave of WAVES_DATA) {
      expect(t(wave.titleKey)).not.toContain('[MISSING');
    }
  });
});


# BRASSREEL: Clockwork Siege — Content Authoring Guide

Version: 1.0.0 (Milestone M0)  
Owner: Content Dev  

---

## 1. Principles of Data-Driven Content

All gameplay entities in BRASSREEL are declared in `/src/data/` as static data catalogs validated by **Zod schemas** in `/src/data/schemas/`.

1. **No Logic in Data**: Data files contain pure JSON-compatible structures (numbers, strings, booleans, enums). No functions or class instances.
2. **Keyed Identifiers**: Every entity must have a globally unique snake_case ID prefixed by category:
   - Units: `unit_<faction>_<name>` (e.g. `unit_cog_knight`, `unit_spring_sharpshooter`)
   - Mods: `mod_<name>` (e.g. `mod_iron_gears`)
   - Cores: `core_<name>` (e.g. `core_mirror_piston`)
   - Gadgets: `gadget_<name>` (e.g. `gadget_brass_knuckles`)
   - Enemies: `en_<name>` (e.g. `en_scrapper`, `boss_steam_baron`)
3. **Mandatory Dual-Language Strings**: Text is never declared directly in data records. Data objects reference an i18n key root (e.g., `unit.cog_knight.name`), which must exist in both:
   - `/src/data/i18n/en.json`
   - `/src/data/i18n/ru.json`

---

## 2. Content Entity Schemas

### 2.1 Units
```typescript
interface UnitDefinition {
  id: string;
  faction: 'cog' | 'spring' | 'fuse' | 'coil' | 'scrap' | 'legendary';
  tier: 0 | 1 | 2 | 3;
  baseHp: number;
  baseDamage: number;
  attackSpeed: number; // Attacks per second
  attackRange: number; // Grid tiles (1 = Melee, 2-6 = Ranged)
  armor: number;
  moveSpeed: number; // Tiles per second
  quirkId: string;
  evolutionBranchA?: string; // Unit ID for Branch A (if Tier 1 or 2)
  evolutionBranchB?: string; // Unit ID for Branch B (if Tier 1 or 2)
  spriteKey: string;
}
```

### 2.2 Rolled Mods
```typescript
interface ModDefinition {
  id: string;
  rarity: 'common' | 'rare' | 'epic';
  statModifiers: {
    damagePct?: number;
    hpPct?: number;
    attackSpeedPct?: number;
    critChancePct?: number;
    critDamagePct?: number;
    flatArmor?: number;
    rangeTiles?: number;
    knockbackTiles?: number;
    lifestealPct?: number;
  };
  triggerEffect?: 'burn' | 'shock' | 'stun' | 'cleave' | 'reflect' | 'ricochet';
  triggerParam?: number;
}
```

### 2.3 Engine Cores
```typescript
interface EngineCoreDefinition {
  id: string;
  tags: Array<'reel' | 'heat' | 'smelt' | 'wild' | 'combo' | 'economy' | 'defense' | 'overclock' | 'faction' | 'skill'>;
  actTier: 1 | 2 | 3;
  ruleModifier: string; // Identifier consumed by CoreRuleEngine
  params: Record<string, number>;
}
```

### 2.4 Gadgets
```typescript
interface GadgetDefinition {
  id: string;
  type: 'passive' | 'consumable';
  cost: number;
  effectType: string;
  params: Record<string, number>;
}
```

### 2.5 Enemies
```typescript
interface EnemyDefinition {
  id: string;
  hp: number;
  damage: number;
  attackSpeed: number;
  moveSpeed: number;
  attackRange: number;
  armor: number;
  bountyCogs: number;
  isBoss?: boolean;
  bossPhases?: Array<{
    thresholdHpPct: number;
    abilities: string[];
  }>;
  spriteKey: string;
}
```

---

## 3. Schema Validation & Testing

Every data table must be passed through its respective Zod validator at test time or initialization:
```typescript
import { UnitSchema } from './schemas/unitSchema';

export function validateUnits(units: Record<string, unknown>) {
  for (const [id, unit] of Object.entries(units)) {
    UnitSchema.parse(unit);
  }
}
```
If a stat is missing, out of range, or unlocalized, the build or test fails immediately with a descriptive error.


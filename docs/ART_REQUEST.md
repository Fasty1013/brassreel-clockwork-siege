# BRASSREEL: Clockwork Siege — External Art Request & Prompt Specification

**Version:** 1.0.0 (Visual Overhaul — Planning P0)  
**Target:** Ready-to-use specifications and copy-paste prompts for Aseprite artists and generative pixel-art tools.  
**Export Standard:** PNG Sprite Sheet Grid + JSON Array/Hash (Phaser 3 Atlas compatible).

---

## 1. Technical Pixel-Art Specifications

All submitted art must strictly adhere to these 6 golden rules:
1. **Resolution & Grid:**
   - Standard Units & Enemies: **32×32 px** per frame.
   - Elites & Tier 3 Automatons: **48×48 px** per frame.
   - Bosses (Steam Baron): **64×64 px** per frame.
   - Final Boss (Iron Colossus): **96×96 px** per frame.
   - Slot Symbols: **28×28 px** (isolated on transparent background).
   - Battle Window Backdrop: **320×180 px** (flat, 3-layer parallax).
2. **Contour:** Exact **1px solid dark outline**. Never pure `#000000`. Use the darkest tone of the local material palette (`#15121b` for iron, `#3a2215` for brass).
3. **Color Discipline:** Maximum 16 colors per unit. Zero anti-aliasing. Zero semi-transparent brush feathers. Zero bilinear blur.
4. **Orientation:** All characters drawn **facing RIGHT** (east). Left-facing sprites are mirrored programmatically via `flipX = true`.
5. **Ground Pivot:** Character feet must stay anchored on the exact same baseline:
   - For 32×32 frames: feet rest at $y = 30$ px.
   - For 48×48 frames: feet rest at $y = 44$ px.
   - For 64×64 frames: feet rest at $y = 58$ px.
6. **Background for Generative Art:** When using AI tools, specify **flat magenta background** (`#ff00ff`) for clean 1-click chroma keying.

---

## 2. Animation States & Aseprite Tag Conventions

When exporting from Aseprite or packing sheets, use these exact tag names and frame counts:

| Tag Name | Frame Count | Target FPS | Visual Description |
|---|:---:|:---:|---|
| `idle` | 4 frames | 8 FPS | Pneumatic breathing, subtle torso expand, steam puff |
| `move` | 6 frames | 10 FPS | Signature 2px jump-hop walk cycle with feet squash |
| `attack` | 5 frames | 12 FPS | Anticipation windup -> Strike lunge -> Weapon arc -> Recover |
| `hit` | 2 frames | 12 FPS | Whiteout silhouette blink and knockback |
| `death` | 6 frames | 12 FPS | Shatters into 8 flying scrap pieces with smoke puff |
| `spawn` | 5 frames | 12 FPS | Green cell glow -> White silhouette pop -> Color reveal |

---

## 3. Ready Copy-Paste AI Prompts (Midjourney / Stable Diffusion / PixelLab)

### 3.1 Master System Negative Prompt (Universal for all requests)
```
blurry, smooth, gradient, 3d, realistic, photorealistic, anti-aliased, soft shading, high definition, vector, modern, smooth lines, messy pixels, artifact, human face, realistic skin, deformed, out of grid, watermark, signature
```

---

### 3.2 Benchmark Hero: Cog Knight (Tier 1 Melee Tank)
```
pixel art sprite sheet, 32x32 pixel character grid, steampunk brass clockwork knight, side view facing right, polished brass armor cuirass, riveted round shield in left hand, steam-powered broadsword in right hand, glowing horizontal slit visor, small brass smokestack on back venting white steam puff, 1px dark contour, flat shading, limited 16 color palette, 4 frames idle breathing, 6 frames jumping hop walk, 5 frames sword slash lunge with white crescent arc, clean magenta background #ff00ff, crisp retro 16-bit arcade style
```

---

### 3.3 Hero 2: Spring Archer (Tier 1 Ranged Ranger)
```
pixel art sprite sheet, 32x32 pixel character grid, steampunk clockwork archer, side view facing right, verdigris green copper plates, leather tunic, feather in cap, holding elegant mechanical recurve bow with gear cams, clockwork gear quiver on hip, glowing yellow monocle, 1px dark contour, flat shading, 4 frames idle, 6 frames hop walk, 5 frames bow draw and release arrow with tiny smoke puff, clean magenta background #ff00ff, crisp 16-bit style
```

---

### 3.4 Hero 3: Fuse Sapper (Tier 1 Artillery Demolitionist)
```
pixel art sprite sheet, 32x32 pixel character grid, steampunk demolition automaton, side view facing right, heavy iron hazard apron, round brass goggles with glowing red lenses, holding cast-iron grenade with burning sulfur fuse, backpack full of dynamite sticks, 1px dark contour, 4 frames idle with smoking fuse, 6 frames hop walk, 5 frames fuse light and explosive throw, clean magenta background #ff00ff, retro pixel art
```

---

### 3.5 Hero 4: Coil Sparker (Tier 1 Electro Mage)
```
pixel art sprite sheet, 32x32 pixel character grid, steampunk electrostatic mechanist, side view facing right, deep cobalt blue robes with copper conduits, dual handheld Leyden jar capacitor wands with crackling cyan electric plasma ball, 1px dark contour, 4 frames idle with pulsing plasma, 6 frames hop walk, 5 frames forward electric arc discharge with lightning sparks, clean magenta background #ff00ff
```

---

### 3.6 Common Mob: Scrapper Marauder (Act 1 Swarm Enemy)
```
pixel art sprite sheet, 32x32 pixel character grid, menacing rust-scrap marauder robot, side view facing right, hunchbacked junk frame, ragged leather hood, jagged rusty iron meat cleaver, single glowing red cyclops lens, 1px dark contour, 4 frames idle breathing, 6 frames scuttling hop walk, 5 frames aggressive overhead chop, clean magenta background #ff00ff
```

---

### 3.7 Act 1 Boss: The Steam Baron (64×64 px)
```
pixel art sprite sheet, 64x64 pixel boss character grid, steampunk industrial locomotive war baron, side view facing right, massive black cast-iron boiler torso, brass chimney exhaust on back pouring thick smoke, tall stovepipe top hat with brass goggles, left arm is a heavy rotating triple-barrel Gatling gun, glowing red furnace fire inside belly grate, 1px dark contour, 6 frames idle breathing, 6 frames heavy stomping walk, 8 frames spinning Gatling barrage with muzzle flash, clean magenta background #ff00ff
```

---

### 3.8 Slot Machine Symbols Set (28×28 px Icons)
```
pixel art game icon set, 28x28 pixel square icons, clean transparent background, 1px dark contour, bold readable silhouettes:
1. Brass cogwheel with 8 teeth and golden hub
2. Clockwork recurve bow with green verdigris plates
3. Cast-iron bomb with burning red-yellow fuse
4. Twin copper Tesla coils with cyan plasma arc
5. Golden automaton jester mask with ruby eye lenses
6. Imperial triple-crested royal crown with sapphire and ruby gears
Vibrant colors, high contrast, clean retro 16-bit arcade style
```

---

### 3.9 Battle Window Environment Backdrop (320×180 px Coarse Grid)
```
pixel art landscape background, 320x180 resolution, chunky retro pixel style:
Layer 1: vibrant cyan summer sky with gradient to pale blue, golden cream sun with dark outline, fluffy volumetric white clouds with lavender-blue shadows.
Layer 2: distant silhouetted brass clockwork towers and industrial factory smokestacks venting gentle steam.
Layer 3: lush green hillside with stylized 3-tiered pixel tree crowns in rich emerald and lime tones.
Layer 4: bright green meadow battlefield in foreground, subtle rusty narrow-gauge rails running along the bottom grass line.
Charming, warm, inviting, storybook retro arcade aesthetic, high contrast
```

---

### 3.10 UI Components: Window Frame & Foreman Cogsworth
```
pixel art UI asset sheet, 16-bit steampunk interface:
1. Parchment battle window frame: 9-slice tileable border, antique ivory paper texture, reinforced dark brass corners with round rivets, drop shadow.
2. Character portrait: Foreman Cogsworth, 32x32 pixel avatar, friendly brass automaton engineer with leather visor cap, mustache made of brass gears, magnifying loupe on eye, neutral expression and speaking frame.
3. Dialogue bubble: rounded dark mulberry speech box with 1px brass border and pointing tail.
4. Skull valve button: 36x36 circular cast-iron valve button with embossed brass skull cogwheel.
```


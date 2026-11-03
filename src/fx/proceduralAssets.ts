/**
 * Procedural Pixel-Art Asset Generator
 * Generates all sprites, symbols, tiles, and particle textures dynamically on HTML5 canvas.
 * 100% original, copyright-clean, zero external image downloads.
 */

export class ProceduralAssets {
  /**
   * Generates all game textures and injects them into Phaser's TextureManager.
   */
  public static generateAllTextures(scene: Phaser.Scene): void {
    const textures = scene.textures;

    // 1. Slot Symbols (48x48)
    this.createTexture(textures, 'sym_cog', 48, 48, (ctx) => this.drawCogSymbol(ctx));
    this.createTexture(textures, 'sym_spring', 48, 48, (ctx) => this.drawSpringSymbol(ctx));
    this.createTexture(textures, 'sym_fuse', 48, 48, (ctx) => this.drawFuseSymbol(ctx));
    this.createTexture(textures, 'sym_coil', 48, 48, (ctx) => this.drawCoilSymbol(ctx));
    this.createTexture(textures, 'sym_wild', 48, 48, (ctx) => this.drawWildSymbol(ctx));
    this.createTexture(textures, 'sym_crown', 48, 48, (ctx) => this.drawCrownSymbol(ctx));

    // 2. Playable Units (32x32)
    this.createTexture(textures, 'tex_scrap_bot', 32, 32, (ctx) => this.drawScrapBot(ctx));
    this.createTexture(textures, 'tex_cog_knight', 32, 32, (ctx) => this.drawCogKnight(ctx));
    this.createTexture(textures, 'tex_cog_bulwark', 32, 32, (ctx) => this.drawCogBulwark(ctx));
    this.createTexture(textures, 'tex_cog_ramhead', 32, 32, (ctx) => this.drawCogRamhead(ctx));
    this.createTexture(textures, 'tex_cog_fortress', 32, 32, (ctx) => this.drawCogFortress(ctx));
    this.createTexture(textures, 'tex_cog_aegis', 32, 32, (ctx) => this.drawCogAegis(ctx));
    this.createTexture(textures, 'tex_cog_juggernaut', 32, 32, (ctx) => this.drawCogJuggernaut(ctx));
    this.createTexture(textures, 'tex_cog_siegebreaker', 32, 32, (ctx) => this.drawCogSiegebreaker(ctx));

    this.createTexture(textures, 'tex_spring_archer', 32, 32, (ctx) => this.drawSpringArcher(ctx));
    this.createTexture(textures, 'tex_spring_sharpshooter', 32, 32, (ctx) => this.drawSpringSharpshooter(ctx));
    this.createTexture(textures, 'tex_spring_repeater', 32, 32, (ctx) => this.drawSpringRepeater(ctx));
    this.createTexture(textures, 'tex_spring_ballista', 32, 32, (ctx) => this.drawSpringBallista(ctx));
    this.createTexture(textures, 'tex_spring_eagle', 32, 32, (ctx) => this.drawSpringEagle(ctx));
    this.createTexture(textures, 'tex_spring_volley', 32, 32, (ctx) => this.drawSpringVolley(ctx));
    this.createTexture(textures, 'tex_spring_chrono', 32, 32, (ctx) => this.drawSpringChrono(ctx));

    this.createTexture(textures, 'tex_fuse_sapper', 32, 32, (ctx) => this.drawFuseSapper(ctx));
    this.createTexture(textures, 'tex_fuse_pyromancer', 32, 32, (ctx) => this.drawFusePyromancer(ctx));
    this.createTexture(textures, 'tex_fuse_demolitionist', 32, 32, (ctx) => this.drawFuseDemolitionist(ctx));
    this.createTexture(textures, 'tex_fuse_mortar', 32, 32, (ctx) => this.drawFuseMortar(ctx));
    this.createTexture(textures, 'tex_fuse_hellfire', 32, 32, (ctx) => this.drawFuseHellfire(ctx));
    this.createTexture(textures, 'tex_fuse_blast_dynamo', 32, 32, (ctx) => this.drawFuseBlastDynamo(ctx));
    this.createTexture(textures, 'tex_fuse_doom_barricade', 32, 32, (ctx) => this.drawFuseDoomBarricade(ctx));

    this.createTexture(textures, 'tex_coil_sparker', 32, 32, (ctx) => this.drawCoilSparker(ctx));
    this.createTexture(textures, 'tex_coil_conduit', 32, 32, (ctx) => this.drawCoilConduit(ctx));
    this.createTexture(textures, 'tex_coil_dynamo', 32, 32, (ctx) => this.drawCoilDynamo(ctx));
    this.createTexture(textures, 'tex_coil_tesla', 32, 32, (ctx) => this.drawCoilTesla(ctx));
    this.createTexture(textures, 'tex_coil_storm', 32, 32, (ctx) => this.drawCoilStorm(ctx));
    this.createTexture(textures, 'tex_coil_shield', 32, 32, (ctx) => this.drawCoilShield(ctx));
    this.createTexture(textures, 'tex_coil_overload', 32, 32, (ctx) => this.drawCoilOverload(ctx));

    // Grand Automatons (48x48)
    this.createTexture(textures, 'tex_legendary_leviathan', 48, 48, (ctx) => this.drawLegendaryLeviathan(ctx));
    this.createTexture(textures, 'tex_legendary_solarion', 48, 48, (ctx) => this.drawLegendarySolarion(ctx));
    this.createTexture(textures, 'tex_legendary_chrono', 48, 48, (ctx) => this.drawLegendaryChrono(ctx));

    // 3. Enemies (32x32) & Boss (64x64)
    this.createTexture(textures, 'tex_en_scrapper', 32, 32, (ctx) => this.drawEnemyScrapper(ctx));
    this.createTexture(textures, 'tex_en_steam_rover', 32, 32, (ctx) => this.drawEnemyRover(ctx));
    this.createTexture(textures, 'tex_en_beetle', 32, 32, (ctx) => this.drawEnemyBeetle(ctx));
    this.createTexture(textures, 'tex_en_sniper', 32, 32, (ctx) => this.drawEnemySniper(ctx));
    this.createTexture(textures, 'tex_en_shield_drone', 32, 32, (ctx) => this.drawEnemyShieldDrone(ctx));
    this.createTexture(textures, 'tex_en_hound', 32, 32, (ctx) => this.drawEnemyHound(ctx));
    this.createTexture(textures, 'tex_en_mortar', 32, 32, (ctx) => this.drawEnemyMortar(ctx));
    this.createTexture(textures, 'tex_en_bomber', 32, 32, (ctx) => this.drawEnemyBomber(ctx));
    this.createTexture(textures, 'tex_en_borer', 32, 32, (ctx) => this.drawEnemyBorer(ctx));
    this.createTexture(textures, 'tex_en_prowler', 32, 32, (ctx) => this.drawEnemyProwler(ctx));
    this.createTexture(textures, 'tex_en_golem', 32, 32, (ctx) => this.drawEnemyGolem(ctx));
    this.createTexture(textures, 'tex_en_raider', 32, 32, (ctx) => this.drawEnemyRaider(ctx));
    this.createTexture(textures, 'tex_boss_steam_baron', 64, 64, (ctx) => this.drawBossSteamBaron(ctx));

    // Act 2 Enemies & Boss (Rust Swamps)
    this.createTexture(textures, 'tex_en_acid_drone', 32, 32, (ctx) => this.drawEnemyAcidDrone(ctx));
    this.createTexture(textures, 'tex_en_rust_creeper', 32, 32, (ctx) => this.drawEnemyRustCreeper(ctx));
    this.createTexture(textures, 'tex_en_bog_stalker', 32, 32, (ctx) => this.drawEnemyBogStalker(ctx));
    this.createTexture(textures, 'tex_en_toxic_leech', 32, 32, (ctx) => this.drawEnemyToxicLeech(ctx));
    this.createTexture(textures, 'tex_boss_corrosion_empress', 64, 64, (ctx) => this.drawBossCorrosionEmpress(ctx));

    // Act 3 Enemies & Final Boss (Baron's Citadel)
    this.createTexture(textures, 'tex_en_clockwork_executioner', 32, 32, (ctx) => this.drawEnemyExecutioner(ctx));
    this.createTexture(textures, 'tex_en_siege_engine', 32, 32, (ctx) => this.drawEnemySiegeEngine(ctx));
    this.createTexture(textures, 'tex_en_dreadnought', 32, 32, (ctx) => this.drawEnemyDreadnought(ctx));
    this.createTexture(textures, 'tex_en_lightning_spire', 32, 32, (ctx) => this.drawEnemyLightningSpire(ctx));
    this.createTexture(textures, 'tex_boss_iron_colossus', 96, 96, (ctx) => this.drawBossIronColossus(ctx));

    // 4. Grid Tiles, UI Elements, Projectiles, Particles
    this.createTexture(textures, 'tile_player', 64, 64, (ctx) => this.drawPlayerTile(ctx));
    this.createTexture(textures, 'tile_enemy', 64, 64, (ctx) => this.drawEnemyTile(ctx));
    this.createTexture(textures, 'proj_arrow', 16, 16, (ctx) => this.drawArrowProjectile(ctx));
    this.createTexture(textures, 'proj_bomb', 16, 16, (ctx) => this.drawBombProjectile(ctx));
    this.createTexture(textures, 'proj_spark', 16, 16, (ctx) => this.drawSparkProjectile(ctx));
    this.createTexture(textures, 'fx_spark_particle', 8, 8, (ctx) => this.drawParticle(ctx, '#ffb703'));
    this.createTexture(textures, 'fx_smoke_particle', 16, 16, (ctx) => this.drawParticle(ctx, '#8d99ae'));
    this.createTexture(textures, 'fx_fire_particle', 12, 12, (ctx) => this.drawParticle(ctx, '#e63946'));
    this.createTexture(textures, 'fx_acid_particle', 10, 10, (ctx) => this.drawParticle(ctx, '#2ec4b6'));
    this.createTexture(textures, 'fx_electric_particle', 8, 8, (ctx) => this.drawParticle(ctx, '#00f5d4'));
  }

  private static createTexture(
    manager: Phaser.Textures.TextureManager,
    key: string,
    width: number,
    height: number,
    drawFn: (ctx: CanvasRenderingContext2D) => void
  ): void {
    if (manager.exists(key)) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      drawFn(ctx);
      manager.addCanvas(key, canvas);
    }
  }

  // --- SLOT SYMBOLS ---
  private static drawCogSymbol(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8c5836';
    ctx.beginPath();
    ctx.arc(24, 24, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.arc(24, 24, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22150c';
    ctx.beginPath();
    ctx.arc(24, 24, 6, 0, Math.PI * 2);
    ctx.fill();
    // Teeth
    ctx.fillStyle = '#d4a373';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 24 + Math.cos(angle) * 19;
      const y = 24 + Math.sin(angle) * 19;
      ctx.fillRect(x - 3, y - 3, 6, 6);
    }
  }

  private static drawSpringSymbol(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(8, 8, 32, 32);
    ctx.fillStyle = '#e76f51';
    for (let y = 12; y <= 32; y += 6) {
      ctx.fillRect(12, y, 24, 4);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 28, 28);
  }

  private static drawFuseSymbol(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d62828';
    ctx.fillRect(14, 16, 20, 24);
    ctx.fillStyle = '#f77f00';
    ctx.fillRect(16, 12, 16, 4);
    ctx.fillStyle = '#fcbf49';
    // Fuse cord and spark
    ctx.fillRect(22, 6, 4, 6);
    ctx.fillStyle = '#ffff3f';
    ctx.beginPath();
    ctx.arc(24, 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawCoilSymbol(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(12, 12, 24, 24);
    ctx.fillStyle = '#00b4d8';
    ctx.fillRect(16, 16, 16, 16);
    ctx.fillStyle = '#caf0f8';
    // Electric zigzag
    ctx.beginPath();
    ctx.moveTo(24, 14);
    ctx.lineTo(18, 24);
    ctx.lineTo(26, 24);
    ctx.lineTo(22, 34);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private static drawWildSymbol(ctx: CanvasRenderingContext2D): void {
    // Golden gear with starry core
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(24, 24, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fb8500';
    ctx.beginPath();
    ctx.arc(24, 24, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    // 4-point star
    ctx.beginPath();
    ctx.moveTo(24, 10);
    ctx.lineTo(27, 21);
    ctx.lineTo(38, 24);
    ctx.lineTo(27, 27);
    ctx.lineTo(24, 38);
    ctx.lineTo(21, 27);
    ctx.lineTo(10, 24);
    ctx.lineTo(21, 21);
    ctx.closePath();
    ctx.fill();
  }

  private static drawCrownSymbol(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(8, 30, 32, 6);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(8, 30);
    ctx.lineTo(8, 16);
    ctx.lineTo(16, 24);
    ctx.lineTo(24, 12);
    ctx.lineTo(32, 24);
    ctx.lineTo(40, 16);
    ctx.lineTo(40, 30);
    ctx.closePath();
    ctx.fill();
    // Rubies
    ctx.fillStyle = '#d62828';
    ctx.fillRect(11, 26, 4, 4);
    ctx.fillRect(22, 26, 4, 4);
    ctx.fillRect(33, 26, 4, 4);
  }

  // --- PLAYABLE UNITS ---
  private static drawScrapBot(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(10, 10, 12, 14); // Body
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(12, 6, 8, 6); // Head
    ctx.fillStyle = '#ffc107';
    ctx.fillRect(14, 8, 4, 2); // Single optic eye
    ctx.fillStyle = '#495057';
    ctx.fillRect(8, 14, 3, 8); // Arm L
    ctx.fillRect(21, 14, 3, 8); // Arm R
    ctx.fillRect(11, 24, 4, 6); // Leg L
    ctx.fillRect(17, 24, 4, 6); // Leg R
  }

  private static drawCogKnight(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(8, 8, 16, 16); // Torso
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(10, 4, 12, 8); // Helmet
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(12, 7, 8, 2); // Visor slit
    ctx.fillStyle = '#e07a5f';
    ctx.fillRect(4, 10, 5, 12); // Shield
    ctx.fillStyle = '#f4f1de';
    ctx.fillRect(23, 6, 4, 16); // Mace
  }

  private static drawCogBulwark(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#b07d62';
    ctx.fillRect(4, 6, 8, 20); // Tower shield
    ctx.fillStyle = '#f4f1de';
    ctx.fillRect(6, 8, 4, 16);
  }

  private static drawCogRamhead(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(20, 12, 10, 8); // Hydraulic ram
  }

  private static drawCogFortress(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#00b4d8';
    ctx.fillRect(12, 12, 8, 8); // Core power
  }

  private static drawCogAegis(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(6, 6, 20, 20);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 24, 24);
  }

  private static drawCogJuggernaut(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(4, 6, 24, 20);
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(10, 2, 6, 6); // Smokestack
  }

  private static drawCogSiegebreaker(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#f4f1de';
    ctx.fillRect(20, 2, 8, 26); // Giant hammer
  }

  private static drawSpringArcher(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(10, 8, 12, 16);
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(12, 4, 8, 6);
    ctx.strokeStyle = '#f4a261';
    ctx.lineWidth = 2;
    // Bow
    ctx.beginPath();
    ctx.arc(22, 16, 10, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  private static drawSpringSharpshooter(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#264653';
    ctx.fillRect(8, 8, 14, 16);
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(18, 12, 12, 4); // Long rifle
  }

  private static drawSpringRepeater(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(8, 8, 14, 16);
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(18, 10, 10, 3);
    ctx.fillRect(18, 15, 10, 3); // Twin barrels
  }

  private static drawSpringBallista(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#264653';
    ctx.fillRect(6, 12, 20, 14);
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(10, 6, 12, 18);
  }

  private static drawSpringEagle(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(12, 6, 8, 4);
  }

  private static drawSpringVolley(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#f4a261';
    ctx.fillRect(20, 6, 8, 2);
    ctx.fillRect(20, 14, 8, 2);
    ctx.fillRect(20, 22, 8, 2);
  }

  private static drawSpringChrono(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#264653';
    ctx.fillRect(8, 8, 16, 16);
    ctx.strokeStyle = '#00b4d8';
    ctx.strokeRect(6, 6, 20, 20);
  }

  private static drawFuseSapper(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d62828';
    ctx.fillRect(8, 10, 16, 14);
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(10, 6, 12, 6);
    ctx.fillStyle = '#fcbf49';
    ctx.fillRect(20, 12, 6, 8); // Bomb in hand
  }

  private static drawFusePyromancer(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d62828';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#f77f00';
    ctx.fillRect(10, 10, 12, 12);
  }

  private static drawFuseDemolitionist(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#9d0208';
    ctx.fillRect(6, 8, 20, 16);
    ctx.fillStyle = '#fcbf49';
    ctx.fillRect(8, 4, 16, 6);
  }

  private static drawFuseMortar(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#370617';
    ctx.fillRect(6, 12, 20, 14);
    ctx.fillStyle = '#d62828';
    ctx.fillRect(10, 4, 10, 12);
  }

  private static drawFuseHellfire(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d62828';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#ffba08';
    ctx.fillRect(10, 10, 12, 12);
  }

  private static drawFuseBlastDynamo(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#9d0208';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 14, 4, 4);
  }

  private static drawFuseDoomBarricade(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#370617';
    ctx.fillRect(4, 10, 24, 16);
    ctx.fillStyle = '#d62828';
    ctx.fillRect(8, 6, 6, 6);
    ctx.fillRect(18, 6, 6, 6);
  }

  private static drawCoilSparker(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(10, 10, 12, 14);
    ctx.fillStyle = '#00b4d8';
    ctx.fillRect(12, 4, 8, 8);
    ctx.strokeStyle = '#caf0f8';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 8, 20, 16);
  }

  private static drawCoilConduit(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#03045e';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#00b4d8';
    ctx.fillRect(12, 4, 8, 20);
  }

  private static drawCoilDynamo(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(6, 8, 20, 16);
    ctx.fillStyle = '#90e0ef';
    ctx.fillRect(10, 12, 12, 8);
  }

  private static drawCoilTesla(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#03045e';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#caf0f8';
    ctx.fillRect(14, 2, 4, 8); // Tesla spire
  }

  private static drawCoilStorm(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 8, 8, 14);
  }

  private static drawCoilShield(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(6, 6, 20, 20);
    ctx.strokeStyle = '#48cae4';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 24, 24);
  }

  private static drawCoilOverload(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#03045e';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#ff006e';
    ctx.fillRect(12, 12, 8, 8);
  }

  private static drawLegendaryLeviathan(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(6, 8, 36, 32);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(10, 12, 28, 24);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(16, 18, 16, 10);
  }

  private static drawLegendarySolarion(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(8, 8, 32, 32);
    ctx.fillStyle = '#fb8500';
    ctx.fillRect(14, 14, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 20, 8, 8);
  }

  private static drawLegendaryChrono(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#264653';
    ctx.fillRect(8, 8, 32, 32);
    ctx.strokeStyle = '#2a9d8f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(24, 24, 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- ENEMIES ---
  private static drawEnemyScrapper(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8d99ae';
    ctx.fillRect(8, 10, 16, 12);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(10, 12, 4, 4); // Red eye
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(4, 12, 4, 12); // Rust blade
  }

  private static drawEnemyRover(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(6, 12, 20, 12);
    ctx.fillStyle = '#212529';
    ctx.fillRect(6, 22, 6, 6); // Wheel L
    ctx.fillRect(20, 22, 6, 6); // Wheel R
  }

  private static drawEnemyBeetle(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#495057';
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(14, 8, 4, 4);
  }

  private static drawEnemySniper(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8d99ae';
    ctx.fillRect(10, 8, 12, 16);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(4, 14, 10, 3); // Long barrel
  }

  private static drawEnemyShieldDrone(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#48cae4';
    ctx.beginPath();
    ctx.arc(16, 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#caf0f8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  private static drawEnemyHound(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(6, 12, 20, 10);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(6, 8, 6, 6);
  }

  private static drawEnemyMortar(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#495057';
    ctx.fillRect(6, 14, 20, 12);
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(12, 4, 8, 12);
  }

  private static drawEnemyBomber(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d90429';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#ffba08';
    ctx.fillRect(12, 12, 8, 8);
  }

  private static drawEnemyBorer(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#343a40';
    ctx.fillRect(10, 8, 16, 16);
    ctx.fillStyle = '#adb5bd';
    // Drill cone pointing left
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(2, 16);
    ctx.lineTo(10, 24);
    ctx.closePath();
    ctx.fill();
  }

  private static drawEnemyProwler(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#03045e';
    ctx.fillRect(6, 10, 20, 12);
    ctx.fillStyle = '#00b4d8';
    ctx.fillRect(8, 12, 4, 4);
  }

  private static drawEnemyGolem(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#212529';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(10, 8, 12, 4);
  }

  private static drawEnemyRaider(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#ff006e';
    ctx.fillRect(10, 10, 12, 4);
  }

  // --- ACT 1 BOSS: THE STEAM BARON (64x64) ---
  private static drawBossSteamBaron(ctx: CanvasRenderingContext2D): void {
    // Heavy brass chassis
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(12, 16, 44, 36);
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(16, 20, 36, 28);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(20, 24, 28, 20);

    // Twin Smokestacks
    ctx.fillStyle = '#22150c';
    ctx.fillRect(36, 6, 8, 14);
    ctx.fillRect(46, 6, 8, 14);
    // Smoke puffs
    ctx.fillStyle = '#ced4da';
    ctx.beginPath();
    ctx.arc(40, 5, 5, 0, Math.PI * 2);
    ctx.arc(50, 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cowcatcher drill on front (facing left)
    ctx.fillStyle = '#e76f51';
    ctx.beginPath();
    ctx.moveTo(12, 22);
    ctx.lineTo(2, 34);
    ctx.lineTo(12, 46);
    ctx.closePath();
    ctx.fill();

    // Furnace glow eye
    ctx.fillStyle = '#e63946';
    ctx.fillRect(18, 30, 8, 8);
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(20, 32, 4, 4);

    // Iron Tank Treads / Leg gears
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(10, 50, 48, 10);
    ctx.fillStyle = '#d4a373';
    for (let x = 14; x <= 50; x += 8) {
      ctx.beginPath();
      ctx.arc(x, 55, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- ACT 2 & 3 PROCEDURAL ENEMIES & BOSSES ---
  private static drawEnemyAcidDrone(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2b9348';
    ctx.fillRect(10, 10, 12, 12);
    // Acid wings
    ctx.fillStyle = '#55a630';
    ctx.fillRect(4, 6, 8, 4);
    ctx.fillRect(20, 6, 8, 4);
    // Needle siphon
    ctx.fillStyle = '#d8f3dc';
    ctx.fillRect(15, 22, 2, 8);
  }

  private static drawEnemyRustCreeper(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#b7094c';
    ctx.beginPath();
    ctx.arc(16, 16, 8, 0, Math.PI * 2);
    ctx.fill();
    // Glowing volatile core
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(14, 14, 4, 4);
    // Spider legs
    ctx.strokeStyle = '#5c1349';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 20, 20);
  }

  private static drawEnemyBogStalker(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#386641';
    ctx.fillRect(6, 10, 20, 14);
    ctx.fillStyle = '#6a994e';
    ctx.fillRect(10, 6, 12, 6);
    // Heavy mud tread
    ctx.fillStyle = '#283618';
    ctx.fillRect(4, 24, 24, 6);
  }

  private static drawEnemyToxicLeech(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#007f5f';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#2b9348';
    ctx.fillRect(12, 4, 8, 8);
    // Siphon mouth
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(14, 2, 4, 4);
  }

  private static drawBossCorrosionEmpress(ctx: CanvasRenderingContext2D): void {
    // Queen carapace
    ctx.fillStyle = '#1b4332';
    ctx.beginPath();
    ctx.arc(32, 34, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#52b788';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Toxic acid glow sacks
    ctx.fillStyle = '#74c69d';
    ctx.fillRect(20, 26, 8, 12);
    ctx.fillRect(36, 26, 8, 12);

    // Crown antennas
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(24, 6, 3, 12);
    ctx.fillRect(37, 6, 3, 12);
    ctx.fillRect(22, 4, 7, 3);
    ctx.fillRect(35, 4, 7, 3);

    // Mandibles
    ctx.fillStyle = '#b7094c';
    ctx.beginPath();
    ctx.moveTo(22, 52);
    ctx.lineTo(28, 62);
    ctx.lineTo(36, 62);
    ctx.lineTo(42, 52);
    ctx.fill();
  }

  private static drawEnemyExecutioner(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#212529';
    ctx.fillRect(10, 8, 12, 16);
    // Iron mask
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(12, 4, 8, 6);
    // Cleaver
    ctx.fillStyle = '#e63946';
    ctx.fillRect(22, 2, 6, 22);
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(24, 24, 2, 6);
  }

  private static drawEnemySiegeEngine(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#495057';
    ctx.fillRect(6, 14, 20, 10);
    // Catapult arm / mortar
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(8, 6, 4, 12);
    ctx.fillRect(8, 4, 10, 4);
    // Wheels
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.arc(10, 26, 4, 0, Math.PI * 2);
    ctx.arc(22, 26, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawEnemyDreadnought(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#343a40';
    ctx.fillRect(4, 8, 24, 16);
    // Frontal shield plate
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(2, 6, 4, 20);
    // Red sensor slit
    ctx.fillStyle = '#e63946';
    ctx.fillRect(14, 14, 10, 3);
    // Treads
    ctx.fillStyle = '#1f1610';
    ctx.fillRect(4, 24, 24, 5);
  }

  private static drawEnemyLightningSpire(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(12, 8, 8, 20);
    // Copper rings
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(10, 12, 12, 2);
    ctx.fillRect(10, 18, 12, 2);
    // Electric orb top
    ctx.fillStyle = '#00f5d4';
    ctx.beginPath();
    ctx.arc(16, 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawBossIronColossus(ctx: CanvasRenderingContext2D): void {
    // 96x96 Colossal Mech Hull
    ctx.fillStyle = '#1b1d1e';
    ctx.fillRect(16, 20, 64, 48);
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 20, 64, 48);

    // Glowing Overdrive Core
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(48, 44, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(48, 44, 8, 0, Math.PI * 2);
    ctx.fill();

    // Twin smokestacks
    ctx.fillStyle = '#343a40';
    ctx.fillRect(24, 4, 8, 16);
    ctx.fillRect(64, 4, 8, 16);

    // Titan Hammer Left Arm
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(4, 32, 12, 36);
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(2, 64, 16, 14);

    // Gatling Right Arm
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(80, 32, 12, 30);
    ctx.fillStyle = '#212529';
    ctx.fillRect(82, 62, 8, 18);

    // Heavy Quad Treads
    ctx.fillStyle = '#141419';
    ctx.fillRect(12, 70, 72, 18);
    ctx.fillStyle = '#d4a373';
    for (let x = 18; x <= 78; x += 12) {
      ctx.beginPath();
      ctx.arc(x, 79, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- TILES & PROJECTILES ---
  private static drawPlayerTile(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2a221b';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#4a3b2c';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 62, 62);
    // Rivets in corners
    ctx.fillStyle = '#8c5836';
    ctx.fillRect(4, 4, 4, 4);
    ctx.fillRect(56, 4, 4, 4);
    ctx.fillRect(4, 56, 4, 4);
    ctx.fillRect(56, 56, 4, 4);
  }

  private static drawEnemyTile(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1e1c1b';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#332e2b';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 62, 62);
  }

  private static drawArrowProjectile(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(0, 7, 14, 2);
    ctx.fillStyle = '#e76f51';
    ctx.beginPath();
    ctx.moveTo(14, 4);
    ctx.lineTo(16, 8);
    ctx.lineTo(14, 12);
    ctx.closePath();
    ctx.fill();
  }

  private static drawBombProjectile(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#d62828';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(7, 1, 2, 3);
  }

  private static drawSparkProjectile(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#00b4d8';
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, 8, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawParticle(ctx: CanvasRenderingContext2D, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}


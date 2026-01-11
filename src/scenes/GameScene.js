import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.player = null;
    this.cursors = null;
    this.obstacles = [];
    this.pits = [];
    this.bullets = [];
    this.dirtParticles = [];
    this.playerSpeed = 200;
    this.pitSpeedMultiplier = 0.4;  // Slow down to 40% over pits
    this.bulletSpeed = 500;

    // Play area boundaries (where player can walk)
    this.playAreaTop = 350;
    this.playAreaBottom = 550;

    // Depth collision tolerance (how close feet need to be in Y to collide)
    this.depthTolerance = 15;

    // Character collision radius (for player-zombie collision)
    this.playerCollisionRadius = 18;
    this.zombieCollisionRadius = 16;

    // Weapons
    this.currentWeapon = 'fists';
    this.canShoot = true;
    this.shootCooldown = 300; // ms
    this.punchCooldown = 400; // ms

    // Damage values
    this.fistDamage = 1;    // 5 hits to kill zombie
    this.gunDamage = 3;     // 2 hits to kill zombie
    this.shotgunDamage = 2; // Per pellet, 3 pellets = 6 damage (one-shot)

    // Ammo
    this.gunAmmo = 10;
    this.shotgunAmmo = 4;
    this.ammoIcons = [];
    this.ammoCountTexts = {};

    // Player health
    this.playerMaxHealth = 10;
    this.playerHealth = 10;
    this.playerHealthBar = null;
    this.playerHealthBarFill = null;
    this.isGameOver = false;
    this.isRunning = false;
    this.runTween = null;
    this.fallTween = null;
    this.getUpTimer = null;
    this.isProne = false;
    this.isProneActive = false;
    this.proneTween = null;
    this.proneStandY = null;
    this.preProneTexture = null;
    this.proneOffsetY = 8;

    // Player direction (true = facing right/east, false = facing left/west)
    this.facingRight = true;

    // Level dimensions (10 screens longer)
    this.levelWidth = 800 * 11;
    this.screenWidth = 800;
    this.screenHeight = 600;

    // Parallax backgrounds
    this.backgroundLayer = null;
    this.castleLayer = null;
    this.hillLayer = null;

    // Pit particle timing
    this.lastDirtSpawn = 0;
    this.dirtSpawnInterval = 80;  // ms between dirt spawns

    // Dirt streams tracking
    this.dirtStreams = [];

    // Fallen state
    this.isFallen = false;
    this.fallChance = 0.4;  // 40% chance to fall
    this.fallDuration = 2000;  // 2 seconds

    // Zombies
    this.zombies = [];
    this.zombieSpeed = 60;  // Slow movement speed
    this.zombieSpawnCount = 30;  // Number of zombies to spawn

    this.levelIndex = 0;
    this.levelTransitioning = false;
    this.isPaused = false;
    this.pauseText = null;

    // Werewolves (level 2)
    this.werewolves = [];
    this.werewolfSpeed = 230;
    this.werewolfSpawnCount = 6;
    this.werewolfMaxHealth = 6;
    this.werewolfBiteDamage = 2;
    this.werewolfSpriteSpacing = 40;
  }

  init(data) {
    this.levelIndex = data?.levelIndex ?? 0;
    this.levelTransitioning = false;
    this.isGameOver = false;
    this.isPaused = false;
    this.isFallen = false;
    this.isProne = false;
    this.isProneActive = false;
    this.isRunning = false;
    this.playerHealth = this.playerMaxHealth;

    this.zombies = [];
    this.werewolves = [];
    this.bullets = [];
    this.dirtParticles = [];
    this.pits = [];
    this.obstacles = [];
    this.dirtStreams = [];
  }

  preload() {
    this.createTextures();
  }

  createPlayerSprite(graphics, textureName, isGun, legOffset = 0, legLift = 0) {
    // Muscled girl wearing rags - 40x52 sprite
    const w = 40;
    const h = 52;

    // Skin color (tanned)
    const skin = 0xd4a574;
    const skinDark = 0xc4956a;
    const skinLight = 0xe4b584;

    // Hair (dark red/auburn)
    const hair = 0x8b2500;
    const hairLight = 0xa03010;

    // Rags (torn brown/gray cloth)
    const cloth = 0x6b5a4a;
    const clothDark = 0x4a3a2a;
    const clothLight = 0x8b7a6a;

    // Weapon colors
    const metal = 0x555555;
    const metalLight = 0x777777;
    const metalDark = 0x333333;
    const wood = 0x8b4513;

    graphics.clear();

    // Hair (wild, flowing back)
    graphics.fillStyle(hair, 1);
    graphics.fillRect(12, 0, 16, 6);
    graphics.fillRect(10, 2, 20, 8);
    graphics.fillRect(8, 6, 6, 10);
    graphics.fillStyle(hairLight, 1);
    graphics.fillRect(14, 1, 4, 3);
    graphics.fillRect(22, 4, 6, 8);
    graphics.fillRect(26, 8, 4, 6);

    // Head
    graphics.fillStyle(skin, 1);
    graphics.fillRect(12, 6, 14, 14);
    graphics.fillStyle(skinLight, 1);
    graphics.fillRect(14, 8, 4, 4);
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(12, 16, 14, 2);

    // Eyes
    graphics.fillStyle(0x2a4a2a, 1);
    graphics.fillRect(15, 10, 3, 3);
    graphics.fillRect(21, 10, 3, 3);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(16, 11, 1, 1);
    graphics.fillRect(22, 11, 1, 1);

    // Mouth
    graphics.fillStyle(0x994444, 1);
    graphics.fillRect(17, 15, 4, 1);

    // Neck
    graphics.fillStyle(skin, 1);
    graphics.fillRect(16, 18, 6, 4);

    // Muscled shoulders and arms
    graphics.fillStyle(skin, 1);
    graphics.fillRect(6, 22, 8, 6);   // Left shoulder
    graphics.fillRect(24, 22, 8, 6);  // Right shoulder
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(6, 26, 4, 2);   // Left shoulder muscle
    graphics.fillRect(28, 26, 4, 2);  // Right shoulder muscle

    // Torso with rags (torn top)
    graphics.fillStyle(cloth, 1);
    graphics.fillRect(10, 22, 18, 14);
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(12, 24, 4, 10);
    graphics.fillRect(22, 24, 4, 10);
    graphics.fillStyle(clothLight, 1);
    graphics.fillRect(16, 22, 6, 2);
    // Torn edges
    graphics.fillStyle(skin, 1);
    graphics.fillRect(10, 22, 2, 3);
    graphics.fillRect(26, 22, 2, 4);
    graphics.fillRect(14, 34, 3, 2);
    graphics.fillRect(21, 33, 4, 3);

    // Muscled arms
    graphics.fillStyle(skin, 1);
    graphics.fillRect(4, 28, 6, 10);  // Left arm
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(4, 30, 2, 6);   // Left arm muscle shadow

    // Rags skirt/shorts
    graphics.fillStyle(cloth, 1);
    graphics.fillRect(10, 36, 18, 8);
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(18, 36, 2, 8);
    // Torn edges
    graphics.fillStyle(clothLight, 1);
    graphics.fillRect(10, 42, 3, 2);
    graphics.fillRect(24, 41, 4, 3);

    // Legs
    const legY = 44 + legLift;
    const legHeight = 8 - legLift;
    const bootY = legY + legHeight - 4;
    graphics.fillStyle(skin, 1);
    graphics.fillRect(12 - legOffset, legY, 6, legHeight);  // Left leg
    graphics.fillRect(20 + legOffset, legY, 6, legHeight);  // Right leg
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(12 - legOffset, legY, 2, legHeight);
    graphics.fillRect(24 + legOffset, legY, 2, legHeight);

    // Boots
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(11 - legOffset, bootY, 8, 4);
    graphics.fillRect(19 + legOffset, bootY, 8, 4);

    // Right arm holding weapon
    graphics.fillStyle(skin, 1);
    graphics.fillRect(28, 28, 6, 8);

    if (isGun) {
      // Pistol (held in right hand, pointing right)
      graphics.fillStyle(metalDark, 1);
      graphics.fillRect(34, 30, 6, 4);  // Barrel
      graphics.fillStyle(metal, 1);
      graphics.fillRect(32, 29, 4, 6);  // Body
      graphics.fillStyle(wood, 1);
      graphics.fillRect(32, 35, 3, 4);  // Grip
      graphics.fillStyle(metalLight, 1);
      graphics.fillRect(36, 31, 2, 2);  // Barrel highlight
    } else {
      // Shotgun (held in both hands)
      graphics.fillStyle(metalDark, 1);
      graphics.fillRect(32, 28, 8, 3);  // Barrel
      graphics.fillRect(30, 28, 4, 4);  // Receiver
      graphics.fillStyle(metal, 1);
      graphics.fillRect(33, 29, 6, 1);  // Barrel highlight
      graphics.fillStyle(wood, 1);
      graphics.fillRect(28, 31, 6, 3);  // Stock
      graphics.fillRect(26, 32, 4, 4);  // Grip
      graphics.fillStyle(metalLight, 1);
      graphics.fillRect(38, 28, 2, 2);  // Muzzle
    }

    graphics.generateTexture(textureName, w, h);
    graphics.clear();
  }

  createPlayerFistsSprite(graphics, textureName, legOffset = 0, legLift = 0) {
    // Muscled girl with fists raised - 40x52 sprite
    const w = 40;
    const h = 52;

    // Skin color (tanned)
    const skin = 0xd4a574;
    const skinDark = 0xc4956a;
    const skinLight = 0xe4b584;

    // Hair (dark red/auburn)
    const hair = 0x8b2500;
    const hairLight = 0xa03010;

    // Rags (torn brown/gray cloth)
    const cloth = 0x6b5a4a;
    const clothDark = 0x4a3a2a;
    const clothLight = 0x8b7a6a;

    graphics.clear();

    // Hair (wild, flowing back)
    graphics.fillStyle(hair, 1);
    graphics.fillRect(12, 0, 16, 6);
    graphics.fillRect(10, 2, 20, 8);
    graphics.fillRect(8, 6, 6, 10);
    graphics.fillStyle(hairLight, 1);
    graphics.fillRect(14, 1, 4, 3);
    graphics.fillRect(22, 4, 6, 8);
    graphics.fillRect(26, 8, 4, 6);

    // Head
    graphics.fillStyle(skin, 1);
    graphics.fillRect(12, 6, 14, 14);
    graphics.fillStyle(skinLight, 1);
    graphics.fillRect(14, 8, 4, 4);
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(12, 16, 14, 2);

    // Eyes
    graphics.fillStyle(0x2a4a2a, 1);
    graphics.fillRect(15, 10, 3, 3);
    graphics.fillRect(21, 10, 3, 3);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(16, 11, 1, 1);
    graphics.fillRect(22, 11, 1, 1);

    // Mouth
    graphics.fillStyle(0x994444, 1);
    graphics.fillRect(17, 15, 4, 1);

    // Neck
    graphics.fillStyle(skin, 1);
    graphics.fillRect(16, 18, 6, 4);

    // Muscled shoulders
    graphics.fillStyle(skin, 1);
    graphics.fillRect(6, 22, 8, 6);   // Left shoulder
    graphics.fillRect(24, 22, 8, 6);  // Right shoulder
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(6, 26, 4, 2);   // Left shoulder muscle
    graphics.fillRect(28, 26, 4, 2);  // Right shoulder muscle

    // Torso with rags (torn top)
    graphics.fillStyle(cloth, 1);
    graphics.fillRect(10, 22, 18, 14);
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(12, 24, 4, 10);
    graphics.fillRect(22, 24, 4, 10);
    graphics.fillStyle(clothLight, 1);
    graphics.fillRect(16, 22, 6, 2);
    // Torn edges
    graphics.fillStyle(skin, 1);
    graphics.fillRect(10, 22, 2, 3);
    graphics.fillRect(26, 22, 2, 4);
    graphics.fillRect(14, 34, 3, 2);
    graphics.fillRect(21, 33, 4, 3);

    // Left arm (down)
    graphics.fillStyle(skin, 1);
    graphics.fillRect(4, 28, 6, 10);
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(4, 30, 2, 6);

    // Right arm raised with fist (fighting stance)
    graphics.fillStyle(skin, 1);
    graphics.fillRect(28, 24, 6, 8);  // Upper arm
    graphics.fillRect(32, 20, 8, 8);  // Fist
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(32, 22, 2, 4);  // Fist shadow
    graphics.fillStyle(skinLight, 1);
    graphics.fillRect(36, 21, 3, 3);  // Knuckles highlight

    // Rags skirt/shorts
    graphics.fillStyle(cloth, 1);
    graphics.fillRect(10, 36, 18, 8);
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(18, 36, 2, 8);
    graphics.fillStyle(clothLight, 1);
    graphics.fillRect(10, 42, 3, 2);
    graphics.fillRect(24, 41, 4, 3);

    // Legs
    const legY = 44 + legLift;
    const legHeight = 8 - legLift;
    const bootY = legY + legHeight - 4;
    graphics.fillStyle(skin, 1);
    graphics.fillRect(12 - legOffset, legY, 6, legHeight);
    graphics.fillRect(20 + legOffset, legY, 6, legHeight);
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(12 - legOffset, legY, 2, legHeight);
    graphics.fillRect(24 + legOffset, legY, 2, legHeight);

    // Boots
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(11 - legOffset, bootY, 8, 4);
    graphics.fillRect(19 + legOffset, bootY, 8, 4);

    graphics.generateTexture(textureName, w, h);
    graphics.clear();
  }

  createFallenSprite(graphics) {
    // Fallen player - lying on the ground (rotated/horizontal sprite)
    const w = 52;
    const h = 24;

    // Skin color
    const skin = 0xd4a574;
    const skinDark = 0xc4956a;

    // Hair
    const hair = 0x8b2500;

    // Rags
    const cloth = 0x6b5a4a;
    const clothDark = 0x4a3a2a;

    graphics.clear();

    // Body lying horizontally (head on left, feet on right)
    // Head
    graphics.fillStyle(hair, 1);
    graphics.fillRect(0, 6, 10, 10);
    graphics.fillStyle(skin, 1);
    graphics.fillRect(2, 8, 10, 10);

    // Torso with rags
    graphics.fillStyle(cloth, 1);
    graphics.fillRect(12, 4, 18, 16);
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(14, 6, 4, 12);

    // Arms sprawled
    graphics.fillStyle(skin, 1);
    graphics.fillRect(12, 0, 8, 4);   // Arm up
    graphics.fillRect(14, 20, 6, 4);  // Arm down

    // Legs
    graphics.fillStyle(skin, 1);
    graphics.fillRect(30, 5, 12, 6);  // Upper leg
    graphics.fillRect(30, 13, 12, 6); // Lower leg
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(42, 6, 6, 5);   // Boot
    graphics.fillRect(42, 14, 6, 5);  // Boot

    // Stars/dizziness effect above head
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(4, 2, 2);
    graphics.fillCircle(10, 0, 2);
    graphics.fillCircle(6, 4, 1);

    graphics.generateTexture('player_fallen', w, h);
    graphics.clear();
  }

  createZombieSprite(graphics) {
    // Zombie sprite - shambling undead figure - 36x48 sprite
    const w = 36;
    const h = 48;

    // Zombie colors - pale, decaying
    const skin = 0x7a9a7a;  // Greenish pale skin
    const skinDark = 0x5a7a5a;
    const skinLight = 0x8aaa8a;

    // Tattered clothes
    const cloth = 0x3a3a3a;  // Dark gray rags
    const clothDark = 0x2a2a2a;
    const clothLight = 0x4a4a4a;

    // Blood/wounds
    const blood = 0x660000;
    const bloodDark = 0x440000;

    graphics.clear();

    // Head (slightly tilted)
    graphics.fillStyle(skin, 1);
    graphics.fillRect(10, 2, 14, 14);
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(10, 12, 14, 4);

    // Sunken eyes
    graphics.fillStyle(0x1a1a1a, 1);
    graphics.fillRect(12, 6, 4, 4);
    graphics.fillRect(19, 6, 4, 4);
    // Glowing pupils
    graphics.fillStyle(0xff3300, 1);
    graphics.fillRect(13, 7, 2, 2);
    graphics.fillRect(20, 7, 2, 2);

    // Mouth (open, groaning)
    graphics.fillStyle(0x2a1a1a, 1);
    graphics.fillRect(14, 12, 6, 3);
    graphics.fillStyle(blood, 1);
    graphics.fillRect(15, 13, 4, 1);

    // Messy hair
    graphics.fillStyle(0x2a2a2a, 1);
    graphics.fillRect(8, 0, 18, 4);
    graphics.fillRect(6, 2, 4, 6);
    graphics.fillRect(24, 1, 4, 5);

    // Neck (with wound)
    graphics.fillStyle(skin, 1);
    graphics.fillRect(14, 14, 6, 4);
    graphics.fillStyle(blood, 1);
    graphics.fillRect(18, 15, 3, 2);

    // Torso with tattered shirt
    graphics.fillStyle(cloth, 1);
    graphics.fillRect(8, 18, 20, 16);
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(10, 20, 4, 12);
    graphics.fillRect(22, 20, 4, 12);
    // Torn edges revealing skin
    graphics.fillStyle(skin, 1);
    graphics.fillRect(8, 18, 3, 4);
    graphics.fillRect(25, 22, 3, 6);
    // Blood stains
    graphics.fillStyle(bloodDark, 1);
    graphics.fillRect(14, 24, 6, 4);

    // Arms (one reaching forward)
    graphics.fillStyle(skin, 1);
    graphics.fillRect(4, 20, 6, 10);   // Left arm (down)
    graphics.fillRect(26, 18, 10, 6);  // Right arm (reaching forward)
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(4, 26, 4, 4);    // Left hand
    graphics.fillRect(32, 20, 4, 4);   // Right hand

    // Tattered pants
    graphics.fillStyle(clothLight, 1);
    graphics.fillRect(10, 34, 16, 8);
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(16, 34, 4, 8);
    // Torn edges
    graphics.fillStyle(skin, 1);
    graphics.fillRect(10, 40, 3, 2);
    graphics.fillRect(23, 39, 3, 3);

    // Legs (shambling stance)
    graphics.fillStyle(skin, 1);
    graphics.fillRect(10, 42, 6, 6);   // Left leg
    graphics.fillRect(20, 42, 6, 6);   // Right leg
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(10, 44, 2, 4);
    graphics.fillRect(24, 44, 2, 4);

    graphics.generateTexture('zombie', w, h);
    graphics.clear();
  }

  createWerewolfSprite(graphics) {
    // Werewolf sprite - lean, fast predator - 38x50
    const w = 38;
    const h = 50;

    const fur = 0x4a3a2a;
    const furDark = 0x2a1a12;
    const furLight = 0x6a5a4a;
    const eye = 0xff3333;

    graphics.clear();

    // Head
    graphics.fillStyle(furDark, 1);
    graphics.fillRect(8, 2, 18, 12);
    graphics.fillStyle(fur, 1);
    graphics.fillRect(10, 4, 14, 10);

    // Eyes
    graphics.fillStyle(eye, 1);
    graphics.fillRect(13, 7, 3, 3);
    graphics.fillRect(19, 7, 3, 3);

    // Snout
    graphics.fillStyle(furLight, 1);
    graphics.fillRect(22, 9, 8, 4);

    // Torso
    graphics.fillStyle(fur, 1);
    graphics.fillRect(10, 14, 16, 18);
    graphics.fillStyle(furLight, 1);
    graphics.fillRect(12, 16, 4, 8);

    // Arms
    graphics.fillStyle(furDark, 1);
    graphics.fillRect(4, 16, 6, 12);
    graphics.fillRect(26, 16, 6, 12);
    graphics.fillStyle(furLight, 1);
    graphics.fillRect(4, 26, 6, 4);
    graphics.fillRect(26, 26, 6, 4);

    // Legs
    graphics.fillStyle(fur, 1);
    graphics.fillRect(10, 32, 8, 12);
    graphics.fillRect(20, 32, 8, 12);
    graphics.fillStyle(furDark, 1);
    graphics.fillRect(10, 42, 8, 6);
    graphics.fillRect(20, 42, 8, 6);

    graphics.generateTexture('werewolf', w, h);
    graphics.clear();
  }

  createTextures() {
    const graphics = this.add.graphics();

    // Create muscled girl with fists texture
    this.createPlayerFistsSprite(graphics, 'player_fists');
    this.createPlayerFistsSprite(graphics, 'player_fists_run1', 2);
    this.createPlayerFistsSprite(graphics, 'player_fists_run2', -2);
    this.createPlayerFistsSprite(graphics, 'player_fists_getup1', 0, 2);
    this.createPlayerFistsSprite(graphics, 'player_fists_getup2', 0, 1);

    // Create muscled girl with gun texture
    this.createPlayerSprite(graphics, 'player_gun', true);
    this.createPlayerSprite(graphics, 'player_gun_run1', true, 2);
    this.createPlayerSprite(graphics, 'player_gun_run2', true, -2);
    this.createPlayerSprite(graphics, 'player_gun_getup1', true, 0, 2);
    this.createPlayerSprite(graphics, 'player_gun_getup2', true, 0, 1);

    // Create muscled girl with shotgun texture
    this.createPlayerSprite(graphics, 'player_shotgun', false);
    this.createPlayerSprite(graphics, 'player_shotgun_run1', false, 2);
    this.createPlayerSprite(graphics, 'player_shotgun_run2', false, -2);
    this.createPlayerSprite(graphics, 'player_shotgun_getup1', false, 0, 2);
    this.createPlayerSprite(graphics, 'player_shotgun_getup2', false, 0, 1);

    // Create fallen player texture (lying down)
    this.createFallenSprite(graphics);

    // Create zombie texture
    this.createZombieSprite(graphics);

    // Create werewolf texture
    this.createWerewolfSprite(graphics);

    // Create punch effect texture
    graphics.fillStyle(0xffff00, 0.8);
    graphics.fillCircle(12, 12, 12);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(12, 12, 6);
    // Impact lines
    graphics.lineStyle(2, 0xffff00, 1);
    graphics.beginPath();
    graphics.moveTo(0, 12);
    graphics.lineTo(4, 12);
    graphics.moveTo(20, 12);
    graphics.lineTo(24, 12);
    graphics.moveTo(12, 0);
    graphics.lineTo(12, 4);
    graphics.moveTo(12, 20);
    graphics.lineTo(12, 24);
    graphics.strokePath();
    graphics.generateTexture('punch_effect', 24, 24);
    graphics.clear();

    // Create fist weapon icon (32x32)
    graphics.fillStyle(0xd4a574, 1);  // Skin color
    graphics.fillRect(8, 6, 16, 20);  // Fist
    graphics.fillRect(6, 10, 4, 12);  // Thumb
    graphics.fillStyle(0xc4956a, 1);
    graphics.fillRect(8, 12, 2, 8);   // Finger lines
    graphics.fillRect(12, 12, 2, 8);
    graphics.fillRect(16, 12, 2, 8);
    graphics.fillRect(20, 12, 2, 8);
    graphics.fillStyle(0xe4b584, 1);
    graphics.fillRect(10, 8, 12, 4);  // Knuckles highlight
    graphics.generateTexture('icon_fists', 32, 32);
    graphics.clear();

    // Create pistol weapon icon (32x32)
    graphics.fillStyle(0x333333, 1);  // Dark metal
    graphics.fillRect(4, 10, 20, 6);  // Barrel
    graphics.fillRect(8, 8, 12, 10);  // Body
    graphics.fillStyle(0x555555, 1);
    graphics.fillRect(6, 11, 16, 4);  // Barrel highlight
    graphics.fillStyle(0x8b4513, 1);  // Wood grip
    graphics.fillRect(12, 16, 6, 10);
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(22, 11, 6, 4);  // Muzzle
    graphics.generateTexture('icon_gun', 32, 32);
    graphics.clear();

    // Create shotgun weapon icon (32x32)
    graphics.fillStyle(0x333333, 1);  // Dark metal
    graphics.fillRect(2, 12, 24, 4);  // Barrel
    graphics.fillRect(2, 16, 24, 3);  // Second barrel
    graphics.fillStyle(0x555555, 1);
    graphics.fillRect(4, 13, 20, 2);  // Barrel highlight
    graphics.fillStyle(0x8b4513, 1);  // Wood stock
    graphics.fillRect(20, 10, 10, 12);
    graphics.fillStyle(0x6b3503, 1);
    graphics.fillRect(22, 12, 6, 8);
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(0, 12, 4, 6);   // Muzzle
    graphics.generateTexture('icon_shotgun', 32, 32);
    graphics.clear();

    // Create bullet texture
    graphics.fillStyle(0xffff00, 1);
    graphics.fillRect(0, 2, 12, 4);
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillRect(0, 3, 12, 2);
    graphics.generateTexture('bullet', 12, 8);
    graphics.clear();

    // Create shotgun pellet texture
    graphics.fillStyle(0xff6600, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillCircle(3, 3, 2);
    graphics.generateTexture('pellet', 8, 8);
    graphics.clear();

    // Create bullet icon for ammo display
    graphics.fillStyle(0xd4a017, 1);  // Brass casing
    graphics.fillRect(0, 4, 6, 8);
    graphics.fillStyle(0xc49000, 1);
    graphics.fillRect(1, 5, 4, 6);
    graphics.fillStyle(0x8b4513, 1);  // Copper bullet tip
    graphics.fillRect(6, 5, 6, 6);
    graphics.fillStyle(0xa0522d, 1);
    graphics.fillRect(10, 6, 2, 4);
    graphics.generateTexture('bullet_icon', 12, 16);
    graphics.clear();

    // Create shotgun shell icon for ammo display
    graphics.fillStyle(0xcc0000, 1);  // Red shell body
    graphics.fillRect(0, 2, 8, 12);
    graphics.fillStyle(0x990000, 1);
    graphics.fillRect(1, 3, 6, 10);
    graphics.fillStyle(0xd4a017, 1);  // Brass base
    graphics.fillRect(8, 3, 4, 10);
    graphics.fillStyle(0xc49000, 1);
    graphics.fillRect(9, 4, 2, 8);
    graphics.generateTexture('shell_icon', 12, 16);
    graphics.clear();

    // Create corn texture (single corn stalk)
    graphics.fillStyle(0x228B22, 1);
    graphics.fillRect(6, 20, 4, 30); // Stalk
    graphics.fillStyle(0x9ACD32, 1);
    graphics.fillRect(0, 10, 8, 20); // Left leaves
    graphics.fillRect(8, 10, 8, 20); // Right leaves
    graphics.fillStyle(0xFFD700, 1);
    graphics.fillRect(4, 0, 8, 14); // Corn cob
    graphics.generateTexture('corn', 16, 50);
    graphics.clear();

    // Create grass tile texture
    graphics.fillStyle(0x4a7c23, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x5a8c33, 1);
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(i * 4);
      graphics.fillRect(x, 0, 2, 8 + (i % 3) * 4);
    }
    graphics.generateTexture('grass', 32, 32);
    graphics.clear();

    // Create sandy road texture
    graphics.fillStyle(0xc2a060, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xb8956a, 1);
    graphics.fillRect(5, 5, 4, 4);
    graphics.fillRect(20, 15, 6, 4);
    graphics.fillRect(10, 22, 5, 5);
    graphics.generateTexture('sand', 32, 32);
    graphics.clear();

    // Create car texture
    graphics.fillStyle(0x8B0000, 1); // Dark red body
    graphics.fillRect(0, 10, 80, 35);
    graphics.fillStyle(0x660000, 1); // Darker top
    graphics.fillRect(15, 0, 50, 20);
    graphics.fillStyle(0x87CEEB, 1); // Windows
    graphics.fillRect(20, 3, 18, 14);
    graphics.fillRect(42, 3, 18, 14);
    graphics.fillStyle(0x222222, 1); // Wheels
    graphics.fillCircle(15, 45, 10);
    graphics.fillCircle(65, 45, 10);
    graphics.fillStyle(0xFFFF00, 1); // Headlights
    graphics.fillRect(75, 18, 5, 8);
    graphics.fillRect(75, 30, 5, 8);
    graphics.generateTexture('car', 80, 55);
    graphics.clear();

    // Create pit texture
    graphics.fillStyle(0x3d2817, 1); // Dark brown edge
    graphics.fillRect(0, 0, 60, 40);
    graphics.fillStyle(0x1a1008, 1); // Black pit center
    graphics.fillRect(5, 5, 50, 30);
    graphics.fillStyle(0x2a1810, 1); // Slight depth shading
    graphics.fillRect(8, 8, 44, 24);
    graphics.generateTexture('pit', 60, 40);
    graphics.clear();

    // Create dirt particle texture
    graphics.fillStyle(0x5c4033, 1);
    graphics.fillCircle(3, 3, 3);
    graphics.fillStyle(0x6b4c3a, 1);
    graphics.fillCircle(2, 2, 1);
    graphics.generateTexture('dirt', 6, 6);
    graphics.clear();

    // Create dirt stream segment texture
    graphics.fillStyle(0x4a3828, 1);
    graphics.fillRect(0, 0, 12, 12);
    graphics.fillStyle(0x3a2818, 1);
    graphics.fillRect(2, 2, 8, 8);
    graphics.fillStyle(0x5a4838, 1);
    graphics.fillRect(1, 1, 3, 3);
    graphics.fillRect(7, 6, 4, 4);
    graphics.generateTexture('dirtStream', 12, 12);
    graphics.clear();

    // Create moon texture
    graphics.fillStyle(0xffffcc, 1);
    graphics.fillCircle(30, 30, 25);
    graphics.fillStyle(0xeeeeaa, 1);
    graphics.fillCircle(22, 25, 5); // Crater
    graphics.fillCircle(35, 35, 4); // Crater
    graphics.fillCircle(28, 38, 3); // Crater
    graphics.generateTexture('moon', 60, 60);
    graphics.clear();

    // Create large castle texture
    graphics.fillStyle(0x12121f, 1); // Dark castle body
    // Main walls
    graphics.fillRect(60, 120, 180, 130); // Main building
    // Towers
    graphics.fillRect(0, 60, 50, 190); // Far left tower
    graphics.fillRect(250, 60, 50, 190); // Far right tower
    graphics.fillRect(40, 80, 40, 170); // Inner left tower
    graphics.fillRect(220, 80, 40, 170); // Inner right tower
    graphics.fillRect(130, 30, 40, 220); // Center tall tower
    // Tower tops (pointed)
    graphics.fillTriangle(25, 60, 0, 60, 25, 10); // Far left
    graphics.fillTriangle(25, 60, 50, 60, 25, 10);
    graphics.fillTriangle(275, 60, 250, 60, 275, 10); // Far right
    graphics.fillTriangle(275, 60, 300, 60, 275, 10);
    graphics.fillTriangle(60, 80, 40, 80, 60, 40); // Inner left
    graphics.fillTriangle(60, 80, 80, 80, 60, 40);
    graphics.fillTriangle(240, 80, 220, 80, 240, 40); // Inner right
    graphics.fillTriangle(240, 80, 260, 80, 240, 40);
    graphics.fillTriangle(150, 30, 130, 30, 150, -20); // Center
    graphics.fillTriangle(150, 30, 170, 30, 150, -20);
    // Battlements on main wall
    for (let bx = 70; bx < 230; bx += 20) {
      graphics.fillRect(bx, 110, 12, 15);
    }
    // Windows (glowing ominously)
    graphics.fillStyle(0xff6600, 1);
    graphics.fillRect(15, 100, 12, 18);
    graphics.fillRect(18, 150, 10, 14);
    graphics.fillRect(270, 100, 12, 18);
    graphics.fillRect(273, 150, 10, 14);
    graphics.fillRect(143, 60, 14, 20);
    graphics.fillRect(143, 100, 14, 20);
    graphics.fillRect(100, 160, 12, 16);
    graphics.fillRect(140, 160, 12, 16);
    graphics.fillRect(180, 160, 12, 16);
    // Main gate
    graphics.fillStyle(0x0a0a12, 1);
    graphics.fillRect(125, 190, 50, 60);
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(130, 195, 18, 50);
    graphics.fillRect(152, 195, 18, 50);
    graphics.generateTexture('castle', 300, 250);
    graphics.clear();

    // Create dramatic cliff texture - tall rocky cliff face
    const cliffWidth = 200;
    const cliffHeight = 300;

    // Dark rocky cliff base
    graphics.fillStyle(0x1a1a1a, 1);
    // Main cliff body - jagged left side, steep
    graphics.beginPath();
    graphics.moveTo(40, 0);  // Top left of cliff plateau
    graphics.lineTo(160, 0); // Top right of plateau
    graphics.lineTo(180, 40); // Slight overhang
    graphics.lineTo(175, 80);
    graphics.lineTo(185, 120);
    graphics.lineTo(170, 180);
    graphics.lineTo(190, 250);
    graphics.lineTo(200, cliffHeight); // Bottom right
    graphics.lineTo(0, cliffHeight);   // Bottom left
    graphics.lineTo(10, 250);
    graphics.lineTo(25, 200);
    graphics.lineTo(15, 150);
    graphics.lineTo(30, 100);
    graphics.lineTo(20, 50);
    graphics.lineTo(40, 0);
    graphics.closePath();
    graphics.fillPath();

    // Cliff face highlights (rocky texture)
    graphics.fillStyle(0x252525, 1);
    graphics.fillRect(50, 20, 80, 8);
    graphics.fillRect(60, 60, 60, 6);
    graphics.fillRect(45, 100, 70, 5);
    graphics.fillRect(55, 150, 50, 6);
    graphics.fillRect(40, 200, 80, 5);

    // Darker crevices
    graphics.fillStyle(0x0a0a0a, 1);
    graphics.fillRect(70, 40, 4, 30);
    graphics.fillRect(100, 80, 3, 40);
    graphics.fillRect(55, 130, 4, 35);
    graphics.fillRect(90, 180, 3, 45);
    graphics.fillRect(65, 240, 4, 40);

    // Cliff top plateau (where castle sits)
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(35, 0, 130, 12);

    graphics.generateTexture('cliff', cliffWidth, cliffHeight);
    graphics.clear();

    graphics.destroy();
  }

  create() {
    // Set up world bounds for the extended level
    this.physics.world.setBounds(0, 0, this.levelWidth, this.screenHeight);

    this.input.keyboard.enabled = true;

    this.createLevel();
    this.createDirtStreams();
    this.createObstacles();
    this.createZombies();
    this.createWerewolves();
    this.createPlayer();
    this.createAnimations();
    this.createUI();
    this.setupInput();
    this.setupCamera();
    this.setupVisibilityPause();
  }

  setupVisibilityPause() {
    this.handleVisibilityChange = () => {
      if (document.hidden && !this.isPaused) {
        this.togglePause();
      }
    };

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.handleWindowBlur = () => {
      if (!this.isPaused) {
        this.togglePause();
      }
    };
    window.addEventListener('blur', this.handleWindowBlur);
    this.events.once('shutdown', () => {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('blur', this.handleWindowBlur);
    });
  }

  createAnimations() {
    this.anims.create({
      key: 'player_run_fists',
      frames: [{ key: 'player_fists_run1' }, { key: 'player_fists_run2' }],
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: 'player_run_gun',
      frames: [{ key: 'player_gun_run1' }, { key: 'player_gun_run2' }],
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: 'player_run_shotgun',
      frames: [{ key: 'player_shotgun_run1' }, { key: 'player_shotgun_run2' }],
      frameRate: 6,
      repeat: -1,
    });
  }

  setupCamera() {
    // Camera follows player
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.screenHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  createLevel() {
    const height = this.screenHeight;
    const isForestLevel = this.levelIndex === 1;

    // Night sky background - fixed to camera (scrollFactor 0)
    this.add.rectangle(this.screenWidth / 2, 0, this.screenWidth, 280, 0x0a0a1f)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    // Stars - fixed to camera
    for (let i = 0; i < 80; i++) {
      const starX = Math.random() * this.screenWidth;
      const starY = Math.random() * 200;
      const starSize = Math.random() * 2 + 1;
      this.add.circle(starX, starY, starSize, 0xffffff, Math.random() * 0.5 + 0.5)
        .setScrollFactor(0)
        .setDepth(-99);
    }

    // Moon - fixed in place (no scrolling)
    this.moon = this.add.image(120, 70, 'moon')
      .setScale(1.2)
      .setScrollFactor(0)
      .setDepth(-98);

    if (!isForestLevel) {
      // Dramatic cliff with castle on top - distant parallax background
      // Cliff rises from bottom, castle perched on top
      this.cliff = this.add.image(720, 200, 'cliff')
        .setScale(0.8)
        .setScrollFactor(0.05)
        .setDepth(-50);

      this.castle = this.add.image(720, 68, 'castle')
        .setScale(0.4)
        .setScrollFactor(0.05)
        .setDepth(-49);
    }

    // Create tiled ground across the entire level
    for (let x = 0; x < this.levelWidth; x += 32) {
      // Forest canopy (top area)
      for (let y = 280; y < this.playAreaTop; y += 32) {
        const tint = isForestLevel ? 0x0f2010 : 0x1a3010;
        this.add.image(x + 16, y + 16, 'grass').setTint(tint).setDepth(-10);
      }

      // Road (middle play area)
      for (let y = this.playAreaTop; y < this.playAreaBottom; y += 32) {
        if (isForestLevel) {
          this.add.image(x + 16, y + 16, 'grass').setTint(0x2a4a20).setDepth(-10);
        } else {
          this.add.image(x + 16, y + 16, 'sand').setTint(0x6a5040).setDepth(-10);
        }
      }

      // Forest floor (bottom area)
      for (let y = this.playAreaBottom; y < height; y += 32) {
        const tint = isForestLevel ? 0x102510 : 0x1a3510;
        this.add.image(x + 16, y + 16, 'grass').setTint(tint).setDepth(-10);
      }
    }

    if (!isForestLevel) {
      // Corn stalks across the level
      for (let x = 0; x < this.levelWidth; x += 20) {
        const offsetX = (Math.floor(x / 20) % 2) * 10;
        for (let row = 0; row < 2; row++) {
          const y = 295 + row * 30;
          if (y < this.playAreaTop - 10) {
            const corn = this.add.image(x + offsetX, y, 'corn');
            corn.setTint(0x2a4a20);
            corn.setDepth(y);
          }
        }
      }
    } else {
      // Dark forest silhouettes above/below the road
      for (let i = 0; i < 40; i++) {
        const topX = Math.random() * this.levelWidth;
        const topY = 260 + Math.random() * 70;
        this.add.circle(topX, topY, 18 + Math.random() * 18, 0x0a1208, 0.9)
          .setDepth(-9);
      }

      for (let i = 0; i < 40; i++) {
        const bottomX = Math.random() * this.levelWidth;
        const bottomY = this.playAreaBottom + 20 + Math.random() * 70;
        this.add.circle(bottomX, bottomY, 18 + Math.random() * 18, 0x0a1208, 0.9)
          .setDepth(-9);
      }
    }

    // Road edge markers across entire level
    this.add.rectangle(this.levelWidth / 2, this.playAreaTop, this.levelWidth, 4, 0x4a3a25)
      .setOrigin(0.5, 0.5)
      .setDepth(-5);
    this.add.rectangle(this.levelWidth / 2, this.playAreaBottom, this.levelWidth, 4, 0x2a4a15)
      .setOrigin(0.5, 0.5)
      .setDepth(-5);
  }

  showForestSign() {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2 - 40;

    const signBg = this.add.rectangle(centerX, centerY, 500, 70, 0x0b0b0b, 0.85);
    signBg.setDepth(4000);
    signBg.setScrollFactor(0);

    const signText = this.add.text(centerX, centerY, 'Dark Forest Waits Ahead...', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      fill: '#c9d1c3',
      stroke: '#000000',
      strokeThickness: 4,
    });
    signText.setOrigin(0.5, 0.5);
    signText.setDepth(4001);
    signText.setScrollFactor(0);

    this.tweens.add({
      targets: [signBg, signText],
      alpha: 0,
      duration: 1200,
      delay: 1000,
      onComplete: () => {
        signBg.destroy();
        signText.destroy();
        this.scene.restart({ levelIndex: 1 });
      }
    });
  }

  createDirtStreams() {
    // Create curved dirt streams that flow from top to bottom of road
    const numStreams = 15;
    const startX = this.screenWidth / 2;
    const endX = this.levelWidth - 400;

    for (let i = 0; i < numStreams; i++) {
      // Random starting X position
      const streamStartX = startX + Math.random() * (endX - startX);

      // Stream properties - curves using sine wave
      const curveAmplitude = 30 + Math.random() * 50; // How wide the curve is
      const curveFrequency = 0.02 + Math.random() * 0.03; // How many curves
      const phaseOffset = Math.random() * Math.PI * 2; // Random phase

      // Draw stream from top to bottom of play area
      const streamTop = this.playAreaTop + 10;
      const streamBottom = this.playAreaBottom - 10;
      const streamLength = streamBottom - streamTop;

      // Place dirt stream segments along the curved path
      const segmentSpacing = 10;
      const numSegments = Math.floor(streamLength / segmentSpacing);

      for (let j = 0; j < numSegments; j++) {
        const t = j / numSegments;
        const y = streamTop + t * streamLength;

        // Calculate X offset using sine wave for natural curve
        const curveOffset = Math.sin(t * Math.PI * 2 * curveFrequency * 20 + phaseOffset) * curveAmplitude;
        const x = streamStartX + curveOffset;

        // Add some randomness to each segment position
        const jitterX = (Math.random() - 0.5) * 6;
        const jitterY = (Math.random() - 0.5) * 4;

        const finalX = x + jitterX;
        const finalY = y + jitterY;

        const segment = this.add.image(finalX, finalY, 'dirtStream');
        segment.setDepth(-4); // Just above the road but below road markers
        segment.setAlpha(0.7 + Math.random() * 0.3);

        // Randomly scale some segments for variety
        const scale = 0.8 + Math.random() * 0.6;
        segment.setScale(scale);

        // Slight rotation for natural look
        segment.setRotation((Math.random() - 0.5) * 0.3);

        // Track position for collision detection (every 3rd segment to reduce checks)
        if (j % 3 === 0) {
          this.dirtStreams.push({ x: finalX, y: finalY, radius: 12 * scale });
        }
      }
    }
  }

  createObstacles() {
    // Randomly place obstacles throughout the level
    // Leave first screen relatively clear for player start
    const startX = this.screenWidth;
    const endX = this.levelWidth - 200;

    // Number of obstacles per type
    const numCars = 25;
    const numPits = 20;

    // Place cars randomly
    for (let i = 0; i < numCars; i++) {
      const x = startX + Math.random() * (endX - startX);
      const y = this.playAreaTop + 30 + Math.random() * (this.playAreaBottom - this.playAreaTop - 60);

      const car = this.add.image(x, y, 'car');
      car.footY = car.y + car.height / 2;
      car.setDepth(car.footY);  // Depth based on Y position for proper sorting
      this.obstacles.push(car);
    }

    // Place pits randomly - pits don't block movement, stored separately
    const startPit = this.add.image(140, (this.playAreaTop + this.playAreaBottom) / 2 + 20, 'pit');
    startPit.footY = startPit.y + startPit.height / 2;
    startPit.setDepth(0);
    this.pits.push(startPit);

    for (let i = 0; i < numPits; i++) {
      const x = startX + Math.random() * (endX - startX);
      const y = this.playAreaTop + 20 + Math.random() * (this.playAreaBottom - this.playAreaTop - 40);

      const pit = this.add.image(x, y, 'pit');
      pit.footY = pit.y + pit.height / 2;
      pit.setDepth(0);  // Always below player
      this.pits.push(pit);
    }
  }

  createZombies() {
    if (this.levelIndex === 1) return;
    // Spawn zombies throughout the level
    const startX = this.screenWidth + 200;  // Start spawning after first screen
    const endX = this.levelWidth - 200;

    for (let i = 0; i < this.zombieSpawnCount; i++) {
      const x = startX + Math.random() * (endX - startX);
      const y = this.playAreaTop + 20 + Math.random() * (this.playAreaBottom - this.playAreaTop - 40);

      const zombie = this.add.sprite(x, y, 'zombie');
      zombie.footY = zombie.y + zombie.height / 2;
      zombie.setDepth(zombie.footY);
      zombie.facingRight = Math.random() > 0.5;  // Random initial direction
      zombie.setFlipX(!zombie.facingRight);
      zombie.maxHealth = 5;
      zombie.health = 5;  // Zombies take 5 fist hits to kill
      zombie.stunned = false;
      zombie.knockbackVelocityX = 0;
      zombie.knockbackVelocityY = 0;

      // Attack properties
      zombie.isAttacking = false;
      zombie.attackTimer = 0;
      zombie.attackDuration = 1500; // 1.5 seconds wind-up

      // Create health bar
      zombie.healthBarBg = this.add.rectangle(x, y - zombie.height / 2 - 8, 30, 4, 0x000000);
      zombie.healthBarBg.setDepth(zombie.footY + 1);
      zombie.healthBarFill = this.add.rectangle(x - 14, y - zombie.height / 2 - 8, 28, 2, 0x00ff00);
      zombie.healthBarFill.setOrigin(0, 0.5);  // Left-aligned
      zombie.healthBarFill.setDepth(zombie.footY + 2);

      this.zombies.push(zombie);
    }
  }

  createWerewolves() {
    if (this.levelIndex !== 1) return;

    const startX = this.screenWidth + 200;
    const endX = this.levelWidth - 200;

    for (let i = 0; i < this.werewolfSpawnCount; i++) {
      const x = startX + Math.random() * (endX - startX);
      const y = this.playAreaTop + 20 + Math.random() * (this.playAreaBottom - this.playAreaTop - 40);

      const werewolf = this.add.sprite(x, y, 'werewolf');
      werewolf.footY = werewolf.y + werewolf.height / 2;
      werewolf.setDepth(werewolf.footY);
      werewolf.facingRight = Math.random() > 0.5;
      werewolf.setFlipX(!werewolf.facingRight);
      werewolf.health = this.werewolfMaxHealth;
      werewolf.state = 'approach';
      werewolf.biteCooldown = 0;
      werewolf.jumpCooldown = 1000 + Math.random() * 2000;
      werewolf.crouchTimer = 0;
      werewolf.jumpTimer = 0;
      werewolf.jumpDuration = 350;
      werewolf.jumpStartX = werewolf.x;
      werewolf.jumpTargetX = werewolf.x;
      werewolf.jumpHitApplied = false;
      werewolf.retreatDistance = 0;

      this.werewolves.push(werewolf);
    }
  }

  isPlayerOnDirt() {
    // Check if player is on a pit or dirt stream
    return this.isPlayerOverPit() !== null || this.isPlayerOnDirtStream();
  }

  isPlayerOnDirtStream() {
    const playerX = this.player.x;
    const playerFoot = this.player.y + this.player.height / 2;

    for (const stream of this.dirtStreams) {
      const dx = playerX - stream.x;
      const dy = playerFoot - stream.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < stream.radius + 15) {  // 15 = player foot radius tolerance
        return true;
      }
    }
    return false;
  }

  playerFall() {
    if (this.isFallen) return;

    this.isFallen = true;
    this.isProne = false;
    this.isProneActive = false;
    this.isRunning = false;
    this.player.anims.stop();
    this.stopRunTween();

    // Store current texture to restore later
    if (this.currentWeapon === 'fists') {
      this.preFallTexture = 'player_fists';
    } else if (this.currentWeapon === 'gun') {
      this.preFallTexture = 'player_gun';
    } else {
      this.preFallTexture = 'player_shotgun';
    }

    if (this.fallTween) {
      this.fallTween.stop();
    }
    if (this.getUpTimer) {
      this.getUpTimer.remove(false);
      this.getUpTimer = null;
    }

    const fallTargetY = this.player.y + 6;
    this.fallTween = this.tweens.add({
      targets: this.player,
      y: fallTargetY,
      scaleX: 1.03,
      scaleY: 0.8,
      duration: 200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.player.setTexture('player_fallen');
        this.player.setFlipX(!this.facingRight);
        this.player.setScale(1, 1);
        this.fallTween = null;
      }
    });

    // Schedule getting up
    this.getUpTimer = this.time.delayedCall(this.fallDuration, () => {
      this.getUpTimer = null;
      this.getUp();
    });
  }

  getUp() {
    if (this.fallTween) {
      this.fallTween.stop();
    }

    const getUpStartY = this.player.y;
    const [getupStart, getupMid, getupEnd] = this.getUpTextureSequence();
    this.player.setTexture(getupStart);
    this.player.setFlipX(!this.facingRight);
    this.player.setScale(1, 0.8);

    this.player.setTexture(getupStart);
    this.fallTween = this.tweens.add({
      targets: this.player,
      y: getUpStartY - 5,
      scaleY: 0.9,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.player.setTexture(getupMid);
        this.fallTween = this.tweens.add({
          targets: this.player,
          y: getUpStartY - 2,
          scaleY: 0.98,
          duration: 180,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.player.setTexture(getupEnd);
            this.fallTween = this.tweens.add({
              targets: this.player,
              y: getUpStartY,
              scaleY: 1,
              duration: 140,
              ease: 'Sine.easeOut',
              onComplete: () => {
                this.player.setScale(1, 1);
                this.isFallen = false;
                this.fallTween = null;
              }
            });
          }
        });
      }
    });
  }

  isPlayerOverPit() {
    const playerLeft = this.player.x - this.player.width / 2;
    const playerRight = this.player.x + this.player.width / 2;
    const playerFoot = this.player.y + this.player.height / 2;

    for (const pit of this.pits) {
      const pitLeft = pit.x - pit.width / 2;
      const pitRight = pit.x + pit.width / 2;
      const pitTop = pit.y - pit.height / 2;
      const pitBottom = pit.y + pit.height / 2;

      // Check horizontal overlap
      const horizontalOverlap = playerRight > pitLeft && playerLeft < pitRight;
      // Check if player's feet are within pit's Y range
      const verticalOverlap = playerFoot > pitTop && playerFoot < pitBottom + 10;

      if (horizontalOverlap && verticalOverlap) {
        return pit;
      }
    }
    return null;
  }

  spawnDirtParticle(pit) {
    // Spawn dirt particle rising from pit
    const x = pit.x + (Math.random() - 0.5) * pit.width * 0.8;
    const y = pit.y + (Math.random() - 0.5) * pit.height * 0.5;

    const dirt = this.add.sprite(x, y, 'dirt');
    dirt.setDepth(1000);
    dirt.velocityY = -30 - Math.random() * 40;  // Rise up
    dirt.velocityX = (Math.random() - 0.5) * 20;
    dirt.life = 500 + Math.random() * 300;  // Lifetime in ms
    dirt.setAlpha(0.8);
    this.dirtParticles.push(dirt);
  }

  updateDirtParticles(delta) {
    const deltaSeconds = delta / 1000;

    for (let i = this.dirtParticles.length - 1; i >= 0; i--) {
      const dirt = this.dirtParticles[i];

      // Move particle
      dirt.x += dirt.velocityX * deltaSeconds;
      dirt.y += dirt.velocityY * deltaSeconds;

      // Slow down and fade
      dirt.velocityY += 60 * deltaSeconds;  // Gravity
      dirt.life -= delta;
      dirt.setAlpha(Math.max(0, dirt.life / 500));

      // Remove dead particles
      if (dirt.life <= 0) {
        dirt.destroy();
        this.dirtParticles.splice(i, 1);
      }
    }
  }

  updateZombies(delta) {
    const deltaSeconds = delta / 1000;
    const playerX = this.player.x;
    const playerY = this.player.y;
    const minDistance = this.playerCollisionRadius + this.zombieCollisionRadius;

    for (let i = 0; i < this.zombies.length; i++) {
      const zombie = this.zombies[i];
      let newX = zombie.x;
      let newY = zombie.y;

      // If stunned, apply knockback instead of following player
      if (zombie.stunned) {
        // Apply knockback movement
        if (zombie.knockbackVelocityX !== 0 || zombie.knockbackVelocityY !== 0) {
          newX += zombie.knockbackVelocityX * deltaSeconds;
          newY += zombie.knockbackVelocityY * deltaSeconds;

          // Decay knockback velocity
          zombie.knockbackVelocityX *= 0.9;
          zombie.knockbackVelocityY *= 0.9;
        }
      } else {
        // Calculate direction to player
        const dx = playerX - zombie.x;
        const dy = playerY - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if close enough to attack
        const attackRange = minDistance + 5;
        if (distance <= attackRange) {
          // Start or continue attack
          if (!zombie.isAttacking) {
            zombie.isAttacking = true;
            zombie.attackTimer = 0;
            // Start attack animation (raise arms)
            this.startZombieAttackAnimation(zombie);
          }

          // Update attack timer
          zombie.attackTimer += delta;

          if (zombie.attackTimer >= zombie.attackDuration) {
            // Attack lands!
            this.zombieHitsPlayer(zombie);
            zombie.isAttacking = false;
            zombie.attackTimer = 0;
          }
        } else {
          // Too far to attack, move closer
          if (zombie.isAttacking) {
            // Cancel attack if player moved away
            zombie.isAttacking = false;
            zombie.attackTimer = 0;
            this.stopZombieAttackAnimation(zombie);
          }

          // Normalize and apply speed
          const vx = (dx / distance) * this.zombieSpeed * deltaSeconds;
          const vy = (dy / distance) * this.zombieSpeed * deltaSeconds;

          newX += vx;
          newY += vy;
        }

        // Update facing direction
        zombie.facingRight = dx > 0;
        zombie.setFlipX(!zombie.facingRight);
      }

      // Check collision with player
      const dxPlayer = newX - playerX;
      const dyPlayer = newY - playerY;
      const distToPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);

      if (distToPlayer < minDistance && distToPlayer > 0) {
        // Push zombie back to minimum distance from player
        const pushBackX = (dxPlayer / distToPlayer) * minDistance;
        const pushBackY = (dyPlayer / distToPlayer) * minDistance;
        newX = playerX + pushBackX;
        newY = playerY + pushBackY;
      }

      // Check collision with other zombies
      for (let j = 0; j < this.zombies.length; j++) {
        if (i === j) continue;
        const other = this.zombies[j];
        const dxOther = newX - other.x;
        const dyOther = newY - other.y;
        const distToOther = Math.sqrt(dxOther * dxOther + dyOther * dyOther);
        const minZombieDist = this.zombieCollisionRadius * 2;

        if (distToOther < minZombieDist && distToOther > 0) {
          // Push this zombie away from the other
          const pushX = (dxOther / distToOther) * (minZombieDist - distToOther) * 0.5;
          const pushY = (dyOther / distToOther) * (minZombieDist - distToOther) * 0.5;
          newX += pushX;
          newY += pushY;
        }
      }

      // Apply new position
      zombie.x = newX;
      zombie.y = newY;

      // Keep within play area bounds
      const zombieBottom = zombie.y + zombie.height / 2;
      if (zombieBottom < this.playAreaTop) {
        zombie.y = this.playAreaTop - zombie.height / 2;
      }
      if (zombieBottom > this.playAreaBottom) {
        zombie.y = this.playAreaBottom - zombie.height / 2;
      }

      // Keep in level bounds
      const halfWidth = zombie.width / 2;
      if (zombie.x < halfWidth) zombie.x = halfWidth;
      if (zombie.x > this.levelWidth - halfWidth) zombie.x = this.levelWidth - halfWidth;

      // Update depth based on Y position
      zombie.footY = zombie.y + zombie.height / 2;
      zombie.setDepth(zombie.footY);

      // Update health bar position
      zombie.healthBarBg.x = zombie.x;
      zombie.healthBarBg.y = zombie.y - zombie.height / 2 - 8;
      zombie.healthBarBg.setDepth(zombie.footY + 1);
      zombie.healthBarFill.x = zombie.x - 14;
      zombie.healthBarFill.y = zombie.y - zombie.height / 2 - 8;
      zombie.healthBarFill.setDepth(zombie.footY + 2);
    }
  }

  startWerewolfRetreat(werewolf, distance) {
    werewolf.state = 'retreat';
    werewolf.retreatDistance = distance;
    werewolf.biteCooldown = 800;
    werewolf.crouchTimer = 0;
    werewolf.jumpTimer = 0;
    werewolf.jumpHitApplied = false;
    werewolf.clearTint();
    werewolf.setScale(1, 1);
  }

  startWerewolfJump(werewolf) {
    werewolf.state = 'jump';
    werewolf.jumpTimer = 0;
    werewolf.jumpHitApplied = false;
    werewolf.clearTint();
    werewolf.setScale(1, 1);
    werewolf.jumpStartX = werewolf.x;
    werewolf.jumpBaseY = werewolf.y;
    werewolf.jumpTargetX = werewolf.x < this.player.x
      ? this.player.x + this.werewolfSpriteSpacing
      : this.player.x - this.werewolfSpriteSpacing;
    werewolf.facingRight = werewolf.jumpTargetX > werewolf.x;
    werewolf.setFlipX(!werewolf.facingRight);
  }

  werewolfBite(werewolf) {
    if (this.isGameOver) return;

    werewolf.state = 'bite';
    werewolf.biteCooldown = 1000;

    this.playerHealth -= this.werewolfBiteDamage;
    this.updatePlayerHealthBar();

    if (this.playerHealth <= 0) {
      this.playerDeath();
    } else {
      this.showPlayerOuchBalloon();
    }

    this.startWerewolfRetreat(werewolf, this.werewolfSpriteSpacing * 3);
  }

  updateWerewolves(delta) {
    if (this.levelIndex !== 1) return;

    const deltaSeconds = delta / 1000;
    const heroX = this.player.x;
    const heroY = this.player.y;

    for (let i = 0; i < this.werewolves.length; i++) {
      const werewolf = this.werewolves[i];

      if (werewolf.biteCooldown > 0) {
        werewolf.biteCooldown -= delta;
      }
      if (werewolf.jumpCooldown > 0) {
        werewolf.jumpCooldown -= delta;
      }

      const dx = heroX - werewolf.x;
      const dy = heroY - werewolf.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      if (werewolf.state === 'approach') {
        if (distance <= this.werewolfSpriteSpacing &&
            werewolf.jumpCooldown <= 0 &&
            Math.random() < 0.25) {
          werewolf.state = 'crouch';
          werewolf.crouchTimer = 1000;
          werewolf.setScale(1, 0.85);
        } else if (distance <= 24 && werewolf.biteCooldown <= 0) {
          this.werewolfBite(werewolf);
        } else {
          werewolf.x += (dx / distance) * this.werewolfSpeed * deltaSeconds;
          werewolf.y += (dy / distance) * this.werewolfSpeed * deltaSeconds;
        }
      } else if (werewolf.state === 'retreat') {
        if (distance >= werewolf.retreatDistance) {
          werewolf.state = 'approach';
        } else {
          werewolf.x -= (dx / distance) * this.werewolfSpeed * deltaSeconds;
          werewolf.y -= (dy / distance) * this.werewolfSpeed * deltaSeconds;
        }
      } else if (werewolf.state === 'crouch') {
        werewolf.crouchTimer -= delta;
        if (werewolf.crouchTimer <= 100) {
          werewolf.setTint(0xff2222);
        }
        if (werewolf.crouchTimer <= 0) {
          werewolf.clearTint();
          werewolf.setScale(1, 1);
          werewolf.jumpCooldown = 2000 + Math.random() * 2000;
          this.startWerewolfJump(werewolf);
        }
      } else if (werewolf.state === 'jump') {
        werewolf.jumpTimer += delta;
        const progress = Math.min(1, werewolf.jumpTimer / werewolf.jumpDuration);
        const arcHeight = 30;
        const arc = Math.sin(progress * Math.PI) * arcHeight;
        werewolf.x = werewolf.jumpStartX + (werewolf.jumpTargetX - werewolf.jumpStartX) * progress;
        werewolf.y = werewolf.jumpBaseY - arc;

        if (!werewolf.jumpHitApplied && progress >= 0.5) {
          werewolf.jumpHitApplied = true;
          const closeEnough = Math.abs(werewolf.x - heroX) <= this.werewolfSpriteSpacing;
          if (closeEnough && !this.isProneActive && !this.isProne && !this.isFallen && !this.isGameOver) {
            const jumpDamage = Math.ceil(this.playerMaxHealth / 3);
            this.playerHealth -= jumpDamage;
            this.updatePlayerHealthBar();
            if (this.playerHealth <= 0) {
              this.playerDeath();
            } else {
              this.playerFall();
            }
          }
        }

        if (progress >= 1) {
          werewolf.y = werewolf.jumpBaseY;
          this.startWerewolfRetreat(werewolf, this.werewolfSpriteSpacing * 3);
        }
      }

      werewolf.facingRight = heroX > werewolf.x;
      werewolf.setFlipX(!werewolf.facingRight);

      const werewolfBottom = werewolf.y + werewolf.height / 2;
      if (werewolfBottom < this.playAreaTop) {
        werewolf.y = this.playAreaTop - werewolf.height / 2;
      }
      if (werewolfBottom > this.playAreaBottom) {
        werewolf.y = this.playAreaBottom - werewolf.height / 2;
      }

      const halfWidth = werewolf.width / 2;
      if (werewolf.x < halfWidth) werewolf.x = halfWidth;
      if (werewolf.x > this.levelWidth - halfWidth) werewolf.x = this.levelWidth - halfWidth;

      werewolf.footY = werewolf.y + werewolf.height / 2;
      werewolf.setDepth(werewolf.footY);
    }
  }

  updateZombieHealthBar(zombie) {
    const healthPercent = zombie.health / zombie.maxHealth;
    zombie.healthBarFill.width = 28 * healthPercent;

    // Change color based on health
    if (healthPercent > 0.6) {
      zombie.healthBarFill.setFillStyle(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      zombie.healthBarFill.setFillStyle(0xffff00); // Yellow
    } else {
      zombie.healthBarFill.setFillStyle(0xff0000); // Red
    }
  }

  startZombieAttackAnimation(zombie) {
    // Tint zombie orange to show attack charging
    zombie.setTint(0xff8800);

    // Create a pulsing/shaking effect
    if (zombie.attackTween) {
      zombie.attackTween.stop();
    }

    zombie.attackTween = this.tweens.add({
      targets: zombie,
      scaleX: 1.1,
      scaleY: 0.95,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  stopZombieAttackAnimation(zombie) {
    // Reset zombie appearance
    zombie.clearTint();
    zombie.setScale(1, 1);

    if (zombie.attackTween) {
      zombie.attackTween.stop();
      zombie.attackTween = null;
    }
  }

  playZombieHitAnimation(zombie) {
    if (zombie.hitTween) {
      zombie.hitTween.stop();
    }

    zombie.setRotation(zombie.facingRight ? 0.15 : -0.15);
    zombie.hitTween = this.tweens.add({
      targets: zombie,
      rotation: 0,
      duration: 120,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (zombie.active) {
          zombie.setRotation(0);
        }
        zombie.hitTween = null;
      }
    });
  }

  zombieHitsPlayer(zombie) {
    // Don't process hits if game is over
    if (this.isGameOver) return;

    // Stop the attack animation
    this.stopZombieAttackAnimation(zombie);
    this.playZombieHitAnimation(zombie);

    // Flash zombie white briefly for the hit
    zombie.setTint(0xffffff);
    this.time.delayedCall(100, () => {
      if (zombie.active) {
        zombie.clearTint();
      }
    });

    // Reduce player health
    this.playerHealth--;
    this.updatePlayerHealthBar();

    // Check for death
    if (this.playerHealth <= 0) {
      this.playerDeath();
    } else {
      // Show "Ouch!" balloon above player
      this.showPlayerOuchBalloon();
    }
  }

  updatePlayerHealthBar() {
    const healthPercent = this.playerHealth / this.playerMaxHealth;
    this.playerHealthBarFill.width = 34 * healthPercent;

    // Change color based on health
    if (healthPercent > 0.6) {
      this.playerHealthBarFill.setFillStyle(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      this.playerHealthBarFill.setFillStyle(0xffff00); // Yellow
    } else {
      this.playerHealthBarFill.setFillStyle(0xff0000); // Red
    }
  }

  playerDeath() {
    this.isGameOver = true;
    this.input.keyboard.enabled = false;
    this.isRunning = false;
    this.isProne = false;
    this.isProneActive = false;
    this.player.anims.stop();
    this.stopRunTween();

    // Show "Oh, no!" balloon
    const balloonX = this.player.x;
    const balloonY = this.player.y - this.player.height / 2 - 20;

    const balloon = this.add.graphics();
    balloon.fillStyle(0xffffff, 0.9);
    balloon.fillRoundedRect(-32, -12, 64, 24, 6);
    balloon.fillTriangle(-4, 12, 4, 12, 0, 18);
    balloon.x = balloonX;
    balloon.y = balloonY;
    balloon.setDepth(2000);

    const ohNoText = this.add.text(balloonX, balloonY, 'Oh, no!', {
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#cc0000',
    }).setOrigin(0.5, 0.5).setDepth(2001);

    // After balloon shows, play death animation
    this.time.delayedCall(1000, () => {
      balloon.destroy();
      ohNoText.destroy();

      // Switch to fallen sprite
      this.player.setTexture('player_fallen');
      this.player.setFlipX(!this.facingRight);

      // Hide health bar
      this.playerHealthBarBg.setVisible(false);
      this.playerHealthBarFill.setVisible(false);

      // Fade to black and show Game Over
      this.time.delayedCall(500, () => {
        this.showGameOver();
      });
    });
  }

  showGameOver() {
    // Create black overlay
    const overlay = this.add.rectangle(
      this.cameras.main.scrollX + this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x000000,
      0
    );
    overlay.setDepth(3000);
    overlay.setScrollFactor(0);

    // Fade in the overlay
    this.tweens.add({
      targets: overlay,
      alpha: 0.8,
      duration: 1000,
      onComplete: () => {
        // Show Game Over text with sinister style
        const gameOverText = this.add.text(
          this.screenWidth / 2,
          this.screenHeight / 2 - 30,
          'GAME OVER',
          {
            fontSize: '64px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'bold',
            fill: '#8b0000',
            stroke: '#000000',
            strokeThickness: 6,
          }
        );
        gameOverText.setOrigin(0.5, 0.5);
        gameOverText.setDepth(3001);
        gameOverText.setScrollFactor(0);
        gameOverText.setAlpha(0);

        // Subtitle
        const subtitleText = this.add.text(
          this.screenWidth / 2,
          this.screenHeight / 2 + 30,
          'The zombies got you...',
          {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fill: '#666666',
          }
        );
        subtitleText.setOrigin(0.5, 0.5);
        subtitleText.setDepth(3001);
        subtitleText.setScrollFactor(0);
        subtitleText.setAlpha(0);

        // Fade in Game Over text
        this.tweens.add({
          targets: gameOverText,
          alpha: 1,
          duration: 800,
          ease: 'Power2'
        });

        this.tweens.add({
          targets: subtitleText,
          alpha: 1,
          duration: 800,
          delay: 400,
          ease: 'Power2'
        });
      }
    });
  }

  showPlayerOuchBalloon() {
    // Create balloon above player
    const balloonX = this.player.x;
    const balloonY = this.player.y - this.player.height / 2 - 20;

    const balloon = this.add.graphics();
    balloon.fillStyle(0xffffff, 0.9);
    balloon.fillRoundedRect(-28, -12, 56, 24, 6);
    // Small triangle pointer
    balloon.fillTriangle(-4, 12, 4, 12, 0, 18);
    balloon.x = balloonX;
    balloon.y = balloonY;
    balloon.setDepth(2000);

    const ouchText = this.add.text(balloonX, balloonY, 'Ouch!', {
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#cc0000',
    }).setOrigin(0.5, 0.5).setDepth(2001);

    // Flash player red
    this.player.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      if (this.player.active) {
        this.player.clearTint();
      }
    });

    // Fade out balloon and destroy
    this.tweens.add({
      targets: [balloon, ouchText],
      alpha: 0,
      y: balloonY - 15,
      duration: 600,
      delay: 400,
      onComplete: () => {
        balloon.destroy();
        ouchText.destroy();
      }
    });
  }

  checkBulletZombieCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const bulletLeft = bullet.x - bullet.width / 2;
      const bulletRight = bullet.x + bullet.width / 2;
      const bulletY = bullet.y;

      for (let j = this.zombies.length - 1; j >= 0; j--) {
        const zombie = this.zombies[j];
        const zombieLeft = zombie.x - zombie.width / 2;
        const zombieRight = zombie.x + zombie.width / 2;
        const zombieTop = zombie.y - zombie.height / 2;
        const zombieBottom = zombie.y + zombie.height / 2;

        // Check horizontal overlap
        const horizontalOverlap = bulletRight > zombieLeft && bulletLeft < zombieRight;
        // Check vertical overlap (bullet Y within zombie bounds)
        const verticalOverlap = bulletY > zombieTop && bulletY < zombieBottom;

        if (horizontalOverlap && verticalOverlap) {
          // Hit! Reduce zombie health by bullet damage
          zombie.health -= bullet.damage;

          // Remove bullet
          bullet.destroy();
          this.bullets.splice(i, 1);

          if (zombie.health <= 0) {
            // Zombie dies - destroy health bar too
            zombie.healthBarBg.destroy();
            zombie.healthBarFill.destroy();
            zombie.destroy();
            this.zombies.splice(j, 1);
          } else {
            // Update health bar
            this.updateZombieHealthBar(zombie);

            // Flash zombie red briefly and stun
            zombie.setTint(0xff0000);
            zombie.stunned = true;

            // Cancel any attack in progress
            if (zombie.isAttacking) {
              zombie.isAttacking = false;
              zombie.attackTimer = 0;
              this.stopZombieAttackAnimation(zombie);
            }

            // Show "huh?" balloon
            this.showZombieHuhBalloon(zombie);

            this.time.delayedCall(100, () => {
              if (zombie.active) {
                zombie.clearTint();
              }
            });

            // Unstun after a delay
            this.time.delayedCall(600, () => {
              if (zombie.active) {
                zombie.stunned = false;
              }
            });
          }

          break;  // Bullet can only hit one zombie
        }
      }
    }
  }

  checkBulletWerewolfCollisions() {
    if (this.levelIndex !== 1) return;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const bulletLeft = bullet.x - bullet.width / 2;
      const bulletRight = bullet.x + bullet.width / 2;
      const bulletY = bullet.y;

      for (let j = this.werewolves.length - 1; j >= 0; j--) {
        const werewolf = this.werewolves[j];
        const wwLeft = werewolf.x - werewolf.width / 2;
        const wwRight = werewolf.x + werewolf.width / 2;
        const wwTop = werewolf.y - werewolf.height / 2;
        const wwBottom = werewolf.y + werewolf.height / 2;

        const horizontalOverlap = bulletRight > wwLeft && bulletLeft < wwRight;
        const verticalOverlap = bulletY > wwTop && bulletY < wwBottom;

        if (horizontalOverlap && verticalOverlap) {
          werewolf.health -= bullet.damage;

          bullet.destroy();
          this.bullets.splice(i, 1);

          if (werewolf.health <= 0) {
            werewolf.destroy();
            this.werewolves.splice(j, 1);
          } else if (bullet.texture.key === 'pellet') {
            this.startWerewolfRetreat(werewolf, this.werewolfSpriteSpacing * 4);
            werewolf.jumpCooldown = 1500 + Math.random() * 1500;
          }

          break;
        }
      }
    }
  }

  createPlayer() {
    const startX = 60;
    const startY = (this.playAreaTop + this.playAreaBottom) / 2;

    this.player = this.add.sprite(startX, startY, 'player_fists');

    // Create player health bar
    this.playerHealthBarBg = this.add.rectangle(startX, startY - this.player.height / 2 - 10, 36, 5, 0x000000);
    this.playerHealthBarBg.setDepth(1999);
    this.playerHealthBarFill = this.add.rectangle(startX - 17, startY - this.player.height / 2 - 10, 34, 3, 0x00ff00);
    this.playerHealthBarFill.setOrigin(0, 0.5);
    this.playerHealthBarFill.setDepth(2000);
  }

  createUI() {
    // Weapon icons in top left
    const iconY = 10;
    const iconSpacing = 40;

    // Background for weapon icons
    this.weaponIconBg = this.add.rectangle(10 + 60, iconY + 16, 130, 38, 0x000000, 0.5);
    this.weaponIconBg.setOrigin(0.5, 0.5);
    this.weaponIconBg.setDepth(1999);
    this.weaponIconBg.setScrollFactor(0);

    // Create weapon icons
    this.weaponIcons = {
      fists: this.add.image(10 + 16, iconY + 16, 'icon_fists'),
      gun: this.add.image(10 + 16 + iconSpacing, iconY + 16, 'icon_gun'),
      shotgun: this.add.image(10 + 16 + iconSpacing * 2, iconY + 16, 'icon_shotgun')
    };

    // Set up all icons
    Object.values(this.weaponIcons).forEach(icon => {
      icon.setDepth(2000);
      icon.setScrollFactor(0);
      icon.setAlpha(0.4);  // Inactive state
    });

    // Ammo count text next to each weapon icon
    this.ammoCountTexts = {
      fists: this.add.text(10 + 16 + 18, iconY + 18, '', {
        fontSize: '12px',
        fontStyle: 'bold',
        fill: '#e6e0c8',
        stroke: '#000000',
        strokeThickness: 2,
      }),
      gun: this.add.text(10 + 16 + iconSpacing + 18, iconY + 18, String(this.gunAmmo), {
        fontSize: '12px',
        fontStyle: 'bold',
        fill: '#e6e0c8',
        stroke: '#000000',
        strokeThickness: 2,
      }),
      shotgun: this.add.text(10 + 16 + iconSpacing * 2 + 18, iconY + 18, String(this.shotgunAmmo), {
        fontSize: '12px',
        fontStyle: 'bold',
        fill: '#e6e0c8',
        stroke: '#000000',
        strokeThickness: 2,
      }),
    };

    Object.values(this.ammoCountTexts).forEach(text => {
      text.setOrigin(0, 0.5);
      text.setDepth(2001);
      text.setScrollFactor(0);
    });

    // Highlight current weapon
    this.updateWeaponIcons();

    // Ammo display
    this.createAmmoDisplay();

    // Level controls removed (use U/I)
  }

  updateWeaponIcons() {
    // Reset all icons to inactive
    Object.values(this.weaponIcons).forEach(icon => {
      icon.setAlpha(0.4);
      icon.setScale(1);
      icon.clearTint();
    });

    // Highlight active weapon
    const activeIcon = this.weaponIcons[this.currentWeapon];
    if (activeIcon) {
      activeIcon.setAlpha(1);
      activeIcon.setScale(1.2);
      activeIcon.setTint(0xffff00);  // Yellow highlight
    }
  }

  createAmmoDisplay() {
    // Clear existing ammo icons
    this.ammoIcons.forEach(icon => icon.destroy());
    this.ammoIcons = [];

    const startX = 10;
    const startY = 52;
    const iconSpacing = 14;

    if (this.currentWeapon === 'fists') {
      // Fists have no ammo - nothing to display
    } else if (this.currentWeapon === 'gun') {
      // Display bullet icons for gun ammo
      for (let i = 0; i < this.gunAmmo; i++) {
        const icon = this.add.image(startX + i * iconSpacing, startY, 'bullet_icon');
        icon.setOrigin(0, 0);
        icon.setDepth(2000);
        icon.setScrollFactor(0);
        this.ammoIcons.push(icon);
      }
    } else if (this.currentWeapon === 'shotgun') {
      // Display shell icons for shotgun ammo
      for (let i = 0; i < this.shotgunAmmo; i++) {
        const icon = this.add.image(startX + i * iconSpacing, startY, 'shell_icon');
        icon.setOrigin(0, 0);
        icon.setDepth(2000);
        icon.setScrollFactor(0);
        this.ammoIcons.push(icon);
      }
    }

    this.updateAmmoCountText();
  }

  updateAmmoDisplay() {
    this.createAmmoDisplay();
  }

  updateAmmoCountText() {
    if (this.ammoCountTexts.fists) {
      this.ammoCountTexts.fists.setText('');
    }
    if (this.ammoCountTexts.gun) {
      this.ammoCountTexts.gun.setText(String(this.gunAmmo));
    }
    if (this.ammoCountTexts.shotgun) {
      this.ammoCountTexts.shotgun.setText(String(this.shotgunAmmo));
    }
  }

  getIdleTextureForWeapon() {
    if (this.currentWeapon === 'gun') {
      return 'player_gun';
    }
    if (this.currentWeapon === 'shotgun') {
      return 'player_shotgun';
    }
    return 'player_fists';
  }

  setPlayerTextureForWeapon() {
    const idleTexture = this.getIdleTextureForWeapon();
    if (this.isProne) {
      this.preProneTexture = idleTexture;
      return;
    }

    this.player.setTexture(idleTexture);
    this.player.setFlipX(!this.facingRight);
  }

  getRunAnimationKey() {
    if (this.currentWeapon === 'gun') {
      return 'player_run_gun';
    }
    if (this.currentWeapon === 'shotgun') {
      return 'player_run_shotgun';
    }
    return 'player_run_fists';
  }

  getUpTextureSequence() {
    if (this.preFallTexture === 'player_gun') {
      return ['player_gun_getup1', 'player_gun_getup2', 'player_gun'];
    }
    if (this.preFallTexture === 'player_shotgun') {
      return ['player_shotgun_getup1', 'player_shotgun_getup2', 'player_shotgun'];
    }
    return ['player_fists_getup1', 'player_fists_getup2', 'player_fists'];
  }

  startProne() {
    if (this.isGameOver || this.isFallen || this.isProne) return;

    this.isProne = true;
    this.isProneActive = false;
    this.isRunning = false;
    this.player.anims.stop();
    this.stopRunTween();

    this.preProneTexture = this.getIdleTextureForWeapon();
    this.proneStandY = this.player.y;

    if (this.proneTween) {
      this.proneTween.stop();
    }

    this.proneTween = this.tweens.add({
      targets: this.player,
      y: this.proneStandY + this.proneOffsetY,
      scaleY: 0.85,
      duration: 120,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.player.setTexture('player_fallen');
        this.player.setFlipX(!this.facingRight);
        this.player.setScale(1, 1);
        this.isProneActive = true;
        this.proneTween = null;
      }
    });
  }

  stopProne() {
    if (this.isGameOver || this.isFallen || !this.isProne) return;

    if (this.proneTween) {
      this.proneTween.stop();
    }

    const standY = this.proneStandY ?? this.player.y - this.proneOffsetY;
    const standTexture = this.preProneTexture || this.getIdleTextureForWeapon();
    this.player.setTexture(standTexture);
    this.player.setFlipX(!this.facingRight);
    this.player.setScale(1, 0.85);
    this.isProneActive = false;

    this.proneTween = this.tweens.add({
      targets: this.player,
      y: standY,
      scaleY: 1,
      duration: 640,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.player.setScale(1, 1);
        this.isProne = false;
        this.preProneTexture = null;
        this.proneTween = null;
      }
    });
  }

  startRunTween() {
    if (this.runTween) return;
    this.runTween = this.tweens.add({
      targets: this.player,
      scaleX: 1.02,
      scaleY: 0.98,
      duration: 160,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopRunTween() {
    if (!this.runTween) return;
    this.runTween.stop();
    this.runTween = null;
    this.player.setScale(1, 1);
  }

  updatePlayerRunState(isMoving) {
    if (this.isGameOver || this.isFallen) return;
    if (this.isProne) {
      if (this.isRunning) {
        this.isRunning = false;
      }
      this.player.anims.stop();
      this.stopRunTween();
      return;
    }

    if (isMoving) {
      this.isRunning = true;
      const runKey = this.getRunAnimationKey();
      if (!this.player.anims.currentAnim || this.player.anims.currentAnim.key !== runKey || !this.player.anims.isPlaying) {
        this.player.anims.play(runKey, true);
      }
      this.startRunTween();
    } else if (this.isRunning) {
      this.isRunning = false;
      this.player.anims.stop();
      this.player.setTexture(this.getIdleTextureForWeapon());
      this.stopRunTween();
    }
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Weapon selection
    this.input.keyboard.on('keydown-ONE', () => {
      if (this.isGameOver) return;
      this.currentWeapon = 'fists';
      this.setPlayerTextureForWeapon();
      this.updateWeaponIcons();
      this.updateAmmoDisplay();
      if (this.isRunning) {
        this.player.anims.play(this.getRunAnimationKey(), true);
      }
    });

    this.input.keyboard.on('keydown-TWO', () => {
      if (this.isGameOver) return;
      this.currentWeapon = 'gun';
      this.setPlayerTextureForWeapon();
      this.updateWeaponIcons();
      this.updateAmmoDisplay();
      if (this.isRunning) {
        this.player.anims.play(this.getRunAnimationKey(), true);
      }
    });

    this.input.keyboard.on('keydown-THREE', () => {
      if (this.isGameOver) return;
      this.currentWeapon = 'shotgun';
      this.setPlayerTextureForWeapon();
      this.updateWeaponIcons();
      this.updateAmmoDisplay();
      if (this.isRunning) {
        this.player.anims.play(this.getRunAnimationKey(), true);
      }
    });

    // Shooting
    this.input.keyboard.on('keydown-SPACE', () => {
      this.shoot();
    });
    this.input.keyboard.on('keydown-Z', () => {
      this.shoot();
    });
    this.input.keyboard.on('keydown-X', () => {
      this.startProne();
    });
    this.input.keyboard.on('keyup-X', () => {
      this.stopProne();
    });
    this.input.keyboard.on('keydown-P', () => {
      this.togglePause();
    });
    this.input.keyboard.on('keydown-U', () => {
      this.changeLevel(-1);
    });
    this.input.keyboard.on('keydown-I', () => {
      this.changeLevel(1);
    });
  }

  changeLevel(delta) {
    if (this.levelTransitioning) return;
    if (this.isPaused) return;

    const nextLevel = this.levelIndex + delta;
    if (nextLevel < 0 || nextLevel > 1) return;

    this.levelTransitioning = true;
    this.input.keyboard.enabled = false;
    this.player.anims.stop();
    this.stopRunTween();
    this.scene.restart({ levelIndex: nextLevel });
  }

  togglePause() {
    if (this.levelTransitioning) return;
    if (this.isGameOver) return;

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.player.anims.stop();
      this.stopRunTween();
      this.pauseText = this.add.text(
        this.screenWidth / 2,
        this.screenHeight / 2 - 80,
        'PAUSED',
        {
          fontSize: '48px',
          fontFamily: 'Georgia, serif',
          fontStyle: 'bold',
          fill: '#dddddd',
          stroke: '#000000',
          strokeThickness: 6,
        }
      );
      this.pauseText.setOrigin(0.5, 0.5);
      this.pauseText.setDepth(3500);
      this.pauseText.setScrollFactor(0);
    } else if (this.pauseText) {
      this.pauseText.destroy();
      this.pauseText = null;
    }
  }

  shoot() {
    if (this.isGameOver || this.isPaused || !this.canShoot || this.isFallen || (this.isProne && !this.isProneActive)) return;

    // Check if we have ammo (fists don't need ammo)
    if (this.currentWeapon === 'gun' && this.gunAmmo <= 0) {
      this.showOutOfAmmo();
      return;
    }
    if (this.currentWeapon === 'shotgun' && this.shotgunAmmo <= 0) {
      this.showOutOfAmmo();
      return;
    }

    this.canShoot = false;
    const cooldown = this.currentWeapon === 'fists' ? this.punchCooldown : this.shootCooldown;
    this.time.delayedCall(cooldown, () => {
      this.canShoot = true;
    });

    let attackX = this.player.x;
    let attackY = this.player.y;
    let bulletVX = null;
    let bulletVY = null;

    if (this.isProneActive) {
      attackY = this.player.y - this.player.height / 2;
      bulletVX = 0;
      bulletVY = -this.bulletSpeed;
    } else {
      const offsetX = this.facingRight ? this.player.width / 2 : -this.player.width / 2;
      attackX = this.player.x + offsetX;
    }

    if (this.currentWeapon === 'fists') {
      // Melee punch attack
      if (!this.isProneActive) {
        this.performPunch(attackX, attackY);
      }
    } else if (this.currentWeapon === 'gun') {
      // Single bullet
      this.createBullet(attackX, attackY, 'bullet', this.gunDamage, bulletVX, bulletVY);
      this.gunAmmo--;
      this.updateAmmoDisplay();
    } else if (this.currentWeapon === 'shotgun') {
      // Three pellets at different heights
      if (this.isProneActive) {
        this.createBullet(attackX - 8, attackY, 'pellet', this.shotgunDamage, bulletVX, bulletVY);
        this.createBullet(attackX, attackY, 'pellet', this.shotgunDamage, bulletVX, bulletVY);
        this.createBullet(attackX + 8, attackY, 'pellet', this.shotgunDamage, bulletVX, bulletVY);
      } else {
        this.createBullet(attackX, attackY - 20, 'pellet', this.shotgunDamage, bulletVX, bulletVY);
        this.createBullet(attackX, attackY, 'pellet', this.shotgunDamage, bulletVX, bulletVY);
        this.createBullet(attackX, attackY + 20, 'pellet', this.shotgunDamage, bulletVX, bulletVY);
      }
      this.shotgunAmmo--;
      this.updateAmmoDisplay();

      // Check if on dirt - 40% chance to fall from shotgun recoil
      if (!this.isProneActive && this.isPlayerOnDirt() && Math.random() < this.fallChance) {
        this.playerFall();
      }
    }
  }

  performPunch(x, y) {
    // Create punch effect
    const punchEffect = this.add.sprite(x + (this.facingRight ? 15 : -15), y, 'punch_effect');
    punchEffect.setDepth(1500);
    punchEffect.setFlipX(!this.facingRight);

    // Animate and destroy
    this.tweens.add({
      targets: punchEffect,
      alpha: 0,
      scale: 1.5,
      duration: 150,
      onComplete: () => {
        punchEffect.destroy();
      }
    });

    // Check for zombie hits in melee range
    const punchRange = 40;
    const punchLeft = x - punchRange / 2;
    const punchRight = x + punchRange / 2;

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];
      const zombieLeft = zombie.x - zombie.width / 2;
      const zombieRight = zombie.x + zombie.width / 2;
      const zombieTop = zombie.y - zombie.height / 2;
      const zombieBottom = zombie.y + zombie.height / 2;

      // Check if zombie is in punch range
      const horizontalOverlap = punchRight > zombieLeft && punchLeft < zombieRight;
      const verticalOverlap = y > zombieTop && y < zombieBottom;
      // Also check depth (Y position) for 2.5D
      const depthOverlap = Math.abs((this.player.y + this.player.height / 2) - zombie.footY) < this.depthTolerance + 10;

      if (horizontalOverlap && verticalOverlap && depthOverlap) {
        // Hit! Apply fist damage
        zombie.health -= this.fistDamage;

        if (zombie.health <= 0) {
          // Zombie dies - destroy health bar too
          zombie.healthBarBg.destroy();
          zombie.healthBarFill.destroy();
          zombie.destroy();
          this.zombies.splice(i, 1);
        } else {
          // Update health bar
          this.updateZombieHealthBar(zombie);

          // Flash zombie red briefly and apply knockback
          zombie.setTint(0xff0000);
          zombie.stunned = true;

          // Cancel any attack in progress
          if (zombie.isAttacking) {
            zombie.isAttacking = false;
            zombie.attackTimer = 0;
            this.stopZombieAttackAnimation(zombie);
          }

          // Apply knockback velocity (push away from player)
          const knockbackSpeed = 150;
          const dx = zombie.x - this.player.x;
          const dy = zombie.y - this.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          zombie.knockbackVelocityX = (dx / dist) * knockbackSpeed;
          zombie.knockbackVelocityY = (dy / dist) * knockbackSpeed * 0.3; // Less vertical knockback

          this.time.delayedCall(100, () => {
            if (zombie.active) {
              zombie.clearTint();
            }
          });

          // Unstun and stop knockback after a delay
          this.time.delayedCall(300, () => {
            if (zombie.active) {
              zombie.stunned = false;
              zombie.knockbackVelocityX = 0;
              zombie.knockbackVelocityY = 0;
            }
          });
        }
      }
    }

    // Chance to fall if punching on dirt/mud
    if (this.isPlayerOnDirt() && Math.random() < 0.15) {
      this.playerFall();
    }
  }

  showOutOfAmmo() {
    // Create balloon background
    const balloonX = this.player.x;
    const balloonY = this.player.y - this.player.height / 2 - 20;

    const balloon = this.add.graphics();
    balloon.fillStyle(0xffffff, 0.9);
    balloon.fillRoundedRect(-24, -12, 48, 24, 6);
    // Small triangle pointer
    balloon.fillTriangle(-4, 12, 4, 12, 0, 18);
    balloon.x = balloonX;
    balloon.y = balloonY;
    balloon.setDepth(2000);

    const clickText = this.add.text(balloonX, balloonY, 'click', {
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#cc0000',
    }).setOrigin(0.5, 0.5).setDepth(2001);

    // Fade out and destroy after 1 second
    this.tweens.add({
      targets: [balloon, clickText],
      alpha: 0,
      y: balloonY - 10,
      duration: 800,
      delay: 200,
      onComplete: () => {
        balloon.destroy();
        clickText.destroy();
      }
    });
  }

  showZombieHuhBalloon(zombie) {
    // Create balloon above zombie
    const balloonX = zombie.x;
    const balloonY = zombie.y - zombie.height / 2 - 15;

    const balloon = this.add.graphics();
    balloon.fillStyle(0xffffff, 0.9);
    balloon.fillRoundedRect(-20, -10, 40, 20, 5);
    // Small triangle pointer
    balloon.fillTriangle(-3, 10, 3, 10, 0, 15);
    balloon.x = balloonX;
    balloon.y = balloonY;
    balloon.setDepth(2000);

    const huhText = this.add.text(balloonX, balloonY, 'huh?', {
      fontSize: '12px',
      fontStyle: 'bold',
      fill: '#333333',
    }).setOrigin(0.5, 0.5).setDepth(2001);

    // Fade out and destroy
    this.tweens.add({
      targets: [balloon, huhText],
      alpha: 0,
      y: balloonY - 8,
      duration: 400,
      delay: 200,
      onComplete: () => {
        balloon.destroy();
        huhText.destroy();
      }
    });
  }

  createBullet(x, y, texture, damage, velocityX = null, velocityY = null) {
    const bullet = this.add.sprite(x, y, texture);
    bullet.setDepth(900);
    if (velocityX === null) {
      bullet.vx = this.bulletSpeed * (this.facingRight ? 1 : -1);
      bullet.vy = 0;
      bullet.setFlipX(!this.facingRight);
    } else {
      bullet.vx = velocityX;
      bullet.vy = velocityY ?? 0;
      if (bullet.vx === 0 && bullet.vy < 0 && texture === 'bullet') {
        bullet.setRotation(-Math.PI / 2);
      }
    }
    bullet.damage = damage;
    this.bullets.push(bullet);
  }

  updateBullets(delta) {
    const deltaSeconds = delta / 1000;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx * deltaSeconds;
      bullet.y += bullet.vy * deltaSeconds;

      // Remove bullets that go off level bounds
      if (bullet.x > this.levelWidth + 20 || bullet.x < -20 || bullet.y < -20 || bullet.y > this.screenHeight + 20) {
        bullet.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }

  getPlayerBounds() {
    return {
      left: this.player.x - this.player.width / 2,
      right: this.player.x + this.player.width / 2,
      top: this.player.y - this.player.height / 2,
      bottom: this.player.y + this.player.height / 2,
    };
  }

  getObstacleBounds(obstacle) {
    return {
      left: obstacle.x - obstacle.width / 2,
      right: obstacle.x + obstacle.width / 2,
      footY: obstacle.footY,
    };
  }

  checkDepthCollision(newX, newY) {
    const playerFoot = newY + this.player.height / 2;
    const playerLeft = newX - this.player.width / 2;
    const playerRight = newX + this.player.width / 2;

    for (const obstacle of this.obstacles) {
      const obs = this.getObstacleBounds(obstacle);

      // Check if horizontally overlapping
      const horizontalOverlap = playerRight > obs.left && playerLeft < obs.right;

      // Check if at same depth (feet Y positions are close)
      const depthOverlap = Math.abs(playerFoot - obs.footY) < this.depthTolerance;

      if (horizontalOverlap && depthOverlap) {
        return obstacle;
      }
    }
    return null;
  }

  update(time, delta) {
    if (!this.player) return;

    if (!this.levelTransitioning && this.levelIndex === 0 && this.player.x >= this.levelWidth - 40) {
      this.levelTransitioning = true;
      this.input.keyboard.enabled = false;
      this.player.anims.stop();
      this.stopRunTween();
      this.showForestSign();
      return;
    }

    if (this.levelTransitioning) {
      return;
    }

    if (this.isPaused) {
      return;
    }

    // Update bullets
    this.updateBullets(delta);

    // Update dirt particles
    this.updateDirtParticles(delta);

    // Update zombies
    this.updateZombies(delta);

    // Check bullet-zombie collisions
    this.checkBulletZombieCollisions();
    this.checkBulletWerewolfCollisions();

    // Update werewolves
    this.updateWerewolves(delta);

    // If fallen or prone, don't allow movement
    if (this.isFallen || this.isProne) {
      return;
    }

    // Check if player is over a pit
    const currentPit = this.isPlayerOverPit();
    let speedMultiplier = 1;

    if (currentPit) {
      speedMultiplier = this.pitSpeedMultiplier;

      // Spawn dirt particles periodically
      if (time - this.lastDirtSpawn > this.dirtSpawnInterval) {
        this.spawnDirtParticle(currentPit);
        this.lastDirtSpawn = time;
      }
    }

    const playerBottom = this.player.y + this.player.height / 2;
    const atTopBoundary = playerBottom <= this.playAreaTop;
    const atBottomBoundary = playerBottom >= this.playAreaBottom;

    // Calculate desired velocity (with pit slowdown)
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      vx = -this.playerSpeed * speedMultiplier;
      this.facingRight = false;
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      vx = this.playerSpeed * speedMultiplier;
      this.facingRight = true;
      this.player.setFlipX(false);
    }

    if ((this.cursors.up.isDown || this.wasd.up.isDown) && !atTopBoundary) {
      vy = -this.playerSpeed * speedMultiplier;
    } else if ((this.cursors.down.isDown || this.wasd.down.isDown) && !atBottomBoundary) {
      vy = this.playerSpeed * speedMultiplier;
    }

    const isMoving = vx !== 0 || vy !== 0;
    this.updatePlayerRunState(isMoving);

    // Calculate new position
    const deltaSeconds = delta / 1000;
    let newX = this.player.x + vx * deltaSeconds;
    let newY = this.player.y + vy * deltaSeconds;

    // Check collision at new position
    const collision = this.checkDepthCollision(newX, newY);

    if (collision) {
      // Try moving only horizontally
      const hCollision = this.checkDepthCollision(newX, this.player.y);
      // Try moving only vertically
      const vCollision = this.checkDepthCollision(this.player.x, newY);

      if (!hCollision) {
        newX = newX;
        newY = this.player.y;
      } else if (!vCollision) {
        newX = this.player.x;
        newY = newY;
      } else {
        // Can't move at all
        newX = this.player.x;
        newY = this.player.y;
      }
    }

    // Apply boundary constraints
    const newBottom = newY + this.player.height / 2;
    if (newBottom < this.playAreaTop) {
      newY = this.playAreaTop - this.player.height / 2;
    }
    if (newBottom > this.playAreaBottom) {
      newY = this.playAreaBottom - this.player.height / 2;
    }

    // Keep player in level bounds horizontally
    const halfWidth = this.player.width / 2;
    if (newX < halfWidth) newX = halfWidth;
    if (newX > this.levelWidth - halfWidth) newX = this.levelWidth - halfWidth;

    // Update position
    this.player.x = newX;
    this.player.y = newY;

    // Update depth based on Y position for proper layering
    this.player.setDepth(this.player.y + this.player.height / 2);

    // Update player health bar position
    this.playerHealthBarBg.x = this.player.x;
    this.playerHealthBarBg.y = this.player.y - this.player.height / 2 - 10;
    this.playerHealthBarBg.setDepth(this.player.depth + 1);
    this.playerHealthBarFill.x = this.player.x - 17;
    this.playerHealthBarFill.y = this.player.y - this.player.height / 2 - 10;
    this.playerHealthBarFill.setDepth(this.player.depth + 2);
  }
}

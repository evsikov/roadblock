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
  }

  preload() {
    this.createTextures();
  }

  createPlayerSprite(graphics, textureName, isGun) {
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
    graphics.fillStyle(skin, 1);
    graphics.fillRect(12, 44, 6, 8);  // Left leg
    graphics.fillRect(20, 44, 6, 8);  // Right leg
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(12, 44, 2, 8);
    graphics.fillRect(24, 44, 2, 8);

    // Boots
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(11, 48, 8, 4);
    graphics.fillRect(19, 48, 8, 4);

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

  createPlayerFistsSprite(graphics) {
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
    graphics.fillStyle(skin, 1);
    graphics.fillRect(12, 44, 6, 8);
    graphics.fillRect(20, 44, 6, 8);
    graphics.fillStyle(skinDark, 1);
    graphics.fillRect(12, 44, 2, 8);
    graphics.fillRect(24, 44, 2, 8);

    // Boots
    graphics.fillStyle(clothDark, 1);
    graphics.fillRect(11, 48, 8, 4);
    graphics.fillRect(19, 48, 8, 4);

    graphics.generateTexture('player_fists', w, h);
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

  createTextures() {
    const graphics = this.add.graphics();

    // Create muscled girl with fists texture
    this.createPlayerFistsSprite(graphics);

    // Create muscled girl with gun texture
    this.createPlayerSprite(graphics, 'player_gun', true);

    // Create muscled girl with shotgun texture
    this.createPlayerSprite(graphics, 'player_shotgun', false);

    // Create fallen player texture (lying down)
    this.createFallenSprite(graphics);

    // Create zombie texture
    this.createZombieSprite(graphics);

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

    this.createLevel();
    this.createDirtStreams();
    this.createObstacles();
    this.createZombies();
    this.createPlayer();
    this.createUI();
    this.setupInput();
    this.setupCamera();
  }

  setupCamera() {
    // Camera follows player
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.screenHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  createLevel() {
    const height = this.screenHeight;

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

    // Create tiled ground across the entire level
    for (let x = 0; x < this.levelWidth; x += 32) {
      // Corn field (top area) - darker for night
      for (let y = 280; y < this.playAreaTop; y += 32) {
        this.add.image(x + 16, y + 16, 'grass').setTint(0x1a3010).setDepth(-10);
      }

      // Sandy road (middle play area) - darker for night
      for (let y = this.playAreaTop; y < this.playAreaBottom; y += 32) {
        this.add.image(x + 16, y + 16, 'sand').setTint(0x6a5040).setDepth(-10);
      }

      // Grass field (bottom area) - darker for night
      for (let y = this.playAreaBottom; y < height; y += 32) {
        this.add.image(x + 16, y + 16, 'grass').setTint(0x1a3510).setDepth(-10);
      }
    }

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

    // Road edge markers across entire level
    this.add.rectangle(this.levelWidth / 2, this.playAreaTop, this.levelWidth, 4, 0x4a3a25)
      .setOrigin(0.5, 0.5)
      .setDepth(-5);
    this.add.rectangle(this.levelWidth / 2, this.playAreaBottom, this.levelWidth, 4, 0x2a4a15)
      .setOrigin(0.5, 0.5)
      .setDepth(-5);
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

      // Create health bar
      zombie.healthBarBg = this.add.rectangle(x, y - zombie.height / 2 - 8, 30, 4, 0x000000);
      zombie.healthBarBg.setDepth(zombie.footY + 1);
      zombie.healthBarFill = this.add.rectangle(x - 14, y - zombie.height / 2 - 8, 28, 2, 0x00ff00);
      zombie.healthBarFill.setOrigin(0, 0.5);  // Left-aligned
      zombie.healthBarFill.setDepth(zombie.footY + 2);

      this.zombies.push(zombie);
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

    // Store current texture to restore later
    if (this.currentWeapon === 'fists') {
      this.preFallTexture = 'player_fists';
    } else if (this.currentWeapon === 'gun') {
      this.preFallTexture = 'player_gun';
    } else {
      this.preFallTexture = 'player_shotgun';
    }

    // Switch to fallen texture
    this.player.setTexture('player_fallen');
    this.player.setFlipX(!this.facingRight);

    // Schedule getting up
    this.time.delayedCall(this.fallDuration, () => {
      this.getUp();
    });
  }

  getUp() {
    this.isFallen = false;

    // Restore previous texture
    this.player.setTexture(this.preFallTexture);
    this.player.setFlipX(!this.facingRight);
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

    for (const zombie of this.zombies) {
      // If stunned, apply knockback instead of following player
      if (zombie.stunned) {
        // Apply knockback movement
        if (zombie.knockbackVelocityX !== 0 || zombie.knockbackVelocityY !== 0) {
          zombie.x += zombie.knockbackVelocityX * deltaSeconds;
          zombie.y += zombie.knockbackVelocityY * deltaSeconds;

          // Decay knockback velocity
          zombie.knockbackVelocityX *= 0.9;
          zombie.knockbackVelocityY *= 0.9;
        }
      } else {
        // Calculate direction to player
        const dx = playerX - zombie.x;
        const dy = playerY - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {  // Only move if not too close
          // Normalize and apply speed
          const vx = (dx / distance) * this.zombieSpeed * deltaSeconds;
          const vy = (dy / distance) * this.zombieSpeed * deltaSeconds;

          // Update position
          zombie.x += vx;
          zombie.y += vy;

          // Update facing direction
          zombie.facingRight = dx > 0;
          zombie.setFlipX(!zombie.facingRight);
        }
      }

      // Keep within play area bounds (applies to both stunned and normal movement)
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

  createPlayer() {
    const startX = 60;
    const startY = (this.playAreaTop + this.playAreaBottom) / 2;

    this.player = this.add.sprite(startX, startY, 'player_fists');
  }

  createUI() {
    // Weapon display - fixed to camera
    this.weaponText = this.add.text(10, 10, 'Weapon: Fists [1]', {
      fontSize: '16px',
      fill: '#fff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setDepth(2000).setScrollFactor(0);

    this.add.text(10, 40, 'Space: Attack | 1: Fists | 2: Gun | 3: Shotgun', {
      fontSize: '12px',
      fill: '#aaa',
    }).setDepth(2000).setScrollFactor(0);

    // Ammo display
    this.createAmmoDisplay();
  }

  createAmmoDisplay() {
    // Clear existing ammo icons
    this.ammoIcons.forEach(icon => icon.destroy());
    this.ammoIcons = [];

    const startX = 10;
    const startY = 70;
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
  }

  updateAmmoDisplay() {
    this.createAmmoDisplay();
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
      this.currentWeapon = 'fists';
      this.weaponText.setText('Weapon: Fists [1]');
      this.player.setTexture('player_fists');
      this.player.setFlipX(!this.facingRight);
      this.updateAmmoDisplay();
    });

    this.input.keyboard.on('keydown-TWO', () => {
      this.currentWeapon = 'gun';
      this.weaponText.setText('Weapon: Gun [2]');
      this.player.setTexture('player_gun');
      this.player.setFlipX(!this.facingRight);
      this.updateAmmoDisplay();
    });

    this.input.keyboard.on('keydown-THREE', () => {
      this.currentWeapon = 'shotgun';
      this.weaponText.setText('Weapon: Shotgun [3]');
      this.player.setTexture('player_shotgun');
      this.player.setFlipX(!this.facingRight);
      this.updateAmmoDisplay();
    });

    // Shooting
    this.input.keyboard.on('keydown-SPACE', () => {
      this.shoot();
    });
  }

  shoot() {
    if (!this.canShoot || this.isFallen) return;

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

    // Spawn attack on the side the player is facing
    const offsetX = this.facingRight ? this.player.width / 2 : -this.player.width / 2;
    const attackX = this.player.x + offsetX;
    const attackY = this.player.y;

    if (this.currentWeapon === 'fists') {
      // Melee punch attack
      this.performPunch(attackX, attackY);
    } else if (this.currentWeapon === 'gun') {
      // Single bullet
      this.createBullet(attackX, attackY, 'bullet', this.gunDamage);
      this.gunAmmo--;
      this.updateAmmoDisplay();
    } else if (this.currentWeapon === 'shotgun') {
      // Three pellets at different heights
      this.createBullet(attackX, attackY - 20, 'pellet', this.shotgunDamage);
      this.createBullet(attackX, attackY, 'pellet', this.shotgunDamage);
      this.createBullet(attackX, attackY + 20, 'pellet', this.shotgunDamage);
      this.shotgunAmmo--;
      this.updateAmmoDisplay();

      // Check if on dirt - 40% chance to fall from shotgun recoil
      if (this.isPlayerOnDirt() && Math.random() < this.fallChance) {
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

  createBullet(x, y, texture, damage) {
    const bullet = this.add.sprite(x, y, texture);
    bullet.setDepth(900);
    bullet.direction = this.facingRight ? 1 : -1;
    bullet.setFlipX(!this.facingRight);
    bullet.damage = damage;
    this.bullets.push(bullet);
  }

  updateBullets(delta) {
    const deltaSeconds = delta / 1000;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += this.bulletSpeed * bullet.direction * deltaSeconds;

      // Remove bullets that go off level bounds
      if (bullet.x > this.levelWidth + 20 || bullet.x < -20) {
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

    // Update bullets
    this.updateBullets(delta);

    // Update dirt particles
    this.updateDirtParticles(delta);

    // Update zombies
    this.updateZombies(delta);

    // Check bullet-zombie collisions
    this.checkBulletZombieCollisions();

    // If fallen, don't allow movement
    if (this.isFallen) {
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
  }
}

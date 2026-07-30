import * as THREE from 'three';
import { LANES, Character } from './Character';
import { ParticleSystem } from './ParticleSystem';
import { AudioManager } from '../audio/AudioManager';

export type PowerUpType = 'MAGNET' | 'SHIELD' | 'BOOST' | 'MULTIPLIER' | 'FLY';

export interface Coin {
  id: string;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  chunkZ: number;
  active: boolean;
}

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  group: THREE.Group;
  position: THREE.Vector3;
  chunkZ: number;
  active: boolean;
}

export class PowerUpManager {
  private scene: THREE.Scene;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;

  private coinPool: Coin[] = [];
  private powerUpPool: PowerUpItem[] = [];

  // Coin Material
  private coinGeo: THREE.CylinderGeometry;
  private coinMat: THREE.MeshStandardMaterial;

  // Active Power-Up 10-Second Timers
  public magnetTimer: number = 0;
  public shieldTimer: number = 0;
  public boostTimer: number = 0;
  public flyTimer: number = 0;
  public multiplierTimer: number = 0;

  public coinsCollectedCount: number = 0;

  public get shieldActive(): boolean {
    return this.shieldTimer > 0;
  }

  constructor(scene: THREE.Scene, particleSystem: ParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.audioManager = AudioManager.getInstance();

    // Gold Coin Geometry & PBR Material
    this.coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff9900,
      emissiveIntensity: 1.5,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Spawns coins on ground (y = 0.5), jump arcs over barriers (y = 1.8), and flying trails (y = 4.2).
   */
  public spawnCollectiblesForChunk(chunkZ: number): void {
    const patternType = Math.floor(Math.random() * 4);
    const lane = Math.floor(Math.random() * 3);

    if (patternType === 0) {
      // Straight Road Trail (5 coins on road surface)
      for (let i = 0; i < 5; i++) {
        const z = chunkZ - (4 + i * 4);
        this.spawnCoin(LANES[lane], 0.5, z, chunkZ);
      }
    } else if (patternType === 1) {
      // Jump Arc Coins over low barriers (5 coins ascending to y = 1.8)
      for (let i = 0; i < 5; i++) {
        const z = chunkZ - (4 + i * 4);
        const y = 0.5 + Math.sin((i / 4) * Math.PI) * 1.3; // Arc up to y = 1.8
        this.spawnCoin(LANES[lane], y, z, chunkZ);
      }
    } else if (patternType === 2) {
      // Flying Sky Coin Trail (6 coins at y = 4.2 for Flying Jetpack Booster)
      for (let i = 0; i < 6; i++) {
        const z = chunkZ - (3 + i * 4);
        this.spawnCoin(LANES[lane], 4.2, z, chunkZ);
      }
    } else {
      // Parallel Road Ground Trail (8 coins on road surface)
      const laneA = (lane + 1) % 3;
      for (let i = 0; i < 4; i++) {
        const z = chunkZ - (5 + i * 5);
        this.spawnCoin(LANES[lane], 0.5, z, chunkZ);
        this.spawnCoin(LANES[laneA], 0.5, z, chunkZ);
      }
    }

    // 40% Chance to spawn a Power-Up Item on this chunk
    if (Math.random() < 0.4) {
      const types: PowerUpType[] = ['MAGNET', 'SHIELD', 'BOOST', 'FLY', 'MULTIPLIER'];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      const powerUpLane = Math.floor(Math.random() * 3);
      this.spawnPowerUp(selectedType, LANES[powerUpLane], 0.8, chunkZ - 15, chunkZ);
    }
  }

  private spawnCoin(x: number, y: number, z: number, chunkZ: number): void {
    let coin = this.coinPool.find((c) => !c.active);
    if (!coin) {
      const mesh = new THREE.Mesh(this.coinGeo, this.coinMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.castShadow = true;
      this.scene.add(mesh);

      coin = {
        id: `coin_${Date.now()}_${Math.random()}`,
        mesh,
        position: new THREE.Vector3(),
        chunkZ,
        active: false,
      };
      this.coinPool.push(coin);
    }

    coin.position.set(x, y, z);
    coin.mesh.position.copy(coin.position);
    coin.mesh.visible = true;
    coin.chunkZ = chunkZ;
    coin.active = true;
  }

  private spawnPowerUp(
    type: PowerUpType,
    x: number,
    y: number,
    z: number,
    chunkZ: number
  ): void {
    let item = this.powerUpPool.find((p) => !p.active && p.type === type);
    if (!item) {
      const group = new THREE.Group();
      this.buildPowerUpMesh(group, type);
      this.scene.add(group);

      item = {
        id: `pw_${type}_${Date.now()}_${Math.random()}`,
        type,
        group,
        position: new THREE.Vector3(),
        chunkZ,
        active: false,
      };
      this.powerUpPool.push(item);
    }

    item.position.set(x, y, z);
    item.group.position.copy(item.position);
    item.group.visible = true;
    item.chunkZ = chunkZ;
    item.active = true;
  }

  private buildPowerUpMesh(group: THREE.Group, type: PowerUpType): void {
    let color = 0xef4444;
    let emissive = 0xef4444;

    switch (type) {
      case 'MAGNET':
        color = 0x3b82f6; // Blue
        emissive = 0x2563eb;
        break;
      case 'SHIELD':
        color = 0x06b6d4; // Cyan
        emissive = 0x0891b2;
        break;
      case 'BOOST':
        color = 0xeab308; // Yellow
        emissive = 0xca8a04;
        break;
      case 'FLY':
        color = 0x10b981; // Emerald Green Jetpack
        emissive = 0x059669;
        break;
      case 'MULTIPLIER':
        color = 0xa855f7; // Purple
        emissive = 0x9333ea;
        break;
    }

    const coreGeo = new THREE.OctahedronGeometry(0.55, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 2.2,
      metalness: 0.8,
      roughness: 0.2,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.castShadow = true;
    group.add(core);

    // Outer Ring Accent
    const ringGeo = new THREE.TorusGeometry(0.75, 0.06, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: color,
      emissiveIntensity: 1.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);
  }

  public recycleChunkCollectibles(chunkZ: number): void {
    for (const c of this.coinPool) {
      if (c.active && c.chunkZ === chunkZ) {
        c.active = false;
        c.mesh.visible = false;
      }
    }
    for (const p of this.powerUpPool) {
      if (p.active && p.chunkZ === chunkZ) {
        p.active = false;
        p.group.visible = false;
      }
    }
  }

  /**
   * Main update loop for coin animations, magnet attraction, and power-up pickup collision checks
   */
  public update(delta: number, character: Character): void {
    // 1. Update Active Power-Up 10-Second Timers
    if (this.magnetTimer > 0) this.magnetTimer -= delta;
    if (this.shieldTimer > 0) this.shieldTimer -= delta;
    if (this.boostTimer > 0) this.boostTimer -= delta;
    if (this.flyTimer > 0) this.flyTimer -= delta;
    if (this.multiplierTimer > 0) this.multiplierTimer -= delta;

    const charPos = character.position;

    // 2. Animate and Check Coin Pickups
    for (const coin of this.coinPool) {
      if (!coin.active) continue;

      // Auto-rotate spin
      coin.mesh.rotation.z += 3.0 * delta;

      const dist = coin.position.distanceTo(charPos);

      // Coin Magnet Effect (attracts ground & air coins within 18 units if magnet active)
      if (this.magnetTimer > 0 && dist < 18.0) {
        const pullSpeed = 32.0 * delta;
        coin.position.lerp(charPos, pullSpeed);
        coin.mesh.position.copy(coin.position);
      }

      // Pickup Collision Detection (< 1.6 units distance for effortless pickup)
      if (dist < 1.6) {
        coin.active = false;
        coin.mesh.visible = false;
        this.coinsCollectedCount += this.multiplierTimer > 0 ? 2 : 1;
        this.particleSystem.spawnCoinSparkle(coin.position);
        this.audioManager.playCoin();
      }
    }

    // 3. Animate and Check Power-Up Pickups
    for (const item of this.powerUpPool) {
      if (!item.active) continue;

      item.group.rotation.y += 2.0 * delta;

      const dist = item.position.distanceTo(charPos);
      if (dist < 1.6) {
        item.active = false;
        item.group.visible = false;
        this.activatePowerUp(item.type);
        this.particleSystem.spawnCoinSparkle(item.position);
        this.audioManager.playPowerup();
      }
    }
  }

  public activatePowerUp(type: PowerUpType): void {
    switch (type) {
      case 'MAGNET':
        this.magnetTimer = 10.0;
        break;
      case 'SHIELD':
        this.shieldTimer = 10.0;
        break;
      case 'BOOST':
        this.boostTimer = 10.0;
        break;
      case 'FLY':
        this.flyTimer = 10.0;
        break;
      case 'MULTIPLIER':
        this.multiplierTimer = 10.0;
        break;
    }
  }

  public reset(): void {
    this.magnetTimer = 0;
    this.shieldTimer = 0;
    this.boostTimer = 0;
    this.flyTimer = 0;
    this.multiplierTimer = 0;
    this.coinsCollectedCount = 0;

    for (const c of this.coinPool) {
      c.active = false;
      c.mesh.visible = false;
    }
    for (const p of this.powerUpPool) {
      p.active = false;
      p.group.visible = false;
    }
  }
}

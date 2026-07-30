import * as THREE from 'three';
import { LANES, Character } from './Character';
import { ParticleSystem } from './ParticleSystem';
import { AudioManager } from '../audio/AudioManager';

export type PowerUpType = 'MAGNET' | 'SHIELD' | 'BOOST' | 'MULTIPLIER';

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

  // Active Power-Up Timers & States
  public magnetTimer: number = 0;
  public shieldActive: boolean = false;
  public boostTimer: number = 0;
  public multiplierTimer: number = 0;

  public coinsCollectedCount: number = 0;

  constructor(scene: THREE.Scene, particleSystem: ParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.audioManager = AudioManager.getInstance();

    // Gold Coin Geometry & PBR Material
    this.coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      metalness: 0.9,
      roughness: 0.1,
    });
  }

  /**
   * Spawns coins in patterns (lines, arcs, curves) and occasional power-up items on a chunk
   */
  public spawnCollectiblesForChunk(chunkZ: number): void {
    const patternType = Math.floor(Math.random() * 3);
    const lane = Math.floor(Math.random() * 3);

    if (patternType === 0) {
      // Straight line pattern (5 coins)
      for (let i = 0; i < 5; i++) {
        const z = chunkZ - (5 + i * 4);
        this.spawnCoin(LANES[lane], 0.6, z, chunkZ);
      }
    } else if (patternType === 1) {
      // Jump Arc pattern (5 coins ascending & descending)
      for (let i = 0; i < 5; i++) {
        const z = chunkZ - (5 + i * 4);
        const y = 0.6 + Math.sin((i / 4) * Math.PI) * 1.5;
        this.spawnCoin(LANES[lane], y, z, chunkZ);
      }
    } else {
      // Lane transition curve pattern
      const startLane = Math.floor(Math.random() * 2);
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const x = THREE.MathUtils.lerp(LANES[startLane], LANES[startLane + 1], t);
        const z = chunkZ - (4 + i * 4);
        this.spawnCoin(x, 0.6, z, chunkZ);
      }
    }

    // 25% Chance to spawn a Power-Up Item on this chunk
    if (Math.random() < 0.25) {
      const types: PowerUpType[] = ['MAGNET', 'SHIELD', 'BOOST', 'MULTIPLIER'];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      const powerUpLane = Math.floor(Math.random() * 3);
      this.spawnPowerUp(selectedType, LANES[powerUpLane], 1.2, chunkZ - 15, chunkZ);
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
      case 'MULTIPLIER':
        color = 0xa855f7; // Purple
        emissive = 0x9333ea;
        break;
    }

    const coreGeo = new THREE.OctahedronGeometry(0.5, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 2.0,
      metalness: 0.8,
      roughness: 0.2,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.castShadow = true;
    group.add(core);

    // Outer Ring Accent
    const ringGeo = new THREE.TorusGeometry(0.7, 0.05, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: color,
      emissiveIntensity: 1.5,
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
    // 1. Update Active Power-Up Timers
    if (this.magnetTimer > 0) this.magnetTimer -= delta;
    if (this.boostTimer > 0) this.boostTimer -= delta;
    if (this.multiplierTimer > 0) this.multiplierTimer -= delta;

    const charPos = character.position;

    // 2. Animate and Check Coin Pickups
    for (const coin of this.coinPool) {
      if (!coin.active) continue;

      // Auto-rotate spin
      coin.mesh.rotation.z += 3.0 * delta;

      const dist = coin.position.distanceTo(charPos);

      // Coin Magnet Effect (attracts coins within 15 units if magnet active)
      if (this.magnetTimer > 0 && dist < 15.0) {
        const pullSpeed = 25.0 * delta;
        coin.position.lerp(charPos, pullSpeed);
        coin.mesh.position.copy(coin.position);
      }

      // Pickup Collision Detection (< 1.2 units distance)
      if (dist < 1.2) {
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
      if (dist < 1.5) {
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
        this.magnetTimer = 8.0;
        break;
      case 'SHIELD':
        this.shieldActive = true;
        break;
      case 'BOOST':
        this.boostTimer = 5.0;
        break;
      case 'MULTIPLIER':
        this.multiplierTimer = 10.0;
        break;
    }
  }

  public reset(): void {
    this.magnetTimer = 0;
    this.shieldActive = false;
    this.boostTimer = 0;
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

import * as THREE from 'three';
import { LANES } from './Character';
import { TextureGenerator } from '../utils/TextureGenerator';

export type ObstacleType = 'LOW_BARRIER' | 'HIGH_BEAM' | 'SOLID_BLOCKADE' | 'DOUBLE_TRAP';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  group: THREE.Group;
  boundingBox: THREE.Box3;
  lanesOccupied: number[]; // Lane indices (0, 1, or 2)
  chunkZ: number;
  active: boolean;
}

export class ObstaclePool {
  private scene: THREE.Scene;
  private pool: Obstacle[] = [];
  private hazardMaterial: THREE.MeshStandardMaterial;
  private metalMaterial: THREE.MeshStandardMaterial;
  private warningLightMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Create PBR Hazard & Metallic Materials
    const hazardTextures = TextureGenerator.createHazardStripeTextures();
    hazardTextures.map.repeat.set(2, 2);

    this.hazardMaterial = new THREE.MeshStandardMaterial({
      map: hazardTextures.map,
      normalMap: hazardTextures.normalMap,
      roughness: 0.3,
      metalness: 0.6,
    });

    this.metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.2,
      metalness: 0.9,
    });

    this.warningLightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 3.0,
    });
  }

  /**
   * Spawns randomized procedural obstacles on a track chunk (length 30u)
   * Guaranteed to leave at least 1 open safe lane for player navigation.
   */
  public spawnObstaclesForChunk(chunkZ: number): void {
    // 2 obstacle spawn positions within the 30-unit chunk
    const zOffset1 = chunkZ - 10;
    const zOffset2 = chunkZ - 22;

    this.createRandomObstacle(zOffset1, chunkZ);
    this.createRandomObstacle(zOffset2, chunkZ);
  }

  private createRandomObstacle(zPos: number, chunkZ: number): void {
    const types: ObstacleType[] = ['LOW_BARRIER', 'HIGH_BEAM', 'SOLID_BLOCKADE', 'DOUBLE_TRAP'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    let lanesOccupied: number[] = [];
    if (selectedType === 'DOUBLE_TRAP') {
      // Pick 2 out of 3 lanes (e.g. 0 & 1, or 1 & 2, or 0 & 2)
      const openLane = Math.floor(Math.random() * 3);
      lanesOccupied = [0, 1, 2].filter((lane) => lane !== openLane);
    } else {
      // Single lane obstacle
      const lane = Math.floor(Math.random() * 3);
      lanesOccupied = [lane];
    }

    // Acquire or create obstacle instance from pool
    const obstacle = this.getOrCreateObstacle(selectedType, lanesOccupied);
    obstacle.chunkZ = chunkZ;
    obstacle.active = true;
    obstacle.lanesOccupied = lanesOccupied;

    // Position obstacle group
    const primaryLaneIndex = lanesOccupied[0];
    const xPos = lanesOccupied.length === 2 && Math.abs(lanesOccupied[0] - lanesOccupied[1]) === 1
      ? (LANES[lanesOccupied[0]] + LANES[lanesOccupied[1]]) / 2
      : LANES[primaryLaneIndex];

    obstacle.group.position.set(xPos, 0, zPos);
    obstacle.group.visible = true;

    // Update Bounding Box
    this.updateObstacleBoundingBox(obstacle);
  }

  private getOrCreateObstacle(type: ObstacleType, lanes: number[]): Obstacle {
    // Search pool for inactive obstacle of matching type
    const inactive = this.pool.find(
      (obs) => !obs.active && obs.type === type && obs.lanesOccupied.length === lanes.length
    );
    if (inactive) {
      return inactive;
    }

    // Otherwise create new obstacle mesh
    const group = new THREE.Group();
    const id = `obs_${type}_${Date.now()}_${Math.random()}`;

    switch (type) {
      case 'LOW_BARRIER':
        this.buildLowBarrierMesh(group);
        break;
      case 'HIGH_BEAM':
        this.buildHighBeamMesh(group);
        break;
      case 'SOLID_BLOCKADE':
        this.buildSolidBlockadeMesh(group);
        break;
      case 'DOUBLE_TRAP':
        this.buildDoubleTrapMesh(group);
        break;
    }

    this.scene.add(group);

    const obstacle: Obstacle = {
      id,
      type,
      group,
      boundingBox: new THREE.Box3(),
      lanesOccupied: lanes,
      chunkZ: 0,
      active: false,
    };

    this.pool.push(obstacle);
    return obstacle;
  }

  // --- Obstacle Mesh Construction Helpers ---

  private buildLowBarrierMesh(group: THREE.Group): void {
    // Barrier Beam (Must Jump Over: Height ~1.1u)
    const beamGeo = new THREE.BoxGeometry(3.0, 0.4, 0.4);
    const beam = new THREE.Mesh(beamGeo, this.hazardMaterial);
    beam.position.set(0, 0.9, 0);
    beam.castShadow = true;
    group.add(beam);

    // Support Legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8);
    const legLeft = new THREE.Mesh(legGeo, this.metalMaterial);
    legLeft.position.set(-1.3, 0.5, 0);
    legLeft.castShadow = true;
    group.add(legLeft);

    const legRight = new THREE.Mesh(legGeo, this.metalMaterial);
    legRight.position.set(1.3, 0.5, 0);
    legRight.castShadow = true;
    group.add(legRight);

    // Warning Beacon
    const lightGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const light = new THREE.Mesh(lightGeo, this.warningLightMat);
    light.position.set(0, 1.2, 0);
    group.add(light);
  }

  private buildHighBeamMesh(group: THREE.Group): void {
    // Overhead Heavy Beam (Must Slide Under: Bottom clearance ~1.3u, Top ~2.8u)
    const beamGeo = new THREE.BoxGeometry(3.2, 1.4, 0.6);
    const beam = new THREE.Mesh(beamGeo, this.hazardMaterial);
    beam.position.set(0, 2.0, 0);
    beam.castShadow = true;
    group.add(beam);

    // Side Pillars
    const pillarGeo = new THREE.BoxGeometry(0.4, 2.8, 0.6);
    const pillarL = new THREE.Mesh(pillarGeo, this.metalMaterial);
    pillarL.position.set(-1.5, 1.4, 0);
    pillarL.castShadow = true;
    group.add(pillarL);

    const pillarR = new THREE.Mesh(pillarGeo, this.metalMaterial);
    pillarR.position.set(1.5, 1.4, 0);
    pillarR.castShadow = true;
    group.add(pillarR);

    // Dual Warning Lights
    const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const lightL = new THREE.Mesh(lightGeo, this.warningLightMat);
    lightL.position.set(-1.0, 2.8, 0);
    group.add(lightL);

    const lightR = new THREE.Mesh(lightGeo, this.warningLightMat);
    lightR.position.set(1.0, 2.8, 0);
    group.add(lightR);
  }

  private buildSolidBlockadeMesh(group: THREE.Group): void {
    // Solid Concrete Barrier (Spans 1 Lane, Height ~3.2u)
    const blockGeo = new THREE.BoxGeometry(3.0, 3.2, 1.2);
    const block = new THREE.Mesh(blockGeo, this.hazardMaterial);
    block.position.set(0, 1.6, 0);
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);

    // Warning Light Top
    const lightGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    const light = new THREE.Mesh(lightGeo, this.warningLightMat);
    light.position.set(0, 3.35, 0);
    group.add(light);
  }

  private buildDoubleTrapMesh(group: THREE.Group): void {
    // Spans 2 Lanes (Width ~6.8u, Height ~3.2u)
    const trapGeo = new THREE.BoxGeometry(6.8, 3.2, 1.2);
    const trap = new THREE.Mesh(trapGeo, this.hazardMaterial);
    trap.position.set(0, 1.6, 0);
    trap.castShadow = true;
    trap.receiveShadow = true;
    group.add(trap);

    // Dual Warning Lights
    const lightGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    const light1 = new THREE.Mesh(lightGeo, this.warningLightMat);
    light1.position.set(-2.0, 3.35, 0);
    group.add(light1);

    const light2 = new THREE.Mesh(lightGeo, this.warningLightMat);
    light2.position.set(2.0, 3.35, 0);
    group.add(light2);
  }

  private updateObstacleBoundingBox(obstacle: Obstacle): void {
    obstacle.boundingBox.setFromObject(obstacle.group);
  }

  public recycleChunkObstacles(chunkZ: number): void {
    for (const obstacle of this.pool) {
      if (obstacle.active && obstacle.chunkZ === chunkZ) {
        obstacle.active = false;
        obstacle.group.visible = false;
      }
    }
  }

  public getActiveObstacles(): Obstacle[] {
    return this.pool.filter((obs) => obs.active);
  }

  public clearAll(): void {
    for (const obstacle of this.pool) {
      obstacle.active = false;
      obstacle.group.visible = false;
    }
  }
}

import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator';
import { ObstaclePool } from './ObstaclePool';

export interface TrackChunk {
  group: THREE.Group;
  startZ: number;
}

export class TrackManager {
  public scene: THREE.Scene;
  public obstaclePool: ObstaclePool;

  public static readonly CHUNK_LENGTH = 30.0;
  public static readonly NUM_CHUNKS = 10;
  public static readonly TRACK_WIDTH = 12.0;

  private chunks: TrackChunk[] = [];
  private asphaltMaterial: THREE.MeshStandardMaterial;
  private curbMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, obstaclePool: ObstaclePool) {
    this.scene = scene;
    this.obstaclePool = obstaclePool;

    // Create Asphalt PBR Material
    const asphaltTextures = TextureGenerator.createAsphaltTextures();
    asphaltTextures.map.repeat.set(1, 4);
    asphaltTextures.normalMap.repeat.set(1, 4);
    asphaltTextures.roughnessMap.repeat.set(1, 4);

    this.asphaltMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTextures.map,
      normalMap: asphaltTextures.normalMap,
      roughnessMap: asphaltTextures.roughnessMap,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    this.initTrackChunks();
  }

  private initTrackChunks(): void {
    for (let i = 0; i < TrackManager.NUM_CHUNKS; i++) {
      const chunkZ = -i * TrackManager.CHUNK_LENGTH;
      const chunkGroup = this.createChunkMesh();
      chunkGroup.position.z = chunkZ;

      this.scene.add(chunkGroup);

      this.chunks.push({
        group: chunkGroup,
        startZ: chunkZ,
      });

      // Keep initial 2 chunks clean for safe player spawn, populate obstacles on remaining
      if (i >= 2) {
        this.obstaclePool.spawnObstaclesForChunk(chunkZ);
      }
    }
  }

  private createChunkMesh(): THREE.Group {
    const group = new THREE.Group();

    // 1. Asphalt Ground Plane (30u length, 12u width)
    const groundGeo = new THREE.PlaneGeometry(TrackManager.TRACK_WIDTH, TrackManager.CHUNK_LENGTH);
    const ground = new THREE.Mesh(groundGeo, this.asphaltMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -TrackManager.CHUNK_LENGTH / 2;
    ground.receiveShadow = true;
    group.add(ground);

    // 2. Lane Dividers (-3.5, 0, +3.5 lanes)
    const grid = new THREE.GridHelper(TrackManager.TRACK_WIDTH, 3, 0x00f0ff, 0x1e293b);
    grid.scale.set(1, 1, TrackManager.CHUNK_LENGTH / TrackManager.TRACK_WIDTH);
    grid.position.set(0, 0.01, -TrackManager.CHUNK_LENGTH / 2);
    group.add(grid);

    // 3. Side Glowing Curbs / Barriers
    const curbGeo = new THREE.BoxGeometry(0.3, 0.4, TrackManager.CHUNK_LENGTH);
    const leftCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    leftCurb.position.set(-TrackManager.TRACK_WIDTH / 2, 0.2, -TrackManager.CHUNK_LENGTH / 2);
    group.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    rightCurb.position.set(TrackManager.TRACK_WIDTH / 2, 0.2, -TrackManager.CHUNK_LENGTH / 2);
    group.add(rightCurb);

    return group;
  }

  /**
   * Updates track chunk positions relative to player Z position.
   * Recycles chunks that fall behind player seamlessly to the front.
   */
  public update(playerZ: number): void {
    const oldestChunk = this.chunks[0];

    // Check if player has passed the oldest chunk
    if (playerZ < oldestChunk.startZ - TrackManager.CHUNK_LENGTH) {
      const furthestChunk = this.chunks[this.chunks.length - 1];
      const newStartZ = furthestChunk.startZ - TrackManager.CHUNK_LENGTH;

      // 1. Clear obstacles from recycled chunk
      this.obstaclePool.recycleChunkObstacles(oldestChunk.startZ);

      // 2. Reposition chunk mesh to front
      oldestChunk.startZ = newStartZ;
      oldestChunk.group.position.z = newStartZ;

      // 3. Spawn new obstacles on newly recycled chunk
      this.obstaclePool.spawnObstaclesForChunk(newStartZ);

      // 4. Move oldest chunk to end of array
      this.chunks.shift();
      this.chunks.push(oldestChunk);
    }
  }

  public reset(): void {
    this.obstaclePool.clearAll();

    for (let i = 0; i < TrackManager.NUM_CHUNKS; i++) {
      const chunkZ = -i * TrackManager.CHUNK_LENGTH;
      this.chunks[i].startZ = chunkZ;
      this.chunks[i].group.position.z = chunkZ;

      if (i >= 2) {
        this.obstaclePool.spawnObstaclesForChunk(chunkZ);
      }
    }
  }
}

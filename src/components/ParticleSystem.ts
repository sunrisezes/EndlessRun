import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  startScale: number;
  color: THREE.Color;
  active: boolean;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particlePool: Particle[] = [];
  private sharedGeo: THREE.SphereGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sharedGeo = new THREE.SphereGeometry(0.12, 6, 6);
  }

  /**
   * Spawns ground dust puff at player feet while running
   */
  public spawnFootstepDust(position: THREE.Vector3): void {
    for (let i = 0; i < 2; i++) {
      const p = this.getOrCreateParticle();
      p.mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y + 0.05,
        position.z + (Math.random() - 0.5) * 0.4
      );
      p.velocity.set(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.6 + 0.2,
        Math.random() * 0.5 + 0.2
      );
      p.life = 0;
      p.maxLife = 0.35;
      p.startScale = 0.25;

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(0x64748b);
      mat.opacity = 0.6;

      p.mesh.scale.setScalar(p.startScale);
      p.mesh.visible = true;
      p.active = true;
    }
  }

  /**
   * Spawns golden sparkle burst on coin pickup
   */
  public spawnCoinSparkle(position: THREE.Vector3): void {
    for (let i = 0; i < 12; i++) {
      const p = this.getOrCreateParticle();
      p.mesh.position.copy(position);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = Math.random() * 4 + 2;

      p.velocity.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 2,
        Math.sin(phi) * Math.sin(theta) * speed
      );
      p.life = 0;
      p.maxLife = 0.5;
      p.startScale = 0.3;

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(Math.random() > 0.3 ? 0xf59e0b : 0xfef08a);
      mat.opacity = 1.0;

      p.mesh.scale.setScalar(p.startScale);
      p.mesh.visible = true;
      p.active = true;
    }
  }

  /**
   * Spawns explosive debris and sparks on obstacle crash
   */
  public spawnCrashExplosion(position: THREE.Vector3): void {
    for (let i = 0; i < 30; i++) {
      const p = this.getOrCreateParticle();
      p.mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.8,
        position.y + 0.8 + (Math.random() - 0.5) * 0.8,
        position.z + (Math.random() - 0.5) * 0.8
      );

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = Math.random() * 8 + 3;

      p.velocity.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.abs(Math.cos(phi)) * speed + 3,
        Math.sin(phi) * Math.sin(theta) * speed
      );
      p.life = 0;
      p.maxLife = 0.8;
      p.startScale = Math.random() * 0.5 + 0.2;

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      const colors = [0xef4444, 0xf97316, 0xeab308, 0x1e293b];
      mat.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
      mat.opacity = 1.0;

      p.mesh.scale.setScalar(p.startScale);
      p.mesh.visible = true;
      p.active = true;
    }
  }

  private getOrCreateParticle(): Particle {
    const inactive = this.particlePool.find((p) => !p.active);
    if (inactive) return inactive;

    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.sharedGeo, mat);
    this.scene.add(mesh);

    const p: Particle = {
      mesh,
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      startScale: 1,
      color: new THREE.Color(),
      active: false,
    };

    this.particlePool.push(p);
    return p;
  }

  public update(delta: number): void {
    for (const p of this.particlePool) {
      if (!p.active) continue;

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      const progress = p.life / p.maxLife;

      // Update position
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 9.8 * delta; // Gravity

      // Shrink & fade out
      const scale = p.startScale * (1 - progress);
      p.mesh.scale.setScalar(scale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - progress;
    }
  }

  public clearAll(): void {
    for (const p of this.particlePool) {
      p.active = false;
      p.mesh.visible = false;
    }
  }
}

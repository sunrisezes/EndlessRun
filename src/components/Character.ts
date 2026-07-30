import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CharacterState = 'IDLE' | 'RUNNING' | 'JUMPING' | 'SLIDING' | 'DEAD';

export const LANES = [-3.5, 0.0, 3.5];

export class Character {
  public group: THREE.Group;
  public state: CharacterState = 'IDLE';

  // Lane Configuration
  public currentLaneIndex: number = 1; // Start in Center lane (0.0)
  public targetX: number = LANES[1];

  // Physics Properties
  public forwardSpeed: number = 18.0; // u/s initial speed
  public maxForwardSpeed: number = 35.0; // u/s max speed
  public speedAcceleration: number = 0.15; // u/s per second
  public jumpVelocity: number = 12.0; // u/s jump impulse
  public gravity: number = -32.0; // u/s² gravity force
  public slideDuration: number = 0.8; // seconds

  // Internal Physics State
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public verticalVelocity: number = 0;
  private slideTimer: number = 0;
  private animTime: number = 0;

  // Visuals & Animations
  private meshGroup: THREE.Group;
  private proceduralMannequin: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentActionName: string | null = null;

  // Energy Shield Forcefield Mesh
  public shieldMesh: THREE.Mesh;

  // Procedural Limb References
  private leftLeg: THREE.Mesh | null = null;
  private rightLeg: THREE.Mesh | null = null;
  private leftArm: THREE.Mesh | null = null;
  private rightArm: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.meshGroup = new THREE.Group();
    this.group.add(this.meshGroup);

    // Energy Shield Forcefield Attachment
    const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.0;
    this.shieldMesh.visible = false;
    this.meshGroup.add(this.shieldMesh);

    scene.add(this.group);

    // Create Stylized Procedural Mannequin as default fallback
    this.createProceduralMannequin();
  }

  private createProceduralMannequin(): void {
    this.proceduralMannequin = new THREE.Group();

    // Body Material
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });

    // Emissive Visor Material
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      metalness: 0.9,
      roughness: 0.1,
    });

    // Accent Metal Material
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.3,
    });

    // Torso & Head (Capsule)
    const torsoGeo = new THREE.CapsuleGeometry(0.4, 0.9, 8, 16);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    torso.receiveShadow = true;
    this.proceduralMannequin.add(torso);

    // Futuristic Visor Band
    const visorGeo = new THREE.BoxGeometry(0.55, 0.12, 0.3);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.48, 0.22);
    this.proceduralMannequin.add(visor);

    // Shoulder Armor Pads
    const padGeo = new THREE.BoxGeometry(0.25, 0.15, 0.3);
    const leftPad = new THREE.Mesh(padGeo, accentMat);
    leftPad.position.set(-0.48, 1.4, 0);
    leftPad.castShadow = true;
    this.proceduralMannequin.add(leftPad);

    const rightPad = new THREE.Mesh(padGeo, accentMat);
    rightPad.position.set(0.48, 1.4, 0);
    rightPad.castShadow = true;
    this.proceduralMannequin.add(rightPad);

    // Left & Right Arms
    const armGeo = new THREE.CapsuleGeometry(0.1, 0.5, 4, 8);
    this.leftArm = new THREE.Mesh(armGeo, bodyMat);
    this.leftArm.position.set(-0.5, 1.1, 0);
    this.leftArm.castShadow = true;
    this.proceduralMannequin.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, bodyMat);
    this.rightArm.position.set(0.5, 1.1, 0);
    this.rightArm.castShadow = true;
    this.proceduralMannequin.add(this.rightArm);

    // Left & Right Legs
    const legGeo = new THREE.CapsuleGeometry(0.12, 0.6, 4, 8);
    this.leftLeg = new THREE.Mesh(legGeo, bodyMat);
    this.leftLeg.position.set(-0.2, 0.45, 0);
    this.leftLeg.castShadow = true;
    this.proceduralMannequin.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, bodyMat);
    this.rightLeg.position.set(0.2, 0.45, 0);
    this.rightLeg.castShadow = true;
    this.proceduralMannequin.add(this.rightLeg);

    this.meshGroup.add(this.proceduralMannequin);
  }

  public loadGLTFModel(url: string): Promise<void> {
    return new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          if (this.proceduralMannequin) {
            this.meshGroup.remove(this.proceduralMannequin);
            this.proceduralMannequin = null;
          }

          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          this.meshGroup.add(model);

          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              const action = this.mixer!.clipAction(clip);
              this.animations.set(clip.name.toLowerCase(), action);
            });
            this.playAnimation('run');
          }

          resolve();
        },
        undefined,
        (error) => {
          console.warn('GLTF load failed, using procedural mannequin fallback:', error);
          resolve();
        }
      );
    });
  }

  private playAnimation(name: string): void {
    if (!this.mixer) return;
    const lowerName = name.toLowerCase();
    const action = this.animations.get(lowerName);
    if (!action || this.currentActionName === lowerName) return;

    if (this.currentActionName && this.animations.has(this.currentActionName)) {
      this.animations.get(this.currentActionName)!.fadeOut(0.2);
    }

    action.reset().fadeIn(0.2).play();
    this.currentActionName = lowerName;
  }

  public moveLeft(): void {
    if (this.state === 'DEAD') return;
    if (this.currentLaneIndex > 0) {
      this.currentLaneIndex--;
      this.targetX = LANES[this.currentLaneIndex];
    }
  }

  public moveRight(): void {
    if (this.state === 'DEAD') return;
    if (this.currentLaneIndex < LANES.length - 1) {
      this.currentLaneIndex++;
      this.targetX = LANES[this.currentLaneIndex];
    }
  }

  public jump(): void {
    if (this.state === 'DEAD' || this.state === 'JUMPING') return;

    this.state = 'JUMPING';
    this.verticalVelocity = this.jumpVelocity;
    this.playAnimation('jump');
  }

  public slide(): void {
    if (this.state === 'DEAD' || this.state === 'SLIDING') return;

    this.state = 'SLIDING';
    this.slideTimer = this.slideDuration;
    this.playAnimation('slide');
  }

  public die(): void {
    this.state = 'DEAD';
    this.forwardSpeed = 0;
    this.playAnimation('die');
  }

  public reset(): void {
    this.state = 'RUNNING';
    this.currentLaneIndex = 1;
    this.targetX = LANES[1];
    this.position.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.forwardSpeed = 18.0;
    this.slideTimer = 0;
    this.group.position.set(0, 0, 0);
    this.meshGroup.scale.set(1, 1, 1);
    this.meshGroup.rotation.set(0, 0, 0);
    this.shieldMesh.visible = false;
    this.playAnimation('run');
  }

  public update(delta: number, isFlying: boolean = false, isBoosting: boolean = false): void {
    if (this.state === 'IDLE') return;

    // 1. Forward Speed & 5x Booster acceleration
    if (this.state !== 'DEAD') {
      if (isBoosting) {
        this.forwardSpeed = 85.0; // 5x Hyper Speed Booster!
      } else {
        this.forwardSpeed = Math.min(
          this.forwardSpeed + this.speedAcceleration * delta,
          this.maxForwardSpeed
        );
      }
      this.position.z -= this.forwardSpeed * delta;
    }

    // 2. Smooth Lane Shift Dampening
    const dampeningFactor = 1 - Math.exp(-22 * delta);
    this.position.x += (this.targetX - this.position.x) * dampeningFactor;

    // 3. Flying Booster Altitude & Jump Physics
    if (isFlying) {
      // Smoothly ascend to sky altitude (y = 4.5u) above obstacles
      const flyDamp = 1 - Math.exp(-8 * delta);
      this.position.y += (4.5 - this.position.y) * flyDamp;
      this.verticalVelocity = 0;
      this.meshGroup.rotation.x = THREE.MathUtils.lerp(this.meshGroup.rotation.x, -Math.PI / 6, 0.2); // Flight tilt posture
    } else if (this.state === 'JUMPING' || this.position.y > 0) {
      this.verticalVelocity += this.gravity * delta;
      this.position.y += this.verticalVelocity * delta;

      if (this.position.y <= 0) {
        this.position.y = 0;
        this.verticalVelocity = 0;
        if (this.state === 'JUMPING') {
          this.state = 'RUNNING';
          this.playAnimation('run');
        }
      }
    }

    // 4. Slide State Handling
    if (this.state === 'SLIDING') {
      this.slideTimer -= delta;
      this.meshGroup.scale.y = THREE.MathUtils.lerp(this.meshGroup.scale.y, 0.5, 0.2);
      this.meshGroup.rotation.x = THREE.MathUtils.lerp(this.meshGroup.rotation.x, -Math.PI / 4, 0.2);

      if (this.slideTimer <= 0) {
        this.slideTimer = 0;
        this.state = 'RUNNING';
        this.playAnimation('run');
      }
    } else if (!isFlying) {
      this.meshGroup.scale.y = THREE.MathUtils.lerp(this.meshGroup.scale.y, 1.0, 0.2);
      this.meshGroup.rotation.x = THREE.MathUtils.lerp(this.meshGroup.rotation.x, 0.0, 0.2);
    }

    // 5. Update Animation Mixer or Procedural Fallback
    if (this.mixer) {
      this.mixer.update(delta);
    } else if (this.proceduralMannequin && this.state !== 'DEAD') {
      this.updateProceduralAnimation(delta);
    }

    this.group.position.copy(this.position);
  }

  private updateProceduralAnimation(delta: number): void {
    this.animTime += delta * (this.forwardSpeed * 0.7);
    const swing = Math.sin(this.animTime) * 0.6;

    if (this.leftLeg && this.rightLeg) {
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
    }

    if (this.leftArm && this.rightArm) {
      this.leftArm.rotation.x = -swing * 0.8;
      this.rightArm.rotation.x = swing * 0.8;
    }

    if (this.state === 'RUNNING') {
      this.meshGroup.position.y = Math.abs(Math.sin(this.animTime * 2)) * 0.1;
    } else {
      this.meshGroup.position.y = 0;
    }
  }

  public getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3();
    const height = this.state === 'SLIDING' ? 0.9 : 1.8;
    const width = 0.8;
    const depth = 0.8;

    box.min.set(
      this.position.x - width / 2,
      this.position.y,
      this.position.z - depth / 2
    );
    box.max.set(
      this.position.x + width / 2,
      this.position.y + height,
      this.position.z + depth / 2
    );

    return box;
  }
}

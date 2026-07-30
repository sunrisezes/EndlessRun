import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CameraManager } from './CameraManager';
import { LightingManager } from './Lighting';
import { InputManager } from './InputManager';
import { Character } from '../components/Character';
import { ObstaclePool } from '../components/ObstaclePool';
import { TrackManager } from '../components/TrackManager';
import { CollisionDetector } from './CollisionDetector';
import { ParticleSystem } from '../components/ParticleSystem';
import { PowerUpManager } from '../components/PowerUpManager';
import { AudioManager } from '../audio/AudioManager';
import { HUD } from '../ui/HUD';

export class Engine {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public cameraManager: CameraManager;
  public lightingManager: LightingManager;
  public inputManager: InputManager;
  public character: Character;
  public obstaclePool: ObstaclePool;
  public trackManager: TrackManager;
  public particleSystem: ParticleSystem;
  public powerUpManager: PowerUpManager;
  public audioManager: AudioManager;
  public hud: HUD;
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  
  private clock: THREE.Clock;
  private isRunning: boolean = false;
  private isGameActive: boolean = false;
  private footstepTimer: number = 0;

  constructor(container: HTMLElement) {
    // 1. Initialize Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);

    // 2. Initialize Camera Manager
    const aspect = container.clientWidth / container.clientHeight;
    this.cameraManager = new CameraManager(aspect);

    // 3. Initialize WebGL2 Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.appendChild(this.renderer.domElement);

    // 4. Lighting and Volumetric Fog
    this.lightingManager = new LightingManager(this.scene);

    // 5. Post-Processing Bloom
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.cameraManager.camera);
    this.composer.addPass(renderPass);

    const resolution = new THREE.Vector2(container.clientWidth, container.clientHeight);
    this.bloomPass = new UnrealBloomPass(resolution, 0.4, 0.5, 0.85);
    this.composer.addPass(this.bloomPass);

    // 6. Subsystems
    this.particleSystem = new ParticleSystem(this.scene);
    this.audioManager = AudioManager.getInstance();
    this.character = new Character(this.scene);
    this.obstaclePool = new ObstaclePool(this.scene);
    this.powerUpManager = new PowerUpManager(this.scene, this.particleSystem);
    this.trackManager = new TrackManager(this.scene, this.obstaclePool);

    // 7. Glassmorphism HUD UI
    this.hud = new HUD(container);
    this.hud.onStartGame = () => this.startGame();
    this.hud.onRestartGame = () => this.restartGame();

    // 8. Input Manager & Bindings
    this.inputManager = new InputManager();
    this.setupInputBindings();

    this.clock = new THREE.Clock();

    // Window Resize Handler
    window.addEventListener('resize', () => this.onWindowResize(container));
  }

  private setupInputBindings(): void {
    this.inputManager.on('LEFT', () => {
      if (this.isGameActive) this.character.moveLeft();
    });
    this.inputManager.on('RIGHT', () => {
      if (this.isGameActive) this.character.moveRight();
    });
    this.inputManager.on('JUMP', () => {
      if (this.isGameActive) {
        if (this.character.state !== 'JUMPING' && this.character.state !== 'DEAD') {
          this.audioManager.playJump();
        }
        this.character.jump();
      }
    });
    this.inputManager.on('SLIDE', () => {
      if (this.isGameActive) {
        if (this.character.state !== 'SLIDING' && this.character.state !== 'DEAD') {
          this.audioManager.playSlide();
        }
        this.character.slide();
      }
    });
  }

  private onWindowResize(container: HTMLElement): void {
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.cameraManager.updateAspect(width / height);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  public startGame(): void {
    this.isGameActive = true;
    this.character.state = 'RUNNING';
    this.audioManager.playBGM();
  }

  public restartGame(): void {
    this.character.reset();
    this.trackManager.reset();
    this.powerUpManager.reset();
    this.particleSystem.clearAll();
    this.isGameActive = true;
    this.character.state = 'RUNNING';
    this.audioManager.playBGM();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  private loop = (): void => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.isGameActive) {
      // 1. Hyper Boost handling
      const isBoosting = this.powerUpManager.boostTimer > 0;
      this.cameraManager.setBoostFOV(isBoosting);
      if (isBoosting) {
        this.character.forwardSpeed = Math.max(this.character.forwardSpeed, 30.0);
      }

      // 2. Character Physics Update
      this.character.update(delta);
      this.character.shieldMesh.visible = this.powerUpManager.shieldActive;

      // 3. Track Chunk Spawner Update
      this.trackManager.update(this.character.position.z);

      // 4. Power-ups & Collectibles Update
      this.powerUpManager.update(delta, this.character);

      // 5. Footstep Dust Particles
      if (this.character.state === 'RUNNING') {
        this.footstepTimer += delta;
        if (this.footstepTimer > 0.15) {
          this.footstepTimer = 0;
          this.particleSystem.spawnFootstepDust(this.character.position);
        }
      }

      // 6. Check Obstacle Collisions
      if (this.character.state !== 'DEAD' && !isBoosting) {
        const hitObstacle = CollisionDetector.checkCollisions(this.character, this.obstaclePool);
        if (hitObstacle) {
          if (this.powerUpManager.shieldActive) {
            this.powerUpManager.shieldActive = false; // Shield absorbs hit
            this.cameraManager.triggerShake(0.2, 0.2);
            this.particleSystem.spawnCoinSparkle(this.character.position);
            hitObstacle.active = false;
            hitObstacle.group.visible = false;
          } else {
            // Player Death
            this.character.die();
            this.isGameActive = false;
            this.particleSystem.spawnCrashExplosion(this.character.position);
            this.audioManager.playCrash();
            this.cameraManager.triggerShake(0.35, 0.45);

            const distance = Math.floor(-this.character.position.z);
            const coins = this.powerUpManager.coinsCollectedCount;
            this.hud.showGameOver(distance, coins);
          }
        }
      }

      // 7. Update HUD
      const distance = Math.floor(-this.character.position.z);
      const multiplier = this.powerUpManager.multiplierTimer > 0 ? 2 : 1;
      this.hud.updateHUD(distance, this.powerUpManager.coinsCollectedCount, multiplier, {
        magnetTimer: this.powerUpManager.magnetTimer,
        shieldActive: this.powerUpManager.shieldActive,
        boostTimer: this.powerUpManager.boostTimer,
        multiplierTimer: this.powerUpManager.multiplierTimer,
      });
    }

    // Update Particles
    this.particleSystem.update(delta);

    // Update Camera
    this.cameraManager.update(this.character.position, delta);

    // Update Lighting
    this.lightingManager.dirLight.position.set(
      this.character.position.x + 15,
      30,
      this.character.position.z + 15
    );
    this.lightingManager.dirLight.target.position.copy(this.character.position);
    this.lightingManager.dirLight.target.updateMatrixWorld();

    // Render Scene
    this.composer.render();
  };
}

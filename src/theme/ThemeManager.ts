import * as THREE from 'three';
import { LightingManager } from '../core/Lighting';
import { TrackManager } from '../components/TrackManager';

export interface ThemeConfig {
  id: string;
  name: string;
  icon: string;
  curbColor: number;
  lightColor: number;
  skyColors: [string, string, string]; // Top, Mid, Horizon
  description: string;
}

export class ThemeManager {
  private static instance: ThemeManager | null = null;

  public static readonly THEMES: ThemeConfig[] = [
    {
      id: 'default',
      name: 'Cyber City',
      icon: '🏙️',
      curbColor: 0x00f0ff,
      lightColor: 0x00f0ff,
      skyColors: ['#020617', '#0369a1', '#00f0ff'],
      description: 'Futuristic Cyberpunk Metropolis',
    },
    {
      id: 'nyc',
      name: 'New York City',
      icon: '🗽',
      curbColor: 0xf59e0b,
      lightColor: 0xfbbf24,
      skyColors: ['#090514', '#311b92', '#f59e0b'],
      description: 'Times Square & NYC Night Lights',
    },
    {
      id: 'tokyo',
      name: 'Tokyo',
      icon: '🏮',
      curbColor: 0xec4899,
      lightColor: 0xf472b6,
      skyColors: ['#10002b', '#4a0e4e', '#ec4899'],
      description: 'Shibuya Cyber Neon District',
    },
    {
      id: 'sunset_highway',
      name: 'Sunset Highway',
      icon: '🌅',
      curbColor: 0xf97316,
      lightColor: 0xfb923c,
      skyColors: ['#1c0a00', '#7c2d12', '#f97316'],
      description: 'Golden Sunset & Coastal Expressway',
    },
    {
      id: 'antarctica',
      name: 'Antarctica',
      icon: '❄️',
      curbColor: 0x38bdf8,
      lightColor: 0xbae6fd,
      skyColors: ['#020617', '#0c4a6e', '#38bdf8'],
      description: 'Icy Glaciers & Falling Snow',
    },
    {
      id: 'forest',
      name: 'Forest',
      icon: '🌲',
      curbColor: 0x22c55e,
      lightColor: 0x4ade80,
      skyColors: ['#01170c', '#064e3b', '#22c55e'],
      description: 'Lush Green Pine Forest',
    },
  ];

  public currentTheme: ThemeConfig = ThemeManager.THEMES[0];

  private scene: THREE.Scene | null = null;
  private lightingManager: LightingManager | null = null;
  private trackManager: TrackManager | null = null;

  // 3D Environment World Objects inside Three.js Scene
  private worldGroup: THREE.Group = new THREE.Group();
  private skyMesh: THREE.Mesh | null = null;
  private skyCanvas: HTMLCanvasElement = document.createElement('canvas');
  private skyContext: CanvasRenderingContext2D | null = null;
  private skyTexture: THREE.CanvasTexture | null = null;

  private horizonGroup: THREE.Group = new THREE.Group();
  private particleGroup: THREE.Group = new THREE.Group();
  private animTime: number = 0;

  constructor() {
    this.skyCanvas.width = 1024;
    this.skyCanvas.height = 1024;
    this.skyContext = this.skyCanvas.getContext('2d');
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public registerManagers(
    scene: THREE.Scene,
    lightingManager: LightingManager,
    trackManager: TrackManager
  ): void {
    this.scene = scene;
    this.lightingManager = lightingManager;
    this.trackManager = trackManager;

    this.init3DWorldEnvironment();
    this.applyTheme(this.currentTheme.id);
  }

  private init3DWorldEnvironment(): void {
    if (!this.scene) return;

    this.worldGroup = new THREE.Group();

    // 1. Production-Ready 3D Sky Dome Mesh (Sphere 350u) inside Three.js Scene
    const skyGeo = new THREE.SphereGeometry(350, 64, 32);
    this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);
    this.skyTexture.colorSpace = THREE.SRGBColorSpace;

    const skyMat = new THREE.MeshBasicMaterial({
      map: this.skyTexture,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.worldGroup.add(this.skyMesh);

    // 2. 3D Horizon Cityscape / Mountain / Forest Silhouettes Group
    this.worldGroup.add(this.horizonGroup);

    // 3. Environmental Atmospheric Particles (Snow, Fireflies, Bokeh)
    this.worldGroup.add(this.particleGroup);

    this.scene.add(this.worldGroup);
  }

  public setTheme(themeId: string): void {
    this.applyTheme(themeId);
  }

  private applyTheme(themeId: string): void {
    const theme = ThemeManager.THEMES.find((t) => t.id === themeId) || ThemeManager.THEMES[0];
    this.currentTheme = theme;

    // 1. Update 3D Lighting & Fog
    if (this.lightingManager && this.scene) {
      this.lightingManager.dirLight.color.setHex(theme.lightColor);
      this.scene.background = null; // Let the 3D Sky Dome render!

      // Light atmospheric fog matching theme sky horizon
      const fogColor = new THREE.Color(theme.skyColors[2]).multiplyScalar(0.2);
      this.lightingManager.fog.color.copy(fogColor);
      this.lightingManager.fog.density = 0.003; // Light fog so horizon sky is 100% visible!
    }

    // 2. Update Track Side Curbs Emission & Glow
    if (this.trackManager) {
      this.trackManager.curbMaterial.color.setHex(theme.curbColor);
      this.trackManager.curbMaterial.emissive.setHex(theme.curbColor);
      this.trackManager.curbMaterial.emissiveIntensity = 2.2;
    }

    // 3. Render High-Definition 3D Realistic Sky Gradient & Clouds
    this.renderSkyTexture(theme);

    // 4. Construct 3D Horizon Silhouettes & Atmospheric Details
    this.build3DHorizon(theme);
  }

  private renderSkyTexture(theme: ThemeConfig): void {
    if (!this.skyContext || !this.skyTexture) return;

    const ctx = this.skyContext;
    const w = this.skyCanvas.width;
    const h = this.skyCanvas.height;

    // Realistic Sky Atmospheric Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, theme.skyColors[0]);
    grad.addColorStop(0.5, theme.skyColors[1]);
    grad.addColorStop(0.85, theme.skyColors[2]);
    grad.addColorStop(1.0, theme.skyColors[2]);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Realistic Horizon Sun Disc & Volumetric Radial Glow
    const sunY = h * 0.72;
    const sunGrad = ctx.createRadialGradient(w / 2, sunY, 10, w / 2, sunY, 250);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    sunGrad.addColorStop(0.2, theme.skyColors[2]);
    sunGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
    sunGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // Realistic Cloud & Atmospheric Wisps
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 12; i++) {
      const cx = (Math.sin(i * 1.5) * 0.5 + 0.5) * w;
      const cy = (h * 0.4) + Math.cos(i) * 80;
      const rx = 180 + Math.sin(i) * 60;
      const ry = 35 + Math.cos(i) * 15;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Realistic Starfield
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 150; i++) {
      const rx = (Math.sin(i * 123.45) * 0.5 + 0.5) * w;
      const ry = (Math.cos(i * 67.89) * 0.5 + 0.5) * (h * 0.6);
      const size = Math.random() * 2 + 1;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillRect(rx, ry, size, size);
    }
    ctx.globalAlpha = 1.0;

    this.skyTexture.needsUpdate = true;
  }

  private build3DHorizon(theme: ThemeConfig): void {
    // Clear previous horizon elements & particles
    while (this.horizonGroup.children.length > 0) {
      this.horizonGroup.remove(this.horizonGroup.children[0]);
    }
    while (this.particleGroup.children.length > 0) {
      this.particleGroup.remove(this.particleGroup.children[0]);
    }

    const themeId = theme.id;

    if (themeId === 'default' || themeId === 'nyc' || themeId === 'tokyo') {
      // Production-Ready 3D City Skyline & Neon Windows
      const bldgMat = new THREE.MeshStandardMaterial({
        color: 0x0a0f1d,
        emissive: theme.curbColor,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.8,
      });

      const winMat = new THREE.MeshBasicMaterial({
        color: theme.lightColor,
      });

      for (let i = -16; i <= 16; i++) {
        if (Math.abs(i) < 2) continue; // Keep runner path open
        const height = Math.random() * 50 + 30;
        const width = Math.random() * 12 + 8;
        const depth = Math.random() * 12 + 8;

        const geo = new THREE.BoxGeometry(width, height, depth);
        const bldg = new THREE.Mesh(geo, bldgMat);
        const xPos = i * 14 + (Math.random() - 0.5) * 6;
        const zPos = -160 - Math.random() * 80;

        bldg.position.set(xPos, height / 2, zPos);
        this.horizonGroup.add(bldg);

        // Add 3D Glowing Window Blocks onto skyscrapers
        for (let wIdx = 0; wIdx < 3; wIdx++) {
          const winGeo = new THREE.BoxGeometry(width * 0.8, 1.5, depth + 0.2);
          const winMesh = new THREE.Mesh(winGeo, winMat);
          winMesh.position.set(xPos, Math.random() * (height - 10) + 5, zPos);
          this.horizonGroup.add(winMesh);
        }
      }
    } else if (themeId === 'antarctica') {
      // 3D Icy Mountain Peaks & Glaciers
      const iceMat = new THREE.MeshStandardMaterial({
        color: 0xcff4fc,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.2,
        roughness: 0.1,
        metalness: 0.9,
      });

      for (let i = -12; i <= 12; i++) {
        if (Math.abs(i) < 2) continue;
        const height = Math.random() * 45 + 25;
        const radius = Math.random() * 12 + 8;

        const geo = new THREE.ConeGeometry(radius, height, 6);
        const peak = new THREE.Mesh(geo, iceMat);
        peak.position.set(i * 16, height / 2, -160 - Math.random() * 60);
        this.horizonGroup.add(peak);
      }
    } else if (themeId === 'forest') {
      // 3D Forest Pine Trees
      const treeMat = new THREE.MeshStandardMaterial({
        color: 0x022c22,
        emissive: 0x22c55e,
        emissiveIntensity: 0.6,
        roughness: 0.8,
      });

      for (let i = -18; i <= 18; i++) {
        if (Math.abs(i) < 2) continue;
        const height = Math.random() * 35 + 20;
        const radius = Math.random() * 8 + 5;

        const geo = new THREE.ConeGeometry(radius, height, 7);
        const tree = new THREE.Mesh(geo, treeMat);
        tree.position.set(i * 12, height / 2, -150 - Math.random() * 70);
        this.horizonGroup.add(tree);
      }
    } else if (themeId === 'sunset_highway') {
      // 3D Coastal Towers & Golden Horizon
      const coastalMat = new THREE.MeshStandardMaterial({
        color: 0x180c04,
        emissive: 0xf97316,
        emissiveIntensity: 0.9,
        roughness: 0.4,
        metalness: 0.7,
      });

      for (let i = -14; i <= 14; i++) {
        if (Math.abs(i) < 2) continue;
        const height = Math.random() * 40 + 20;
        const width = Math.random() * 10 + 6;

        const geo = new THREE.BoxGeometry(width, height, width);
        const tower = new THREE.Mesh(geo, coastalMat);
        tower.position.set(i * 13, height / 2, -160 - Math.random() * 60);
        this.horizonGroup.add(tower);
      }
    }

    // Environmental 3D Sky Particles (Snowfall for Antarctica, Bokeh Sparks for City)
    const pGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const pMat = new THREE.MeshBasicMaterial({
      color: theme.lightColor,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < 60; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 120,
        Math.random() * 40 + 2,
        -Math.random() * 160 - 20
      );
      this.particleGroup.add(p);
    }
  }

  public update(delta: number, playerZ: number): void {
    if (!this.worldGroup) return;

    this.animTime += delta;

    // Synchronize 3D World Environment with endless player movement
    this.worldGroup.position.z = playerZ - 20;

    // Subtle 3D Horizon motion
    this.horizonGroup.rotation.y = Math.sin(this.animTime * 0.08) * 0.03;

    // Animate environmental particles (falling snow / drifting bokeh lights)
    this.particleGroup.children.forEach((p, idx) => {
      p.position.y -= (0.2 + (idx % 3) * 0.1) * delta * 10;
      if (p.position.y < 0) p.position.y = 40;
      p.position.x += Math.sin(this.animTime + idx) * 0.02;
    });
  }
}

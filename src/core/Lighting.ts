import * as THREE from 'three';

export class LightingManager {
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public fog: THREE.FogExp2;

  constructor(scene: THREE.Scene) {
    // 1. Directional Sunlight
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.position.set(15, 30, 15);
    this.dirLight.castShadow = true;

    // Shadow configuration
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.bias = -0.0001;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    
    // Shadow camera bounds
    const d = 30;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;

    scene.add(this.dirLight);

    // 2. Hemispheric Ambient Light
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.hemiLight.position.set(0, 50, 0);
    scene.add(this.hemiLight);

    // 3. Volumetric Exponential Fog
    this.fog = new THREE.FogExp2(0x0a0a12, 0.015);
    scene.fog = this.fog;
  }
}

import * as THREE from 'three';

export interface CameraOffset {
  x: number;
  y: number;
  z: number;
}

export class CameraManager {
  public camera: THREE.PerspectiveCamera;
  public targetOffset: CameraOffset = { x: 0, y: 4.5, z: 7.5 };
  public lerpSpeed: number = 8.0;

  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  private lookAtPosition: THREE.Vector3 = new THREE.Vector3();

  // Screen Shake Effect
  private shakeTimer: number = 0;
  private shakeDuration: number = 0;
  private shakeMagnitude: number = 0;

  // Dynamic Field of View
  public targetFOV: number = 60;
  public baseFOV: number = 60;

  constructor(aspect: number) {
    // PerspectiveCamera (FOV 60, Near 0.1, Far 500)
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
    this.camera.position.set(0, this.targetOffset.y, this.targetOffset.z);
    this.currentPosition.copy(this.camera.position);
  }

  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public setBoostFOV(active: boolean): void {
    this.targetFOV = active ? 75 : this.baseFOV;
  }

  public triggerShake(duration: number = 0.3, magnitude: number = 0.4): void {
    this.shakeDuration = duration;
    this.shakeTimer = duration;
    this.shakeMagnitude = magnitude;
  }

  public update(targetPos: THREE.Vector3, delta: number): void {
    // 1. Smooth FOV Interpolation
    if (Math.abs(this.camera.fov - this.targetFOV) > 0.05) {
      this.camera.fov += (this.targetFOV - this.camera.fov) * (8.0 * delta);
      this.camera.updateProjectionMatrix();
    }

    // 2. Camera Follow Position
    const desiredPos = new THREE.Vector3(
      targetPos.x + this.targetOffset.x,
      targetPos.y + this.targetOffset.y,
      targetPos.z + this.targetOffset.z
    );

    const t = 1 - Math.exp(-this.lerpSpeed * delta);
    this.currentPosition.lerp(desiredPos, t);
    this.camera.position.copy(this.currentPosition);

    // 3. Screen Shake Offset
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentMag = this.shakeMagnitude * progress;

      const shakeX = (Math.random() - 0.5) * 2 * currentMag;
      const shakeY = (Math.random() - 0.5) * 2 * currentMag;

      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
    }

    // 4. Dynamic LookAt Point
    const desiredLookAt = new THREE.Vector3(
      targetPos.x * 0.4,
      targetPos.y + 1.6,
      targetPos.z - 8.0
    );
    this.lookAtPosition.lerp(desiredLookAt, t);
    this.camera.lookAt(this.lookAtPosition);
  }
}

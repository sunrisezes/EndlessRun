import * as THREE from 'three';

export class TextureGenerator {
  /**
   * Generates procedural PBR Asphalt textures (diffuse map, normal map, roughness map)
   */
  public static createAsphaltTextures(): {
    map: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  } {
    const size = 512;

    // 1. Diffuse Map (Dark asphalt with fine noise)
    const canvasDiff = document.createElement('canvas');
    canvasDiff.width = size;
    canvasDiff.height = size;
    const ctxDiff = canvasDiff.getContext('2d')!;

    ctxDiff.fillStyle = '#11131a';
    ctxDiff.fillRect(0, 0, size, size);

    const imgDataDiff = ctxDiff.getImageData(0, 0, size, size);
    const dataDiff = imgDataDiff.data;

    // 2. Normal Map
    const canvasNorm = document.createElement('canvas');
    canvasNorm.width = size;
    canvasNorm.height = size;
    const ctxNorm = canvasNorm.getContext('2d')!;
    const imgDataNorm = ctxNorm.createImageData(size, size);
    const dataNorm = imgDataNorm.data;

    // 3. Roughness Map
    const canvasRough = document.createElement('canvas');
    canvasRough.width = size;
    canvasRough.height = size;
    const ctxRough = canvasRough.getContext('2d')!;
    const imgDataRough = ctxRough.createImageData(size, size);
    const dataRough = imgDataRough.data;

    for (let i = 0; i < dataDiff.length; i += 4) {
      const noise = (Math.random() - 0.5) * 25;
      const grain = Math.floor(18 + noise);

      // Diffuse
      dataDiff[i] = grain;
      dataDiff[i + 1] = grain + 2;
      dataDiff[i + 2] = grain + 8;
      dataDiff[i + 3] = 255;

      // Normal (Tangent space normal vector)
      const nx = (Math.random() - 0.5) * 40 + 128;
      const ny = (Math.random() - 0.5) * 40 + 128;
      dataNorm[i] = nx;
      dataNorm[i + 1] = ny;
      dataNorm[i + 2] = 255; // Red/Green perturbation, Blue pointing out
      dataNorm[i + 3] = 255;

      // Roughness
      const roughVal = Math.floor(180 + Math.random() * 60);
      dataRough[i] = roughVal;
      dataRough[i + 1] = roughVal;
      dataRough[i + 2] = roughVal;
      dataRough[i + 3] = 255;
    }

    ctxDiff.putImageData(imgDataDiff, 0, 0);
    ctxNorm.putImageData(imgDataNorm, 0, 0);
    ctxRough.putImageData(imgDataRough, 0, 0);

    const map = new THREE.CanvasTexture(canvasDiff);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;

    const normalMap = new THREE.CanvasTexture(canvasNorm);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;

    const roughnessMap = new THREE.CanvasTexture(canvasRough);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;

    return { map, normalMap, roughnessMap };
  }

  /**
   * Generates procedural PBR Hazard Warning Stripe textures (Yellow / Dark Slate diagonal stripes)
   */
  public static createHazardStripeTextures(): {
    map: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
  } {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Yellow & Dark Slate Stripe Pattern
    ctx.fillStyle = '#f59e0b'; // Amber Yellow
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#0f172a'; // Dark Slate
    const stripeWidth = 32;
    ctx.beginPath();
    for (let x = -size; x < size * 2; x += stripeWidth * 2) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - size, size);
      ctx.lineTo(x - size, size);
      ctx.closePath();
    }
    ctx.fill();

    // Normal Map for metallic bevel edge simulation
    const canvasNorm = document.createElement('canvas');
    canvasNorm.width = size;
    canvasNorm.height = size;
    const ctxNorm = canvasNorm.getContext('2d')!;
    ctxNorm.fillStyle = 'rgb(128, 128, 255)';
    ctxNorm.fillRect(0, 0, size, size);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;

    const normalMap = new THREE.CanvasTexture(canvasNorm);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;

    return { map, normalMap };
  }
}

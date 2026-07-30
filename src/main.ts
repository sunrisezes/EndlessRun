import { Engine } from './core/Engine';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (!container) {
    console.error('Root container element #app not found.');
    return;
  }

  // Initialize Core 3D Engine
  const engine = new Engine(container);
  
  // Start game loop
  engine.start();

  console.log('3D Endless Runner Engine initialized successfully with PBR Lighting, Shadows, and Bloom.');
});

# 🏃 Cyber Runner 3D - High-Speed Procedural WebGL Endless Runner

![Version](https://img.shields.io/badge/version-1.0.0-00f0ff.svg)
![Three.js](https://img.shields.io/badge/Three.js-r174-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Cyber Runner 3D** is a state-of-the-art, high-performance 3D Endless Runner built with **Three.js**, **TypeScript**, **Vite**, and **Zustand**. Designed with modern glassmorphism UI aesthetics, procedural WebGL graphics, custom PBR shaders, dynamic volumetric lighting, and a custom Web Audio API synthesizer engine.

---

## 🌟 Key Features

### 1. 🗺️ 6 Immersive World Map Themes
Players can switch between **6 distinct thematic map worlds** instantly via the left-side Theme Selector panel:
- 🏙️ **Cyber City (Default)**: Cyberpunk Metropolis with neon cyan grid lighting and volumetric atmospheric fog.
- 🗽 **New York City**: Times Square night cityscape with warm gold skyscraper lights and amber curbs.
- 🏮 **Tokyo (Shibuya Cyber District)**: Shibuya neon towers with Japanese Kanji light signs (`東京`, `渋谷`, `ネオン`) and pink/violet aurora horizons.
- 🌅 **Sunset Highway**: Coastal expressway skyline with a warm golden sunset disc, amber dust particles, and saffron orange curbs.
- ❄️ **Antarctica**: Antarctic iceberg mountain peaks with diamond specular reflections, polar blue sky, and falling 3D snow.
- 🌲 **Forest**: Lush green pine forest line with rolling forest mist, floating emerald fireflies, and vibrant green curbs.

---

### 2. ⚡ 5 Invincible 10-Second Power-Up Boosters
- 🧲 **Coin Magnet**: Automatically attracts all ground and air coins towards the player for 10 seconds.
- 🛡️ **Invincible Shield**: Equips an energy shield that lets the player smash through all obstacles without taking damage for 10 seconds.
- ⚡ **5x Speed Booster**: Accelerates player forward velocity to hyper-speed while granting obstacle invincibility for 10 seconds.
- 🚀 **Flying Jetpack Booster**: Elevates the runner to high altitude (`y = 4.5u`) above barriers to fly freely and collect elevated sky coin trails for 10 seconds.
- ✖️ **2x Score Multiplier**: Doubles all distance points earned for 10 seconds.

---

### 3. 🪙 Ground, Jump & Flying Sky Coins
- **Ground Coin Trails**: Standard road surface coin collections.
- **Jump Arc Coins**: Positioned at jump apex (`y = 1.8u`) over low barriers for rhythmic jumping.
- **Flying Sky Coin Lines**: Floating sky trails (`y = 4.2u`) aligned perfectly with the Flying Jetpack Booster.
- **Standard Sizing Guarantee**: All coins use identical geometry (`0.35` radius) to maintain visual consistency across all altitudes.

---

### 4. 🎵 Web Audio API Sound Engine & Settings
- **Procedural Lo-Fi Synthwave BGM**: Smooth, calming chord progressions (`Cmaj7` → `Am7` → `Fmaj7` → `G7`) generated in real-time via Web Audio API oscillators.
- **Dynamic SFX**: Synthesized sound effects for jump, slide, coin pickup, power-up activation, and crash explosions.
- **Audio Control Center**: Integrated volume modal (`⚙️`) with independent sliders for Master Volume, BGM Volume, and SFX Volume plus a one-tap Mute toggle.

---

### 5. 📱 Cross-Platform Responsive Controls
- **Desktop**: Full keyboard controls (`W/A/S/D`, Arrow Keys, `Space` for jump/slide/start, `R` for restart).
- **Mobile & Tablet Touch Gestures**: Smooth touch swipe detection (Swipe Up to Jump, Swipe Down to Slide, Swipe Left/Right to Switch Lanes).
- **Virtual Touch Control Pad**: Semi-transparent on-screen D-Pad (`◀`, `▶`, `▼`, `▲`) optimized for smartphones and tablets.
- **Dynamic FOV**: Automatically adjusts camera field of view for portrait screens (`aspect < 1.0`) so all 3 runner lanes remain in full view.

---

### 6. 🛤️ Continuous Endless Track Engine
- **Infinite Chunk Recycling**: Generates 14 active track chunks (`420 units` total rendering distance).
- **Camera Safety Margin**: Features a `40-unit` recycling buffer behind the player camera, guaranteeing zero popping, zero gaps, and unbreakable road geometry behind the runner.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Core Engine** | Three.js (WebGL2 / ACESFilmic Tone Mapping / PCFSoftShadowMap) |
| **Language** | TypeScript 5.7+ |
| **Build Tool** | Vite 6.2+ |
| **State Management** | Zustand |
| **Post-Processing** | Three.js `EffectComposer`, `RenderPass`, `UnrealBloomPass` |
| **Audio Engine** | Web Audio API (`AudioContext`, `GainNode`, Custom Oscillators) |
| **Styling** | Vanilla CSS3 (Glassmorphism, Flexbox, Fluid `clamp()` Typography) |

---

## 📂 Project Structure

```
EndlessRun/
├── index.html                  # Main entrypoint & mobile viewport / touch configuration
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript strict configuration
├── vite.config.ts              # Vite bundler configuration
└── src/
    ├── main.ts                 # Application entrypoint
    ├── audio/
    │   └── AudioManager.ts     # Web Audio API synthesizer & volume GainNode graph
    ├── components/
    │   ├── Character.ts        # Player physics, jump, slide, flight & speed boost logic
    │   ├── CollisionDetector.ts# Hitbox & bounding box collision engine
    │   ├── ObstaclePool.ts     # Object pooling for barriers, traps & blockades
    │   ├── PowerUpManager.ts   # Power-up items, timers & coin pattern spawner
    │   └── TrackManager.ts     # Infinite track chunk spawner & recycling system
    ├── core/
    │   ├── CameraManager.ts    # Smooth camera follow, FOV lerp & screen shake
    │   ├── Engine.ts           # Main game loop, WebGL renderer & post-processing bloom
    │   ├── InputManager.ts     # Keyboard, touch swipe & virtual button event hub
    │   └── Lighting.ts         # Directional shadow lights & atmospheric fog
    ├── state/
    │   └── GameStore.ts        # Zustand store for high scores, current run & coins
    ├── theme/
    │   └── ThemeManager.ts     # 6 Map Theme configurations & 3D Sky Dome environment manager
    ├── ui/
    │   └── HUD.ts              # Glassmorphic UI overlays, Start Menu, HUD, Audio Modal & Theme Panel
    └── utils/
        ├── ParticleSystem.ts   # Footstep dust & crash explosion particle physics
        └── TextureGenerator.ts # Procedural PBR asphalt & obstacle textures
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation
1. Clone the repository or navigate to the project directory:
   ```bash
   cd EndlessRun
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the URL shown in terminal).

---

## 🎮 How to Play

| Action | Desktop Keyboard | Mobile / Tablet Touch |
| :--- | :--- | :--- |
| **Move Left** | `A` or `Left Arrow` | Swipe Left or Tap `◀` |
| **Move Right** | `D` or `Right Arrow` | Swipe Right or Tap `▶` |
| **Jump** | `W` / `Up Arrow` / `Space` | Swipe Up or Tap `▲` |
| **Slide** | `S` or `Down Arrow` | Swipe Down or Tap `▼` |
| **Start Game** | `Space` or `Enter` | Tap `START RUN` Button |
| **Restart Game** | `R` Key | Tap `PLAY AGAIN` Button |

---

## 📜 Build for Production

To compile the TypeScript project and generate an optimized production bundle:

```bash
npm run build
```

To preview the built production bundle locally:

```bash
npm run preview
```

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute for personal or commercial projects.

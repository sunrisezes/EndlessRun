import { AudioManager } from '../audio/AudioManager';
import { useGameStore } from '../state/GameStore';

export class HUD {
  private container: HTMLElement;
  private audioManager: AudioManager;

  // UI Container Elements
  private startMenuOverlay: HTMLElement;
  private inGameHUD: HTMLElement;
  private gameOverOverlay: HTMLElement;

  // Element References (Definite Assignment Assertions)
  private distanceText!: HTMLElement;
  private coinsText!: HTMLElement;
  private powerupsContainer!: HTMLElement;
  private finalScoreText!: HTMLElement;
  private highScoreText!: HTMLElement;
  private coinsEarnedText!: HTMLElement;
  private muteBtn!: HTMLElement;

  // Callbacks
  public onStartGame?: () => void;
  public onRestartGame?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.audioManager = AudioManager.getInstance();

    this.startMenuOverlay = this.createStartMenu();
    this.inGameHUD = this.createInGameHUD();
    this.gameOverOverlay = this.createGameOverOverlay();

    this.container.appendChild(this.startMenuOverlay);
    this.container.appendChild(this.inGameHUD);
    this.container.appendChild(this.gameOverOverlay);

    // Initial State: Show Start Menu, Hide HUD & Game Over
    this.showStartMenu();

    // Listen to Keyboard shortcuts (Space/Enter for start, R for restart)
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && this.startMenuOverlay.style.display !== 'none') {
        this.handleStartClick();
      } else if (e.code === 'KeyR' && this.gameOverOverlay.style.display !== 'none') {
        this.handleRestartClick();
      }
    });
  }

  private createStartMenu(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'hud-start-menu';
    this.applyGlassStyle(el);
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.width = '90%';
    el.style.maxWidth = '480px';
    el.style.padding = '32px';
    el.style.textAlign = 'center';
    el.style.color = '#ffffff';

    el.innerHTML = `
      <div style="font-size: 32px; font-weight: 900; letter-spacing: 2px; color: #00f0ff; text-shadow: 0 0 16px rgba(0,240,255,0.6); margin-bottom: 8px;">
        CYBER RUNNER 3D
      </div>
      <div style="font-size: 14px; color: #94a3b8; margin-bottom: 24px;">High-Speed Procedural PBR Runner</div>

      <div style="background: rgba(2, 6, 23, 0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2); margin-bottom: 24px; text-align: left; font-size: 13px; line-height: 1.6;">
        <div style="color: #38bdf8; font-weight: bold; margin-bottom: 6px;">CONTROLS:</div>
        <div>🎮 <b>A / D</b> or <b>Left / Right</b> : Switch Lane</div>
        <div>🚀 <b>W / Up / Space</b> : Jump</div>
        <div>🛡️ <b>S / Down</b> : Slide</div>
        <div>📱 <b>Swipe Left / Right / Up / Down</b> for Mobile</div>
      </div>

      <button id="start-btn" style="
        width: 100%;
        padding: 16px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 1px;
        color: #0f172a;
        background: linear-gradient(135deg, #00f0ff 0%, #38bdf8 100%);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      ">
        PRESS SPACE / TAP TO RUN
      </button>
    `;

    setTimeout(() => {
      const btn = el.querySelector('#start-btn');
      btn?.addEventListener('click', () => this.handleStartClick());
    }, 0);

    return el;
  }

  private createInGameHUD(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'hud-ingame';
    el.style.position = 'absolute';
    el.style.top = '16px';
    el.style.left = '16px';
    el.style.right = '16px';
    el.style.display = 'flex';
    el.style.justifyContent = 'space-between';
    el.style.alignItems = 'flex-start';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '100';

    // Left Stats Panel
    const leftPanel = document.createElement('div');
    this.applyGlassStyle(leftPanel);
    leftPanel.style.padding = '12px 20px';
    leftPanel.style.color = '#ffffff';

    leftPanel.innerHTML = `
      <div id="hud-dist" style="font-size: 20px; font-weight: 900; color: #00f0ff;">0 m</div>
      <div id="hud-coins" style="font-size: 15px; font-weight: 700; color: #f59e0b; margin-top: 4px;">0 🪙</div>
    `;

    // Right Controls / Audio Panel
    const rightPanel = document.createElement('div');
    this.applyGlassStyle(rightPanel);
    rightPanel.style.padding = '8px 12px';
    rightPanel.style.pointerEvents = 'auto';

    this.muteBtn = document.createElement('button');
    this.muteBtn.style.background = 'transparent';
    this.muteBtn.style.border = 'none';
    this.muteBtn.style.fontSize = '20px';
    this.muteBtn.style.cursor = 'pointer';
    this.muteBtn.innerText = '🔊';
    this.muteBtn.addEventListener('click', () => {
      const muted = this.audioManager.toggleMute();
      this.muteBtn.innerText = muted ? '🔇' : '🔊';
    });
    rightPanel.appendChild(this.muteBtn);

    // Active Powerups Bar Container
    this.powerupsContainer = document.createElement('div');
    this.powerupsContainer.style.position = 'absolute';
    this.powerupsContainer.style.top = '72px';
    this.powerupsContainer.style.left = '0px';
    this.powerupsContainer.style.display = 'flex';
    this.powerupsContainer.style.flexDirection = 'column';
    this.powerupsContainer.style.gap = '8px';

    leftPanel.appendChild(this.powerupsContainer);

    el.appendChild(leftPanel);
    el.appendChild(rightPanel);

    this.distanceText = leftPanel.querySelector('#hud-dist')!;
    this.coinsText = leftPanel.querySelector('#hud-coins')!;

    return el;
  }

  private createGameOverOverlay(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'hud-gameover-overlay';
    this.applyGlassStyle(el);
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.width = '90%';
    el.style.maxWidth = '420px';
    el.style.padding = '32px';
    el.style.textAlign = 'center';
    el.style.color = '#ffffff';

    el.innerHTML = `
      <div style="font-size: 28px; font-weight: 900; color: #ef4444; text-shadow: 0 0 12px rgba(239,68,68,0.6); margin-bottom: 16px;">
        GAME OVER
      </div>

      <div style="background: rgba(2, 6, 23, 0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 24px; text-align: left;">
        <div style="font-size: 14px; color: #94a3b8;">FINAL DISTANCE:</div>
        <div id="go-final-score" style="font-size: 24px; font-weight: 900; color: #00f0ff; margin-bottom: 12px;">0 m</div>

        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #cbd5e1;">
          <div>HIGH SCORE: <b id="go-high-score" style="color: #f59e0b;">0 m</b></div>
          <div>COINS: <b id="go-coins" style="color: #eab308;">0 🪙</b></div>
        </div>
      </div>

      <button id="restart-btn" style="
        width: 100%;
        padding: 16px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 1px;
        color: #ffffff;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
        transition: transform 0.15s ease;
      ">
        PLAY AGAIN [R]
      </button>
    `;

    setTimeout(() => {
      const btn = el.querySelector('#restart-btn');
      btn?.addEventListener('click', () => this.handleRestartClick());
    }, 0);

    this.finalScoreText = el.querySelector('#go-final-score')!;
    this.highScoreText = el.querySelector('#go-high-score')!;
    this.coinsEarnedText = el.querySelector('#go-coins')!;

    return el;
  }

  private applyGlassStyle(el: HTMLElement): void {
    el.style.position = 'absolute';
    el.style.background = 'rgba(15, 23, 42, 0.8)';
    el.style.backdropFilter = 'blur(12px)';
    (el.style as unknown as Record<string, string>).webkitBackdropFilter = 'blur(12px)';
    el.style.border = '1px solid rgba(56, 189, 248, 0.3)';
    el.style.borderRadius = '16px';
    el.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.5)';
    el.style.zIndex = '100';
  }

  private handleStartClick(): void {
    this.startMenuOverlay.style.display = 'none';
    this.inGameHUD.style.display = 'flex';
    this.gameOverOverlay.style.display = 'none';
    if (this.onStartGame) this.onStartGame();
  }

  private handleRestartClick(): void {
    this.gameOverOverlay.style.display = 'none';
    this.inGameHUD.style.display = 'flex';
    if (this.onRestartGame) this.onRestartGame();
  }

  public showStartMenu(): void {
    this.startMenuOverlay.style.display = 'block';
    this.inGameHUD.style.display = 'none';
    this.gameOverOverlay.style.display = 'none';
  }

  public showGameOver(distance: number, coins: number): void {
    const store = useGameStore.getState();
    store.updateCurrentRun(distance, coins);
    store.recordRunEnd();

    const state = useGameStore.getState();

    this.finalScoreText.innerText = `${distance} m`;
    this.highScoreText.innerText = `${state.highScore} m`;
    this.coinsEarnedText.innerText = `${coins} 🪙`;

    this.inGameHUD.style.display = 'none';
    this.gameOverOverlay.style.display = 'block';
  }

  public updateHUD(distance: number, coins: number, multiplier: number, powerups: {
    magnetTimer: number;
    shieldActive: boolean;
    boostTimer: number;
    multiplierTimer: number;
  }): void {
    const displayDistance = distance * multiplier;
    this.distanceText.innerHTML = `${displayDistance} m ${multiplier > 1 ? '<span style="color:#a855f7; font-size:14px;">[2X]</span>' : ''}`;
    this.coinsText.innerText = `${coins} 🪙`;

    // Render Active Power-Up Progress Badges
    this.powerupsContainer.innerHTML = '';

    if (powerups.magnetTimer > 0) {
      this.addPowerUpBadge('🧲 MAGNET', powerups.magnetTimer / 8.0, '#3b82f6');
    }
    if (powerups.shieldActive) {
      this.addPowerUpBadge('🛡️ SHIELD', 1.0, '#06b6d4');
    }
    if (powerups.boostTimer > 0) {
      this.addPowerUpBadge('⚡ BOOST', powerups.boostTimer / 5.0, '#eab308');
    }
    if (powerups.multiplierTimer > 0) {
      this.addPowerUpBadge('✖️ 2X MULTIPLIER', powerups.multiplierTimer / 10.0, '#a855f7');
    }
  }

  private addPowerUpBadge(label: string, progressRatio: number, color: string): void {
    const badge = document.createElement('div');
    badge.style.background = 'rgba(2, 6, 23, 0.7)';
    badge.style.border = `1px solid ${color}`;
    badge.style.borderRadius = '6px';
    badge.style.padding = '4px 8px';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = 'bold';
    badge.style.color = color;
    badge.style.width = '140px';
    badge.style.overflow = 'hidden';

    const bar = document.createElement('div');
    bar.style.height = '3px';
    bar.style.background = color;
    bar.style.marginTop = '4px';
    bar.style.borderRadius = '2px';
    bar.style.width = `${Math.min(100, progressRatio * 100)}%`;
    bar.style.transition = 'width 0.1s linear';

    badge.innerText = label;
    badge.appendChild(bar);
    this.powerupsContainer.appendChild(badge);
  }
}

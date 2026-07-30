import { AudioManager } from '../audio/AudioManager';
import { ThemeManager } from '../theme/ThemeManager';
import { useGameStore } from '../state/GameStore';

export class HUD {
  private container: HTMLElement;
  private audioManager: AudioManager;
  private themeManager: ThemeManager;

  // UI Container Elements
  private startMenuOverlay: HTMLElement;
  private inGameHUD: HTMLElement;
  private gameOverOverlay: HTMLElement;
  private audioSettingsModal!: HTMLElement;
  private mapDropdownMenu!: HTMLElement;
  private touchControlsContainer!: HTMLElement;

  // Element References
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
  public onAction?: (action: 'LEFT' | 'RIGHT' | 'JUMP' | 'SLIDE') => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.audioManager = AudioManager.getInstance();
    this.themeManager = ThemeManager.getInstance();

    this.startMenuOverlay = this.createStartMenu();
    this.inGameHUD = this.createInGameHUD();
    this.gameOverOverlay = this.createGameOverOverlay();
    this.createAudioSettingsModal();
    this.createMapDropdownMenu();

    this.container.appendChild(this.startMenuOverlay);
    this.container.appendChild(this.inGameHUD);
    this.container.appendChild(this.gameOverOverlay);
    this.container.appendChild(this.audioSettingsModal);
    this.container.appendChild(this.mapDropdownMenu);

    // Initial State: Show Start Menu
    this.showStartMenu();

    // Listen to Keyboard shortcuts (Space/Enter for start, R for restart)
    window.addEventListener('keydown', (e) => {
      if (
        (e.code === 'Space' || e.code === 'Enter') &&
        this.startMenuOverlay.style.display !== 'none' &&
        this.audioSettingsModal.style.display === 'none' &&
        this.mapDropdownMenu.style.display === 'none'
      ) {
        this.handleStartClick();
      } else if (
        e.code === 'KeyR' &&
        this.gameOverOverlay.style.display !== 'none' &&
        this.audioSettingsModal.style.display === 'none' &&
        this.mapDropdownMenu.style.display === 'none'
      ) {
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
    el.style.maxWidth = '440px';
    el.style.maxHeight = '80vh';
    el.style.overflowY = 'auto';
    el.style.padding = 'clamp(16px, 4vw, 28px)';
    el.style.textAlign = 'center';
    el.style.color = '#ffffff';

    el.innerHTML = `
      <div style="font-size: clamp(22px, 6vw, 30px); font-weight: 900; letter-spacing: 2px; color: #00f0ff; text-shadow: 0 0 16px rgba(0,240,255,0.6); margin-bottom: 6px;">
        CYBER RUNNER 3D
      </div>
      <div style="font-size: clamp(12px, 3.5vw, 14px); color: #94a3b8; margin-bottom: 16px;">High-Speed Procedural PBR Runner</div>

      <div style="background: rgba(2, 6, 23, 0.6); padding: clamp(10px, 3vw, 14px); border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2); margin-bottom: 18px; text-align: left; font-size: clamp(11px, 3vw, 13px); line-height: 1.5;">
        <div style="color: #38bdf8; font-weight: bold; margin-bottom: 4px;">CONTROLS:</div>
        <div>🎮 <b>A / D</b> or <b>Left / Right</b> : Switch Lane</div>
        <div>🚀 <b>W / Up / Space</b> : Jump</div>
        <div>🛡️ <b>S / Down</b> : Slide</div>
        <div>🗺️ <b>Tap 🗺️ MAPS Icon</b> on Top-Left to switch maps</div>
      </div>

      <div style="display: flex; gap: 10px;">
        <button id="start-btn" style="
          flex: 1;
          padding: clamp(12px, 3vw, 16px);
          font-size: clamp(15px, 4vw, 18px);
          font-weight: 800;
          letter-spacing: 1px;
          color: #0f172a;
          background: linear-gradient(135deg, #00f0ff 0%, #38bdf8 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
          transition: transform 0.15s ease;
        ">
          START RUN
        </button>
      </div>
    `;

    setTimeout(() => {
      const btn = el.querySelector('#start-btn');
      btn?.addEventListener('click', () => this.handleStartClick());
    }, 0);

    return el;
  }

  // --- Collapsible Map Dropdown Menu Component ---

  private createMapDropdownMenu(): void {
    this.mapDropdownMenu = document.createElement('div');
    this.mapDropdownMenu.className = 'map-dropdown-menu';
    this.applyGlassStyle(this.mapDropdownMenu);
    this.mapDropdownMenu.style.position = 'absolute';
    this.mapDropdownMenu.style.top = '64px';
    this.mapDropdownMenu.style.left = '16px';
    this.mapDropdownMenu.style.width = 'min(240px, 85vw)';
    this.mapDropdownMenu.style.maxHeight = '70vh';
    this.mapDropdownMenu.style.overflowY = 'auto';
    this.mapDropdownMenu.style.padding = '12px';
    this.mapDropdownMenu.style.zIndex = '250';
    this.mapDropdownMenu.style.color = '#ffffff';
    this.mapDropdownMenu.style.display = 'none'; // Hidden by default until 🗺️ MAPS button is tapped!

    this.renderMapDropdownItems();
  }

  private renderMapDropdownItems(): void {
    const activeThemeId = this.themeManager.currentTheme.id;

    let html = `
      <div style="font-size: 13px; font-weight: 800; color: #00f0ff; letter-spacing: 1px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
        <span>🗺️ SELECT MAP</span>
        <button id="close-map-dropdown" style="background: transparent; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 2px 6px;">✖</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
    `;

    ThemeManager.THEMES.forEach((theme) => {
      const isActive = theme.id === activeThemeId;
      const activeBorder = isActive
        ? 'border: 2px solid #00f0ff; background: rgba(0, 240, 255, 0.25); box-shadow: 0 0 12px rgba(0,240,255,0.4);'
        : 'border: 1px solid rgba(255,255,255,0.15); background: rgba(2, 6, 23, 0.7);';

      html += `
        <button class="map-item-btn" data-theme="${theme.id}" style="
          padding: 8px 10px;
          border-radius: 8px;
          ${activeBorder}
          color: #ffffff;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <span style="font-size: 18px;">${theme.icon}</span>
          <div style="overflow: hidden; flex: 1;">
            <div style="font-size: 12px; font-weight: 800; color: ${isActive ? '#00f0ff' : '#e2e8f0'}; text-overflow: ellipsis; white-space: nowrap;">
              ${theme.name}
            </div>
            <div style="font-size: 10px; color: #94a3b8; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
              ${theme.description}
            </div>
          </div>
        </button>
      `;
    });

    html += `</div>`;
    this.mapDropdownMenu.innerHTML = html;

    setTimeout(() => {
      const closeBtn = this.mapDropdownMenu.querySelector('#close-map-dropdown');
      closeBtn?.addEventListener('click', () => this.toggleMapDropdown(false));

      const mapBtns = this.mapDropdownMenu.querySelectorAll('.map-item-btn');
      mapBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const themeId = (e.currentTarget as HTMLElement).getAttribute('data-theme');
          if (themeId) {
            this.themeManager.setTheme(themeId);
            this.renderMapDropdownItems();
            this.toggleMapDropdown(false); // Auto-close menu after selecting map!
          }
        });
      });
    }, 0);
  }

  private toggleMapDropdown(show?: boolean): void {
    const isCurrentlyVisible = this.mapDropdownMenu.style.display !== 'none';
    const nextState = show !== undefined ? show : !isCurrentlyVisible;
    this.mapDropdownMenu.style.display = nextState ? 'block' : 'none';
  }

  private createInGameHUD(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'hud-ingame';
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.right = '0';
    el.style.bottom = '0';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '100';

    // Top Main Header Bar (Left Stats & Maps, Right Volume Controls)
    const topBar = document.createElement('div');
    topBar.style.position = 'absolute';
    topBar.style.top = '14px';
    topBar.style.left = '14px';
    topBar.style.right = '14px';
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'flex-start';

    // Top-Left Panel (🗺️ MAPS Button + Distance & Coins Stats)
    const topLeftContainer = document.createElement('div');
    topLeftContainer.style.pointerEvents = 'auto';
    topLeftContainer.style.display = 'flex';
    topLeftContainer.style.alignItems = 'center';
    topLeftContainer.style.gap = '8px';

    // 🗺️ MAPS Toggle Button
    const mapToggleBtn = document.createElement('button');
    this.applyGlassStyle(mapToggleBtn);
    mapToggleBtn.style.padding = '8px 12px';
    mapToggleBtn.style.color = '#00f0ff';
    mapToggleBtn.style.fontSize = '13px';
    mapToggleBtn.style.fontWeight = '800';
    mapToggleBtn.style.cursor = 'pointer';
    mapToggleBtn.style.display = 'flex';
    mapToggleBtn.style.alignItems = 'center';
    mapToggleBtn.style.gap = '4px';
    mapToggleBtn.innerHTML = `🗺️ <span style="font-size: 11px;">MAPS</span>`;
    mapToggleBtn.addEventListener('click', () => this.toggleMapDropdown());

    // Stats Box (Distance & Coins)
    const statsBox = document.createElement('div');
    this.applyGlassStyle(statsBox);
    statsBox.style.padding = '6px 12px';
    statsBox.style.color = '#ffffff';

    statsBox.innerHTML = `
      <div id="hud-dist" style="font-size: clamp(14px, 3.5vw, 18px); font-weight: 900; color: #00f0ff;">0 m</div>
      <div id="hud-coins" style="font-size: clamp(12px, 3vw, 14px); font-weight: 700; color: #f59e0b; margin-top: 1px;">0 🪙</div>
    `;

    topLeftContainer.appendChild(mapToggleBtn);
    topLeftContainer.appendChild(statsBox);

    // Top-Right Panel (🔊 Mute & ⚙️ Volume Settings Buttons)
    const topRightContainer = document.createElement('div');
    this.applyGlassStyle(topRightContainer);
    topRightContainer.style.padding = '6px 10px';
    topRightContainer.style.pointerEvents = 'auto';
    topRightContainer.style.display = 'flex';
    topRightContainer.style.gap = '6px';
    topRightContainer.style.alignItems = 'center';

    this.muteBtn = document.createElement('button');
    this.muteBtn.style.background = 'transparent';
    this.muteBtn.style.border = 'none';
    this.muteBtn.style.fontSize = '18px';
    this.muteBtn.style.cursor = 'pointer';
    this.muteBtn.innerText = '🔊';
    this.muteBtn.title = 'Toggle Mute';
    this.muteBtn.addEventListener('click', () => {
      const muted = this.audioManager.toggleMute();
      this.muteBtn.innerText = muted ? '🔇' : '🔊';
    });

    const settingsBtn = document.createElement('button');
    settingsBtn.style.background = 'transparent';
    settingsBtn.style.border = 'none';
    settingsBtn.style.fontSize = '18px';
    settingsBtn.style.cursor = 'pointer';
    settingsBtn.innerText = '⚙️';
    settingsBtn.title = 'Volume & Audio Settings';
    settingsBtn.addEventListener('click', () => this.openAudioSettings());

    topRightContainer.appendChild(this.muteBtn);
    topRightContainer.appendChild(settingsBtn);

    topBar.appendChild(topLeftContainer);
    topBar.appendChild(topRightContainer);
    el.appendChild(topBar);

    // Active Powerups Bar Container
    this.powerupsContainer = document.createElement('div');
    this.powerupsContainer.style.position = 'absolute';
    this.powerupsContainer.style.top = '68px';
    this.powerupsContainer.style.left = '14px';
    this.powerupsContainer.style.display = 'flex';
    this.powerupsContainer.style.flexDirection = 'column';
    this.powerupsContainer.style.gap = '5px';
    this.powerupsContainer.style.pointerEvents = 'none';

    el.appendChild(this.powerupsContainer);

    // Mobile & Tablet Touch Control Pad Overlay
    this.touchControlsContainer = document.createElement('div');
    this.touchControlsContainer.className = 'mobile-touch-controls';

    this.touchControlsContainer.innerHTML = `
      <div class="touch-pad-left">
        <button class="touch-btn" id="btn-left">◀</button>
        <button class="touch-btn" id="btn-right">▶</button>
      </div>
      <div class="touch-pad-right">
        <button class="touch-btn" id="btn-slide">▼</button>
        <button class="touch-btn" id="btn-jump">▲</button>
      </div>
    `;

    setTimeout(() => {
      const btnLeft = this.touchControlsContainer.querySelector('#btn-left');
      const btnRight = this.touchControlsContainer.querySelector('#btn-right');
      const btnJump = this.touchControlsContainer.querySelector('#btn-jump');
      const btnSlide = this.touchControlsContainer.querySelector('#btn-slide');

      const triggerAction = (action: 'LEFT' | 'RIGHT' | 'JUMP' | 'SLIDE', e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onAction) this.onAction(action);
      };

      btnLeft?.addEventListener('pointerdown', (e) => triggerAction('LEFT', e));
      btnRight?.addEventListener('pointerdown', (e) => triggerAction('RIGHT', e));
      btnJump?.addEventListener('pointerdown', (e) => triggerAction('JUMP', e));
      btnSlide?.addEventListener('pointerdown', (e) => triggerAction('SLIDE', e));
    }, 0);

    el.appendChild(this.touchControlsContainer);

    this.distanceText = statsBox.querySelector('#hud-dist')!;
    this.coinsText = statsBox.querySelector('#hud-coins')!;

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
    el.style.maxWidth = '400px';
    el.style.maxHeight = '80vh';
    el.style.overflowY = 'auto';
    el.style.padding = 'clamp(16px, 4vw, 28px)';
    el.style.textAlign = 'center';
    el.style.color = '#ffffff';

    el.innerHTML = `
      <div style="font-size: clamp(22px, 6vw, 28px); font-weight: 900; color: #ef4444; text-shadow: 0 0 12px rgba(239,68,68,0.6); margin-bottom: 14px;">
        GAME OVER
      </div>

      <div style="background: rgba(2, 6, 23, 0.6); padding: clamp(10px, 3vw, 14px); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 18px; text-align: left;">
        <div style="font-size: 12px; color: #94a3b8;">FINAL DISTANCE:</div>
        <div id="go-final-score" style="font-size: clamp(18px, 5vw, 24px); font-weight: 900; color: #00f0ff; margin-bottom: 8px;">0 m</div>

        <div style="display: flex; justify-content: space-between; font-size: clamp(12px, 3.2vw, 14px); color: #cbd5e1;">
          <div>HIGH SCORE: <b id="go-high-score" style="color: #f59e0b;">0 m</b></div>
          <div>COINS: <b id="go-coins" style="color: #eab308;">0 🪙</b></div>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <button id="restart-btn" style="
          flex: 1;
          padding: clamp(12px, 3vw, 16px);
          font-size: clamp(15px, 4vw, 18px);
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
          PLAY AGAIN
        </button>
      </div>
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

  // --- Audio & Volume Settings Modal ---

  private createAudioSettingsModal(): void {
    this.audioSettingsModal = document.createElement('div');
    this.applyGlassStyle(this.audioSettingsModal);
    this.audioSettingsModal.style.top = '50%';
    this.audioSettingsModal.style.left = '50%';
    this.audioSettingsModal.style.transform = 'translate(-50%, -50%)';
    this.audioSettingsModal.style.width = '90%';
    this.audioSettingsModal.style.maxWidth = '380px';
    this.audioSettingsModal.style.maxHeight = '80vh';
    this.audioSettingsModal.style.overflowY = 'auto';
    this.audioSettingsModal.style.padding = 'clamp(16px, 4vw, 24px)';
    this.audioSettingsModal.style.color = '#ffffff';
    this.audioSettingsModal.style.display = 'none';
    this.audioSettingsModal.style.zIndex = '300';

    const masterVal = Math.round(this.audioManager.getMasterVolume() * 100);
    const bgmVal = Math.round(this.audioManager.getBgmVolume() * 100);
    const sfxVal = Math.round(this.audioManager.getSfxVolume() * 100);

    this.audioSettingsModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div style="font-size: clamp(16px, 4.5vw, 18px); font-weight: 800; color: #00f0ff;">🔊 AUDIO SETTINGS</div>
        <button id="close-audio-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✖</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; font-size: clamp(12px, 3.2vw, 14px);">
        <!-- Master Volume -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>🎚️ Master Volume</span>
            <span id="master-vol-txt">${masterVal}%</span>
          </div>
          <input type="range" id="master-vol-slider" min="0" max="100" value="${masterVal}" style="width: 100%; accent-color: #00f0ff; cursor: pointer; height: 8px;" />
        </div>

        <!-- Music Volume -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>🎵 Music (BGM)</span>
            <span id="bgm-vol-txt">${bgmVal}%</span>
          </div>
          <input type="range" id="bgm-vol-slider" min="0" max="100" value="${bgmVal}" style="width: 100%; accent-color: #38bdf8; cursor: pointer; height: 8px;" />
        </div>

        <!-- SFX Volume -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>🔔 Sound Effects (SFX)</span>
            <span id="sfx-vol-txt">${sfxVal}%</span>
          </div>
          <input type="range" id="sfx-vol-slider" min="0" max="100" value="${sfxVal}" style="width: 100%; accent-color: #f59e0b; cursor: pointer; height: 8px;" />
        </div>

        <!-- Mute Toggle -->
        <button id="modal-mute-btn" style="
          margin-top: 4px;
          padding: 10px;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 8px;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        ">
          ${this.audioManager.getIsMuted() ? '🔇 Unmute All' : '🔊 Mute All'}
        </button>
      </div>
    `;

    setTimeout(() => {
      const closeBtn = this.audioSettingsModal.querySelector('#close-audio-modal');
      closeBtn?.addEventListener('click', () => this.closeAudioSettings());

      const masterSlider = this.audioSettingsModal.querySelector('#master-vol-slider') as HTMLInputElement;
      const masterTxt = this.audioSettingsModal.querySelector('#master-vol-txt') as HTMLElement;
      masterSlider?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        masterTxt.innerText = `${val}%`;
        this.audioManager.setMasterVolume(val / 100);
      });

      const bgmSlider = this.audioSettingsModal.querySelector('#bgm-vol-slider') as HTMLInputElement;
      const bgmTxt = this.audioSettingsModal.querySelector('#bgm-vol-txt') as HTMLElement;
      bgmSlider?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        bgmTxt.innerText = `${val}%`;
        this.audioManager.setBgmVolume(val / 100);
      });

      const sfxSlider = this.audioSettingsModal.querySelector('#sfx-vol-slider') as HTMLInputElement;
      const sfxTxt = this.audioSettingsModal.querySelector('#sfx-vol-txt') as HTMLElement;
      sfxSlider?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        sfxTxt.innerText = `${val}%`;
        this.audioManager.setSfxVolume(val / 100);
      });

      const modalMuteBtn = this.audioSettingsModal.querySelector('#modal-mute-btn') as HTMLElement;
      modalMuteBtn?.addEventListener('click', () => {
        const muted = this.audioManager.toggleMute();
        modalMuteBtn.innerText = muted ? '🔇 Unmute All' : '🔊 Mute All';
        if (this.muteBtn) this.muteBtn.innerText = muted ? '🔇' : '🔊';
      });
    }, 0);
  }

  public openAudioSettings(): void {
    this.audioSettingsModal.style.display = 'block';
  }

  public closeAudioSettings(): void {
    this.audioSettingsModal.style.display = 'none';
  }

  private applyGlassStyle(el: HTMLElement): void {
    el.style.position = 'absolute';
    el.style.background = 'rgba(15, 23, 42, 0.88)';
    el.style.backdropFilter = 'blur(16px)';
    (el.style as unknown as Record<string, string>).webkitBackdropFilter = 'blur(16px)';
    el.style.border = '1px solid rgba(56, 189, 248, 0.3)';
    el.style.borderRadius = '14px';
    el.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.6)';
    el.style.zIndex = '100';
  }

  private handleStartClick(): void {
    this.startMenuOverlay.style.display = 'none';
    this.inGameHUD.style.display = 'block';
    this.gameOverOverlay.style.display = 'none';
    this.closeAudioSettings();
    this.toggleMapDropdown(false);
    if (this.onStartGame) this.onStartGame();
  }

  private handleRestartClick(): void {
    this.gameOverOverlay.style.display = 'none';
    this.inGameHUD.style.display = 'block';
    this.closeAudioSettings();
    this.toggleMapDropdown(false);
    if (this.onRestartGame) this.onRestartGame();
  }

  public showStartMenu(): void {
    this.startMenuOverlay.style.display = 'block';
    this.inGameHUD.style.display = 'block'; // Top HUD bar (MAPS button & Audio settings) stays accessible!
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

    this.inGameHUD.style.display = 'block'; // Keep top bar accessible on game over screen
    this.gameOverOverlay.style.display = 'block';
  }

  public updateHUD(
    distance: number,
    coins: number,
    multiplier: number,
    powerups: {
      magnetTimer: number;
      shieldTimer: number;
      boostTimer: number;
      flyTimer: number;
      multiplierTimer: number;
    }
  ): void {
    const displayDistance = distance * multiplier;
    this.distanceText.innerHTML = `${displayDistance} m ${
      multiplier > 1 ? '<span style="color:#a855f7; font-size:11px;">[2X]</span>' : ''
    }`;
    this.coinsText.innerText = `${coins} 🪙`;

    // Render Active Power-Up Progress Badges
    this.powerupsContainer.innerHTML = '';

    if (powerups.magnetTimer > 0) {
      this.addPowerUpBadge('🧲 MAGNET', powerups.magnetTimer / 10.0, '#3b82f6');
    }
    if (powerups.shieldTimer > 0) {
      this.addPowerUpBadge('🛡️ SHIELD', powerups.shieldTimer / 10.0, '#06b6d4');
    }
    if (powerups.boostTimer > 0) {
      this.addPowerUpBadge('⚡ 5X BOOST', powerups.boostTimer / 10.0, '#eab308');
    }
    if (powerups.flyTimer > 0) {
      this.addPowerUpBadge('🚀 FLYING', powerups.flyTimer / 10.0, '#10b981');
    }
    if (powerups.multiplierTimer > 0) {
      this.addPowerUpBadge('✖️ 2X MULTIPLIER', powerups.multiplierTimer / 10.0, '#a855f7');
    }
  }

  private addPowerUpBadge(label: string, progressRatio: number, color: string): void {
    const badge = document.createElement('div');
    badge.style.background = 'rgba(2, 6, 23, 0.75)';
    badge.style.border = `1px solid ${color}`;
    badge.style.borderRadius = '6px';
    badge.style.padding = '3px 6px';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = 'bold';
    badge.style.color = color;
    badge.style.width = '120px';
    badge.style.overflow = 'hidden';

    const bar = document.createElement('div');
    bar.style.height = '3px';
    bar.style.background = color;
    bar.style.marginTop = '2px';
    bar.style.borderRadius = '2px';
    bar.style.width = `${Math.min(100, progressRatio * 100)}%`;
    bar.style.transition = 'width 0.1s linear';

    badge.innerText = label;
    badge.appendChild(bar);
    this.powerupsContainer.appendChild(badge);
  }
}

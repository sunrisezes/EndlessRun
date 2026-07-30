export type InputAction = 'LEFT' | 'RIGHT' | 'JUMP' | 'SLIDE';

export class InputManager {
  private listeners: Map<InputAction, Array<() => void>> = new Map();
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private minSwipeDistance: number = 30; // pixels

  constructor() {
    this.listeners.set('LEFT', []);
    this.listeners.set('RIGHT', []);
    this.listeners.set('JUMP', []);
    this.listeners.set('SLIDE', []);

    this.initKeyboardListeners();
    this.initTouchListeners();
  }

  public on(action: InputAction, callback: () => void): void {
    const actionListeners = this.listeners.get(action);
    if (actionListeners) {
      actionListeners.push(callback);
    }
  }

  private trigger(action: InputAction): void {
    const actionListeners = this.listeners.get(action);
    if (actionListeners) {
      for (const callback of actionListeners) {
        callback();
      }
    }
  }

  private initKeyboardListeners(): void {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Prevent default scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'KeyA':
        case 'ArrowLeft':
          this.trigger('LEFT');
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.trigger('RIGHT');
          break;
        case 'KeyW':
        case 'ArrowUp':
        case 'Space':
          this.trigger('JUMP');
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.trigger('SLIDE');
          break;
      }
    });
  }

  private initTouchListeners(): void {
    window.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) > this.minSwipeDistance) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.trigger('RIGHT');
          } else {
            this.trigger('LEFT');
          }
        } else {
          // Vertical swipe
          if (deltaY < 0) {
            this.trigger('JUMP');
          } else {
            this.trigger('SLIDE');
          }
        }
      }
    }, { passive: true });
  }

  public dispose(): void {
    this.listeners.clear();
  }
}

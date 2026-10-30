export interface LoaderOptions {
  /** Fade duration in milliseconds. */
  overlayFadeDuration?: number;
  /** Progress bar height in pixels; 0 hides the bar. */
  progressBarHeight?: number;
  /** Overlay background, usually the current mode background. */
  backgroundColor?: string | number;
}

const BLOCK_CLASS = 'cf-chessfield-loading';
const FADING_CLASS = 'cf-chessfield-loading--fading';

/**
 * DOM overlay shown while the library loads its assets and composes the scene.
 * It lives outside the 3D scene so it can cover the container before rendering starts.
 */
export class LoaderComponent {
  private readonly element: HTMLDivElement;
  private readonly bar: HTMLDivElement | null;
  private readonly fill: HTMLDivElement | null;
  private readonly fadeDuration: number;
  private completed = false;

  constructor(container: HTMLElement, options: LoaderOptions = {}) {
    this.fadeDuration = Math.max(0, options.overlayFadeDuration ?? 500);

    this.element = document.createElement('div');
    this.element.className = BLOCK_CLASS;
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-busy', 'true');
    this.element.setAttribute('aria-label', 'Loading chessboard');

    if (options.backgroundColor !== undefined) {
      this.element.style.backgroundColor =
        typeof options.backgroundColor === 'number'
          ? `#${options.backgroundColor.toString(16).padStart(6, '0')}`
          : options.backgroundColor;
    }

    const height = Math.max(0, options.progressBarHeight ?? 4);

    if (height > 0) {
      this.bar = document.createElement('div');
      this.bar.className = `${BLOCK_CLASS}__bar`;
      this.bar.setAttribute('role', 'progressbar');
      this.bar.setAttribute('aria-valuemin', '0');
      this.bar.setAttribute('aria-valuemax', '100');
      this.bar.setAttribute('aria-valuenow', '0');
      this.bar.style.height = `${height}px`;

      this.fill = document.createElement('div');
      this.fill.className = `${BLOCK_CLASS}__fill`;
      this.bar.appendChild(this.fill);
      this.element.appendChild(this.bar);
    } else {
      this.bar = null;
      this.fill = null;
    }

    container.appendChild(this.element);
  }

  setProgress(value: number): void {
    if (!this.bar || !this.fill) {
      return;
    }

    const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
    this.fill.style.width = `${percent}%`;
    this.bar.setAttribute('aria-valuenow', `${percent}`);
  }

  /** Fade the overlay out, then remove it from the DOM. */
  complete(): Promise<void> {
    if (this.completed) {
      return Promise.resolve();
    }

    this.completed = true;
    this.element.setAttribute('aria-busy', 'false');

    const duration = this.prefersReducedMotion() ? 0 : this.fadeDuration;

    if (duration <= 0) {
      this.remove();
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      let settled = false;

      const finish = (): void => {
        if (settled) {
          return;
        }

        settled = true;
        this.element.removeEventListener('transitionend', onEnd);
        clearTimeout(timer);
        this.remove();
        resolve();
      };

      const onEnd = (event: TransitionEvent): void => {
        if (event.target === this.element && event.propertyName === 'opacity') {
          finish();
        }
      };

      // Transition events are not guaranteed (hidden tab, reduced motion): keep a fallback.
      const timer = setTimeout(finish, duration + 50);
      this.element.addEventListener('transitionend', onEnd);
      this.element.style.transitionDuration = `${duration}ms`;
      this.element.classList.add(FADING_CLASS);
    });
  }

  private remove(): void {
    this.element.remove();
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
}

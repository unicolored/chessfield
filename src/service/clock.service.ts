import type * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import { type Store } from '../provider/store.ts';
import type { TimeLeft } from '../resource/chessfield.types.ts';

import { type TextConfig, type TextService } from './text/text.service.ts';

const WHITE_ID = 'cf-clock-white';
const BLACK_ID = 'cf-clock-black';

const DEFAULT_FONT_SIZE = cm(0.4);
// Clock digits must read from across the board, unlike the player-name labels.
const CLOCK_FONT_SCALE = 1.5;

const DEFAULT_TEXT_CONFIG: TextConfig = {
  fontSize: DEFAULT_FONT_SIZE,
  fontFamily: 'system-ui, sans-serif',
  fontWeight: '400',
  color: '#ffffff',
};

// The clocks sit at the two ends of the left-edge turn switch: White's left, Black's right.
const WHITE_POSITION = new THREE.Vector3(cm(-4.5), cm(0.5), cm(4.5));
const BLACK_POSITION = new THREE.Vector3(cm(-4.5), cm(0.5), cm(-4.5));

const TERMINAL_STATUSES = new Set(['mate', 'draw', 'resign', 'timeout']);

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Format whole seconds as m:ss, or h:mm:ss above one hour. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`;
  }

  return `${minutes}:${pad(remainingSeconds)}`;
}

function toSeconds(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

/**
 * Displays the remaining time for both players on their side of the board.
 * The countdown is visual only: only the side to move loses time, and reaching
 * zero never calls setState. The consumer remains responsible for flag fall.
 */
export class ClockService {
  private timeLeft: TimeLeft | null = null;
  private turn: cg.Color = 'white';
  private anchorAt: number | null = null;
  private displayed = { white: '', black: '' };

  private textService: TextService | null = null;
  private textGroup: THREE.Group | null = null;
  private textConfig: TextConfig = DEFAULT_TEXT_CONFIG;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly store: Store,
    private readonly now: () => number = () => performance.now(),
  ) {
    this.turn = store.getTurnColor();
  }

  hasTimeLeft(): boolean {
    return this.timeLeft !== null;
  }

  /**
   * Register the label target and style. Called after player names are (re)built.
   * Labels are created lazily so a snapshot can arrive before or after the scene exists.
   */
  async mount(textService: TextService, textConfig: TextConfig, textGroup: THREE.Group): Promise<void> {
    this.textService = textService;
    this.textConfig = textConfig;
    this.textGroup = textGroup;

    await this.enqueue();
  }

  /** Store a new authoritative snapshot and re-anchor both clocks. */
  setTimeLeft(timeLeft: TimeLeft): void {
    this.timeLeft = {
      white: toSeconds(timeLeft.white),
      black: toSeconds(timeLeft.black),
    };

    this.turn = this.store.getTurnColor();
    this.anchorAt = this.now();
    void this.enqueue();
  }

  /**
   * Follow the side to move. The elapsed time belongs to the side that was moving, so it is
   * committed before the new side starts counting.
   */
  setTurn(turn: cg.Color): void {
    if (this.turn === turn) {
      return;
    }

    const now = this.now();

    if (this.timeLeft && this.anchorAt !== null) {
      this.timeLeft = this.remainingAt(now);
      this.anchorAt = now;
    }

    this.turn = turn;
    void this.enqueue(now);
  }

  /** Advance the visual countdown. Called from the animation loop, not a timer. */
  tick(now: number = this.now()): void {
    if (!this.timeLeft || this.anchorAt === null) {
      return;
    }

    if (this.isGameOver()) {
      this.freeze(now);
      return;
    }

    const remaining = this.remainingAt(now);
    const labels = this.format(remaining);
    const changed = labels.white !== this.displayed.white || labels.black !== this.displayed.black;

    if (changed) {
      void this.enqueue(now);
    }

    // The flag fell: stop the visual countdown and leave game over to the consumer.
    if (remaining[this.turn] <= 0) {
      this.timeLeft = remaining;
      this.anchorAt = null;
    }
  }

  private isGameOver(): boolean {
    const state = this.store.gameState;
    if (!state) {
      return false;
    }

    if (state.status !== undefined && TERMINAL_STATUSES.has(state.status)) {
      return true;
    }

    // Consumers may describe the outcome without a status; these fields are terminal by definition.
    return state.winner !== undefined || state.mate !== undefined || state.draw !== undefined;
  }

  private isTimeout(): boolean {
    const state = this.store.gameState;

    return state?.status === 'timeout' || state?.gameoverReason === 'timeout';
  }

  private remainingAt(now: number, turn: cg.Color = this.turn): TimeLeft {
    const timeLeft = this.timeLeft ?? { white: 0, black: 0 };
    const elapsed = this.anchorAt === null ? 0 : Math.max(0, now - this.anchorAt) / 1000;

    return {
      white: Math.max(0, timeLeft.white - (turn === 'white' ? elapsed : 0)),
      black: Math.max(0, timeLeft.black - (turn === 'black' ? elapsed : 0)),
    };
  }

  private format(timeLeft: TimeLeft): { white: string; black: string } {
    return {
      white: formatClock(Math.ceil(timeLeft.white)),
      black: formatClock(Math.ceil(timeLeft.black)),
    };
  }

  /** Commit the current values so the labels stop moving once the game is over. */
  private freeze(now: number): void {
    const remaining = this.remainingAt(now);

    // On a flag fall the consumer reports timeout at the real zero; the local snapshot may
    // still be a fraction of a second above it, which would otherwise display 0:01.
    if (this.isTimeout()) {
      remaining[this.turn] = 0;
    }

    this.timeLeft = remaining;
    this.anchorAt = null;
    void this.enqueue(now);
  }

  private enqueue(now: number = this.now()): Promise<void> {
    this.queue = this.queue
      .then(() => this.render(now))
      .catch(error => console.error('Clock labels failed to render', error));

    return this.queue;
  }

  private async render(now: number): Promise<void> {
    if (!this.timeLeft || !this.textService || !this.textGroup) {
      return;
    }

    const labels = this.format(this.remainingAt(now));

    await this.renderLabel(WHITE_ID, labels.white, WHITE_POSITION, 0);
    await this.renderLabel(BLACK_ID, labels.black, BLACK_POSITION, Math.PI);

    this.displayed = labels;
  }

  private async renderLabel(
    id: string,
    text: string,
    position: THREE.Vector3,
    rotationY: number,
  ): Promise<void> {
    const textService = this.textService as TextService;
    const existing = textService.get(id);

    if (existing) {
      if (existing.options.text !== text) {
        textService.update(id, { text });
      }
      return;
    }

    const instance = await textService.add(
      {
        text,
        position: position.clone(),
        rotation: new THREE.Euler(0, rotationY, 0),
        fontSize: (this.textConfig.fontSize ?? DEFAULT_FONT_SIZE) * CLOCK_FONT_SCALE,
        color: this.textConfig.color ?? DEFAULT_TEXT_CONFIG.color,
        fontFamily: this.textConfig.fontFamily ?? DEFAULT_TEXT_CONFIG.fontFamily,
        fontWeight: this.textConfig.fontWeight ?? DEFAULT_TEXT_CONFIG.fontWeight,
        anchorX: 'center',
        anchorY: 'center',
        cache: false,
      },
      id,
    );

    this.textGroup?.add(instance.object);
  }
}

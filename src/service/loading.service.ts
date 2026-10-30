import { SimpleSubject } from '../provider/observable.ts';
import type { LoadingProgress } from '../resource/chessfield.types.ts';

export class LoadingService {
  private readonly subject = new SimpleSubject<LoadingProgress>({
    loaded: 0,
    total: 0,
    progress: 0,
    ready: false,
  });

  private readonly readyPromise: Promise<void>;
  private resolveReady!: () => void;

  constructor() {
    this.readyPromise = new Promise<void>(resolve => {
      this.resolveReady = resolve;
    });
  }

  get value(): LoadingProgress {
    return this.subject.value;
  }

  /** Record settled asset loads. Progress stays monotonic when the total grows. */
  setAssets(loaded: number, total: number): void {
    const current = this.subject.value;
    if (current.ready) {
      return;
    }

    const ratio = total > 0 ? Math.min(1, Math.max(0, loaded / total)) : 0;

    this.subject.next({
      loaded,
      total,
      progress: Math.max(current.progress, ratio),
      ready: false,
    });
  }

  /** Mark the board ready and resolve the promises returned by whenReady(). */
  markReady(): void {
    const current = this.subject.value;
    if (current.ready) {
      return;
    }

    this.subject.next({
      loaded: current.total,
      total: current.total,
      progress: 1,
      ready: true,
    });
    this.resolveReady();
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  subscribe(listener: (progress: LoadingProgress) => void): () => void {
    return this.subject.subscribe(progress => {
      try {
        listener(progress);
      } catch (error) {
        // A consumer listener must not be able to break the loading pipeline.
        console.error('Loading progress listener failed', error);
      }
    });
  }
}

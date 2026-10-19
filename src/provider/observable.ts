export type Listener<T> = (value: T) => void;

export class SimpleSubject<T> {
  private listeners: Listener<T>[] = [];
  private currentValue: T;

  constructor(initial: T) {
    this.currentValue = initial;
  }

  get value(): T {
    return this.currentValue;
  }

  next(value: T): void {
    this.currentValue = value;
    this.listeners.forEach(fn => fn(value));
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.push(fn);
    fn(this.currentValue);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
}

export class SimpleObservable<T> {
  constructor(private subject: SimpleSubject<T>) {}

  subscribe(fn: Listener<T>): () => void {
    return this.subject.subscribe(fn);
  }
}

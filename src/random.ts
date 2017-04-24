
export function within(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

export function pick<T>(a: Array<T>): T {
  return a[within(0, a.length)];
}

export class NumberRange {
  readonly start: number;
  readonly end: number;

  constructor(start: number, end: number) {
    this.start = Math.min(start, end);
    this.end = Math.max(start, end);
  }

  contains(
    value: number,
    mode:
      | "inclusive"
      | "exclusive"
      | "start-inclusive-end-exclusive"
      | "start-exclusive-end-inclusive"
  ) {
    switch (mode) {
      case "inclusive":
        return value >= this.start && value <= this.end;
      case "exclusive":
        return value > this.start && value < this.end;
      case "start-inclusive-end-exclusive":
        return value >= this.start && value < this.end;
      case "start-exclusive-end-inclusive":
        return value > this.start && value <= this.end;
    }
  }
}

/** Represents a 2D vector or point. */
export class Vector {
  constructor(readonly x: number, readonly y: number) {}

  plus(other: Vector) {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  minus(other: Vector) {
    return this.plus(other.negate());
  }

  negate() {
    return new Vector(-this.x, -this.y);
  }
}

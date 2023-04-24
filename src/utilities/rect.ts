import {Vector} from "./vector";

/**
 * Makes `DOMRect` easier to work with.
 */
export class Rect implements DOMRect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;

  constructor({
    x,
    y,
    height,
    width,
  }: Pick<DOMRect, "x" | "y" | "height" | "width">) {
    this.x = x;
    this.y = y;
    this.height = height;
    this.width = width;
  }

  toJSON() {
    JSON.stringify({
      top: this.top,
      bottom: this.bottom,
      left: this.left,
      right: this.right,
      x: this.x,
      y: this.y,
      height: this.height,
      width: this.width,
    });
  }

  /**
   * Return `true` if `rect` is entirely contained by `otherRect`.
   */
  isContainedBy(other: Rect) {
    return (
      this.top > other.top &&
      this.bottom < other.bottom &&
      this.left > other.left &&
      this.right < other.right
    );
  }

  contains(point: Vector) {
    return (
      point.x >= this.left &&
      point.x <= this.right &&
      point.y >= this.top &&
      point.y <= this.bottom
    );
  }

  get left() {
    return this.x;
  }

  get right() {
    return this.left + this.width;
  }

  get top() {
    return this.y;
  }

  get bottom() {
    return this.top + this.height;
  }

  asVector() {
    return new Vector(this.x, this.y);
  }

  replaceVector(newVector: Vector) {
    return new Rect({
      width: this.width,
      height: this.height,
      x: newVector.x,
      y: newVector.y,
    });
  }

  translate(vector: Vector) {
    return this.replaceVector(this.asVector().plus(vector));
  }
}

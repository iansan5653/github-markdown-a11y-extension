import {NumberRange} from "./number-range";
import {Vector} from "./vector";

type RectParams = Pick<DOMRect, "x" | "y" | "height" | "width">;

/**
 * Makes `DOMRect` easier to work with.
 */
export class Rect implements DOMRect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;

  constructor({x, y, height, width}: RectParams) {
    this.x = x;
    this.y = y;
    this.height = height;
    this.width = width;
  }

  copy({
    x = this.x,
    y = this.y,
    height = this.height,
    width = this.width,
  }: Partial<RectParams>) {
    return new Rect({x, y, height, width});
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
      other.contains(this.asVector("top-left")) &&
      other.contains(this.asVector("bottom-right"))
    );
  }

  contains(point: Vector) {
    return (
      this.xRange.contains(point.x, "inclusive") &&
      this.yRange.contains(point.y, "inclusive")
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

  get xRange() {
    return new NumberRange(this.left, this.right);
  }

  get yRange() {
    return new NumberRange(this.top, this.bottom);
  }

  asVector(
    corner:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right" = "top-left"
  ) {
    switch (corner) {
      case "top-left":
        return new Vector(this.left, this.top);
      case "top-right":
        return new Vector(this.right, this.top);
      case "bottom-left":
        return new Vector(this.left, this.bottom);
      case "bottom-right":
        return new Vector(this.right, this.bottom);
    }
  }

  translate(vector: Vector) {
    return this.copy(this.asVector().plus(vector));
  }

  scaleY(factor: number) {
    const scaledHeight = this.height * factor;
    const deltaY = (this.height - scaledHeight) / 2;
    return this.translate(new Vector(0, deltaY)).copy({height: scaledHeight});
  }
}

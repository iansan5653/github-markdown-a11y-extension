import {InputRange} from "textarea-range";
import {NumberRange} from "../geometry/number-range";
import {Rect} from "../geometry/rect";

export interface RangeRectCalculator {
  /**
   * Return the viewport-relative client rects of the range of characters. If the range
   * has any line breaks, this will return multiple rects. Will include the start char and
   * exclude the end char.
   */
  getClientRects({start, end}: NumberRange): Rect[];
  disconnect(): void;
}

/**
 * The `Range` API doesn't work well with `textarea` elements, so this creates a duplicate
 * element and uses that instead. Provides a limited API wrapping around adjusted `Range`
 * APIs.
 */
export class TextareaRangeRectCalculator implements RangeRectCalculator {
  readonly #range: InputRange;

  constructor(target: HTMLTextAreaElement) {
    this.#range = new InputRange(target, 0);
  }

  /**
   * Return the viewport-relative client rects of the range. If the range has any line
   * breaks, this will return multiple rects. Will include the start char and exclude the
   * end char.
   */
  getClientRects({start, end}: NumberRange) {
    this.#range.startOffset = start;
    this.#range.endOffset = end;
    return this.#range.getClientRects().map((domRect) => new Rect(domRect));
  }

  disconnect() {}
}

export class CodeMirrorRangeRectCalculator implements RangeRectCalculator {
  readonly #element: HTMLElement;
  readonly #range: Range;

  constructor(target: HTMLElement) {
    if (!target.classList.contains("CodeMirror-code"))
      throw new Error(
        "CodeMirrorRangeRectCalculator only works with CodeMirror code editors."
      );

    this.#element = target;
    this.#range = document.createRange();
  }

  getClientRects(range: NumberRange): Rect[] {
    const lineNodes = Array.from(
      this.#element.querySelectorAll(".CodeMirror-line")
    );
    const lines = lineNodes.map((line) =>
      CodeMirrorRangeRectCalculator.#getAllTextNodes(line)
    );

    const start = CodeMirrorRangeRectCalculator.#getNodeAtOffset(
      lines,
      range.start
    );
    const end = CodeMirrorRangeRectCalculator.#getNodeAtOffset(
      lines,
      range.end
    );

    if (!start || !end) return [];

    this.#range.setStart(...start);
    this.#range.setEnd(...end);

    return Array.from(this.#range.getClientRects()).map(
      (domRect) => new Rect(domRect)
    );
  }

  disconnect(): void {}

  static #getAllTextNodes(node: Node): Node[] {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  /**
   * Get the text node containing the offset, and the relative offset into that node.
   * @param lines Array of nodes for each line
   * @param offset Offset into the entire text
   */
  static #getNodeAtOffset(
    lines: Node[][],
    offset: number
  ): [node: Node, offsetIntoNode: number] | undefined {
    let prevChars = 0;
    for (const line of lines) {
      for (const node of line) {
        const length = node.textContent?.length ?? 0;
        if (offset <= prevChars + length) return [node, offset - prevChars];
        prevChars += length;
      }
      prevChars++; // For the newline
    }
  }
}

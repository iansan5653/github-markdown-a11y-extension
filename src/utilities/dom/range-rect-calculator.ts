import {NumberRange} from "../geometry/number-range";
import {Rect} from "../geometry/rect";
import {Vector} from "../geometry/vector";

// Note that some browsers, such as Firefox, do not concatenate properties
// into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
// so we have to list every single property explicitly.
const propertiesToCopy = [
  "direction", // RTL support
  "boxSizing",
  "width", // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  "height",
  "overflowX",
  "overflowY", // copy the scrollbar for IE

  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",

  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",

  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration", // might not make a difference, but better be safe

  "letterSpacing",
  "wordSpacing",

  "tabSize",
  "MozTabSize" as "tabSize", // prefixed version for Firefox <= 52
] as const satisfies ReadonlyArray<keyof CSSStyleDeclaration>;

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
  readonly #element: HTMLTextAreaElement;
  readonly #div: HTMLDivElement;
  readonly #mutationObserver: MutationObserver;
  readonly #resizeObserver: ResizeObserver;
  readonly #range: Range;

  constructor(target: HTMLTextAreaElement) {
    this.#element = target;

    // The mirror div will replicate the textarea's style
    const div = document.createElement("div");
    this.#div = div;
    document.body.appendChild(div);

    this.#refreshStyles();

    this.#mutationObserver = new MutationObserver(() => this.#refreshStyles());
    this.#mutationObserver.observe(this.#element, {
      attributeFilter: ["style"],
    });

    this.#resizeObserver = new ResizeObserver(() => this.#refreshStyles());
    this.#resizeObserver.observe(this.#element);

    this.#range = document.createRange();
  }

  /**
   * Return the viewport-relative client rects of the range. If the range has any line
   * breaks, this will return multiple rects. Will include the start char and exclude the
   * end char.
   */
  getClientRects({start, end}: NumberRange) {
    this.#refreshText();

    const textNode = this.#div.childNodes[0];
    if (!textNode) return [];

    this.#range.setStart(textNode, start);
    this.#range.setEnd(textNode, end);

    // The div is not in the same place as the textarea so we need to subtract the div
    // position and add the textarea position
    const divPosition = new Rect(this.#div.getBoundingClientRect()).asVector();
    const textareaPosition = new Rect(
      this.#element.getBoundingClientRect()
    ).asVector();

    // The div is not scrollable so it does not have scroll adjustment built in
    const scrollOffset = new Vector(
      this.#element.scrollLeft,
      this.#element.scrollTop
    );

    const netTranslate = divPosition
      .negate()
      .plus(textareaPosition)
      .minus(scrollOffset);

    return Array.from(this.#range.getClientRects()).map((domRect) =>
      new Rect(domRect).translate(netTranslate)
    );
  }

  disconnect() {
    this.#div.remove();
  }

  #refreshStyles() {
    const style = this.#div.style;
    const textareaStyle = window.getComputedStyle(this.#element);

    // Default wrapping styles
    style.whiteSpace = "pre-wrap";
    style.wordWrap = "break-word";

    // Position off-screen
    style.position = "fixed";
    style.top = "0";
    style.transform = "translateY(-100%)";

    const isFirefox = "mozInnerScreenX" in window;

    // Transfer the element's properties to the div
    for (const prop of propertiesToCopy)
      if (prop === "width" && textareaStyle.boxSizing === "border-box") {
        // With box-sizing: border-box we need to offset the size slightly inwards.  This small difference can compound
        // greatly in long textareas with lots of wrapping, leading to very innacurate results if not accounted for.
        // Firefox will return computed styles in floats, like `0.9px`, while chromium might return `1px` for the same element.
        // Either way we use `parseFloat` to turn `0.9px` into `0.9` and `1px` into `1`
        const totalBorderWidth =
          parseFloat(textareaStyle.borderLeftWidth) +
          parseFloat(textareaStyle.borderRightWidth);
        // When a vertical scrollbar is present it shrinks the content. We need to account for this by using clientWidth
        // instead of width in everything but Firefox. When we do that we also have to account for the border width.
        const width = isFirefox
          ? parseFloat(textareaStyle.width) - totalBorderWidth
          : this.#element.clientWidth + totalBorderWidth;
        style.width = `${width}px`;
      } else {
        style[prop] = textareaStyle[prop];
      }

    if (isFirefox) {
      // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
      if (this.#element.scrollHeight > parseInt(textareaStyle.height))
        style.overflowY = "scroll";
    } else {
      style.overflow = "hidden"; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
    }
  }

  #refreshText() {
    this.#div.textContent =
      this.#element instanceof HTMLInputElement
        ? this.#element.value.replace(/\s/g, "\u00a0")
        : this.#element.value;
  }
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
    console.log(range);
    const lineNodes = Array.from(
      this.#element.querySelectorAll(".CodeMirror-line")
    );
    const lines = lineNodes.map((line) =>
      CodeMirrorRangeRectCalculator.#getAllTextNodes(line)
    );

    const start = this.#getNodeAtOffset(lines, range.start);
    const end = this.#getNodeAtOffset(lines, range.end);

    if (!start || !end) return [];

    console.log(lines);
    console.log([start[0].textContent, start[1]]);
    console.log([end[0].textContent, end[1]]);
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
  #getNodeAtOffset(
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

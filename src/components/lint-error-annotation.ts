import {LintError} from "markdownlint";
import {LintedMarkdownEditor} from "./linted-markdown-editor";
import {Rect} from "../utilities/rect";
import {Vector} from "../utilities/vector";
import {getWindowScrollVector} from "../utilities/dom";
import {NumberRange} from "../utilities/number-range";

export class LintErrorAnnotation {
  readonly name: string;
  readonly description: string;
  readonly details: string;
  readonly lineNumber: number;

  readonly #portal: HTMLElement;
  readonly #elements: readonly HTMLElement[] = [];

  readonly #indexRange: NumberRange;

  constructor(
    error: LintError,
    editor: LintedMarkdownEditor,
    portal: HTMLElement
  ) {
    this.name = error.ruleNames?.slice(0, 2).join(": ") ?? "";
    this.description = error.ruleDescription ?? "";
    this.details = error.errorDetail ?? "";
    this.lineNumber = error.lineNumber;

    this.#portal = document.createElement("div");
    portal.appendChild(this.#portal);

    const markdown = editor.value;
    const [line = "", ...prevLines] = markdown
      .split("\n")
      .slice(0, this.lineNumber)
      .reverse();

    const startCol = (error.errorRange?.[0] ?? 1) - 1;
    const length = error.errorRange?.[1] ?? line.length - startCol;

    const startIndex = prevLines.reduce(
      (t, l) => t + l.length + 1 /* +1 for newline char */,
      startCol
    );
    const endIndex = startIndex + length;
    this.#indexRange = new NumberRange(startIndex, endIndex);

    const editorRect = new Rect(editor.getBoundingClientRect());
    const scrollVector = getWindowScrollVector();

    // The range rectangles are tight around the characters; we'd rather fill the line height if possible
    const cssLineHeight = editor.getLineHeight();

    const elements: HTMLElement[] = [];
    // render an annotation element for each line separately
    for (const rect of editor.getRangeRects(this.#indexRange)) {
      // suppress when out of bounds
      if (!rect.isContainedBy(editorRect)) continue;

      // The rects are viewport-relative, but the annotations are absolute positioned
      // (document-relative) so we have to add the window scroll position
      const absoluteRect = rect.translate(scrollVector);

      // We want ranges spanning multiple lines to look like one annotation, so we need to
      // expand them to fill the gap around the lines
      const lineHeight = cssLineHeight ?? rect.height * 1.2;
      const scaledRect = absoluteRect.scaleY(lineHeight / absoluteRect.height);

      const annotation = document.createElement("span");
      annotation.style.position = "absolute";
      annotation.style.top = `${scaledRect.top}px`;
      annotation.style.left = `${scaledRect.left}px`;
      annotation.style.width = `${scaledRect.width}px`;
      annotation.style.backgroundColor = "var(--color-danger-emphasis)";
      annotation.style.opacity = "0.2";
      // 1.2 seems to be typical default line height
      annotation.style.height = `${scaledRect.height}px`;
      annotation.style.pointerEvents = "none";
      elements.push(annotation);
    }
    this.#portal.replaceChildren(...elements);
    this.#elements = elements;
  }

  disconnect() {
    this.#portal.parentElement?.removeChild(this.#portal);
  }

  getTooltipPosition() {
    const domRect = this.#elements.at(-1)?.getBoundingClientRect();
    if (domRect)
      return new Rect(domRect)
        .asVector("bottom-left")
        .plus(getWindowScrollVector());
  }

  containsPoint(point: Vector) {
    return this.#elements.some((el) =>
      new Rect(el.getBoundingClientRect()).contains(point)
    );
  }

  containsIndex(index: number) {
    return this.#indexRange.contains(index, "start-inclusive-end-exclusive");
  }
}

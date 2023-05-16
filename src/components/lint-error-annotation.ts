import {LintedMarkdownEditor} from "./linted-markdown-editor";
import {Rect} from "../utilities/geometry/rect";
import {Vector} from "../utilities/geometry/vector";
import {getWindowScrollVector, isHighContrastMode} from "../utilities/dom";
import {NumberRange} from "../utilities/geometry/number-range";
import {Component} from "./component";
import {LintError} from "../utilities/lint-markdown";

export class LintErrorAnnotation extends Component {
  readonly lineNumber: number;

  readonly #container: HTMLElement = document.createElement("div");

  readonly #editor: LintedMarkdownEditor;
  #elements: readonly HTMLElement[] = [];

  readonly #indexRange: NumberRange;

  constructor(
    readonly error: LintError,
    editor: LintedMarkdownEditor,
    portal: HTMLElement
  ) {
    super();

    this.#editor = editor;

    this.lineNumber = error.lineNumber;

    portal.appendChild(this.#container);

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

    this.recalculatePosition();
  }

  disconnect() {
    super.disconnect();
    this.#container.remove();
  }

  getTooltipPosition() {
    const domRect = this.#elements.at(-1)?.getBoundingClientRect();
    if (domRect)
      return new Rect(domRect)
        .asVector("bottom-left")
        .plus(new Vector(0, 2)) // add some breathing room
        .plus(getWindowScrollVector());
  }

  containsPoint(point: Vector) {
    return this.#elements.some((el) =>
      // scale slightly so we don't show two tooltips at touching horizontal edges
      new Rect(el.getBoundingClientRect()).scaleY(0.99).contains(point)
    );
  }

  containsIndex(index: number) {
    return this.#indexRange.contains(index, "inclusive");
  }

  recalculatePosition() {
    const editorRect = new Rect(this.#editor.getBoundingClientRect());
    const scrollVector = getWindowScrollVector();

    // The range rectangles are tight around the characters; we'd rather fill the line height if possible
    const cssLineHeight = this.#editor.getLineHeight();

    const elements: HTMLElement[] = [];
    // render an annotation element for each line separately
    for (const rect of this.#editor.getRangeRects(this.#indexRange)) {
      // suppress when out of bounds
      if (!rect.isContainedBy(editorRect)) continue;

      // The rects are viewport-relative, but the annotations are absolute positioned
      // (document-relative) so we have to add the window scroll position
      const absoluteRect = rect.translate(scrollVector);

      // We want ranges spanning multiple lines to look like one annotation, so we need to
      // expand them to fill the gap around the lines
      const lineHeight = cssLineHeight ?? rect.height * 1.2;
      const scaledRect = absoluteRect.scaleY(lineHeight / absoluteRect.height);

      elements.push(LintErrorAnnotation.#createAnnotationElement(scaledRect));
    }
    this.#container.replaceChildren(...elements);
    this.#elements = elements;
  }

  static #createAnnotationElement(rect: Rect) {
    const annotation = document.createElement("span");
    annotation.style.position = "absolute";
    annotation.style.boxSizing = "border-box";
    // use underline instead of highlight for high contrast
    if (isHighContrastMode()) {
      annotation.style.borderBottom = "3px dashed var(--color-danger-fg)";
    } else {
      annotation.style.backgroundColor = "var(--color-danger-emphasis)";
      annotation.style.opacity = "0.2";
    }
    annotation.style.pointerEvents = "none";
    annotation.style.top = `${rect.top}px`;
    annotation.style.left = `${rect.left}px`;
    annotation.style.width = `${rect.width}px`;
    annotation.style.height = `${rect.height}px`;
    return annotation;
  }
}

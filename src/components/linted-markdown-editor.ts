import {
  CodeMirrorRangeRectCalculator,
  RangeRectCalculator,
  TextareaRangeRectCalculator,
} from "../utilities/dom/range-rect-calculator";
import {formatList} from "../utilities/format";
import {MarkdownRenderTarget, lintMarkdown} from "../utilities/lint-markdown";
import {LintErrorTooltip} from "./lint-error-tooltip";
import {LintErrorAnnotation} from "./lint-error-annotation";
import {Vector} from "../utilities/geometry/vector";
import {NumberRange} from "../utilities/geometry/number-range";
import {Component} from "./component";

export abstract class LintedMarkdownEditor extends Component {
  #editor: HTMLElement;
  #tooltip: LintErrorTooltip;
  #resizeObserver: ResizeObserver;
  #rangeRectCalculator: RangeRectCalculator;
  #isTyping = false;

  #annotationsPortal = document.createElement("div");
  #statusContainer = LintedMarkdownEditor.#createStatusContainerElement();

  constructor(
    element: HTMLElement,
    portal: HTMLElement,
    rangeRectCalculator: RangeRectCalculator,
    readonly markdownRenderTarget: MarkdownRenderTarget
  ) {
    super();

    this.#editor = element;
    this.#rangeRectCalculator = rangeRectCalculator;

    portal.append(this.#annotationsPortal, this.#statusContainer);

    this.addEventListener(element, "focus", this.onUpdate);
    this.addEventListener(element, "blur", this.#onBlur);
    this.addEventListener(element, "mousemove", this.#onMouseMove);
    this.addEventListener(element, "mouseleave", this.#onMouseLeave);

    // capture ancestor scroll events for nested scroll containers
    this.addEventListener(document, "scroll", this.#onReposition, true);

    // selectionchange can't be bound to the textarea so we have to use the document
    this.addEventListener(document, "selectionchange", this.#onSelectionChange);

    // annotations are document-relative so we need to observe document resize as well
    this.addEventListener(window, "resize", this.#onReposition);

    // this does mean it will run twice when the resize causes a resize of the textarea,
    // but we also need the resize observer for the textarea because it's user resizable
    this.#resizeObserver = new ResizeObserver(this.#onReposition);
    this.#resizeObserver.observe(element);

    this.#tooltip = new LintErrorTooltip(portal);
  }

  disconnect() {
    super.disconnect();

    this.#resizeObserver.disconnect();
    this.#tooltip.disconnect();

    this.#annotationsPortal.remove();
    this.#statusContainer.remove();
  }

  /**
   * Return a list of rects for the given range. If the range extends over multiple lines,
   * multiple rects will be returned.
   */
  getRangeRects(characterIndexes: NumberRange) {
    return this.#rangeRectCalculator.getClientRects(characterIndexes);
  }

  getBoundingClientRect() {
    return this.#editor.getBoundingClientRect();
  }

  getLineHeight() {
    const parsed = parseInt(getComputedStyle(this.#editor).lineHeight, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  abstract get value(): string;

  abstract get caretPosition(): number;

  #_annotations: readonly LintErrorAnnotation[] = [];

  set #annotations(annotations: ReadonlyArray<LintErrorAnnotation>) {
    if (annotations === this.#_annotations) return;

    this.#_annotations = annotations;

    this.#statusContainer.textContent =
      annotations.length > 0
        ? `${annotations.length} Markdown problem${
            annotations.length > 1 ? "s" : ""
          } identified: see line${
            annotations.length > 1 ? "s" : ""
          } ${formatList(
            annotations.map((a) => a.lineNumber.toString()),
            "and"
          )}`
        : "";
  }

  get #annotations() {
    return this.#_annotations;
  }

  #_tooltipAnnotations: readonly LintErrorAnnotation[] = [];

  set #tooltipAnnotations(annotations: LintErrorAnnotation[]) {
    if (annotations === this.#_tooltipAnnotations) return;

    this.#_tooltipAnnotations = annotations;

    const position = annotations[0]?.getTooltipPosition();
    const errors = annotations.map(({error}) => error);

    if (position) this.#tooltip.show(errors, position);
    else this.#tooltip.hide();
  }

  protected onUpdate = () => {
    this.#isTyping = true;
    setTimeout(() => (this.#isTyping = false), 10);
    this.#lint();
  };

  #isOnRepositionTick = false;
  #onReposition = () => {
    if (this.#isOnRepositionTick) return;
    this.#isOnRepositionTick = true;

    requestAnimationFrame(() => {
      this.#recalculateAnnotationPositions();
      this.#isOnRepositionTick = false;
    });
  };

  #onBlur = () => this.#clear();

  #onMouseMove = (event: MouseEvent) =>
    this.#updatePointerTooltip(new Vector(event.clientX, event.clientY));

  #onMouseLeave = () => (this.#tooltipAnnotations = []);

  #onSelectionChange = () => {
    // this event only works when applied to the document but we can filter it by detecting focus
    if (!this.#isTyping && document.activeElement === this.#editor)
      this.#updateCaretTooltip();
  };

  #clear() {
    // the annotations will clean themselves up too but this is slightly faster
    this.#annotationsPortal.replaceChildren();

    for (const annotation of this.#annotations) annotation.disconnect();

    this.#annotations = [];
    this.#tooltipAnnotations = [];
  }

  #lint() {
    this.#clear();

    // clear() will not hide the tooltip if the mouse is over it, but if the user is typing then they are not trying to copy content
    this.#tooltip.hide(true);

    if (document.activeElement !== this.#editor) return;

    const errors = lintMarkdown(this.value, this.markdownRenderTarget);

    this.#annotations = errors.map(
      (error) => new LintErrorAnnotation(error, this, this.#annotationsPortal)
    );
  }

  #recalculateAnnotationPositions() {
    requestAnimationFrame(() => {
      for (const annotation of this.#annotations)
        annotation.recalculatePosition();
    });
  }

  #updatePointerTooltip(pointerLocation: Vector) {
    // can't use mouse events on annotations (the easy way) because they have pointer-events: none
    this.#tooltipAnnotations = this.#annotations.filter((a) =>
      a.containsPoint(pointerLocation)
    );
  }

  #updateCaretTooltip() {
    this.#tooltipAnnotations = this.#annotations.filter((a) =>
      a.containsIndex(this.caretPosition)
    );
  }

  static #createStatusContainerElement() {
    const container = document.createElement("p");
    container.setAttribute("aria-live", "polite");
    container.style.position = "absolute";
    container.style.clipPath = "circle(0)";
    return container;
  }
}

export class LintedMarkdownTextareaEditor extends LintedMarkdownEditor {
  readonly #textarea: HTMLTextAreaElement;

  constructor(textarea: HTMLTextAreaElement, portal: HTMLElement) {
    super(
      textarea,
      portal,
      new TextareaRangeRectCalculator(textarea),
      "github"
    );
    this.#textarea = textarea;
    this.addEventListener(textarea, "input", this.onUpdate);
  }

  get value() {
    return this.#textarea.value;
  }

  get caretPosition() {
    return this.#textarea.selectionEnd !== this.#textarea.selectionStart
      ? -1
      : this.#textarea.selectionStart;
  }
}

export class LintedMarkdownCodeMirrorEditor extends LintedMarkdownEditor {
  readonly #element: HTMLElement;
  readonly #mutationObserver: MutationObserver;

  constructor(element: HTMLElement, portal: HTMLElement) {
    super(
      element,
      portal,
      new CodeMirrorRangeRectCalculator(element),
      "document"
    );

    this.#element = element;

    this.#mutationObserver = new MutationObserver(this.onUpdate);
    this.#mutationObserver.observe(element, {
      childList: true,
      subtree: true,
    });
  }

  override disconnect(): void {
    super.disconnect();
    this.#mutationObserver.disconnect();
  }

  get value() {
    return Array.from(this.#element.querySelectorAll(".CodeMirror-line"))
      .map((line) => line.textContent)
      .join("\n");
  }

  get caretPosition() {
    const selection = document.getSelection();
    const range = selection?.getRangeAt(0);
    if (!range?.collapsed || selection?.rangeCount !== 1) return -1;

    const referenceRange = document.createRange();
    referenceRange.selectNodeContents(this.#element);
    referenceRange.setEnd(range.startContainer, range.startOffset);

    return referenceRange.toString().length;
  }
}

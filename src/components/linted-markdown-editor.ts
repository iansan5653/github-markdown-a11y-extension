// @ts-check

"use strict";

import { TextareaRange } from "../utilities/dom/textarea-range";
import { formatList } from "../utilities/format";
import { lintMarkdown } from "../utilities/lint-markdown";
import { LintErrorTooltip } from "./lint-error-tooltip";
import { LintErrorAnnotation } from "./lint-error-annotation";
import { Vector } from "../utilities/geometry/vector";
import { NumberRange } from "../utilities/geometry/number-range";
import { Component } from "./component";

export class LintedMarkdownEditor extends Component {
  #textarea: HTMLTextAreaElement;
  #tooltip: LintErrorTooltip = new LintErrorTooltip();
  #resizeObserver: ResizeObserver;
  #characterCoordinatesCalculator: TextareaRange;

  #annotationsPortal = document.createElement("div");
  #statusContainer = LintedMarkdownEditor.#createStatusContainerElement();

  constructor(textarea: HTMLTextAreaElement, portal: HTMLElement) {
    super();

    this.#textarea = textarea;

    portal.append(this.#annotationsPortal, this.#statusContainer);

    this.addEventListener(textarea, "input", this.#onUpdate);
    this.addEventListener(textarea, "focus", this.#onUpdate);
    this.addEventListener(textarea, "scroll", this.#onReposition);
    this.addEventListener(textarea, "blur", this.#onBlur);
    this.addEventListener(textarea, "mousemove", this.#onMouseMove);
    this.addEventListener(textarea, "mouseleave", this.#onMouseLeave);

    // selectionchange can't be bound to the textarea so we have to use the document
    this.addEventListener(document, "selectionchange", this.#onSelectionChange);

    // annotations are document-relative so we need to observe document resize as well
    this.addEventListener(window, "resize", this.#onReposition);

    // this does mean it will run twice when the resize causes a resize of the textarea,
    // but we also need the resize observer for the textarea because it's user resizable
    this.#resizeObserver = new ResizeObserver(this.#onReposition);
    this.#resizeObserver.observe(textarea);

    this.#characterCoordinatesCalculator = new TextareaRange(textarea);
  }

  disconnect() {
    super.disconnect();

    this.#resizeObserver.disconnect();
    this.#characterCoordinatesCalculator.disconnect();
    this.#tooltip.disconnect();

    this.#annotationsPortal.remove();
    this.#statusContainer.remove();
  }

  /**
   * Return a list of rects for the given range. If the range extends over multiple lines,
   * multiple rects will be returned.
   */
  getRangeRects(characterIndexes: NumberRange) {
    return this.#characterCoordinatesCalculator.getClientRects(
      characterIndexes
    );
  }

  getBoundingClientRect() {
    return this.#textarea.getBoundingClientRect();
  }

  getLineHeight() {
    const parsed = parseInt(getComputedStyle(this.#textarea).lineHeight, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  get value() {
    return this.#textarea.value;
  }

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

  #_tooltipAnnotation: LintErrorAnnotation | null = null;

  set #tooltipAnnotation(annotation: LintErrorAnnotation | null) {
    if (annotation === this.#_tooltipAnnotation) return;

    this.#_tooltipAnnotation = annotation;

    if (annotation) {
      const position = annotation.getTooltipPosition();
      if (position)
        this.#tooltip.show(
          annotation.name,
          annotation.description,
          annotation.details,
          position
        );
    } else {
      this.#tooltip.hide();
    }
  }

  #onUpdate = () => this.#lint();

  #onReposition = () => this.#recalculateAnnotationPositions();

  #onBlur = () => this.#clear();

  #onMouseMove = (event: MouseEvent) =>
    this.#updatePointerTooltip(new Vector(event.clientX, event.clientY));

  #onMouseLeave = () => (this.#tooltipAnnotation = null);

  #onSelectionChange = () => {
    // this event only works when applied to the document but we can filter it by detecting focus
    if (document.activeElement === this.#textarea) this.#updateCaretTooltip();
  };

  #clear() {
    // the annotations will clean themselves up too but this is slightly faster
    this.#annotationsPortal.replaceChildren();

    for (const annotation of this.#annotations) annotation.disconnect();

    this.#annotations = [];
    this.#tooltipAnnotation = null;
  }

  #lint() {
    this.#clear();

    if (document.activeElement !== this.#textarea) return;

    const errors = lintMarkdown(this.value) ?? [];

    this.#annotations = errors.map(
      (error) => new LintErrorAnnotation(error, this, this.#annotationsPortal)
    );
  }

  #recalculateAnnotationPositions() {
    for (const annotation of this.#annotations)
      annotation.recalculatePosition();
  }

  #updatePointerTooltip(pointerLocation: Vector) {
    // can't use mouse events on annotations (the easy way) because they have pointer-events: none
    this.#tooltipAnnotation =
      this.#annotations.find((a) => a.containsPoint(pointerLocation)) ?? null;
  }

  #updateCaretTooltip() {
    if (this.#textarea.selectionEnd !== this.#textarea.selectionStart) return;
    const caretIndex = this.#textarea.selectionStart;

    this.#tooltipAnnotation =
      this.#annotations.find((a) => a.containsIndex(caretIndex)) ?? null;
  }

  static #createStatusContainerElement() {
    const container = document.createElement("p");
    container.setAttribute("aria-live", "polite");
    container.style.position = "absolute";
    container.style.clipPath = "circle(0)";
    return container;
  }
}

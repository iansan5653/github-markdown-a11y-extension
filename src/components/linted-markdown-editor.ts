// @ts-check

"use strict";

import {TextareaRange} from "../utilities/textarea-range";
import {formatList} from "../utilities/format";
import {lintMarkdown} from "../utilities/lint-markdown";
import {LintErrorTooltip} from "./lint-error-tooltip";
import {LintErrorAnnotation} from "./lint-error-annotation";
import {Vector} from "../utilities/vector";
import {NumberRange} from "../utilities/number-range";

export class LintedMarkdownEditor {
  #textarea: HTMLTextAreaElement;
  #annotationsPortal: HTMLElement;
  #statusContainer: HTMLElement;
  #resizeObserver: ResizeObserver;
  #characterCoordinatesCalculator: TextareaRange;

  #tooltip: LintErrorTooltip;

  #_tooltipAnnotation: LintErrorAnnotation | null = null;
  #_annotations: readonly LintErrorAnnotation[] = [];

  constructor(
    textarea: HTMLTextAreaElement,
    portal: HTMLElement,
    tooltip: LintErrorTooltip
  ) {
    this.#textarea = textarea;
    this.#tooltip = tooltip;

    this.#annotationsPortal = document.createElement("div");
    portal.appendChild(this.#annotationsPortal);

    this.#statusContainer = document.createElement("div");
    this.#statusContainer.setAttribute("aria-live", "polite");
    this.#statusContainer.style.position = "absolute";
    this.#statusContainer.style.clipPath = "circle(0)";
    portal.appendChild(this.#statusContainer);

    this.#textarea.addEventListener("input", this.#onRefresh);
    this.#textarea.addEventListener("focus", this.#onRefresh);
    this.#textarea.addEventListener("scroll", this.#onRefresh);
    this.#textarea.addEventListener("blur", this.#onBlur);
    this.#textarea.addEventListener("mousemove", this.#onMouseMove);
    this.#textarea.addEventListener("mouseleave", this.#onMouseLeave);

    document.addEventListener("selectionchange", this.#onSelectionChange);

    this.#resizeObserver = new ResizeObserver(this.#onRefresh);
    this.#resizeObserver.observe(textarea);

    this.#characterCoordinatesCalculator = new TextareaRange(textarea);
  }

  disconnect() {
    this.#textarea.removeEventListener("input", this.#onRefresh);
    this.#textarea.removeEventListener("focus", this.#onRefresh);
    this.#textarea.removeEventListener("scroll", this.#onRefresh);
    this.#textarea.removeEventListener("blur", this.#onBlur);
    this.#textarea.removeEventListener("mousemove", this.#onMouseMove);
    this.#textarea.removeEventListener("mouseleave", this.#onMouseLeave);

    document.removeEventListener("selectionchange", this.#onSelectionChange);

    this.#resizeObserver.disconnect();
    this.#characterCoordinatesCalculator.disconnect();

    this.#annotationsPortal.parentElement?.removeChild(this.#annotationsPortal);
    this.#statusContainer.parentElement?.removeChild(this.#statusContainer);
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

  #onRefresh = () => this.#lint();

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
}

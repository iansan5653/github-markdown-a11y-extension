// @ts-check

"use strict";

import {getCharacterCoordinates} from "../utilities/character-coordinates";
import {formatList} from "../utilities/format";
import {lintMarkdown} from "../utilities/lint-markdown";
import {LintErrorTooltip} from "./lint-error-tooltip";

let idCounter = 0;

interface ErrorLineChunk {
  top: number;
  left: number;
  width: number;
  startIndex: number;
  endIndex: number;
  height: number;
}

export class LintedMarkdownEditor {
  #textarea: HTMLTextAreaElement;
  #annotationsPortal: HTMLElement;
  #statusContainer: HTMLElement;
  #id: string;
  #resizeObserver: ResizeObserver;
  #currentTooltipAnnotation: HTMLElement | undefined;
  #tooltip: LintErrorTooltip;

  constructor(
    textarea: HTMLTextAreaElement,
    rootPortal: HTMLElement,
    tooltip: LintErrorTooltip
  ) {
    this.#textarea = textarea;
    this.#tooltip = tooltip;
    this.#id = (++idCounter).toString();

    textarea.dataset.markdownLintingId = this.#id;

    this.#annotationsPortal = document.createElement("div");
    this.#annotationsPortal.dataset.markdownLintingPortalId = this.#id;
    rootPortal.appendChild(this.#annotationsPortal);

    this.#statusContainer = document.createElement("div");
    this.#statusContainer.setAttribute("aria-live", "polite");
    this.#statusContainer.style.position = "absolute";
    this.#statusContainer.style.clipPath = "circle(0)";
    rootPortal.appendChild(this.#statusContainer);

    this.#textarea.addEventListener("input", this.#onRefresh);
    this.#textarea.addEventListener("focus", this.#onRefresh);
    this.#textarea.addEventListener("scroll", this.#onRefresh);
    this.#textarea.addEventListener("blur", this.#onBlur);
    this.#textarea.addEventListener("mousemove", this.#onMouseMove);
    this.#textarea.addEventListener("mouseleave", this.#onMouseLeave);

    document.addEventListener("selectionchange", this.#onSelectionChange);

    this.#resizeObserver = new ResizeObserver(this.#onRefresh);
    this.#resizeObserver.observe(textarea);
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

    this.#annotationsPortal.parentElement?.removeChild(this.#annotationsPortal);
    this.#statusContainer.parentElement?.removeChild(this.#statusContainer);
  }

  #onRefresh = () => this.#lint();

  #onBlur = () => {
    this.#clearErrors();
    this.#hideTooltip();
  };

  #onMouseMove = (event: MouseEvent) =>
    this.#updatePointerTooltip(event.clientX, event.clientY);

  #onMouseLeave = () => this.#hideTooltip();

  #onSelectionChange = () => {
    if (document.activeElement === this.#textarea) this.#updateCaretTooltip();
  };

  #clearErrors() {
    this.#annotationsPortal.replaceChildren();
    this.#statusContainer.replaceChildren();
  }

  #lint() {
    if (document.activeElement !== this.#textarea) return;

    const markdown = this.#textarea.value;
    const errors = lintMarkdown(markdown) ?? [];

    this.#annotationsPortal.replaceChildren();

    const lines = markdown.split("\n");
    for (const error of errors) {
      const [line, ...prevLines] = lines.slice(0, error.lineNumber).reverse();
      if (line === undefined) continue;

      const prevLineChars = prevLines.reduce(
        (t, l) => t + l.length + 1 /* add one for newline char */,
        0
      );
      const lineStart = error.errorRange?.[0] ?? 0;
      const overallStartIndex =
        prevLineChars + (error.errorRange?.[0] ?? 1) - 1;

      let overallEndIndex =
        overallStartIndex +
        (error.errorRange?.[1] ?? line.length - lineStart + 1);

      // It's not enought to just split by '/n' because we may have soft line wraps to deal with as well.
      // The only way to figure these out is to calculate coordinates for every character.
      const errorLineChunks: ErrorLineChunk[] = [];
      for (let i = overallStartIndex; i <= overallEndIndex; i++) {
        const lastLine = errorLineChunks.at(-1);
        const coords = getCharacterCoordinates(this.#textarea, i);
        if (lastLine && lastLine.top === coords.top) {
          lastLine.width = coords.left - lastLine.left + coords.width;
          lastLine.endIndex = i;
        } else if (i !== overallEndIndex) {
          /* (don't create any empty chunks from the last char) */ if (
            lastLine
          ) {
            // there's no character after the end of the soft line to get that last bit so we have to guess it
            lastLine.width +=
              lastLine.width /
              markdown.slice(lastLine.startIndex, lastLine.endIndex + 1).length;
          }
          errorLineChunks.push({
            ...coords,
            width: 0,
            startIndex: i,
            endIndex: i,
          });
        }
      }

      const editorRect = this.#textarea.getBoundingClientRect();

      // render an annotation for each line separately
      for (let {
        left,
        width,
        top,
        height,
        startIndex,
        endIndex,
      } of errorLineChunks) {
        // suppress when out of bounds
        if (
          top < editorRect.top ||
          top + height > editorRect.bottom ||
          left < editorRect.left ||
          left + width > editorRect.right
        )
          continue;

        const annotation = document.createElement("span");
        annotation.style.position = "absolute";
        // account for window scroll because they are absolute, not fixed
        annotation.style.top = `${top + scrollY - 2}px`;
        annotation.style.left = `${left + scrollX}px`;
        annotation.style.width = `${width}px`;
        annotation.style.backgroundColor = "var(--color-danger-emphasis)";
        annotation.style.opacity = "0.2";
        annotation.style.height = `${height}px`;
        annotation.style.pointerEvents = "none";

        annotation.dataset.errorName =
          error.ruleNames?.slice(0, 2).join(": ") ?? "";
        annotation.dataset.errorDescription = error.ruleDescription ?? "";
        annotation.dataset.errorDetails = error.errorDetail ?? "";
        annotation.dataset.startIndex = startIndex.toString();
        annotation.dataset.endIndex = endIndex.toString();

        this.#annotationsPortal.appendChild(annotation);
      }
    }

    this.#statusContainer.textContent = `${errors.length} Markdown problem${
      errors.length > 1 ? "s" : ""
    } identified: see line${errors.length > 1 ? "s" : ""} ${formatList(
      errors.map((e) => e.lineNumber.toString()),
      "and"
    )}`;
  }

  #hideTooltip() {
    this.#tooltip.hide();
    this.#currentTooltipAnnotation = undefined;
  }

  #showTooltip(forAnnotation: HTMLElement) {
    if (this.#currentTooltipAnnotation !== forAnnotation) {
      const rect = forAnnotation.getBoundingClientRect();
      this.#tooltip.show(
        forAnnotation.dataset.errorName ?? "",
        forAnnotation.dataset.errorDescription ?? "",
        forAnnotation.dataset.errorDetails ?? "",
        {top: rect.top + rect.height + scrollY, left: rect.left + scrollX}
      );
      this.#currentTooltipAnnotation = forAnnotation;
    }
  }

  #updatePointerTooltip(pointerX: number, pointerY: number) {
    // can't use mouse events on annotations (the easy way) because they have pointer-events: none

    for (const annotation of this.#annotationsPortal.children) {
      const rect = annotation.getBoundingClientRect();
      if (
        annotation instanceof HTMLElement &&
        pointerX >= rect.left &&
        pointerX <= rect.left + rect.width &&
        pointerY >= rect.top &&
        pointerY <= rect.top + rect.height
      ) {
        this.#showTooltip(annotation);
        return;
      }
    }

    this.#hideTooltip();
  }

  #updateCaretTooltip() {
    if (this.#textarea.selectionEnd !== this.#textarea.selectionStart) return;
    const caretIndex = this.#textarea.selectionStart;

    for (const annotation of this.#annotationsPortal.children)
      if (
        annotation instanceof HTMLElement &&
        parseInt(annotation.dataset.startIndex ?? "-1") <= caretIndex &&
        parseInt(annotation.dataset.endIndex ?? "-1") >= caretIndex
      ) {
        this.#showTooltip(annotation);
        return;
      }

    this.#hideTooltip();
  }
}

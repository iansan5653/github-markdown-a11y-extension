//@ts-check
"use strict";

import {Vector} from "../utilities/geometry/vector";
import {LintError} from "../utilities/lint-markdown";
import {ChildNode, Component} from "./component";

export class LintErrorTooltip extends Component {
  #tooltip = LintErrorTooltip.#createTooltipElement();

  constructor() {
    super();
    this.addEventListener(document, "keydown", (e) => this.#onGlobalKeydown(e));
    document.body.appendChild(this.#tooltip);
  }

  disconnect() {
    super.disconnect();
    this.#tooltip.remove();
  }

  show(errors: LintError[], {x, y}: Vector) {
    const prefix = LintErrorTooltip.#createPrefixElement(errors.length);

    // even though typed as required string, sometimes these properties are missing
    const errorNodes = errors.map((error, i) => [
      i !== 0 ? LintErrorTooltip.#createSeparatorElement() : "",
      LintErrorTooltip.#createDescriptionElement(error.ruleDescription),
      error.errorDetail
        ? LintErrorTooltip.#createDetailsElement(error.errorDetail)
        : "",
      error.justification
        ? LintErrorTooltip.#createJustificationElement(error.justification)
        : "",
      error.ruleNames?.length
        ? LintErrorTooltip.#createNameElement(
            error.ruleNames?.slice(0, 2).join(": ")
          )
        : "",
    ]);

    this.#tooltip.replaceChildren(prefix, ...errorNodes.flat());

    this.#tooltip.style.top = `${y}px`;
    this.#tooltip.style.left = `${x}px`;
    this.#tooltip.style.maxWidth = `${document.body.clientWidth - x - 16}px`;

    this.#tooltip.removeAttribute("hidden");
  }

  hide() {
    this.#tooltip.setAttribute("hidden", "true");
  }

  #onGlobalKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && !event.defaultPrevented) this.hide();
  }

  static #createTooltipElement() {
    const element = document.createElement("div");

    element.setAttribute("aria-live", "polite");
    element.setAttribute("hidden", "true");

    element.style.backgroundColor = "var(--color-canvas-default)";
    element.style.padding = "8px";
    element.style.border = "1px solid var(--color-border-default)";
    element.style.borderRadius = "6px";
    element.style.boxShadow = "var(--color-shadow-medium)";
    element.style.position = "absolute";
    element.style.pointerEvents = "none";
    element.style.userSelect = "none";
    element.style.width = "350px";
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.gap = "8px";

    return element;
  }

  static #createPrefixElement(errorCount: number) {
    const element = document.createElement("span");
    element.textContent =
      errorCount === 1
        ? "Markdown problem: "
        : `${errorCount} Markdown problems: `;
    element.style.clipPath = "circle(0)";
    element.style.position = "absolute";
    return element;
  }

  static #createDescriptionElement(description: string) {
    const element = document.createElement("div");
    element.style.fontWeight = "bold";
    element.style.color = "var(--color-danger-fg)";
    element.append(description);
    return element;
  }

  static #createDetailsElement(details: string) {
    const element = document.createElement("p");
    element.style.fontWeight = "bold";
    element.style.margin = "0";
    element.append(details);
    return element;
  }

  static #createJustificationElement(justification: string) {
    const element = document.createElement("p");
    element.style.margin = "0";
    element.append(justification);
    return element;
  }

  static #createNameElement(name: string) {
    const element = document.createElement("code");
    element.style.fontSize = "12px";
    element.style.color = "var(--color-fg-muted)";
    element.append(name);
    return element;
  }

  static #createSeparatorElement() {
    const element = document.createElement("hr");
    element.style.borderTop = "1px dashed var(--color-border-default)";
    element.style.borderBottom = "none";
    element.style.margin = "0";
    return element;
  }
}

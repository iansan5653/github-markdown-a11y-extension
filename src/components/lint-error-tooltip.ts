//@ts-check
"use strict";

import {Vector} from "../utilities/geometry/vector";
import {Component} from "./component";

export class LintErrorTooltip extends Component {
  #description = LintErrorTooltip.#createDescriptionElement();
  #details = LintErrorTooltip.#createDetailsElement();
  #name = LintErrorTooltip.#createNameElement();

  #tooltip = LintErrorTooltip.#createTooltipElement(
    LintErrorTooltip.#createPrefixElement(),
    this.#description,
    this.#details,
    this.#name
  );

  constructor() {
    super();
    this.addEventListener(document, "keydown", (e) => this.#onGlobalKeydown(e));
    document.body.appendChild(this.#tooltip);
  }

  disconnect() {
    super.disconnect();
    this.#tooltip.remove();
  }

  show(
    nameText: string,
    descriptionText: string,
    detailsText: string,
    {x, y}: Vector
  ) {
    this.#description.textContent = descriptionText;
    this.#details.textContent = detailsText;
    this.#name.textContent = nameText;

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

  static #createTooltipElement(...children: HTMLElement[]) {
    const tooltip = document.createElement("div");

    tooltip.setAttribute("aria-live", "polite");
    tooltip.setAttribute("hidden", "true");

    tooltip.style.backgroundColor = "var(--color-canvas-default)";
    tooltip.style.padding = "8px";
    tooltip.style.border = "1px solid var(--color-fg-subtle)";
    tooltip.style.borderRadius = "6px";
    tooltip.style.boxShadow = "var(--color-shadow-medium)";
    tooltip.style.position = "absolute";
    tooltip.style.pointerEvents = "none";
    tooltip.style.userSelect = "none";
    tooltip.style.width = "350px";

    tooltip.replaceChildren(...children);
    return tooltip;
  }

  static #createPrefixElement() {
    const prefix = document.createElement("span");
    prefix.textContent = "Markdown problem: ";
    prefix.style.clipPath = "circle(0)";
    prefix.style.position = "absolute";
    return prefix;
  }

  static #createDescriptionElement() {
    const description = document.createElement("div");
    description.style.fontWeight = "bold";
    description.style.color = "var(--color-danger-fg)";
    return description;
  }

  static #createDetailsElement() {
    return document.createElement("div");
  }

  static #createNameElement() {
    const name = document.createElement("code");
    name.style.fontSize = "12px";
    name.style.color = "var(--color-fg-muted)";
    return name;
  }
}

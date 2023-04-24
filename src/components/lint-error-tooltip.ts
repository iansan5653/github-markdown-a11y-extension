//@ts-check
"use strict";

import {Vector} from "../utilities/geometry/vector";

export class LintErrorTooltip {
  #tooltip;

  constructor() {
    this.#tooltip = document.createElement("div");

    this.#tooltip.setAttribute("aria-live", "polite");
    this.hide();

    this.#tooltip.style.backgroundColor = "var(--color-canvas-default)";
    this.#tooltip.style.padding = "8px";
    this.#tooltip.style.border = "1px solid var(--color-fg-subtle)";
    this.#tooltip.style.borderRadius = "6px";
    this.#tooltip.style.boxShadow = "var(--color-shadow-medium)";
    this.#tooltip.style.position = "absolute";
    this.#tooltip.style.pointerEvents = "none";
    this.#tooltip.style.userSelect = "none";

    document.addEventListener("keydown", (e) => this.#onGlobalKeydown(e));

    document.body.appendChild(this.#tooltip);
  }

  show(
    nameText: string,
    descriptionText: string,
    detailsText: string,
    {x, y}: Vector
  ) {
    // so screen readers know what the live update means
    const accessiblePrefix = document.createElement("span");
    accessiblePrefix.textContent = "Markdown problem: ";
    accessiblePrefix.style.clipPath = "circle(0)";
    accessiblePrefix.style.position = "absolute";

    const description = document.createElement("div");
    description.textContent = descriptionText;
    description.style.fontWeight = "bold";
    description.style.color = "var(--color-danger-fg)";

    const details = document.createElement("div");
    details.textContent = detailsText;

    const name = document.createElement("code");
    name.textContent = nameText;
    name.style.fontSize = "12px";
    name.style.color = "var(--color-fg-muted)";

    this.#tooltip.replaceChildren(accessiblePrefix, description, details, name);

    this.#tooltip.style.top = `${y}px`;
    this.#tooltip.style.left = `${x}px`;
    this.#tooltip.style.width = `350px`;
    this.#tooltip.style.maxWidth = `${document.body.clientWidth - x - 16}px`;

    this.#tooltip.removeAttribute("hidden");
  }

  hide() {
    this.#tooltip.setAttribute("hidden", "true");
  }

  #onGlobalKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && !event.defaultPrevented) this.hide();
  }
}

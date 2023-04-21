//@ts-check
"use strict";

import markdownlint from "markdownlint";

export class LintErrorTooltip {
  #tooltip;

  /** @type {boolean} */
  #_visible;

  constructor() {
    this.#tooltip = document.createElement("div");

    this.#tooltip.setAttribute("role", "status");
    this.#tooltip.setAttribute("hidden", "true");

    this.#tooltip.style.backgroundColor = "var(--color-canvas-default)";
    this.#tooltip.style.padding = "8px";
    this.#tooltip.style.border = "1px solid var(--color-fg-subtle)";
    this.#tooltip.style.borderRadius = "6px";
    this.#tooltip.style.boxShadow = "var(--color-shadow-medium)";
    this.#tooltip.style.position = "fixed";

    document.addEventListener("keydown", (e) => this.#onGlobalKeydown(e));

    document.body.appendChild(this.#tooltip);
  }

  get #visible() {
    return this.#_visible;
  }

  /**
   * @param {string} titleText
   * @param {string} bodyText
   * @param {{top: number, left: number}} position
   */
  show(titleText, bodyText, {top, left}) {
    const title = document.createElement("div");
    title.textContent = titleText;
    title.style.fontWeight = "bold";
    title.style.color = "var(--color-danger-fg)";

    const body = document.createElement("div");
    body.textContent = bodyText;

    this.#tooltip.replaceChildren(title, body);

    this.#tooltip.style.top = `${top}px`;
    this.#tooltip.style.left = `${left}px`;
    this.#tooltip.style.width = `300px`;
    this.#tooltip.style.maxWidth = `${document.body.clientWidth - left - 16}px`;

    this.#tooltip.removeAttribute("hidden");
  }

  hide() {
    this.#tooltip.setAttribute("hidden", "true");
  }

  /** @param {KeyboardEvent} event */
  #onGlobalKeydown(event) {
    if (event.key === "Escape" && !event.defaultPrevented) this.hide();
  }
}

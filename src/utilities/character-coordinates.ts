// Note that some browsers, such as Firefox, do not concatenate properties
// into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
// so we have to list every single property explicitly.
const propertiesToCopy = [
  "direction", // RTL support
  "boxSizing",
  "width", // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  "height",
  "overflowX",
  "overflowY", // copy the scrollbar for IE

  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",

  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",

  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration", // might not make a difference, but better be safe

  "letterSpacing",
  "wordSpacing",

  "tabSize",
  "MozTabSize" as "tabSize", // prefixed version for Firefox <= 52
] as const satisfies ReadonlyArray<keyof CSSStyleDeclaration>;

export interface Coordinates {
  top: number;
  left: number;
  height: number;
}

/**
 * Obtain the coordinates (px) of the top left of a character in an input, relative to
 * the viewport.
 *
 * Forked from https://github.com/primer/react/blob/src/drafts/utils/character-coordinates.ts,
 * which was forked from https://github.com/koddsson/textarea-caret-position, which was
 * forked from https://github.com/component/textarea-caret-position.
 */
// Using a class, we can save a ton of calculation per-character by reusing the same parent div. This does risk
export class CharacterCoordinatesCalculator {
  readonly #element: HTMLTextAreaElement | HTMLInputElement;
  readonly #div: HTMLDivElement;
  readonly #mutationObserver: MutationObserver;
  readonly #resizeObserver: ResizeObserver;

  #borderTopWidth: number = 0;
  #borderLeftWidth: number = 0;
  #lineHeight: number = 0;

  constructor(element: HTMLTextAreaElement | HTMLInputElement) {
    this.#element = element;

    // The mirror div will replicate the textarea's style
    const div = document.createElement("div");
    this.#div = div;
    document.body.appendChild(div);

    this.#refresh();

    this.#mutationObserver = new MutationObserver(() => this.#refresh());
    this.#mutationObserver.observe(this.#element, {attributes: true});

    this.#resizeObserver = new ResizeObserver(() => this.#refresh());
    this.#resizeObserver.observe(this.#element);
  }

  getCoordinates(index: number) {
    this.#div.textContent = this.#element.value.substring(0, index);

    // The second special handling for input type="text" vs textarea:
    // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
    if (this.#element instanceof HTMLInputElement)
      this.#div.textContent = this.#div.textContent.replace(/\s/g, "\u00a0");

    const span = document.createElement("span");
    // Wrapping must be replicated *exactly*, including when a long word gets
    // onto the next line, with whitespace at the end of the line before (#7).
    // The  *only* reliable way to do that is to copy the *entire* rest of the
    // textarea's content into the <span> created at the caret position.
    // For inputs, '.' is enough because there is no wrapping.
    span.textContent = this.#element.value.substring(index) || "."; // because a completely empty faux span doesn't render at all
    this.#div.appendChild(span);

    const {top: viewportOffsetTop, left: viewportOffsetLeft} =
      this.#element.getBoundingClientRect();

    return {
      top:
        span.offsetTop +
        this.#borderTopWidth -
        this.#element.scrollTop +
        viewportOffsetTop,
      left:
        span.offsetLeft +
        this.#borderLeftWidth -
        this.#element.scrollLeft +
        viewportOffsetLeft,
      height: this.#lineHeight,
    };
  }

  disconnect() {
    this.#div.parentElement?.removeChild(this.#div);
    this.#mutationObserver.disconnect();
    this.#resizeObserver.disconnect();
  }

  #refresh() {
    console.log("refresh");
    const style = this.#div.style;
    const computed = window.getComputedStyle(this.#element);

    // Lineheight is either a number or the string 'normal'. In that case, fall back to a
    // rough guess of 1.2 based on MDN: "Desktop browsers use a default value of roughly 1.2".
    const lineHeight = isNaN(parseInt(computed.lineHeight))
      ? parseInt(computed.fontSize) * 1.2
      : parseInt(computed.lineHeight);

    const isInput = this.#element instanceof HTMLInputElement;

    // Default wrapping styles
    style.whiteSpace = isInput ? "nowrap" : "pre-wrap";
    style.wordWrap = isInput ? "" : "break-word";

    // Position off-screen
    style.position = "absolute"; // required to return coordinates properly

    const isFirefox = "mozInnerScreenX" in window;

    // Transfer the element's properties to the div
    for (const prop of propertiesToCopy) {
      if (isInput && prop === "lineHeight") {
        // Special case for <input>s because text is rendered centered and line height may be != height
        if (computed.boxSizing === "border-box") {
          const height = parseInt(computed.height);
          const outerHeight =
            parseInt(computed.paddingTop) +
            parseInt(computed.paddingBottom) +
            parseInt(computed.borderTopWidth) +
            parseInt(computed.borderBottomWidth);
          const targetHeight = outerHeight + lineHeight;

          if (height > targetHeight) {
            style.lineHeight = `${height - outerHeight}px`;
          } else if (height === targetHeight) {
            style.lineHeight = computed.lineHeight;
          } else {
            style.lineHeight = "0";
          }
        } else {
          style.lineHeight = computed.height;
        }
      } else if (
        !isInput &&
        prop === "width" &&
        computed.boxSizing === "border-box"
      ) {
        // With box-sizing: border-box we need to offset the size slightly inwards.  This small difference can compound
        // greatly in long textareas with lots of wrapping, leading to very innacurate results if not accounted for.
        // Firefox will return computed styles in floats, like `0.9px`, while chromium might return `1px` for the same element.
        // Either way we use `parseFloat` to turn `0.9px` into `0.9` and `1px` into `1`
        const totalBorderWidth =
          parseFloat(computed.borderLeftWidth) +
          parseFloat(computed.borderRightWidth);
        // When a vertical scrollbar is present it shrinks the content. We need to account for this by using clientWidth
        // instead of width in everything but Firefox. When we do that we also have to account for the border width.
        const width = isFirefox
          ? parseFloat(computed.width) - totalBorderWidth
          : this.#element.clientWidth + totalBorderWidth;
        style.width = `${width}px`;
      } else {
        style[prop] = computed[prop];
      }
    }

    if (isFirefox) {
      // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
      if (this.#element.scrollHeight > parseInt(computed.height))
        style.overflowY = "scroll";
    } else {
      style.overflow = "hidden"; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
    }

    this.#borderLeftWidth = parseInt(computed.borderLeftWidth);
    this.#borderTopWidth = parseInt(computed.borderTopWidth);
    this.#lineHeight = lineHeight;
  }
}

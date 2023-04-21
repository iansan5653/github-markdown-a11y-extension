import {LintError} from "markdownlint";
import {LintedMarkdownEditor} from "./linted-markdown-editor";

interface ErrorLineChunk {
  top: number;
  left: number;
  width: number;
  startIndex: number;
  endIndex: number;
  height: number;
}

export class LintErrorAnnotation {
  readonly name: string;
  readonly description: string;
  readonly details: string;
  readonly lineNumber: number;

  readonly #portal: HTMLElement;
  readonly #elements: readonly HTMLElement[] = [];

  readonly #startIndex: number;
  readonly #endIndex: number;

  constructor(
    error: LintError,
    editor: LintedMarkdownEditor,
    portal: HTMLElement
  ) {
    this.name = error.ruleNames?.slice(0, 2).join(": ") ?? "";
    this.description = error.ruleDescription ?? "";
    this.details = error.errorDetail ?? "";
    this.lineNumber = error.lineNumber;

    this.#portal = document.createElement("div");
    portal.appendChild(this.#portal);

    const markdown = editor.value;
    const lines = markdown.split("\n");

    const [line, ...prevLines] = lines.slice(0, this.lineNumber).reverse();
    if (line === undefined) throw new Error("Invalid lineNumber");

    const prevLineChars = prevLines.reduce(
      (t, l) => t + l.length + 1 /* add one for newline char */,
      0
    );
    const lineStart = error.errorRange?.[0] ?? 0;

    this.#startIndex = prevLineChars + (error.errorRange?.[0] ?? 1) - 1;
    this.#endIndex =
      this.#startIndex + (error.errorRange?.[1] ?? line.length - lineStart + 1);

    // It's not enought to just split by '/n' because we may have soft line wraps to deal with as well.
    // The only way to figure these out is to calculate coordinates for every character.
    const errorLineChunks: ErrorLineChunk[] = [];
    for (let i = this.#startIndex; i <= this.#endIndex; i++) {
      const lastLine = errorLineChunks.at(-1);
      const coords = editor.getCharacterCoordinates(i);
      if (lastLine && lastLine.top === coords.top) {
        lastLine.width = coords.left - lastLine.left + coords.width;
        lastLine.endIndex = i;
      } else if (i !== this.#endIndex) {
        /* (don't create any empty chunks from the last char) */ if (lastLine) {
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

    const editorRect = editor.getBoundingClientRect();

    const elements: HTMLElement[] = [];
    // render an annotation element for each line separately
    for (const {left, width, top, height} of errorLineChunks) {
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

      this.#portal.appendChild(annotation);
      elements.push(annotation);
    }
    this.#elements = elements;
  }

  disconnect() {
    this.#portal.parentElement?.removeChild(this.#portal);
  }

  getTooltipPosition() {
    const rect = this.#elements.at(-1)?.getBoundingClientRect();
    if (rect)
      return {top: rect.top + rect.height + scrollY, left: rect.left + scrollX};
  }

  containsCoordinates(x: number, y: number) {
    return this.#elements.some((element) => {
      const rect = element.getBoundingClientRect();
      return (
        x >= rect.left &&
        x <= rect.left + rect.width &&
        y >= rect.top &&
        y <= rect.top + rect.height
      );
    });
  }

  containsIndex(index: number) {
    return index >= this.#startIndex && index <= this.#endIndex;
  }
}

import {LintError} from "markdownlint";
import {LintedMarkdownEditor} from "./linted-markdown-editor";
import {Coordinates} from "../utilities/character-coordinates";

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
    const [line = "", ...prevLines] = markdown
      .split("\n")
      .slice(0, this.lineNumber)
      .reverse();

    const startCol = (error.errorRange?.[0] ?? 1) - 1;
    const length = error.errorRange?.[1] ?? line.length - startCol;

    this.#startIndex = prevLines.reduce(
      (t, l) => t + l.length + 1 /* +1 for newline char */,
      startCol
    );
    this.#endIndex = this.#startIndex + length;

    // It's not enought to just split by '/n' because we may have soft line wraps to deal with as well.
    // Calculating coordinates for every character is too expensive, so we do a binary search to chunk
    // the error by soft lines, using a Map to cache already-calculated coordinates.
    const lineChunks: ErrorLineChunk[] = [];
    const coordsCache = new Map<number, Coordinates>();
    const calculateChunks = (startIndex: number, endIndex: number) => {
      if (endIndex === startIndex) return; // noop - 0 chars

      const firstCoords =
        coordsCache.get(startIndex) ??
        editor.getCharacterCoordinates(startIndex);
      coordsCache.set(startIndex, firstCoords);

      const lastCoords =
        coordsCache.get(endIndex) ?? editor.getCharacterCoordinates(endIndex);
      coordsCache.set(endIndex, lastCoords);

      // If in same line, append to previous chunk or create new. Otherwise, split in half and try again
      if (firstCoords.top === lastCoords.top) {
        const width = Math.abs(lastCoords.left - firstCoords.left);
        const last = lineChunks.at(-1);
        if (last && last.top === firstCoords.top) {
          last.width += width;
          last.endIndex = endIndex;
        } else {
          lineChunks.push({
            ...firstCoords,
            width,
            startIndex,
            endIndex,
          });
        }
      } else if (endIndex === startIndex + 1) {
        // Means that the startIndex is a char at the end of a soft break. There's no char after this
        // in the line from which to calculate 1 char width. So we just guess how wide this char is by
        // getting the average char width in this chunk
        const last = lineChunks.at(-1);
        if (last) {
          last.width += last.width / (last.endIndex - last.startIndex);
          last.endIndex = endIndex;
        }
      } else if (startIndex !== endIndex) {
        const midIndex = Math.floor((startIndex + endIndex) / 2);
        calculateChunks(startIndex, midIndex);
        calculateChunks(midIndex, endIndex);
      }
    };
    calculateChunks(this.#startIndex, this.#endIndex);

    const editorRect = editor.getBoundingClientRect();

    // Build the highlight elements, one per chunk
    const elements: HTMLElement[] = [];
    // render an annotation element for each line separately
    for (const {left, width, top, height} of lineChunks) {
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
    return index >= this.#startIndex && index < this.#endIndex;
  }
}

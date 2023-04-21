// @ts-check

"use strict";

import markdownlint from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";
import {getCharacterCoordinates} from "./character-coordinates";
import {observeSelector} from "./observe";
import {LintErrorTooltip} from "./tooltip";
import {formatList} from "./format";

const rootPortal = document.createElement("div");
document.body.appendChild(rootPortal);

/** @param {string} markdown */
const lintString = (markdown) =>
  markdownlint.sync({
    strings: {
      content: markdown,
    },
    config: markdownlintGitHub.init({
      default: false,
      "heading-increment": true,
      "no-reversed-links": true,
      "no-empty-links": true,
    }),
    handleRuleFailures: true,
    customRules: markdownlintGitHub,
  }).content;

/**
 * @param {HTMLTextAreaElement} editor
 * @param {HTMLElement} annotationsPortal
 * @param {HTMLElement} accessibleDescriptionContainer
 */
const lintEditor = (
  editor,
  annotationsPortal,
  accessibleDescriptionContainer
) => {
  const markdown = editor.value;
  const errors = lintString(markdown);

  annotationsPortal.replaceChildren();

  const lines = markdown.split("\n");
  for (const error of errors) {
    const [line, ...prevLines] = lines.slice(0, error.lineNumber).reverse();
    const prevLineChars = prevLines.reduce(
      (t, l) => t + l.length + 1 /* add one for newline char */,
      0
    );
    const lineStart = error.errorRange?.[0] ?? 0;
    const overallStartIndex = prevLineChars + (error.errorRange?.[0] ?? 1) - 1;

    let overallEndIndex =
      overallStartIndex +
      (error.errorRange?.[1] ?? line.length - lineStart + 1);

    // It's not enought to just split by '/n' because we may have soft line wraps to deal with as well.
    // The only way to figure these out is to calculate coordinates for every character.
    const errorLineChunks = [];
    for (let i = overallStartIndex; i <= overallEndIndex; i++) {
      const lastLine = errorLineChunks.at(-1);
      const coords = getCharacterCoordinates(editor, i);
      if (lastLine && lastLine.top === coords.top) {
        lastLine.width = coords.left - lastLine.left + coords.width;
        lastLine.endIndex = i;
      } else if (i !== overallEndIndex) {
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

      annotationsPortal.appendChild(annotation);
    }
  }

  accessibleDescriptionContainer.textContent = `${
    errors.length
  } Markdown problem${errors.length > 1 ? "s" : ""} identified: see line${
    errors.length > 1 ? "s" : ""
  } ${formatList(
    errors.map((e) => e.lineNumber),
    "and"
  )}`;
};

const markdownEditorsSelector =
  "textarea.js-paste-markdown, textarea.CommentBox-input";
let idCounter = 1;

observeSelector(markdownEditorsSelector, (editor) => {
  const editorRect = editor.getBoundingClientRect();
  // ignore hidden inputs
  if (editorRect.height < 5 || editorRect.width < 5) return () => {};

  editor.dataset.markdownLintingId = (++idCounter).toString();

  const portal = document.createElement("div");
  portal.dataset.markdownLintingPortalId = editor.dataset.markdownLintingId;
  rootPortal.appendChild(portal);

  const accessibleDescriptionContainer = document.createElement("div");
  accessibleDescriptionContainer.setAttribute("aria-live", "polite");
  accessibleDescriptionContainer.style.position = "absolute";
  accessibleDescriptionContainer.style.clipPath = "circle(0)";
  rootPortal.appendChild(accessibleDescriptionContainer);

  const refreshLint = () => {
    if (document.activeElement !== editor) return;
    lintEditor(
      /** @type {HTMLTextAreaElement} */ (editor),
      portal,
      accessibleDescriptionContainer
    );
  };

  editor.addEventListener("input", refreshLint);
  editor.addEventListener("focus", refreshLint);
  editor.addEventListener("scroll", refreshLint);

  editor.addEventListener("blur", () => {
    portal.replaceChildren();
    tooltip.hide();
    currentTooltipAnnotation = null;
  });

  const resizeObserver = new ResizeObserver(refreshLint);
  resizeObserver.observe(editor);

  return () => {
    document.removeEventListener("input", refreshLint);
    rootPortal.removeChild(portal);
    rootPortal.removeChild(accessibleDescriptionContainer);
    resizeObserver.disconnect();
  };
});

const tooltip = new LintErrorTooltip();
let currentTooltipAnnotation = null;

document.addEventListener("mousemove", (event) => {
  // can't use mouse events on annotations (the easy way) because they have pointer-events: none

  const x = event.clientX;
  const y = event.clientY;

  for (const editorPortal of rootPortal.children)
    for (const annotation of editorPortal.children) {
      const rect = annotation.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.left + rect.width &&
        y >= rect.top &&
        y <= rect.top + rect.height
      ) {
        if (currentTooltipAnnotation !== annotation) {
          tooltip.show(
            annotation.dataset.errorName,
            annotation.dataset.errorDescription,
            annotation.dataset.errorDetails,
            {top: rect.top + rect.height + scrollY, left: rect.left + scrollX}
          );
          currentTooltipAnnotation = annotation;
        }
        return;
      }
    }

  tooltip.hide();
  currentTooltipAnnotation = null;
});

document.addEventListener("selectionchange", () => {
  const focusedElement = document.activeElement;
  if (
    focusedElement instanceof HTMLTextAreaElement &&
    focusedElement.dataset.markdownLintingId
  ) {
    if (focusedElement.selectionEnd !== focusedElement.selectionStart) return;
    const caretIndex = focusedElement.selectionStart;

    const portal = document.querySelector(
      `[data-markdown-linting-portal-id="${focusedElement.dataset.markdownLintingId}"]`
    );
    if (!portal) return;

    for (const annotation of portal.children)
      if (
        parseInt(annotation.dataset.startIndex) <= caretIndex &&
        parseInt(annotation.dataset.endIndex) >= caretIndex
      ) {
        const rect = annotation.getBoundingClientRect();
        tooltip.show(
          annotation.dataset.errorName,
          annotation.dataset.errorDescription,
          annotation.dataset.errorDetails,
          {top: rect.top + rect.height, left: rect.left}
        );
        currentTooltipAnnotation = annotation;
        return;
      }
  }

  tooltip.hide();
  currentTooltipAnnotation = null;
});

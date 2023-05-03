// @ts-check

"use strict";

import {LintErrorTooltip} from "./components/lint-error-tooltip";
import {LintedMarkdownEditor} from "./components/linted-markdown-editor";
import {observeSelector} from "./utilities/dom/observe-selector";

const rootPortal = document.createElement("div");
rootPortal.style.zIndex = "999";
document.body.appendChild(rootPortal);

const markdownEditorsSelector =
  "textarea.js-paste-markdown, textarea.CommentBox-input, textarea[aria-label='Markdown value']";

observeSelector(markdownEditorsSelector, (editor) => {
  if (!(editor instanceof HTMLTextAreaElement)) return () => {};

  const lintedEditor = new LintedMarkdownEditor(editor, rootPortal);

  return () => lintedEditor.disconnect();
});

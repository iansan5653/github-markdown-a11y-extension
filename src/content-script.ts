import "@webcomponents/custom-elements";

import {
  LintedMarkdownCodeMirrorEditor,
  LintedMarkdownTextareaEditor,
} from "./components/linted-markdown-editor";
import {observeSelector} from "./utilities/dom/observe-selector";

const rootPortal = document.createElement("div");
rootPortal.style.zIndex = "999";
rootPortal.style.position = "absolute";
rootPortal.style.top = "0";
rootPortal.style.left = "0";
document.body.appendChild(rootPortal);

// the only thing all Markdown inputs on GitHub have in common is a toolbar. So
// we observe the toolbars, going up to the nearest container that has a textarea.
observeSelector("markdown-toolbar", (toolbar) => {
  const editor = toolbar.closest(":has(textarea)")?.querySelector("textarea");

  if (!editor) return () => {};

  const lintedEditor = new LintedMarkdownTextareaEditor(editor, rootPortal);

  return () => lintedEditor.disconnect();
});

observeSelector(
  "file-attachment.js-upload-markdown-image .CodeMirror-code[contenteditable]",
  (editor) => {
    const lintedEditor = new LintedMarkdownCodeMirrorEditor(editor, rootPortal);

    return () => lintedEditor.disconnect();
  }
);

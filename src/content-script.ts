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

observeSelector(
  "textarea.js-paste-markdown, textarea.CommentBox-input, textarea[aria-label='Markdown value']",
  (editor) => {
    if (!(editor instanceof HTMLTextAreaElement)) return () => {};

    const lintedEditor = new LintedMarkdownTextareaEditor(editor, rootPortal);

    return () => lintedEditor.disconnect();
  }
);

observeSelector(
  "file-attachment.js-upload-markdown-image .CodeMirror-code[contenteditable]",
  (editor) => {
    const lintedEditor = new LintedMarkdownCodeMirrorEditor(editor, rootPortal);

    return () => lintedEditor.disconnect();
  }
);

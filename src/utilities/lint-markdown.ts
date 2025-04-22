import {lint} from "markdownlint/sync";
import {LintError as MarkdownLintError} from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";
import startHeadingLevel from "../rules/start-heading-level.js";

export interface LintError extends MarkdownLintError {
  justification?: string;
}

export type MarkdownRenderTarget = "github" | "document";

/**
 * @param markdown The Markdown content to lint.
 * @param renderTarget The Markdown's 'destination' - where will this content be
 * rendered? This affects which rules should be enabled as some only apply to
 * GitHub.com content.
 */
export const lintMarkdown = (
  markdown: string,
  renderTarget: MarkdownRenderTarget
): LintError[] =>
  lint({
    strings: {
      content: markdown,
    },
    config: markdownlintGitHub.init({
      default: false,
      "no-reversed-links": true,
      "no-empty-links": true,
      // While enforcing a certain unordered list style can be somewhat helpful for making the Markdown source
      // easier to read with a screen reader, this rule is ultimately too opinionated and noisy to be worth it,
      // especially because it conflicts with the editor's bulleted list toolbar button.
      "ul-style": false,
      "no-empty-alt-text": true,
      "start-heading-level": {
        // Don't enforce a start heading level in document mode since this content will often render
        // outside of GitHub.com.
        level: renderTarget === "github" ? 3 : 1,
      },
    }),
    handleRuleFailures: true,
    customRules: [...markdownlintGitHub, startHeadingLevel],
  }).content?.map((error) => ({
    ...error,
    justification: error.ruleNames
      .map((name) => ruleJustifications[name])
      .join(" "),
  })) ?? [];

export const ruleJustifications: Partial<Record<string, string>> = {
  "heading-increment":
    "A well-formed heading structure is key for navigating documents using accessibility tools.",
  "fenced-code-language":
    "Syntax highlighting in code blocks makes it easier for sighted readers to understand code.",
  "no-alt-text":
    "Images without alt text are invisible to non-sighted readers.",
  "no-default-alt-text":
    "Default alt text does not help non-sighted readers understand the image.",
  "no-emphasis-as-header":
    "Using headers to separate sections helps readers use accessibility tools to navigate documents.",
  "ol-prefix":
    "When reading Markdown source code, out-of-order lists make it more difficult for non-sighted users to understand how long a list is.",
  "no-empty-alt-text":
    "Images get wrapped in links on github.com, which can result in an inaccessible link with an empty label if the image has empty alt text.",
  "start-heading-level":
    "GitHub pages already have level 1 and 2 headings, so Markdown headings should start at level 3 for a well-formed page structure.",
};

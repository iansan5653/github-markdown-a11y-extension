import markdownlint from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";

export interface LintError extends markdownlint.LintError {
  justification?: string;
}

export const lintMarkdown = (markdown: string): LintError[] =>
  markdownlint
    .sync({
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
        "ul-style": false
      }),
      handleRuleFailures: true,
      customRules: markdownlintGitHub,
    })
    .content?.map((error) => ({
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
};

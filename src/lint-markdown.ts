import markdownlint, {LintError} from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";

export const lintMarkdown = (markdown: string): LintError[] | undefined =>
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

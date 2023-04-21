import markdownlint from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";

/** @param {string} markdown */
export const lintMarkdown = (markdown) =>
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

// @ts-check

"use strict";

import markdownlint from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";

/** @param markdown {string} */
const lint = (markdown) => 
  markdownlint.sync({
    strings: {
      content: markdown,
    },
    config: markdownlintGitHub.init({default: false}),
    handleRuleFailures: true,
    customRules: markdownlintGitHub,
  }).content

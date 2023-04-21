import {Configuration, Rule} from "markdownlint";

declare const main: Rule[] & {
  init(overrides: Configuration): Configuration;
};
export default main;

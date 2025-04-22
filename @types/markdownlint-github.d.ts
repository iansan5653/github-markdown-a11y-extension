declare module "@github/markdownlint-github" {
  import {Configuration, Rule} from "markdownlint";
  const main: Rule[] & {
    init(overrides: Configuration): Configuration;
  };
  export default main;
}

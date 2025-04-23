declare module "@github/markdownlint-github" {
  import {Configuration, Rule} from "markdownlint";
  const rules: Rule[];
  export default rules;
  export function init(config: Configuration): Promise<Configuration>;
}

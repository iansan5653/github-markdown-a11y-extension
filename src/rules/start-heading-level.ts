import {Rule, RuleParams} from "markdownlint";

const parseHTagLevel = (tag: string) =>
  parseInt(/h(\d)/i.exec(tag)?.[1] ?? "", 10);

const getLevelConfig = (params: RuleParams) =>
  (params.config as StartHeadingLevelConfig).level;

export interface StartHeadingLevelConfig {
  level: number;
}

export default {
  names: ["start-heading-level"],
  description: "Initial heading level",
  tags: ["accessibility", "images"],
  function(params, onError) {
    const minLevel = getLevelConfig(params);
    for (const token of params.tokens)
      if (token.type === "heading_open") {
        const level = parseHTagLevel(token.tag);

        if (!Number.isNaN(level) && level < minLevel)
          onError({
            lineNumber: token.lineNumber,
            detail: `Headings should start at level ${minLevel} (found ${level})`,
          });
      }
  },
} satisfies Rule;

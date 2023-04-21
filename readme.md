## Markdown Accessibility Checker

Markdown Accessibility Checker is a Chrome extension for validating Markdown in GitHub text editors. It encourages writing accessible valid Markdown when creating issues, pull requests, discussions, and comments.

![Issue creation form on github.com with two lint errors visible. One is hovered over, showing a tooltip that says 'heading levels should only increment by one level at a time']

### Installation

1. Clone or download this repo.
2. Navigate to chrome://extensions/.
3. Flip on "Developer Mode" in the upper right-hand corner.
4. Select "Load unpacked".
5. Choose this unzipped repo folder.
6. Navigate to github.com.

### Linting rules

Under the hood, the extension is a wrapper around [Markdownlint](https://github.com/markdownlint/markdownlint), providing a web-compatible UI for viewing linting errors.

For now, the set of linting rules is not configurable. In order to minimize friction and distractions, only a small subset of lint rules are enabled. The extension does not try to encourage any sort of style or formatting - it's only here to help you with accessibility and syntax.

The base set of rules comes from [Markdownlint-github](https://github.com/github/markdownlint-github), including the core rules defined in [`base.json`](https://github.com/github/markdownlint-github/blob/main/style/base.json) and the extended set defined in [`accessibility.json`](https://github.com/github/markdownlint-github/blob/main/style/accessibility.json). In addition, a few of the default rules are also enabled where it was deemed to be useful enough:

- `heading-increment`: Enforces well-structured headings without skipping levels
- `no-reversed-links`: Enforces valid link syntax (errors if you accidentally flip the square brackets and parentheses)
- `no-empty-links`: Ensures all links have some visible link text

**Important:** Requests for new rules and changes to existing rules should be made in either the Markdownlint or Markdownlint-github repositories.

## Markdown Accessibility Checker

Markdown Accessibility Checker is a Chrome extension for validating Markdown in GitHub text editors. It encourages writing accessible valid Markdown when creating issues, pull requests, discussions, and comments.

![Issue creation form on github.com with two lint errors visible. One is hovered over, showing a tooltip that says 'heading levels should only increment by one level at a time'](./assets/screenshot.png)

### Installation

For now, the extension must be manually installed. In the future it will be published in the extension stores for easier install.

> **Note**: If you use `git clone` to get the repo and you keep that around after you install the extension, you can get the latest updates with a simple `git pull` then click the 'Refresh' button in the chrome://extensions/ page tools.

This has only been tested with Chrome, but theoretically it should work in Firefox as well.

1. Clone or download this repo.
2. Navigate to chrome://extensions/.
3. Flip on "Developer Mode" in the upper right-hand corner.
4. Select "Load unpacked".
5. Choose this unzipped repo folder.
6. Navigate to github.com.


### Linting rules

Under the hood, the extension is a wrapper around [Markdownlint](https://github.com/markdownlint/markdownlint), providing a web-compatible UI for viewing linting errors. The base set of rules comes from [Markdownlint-github](https://github.com/github/markdownlint-github). In addition, a few more rules are enabled:

- `heading-increment`: Enforces well-structured headings without skipping levels
- `no-reversed-links`: Enforces valid link syntax (errors if you accidentally flip the square brackets and parentheses)
- `no-empty-links`: Ensures all links have some visible link text

For now, the set of linting rules is not configurable. In order to minimize friction and distractions, only a small subset of lint rules are enabled. The extension does not try to encourage any sort of style or formatting - it's only here to help you with accessibility and syntax.

**Important:** Requests for new rules and changes to existing rules should be made in either the Markdownlint or Markdownlint-github repositories, not here.

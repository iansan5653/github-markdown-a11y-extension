## Markdown Accessibility Checker

Markdown Accessibility Checker is a Chrome extension for validating Markdown in GitHub text editors. It encourages writing accessible valid Markdown when creating issues, pull requests, discussions, and comments.

![Issue creation form on github.com with two lint errors visible. One is hovered over, showing a tooltip that says 'heading levels should only increment by one level at a time'](./assets/screenshot.png)

### Installation

Simply navigate to the [Chrome Web Store](https://chrome.google.com/webstore/detail/accessibility-checker-for/hdonjoppcjfaojggdiliigclajklepdg?hl=en) and install.

#### Manual installation

For testing while developing this extension:

1. Clone the repo
2. Install dependencies (`npm install`)
3. Build the extension by running `npm run build` (or `npm run build:watch` to auto-rebuild when you make changes)
4. Navigate to chrome://extensions/
5. Flip on "Developer Mode" in the upper right-hand corner
6. Select "Load unpacked"
7. Choose repo folder
8. Navigate to github.com
9. After making updates, go back to chrome://extensions/ and click the refresh button on the extension

### Linting rules

Under the hood, the extension is a wrapper around [Markdownlint](https://github.com/markdownlint/markdownlint), providing a web-compatible UI for viewing linting errors. The base set of rules comes from [Markdownlint-github](https://github.com/github/markdownlint-github). In addition, a few more rules are enabled:

- `heading-increment`: Enforces well-structured headings without skipping levels
- `no-reversed-links`: Enforces valid link syntax (errors if you accidentally flip the square brackets and parentheses)
- `no-empty-links`: Ensures all links have some visible link text

For now, the set of linting rules is not configurable. In order to minimize friction and distractions, only a small subset of lint rules are enabled. The extension does not try to encourage any sort of style or formatting - it's only here to help you with accessibility and syntax.

**Important:** Requests for new rules and changes to existing rules should be made in either the Markdownlint or Markdownlint-github repositories, not here.

### Releasing

Releasing new changes is as simple as publishing a new GitHub release. Be sure to make the tag name in `X.X.X` form (without a leading `v`).

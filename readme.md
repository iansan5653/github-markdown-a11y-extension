<div align="center"><img src="assets/promo.png" alt="Markdown Accessibility Checker app icon; a letter A on a blue background with a subtle down-pointing arrow as a shadow, looking dramatic like a superhero logo." /></div>

## Markdown Accessibility Checker

Markdown Accessibility Checker is a browser extension for validating Markdown in GitHub text editors. It encourages writing accessible valid Markdown when creating issues, pull requests, discussions, and comments.

<img alt="Issue creation form on github.com with two lint errors visible. One is hovered over, showing a tooltip that says 'heading levels should only increment by one level at a time'" src="./assets/screenshot.png" width="1000" />

### Installation

Install from your browser's addons store:

- [Chrome or Edge](https://chrome.google.com/webstore/detail/accessibility-checker-for/hdonjoppcjfaojggdiliigclajklepdg)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/a11y-checker-github-md/)

Alternatively, you can install a specific version by downloading the corresponding `zip` file from the [Releases](https://github.com/iansan5653/github-markdown-a11y-extension/releases) page.

### Linting rules used

Under the hood, the extension is a wrapper around [Markdownlint](https://github.com/markdownlint/markdownlint), providing a web-compatible UI for viewing linting errors. The base set of rules comes from [markdownlint-github](https://github.com/github/markdownlint-github). In addition, a few more rules are enabled:

- `heading-increment`: Enforces well-structured headings without skipping levels
- `no-reversed-links`: Enforces valid link syntax (errors if you accidentally flip the square brackets and parentheses)
- `no-empty-links`: Ensures all links have some visible link text

For now, the set of linting rules is not configurable. In order to minimize friction and distractions, only a small subset of lint rules are enabled. The extension does not try to encourage any sort of style or formatting - it's only here to help you with accessibility and syntax.

> **Note**: Requests for new rules and changes to existing rules should be made in either the Markdownlint or Markdownlint-github repositories, not here.

### Development

To run the extension locally and automatically reload when making changes, follow these steps.

> **Note**: The version number is always `0.0.0` when working locally.

#### Preparation

1. Developing this extension requires [Node and npm](https://nodejs.org/en) to be installed on your machine
2. Remove any existing installations of the extension
3. Run `npm install` to install dependencies
4. Run `npm run build:watch` to compile the TypeScript code into JavaScript:
    ```text
    > npm run build:watch
    ...
    Accessibility_Checker_for_GitHub_Markdown (webpack 5.80.0) compiled with 1 warning in 41 ms
    ```
    Leave this running in the background as you make changes.

#### Testing in Chrome

The easiest way to test this extension locally in Chrome is to [install it unpacked](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked). When you make changes to the TypeScript code, you must press the "refresh" button on the extension card in chrome://extensions to see your changes.

#### Testing in Firefox

Firefox has a CLI that will automatically reload the extension on changes, making it slightly easier to develop using Firefox:

Run `npm run start:firefox` to use [`web-ext run`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-run) to run the extension in Firefox. By default this will create a new temporary test profile. If you want to use your profile, you can provide a profile to the CLI by passing the `--firefox-profile` argument like so: `npm run start:firefox -- --firefox-profile=my-profile`.

```text
> npm run start:firefox
...
Installed /.../markdownlint-browser as a temporary add-on
The extension will reload if any source file changes
Press R to reload (and Ctrl-C to quit)
```

#### Checking for Problems

To run the automated checks to look for potential issues in the code, run the combined `check` script. There are a few warnings that are known and unavoidable due to dependencies, but this script should not exit with an error code.

```text
> npm run check
...
Checking formatting...
All matched files use Prettier code style!
...
WARNING in ./node_modules/markdownlint/lib/markdownlint.js 16:74-81
  Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
   @ ./src/utilities/lint-markdown.ts 1:0-40 3:40-57
   @ ./src/components/linted-markdown-editor.ts 7:0-58 120:19-31
   @ ./src/content-script.ts 5:0-75 16:27-47

  Accessibility_Checker_for_GitHub_Markdown (webpack 5.80.0) compiled with 1 warning in 517 ms
...
WARNINGS:

DANGEROUS_EVAL ...
UNSAFE_VAR_ASSIGNMENT ...
DANGEROUS_EVAL ...
```

#### Build Instructions

Follow these instructions to build this extension from source, creating an installable and shareable `zip` file:

1. Building this extension requires [Node and npm](https://nodejs.org/en) to be installed on your machine
2. Run `npm install` to install dependencies
3. Run `npm run package` to package the built code into `./web-ext-artifacts/accessibility_checker_for_github_markdown-0.0.0.zip`

#### Release process

Releases are automatically handled by [an Actions job](https://github.com/iansan5653/github-markdown-a11y-extension/actions/workflows/release.yml) after a new GitHub [Release](https://github.com/iansan5653/github-markdown-a11y-extension/releases) is published.

> **Warning**: Release tag names **must** follow the `0.0.0` version number format (with no leading `v`).

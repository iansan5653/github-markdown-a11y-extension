// @ts-check

"use strict";

import markdownlint from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";
import {getCharacterCoordinates} from "./character-coordinates";
import {observeSelector} from "./observe";

/** @param {string} markdown */
const lintString = (markdown) => 
  markdownlint.sync({
    strings: {
      content: markdown,
    },
    config: markdownlintGitHub.init({default: false}),
    handleRuleFailures: true,
    customRules: markdownlintGitHub,
  }).content

/**
 * @param {HTMLTextAreaElement} editor
 * @param {HTMLElement} portal
 */
const lintEditor = (editor, portal) => {
  const markdown = editor.value
  const errors = lintString(markdown)

  portal.replaceChildren()

  const lines = markdown.split('\n')
  for (const {lineNumber, errorRange} of errors) {
    const [line, ...prevLines] = lines.slice(0, lineNumber).reverse()
    const prevLineChars = prevLines.reduce((t, l) => t + l.length + 1 /* add one for newline char */, 0)
    const lineStart = errorRange?.[0] ?? 0
    const startIndex = prevLineChars + (errorRange?.[0] ?? 1) - 1
    const startCoords = getCharacterCoordinates(editor, startIndex)
    
    let endIndex = startIndex + (errorRange?.[1] ?? (line.length - lineStart + 1)) - 1
    let endCoords = getCharacterCoordinates(editor, endIndex)
    while (endCoords.height > startCoords.height) {
      endCoords = getCharacterCoordinates(editor, --endIndex)
    }

    const annotation = document.createElement('span')
    annotation.style.position = 'absolute'
    annotation.style.top = `${startCoords.top - 2}px`
    annotation.style.left = `${startCoords.left}px`
    annotation.style.width = `${endCoords.left - startCoords.left}px`
    annotation.style.backgroundColor = 'var(--color-danger-emphasis)'
    annotation.style.opacity = '0.2'
    annotation.style.height = `${startCoords.height}px`
    annotation.style.pointerEvents = 'none'
    portal.appendChild(annotation)
  }
}

const markdownEditorsSelector = 'textarea.js-paste-markdown, textarea.CommentBox-input'

observeSelector(markdownEditorsSelector, editor => {
  const editorRect = editor.getBoundingClientRect()
  // ignore hidden inputs
  if (editorRect.height < 5 || editorRect.width < 5) return () => {}

  const portal = document.createElement('div')
  document.body.appendChild(portal)

  const refreshLint = () => lintEditor(/** @type {HTMLTextAreaElement} */(editor), portal)
  
  refreshLint()

  document.addEventListener('input', refreshLint)

  const resizeObserver = new ResizeObserver(refreshLint)
  resizeObserver.observe(editor)

  return () => {
    document.removeEventListener('input', refreshLint)
    document.body.removeChild(portal)
    resizeObserver.disconnect()
  }
})


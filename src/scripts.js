// @ts-check

"use strict";

import markdownlint from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";
import {getCharacterCoordinates} from "./character-coordinates";

/** @param {string} markdown */
const lint = (markdown) => 
  markdownlint.sync({
    strings: {
      content: markdown,
    },
    config: markdownlintGitHub.init({default: false}),
    handleRuleFailures: true,
    customRules: markdownlintGitHub,
  }).content


const textarea = /** @type {HTMLTextAreaElement} */ (document.getElementById('demo-target'))
const portal = document.getElementById('portal')

textarea?.addEventListener('input', () => {
  if (!portal || !textarea) throw new Error("missing textarea or portal target element")

  const markdown = textarea.value
  const errors = lint(markdown)

  for (const annotation of portal.children) portal.removeChild(annotation)

  const lines = markdown.split('\n')
  for (const {lineNumber, errorRange, ruleDescription} of errors) {
    const [line, ...prevLines] = lines.slice(0, lineNumber).reverse()
    const prevLineChars = prevLines.reduce((t, l) => t + l.length + 1 /* add one for newline char */, 0)
    const lineStart = errorRange?.[0] ?? 0
    const startIndex = prevLineChars + (errorRange?.[0] ?? 0)
    const startCoords = getCharacterCoordinates(textarea, startIndex)
    
    let endIndex = startIndex + (errorRange?.[1] ?? (line.length - lineStart)) 
    let endCoords = getCharacterCoordinates(textarea, endIndex)
    while (endCoords.height > startCoords.height) {
      endCoords = getCharacterCoordinates(textarea, --endIndex)
    }

    console.log(startIndex, endIndex, markdown.slice(startIndex, endIndex + 1))

    const annotation = document.createElement('span')
    annotation.style.position = 'absolute'
    annotation.style.top = `${startCoords.top}px`
    annotation.style.left = `${startCoords.left}px`
    annotation.style.width = `${endCoords.left - startCoords.left}px`
    annotation.style.borderBottom = '2px dashed red'
    annotation.style.height = `${startCoords.height}px`
    annotation.style.pointerEvents = 'none'
    portal.appendChild(annotation)
  }
})

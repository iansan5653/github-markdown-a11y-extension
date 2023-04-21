// @ts-check

"use strict";

import markdownlint from "markdownlint";
import markdownlintGitHub from "@github/markdownlint-github";
import {getCharacterCoordinates} from "./character-coordinates";
import {observeSelector} from "./observe";
import {LintErrorTooltip} from "./tooltip";

const rootPortal = document.createElement('div')
document.body.appendChild(rootPortal)

/** @param {string} markdown */
const lintString = (markdown) => 
  markdownlint.sync({
    strings: {
      content: markdown,
    },
    config: markdownlintGitHub.init({default: false, 'heading-increment': true, 'no-reversed-links': true, 'no-empty-links': true}),
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

  console.log(errors)

  portal.replaceChildren()

  const lines = markdown.split('\n')
  for (const error of errors) {
    const [line, ...prevLines] = lines.slice(0, error.lineNumber).reverse()
    const prevLineChars = prevLines.reduce((t, l) => t + l.length + 1 /* add one for newline char */, 0)
    const lineStart = error.errorRange?.[0] ?? 0
    const startIndex = prevLineChars + (error.errorRange?.[0] ?? 1) - 1
    const startCoords = getCharacterCoordinates(editor, startIndex)
    
    let endIndex = startIndex + (error.errorRange?.[1] ?? (line.length - lineStart + 1)) - 1
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

    annotation.dataset.errorName = error.ruleNames?.join(': ') ?? "";
    annotation.dataset.errorDescription = error.ruleDescription ?? "";
    annotation.dataset.errorDetails = error.errorDetail ?? "";
    annotation.dataset.startIndex = startIndex.toString()
    annotation.dataset.endIndex = endIndex.toString()

    portal.appendChild(annotation)
  }
}

const markdownEditorsSelector = 'textarea.js-paste-markdown, textarea.CommentBox-input'
let idCounter = 1

observeSelector(markdownEditorsSelector, editor => {
  const editorRect = editor.getBoundingClientRect()
  // ignore hidden inputs
  if (editorRect.height < 5 || editorRect.width < 5) return () => {}

  editor.dataset.markdownLintingId = (++idCounter).toString()

  editor.addEventListener('blur', () => {
    tooltip.hide()
    currentTooltipAnnotation = null
  })

  const portal = document.createElement('div')
  portal.dataset.markdownLintingPortalId = editor.dataset.markdownLintingId
  rootPortal.appendChild(portal)

  const refreshLint = () => lintEditor(/** @type {HTMLTextAreaElement} */(editor), portal)
  
  refreshLint()

  document.addEventListener('input', refreshLint)

  const resizeObserver = new ResizeObserver(refreshLint)
  resizeObserver.observe(editor)

  return () => {
    document.removeEventListener('input', refreshLint)
    rootPortal.removeChild(portal)
    resizeObserver.disconnect()
  }
})

const tooltip = new LintErrorTooltip()
let currentTooltipAnnotation = null

document.addEventListener('mousemove', event => {
  // can't use mouse events on annotations (the easy way) because they have pointer-events: none

  const x = event.clientX
  const y = event.clientY

  for (const editorPortal of rootPortal.children)
    for (const annotation of editorPortal.children) {
      const rect = annotation.getBoundingClientRect()
      if (x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height) {
        if (currentTooltipAnnotation !== annotation) {
          tooltip.show(annotation.dataset.errorName, annotation.dataset.errorDescription, annotation.dataset.errorDetails, {top: rect.top + rect.height, left: rect.left})
          currentTooltipAnnotation = annotation
        }
        return
      }
    }

  tooltip.hide()
  currentTooltipAnnotation = null
})

document.addEventListener('selectionchange', () => {
  const focusedElement = document.activeElement
  if (focusedElement instanceof HTMLTextAreaElement && focusedElement.dataset.markdownLintingId) {
    if (focusedElement.selectionEnd !== focusedElement.selectionStart) return
    const caretIndex = focusedElement.selectionStart

    const portal = document.querySelector(`[data-markdown-linting-portal-id="${focusedElement.dataset.markdownLintingId}"]`)
    if (!portal) return

    for (const annotation of portal.children)
      if (parseInt(annotation.dataset.startIndex) <= caretIndex && parseInt(annotation.dataset.endIndex) >= caretIndex) {
        const rect = annotation.getBoundingClientRect()
        tooltip.show(annotation.dataset.errorName, annotation.dataset.errorDescription, annotation.dataset.errorDetails, {top: rect.top + rect.height, left: rect.left})
        currentTooltipAnnotation = annotation
        return
      }
  }

  tooltip.hide()
  currentTooltipAnnotation = null
})


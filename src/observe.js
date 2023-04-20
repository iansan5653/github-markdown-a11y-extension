/**
 * Watch the document DOM for the selector.
 * @param {string} selector
 * @param {(element: HTMLElement) => () => void} onAdd
 */
export function observeSelector(selector, onAdd) {
  const parent = document.body

  let removeHandlers = new Map()
   
  for (const element of parent.querySelectorAll(selector)) removeHandlers.set(element, onAdd(element))

  console.log(removeHandlers)

  const observer = new MutationObserver(() => {
    const found = new Set()
    for (const element of parent.querySelectorAll(selector)) {
      found.add(element)

      if (!removeHandlers.has(element)) removeHandlers.set(element, onAdd(element))
    }

    for (const [element, onRemove] of removeHandlers.entries()) if (!found.has(element)) {
      onRemove()
      removeHandlers.delete(element)
    }
  })

  observer.observe(parent, {
    childList: true,
    subtree: true
  })
}
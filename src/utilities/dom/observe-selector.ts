/**
 * Watch the document DOM for the selector.
 */
export function observeSelector(
  selector: string,
  onAdd: (element: HTMLElement) => () => void
) {
  const removeHandlers = new Map<HTMLElement, () => void>();

  for (const element of document.querySelectorAll(selector))
    if (element instanceof HTMLElement)
      removeHandlers.set(element, onAdd(element));

  const observer = new MutationObserver(() => {
    const found = new Set<HTMLElement>();

    // handle new elements
    for (const element of document.querySelectorAll(selector))
      if (element instanceof HTMLElement) {
        found.add(element);

        if (!removeHandlers.has(element))
          removeHandlers.set(element, onAdd(element));
      }

    // handle removed elements
    for (const [element, onRemove] of removeHandlers.entries())
      if (!found.has(element)) {
        onRemove();
        removeHandlers.delete(element);
      }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

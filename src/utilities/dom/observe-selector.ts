/**
 * Watch the document DOM for the selector.
 */
export function observeSelector(
  selector: string,
  onAdd: (element: HTMLElement) => () => void
) {
  const parent = document.body;

  let removeHandlers = new Map();

  for (const element of parent.querySelectorAll(selector))
    if (element instanceof HTMLElement)
      removeHandlers.set(element, onAdd(element));

  const observer = new MutationObserver(() => {
    const found = new Set();
    for (const element of parent.querySelectorAll(selector))
      if (element instanceof HTMLElement) {
        found.add(element);

        if (!removeHandlers.has(element))
          removeHandlers.set(element, onAdd(element));
      }

    for (const [element, onRemove] of removeHandlers.entries())
      if (!found.has(element)) {
        onRemove();
        removeHandlers.delete(element);
      }
  });

  observer.observe(parent, {
    childList: true,
    subtree: true,
  });
}

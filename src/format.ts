export const formatList = (items: string[], conjunction: string) => {
  if (items.length > 2) {
    items.push(`${conjunction} ${items.pop()}`);
    return items.join(", ");
  } else if (items.length === 2) {
    const last = items.pop();
    const secondLast = items.pop();
    return [secondLast, conjunction, last].join(" ");
  } else {
    return items[0];
  }
};

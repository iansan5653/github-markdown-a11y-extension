import {Vector} from "../geometry/vector.js";

export const getWindowScrollVector = () =>
  new Vector(window.scrollX, window.scrollY);

export const isHighContrastMode = () => {
  const documentColorMode = document.documentElement.dataset.colorMode;
  const resolvedColorMode =
    documentColorMode === "auto"
      ? window.matchMedia("prefers-color-scheme: dark").matches
        ? "dark"
        : "light"
      : documentColorMode;
  const resolvedColorScheme =
    resolvedColorMode === "dark"
      ? document.documentElement.dataset.darkTheme
      : document.documentElement.dataset.lightTheme;

  return (
    (window.matchMedia("(forced-colors: active)").matches ||
      resolvedColorScheme?.includes("high_contrast")) ??
    false
  );
};

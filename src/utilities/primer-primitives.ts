export const colors = {
  background: "var(--bgColor-default, var(--color-canvas-default))",
  border: "var(--borderColor-default, var(--color-border-default))",
  muted: {
    fg: "var(--fgColor-muted, var(--color-fg-muted))",
  },
  danger: {
    fg: "var(--fgColor-danger, var(--color-danger-fg))",
    emphasis:
      "var(--borderColor-danger-emphasis, var(--color-danger-emphasis))",
  },
} as const;

export const shadows = {
  medium: "var(--shadow-resting-medium, var(--color-shadow-medium))",
} as const;

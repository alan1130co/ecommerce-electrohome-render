export const THEME_COOKIE = "eh-theme";

export type Theme = "light" | "dark";

export function isValidTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}

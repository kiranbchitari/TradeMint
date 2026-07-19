/**
 * User-selectable accent themes. Independent of light/dark (which next-themes
 * owns via the `.dark` class) — the accent is stored in localStorage and
 * applied as a `data-accent` attribute on <html>, so the two compose. The
 * matching CSS token overrides live in globals.css.
 */
export const ACCENT_STORAGE_KEY = "trademint-accent";

export const DEFAULT_ACCENT = "indigo";

export const ACCENTS = [
  { value: "indigo", label: "Indigo", swatch: "oklch(0.52 0.23 277)" },
  { value: "violet", label: "Violet", swatch: "oklch(0.52 0.2 305)" },
  { value: "blue", label: "Blue", swatch: "oklch(0.52 0.17 255)" },
  { value: "teal", label: "Teal", swatch: "oklch(0.52 0.12 195)" },
  { value: "emerald", label: "Emerald", swatch: "oklch(0.52 0.15 155)" },
  { value: "rose", label: "Rose", swatch: "oklch(0.52 0.2 18)" },
] as const;

export type AccentValue = (typeof ACCENTS)[number]["value"];

/**
 * Blocking script injected before paint so the saved accent is applied without
 * a flash of the default. Kept tiny and dependency-free.
 */
export const accentInitScript = `(function(){try{var a=localStorage.getItem('${ACCENT_STORAGE_KEY}');if(a)document.documentElement.setAttribute('data-accent',a);}catch(e){}})();`;

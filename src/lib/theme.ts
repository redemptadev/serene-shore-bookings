export const THEMES = [
  { id: "ocean-blue", label: "Ocean Blue", swatches: ["#0f4c66", "#2fb6c4", "#f3e6cd"] },
  { id: "tropical-sand", label: "Tropical Sand", swatches: ["#1f6f7a", "#e0b878", "#f8f1e2"] },
  { id: "sunset-coast", label: "Sunset Coast", swatches: ["#8e2f21", "#e98f4a", "#fdf1e6"] },
  { id: "deep-sea", label: "Deep Sea", swatches: ["#0b1c33", "#39c4c9", "#0f2a44"] },
  { id: "minimal-coastal", label: "Minimal Coastal", swatches: ["#2b3440", "#8fc4d4", "#ffffff"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

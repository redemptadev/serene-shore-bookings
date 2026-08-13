import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { isThemeId } from "@/lib/theme";

/** Applies the host-selected theme from admin settings to the document root. */
export function ThemeSync() {
  const { data: settings } = useSettings();
  const theme = settings?.theme;

  useEffect(() => {
    if (theme && isThemeId(theme)) document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}
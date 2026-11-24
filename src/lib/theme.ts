/**
 * Theme and welcome-animation state that must be applied before first paint.
 *
 * The server always renders the dark theme (`<html class="dark">`). The script
 * below runs in <head> before the body paints: it switches to light when the
 * owner chose light, and marks the welcome animation as already seen for this
 * browser session. Keeping this out of server rendering lets every page keep
 * its static shell.
 */

export type Theme = "dark" | "light";

/** localStorage key holding the owner's explicit theme choice. */
export const THEME_STORAGE_KEY = "nexo-theme";

/** sessionStorage key set once the welcome animation has played. */
export const WELCOME_SEEN_KEY = "nexo-welcome-seen";

/** Dark unless the owner explicitly chose light. */
export function resolveTheme(stored: string | null): Theme {
  return stored === "light" ? "light" : "dark";
}

export function otherTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export const BEFORE_PAINT_SCRIPT = `(function(){try{var d=document.documentElement;if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="light")d.classList.remove("dark");if(sessionStorage.getItem(${JSON.stringify(WELCOME_SEEN_KEY)}))d.setAttribute("data-welcome-seen","");}catch(e){}})();`;

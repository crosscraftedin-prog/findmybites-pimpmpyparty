"use client";

import * as React from "react";

/**
 * Detects when the mobile keyboard is open using the Visual Viewport API.
 *
 * When the keyboard opens on mobile, `window.visualViewport.height` shrinks
 * below `window.innerHeight`. We use this to move floating elements (AI
 * buttons, sticky footers) above the keyboard so they don't cover inputs.
 *
 * Returns `true` when the keyboard is likely open.
 */
export function useKeyboardOpen(): boolean {
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const check = () => {
      // Keyboard is likely open if visual viewport is significantly smaller
      // than the layout viewport AND the viewport is not just scrolled.
      const heightDiff = window.innerHeight - vv.height;
      setKeyboardOpen(heightDiff > 150);
    };

    check();
    vv.addEventListener("resize", check);
    vv.addEventListener("scroll", check);
    return () => {
      vv.removeEventListener("resize", check);
      vv.removeEventListener("scroll", check);
    };
  }, []);

  return keyboardOpen;
}

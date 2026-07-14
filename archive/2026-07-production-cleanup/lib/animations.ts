/**
 * Archived on 2026-07-14
 * Reason:
 * No verified runtime references found.
 * Preserved for future features.
 *
 * DO NOT IMPORT FROM THIS DIRECTORY.
 */

/**
 * Lightweight CSS-based animation utilities.
 * Replaces framer-motion for simple animations (fade, slide, scale).
 * Zero JavaScript — uses CSS transitions and animations.
 */

export function fadeInUp(delay: number = 0): React.CSSProperties {
  return {
    animation: `fadeInUp 0.5s ease-out ${delay}s forwards`,
    opacity: 0,
  };
}

export function fadeIn(delay: number = 0): React.CSSProperties {
  return {
    animation: `fadeIn 0.4s ease-out ${delay}s forwards`,
    opacity: 0,
  };
}

export function scaleIn(delay: number = 0): React.CSSProperties {
  return {
    animation: `scaleIn 0.3s ease-out ${delay}s forwards`,
    opacity: 0,
  };
}

// CSS keyframes to inject (add to globals.css)
export const animationKeyframes = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
`;

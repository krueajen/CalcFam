/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#20332D',
    tint: '#285C4D',

    // Core surfaces
    background: '#F5F0E7',
    foreground: '#20332D',

    // Cards / elevated surfaces
    card: '#FFFCF6',
    cardForeground: '#20332D',

    // Primary action color (buttons, links, active states)
    primary: '#285C4D',
    primaryForeground: '#FFFDF7',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EAE3D7',
    secondaryForeground: '#34473F',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEE8DE',
    mutedForeground: '#766F64',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E8C887',
    accentForeground: '#26372F',

    // Destructive actions (delete, error states)
    destructive: '#B64A3D',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#DDD3C3',
    input: '#D8CFBF',
  },

  dark: {
    text: '#F1EDE3',
    tint: '#B5D3BD',
    background: '#17221D',
    foreground: '#F1EDE3',
    card: '#202E27',
    cardForeground: '#F1EDE3',
    primary: '#A8CBB0',
    primaryForeground: '#17221D',
    secondary: '#2B3932',
    secondaryForeground: '#E9E5DA',
    muted: '#28362F',
    mutedForeground: '#B5B4A9',
    accent: '#D3B16D',
    accentForeground: '#17221D',
    destructive: '#F08C7E',
    destructiveForeground: '#241714',
    border: '#3C4A41',
    input: '#46534A',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;

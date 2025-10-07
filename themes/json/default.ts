import type { JsonTheme } from './types';

const defaultJsonTheme: JsonTheme = {
  "name": "My Custom Theme",
  "board": {
    "backgroundColor": "#166534",
    "textColor": "#ffffff"
  },
  "cardBack": {
    "backgroundColor": "#2563eb",
    "borderColor": "#1d4ed8",
    "patternColor": "#ffffff"
  },
  "card": {
    "backgroundColor": "#ffffff",
    "cornerRadius": "0.5rem",
    "shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "redColor": "#ef4444",
    "blackColor": "#000000",
    "fontFamily": "sans-serif",
    "rankFontSize": "1.25rem",

    // New Defaults
    "borderColor": "#808080",
    "borderWidth": "1px",
    "borderStyle": "solid",
    "pipsLayout": "single",
    "pipsSize": "40%",
    "pipsGridScale": "0.8",
    "standardPipSize": "1.2rem",
    "showTopCorner": true,
    "showBottomCorner": true,
    "cornerLayout": "horizontal",
    "cornerSuitSize": "1.25rem",
    "cornerPadding": "0.25rem"
  }
};

export default defaultJsonTheme;
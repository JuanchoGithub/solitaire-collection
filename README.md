# Vibe-Solitaire

Vibe-Solitaire is a modern, feature-rich solitaire collection built with React and TypeScript. It features a highly modular architecture, a powerful data-driven theming engine, and a polished user experience with fluid animations and a clean, responsive interface. It's designed not just as a game, but as a robust framework for creating card games.

## ✨ Features

*   **Multiple Game Modes**: Classic Klondike, challenging Spider, and strategic Freecell are all included.
*   **Advanced Theming Engine**:
    *   Switch between multiple beautiful, pre-built themes.
    *   **Live Theme Creator**: A powerful in-app editor to create, preview, and save your own custom themes by manipulating a JSON structure. Customize everything from colors and fonts to card borders, pip layouts, and even custom SVG art for face cards and card backs.
    *   **Export/Import**: Export your custom themes as JSON files to share or back them up.
*   **Responsive & Mobile-Friendly**: A fluid layout that seamlessly adapts to both landscape (desktop) and portrait (mobile) orientations.
*   **Polished UI/UX**:
    *   Smooth, physics-based card animations for dealing, moving, and auto-play.
    *   Intuitive drag-and-drop and click-to-move controls.
    *   Helpful features like Undo, Hints, and Auto-play for obvious moves.
    *   Winnable Klondike deals to guarantee a solvable game.
*   **Helpful In-Game Assistance**: Each game includes a beautiful, easy-to-understand "How to Play" modal with custom diagrams.

## 🎮 Games Included

*   **Klondike**: The timeless classic. Supports both 1-card and 3-card draw modes, plus a guaranteed "winnable" deal option.
*   **Spider**: Test your mettle with 1, 2, or 4 suit variations, ranging from easy to expert difficulty.
*   **Freecell**: A game of pure skill where all cards are visible. Plan your moves carefully using the four free cells.

## 🛠️ Technical Stack

*   **Framework**: [React](https://reactjs.org/) 18
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via CDN)
*   **State Management**: React Hooks (State, Context, Refs)

## 🏛️ Architecture & Core Concepts

The project is built around a few key architectural principles to ensure it is scalable, maintainable, and flexible.

### 1. Logic-View Separation via Hooks

The core logic for each solitaire variant is completely decoupled from its presentation.

*   **Game Hooks (`useKlondike`, `useSpider`, `useFreecell`)**: These custom hooks are the "brains" of each game. They encapsulate all game state (piles, stock, history), rules, and actions (moving cards, dealing, undo, hints). They are pure logic and do not contain any JSX.
*   **Game Board Components (`GameBoard`, `SpiderGameBoard`, etc.)**: These are the "view" layer. They take a `controller` (the output of a game hook) and are responsible for rendering the game state. They handle the layout of piles and rendering of animated elements, but delegate all game logic back to the controller.

This separation makes it easy to test game logic independently of the UI and allows for different UIs to be built on top of the same game engine.

### 2. The Data-Driven Theme Engine

Theming is a first-class citizen in this application.

*   **Theme Interface**: A consistent `Theme` interface (`{ Board, Card, CardBack }`) is defined, ensuring any theme can be swapped in at runtime.
*   **Component-Based Themes**: Pre-built themes like `Gemini`, `Fully`, and `Classic` are implemented as sets of React components, allowing for unique art and animations (e.g., the custom SVG face cards in the "Fully" theme).
*   **JSON-Powered Themes**: The most powerful feature is the JSON-driven theme system.
    *   `JsonCard.tsx` and `JsonBoard.tsx` are special components designed to be styled entirely by a `JsonTheme` object passed in as props.
    *   `loader.ts` contains a factory function that takes a JSON object and dynamically creates a `Theme` object compatible with the rest of the app.
    *   This architecture is what powers the **Live Theme Creator**, allowing for real-time visual updates as the user modifies the JSON data.

### 3. Reusable Hooks & Components

Common logic and UI are abstracted into reusable pieces.

*   **`useCardDrag` Hook**: A generic and highly configurable hook that powers all card interactions. It handles drag state, click-vs-drag detection, calculating valid draggable stacks, finding drop targets, and animating cards returning to their original position.
*   **`useResponsiveLayout` Hook**: A simple hook that detects the viewport and device type to switch between `landscape` and `portrait` modes, allowing components to adapt their layout.
*   **UI Components**: Modals, buttons, headers, and footers are built as reusable components with consistent styling and accessibility in mind.

## 📁 Project Structure

```
/
├── components/          # Reusable UI components (Modals, Game Boards, etc.)
│   └── ThemeCreator/    # Components for the live theme editor
├── games/               # Core game logic and components
│   ├── klondike/        # Klondike specific files (hook, component, types)
│   ├── spider/          # Spider specific files
│   └── freecell/        # Freecell specific files
├── hooks/               # Reusable custom hooks (useCardDrag)
├── themes/              # Theming engine and pre-built themes
│   ├── classic/
│   ├── fully/
│   ├── gemini25/
│   └── json/            # Engine for data-driven themes
├── App.tsx              # Main application component, router, and state manager
├── index.tsx            # React root entry point
├── constants.ts         # Game constants (suits, ranks, etc.)
├── types.ts             # Global TypeScript types
└── index.html           # Main HTML file
```

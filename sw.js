const CACHE_NAME = 'vibe-solitaire-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/constants.ts',
  '/types.ts',
  '/metadata.json',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/components/EmptyPile.tsx',
  '/components/WinModal.tsx',
  '/components/RulesModal.tsx',
  '/components/PauseModal.tsx',
  '/components/GameBoard.tsx',
  '/components/SpiderGameBoard.tsx',
  '/components/FreecellGameBoard.tsx',
  '/components/GameSelectionModal.tsx',
  '/components/SettingsModal.tsx',
  '/components/GameHeader.tsx',
  '/components/GameFooter.tsx',
  '/components/GameLogModal.tsx',
  '/components/ThemeCreator/controls.tsx',
  '/components/ThemeCreator/ThemeControlPanel.tsx',
  '/components/ThemeCreator/ThemePreview.tsx',
  '/components/ThemeCreator/ThemeCreatorModal.tsx',
  '/components/ThemeCreator/IconPicker.tsx',
  '/games/klondike/types.ts',
  '/games/klondike/Klondike.tsx',
  '/games/klondike/useKlondike.ts',
  '/games/klondike/utils.ts',
  '/games/spider/types.ts',
  '/games/spider/Spider.tsx',
  '/games/spider/useSpider.ts',
  '/games/freecell/types.ts',
  '/games/freecell/Freecell.tsx',
  '/games/freecell/useFreecell.ts',
  '/games/freecell/utils.ts',
  '/hooks/useCardDrag.ts',
  '/themes/index.ts',
  '/themes/gemini25/index.ts',
  '/themes/gemini25/GeminiBoard.tsx',
  '/themes/gemini25/GeminiCard.tsx',
  '/themes/gemini25/GeminiCardBack.tsx',
  '/themes/fully/index.ts',
  '/themes/fully/FullyBoard.tsx',
  '/themes/fully/FullyCardBack.tsx',
  '/themes/fully/CardArt.tsx',
  '/themes/fully/FullyCard.tsx',
  '/themes/classic/index.ts',
  '/themes/classic/ClassicBoard.tsx',
  '/themes/classic/ClassicCard.tsx',
  '/themes/classic/ClassicCardBack.tsx',
  '/themes/json/default.json',
  '/themes/json/types.ts',
  '/themes/json/loader.ts',
  '/themes/json/JsonBoard.tsx',
  '/themes/json/JsonCardBack.tsx',
  '/themes/json/JsonCard.tsx',
  '/themes/json/default.ts'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
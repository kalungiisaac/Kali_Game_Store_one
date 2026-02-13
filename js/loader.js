// loader.js - Optimized for performance
const MIN_DISPLAY = 400; // ms - ultra-fast loading screen
const start = performance.now?.() ?? Date.now();

window.addEventListener('load', () => {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  const elapsed = (performance.now?.() ?? Date.now()) - start;
  const remaining = Math.max(0, MIN_DISPLAY - elapsed);

  setTimeout(() => {
    screen.classList.add('fade-out');
    const handler = () => screen.parentNode && screen.remove();
    screen.addEventListener('transitionend', handler, { once: true });
    setTimeout(handler, 250); // Fallback - matches 0.2s transition
  }, remaining);

  // Load decorative animations after page is ready
  setTimeout(() => {
    document.documentElement.classList.add('animations-enabled');
  }, 600);
});

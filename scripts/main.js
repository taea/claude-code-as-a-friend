// エントリポイント。
// fetch → parse → applyTheme → renderDeck → initNav → setupScaleFit。

import { parseMarkdown } from './parser.js';
import { applyTheme } from './theme.js';
import { renderDeck } from './renderer.js';
import { initNav } from './nav.js';

const deckEl = document.getElementById('deck');
const indicatorEl = document.getElementById('page-indicator');
const loadingEl = document.getElementById('loading');

async function main() {
  try {
    const res = await fetch('index.md', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to fetch index.md: ${res.status} ${res.statusText}`);
    const text = await res.text();

    const { frontmatter, slides } = parseMarkdown(text);

    applyTheme(frontmatter);
    renderDeck(deckEl, slides, frontmatter);
    initNav(deckEl, indicatorEl);
    setupScaleFit(deckEl);

    document.body.classList.add('ready');
    console.log(`[slides] Loaded ${slides.length} slides.`);
  } catch (err) {
    console.error('[slides] Failed to initialize:', err);
    if (loadingEl) {
      loadingEl.textContent = `エラー: ${err.message}`;
      loadingEl.style.opacity = '0.9';
    }
  }
}

function setupScaleFit(deck) {
  const styles = getComputedStyle(document.documentElement);
  const baseW = parseFloat(styles.getPropertyValue('--base-width')) || 1280;
  const baseH = parseFloat(styles.getPropertyValue('--base-height')) || 720;

  const fit = () => {
    const scale = Math.min(window.innerWidth / baseW, window.innerHeight / baseH);
    deck.style.transform = `scale(${scale})`;
  };
  fit();
  window.addEventListener('resize', fit);
  // Safari の入力フォーム表示などでリサイズしないケースに備えて orientation 変化も拾う
  window.addEventListener('orientationchange', fit);
}

main();

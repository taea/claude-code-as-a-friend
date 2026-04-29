// ナビゲーション：キー操作・画面端クリック・URLハッシュ同期・ページ番号表示

export function initNav(deckEl, indicatorEl) {
  const slides = Array.from(deckEl.querySelectorAll('.slide'));
  if (slides.length === 0) return null;

  let current = readHashIndex(slides.length);

  function activate(i) {
    for (let k = 0; k < slides.length; k++) {
      slides[k].classList.toggle('active', k === i);
    }
    const layout = slides[i].dataset.layout;
    if (indicatorEl) {
      const hideOn = new Set(['cover', 'cover-all', 'end']);
      indicatorEl.hidden = hideOn.has(layout);
      indicatorEl.textContent = `${i + 1} / ${slides.length}`;
      indicatorEl.classList.toggle('invert', layout === 'cover-all');
    }
    // ナビキャレットの表示制御に使うデータ属性
    document.body.dataset.activeLayout = layout || 'default';
    document.body.dataset.navAtStart = i === 0 ? 'true' : 'false';
    document.body.dataset.navAtEnd = i === slides.length - 1 ? 'true' : 'false';
  }

  function show(i) {
    const next = clamp(i, 0, slides.length - 1);
    current = next;
    activate(next);
    writeHashIndex(next);
  }

  const next = () => show(current + 1);
  const prev = () => show(current - 1);
  const first = () => show(0);
  const last = () => show(slides.length - 1);

  // ---- キー操作 ----
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault(); next(); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home':
        e.preventDefault(); first(); break;
      case 'End':
        e.preventDefault(); last(); break;
    }
  });

  // ---- キャレットボタン ----
  document.getElementById('nav-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    prev();
  });
  document.getElementById('nav-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    next();
  });

  // ---- 画面端クリック ----
  document.addEventListener('click', (e) => {
    // インタラクティブ要素・テキスト選択中は無視
    if (e.target.closest('a, button, input, textarea, select, label')) return;
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;

    const x = e.clientX;
    const w = window.innerWidth;
    if (x < w * 0.3) {
      prev();
    } else if (x > w * 0.7) {
      next();
    }
    // 中央 40% は無視
  });

  // ---- ハッシュ変化 ----
  window.addEventListener('hashchange', () => {
    const i = readHashIndex(slides.length);
    if (i !== current) show(i);
  });

  // ---- 初期表示 ----
  activate(current);
  writeHashIndex(current);

  return { show, next, prev, first, last };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function readHashIndex(total) {
  const m = location.hash.match(/^#(\d+)$/);
  if (!m) return 0;
  const i = parseInt(m[1], 10) - 1;
  if (Number.isNaN(i)) return 0;
  return clamp(i, 0, total - 1);
}

function writeHashIndex(i) {
  const target = `#${i + 1}`;
  if (location.hash !== target) {
    history.replaceState(null, '', target);
  }
}

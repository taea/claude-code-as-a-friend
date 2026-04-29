// スライドJSON → DOM。各レイアウトの構造を組み立てる。

import { marked } from 'https://esm.sh/marked@12';

marked.use({
  gfm: true,
  breaks: false,
});

export function renderDeck(deckEl, slides, frontmatter) {
  deckEl.innerHTML = '';
  for (let i = 0; i < slides.length; i++) {
    const section = renderSlide(slides[i], frontmatter, i);
    section.dataset.index = String(i);
    deckEl.appendChild(section);
  }
  // 外部リンクは新規タブで開く（スライドが上書きされないように）
  for (const a of deckEl.querySelectorAll('a[href^="http"]')) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
}

function renderSlide(slide, frontmatter, index) {
  const layout = slide.layout || 'default';
  const section = document.createElement('section');
  section.className = `slide layout-${layout}`;
  section.dataset.layout = layout;
  section.dataset.headingLevel = String(slide.headingLevel || 0);

  switch (layout) {
    case 'cover':
      renderCover(section, slide, frontmatter);
      break;
    case 'cover-all':
      renderCoverAll(section, slide);
      break;
    case '2column':
      render2Column(section, slide);
      break;
    case 'end':
      renderEnd(section, slide);
      break;
    case 'default':
    default:
      renderDefault(section, slide);
      break;
  }
  return section;
}

// ---- Markdown → DocumentFragment -----------------------------------------
function mdToFragment(md) {
  const html = marked.parse(md || '');
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return tpl.content;
}

// Frontmatter の date が文字列でも Date オブジェクトでも YYYY-MM-DD に整える
function formatDate(value) {
  if (value == null) return '';
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value);
}

function buildHeading(slide) {
  if (!slide.heading) return null;
  const tag = slide.headingLevel === 2 ? 'h2' : 'h1';
  const h = document.createElement(tag);
  h.textContent = slide.heading;
  return h;
}

function appendChildren(target, fragment) {
  while (fragment.firstChild) {
    target.appendChild(fragment.firstChild);
  }
}

// 入れ子もケアしつつ、最初に見つけた img をフラグメントから取り除いて返す
function takeFirstImg(fragment) {
  const img = fragment.querySelector('img');
  if (!img) return null;
  // 画像のみを内容に持つ <p> も丸ごと取り除いて綺麗にする
  let node = img;
  while (
    node.parentNode &&
    node.parentNode !== fragment &&
    node.parentNode.children.length === 1 &&
    node.parentNode.tagName === 'P'
  ) {
    node = node.parentNode;
  }
  node.remove();
  return img;
}

function takeAllByTag(fragment, selector) {
  const list = Array.from(fragment.querySelectorAll(selector));
  for (const el of list) {
    let node = el;
    while (
      node.parentNode &&
      node.parentNode !== fragment &&
      node.parentNode.children.length === 1 &&
      node.parentNode.tagName === 'P'
    ) {
      node = node.parentNode;
    }
    node.remove();
  }
  return list;
}

// ---- default ------------------------------------------------------------
function renderDefault(section, slide) {
  const heading = buildHeading(slide);
  if (heading) section.appendChild(heading);
  const fragment = mdToFragment(slide.bodyMarkdown);
  const content = document.createElement('div');
  content.className = 'content';
  appendChildren(content, fragment);
  section.appendChild(content);
  // body が空（見出しだけ）のスライドは縦中央寄せの「セクション扉」表示にする
  if (!slide.bodyMarkdown || !slide.bodyMarkdown.trim()) {
    section.classList.add('section-divider');
  }
}

// ---- cover --------------------------------------------------------------
function renderCover(section, slide, frontmatter) {
  const fragment = mdToFragment(slide.bodyMarkdown);
  const decorImg = takeFirstImg(fragment);

  const inner = document.createElement('div');
  inner.className = 'cover-inner';

  if (decorImg) {
    const decor = document.createElement('div');
    decor.className = 'cover-decoration';
    decor.appendChild(decorImg);
    inner.appendChild(decor);
  }

  const title = document.createElement('h1');
  title.className = 'cover-title';
  title.textContent = frontmatter.title || slide.heading || '';
  inner.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'cover-meta';

  if (frontmatter.author) {
    const p = document.createElement('p');
    p.className = 'cover-author';
    p.textContent = frontmatter.author;
    meta.appendChild(p);
  }
  if (frontmatter.author_id) {
    const p = document.createElement('p');
    p.className = 'cover-author-id';
    p.textContent = frontmatter.author_id;
    meta.appendChild(p);
  }
  if (frontmatter.event) {
    const p = document.createElement('p');
    p.className = 'cover-event';
    const eventName = document.createElement('strong');
    eventName.textContent = frontmatter.event;
    p.appendChild(eventName);
    if (frontmatter.date) {
      p.appendChild(document.createTextNode(' '));
      const date = document.createElement('span');
      date.className = 'cover-date';
      date.textContent = formatDate(frontmatter.date);
      p.appendChild(date);
    }
    meta.appendChild(p);
  }
  if (frontmatter.venue) {
    const p = document.createElement('p');
    p.className = 'cover-venue';
    p.textContent = frontmatter.venue;
    meta.appendChild(p);
  }

  inner.appendChild(meta);
  section.appendChild(inner);
}

// ---- cover-all ----------------------------------------------------------
function renderCoverAll(section, slide) {
  const fragment = mdToFragment(slide.bodyMarkdown);
  const img = fragment.querySelector('img');
  if (img) {
    const bg = document.createElement('div');
    bg.className = 'cover-all-bg';
    bg.style.backgroundImage = `url("${img.getAttribute('src')}")`;
    section.appendChild(bg);
    img.remove();
  }

  // figcaption（class に "upper" or "lower"）
  const figs = fragment.querySelectorAll('figcaption');
  for (const fc of figs) {
    const className = (fc.getAttribute('class') || '').toLowerCase();
    const isLower = /lower/.test(className);
    const overlay = document.createElement('div');
    overlay.className = `cover-all-caption ${isLower ? 'lower' : 'upper'}`;
    overlay.textContent = fc.textContent;
    section.appendChild(overlay);
  }
}

// ---- 2column ------------------------------------------------------------
function render2Column(section, slide) {
  const fragment = mdToFragment(slide.bodyMarkdown);
  const topLevelH3s = topLevelChildrenOfTag(fragment, 'h3');
  const hasTwoH3 = topLevelH3s.length >= 2;
  const hasImg = !!fragment.querySelector('img');

  if (hasTwoH3) {
    section.classList.add('pattern-b');
    const heading = buildHeading(slide);
    if (heading) section.appendChild(heading);

    const segments = splitFragmentByElements(fragment, topLevelH3s);

    if (segments.intro && segments.intro.childNodes.length > 0) {
      const intro = document.createElement('div');
      intro.className = 'two-col-intro';
      intro.appendChild(segments.intro);
      section.appendChild(intro);
    }

    const cols = document.createElement('div');
    cols.className = 'two-col-columns';
    for (const seg of segments.parts) {
      const col = document.createElement('div');
      col.className = 'two-col-col';
      col.appendChild(seg);
      cols.appendChild(col);
    }
    section.appendChild(cols);
  } else if (hasImg) {
    section.classList.add('pattern-a');
    const left = document.createElement('div');
    left.className = 'two-col-left';
    const img = takeFirstImg(fragment);
    if (img) left.appendChild(img);
    section.appendChild(left);

    const right = document.createElement('div');
    right.className = 'two-col-right';
    const heading = buildHeading(slide);
    if (heading) right.appendChild(heading);
    const content = document.createElement('div');
    content.className = 'content';
    appendChildren(content, fragment);
    right.appendChild(content);
    section.appendChild(right);
  } else {
    // フォールバック：default 相当
    section.classList.add('pattern-fallback');
    const heading = buildHeading(slide);
    if (heading) section.appendChild(heading);
    const content = document.createElement('div');
    content.className = 'content';
    appendChildren(content, fragment);
    section.appendChild(content);
  }
}

function topLevelChildrenOfTag(fragment, tagLower) {
  const out = [];
  for (const node of fragment.children) {
    if (node.tagName && node.tagName.toLowerCase() === tagLower) {
      out.push(node);
    }
  }
  return out;
}

// 指定要素群（同一フラグメントの子要素）で fragment を分割。
// 戻り値: { intro: Fragment, parts: Fragment[] } — parts[i] は boundary[i] とそれ以降。
function splitFragmentByElements(fragment, boundaries) {
  const boundarySet = new Set(boundaries);
  const intro = document.createDocumentFragment();
  const parts = [];
  let current = intro;

  const childNodes = Array.from(fragment.childNodes);
  for (const node of childNodes) {
    if (boundarySet.has(node)) {
      const seg = document.createDocumentFragment();
      seg.appendChild(node);
      parts.push(seg);
      current = seg;
    } else {
      current.appendChild(node);
    }
  }
  return { intro, parts };
}

// ---- end ----------------------------------------------------------------
function renderEnd(section, slide) {
  const heading = buildHeading(slide);
  if (heading) {
    heading.classList.add('end-heading');
    section.appendChild(heading);
  }
  const fragment = mdToFragment(slide.bodyMarkdown);
  const img = takeFirstImg(fragment);
  if (img) {
    const wrap = document.createElement('div');
    wrap.className = 'end-image';
    wrap.appendChild(img);
    section.appendChild(wrap);
  }
}

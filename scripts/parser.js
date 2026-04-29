// Markdown → スライドJSON への変換。
// Frontmatter / スライド分割 / heading 抽出 / layout コメント抽出（typo許容）。

import yaml from 'https://esm.sh/js-yaml@4.1.0';

// ---- 正規表現群 ----------------------------------------------------------
const FENCE = /^\s*```/;
const H1_LINE = /^#\s+(.+?)\s*$/;
const H2_LINE = /^##\s+(.+?)\s*$/;
const SEP_LINE = /^\s*(---+|--)\s*$/; // `---` も `--` も区切りと見なす（タイポ許容）

// HTMLコメント `<!--` ... `-->` の中で `layout: xxx` を抽出。
// `<!-- layout: x -->`, `<!--- layout: x -->`, `<!--- layout: x --->` 全部OK。
// 行単位で拾う（インラインコード内などの `<!--- layout: x --->` 例示は無視）。
const LAYOUT_COMMENT = /^[ \t]*<!--[-\s]*layout\s*:\s*([\w-]+)[-\s]*-->[ \t]*$/im;

const LAYOUT_TYPO_MAP = {
  '2colmun': '2column',
  '2-column': '2column',
  'twocolumn': '2column',
};
const VALID_LAYOUTS = new Set([
  'default', 'cover', 'cover-all', '2column', 'end',
]);

// ---- メインAPI -----------------------------------------------------------
export function parseMarkdown(text) {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
  const { frontmatter, body } = splitFrontmatter(normalized);
  const slides = splitSlides(body);
  return { frontmatter, slides };
}

// ---- Frontmatter ---------------------------------------------------------
function splitFrontmatter(text) {
  if (!text.startsWith('---\n')) {
    return { frontmatter: {}, body: text };
  }
  // 終端 `---` を行頭から探す
  const re = /\n---\s*\n/;
  const match = re.exec(text.slice(4));
  if (!match) {
    return { frontmatter: {}, body: text };
  }
  const fmText = text.slice(4, 4 + match.index);
  const body = text.slice(4 + match.index + match[0].length);
  let frontmatter = {};
  try {
    frontmatter = yaml.load(preprocessFrontmatter(fmText)) || {};
  } catch (e) {
    console.warn('[slides] Failed to parse frontmatter as YAML:', e);
  }
  return { frontmatter, body };
}

// YAMLの落とし穴を吸収するプリプロセス：
//   - `#000000` のようなカラーコード（YAMLではコメント扱いされて null になる）
//   - `@ken_c_lo / taea` のような @ 始まりの値（YAMLでは予約語）
// を自動でダブルクオートで括る。
function preprocessFrontmatter(text) {
  return text
    .split('\n')
    .map((line) => {
      const m = line.match(/^(\s*[\w-]+\s*:\s*)(\S.*?)\s*$/);
      if (!m) return line;
      const [, prefix, value] = m;
      // 既にクオート済みならそのまま
      if (/^['"]/.test(value)) return line;
      // 配列やマッピングは触らない
      if (/^[\[\{]/.test(value)) return line;
      // # で始まる（YAMLコメント誤検知）か @ で始まる（予約語）を JSON 文字列化
      if (/^[#@]/.test(value)) {
        return prefix + JSON.stringify(value);
      }
      return line;
    })
    .join('\n');
}

// ---- スライド分割 --------------------------------------------------------
function splitSlides(body) {
  const lines = body.split('\n');
  const slides = [];
  let current = createEmptySlide();
  let inFence = false;

  const pushIfMeaningful = () => {
    finalizeSlide(current);
    if (current.heading || current.bodyMarkdown.length > 0) {
      slides.push(current);
    }
  };

  for (const line of lines) {
    // コードブロック内は何も拾わずそのまま入れる
    if (FENCE.test(line)) {
      inFence = !inFence;
      current.lines.push(line);
      continue;
    }

    if (!inFence) {
      // 区切り行（独立した `---` または `--`）
      if (SEP_LINE.test(line)) {
        pushIfMeaningful();
        current = createEmptySlide();
        continue;
      }
      // h1
      const h1 = line.match(H1_LINE);
      if (h1) {
        pushIfMeaningful();
        current = createEmptySlide();
        current.heading = h1[1];
        current.headingLevel = 1;
        continue;
      }
      // h2
      const h2 = line.match(H2_LINE);
      if (h2) {
        pushIfMeaningful();
        current = createEmptySlide();
        current.heading = h2[1];
        current.headingLevel = 2;
        continue;
      }
    }

    current.lines.push(line);
  }
  pushIfMeaningful();
  return slides;
}

function createEmptySlide() {
  return {
    heading: null,
    headingLevel: null,
    layout: 'default',
    layoutExplicit: false,
    lines: [],
    bodyMarkdown: '',
  };
}

function finalizeSlide(slide) {
  let body = (slide.lines || []).join('\n');
  const m = body.match(LAYOUT_COMMENT);
  if (m) {
    let layout = m[1].toLowerCase();
    if (LAYOUT_TYPO_MAP[layout]) layout = LAYOUT_TYPO_MAP[layout];
    if (!VALID_LAYOUTS.has(layout)) {
      console.warn(`[slides] Unknown layout "${m[1]}", falling back to default.`);
      layout = 'default';
    }
    slide.layout = layout;
    slide.layoutExplicit = true;
    // 全レイアウトコメント（複数あっても）を取り除く
    body = body.replace(new RegExp(LAYOUT_COMMENT.source, 'gim'), '');
  }
  slide.bodyMarkdown = body.replace(/^\s+|\s+$/g, '');
  delete slide.lines;
}

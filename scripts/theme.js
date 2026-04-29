// Frontmatter からフォント・色を読み取り、Google Fonts を読み込んで CSS 変数に流し込む。

export function applyTheme(frontmatter = {}) {
  const fonts = frontmatter.fonts || {};
  const colors = frontmatter.color || {};

  // ---- Google Fonts ロード ----
  const slotNames = {
    '--font-heading': extractFontName(fonts.heading),
    '--font-body': extractFontName(fonts.body),
    '--font-ja-heading': extractFontName(fonts.ja?.heading),
    '--font-ja-body': extractFontName(fonts.ja?.body),
  };

  const uniqueFonts = [
    ...new Set(Object.values(slotNames).filter(Boolean)),
  ];
  if (uniqueFonts.length > 0) {
    injectGoogleFontsLink(uniqueFonts);
  }

  // ---- CSS 変数注入 ----
  const root = document.documentElement;
  for (const [key, name] of Object.entries(slotNames)) {
    if (name) {
      root.style.setProperty(key, `"${name}"`);
    }
  }
  if (colors.heading) root.style.setProperty('--color-heading', colors.heading);
  if (colors.body) root.style.setProperty('--color-body', colors.body);
  if (colors.background) root.style.setProperty('--color-background', colors.background);

  // body 背景に直接適用（CSS変数のフォールバックも兼ねる）
  if (colors.background) {
    document.body.style.backgroundColor = colors.background;
  }

  // ページタイトル
  if (frontmatter.title) {
    document.title = frontmatter.title;
  }
}

// Google Fonts のページURLからフォント名を抽出。
// 例: https://fonts.google.com/specimen/Noto+Serif+JP?... → "Noto Serif JP"
//     https://fonts.google.com/noto/specimen/Noto+Serif+JP?... → "Noto Serif JP"
function extractFontName(url) {
  if (typeof url !== 'string') return null;
  const m = url.match(/\/specimen\/([^/?#]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]).replace(/\+/g, ' ');
  } catch {
    return m[1].replace(/\+/g, ' ');
  }
}

function injectGoogleFontsLink(names) {
  const families = names
    .map((n) => `family=${encodeURIComponent(n).replace(/%20/g, '+')}:wght@400;700`)
    .join('&');
  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

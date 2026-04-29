# Claude Code as a Friend

[「うちの子（※AI）の自慢LT会」](https://techbooklibrary.connpass.com/event/389651)（2026-04-30 / [#技術書ライブラリー](https://techbooklibrary.jp/) @早稲田） の発表スライドと、そのために作った Markdown スライドジェネレーター。

🔗 **Live**: https://taea.github.io/claude-code-as-a-friend/

![cover](./assets/og-image.png)

## 何これ

- `index.md` を **そのまま fetch して描画する** 静的サイト
- Frontmatter + 見出し + HTML コメントだけで 6 種類のレイアウトを使い分けられる
- Markdown 1 ファイルとブラウザだけで完結（ビルドなし）
- GitHub Pages にそのまま乗せて配信できる

## 機能

- 6 レイアウト：`cover` / `default` / `2column`（A: 画像+本文 / B: h3 で2列分割）/ `cover-all` / `end`
- `# h1` / `## h2` / `---` でスライドを分割。h2 はサブセクション扱い
- Frontmatter で Google Fonts と配色を切り替え（`fonts.heading` / `fonts.body` / `fonts.ja.heading` / `fonts.ja.body` / `color.heading` / `color.body` / `color.background`）
- ナビゲーション：矢印キー / Space / Home / End / 画面左右クリック / 画面両端のキャレット / `#5` のようなURLハッシュ直リンク
- 1280×720 を `transform: scale()` でビューポートに自動フィット
- 寛容なパーサー：HTMLコメントの `<!--` / `<!---` / `--->` 混在 OK、`2colmun` のようなレイアウト名タイポも自動補正、ページ区切り `--` も許容、YAML の `#000000` / `@xxx` の予約衝突も自動エスケープ
- OGP / Twitter Card 対応、favicon あり

## 使い方

### ローカルで動かす

```sh
git clone git@github.com:taea/claude-code-as-a-friend.git
cd claude-code-as-a-friend
python3 -m http.server 8765
# → http://localhost:8765/
```

`index.md` を編集してリロードすればすぐ反映される。

### GitHub Pages にデプロイ

1. リポジトリの **Settings → Pages** で `main` ブランチの `(root)` を指定
2. 数分で `https://<user>.github.io/<repo>/` で公開される

> ⚠️ 既定では Jekyll が `.md` を HTML にレンダリングしてしまうため、リポジトリルートに **空の `.nojekyll` ファイル** を必ず置くこと。これがないと `fetch('index.md')` が 404 になる。

## 原稿の書き方

### Frontmatter

```yaml
---
title: スライドタイトル
author: 著者名
author_id: "@yourhandle / yourhandle"
event: イベント名
date: "2026-04-30"
venue: "#会場 @場所"
fonts:
  heading: https://fonts.google.com/specimen/DM+Serif+Text
  body: https://fonts.google.com/specimen/Plus+Jakarta+Sans
  ja:
    heading: https://fonts.google.com/specimen/Zen+Old+Mincho
    body: https://fonts.google.com/specimen/Noto+Sans+JP
color:
  heading: "#000000"
  body: "#000000"
  background: "#f8f8f6"
---
```

- `fonts.*` は Google Fonts の **specimen ページの URL をそのまま貼ればOK**（フォント名は自動抽出）
- `#000000` のような値は **必ずクオート**（パーサ側でも吸収するが、書く側でも明示が安全）

### スライド分割

- 行頭 `# h1` / `## h2` / 独立行 `---` がスライドの区切り
- h2 は左寄せの「サブセクション扉」扱い
- 見出しだけのスライドは中央寄せの章扉に自動

### レイアウト指定

スライドの本文中に HTML コメントで指定する。

```markdown
# タイトル

<!--- layout: cover -->
```

| layout | 用途 |
|---|---|
| `default` | 上中央に見出し、下にコンテンツ（指定なしのデフォルト） |
| `cover` | 表紙。frontmatter の title / author / event / date / venue を表示 |
| `2column` | 画像 + 本文 (パターンA) または h3 で左右分割 (パターンB) |
| `cover-all` | 画像を全面背景に。`<figcaption class="upper">` / `lower` で帯付きキャプションを重ねる |
| `end` | 最終ページ。見出し + 画像 |

例：
```markdown
# 自己紹介

<!--- layout: 2column -->

<img src="assets/profile.png">

- @taea
- ...
```

```markdown
<!--- layout: cover-all -->

<img src="assets/photo.jpg">

<figcaption class="upper">キャプション文字列</figcaption>
```

### ナビゲーション

| 操作 | 動作 |
|---|---|
| `→` / `Space` / `PageDown` / 画面右側クリック | 次のスライド |
| `←` / `PageUp` / 画面左側クリック | 前のスライド |
| `Home` | 先頭 |
| `End` | 末尾 |
| URL ハッシュ `#5` | 5枚目に直接ジャンプ |

## ファイル構成

```
.
├── index.html          # メイン
├── og.html             # OGP画像生成専用ページ（cover を 1200×630 で）
├── index.md            # スライド原稿（編集対象）
├── .nojekyll           # GitHub Pages の Jekyll を無効化
├── assets/
│   ├── og-image.png    # OGP用 1200×630
│   ├── favicon.ico     # マルチサイズ (16/32/48)
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   └── profile.png     # 原稿で参照する画像など
├── styles/
│   ├── base.css        # ベース・タイポ・テーマ変数
│   ├── layouts.css     # レイアウト別スタイル
│   └── nav.css         # ナビゲーション・ページ番号・キャレット
└── scripts/
    ├── main.js         # エントリポイント
    ├── parser.js       # MD → スライドJSON
    ├── renderer.js     # スライドJSON → DOM
    ├── theme.js        # フォント / 色の適用
    └── nav.js          # キー / クリック / ハッシュ / ページ番号
```

## OGP 画像を再生成する

`og.html` は cover を 1200×630 で描画する専用ページ。ヘッドレス Chrome で PNG 化すれば OGP 画像になる。

```sh
# ローカルサーバー起動中に実行
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless --disable-gpu --hide-scrollbars \
  --window-size=1200,630 --virtual-time-budget=8000 \
  --run-all-compositor-stages-before-draw \
  --screenshot=assets/og-image.png http://localhost:8765/og.html
```

## favicon を再生成する

```sh
SRC=path/to/source.png   # 透過背景の素材
BG="#f8f8f6"             # スライド背景色

magick "$SRC" -background "$BG" -alpha remove -alpha off \
  -gravity center -extent 1100x1100 /tmp/icon-padded.png

magick /tmp/icon-padded.png -resize 180x180 assets/apple-touch-icon.png
magick /tmp/icon-padded.png -filter point -resize 32x32 assets/favicon-32x32.png
magick /tmp/icon-padded.png -filter point -resize 16x16 assets/favicon-16x16.png
magick /tmp/icon-padded.png \
  \( -clone 0 -filter point -resize 16x16 \) \
  \( -clone 0 -filter point -resize 32x32 \) \
  \( -clone 0 -filter point -resize 48x48 \) \
  -delete 0 assets/favicon.ico
```

## クレジット

- Designed & directed by **[@taea](https://github.com/taea)** (Taeko Akatsuka)
- Implemented in pair-programming with **Claude Opus 4.7 (1M context)** — 江戸っ子設定の侍🦀⚔️
- 開発ログ（侍視点）: [esa](https://esa-pages.io/p/sharing/102/posts/617/3e2de618a641fce1a08b.html)

## 依存（CDN）：

- [marked](https://github.com/markedjs/marked) — Markdown → HTML
- [js-yaml](https://github.com/nodeca/js-yaml) — Frontmatter
- [Google Fonts](https://fonts.google.com/) / [Material Symbols](https://fonts.google.com/icons)

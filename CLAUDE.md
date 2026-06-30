# house-of-representatives 検索アプリ — 開発メモ

元はSmartNews メディア研究所による、衆議院の議案情報を検索できる静的サイト（MITライセンス）。
`feature/extended-search` ブランチで検索項目を拡張した。

## 構成
- `main.py`：衆議院サイトから議案データを取得し `data/*.json` `data/*.csv` を生成（実行には時間がかかる）
- `index.html` + `js/script.js`（圧縮版 `js/script.min.js`）+ `css/style.scss`（コンパイル後 `css/style.css` `css/style.min.css`）：検索UI本体
- `data/gian_summary.json`：検索対象の主データ。1議案＝1配列。インデックスは `js/script.js` 冒頭の `HEADERS` を参照
  - `gian[10]` は経過情報の配列（継続審議等で複数国会にまたがる議案は複数行持つ）。各行のインデックスは `KEIKA_HEADERS` を参照
  - 委員会名・審査結果などは「日付／値」形式の文字列なので、値だけ使う場合は `getAfterSlash()` で取り出す
  - 日付は元号表記（例：`平成10年 3月 4日`、`令和 2年 4月10日` とスペースの有無が不定）。西暦変換は `eraToYear()`

## CSSのビルド
`css/style.scss` を編集したら、必ず以下でコンパイルし直すこと（手で `style.css` / `style.min.css` を直接編集しない）。
```
npm install -g sass
sass css/style.scss css/style.css --no-source-map
sass css/style.scss css/style.min.css --style=compressed --no-source-map
```

## JSのビルド
`js/script.js` を編集したら、`js/script.min.js` も再生成する（`index.html` は min版を読み込む）。
```
npm install -g terser
terser js/script.js -o js/script.min.js -c -m
```

## ローカル動作確認
外部CDN（jQuery, ECharts, Google Fonts）はサンドボックス環境からは到達できないことがある。
その場合は `npm install jquery echarts` してローカルパスに差し替えたテスト用HTMLを作り、Playwright等で確認する。
本番（GitHub Pages等、外部CDNに到達できる環境）ではCDN版のままでよい。

## 著作権表記の運用

- LICENSEの元の著作権表示（smartnews-smri）は削除・改変しない。
- 独自の改修分は `Portions Copyright (c) [年] gamishi` を併記する。
- フォーク・派生元が複数存在しうる場合（例：他組織によるフォーク）、どの改修がどのフォーク由来かを混同しないよう、作業前に対象リポジトリのURLとフォーク元を確認する。

## コミット規約

- コミットメッセージは日本語で記述する。
- 1コミット1内容を原則とし、機能追加・ビルド成果物の再生成・ドキュメント更新などは分けてコミットする。
- `git format-patch` でパッチ化することを前提に、mainブランチに直接コミットせず作業用ブランチ（例：`feature/*`）を切る。

## データ構造を扱う際の姿勢

- データ構造（`gian_summary.json` のフィールドの意味、`keika` の各行の解釈、委員会名表記のゆれなど）について不明点があれば、推測で実装せず確認する。

## これまでの拡張内容（feature/extended-search）
検索フォームを大カテゴリ（基本情報／国会回次／衆議院での審議／参議院での審議／その他）に再構成し、以下を追加した。

- 国会回次：提出回次（完全一致）、審議に関わった回次（経過情報のいずれか一致）、提出年（西暦、元号変換）
- 衆参の付託委員会（プルダウン、`getAfterSlash()` で抽出した約65〜66種を使用）
- 衆参の審査結果・審議結果（部分一致テキスト）
- 議案提出会派（部分一致）、提出区分（議員提出／委員長提出、提出者表記の末尾「君」/「委員長」「調査会長」で判定）
- 衆議院の採決時会派態度（全会一致／多数／少数。参議院側に対応データなし）
- 公布年月日／法律番号（部分一致）
- 議案名検索のAND/OR切り替え

複数行（経過情報）にまたがる項目は「いずれか1行が条件に一致すればヒット」という仕様にしている
（既存の賛成・反対政党フィルタのみ、全行一致が条件になっている旧仕様のまま据え置き）。

## 今後の検討候補
- 委員会名のゆれ統合（特別委員会の名称変更をまたいだグルーピング）
- 議案番号での直接検索
- 検索条件のURLクエリパラメータ化（結果の共有用）

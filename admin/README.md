# 企業進捗管理サイト

個社ごとの商談・打ち合わせ動画をアップロードすると、文字起こし（OpenAI Whisper）とAI要約（Anthropic Claude）により「決まったこと」「次回までの宿題」を自動抽出し、企業ごとのシート（ページ）に蓄積する管理サイトです。

## できること

- 企業（プルダウンに表示される）の登録・削除
- 動画アップロード時に企業を選択 → 自動で文字起こし・要約
- 企業別ページに、会議記録が日時順に蓄積・一覧表示される
- 解析エラー時の再実行

## セットアップ

```bash
npm install
cp .env.example .env
```

`.env` に以下を設定してください。

- `OPENAI_API_KEY`: 文字起こし（Whisper API）用
- `ANTHROPIC_API_KEY`: 要約（Claude API）用

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。

## データ保存先

- データベース: SQLite（Node.js標準の `node:sqlite` を使用、追加インフラ不要）。既定では `./data/app.db`
- アップロード動画: 既定では `./uploads/<企業ID>/` 配下

いずれも `.gitignore` 対象です。保存先は `.env` の `DATABASE_PATH` / `UPLOADS_DIR` で変更できます。

## 技術構成

- Next.js（App Router）/ TypeScript / Tailwind CSS
- `node:sqlite`（DB） + OpenAI SDK（文字起こし） + Anthropic SDK（要約）

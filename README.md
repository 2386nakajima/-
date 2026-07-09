# ShiftKit — シフト管理サイト

店舗・チーム向けのシンプルなシフト管理 Web アプリです。Expo（React Native for Web）+ Expo Router で作られており、ブラウザ上で動作します。

## 主な機能

| 画面 | 内容 |
| --- | --- |
| ホーム | 概要ダッシュボード（スタッフ数・本日のシフト・未処理の希望）とサンプルデータ投入 |
| シフト表 | 週ごとのグリッドでスタッフの勤務を割り当て・削除。週の前後移動が可能 |
| 希望シフト | スタッフが勤務希望を提出。管理者が「承認」するとシフト表へ自動反映、「却下」も可能 |
| スタッフ | 名前・役職・時給・識別色の登録／編集／削除 |
| 勤怠集計 | 月ごとの勤務時間・シフト回数・人件費（概算）をスタッフ別に集計 |

## データの保存について

- データはブラウザの **localStorage** に保存されます（このブラウザ内のみ、バックエンドなし）。
- 別の端末・ブラウザとのリアルタイム共有はできません。将来クラウド保存（Supabase 等）に差し替えられるよう、保存処理は `src/lib/storage.ts` に集約しています。

## 起動方法

1. 依存関係をインストール（初回と package.json 変更後）

   ```
   npm install
   ```

2. Web で開発サーバーを起動

   ```
   npm run web
   ```

   ブラウザで表示される URL（通常 http://localhost:8081）を開きます。

3. スマホの Expo Go で確認する場合は `npm start` で表示される QR を読み取ります。

## コマンド一覧

| コマンド | 内容 |
| --- | --- |
| `npm run web` | Web 開発サーバー起動 |
| `npm start` | 開発サーバー起動（Expo Go 用 QR 表示） |
| `npm run typecheck` | TypeScript の型チェック |
| `npm run lint` | ESLint によるコードチェック |
| `npm run format` | Prettier による整形 |
| `npx expo export --platform web` | 静的サイトとして `dist/` に書き出し |

## 技術構成 / ディレクトリ

- Expo SDK 56 / React Native / React Native Web / TypeScript
- Expo Router（`src/app/` 配下が画面ファイル、ファイル名がそのまま URL に対応）

```
src/
  app/            画面（ルーティング）
    _layout.tsx   共通レイアウト（トップナビ）
    index.tsx     ホーム
    schedule.tsx  シフト表
    requests.tsx  希望シフト
    staff.tsx     スタッフ
    summary.tsx   勤怠集計
  components/      共通UI部品（ui.tsx / NavBar.tsx）
  lib/             型・日付ユーティリティ・データストア・永続化
  theme.ts         配色・余白などのデザイントークン
```

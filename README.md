# WakeUpQR

登録したQRコードを読み取るまで止められない目覚ましアプリ（個人利用・ストア非公開）。

**注意:** 通常のアプリ操作ではQR一致までアラームを解除できない設計ですが、iPhoneの再起動・アプリ削除・OS設定変更・強制終了などを完全に防止することはできません。

## 開発の進め方

- **Phase A（Windowsで開発中）**: 画面・QR読み取り・設定保存・疑似アラームを React Native + Expo で実装
- **Phase B（Macが必要）**: AlarmKitによる本物のアラーム、iPhone実機ビルドとインストール

## Windowsでの起動方法

1. このリポジトリをクローン（初回のみ）

   ```
   git clone <このリポジトリのURL>
   ```

2. プロジェクトのフォルダで依存関係をインストール（初回と、package.json変更後）

   ```
   npm install
   ```

3. 開発サーバーを起動

   ```
   npm start
   ```

4. iPhoneで確認する場合
   - App Storeから「Expo Go」をインストール
   - iPhoneとPCを同じWi-Fiに接続
   - ターミナルに表示されるQRコードをiPhoneのカメラで読み取る

## コマンド一覧

| コマンド | 内容 |
| --- | --- |
| `npm start` | 開発サーバー起動 |
| `npm run typecheck` | TypeScriptの型チェック |
| `npm run lint` | ESLintによるコードチェック |
| `npm run format` | Prettierによるコード整形 |

## 技術構成

- Expo SDK 56 / React Native / TypeScript
- Expo Router（画面遷移、`src/app/` 配下が画面ファイル）
- ESLint + Prettier

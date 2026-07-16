# WakeUpQR

登録したQRコードを読み取るまで止められない目覚ましアプリ（個人利用・ストア非公開）。

**注意:** 通常のアプリ操作ではQR一致までアラームを解除できない設計ですが、iPhoneの再起動・アプリ削除・OS設定変更・強制終了などを完全に防止することはできません。

## 事業ドキュメント

WakeUpQRを商用ローンチするための計画書一式（`docs/`）と公開用LP（`lp/`）:

- [月5万円収益化プラン](docs/revenue-50k-plan.md) — **最重要**。90日で月5万円に到達するための実行計画
- [出品文・提案文テンプレ集](docs/service-listings.md) — ココナラ／クラウドワークスにそのまま使える営業文
- [営業サイト（Web制作サービス）](services/index.html) — 受注窓口・ポートフォリオ兼用
- [制作サンプル: 美容室LP](services/samples/hair-salon.html) — ポートフォリオ用サンプル
- [事業計画書](docs/business-plan.md) — ビジョン・市場・競合・ロードマップ・KPI
- [会社設立・開業ガイド](docs/company-setup-guide.md) — 個人事業主での開業から法人化までの手順
- [収益化設計](docs/monetization-plan.md) — フリーミアム設計・価格・課金実装（RevenueCat）
- [ランディングページ](lp/index.html) — 事前登録受付用のLP

### LPをWebで公開する（GitHub Pages・無料）

1. GitHubのリポジトリページで **Settings → Pages** を開く
2. 「Build and deployment」の Source を **Deploy from a branch** にする
3. Branch にこのブランチ、フォルダに `/ (root)` を選んで Save
4. 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/lp/` でLPが公開される

公開前に `lp/index.html` 内の事前登録メールアドレス（`wakeupqr@example.com`）を実際の連絡先（またはGoogleフォームのURL）に差し替えること。

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

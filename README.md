# Claude Code Logs Viewer

Claude CodeのチャットログをVS Code内で見やすく表示するVS Code拡張機能です。

## 機能

- **プロジェクト一覧表示**: `~/.claude/projects`内のプロジェクトを一覧表示
- **会話一覧**: プロジェクト内の会話ログを時系列で表示
- **会話詳細**: チャット風UIで会話内容を見やすく表示
- **Markdownレンダリング**: アシスタントメッセージのMarkdown対応
- **ツール使用の可視化**: ツール呼び出しと結果の折りたたみ表示
- **セッション再開**: コマンドをクリップボードにコピーして簡単に再開

## インストール

### 開発環境での実行

1. リポジトリをクローン
```bash
git clone <repository-url>
cd claude-code-logs
```

2. 依存関係をインストール
```bash
# 拡張機能の依存関係
npm install

# Webviewの依存関係
cd webview
npm install
cd ..
```

3. 拡張機能をコンパイル
```bash
npm run compile
```

4. VS Codeで開発を開始
```bash
code .
```

5. F5キーを押して拡張機能をデバッグモードで実行

### VSIX パッケージのインストール

```bash
# パッケージをビルド
vsce package

# VS Codeにインストール
code --install-extension claude-code-logs-*.vsix
```

## 使い方

1. VS Codeのコマンドパレット（Cmd+Shift+P / Ctrl+Shift+P）を開く
2. "Claude Code Logs: Show Logs Viewer" を実行
3. Webviewが開いてプロジェクト一覧が表示されます
4. プロジェクトをクリックして会話一覧を表示
5. 会話をクリックして詳細を確認

## 開発

### プロジェクト構成

```
.
├── extension/           # VS Code拡張のメインコード
│   ├── src/
│   │   └── extension.ts # 拡張機能のエントリーポイント
│   └── tsconfig.json
├── webview/            # ReactアプリのWebview
│   ├── src/
│   │   ├── components/ # UIコンポーネント
│   │   ├── pages/      # ページコンポーネント
│   │   ├── lib/        # ユーティリティ
│   │   └── hooks/      # Reactフック
│   ├── package.json
│   └── vite.config.ts
├── package.json        # 拡張機能の設定
└── README.md
```

### 開発スクリプト

```bash
# 拡張機能をコンパイル
npm run compile

# 拡張機能を監視モードでコンパイル
npm run watch

# Webviewをビルド
npm run build:webview

# Webviewを開発モードで起動
npm run dev:webview

# 全体をビルド
npm run compile
```

### VS Code拡張とWebviewの通信

拡張機能とWebview間の通信は`vscode-api.ts`で管理されています：

- **getProjects()**: プロジェクト一覧を取得
- **getProjectLogs(projectId)**: 特定プロジェクトの会話一覧を取得  
- **getLogDetail(projectId, logId)**: 会話の詳細を取得

## 技術スタック

### VS Code拡張
- **TypeScript**: 型安全な開発
- **VS Code API**: Webviewとファイルシステムアクセス

### Webview (React アプリ)
- **React 18**: UIライブラリ
- **React Router**: SPA ルーティング
- **Vite**: ビルドツール
- **Tailwind CSS**: スタイリング
- **shadcn/ui**: UIコンポーネント
- **Radix UI**: アクセシブルなプリミティブ
- **Lucide React**: アイコン
- **React Markdown**: Markdownレンダリング

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。
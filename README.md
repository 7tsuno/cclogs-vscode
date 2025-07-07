# Claude Code Logs Viewer

Claude Code の会話ログを VS Code 内で見やすく表示する拡張機能です。

## 機能

- **プロジェクト一覧表示**: `~/.claude/projects`内のプロジェクトを表示
- **会話ログ閲覧**: 会話の詳細をマークダウン形式で表示
- **セッション再開**: ターミナルで直接コマンド実行してセッション再開
- **VS Code テーマ連携**: VS Code のテーマに自動適応

## インストール

1. [Releases](https://github.com/7tsuno/cclogs-vscode/releases) から最新の `.vsix` ファイルをダウンロード
2. VS Code で `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) を押してコマンドパレットを開く
3. `Extensions: Install from VSIX...` を入力・選択
4. ダウンロードした `.vsix` ファイルを選択

## 使用方法

1. `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) でコマンドパレットを開く
2. `Claude Code Logs: Show Logs Viewer` を入力・実行
3. プロジェクト一覧から確認したいプロジェクトを選択

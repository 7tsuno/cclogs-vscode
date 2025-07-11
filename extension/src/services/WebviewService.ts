import * as path from 'path';
import * as fs from 'fs';

export interface WebviewUri {
    fsPath: string;
}

export interface Webview {
    cspSource: string;
    asWebviewUri(uri: WebviewUri): string;
}

export interface UriProvider {
    joinPath(base: WebviewUri, ...paths: string[]): WebviewUri;
}

export class WebviewService {
    constructor(private uriProvider: UriProvider) {}

    /**
     * WebviewのHTMLコンテンツを生成する
     * @param webview Webviewインスタンス
     * @param extensionUri 拡張機能のURI
     * @returns HTMLコンテンツ
     */
    public getHtmlContent(webview: Webview, extensionUri: WebviewUri): string {
        // 実際にビルドされたファイルを確認
        const distPath = this.uriProvider.joinPath(extensionUri, 'webview', 'dist').fsPath;
        const assetsPath = path.join(distPath, 'assets');
        
        // assetsディレクトリ内のファイルを動的に取得
        let scriptFile = '';
        let cssFile = '';
        
        if (fs.existsSync(assetsPath)) {
            const files = fs.readdirSync(assetsPath);
            scriptFile = files.find((file: string) => file.startsWith('index-') && file.endsWith('.js')) || '';
            cssFile = files.find((file: string) => file.startsWith('index-') && file.endsWith('.css')) || '';
        }
        
        const scriptUri = webview.asWebviewUri(this.uriProvider.joinPath(extensionUri, 'webview', 'dist', 'assets', scriptFile));
        const styleUri = webview.asWebviewUri(this.uriProvider.joinPath(extensionUri, 'webview', 'dist', 'assets', cssFile));

        const nonce = this.getNonce();

        return `<!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval';">
                <link href="${styleUri}" rel="stylesheet">
                <title>Claude Code Logs</title>
                <style>
                    :root {
                        --vscode-font-family: var(--vscode-font-family);
                        --vscode-font-size: var(--vscode-font-size);
                        --vscode-font-weight: var(--vscode-font-weight);
                        
                        /* VS Code theme colors */
                        --background: var(--vscode-editor-background);
                        --foreground: var(--vscode-editor-foreground);
                        --border: var(--vscode-panel-border);
                        --input: var(--vscode-input-background);
                        --ring: var(--vscode-focusBorder);
                        
                        --primary: var(--vscode-button-background);
                        --primary-foreground: var(--vscode-button-foreground);
                        --secondary: var(--vscode-button-secondaryBackground);
                        --secondary-foreground: var(--vscode-button-secondaryForeground);
                        
                        --muted: var(--vscode-textBlockQuote-background);
                        --muted-foreground: var(--vscode-descriptionForeground);
                        --accent: var(--vscode-list-hoverBackground);
                        --accent-foreground: var(--vscode-list-hoverForeground);
                        
                        --card: var(--vscode-editor-background);
                        --card-foreground: var(--vscode-editor-foreground);
                        --popover: var(--vscode-quickInput-background);
                        --popover-foreground: var(--vscode-quickInput-foreground);
                        
                        --destructive: var(--vscode-errorForeground);
                        --destructive-foreground: var(--vscode-editor-background);
                        
                        /* Toast specific colors */
                        --toast-background: var(--vscode-notifications-background);
                        --toast-foreground: var(--vscode-notifications-foreground);
                        --toast-border: var(--vscode-notifications-border);
                        
                        --radius: 0.5rem;
                    }
                    
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        font-weight: var(--vscode-font-weight);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        margin: 0;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    /**
     * セキュリティ用のnonceを生成する
     */
    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}


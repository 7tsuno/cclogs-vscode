import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Code Logs extension is now active!');

    let disposable = vscode.commands.registerCommand('claudeCodeLogs.showLogs', () => {
        ClaudeLogsPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

class ClaudeLogsPanel {
    public static currentPanel: ClaudeLogsPanel | undefined;
    public static readonly viewType = 'claudeCodeLogs';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _fileWatcher: vscode.FileSystemWatcher | undefined;
    private _updateTimer: NodeJS.Timeout | undefined;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ClaudeLogsPanel.currentPanel) {
            ClaudeLogsPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ClaudeLogsPanel.viewType,
            'Claude Code Logs',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'dist'),
                    vscode.Uri.joinPath(extensionUri, 'webview', 'dist')
                ]
            }
        );

        ClaudeLogsPanel.currentPanel = new ClaudeLogsPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._setupFileWatcher();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'getProjects':
                        this._getProjects();
                        return;
                    case 'getProjectLogs':
                        this._getProjectLogs(message.projectId);
                        return;
                    case 'getLogDetail':
                        this._getLogDetail(message.projectId, message.logId);
                        return;
                    case 'executeInTerminal':
                        this._executeInTerminal(message.commandText);
                        return;
                    case 'searchLogs':
                        this._searchLogs(message.projectId, message.filters);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private async _getProjects() {
        try {
            const claudeDir = path.join(os.homedir(), '.claude', 'projects');
            
            if (!fs.existsSync(claudeDir)) {
                this._panel.webview.postMessage({ 
                    command: 'projectsResponse', 
                    error: 'Claudeプロジェクトディレクトリが見つかりません' 
                });
                return;
            }

            const entries = fs.readdirSync(claudeDir, { withFileTypes: true });
            const projectDirs = entries.filter(entry => entry.isDirectory());
            
            const projects = await Promise.all(
                projectDirs.map(async (dir) => {
                    const projectPath = path.join(claudeDir, dir.name);
                    const files = fs.readdirSync(projectPath);
                    const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
                    
                    let latestTime = null;
                    if (jsonlFiles.length > 0) {
                        const stats = await Promise.all(
                            jsonlFiles.map(async (file) => {
                                const filePath = path.join(projectPath, file);
                                const stat = fs.statSync(filePath);
                                return stat.mtime;
                            })
                        );
                        latestTime = new Date(Math.max(...stats.map(d => d.getTime())));
                    }
                    
                    return {
                        id: dir.name,
                        name: dir.name.replace(/-/g, '/'),
                        conversationCount: jsonlFiles.length,
                        lastModified: latestTime ? latestTime.toISOString() : null
                    };
                })
            );
            
            projects.sort((a, b) => {
                if (!a.lastModified) return 1;
                if (!b.lastModified) return -1;
                return b.lastModified.localeCompare(a.lastModified);
            });

            this._panel.webview.postMessage({ 
                command: 'projectsResponse', 
                projects 
            });
        } catch (error) {
            this._panel.webview.postMessage({ 
                command: 'projectsResponse', 
                error: 'プロジェクトの読み込みに失敗しました' 
            });
        }
    }

    private async _getProjectLogs(projectId: string) {
        try {
            const projectPath = path.join(os.homedir(), '.claude', 'projects', projectId);
            
            if (!fs.existsSync(projectPath)) {
                this._panel.webview.postMessage({ 
                    command: 'logsResponse', 
                    error: 'プロジェクトが見つかりません' 
                });
                return;
            }

            const files = fs.readdirSync(projectPath);
            const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
            
            const conversations = await Promise.all(
                jsonlFiles.map(async (fileName) => {
                    const filePath = path.join(projectPath, fileName);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const lines = content.trim().split('\n').filter(line => line);
                    
                    const entries = lines.map(line => {
                        try {
                            const entry = JSON.parse(line);
                            // messageフィールドがある場合はその内容を展開
                            if (entry.message) {
                                return {
                                    timestamp: entry.timestamp || '',
                                    type: entry.type || entry.message.role || 'unknown',
                                    content: entry.message.content ? 
                                        (typeof entry.message.content === 'string' ? 
                                            entry.message.content : 
                                            entry.message.content.map((c: any) => c.text || '').join('\n')
                                        ) : ''
                                };
                            }
                            // summaryなどの特殊なエントリ
                            return {
                                timestamp: entry.timestamp || '',
                                type: entry.type || 'system',
                                content: entry.summary || ''
                            };
                        } catch {
                            return null;
                        }
                    }).filter(Boolean);

                    if (entries.length === 0) return null;

                    const conversationId = fileName.replace('.jsonl', '');
                    const startTime = entries[0]?.timestamp || '';
                    const endTime = entries[entries.length - 1]?.timestamp || '';
                    
                    const preview = entries.slice(0, 3);

                    return {
                        conversationId,
                        fileName,
                        startTime,
                        endTime,
                        entriesCount: entries.length,
                        preview
                    };
                })
            );

            const validConversations = conversations.filter((conv): conv is NonNullable<typeof conv> => conv !== null);
            
            // 統合されたファイルを除外
            const consolidatedConversations = this._filterConsolidatedConversations(validConversations, projectPath);
            consolidatedConversations.sort((a, b) => b.endTime.localeCompare(a.endTime));

            this._panel.webview.postMessage({ 
                command: 'logsResponse', 
                conversations: consolidatedConversations 
            });
        } catch (error) {
            console.error('Project logs error:', error);
            this._panel.webview.postMessage({ 
                command: 'logsResponse', 
                error: `会話ログの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}` 
            });
        }
    }

    private _filterConsolidatedConversations(conversations: any[], projectPath: string): any[] {
        try {
            // 各ファイルのsessionIdを確認し、他のファイルに含まれているかチェック
            const consolidatedFiles = new Set<string>();
            
            conversations.forEach(convA => {
                const sessionIdA = convA.conversationId; // これがsessionId
                
                conversations.forEach(convB => {
                    if (convA.conversationId === convB.conversationId) return; // 同じファイルはスキップ
                    
                    // convBファイルの中身を読んで、sessionIdAがJSONエントリのsessionIdフィールドとして含まれているかチェック
                    const filePath = path.join(projectPath, convB.fileName);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const lines = content.trim().split('\n').filter(line => line);
                    
                    let hasSessionId = false;
                    lines.forEach(line => {
                        try {
                            const entry = JSON.parse(line);
                            if (entry.sessionId === sessionIdA) {
                                hasSessionId = true;
                            }
                        } catch {}
                    });
                    
                    if (hasSessionId) {
                        // sessionIdAが他のファイルのJSONエントリに含まれている場合、古い方を除外
                        const older = convA.endTime < convB.endTime ? convA : convB;
                        consolidatedFiles.add(older.conversationId);
                    }
                });
            });
            
            return conversations.filter(conv => !consolidatedFiles.has(conv.conversationId));
        } catch (error) {
            console.error('Consolidation filter error:', error);
            return conversations; // エラー時は元のリストを返す
        }
    }

    private async _getLogDetail(projectId: string, logId: string) {
        try {
            const files = fs.readdirSync(path.join(os.homedir(), '.claude', 'projects', projectId));
            const targetFile = files.find(file => 
                file.includes(logId) || file.replace('.jsonl', '') === logId
            );

            if (!targetFile) {
                this._panel.webview.postMessage({ 
                    command: 'logDetailResponse', 
                    error: 'ログファイルが見つかりません' 
                });
                return;
            }

            const filePath = path.join(os.homedir(), '.claude', 'projects', projectId, targetFile);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line);
            
            const entries = lines.map((line, index) => {
                try {
                    const entry = JSON.parse(line);

                    // メタ情報のエントリは除外
                    if (entry.isMeta) {
                        return null;
                    }

                    // ツール実行結果のエントリ
                    if (entry.toolUseResult) {
                        return {
                            id: `${logId}-${index}`,
                            timestamp: entry.timestamp || "",
                            type: "tool_result",
                            content: typeof entry.toolUseResult === "string"
                                ? entry.toolUseResult
                                : JSON.stringify(entry.toolUseResult, null, 2),
                            metadata: entry,
                        };
                    }

                    // messageフィールドがある場合はその内容を展開
                    if (entry.message) {
                        let content = "";

                        // message.contentの処理
                        if (entry.message.content) {
                            if (typeof entry.message.content === "string") {
                                content = entry.message.content;
                            } else if (Array.isArray(entry.message.content)) {
                                // tool_useの内容は別途metadataで保持し、ここでは表示しない
                                content = entry.message.content
                                    .filter((c: any) => c.type === "text")
                                    .map((c: any) => c.text || "")
                                    .join("\n");
                            }
                        }

                        const thinking = Array.isArray(entry.message.content)
                            ? entry.message.content
                                .filter((c: any) => c.type === "thinking")
                                .map((c: any) => c.thinking || "")
                                .join("\n")
                            : "";

                        return {
                            id: `${logId}-${index}`,
                            timestamp: entry.timestamp || "",
                            type: entry.type || entry.message.role || "unknown",
                            content: content,
                            model: entry.message.model || "",
                            thinking: thinking,
                            metadata: entry, // 元のエントリ全体を保持
                        };
                    }

                    // summaryなどの特殊なエントリ
                    if (entry.summary) {
                        return {
                            id: `${logId}-${index}`,
                            timestamp: entry.timestamp || "",
                            type: "summary",
                            content: entry.summary,
                            metadata: entry,
                        };
                    }

                    // その他のエントリ
                    return {
                        id: `${logId}-${index}`,
                        timestamp: entry.timestamp || "",
                        type: entry.type || "system",
                        content: JSON.stringify(entry, null, 2),
                        metadata: entry,
                    };
                } catch {
                    return null;
                }
            }).filter(Boolean);

            const conversationDetail = {
                conversationId: logId,
                startTime: entries[0]?.timestamp || "",
                endTime: entries[entries.length - 1]?.timestamp || "",
                entries
            };

            this._panel.webview.postMessage({ 
                command: 'logDetailResponse', 
                conversation: conversationDetail 
            });
        } catch (error) {
            this._panel.webview.postMessage({ 
                command: 'logDetailResponse', 
                error: 'ログ詳細の読み込みに失敗しました' 
            });
        }
    }

    private async _executeInTerminal(command: string) {
        try {
            // アクティブなターミナルを取得、なければ新規作成
            let terminal = vscode.window.activeTerminal;
            if (!terminal) {
                terminal = vscode.window.createTerminal('Claude Code');
            }
            
            // ターミナルを表示
            terminal.show();
            
            // コマンドを送信
            terminal.sendText(command);
            
            // 成功メッセージを送信
            this._panel.webview.postMessage({ 
                command: 'terminalExecuteResponse', 
                success: true,
                message: 'コマンドをターミナルに送信しました'
            });
        } catch (error) {
            this._panel.webview.postMessage({ 
                command: 'terminalExecuteResponse', 
                success: false,
                error: 'ターミナルへの送信に失敗しました' 
            });
        }
    }

    private async _searchLogs(projectId: string, filters: any) {
        try {
            const projectPath = path.join(os.homedir(), '.claude', 'projects', projectId);
            
            if (!fs.existsSync(projectPath)) {
                this._panel.webview.postMessage({ 
                    command: 'searchLogsResponse', 
                    error: 'プロジェクトが見つかりません' 
                });
                return;
            }

            const files = fs.readdirSync(projectPath);
            const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
            const allResults: any[] = [];
            
            // 各ログファイルを検索
            for (const fileName of jsonlFiles) {
                const filePath = path.join(projectPath, fileName);
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.trim().split('\n').filter(line => line);
                
                let hasMatch = false;
                const entries: any[] = [];
                
                // ログエントリをパース
                for (const line of lines) {
                    try {
                        const entry = JSON.parse(line);
                        
                        // メタ情報は除外
                        if (entry.isMeta) continue;
                        
                        // エントリの内容を取得
                        let entryContent = '';
                        let entryTimestamp = entry.timestamp || '';
                        let entryType = entry.type || 'unknown';
                        
                        if (entry.message) {
                            entryType = entry.message.role || entry.type || 'unknown';
                            if (typeof entry.message.content === 'string') {
                                entryContent = entry.message.content;
                            } else if (Array.isArray(entry.message.content)) {
                                entryContent = entry.message.content
                                    .filter((c: any) => c.type === 'text')
                                    .map((c: any) => c.text || '')
                                    .join('\n');
                            }
                        } else if (entry.toolUseResult) {
                            entryType = 'tool_result';
                            entryContent = typeof entry.toolUseResult === 'string'
                                ? entry.toolUseResult
                                : JSON.stringify(entry.toolUseResult);
                        } else if (entry.summary) {
                            entryType = 'summary';
                            entryContent = entry.summary;
                        }
                        
                        entries.push({
                            content: entryContent,
                            timestamp: entryTimestamp,
                            type: entryType
                        });
                        
                        // 内容検索
                        if (filters.content && entryContent.toLowerCase().includes(filters.content.toLowerCase())) {
                            hasMatch = true;
                        }
                    } catch (e) {
                        // パースエラーは無視
                    }
                }
                
                if (entries.length === 0) continue;
                
                const conversationId = fileName.replace('.jsonl', '');
                const startTime = entries[0]?.timestamp || '';
                const endTime = entries[entries.length - 1]?.timestamp || '';
                
                // 日付フィルタリング
                if (filters.dateFrom || filters.dateTo) {
                    const convStartDate = new Date(startTime);
                    const convEndDate = new Date(endTime);
                    
                    if (filters.dateFrom) {
                        const fromDate = new Date(filters.dateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        if (convEndDate < fromDate) continue;
                    }
                    
                    if (filters.dateTo) {
                        const toDate = new Date(filters.dateTo);
                        toDate.setHours(23, 59, 59, 999);
                        if (convStartDate > toDate) continue;
                    }
                }
                
                // 内容フィルタがない場合は日付のみでマッチ
                if (!filters.content || hasMatch) {
                    const preview = entries.slice(0, 3);
                    
                    allResults.push({
                        conversationId,
                        fileName,
                        startTime,
                        endTime,
                        entriesCount: entries.length,
                        preview
                    });
                }
            }
            
            // 結果を日付順でソート
            allResults.sort((a, b) => b.endTime.localeCompare(a.endTime));
            
            this._panel.webview.postMessage({ 
                command: 'searchLogsResponse', 
                conversations: allResults 
            });
        } catch (error) {
            console.error('Search logs error:', error);
            this._panel.webview.postMessage({ 
                command: 'searchLogsResponse', 
                error: `検索中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
            });
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Claude Code Logs';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // 実際にビルドされたファイルを確認
        const fs = require('fs');
        const path = require('path');
        
        const distPath = vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist').fsPath;
        const assetsPath = path.join(distPath, 'assets');
        
        // assetsディレクトリ内のファイルを動的に取得
        let scriptFile = '';
        let cssFile = '';
        
        if (fs.existsSync(assetsPath)) {
            const files = fs.readdirSync(assetsPath);
            scriptFile = files.find((file: string) => file.startsWith('index-') && file.endsWith('.js')) || '';
            cssFile = files.find((file: string) => file.startsWith('index-') && file.endsWith('.css')) || '';
        }
        
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'assets', scriptFile));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'assets', cssFile));

        const nonce = getNonce();

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

    private _setupFileWatcher() {
        const claudeProjectsPath = path.join(os.homedir(), '.claude', 'projects');
        
        // ファイルウォッチャーの作成
        const pattern = new vscode.RelativePattern(claudeProjectsPath, '**/*.jsonl');
        this._fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        // デバウンス処理を行う関数
        const debounceUpdate = (eventType: string, uri: vscode.Uri) => {
            // 既存のタイマーをクリア
            if (this._updateTimer) {
                clearTimeout(this._updateTimer);
            }
            
            // 500ms後に更新通知を送信
            this._updateTimer = setTimeout(() => {
                this._notifyUpdate(eventType, uri);
            }, 500);
        };
        
        // ファイル変更イベントのハンドラ
        this._fileWatcher.onDidCreate(uri => debounceUpdate('create', uri));
        this._fileWatcher.onDidChange(uri => debounceUpdate('change', uri));
        this._fileWatcher.onDidDelete(uri => debounceUpdate('delete', uri));
        
        // Disposableに追加
        this._disposables.push(this._fileWatcher);
    }
    
    private _notifyUpdate(eventType: string, uri: vscode.Uri) {
        // ファイルパスからプロジェクトIDを抽出
        const pathParts = uri.fsPath.split(path.sep);
        const projectsIndex = pathParts.indexOf('projects');
        
        if (projectsIndex >= 0 && projectsIndex < pathParts.length - 2) {
            const projectId = pathParts[projectsIndex + 1];
            const fileName = path.basename(uri.fsPath);
            
            console.log(`File ${eventType}: ${fileName} in project ${projectId}`);
            
            // Webviewに更新通知を送信
            this._panel.webview.postMessage({
                command: 'fileUpdate',
                eventType,
                projectId,
                fileName
            });
        }
    }

    public dispose() {
        ClaudeLogsPanel.currentPanel = undefined;

        // タイマーのクリア
        if (this._updateTimer) {
            clearTimeout(this._updateTimer);
        }

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
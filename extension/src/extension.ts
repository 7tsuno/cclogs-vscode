import * as vscode from 'vscode';
import { conversationService } from './services/ConversationService';
import { projectService } from './services/ProjectService';
import { TerminalService } from './services/TerminalService';
import { WebviewService } from './services/WebviewService';
import { FileWatcherService } from './services/FileWatcherService';
import { vscodeTerminalProvider } from './services/adapters/VscodeTerminalProvider';
import { vscodeUriProvider } from './services/adapters/VscodeUriProvider';
import { vscodeFileWatcherProvider } from './services/adapters/VscodeFileWatcherProvider';

// サービスのインスタンスを作成
const terminalService = new TerminalService(vscodeTerminalProvider);
const webviewService = new WebviewService(vscodeUriProvider);
const fileWatcherService = new FileWatcherService(vscodeFileWatcherProvider);

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Code Logs extension is now active!');

    const disposable = vscode.commands.registerCommand('claudeCodeLogs.showLogs', () => {
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
            const projects = await projectService.getProjects();
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
            const conversations = await conversationService.getProjectLogs(projectId);
            this._panel.webview.postMessage({ 
                command: 'logsResponse', 
                conversations 
            });
        } catch (error) {
            console.error('Project logs error:', error);
            this._panel.webview.postMessage({ 
                command: 'logsResponse', 
                error: error instanceof Error ? error.message : '会話ログの読み込みに失敗しました' 
            });
        }
    }


    private async _getLogDetail(projectId: string, logId: string) {
        try {
            const conversationDetail = await conversationService.getConversationDetail(projectId, logId);
            this._panel.webview.postMessage({ 
                command: 'logDetailResponse', 
                conversation: conversationDetail 
            });
        } catch (error) {
            this._panel.webview.postMessage({ 
                command: 'logDetailResponse', 
                error: error instanceof Error ? error.message : 'ログ詳細の読み込みに失敗しました' 
            });
        }
    }

    private async _executeInTerminal(command: string) {
        const result = await terminalService.executeCommand(command);
        this._panel.webview.postMessage({ 
            command: 'terminalExecuteResponse', 
            ...result
        });
    }

    private async _searchLogs(projectId: string, filters: any) {
        try {
            const conversations = await conversationService.searchLogs(projectId, filters);
            this._panel.webview.postMessage({ 
                command: 'searchLogsResponse', 
                conversations 
            });
        } catch (error) {
            console.error('Search logs error:', error);
            this._panel.webview.postMessage({ 
                command: 'searchLogsResponse', 
                error: error instanceof Error ? error.message : '検索中にエラーが発生しました' 
            });
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Claude Code Logs';
        this._panel.webview.html = webviewService.getHtmlContent(
            { 
                cspSource: webview.cspSource, 
                asWebviewUri: (uri) => webview.asWebviewUri(vscode.Uri.file(uri.fsPath)).toString()
            },
            { fsPath: this._extensionUri.fsPath }
        );
    }


    private _setupFileWatcher() {
        const stopWatching = fileWatcherService.startWatching((event) => {
            this._panel.webview.postMessage(event);
        });
        // Disposableに変換
        const disposable = { dispose: stopWatching };
        this._disposables.push(disposable);
    }

    public dispose() {
        ClaudeLogsPanel.currentPanel = undefined;

        // ファイル監視を停止
        fileWatcherService.stopWatching();

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
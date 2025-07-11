import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export interface FileUpdateEvent {
    command: 'fileUpdate';
    eventType: 'create' | 'change' | 'delete';
    projectId: string;
    fileName: string;
    derivedFromFile: string | null;
}

export interface FileSystemWatcher {
    onDidCreate(handler: (uri: { fsPath: string }) => void): void;
    onDidChange(handler: (uri: { fsPath: string }) => void): void;
    onDidDelete(handler: (uri: { fsPath: string }) => void): void;
    dispose(): void;
}

export interface FileWatcherProvider {
    createFileSystemWatcher(pattern: string): FileSystemWatcher;
}

export class FileWatcherService {
    private fileWatcher: FileSystemWatcher | undefined;
    private updateTimer: NodeJS.Timeout | undefined;
    private onUpdateCallback: ((event: FileUpdateEvent) => void) | undefined;

    constructor(private fileWatcherProvider: FileWatcherProvider) {}

    /**
     * ファイル監視を開始する
     * @param onUpdate 更新時のコールバック
     * @returns 停止用の関数
     */
    public startWatching(onUpdate: (event: FileUpdateEvent) => void): () => void {
        this.onUpdateCallback = onUpdate;
        
        const claudeProjectsPath = path.join(os.homedir(), '.claude', 'projects');
        
        // ファイルウォッチャーの作成
        const pattern = `${claudeProjectsPath}/**/*.jsonl`;
        this.fileWatcher = this.fileWatcherProvider.createFileSystemWatcher(pattern);
        
        // デバウンス処理を行う関数
        const debounceUpdate = (eventType: 'create' | 'change' | 'delete', uri: { fsPath: string }) => {
            // 既存のタイマーをクリア
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            
            // 500ms後に更新通知を送信
            this.updateTimer = setTimeout(() => {
                this.notifyUpdate(eventType, uri);
            }, 500);
        };
        
        // ファイル変更イベントのハンドラ
        this.fileWatcher.onDidCreate(uri => debounceUpdate('create', uri));
        this.fileWatcher.onDidChange(uri => debounceUpdate('change', uri));
        this.fileWatcher.onDidDelete(uri => debounceUpdate('delete', uri));
        
        return () => this.stopWatching();
    }
    
    /**
     * ファイル監視を停止する
     */
    public stopWatching(): void {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = undefined;
        }
        
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }
        
        this.onUpdateCallback = undefined;
    }
    
    /**
     * 更新を通知する
     */
    private notifyUpdate(eventType: 'create' | 'change' | 'delete', uri: { fsPath: string }): void {
        // ファイルパスからプロジェクトIDを抽出
        const pathParts = uri.fsPath.split(path.sep);
        const projectsIndex = pathParts.indexOf('projects');
        
        if (projectsIndex >= 0 && projectsIndex < pathParts.length - 2) {
            const projectId = pathParts[projectsIndex + 1];
            const fileName = path.basename(uri.fsPath);
            
            // ファイルが変更された場合、既存ファイルからの派生かチェック
            let derivedFromFile: string | null = null;
            if (eventType === 'change' && fileName.endsWith('.jsonl')) {
                derivedFromFile = this.checkIfDerivedFile(projectId, fileName);
            }
            
            // コールバックを呼び出し
            if (this.onUpdateCallback) {
                this.onUpdateCallback({
                    command: 'fileUpdate',
                    eventType,
                    projectId,
                    fileName,
                    derivedFromFile
                });
            }
        }
    }
    
    /**
     * ファイルが既存ファイルから派生したものかチェックする
     */
    public checkIfDerivedFile(projectId: string, newFileName: string): string | null {
        try {
            const projectPath = path.join(os.homedir(), '.claude', 'projects', projectId);
            const newFilePath = path.join(projectPath, newFileName);
            
            // 新しいファイルが存在しない場合は処理しない
            if (!fs.existsSync(newFilePath)) {
                return null;
            }
            
            const newFileContent = fs.readFileSync(newFilePath, 'utf-8');
            const newLines = newFileContent.trim().split('\n').filter(line => line);
            
            // 新しいファイルのJSONエントリから他のsessionIdを検索
            const otherSessionIds = new Set<string>();
            const currentSessionId = newFileName.replace('.jsonl', '');
            
            newLines.forEach(line => {
                try {
                    const entry = JSON.parse(line);
                    if (entry.sessionId && entry.sessionId !== currentSessionId) {
                        otherSessionIds.add(entry.sessionId);
                    }
                } catch {
                    // JSONパースエラーは無視
                }
            });
            
            // 他のファイルでこれらのsessionIdを持つファイルを検索
            const files = fs.readdirSync(projectPath);
            const jsonlFiles = files.filter(file => file.endsWith('.jsonl') && file !== newFileName);
            
            // Array.fromを使ってループ
            const sessionIds = Array.from(otherSessionIds);
            
            for (const sessionId of sessionIds) {
                const sourceFile = jsonlFiles.find(file => file.replace('.jsonl', '') === sessionId);
                if (sourceFile) {
                    return sourceFile.replace('.jsonl', '');
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
}


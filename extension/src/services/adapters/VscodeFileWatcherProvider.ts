import * as vscode from 'vscode';
import { FileSystemWatcher, FileWatcherProvider } from '../FileWatcherService';

export class VscodeFileWatcherProvider implements FileWatcherProvider {
    createFileSystemWatcher(pattern: string): FileSystemWatcher {
        // patternを解析してベースパスとglobパターンに分割
        const pathParts = pattern.split('/**');
        const basePath = pathParts[0];
        const globPattern = pathParts[1] ? `**${pathParts[1]}` : '**/*';
        
        const relativePattern = new vscode.RelativePattern(basePath, globPattern);
        const watcher = vscode.workspace.createFileSystemWatcher(relativePattern);
        
        return {
            onDidCreate: (handler) => {
                const disposable = watcher.onDidCreate(uri => handler({ fsPath: uri.fsPath }));
                return disposable;
            },
            onDidChange: (handler) => {
                const disposable = watcher.onDidChange(uri => handler({ fsPath: uri.fsPath }));
                return disposable;
            },
            onDidDelete: (handler) => {
                const disposable = watcher.onDidDelete(uri => handler({ fsPath: uri.fsPath }));
                return disposable;
            },
            dispose: () => watcher.dispose()
        };
    }
}

export const vscodeFileWatcherProvider = new VscodeFileWatcherProvider();
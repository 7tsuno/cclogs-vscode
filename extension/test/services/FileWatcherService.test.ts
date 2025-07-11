import * as assert from 'assert';
import { FileWatcherService, FileSystemWatcher, FileWatcherProvider, FileUpdateEvent } from '../../src/services/FileWatcherService';

// fsモジュールをモック
jest.mock('fs');
import * as fs from 'fs';

// osモジュールをモック
jest.mock('os');
import * as os from 'os';

describe('FileWatcherService', () => {
    let service: FileWatcherService;
    let mockFileWatcher: FileSystemWatcher;
    let mockFileWatcherProvider: FileWatcherProvider;
    let onDidCreateHandler: (uri: { fsPath: string }) => void;
    let onDidChangeHandler: (uri: { fsPath: string }) => void;
    let onDidDeleteHandler: (uri: { fsPath: string }) => void; // eslint-disable-line @typescript-eslint/no-unused-vars

    beforeEach(() => {
        // os.homedirのモック
        (os.homedir as jest.Mock).mockReturnValue('/mock/home');
        
        // モックファイルウォッチャーの設定
        mockFileWatcher = {
            onDidCreate: jest.fn((handler) => { onDidCreateHandler = handler; }),
            onDidChange: jest.fn((handler) => { onDidChangeHandler = handler; }),
            onDidDelete: jest.fn((handler) => { onDidDeleteHandler = handler; }),
            dispose: jest.fn()
        };
        
        // モックプロバイダーの設定
        mockFileWatcherProvider = {
            createFileSystemWatcher: jest.fn().mockReturnValue(mockFileWatcher)
        };
        
        service = new FileWatcherService(mockFileWatcherProvider);
        
        // fs関数のモックをリセット
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('startWatching', () => {
        it('ファイルウォッチャーを正しく作成する', () => {
            const onUpdate = jest.fn();
            service.startWatching(onUpdate);
            
            assert.strictEqual((mockFileWatcherProvider.createFileSystemWatcher as jest.Mock).mock.calls.length, 1);
            assert.strictEqual(
                (mockFileWatcherProvider.createFileSystemWatcher as jest.Mock).mock.calls[0][0],
                '/mock/home/.claude/projects/**/*.jsonl'
            );
        });

        it('ファイル作成イベントがデバウンスされて通知される', () => {
            const onUpdate = jest.fn();
            service.startWatching(onUpdate);
            
            // ファイル作成イベントを発火
            onDidCreateHandler({ fsPath: '/mock/home/.claude/projects/test-project/session-1.jsonl' });
            
            // すぐには呼ばれない
            assert.strictEqual(onUpdate.mock.calls.length, 0);
            
            // 500ms後に呼ばれる
            jest.advanceTimersByTime(500);
            assert.strictEqual(onUpdate.mock.calls.length, 1);
            
            const event = onUpdate.mock.calls[0][0] as FileUpdateEvent;
            assert.strictEqual(event.command, 'fileUpdate');
            assert.strictEqual(event.eventType, 'create');
            assert.strictEqual(event.projectId, 'test-project');
            assert.strictEqual(event.fileName, 'session-1.jsonl');
        });

        it('複数のイベントがデバウンスされる', () => {
            const onUpdate = jest.fn();
            service.startWatching(onUpdate);
            
            // 短時間に複数のイベントを発火
            onDidChangeHandler({ fsPath: '/mock/home/.claude/projects/test-project/session-1.jsonl' });
            jest.advanceTimersByTime(100);
            onDidChangeHandler({ fsPath: '/mock/home/.claude/projects/test-project/session-1.jsonl' });
            jest.advanceTimersByTime(100);
            onDidChangeHandler({ fsPath: '/mock/home/.claude/projects/test-project/session-1.jsonl' });
            
            // まだ呼ばれない
            assert.strictEqual(onUpdate.mock.calls.length, 0);
            
            // 最後のイベントから500ms後に1回だけ呼ばれる
            jest.advanceTimersByTime(500);
            assert.strictEqual(onUpdate.mock.calls.length, 1);
        });

        it('派生ファイルをチェックする', () => {
            // すべてのモックを事前に設定
            (os.homedir as jest.Mock).mockReturnValue('/mock/home');
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readdirSync as jest.Mock).mockReturnValue(['session-a.jsonl', 'session-b.jsonl']);
            (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
                if (filePath.includes('session-b.jsonl')) {
                    return '{"sessionId": "session-a"}\n{"sessionId": "session-b"}';
                }
                return '';
            });
            
            const onUpdate = jest.fn();
            service.startWatching(onUpdate);
            
            // 変更イベントを発火
            onDidChangeHandler({ fsPath: '/mock/home/.claude/projects/test-project/session-b.jsonl' });
            jest.advanceTimersByTime(500);
            
            // 結果を確認
            assert.strictEqual(onUpdate.mock.calls.length, 1);
            const event = onUpdate.mock.calls[0][0] as FileUpdateEvent;
            
            assert.strictEqual(event.command, 'fileUpdate');
            assert.strictEqual(event.eventType, 'change');
            assert.strictEqual(event.projectId, 'test-project');
            assert.strictEqual(event.fileName, 'session-b.jsonl');
            
            // 派生ファイルが正しく検出される
            assert.strictEqual(event.derivedFromFile, 'session-a');
        });

        it('stopWatching関数が返される', () => {
            const onUpdate = jest.fn();
            const stopWatching = service.startWatching(onUpdate);
            
            assert.strictEqual(typeof stopWatching, 'function');
            
            // 停止前はdisposeが呼ばれていない
            assert.strictEqual((mockFileWatcher.dispose as jest.Mock).mock.calls.length, 0);
            
            // 停止を実行
            stopWatching();
            
            // disposeが呼ばれる
            assert.strictEqual((mockFileWatcher.dispose as jest.Mock).mock.calls.length, 1);
        });
    });

    describe('stopWatching', () => {
        it('ファイルウォッチャーを正しく停止する', () => {
            const onUpdate = jest.fn();
            service.startWatching(onUpdate);
            
            // タイマーを設定
            onDidCreateHandler({ fsPath: '/mock/home/.claude/projects/test-project/session-1.jsonl' });
            
            service.stopWatching();
            
            // disposeが呼ばれる
            assert.strictEqual((mockFileWatcher.dispose as jest.Mock).mock.calls.length, 1);
            
            // タイマーがクリアされるため、時間が経過してもコールバックは呼ばれない
            jest.advanceTimersByTime(1000);
            assert.strictEqual(onUpdate.mock.calls.length, 0);
        });
    });

});
import * as assert from 'assert';
import { FileWatcherService } from '../../src/services/FileWatcherService';
import * as fs from 'fs';
import * as os from 'os';

jest.mock('fs');
jest.mock('os');

describe('FileWatcherService - checkIfDerivedFile', () => {
    let service: FileWatcherService;

    beforeEach(() => {
        const mockProvider = {
            createFileSystemWatcher: jest.fn()
        };
        service = new FileWatcherService(mockProvider);
        
        (os.homedir as jest.Mock).mockReturnValue('/home');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('ファイルが存在しない場合、nullを返す', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        
        const result = service.checkIfDerivedFile('project', 'file.jsonl');
        
        assert.strictEqual(result, null);
    });

    it('空のファイルの場合、nullを返す', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('');
        (fs.readdirSync as jest.Mock).mockReturnValue([]);
        
        const result = service.checkIfDerivedFile('project', 'file.jsonl');
        
        assert.strictEqual(result, null);
    });

    it('派生ファイルが存在する場合、元のセッションIDを返す', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('{"sessionId": "session-a"}\n{"sessionId": "session-b"}');
        (fs.readdirSync as jest.Mock).mockReturnValue(['session-a.jsonl', 'session-b.jsonl']);
        
        const result = service.checkIfDerivedFile('project', 'session-b.jsonl');
        
        assert.strictEqual(result, 'session-a');
    });

    it('複数の派生元がある場合、最初に見つかったものを返す', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('{"sessionId": "session-a"}\n{"sessionId": "session-c"}\n{"sessionId": "session-d"}');
        (fs.readdirSync as jest.Mock).mockReturnValue(['session-a.jsonl', 'session-c.jsonl', 'session-d.jsonl']);
        
        const result = service.checkIfDerivedFile('project', 'session-d.jsonl');
        
        assert.strictEqual(result, 'session-a');
    });

    it('不正なJSONがある場合でも処理を継続する', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('invalid json\n{"sessionId": "session-a"}\n{"sessionId": "session-b"}');
        (fs.readdirSync as jest.Mock).mockReturnValue(['session-a.jsonl', 'session-b.jsonl']);
        
        const result = service.checkIfDerivedFile('project', 'session-b.jsonl');
        
        assert.strictEqual(result, 'session-a');
    });

    it('自分自身のsessionIdは除外される', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('{"sessionId": "session-b"}\n{"sessionId": "session-b"}');
        (fs.readdirSync as jest.Mock).mockReturnValue(['session-b.jsonl']);
        
        const result = service.checkIfDerivedFile('project', 'session-b.jsonl');
        
        assert.strictEqual(result, null);
    });

    it('派生ファイルが存在しない場合、nullを返す', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('{"sessionId": "session-b"}');
        (fs.readdirSync as jest.Mock).mockReturnValue(['session-b.jsonl']);
        
        const result = service.checkIfDerivedFile('project', 'session-b.jsonl');
        
        assert.strictEqual(result, null);
    });

    it('エラーが発生した場合、nullを返す', () => {
        (fs.existsSync as jest.Mock).mockImplementation(() => {
            throw new Error('File system error');
        });
        
        const result = service.checkIfDerivedFile('project', 'file.jsonl');
        
        assert.strictEqual(result, null);
    });
});
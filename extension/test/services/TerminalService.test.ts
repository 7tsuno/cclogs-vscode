import * as assert from 'assert';
import { TerminalService, Terminal, TerminalProvider } from '../../src/services/TerminalService';

describe('TerminalService', () => {
    let service: TerminalService;
    let mockTerminal: Terminal;
    let mockTerminalProvider: TerminalProvider;

    beforeEach(() => {
        // モックターミナルの設定
        mockTerminal = {
            show: jest.fn(),
            sendText: jest.fn()
        };
        
        // モックプロバイダーの設定
        mockTerminalProvider = {
            getActiveTerminal: jest.fn(),
            createTerminal: jest.fn().mockReturnValue(mockTerminal)
        };
        
        service = new TerminalService(mockTerminalProvider);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executeCommand', () => {
        it('アクティブなターミナルがある場合はそれを使用する', async () => {
            // アクティブなターミナルを返すように設定
            (mockTerminalProvider.getActiveTerminal as jest.Mock).mockReturnValue(mockTerminal);
            
            const result = await service.executeCommand('test command');
            
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'コマンドをターミナルに送信しました');
            assert.strictEqual((mockTerminalProvider.createTerminal as jest.Mock).mock.calls.length, 0);
            assert.strictEqual((mockTerminal.show as jest.Mock).mock.calls.length, 1);
            assert.strictEqual((mockTerminal.sendText as jest.Mock).mock.calls.length, 1);
            assert.strictEqual((mockTerminal.sendText as jest.Mock).mock.calls[0][0], 'test command');
        });

        it('アクティブなターミナルがない場合は新規作成する', async () => {
            // アクティブなターミナルがないように設定
            (mockTerminalProvider.getActiveTerminal as jest.Mock).mockReturnValue(undefined);
            
            const result = await service.executeCommand('test command');
            
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'コマンドをターミナルに送信しました');
            assert.strictEqual((mockTerminalProvider.createTerminal as jest.Mock).mock.calls.length, 1);
            assert.strictEqual((mockTerminalProvider.createTerminal as jest.Mock).mock.calls[0][0], 'Claude Code');
            assert.strictEqual((mockTerminal.show as jest.Mock).mock.calls.length, 1);
            assert.strictEqual((mockTerminal.sendText as jest.Mock).mock.calls.length, 1);
        });

        it('エラーが発生した場合は失敗を返す', async () => {
            // sendTextでエラーをスロー
            (mockTerminal.sendText as jest.Mock).mockImplementation(() => {
                throw new Error('Terminal error');
            });
            (mockTerminalProvider.getActiveTerminal as jest.Mock).mockReturnValue(mockTerminal);
            
            const result = await service.executeCommand('test command');
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.message, 'Terminal error');
        });
    });
});
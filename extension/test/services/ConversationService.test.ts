import * as assert from 'assert';
import { ConversationService, ConversationInfo } from '../../src/services/ConversationService';

// fsモジュールをモック
jest.mock('fs');
import * as fs from 'fs';

describe('ConversationService', () => {
    let service: ConversationService;
    let mockFiles: { [path: string]: string } = {};
    const projectPath = '/mock/project/path';

    beforeEach(() => {
        service = new ConversationService();
        service.clearCache(); // テストごとにキャッシュをクリア
        mockFiles = {};
        (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
            if (mockFiles[path]) {
                return mockFiles[path];
            }
            throw new Error(`ENOENT: no such file or directory, open '${path}'`);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        service.clearCache(); // テスト後もキャッシュをクリア
    });

    // モックファイルを追加するヘルパー
    function addMockFile(path: string, entries: any[]): void {
        const content = entries.map(entry => JSON.stringify(entry)).join('\n');
        mockFiles[path] = content;
    }

    describe('filterConsolidatedConversations', () => {
        it('統合されていない会話は全て残す', () => {
            // 独立した2つの会話を作成
            addMockFile(`${projectPath}/session-a.jsonl`, [
                { timestamp: '2024-01-01T10:00:00Z', type: 'message', sessionId: 'session-a' }
            ]);
            addMockFile(`${projectPath}/session-b.jsonl`, [
                { timestamp: '2024-01-01T11:00:00Z', type: 'message', sessionId: 'session-b' }
            ]);

            const conversations: ConversationInfo[] = [
                {
                    conversationId: 'session-a',
                    fileName: 'session-a.jsonl',
                    startTime: '2024-01-01T10:00:00Z',
                    endTime: '2024-01-01T10:30:00Z',
                    entriesCount: 1
                },
                {
                    conversationId: 'session-b',
                    fileName: 'session-b.jsonl',
                    startTime: '2024-01-01T11:00:00Z',
                    endTime: '2024-01-01T11:30:00Z',
                    entriesCount: 1
                }
            ];

            const filtered = service.filterConsolidatedConversations(conversations, projectPath);
            assert.strictEqual(filtered.length, 2);
        });

        it('統合された古い会話を除外する', () => {
            // session-aが後でsession-cに統合されたケース
            addMockFile(`${projectPath}/session-a.jsonl`, [
                { timestamp: '2024-01-01T10:00:00Z', type: 'message', sessionId: 'session-a' }
            ]);
            addMockFile(`${projectPath}/session-c.jsonl`, [
                { timestamp: '2024-01-01T12:00:00Z', type: 'message', sessionId: 'session-c' },
                { timestamp: '2024-01-01T12:01:00Z', type: 'message', sessionId: 'session-a' }
            ]);

            const conversations: ConversationInfo[] = [
                {
                    conversationId: 'session-a',
                    fileName: 'session-a.jsonl',
                    startTime: '2024-01-01T10:00:00Z',
                    endTime: '2024-01-01T10:30:00Z',
                    entriesCount: 1
                },
                {
                    conversationId: 'session-c',
                    fileName: 'session-c.jsonl',
                    startTime: '2024-01-01T12:00:00Z',
                    endTime: '2024-01-01T12:30:00Z',
                    entriesCount: 2
                }
            ];

            const filtered = service.filterConsolidatedConversations(conversations, projectPath);
            assert.strictEqual(filtered.length, 1);
            assert.strictEqual(filtered[0].conversationId, 'session-c');
        });

        it('複数の統合がある場合、最新のものだけを残す', () => {
            // session-aがsession-bに統合され、その後session-cに統合されたケース
            addMockFile(`${projectPath}/session-a.jsonl`, [
                { timestamp: '2024-01-01T10:00:00Z', type: 'message', sessionId: 'session-a' }
            ]);
            addMockFile(`${projectPath}/session-b.jsonl`, [
                { timestamp: '2024-01-01T11:00:00Z', type: 'message', sessionId: 'session-b' },
                { timestamp: '2024-01-01T11:01:00Z', type: 'message', sessionId: 'session-a' }
            ]);
            addMockFile(`${projectPath}/session-c.jsonl`, [
                { timestamp: '2024-01-01T12:00:00Z', type: 'message', sessionId: 'session-c' },
                { timestamp: '2024-01-01T12:01:00Z', type: 'message', sessionId: 'session-b' },
                { timestamp: '2024-01-01T12:02:00Z', type: 'message', sessionId: 'session-a' }
            ]);

            const conversations: ConversationInfo[] = [
                {
                    conversationId: 'session-a',
                    fileName: 'session-a.jsonl',
                    startTime: '2024-01-01T10:00:00Z',
                    endTime: '2024-01-01T10:30:00Z',
                    entriesCount: 1
                },
                {
                    conversationId: 'session-b',
                    fileName: 'session-b.jsonl',
                    startTime: '2024-01-01T11:00:00Z',
                    endTime: '2024-01-01T11:30:00Z',
                    entriesCount: 2
                },
                {
                    conversationId: 'session-c',
                    fileName: 'session-c.jsonl',
                    startTime: '2024-01-01T12:00:00Z',
                    endTime: '2024-01-01T12:30:00Z',
                    entriesCount: 3
                }
            ];

            const filtered = service.filterConsolidatedConversations(conversations, projectPath);
            assert.strictEqual(filtered.length, 1);
            assert.strictEqual(filtered[0].conversationId, 'session-c');
        });

        it('不正なJSONがある場合でも処理を続行する', () => {
            // 不正なJSON行を含むファイル
            mockFiles[`${projectPath}/session-a.jsonl`] = 
                '{"timestamp":"2024-01-01T10:00:00Z","type":"message","sessionId":"session-a"}\n' +
                'invalid json line\n' +
                '{"timestamp":"2024-01-01T10:01:00Z","type":"message"}';
            
            addMockFile(`${projectPath}/session-b.jsonl`, [
                { timestamp: '2024-01-01T11:00:00Z', type: 'message', sessionId: 'session-b' }
            ]);

            const conversations: ConversationInfo[] = [
                {
                    conversationId: 'session-a',
                    fileName: 'session-a.jsonl',
                    startTime: '2024-01-01T10:00:00Z',
                    endTime: '2024-01-01T10:30:00Z',
                    entriesCount: 2
                },
                {
                    conversationId: 'session-b',
                    fileName: 'session-b.jsonl',
                    startTime: '2024-01-01T11:00:00Z',
                    endTime: '2024-01-01T11:30:00Z',
                    entriesCount: 1
                }
            ];

            const filtered = service.filterConsolidatedConversations(conversations, projectPath);
            assert.strictEqual(filtered.length, 2);
        });

        it('ファイルが存在しない場合エラーにならずに元のリストを返す', () => {
            const conversations: ConversationInfo[] = [
                {
                    conversationId: 'non-existent',
                    fileName: 'non-existent.jsonl',
                    startTime: '2024-01-01T10:00:00Z',
                    endTime: '2024-01-01T10:30:00Z',
                    entriesCount: 1
                }
            ];

            const filtered = service.filterConsolidatedConversations(conversations, projectPath);
            assert.strictEqual(filtered.length, 1);
        });

        it('循環参照がある場合、古い方を除外する', () => {
            // session-aとsession-bが互いに参照し合うケース
            addMockFile(`${projectPath}/session-a.jsonl`, [
                { timestamp: '2024-01-01T10:00:00Z', type: 'message', sessionId: 'session-a' },
                { timestamp: '2024-01-01T10:01:00Z', type: 'message', sessionId: 'session-b' }
            ]);
            addMockFile(`${projectPath}/session-b.jsonl`, [
                { timestamp: '2024-01-01T11:00:00Z', type: 'message', sessionId: 'session-b' },
                { timestamp: '2024-01-01T11:01:00Z', type: 'message', sessionId: 'session-a' }
            ]);

            const conversations: ConversationInfo[] = [
                {
                    conversationId: 'session-a',
                    fileName: 'session-a.jsonl',
                    startTime: '2024-01-01T10:00:00Z',
                    endTime: '2024-01-01T10:30:00Z',
                    entriesCount: 2
                },
                {
                    conversationId: 'session-b',
                    fileName: 'session-b.jsonl',
                    startTime: '2024-01-01T11:00:00Z',
                    endTime: '2024-01-01T11:30:00Z',
                    entriesCount: 2
                }
            ];

            const filtered = service.filterConsolidatedConversations(conversations, projectPath);
            assert.strictEqual(filtered.length, 1);
            assert.strictEqual(filtered[0].conversationId, 'session-b'); // 新しい方が残る
        });

        it('キャッシュが正しく機能し、2回目の呼び出しでファイル読み込みが削減される', () => {
            // 統合された会話を設定
            addMockFile(`${projectPath}/session-a.jsonl`, [
                { timestamp: '2024-01-01T10:00:00Z', type: 'message', sessionId: 'session-a' }
            ]);
            addMockFile(`${projectPath}/session-b.jsonl`, [
                { timestamp: '2024-01-01T11:00:00Z', type: 'message', sessionId: 'session-b' },
                { timestamp: '2024-01-01T11:01:00Z', type: 'message', sessionId: 'session-a' }
            ]);

            const conversations: ConversationInfo[] = [
                {
                    conversationId: 'session-a',
                    fileName: 'session-a.jsonl',
                    startTime: '2024-01-01T10:00:00Z',
                    endTime: '2024-01-01T10:30:00Z',
                    entriesCount: 1
                },
                {
                    conversationId: 'session-b',
                    fileName: 'session-b.jsonl',
                    startTime: '2024-01-01T11:00:00Z',
                    endTime: '2024-01-01T11:30:00Z',
                    entriesCount: 2
                }
            ];

            // 1回目の呼び出し
            const filtered1 = service.filterConsolidatedConversations(conversations, projectPath);
            assert.strictEqual(filtered1.length, 1);
            assert.strictEqual(filtered1[0].conversationId, 'session-b');
            
            // readFileSyncの呼び出し回数を記録
            const callCountAfterFirst = (fs.readFileSync as jest.Mock).mock.calls.length;
            
            // 2回目の呼び出し（同じデータ）
            const filtered2 = service.filterConsolidatedConversations(conversations, projectPath);
            assert.strictEqual(filtered2.length, 1);
            assert.strictEqual(filtered2[0].conversationId, 'session-b');
            
            // 2回目はキャッシュが効いているため、readFileSyncの呼び出しが少なくなるはず
            const callCountAfterSecond = (fs.readFileSync as jest.Mock).mock.calls.length;
            assert.ok(callCountAfterSecond < callCountAfterFirst * 2, 
                `Second call should use cache. First: ${callCountAfterFirst}, Second: ${callCountAfterSecond}`);
        });
    });

    describe('getConversationDetail', () => {
        it('ログファイルが見つからない場合はエラーをスロー', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['other-file.jsonl']);
            
            await assert.rejects(
                async () => await service.getConversationDetail('test-project', 'missing-log'),
                /ログファイルが見つかりません/
            );
        });

        it('シンプルなメッセージエントリを正しく処理する', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['test-log.jsonl']);
            
            const mockContent = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    type: 'message',
                    message: {
                        role: 'user',
                        content: 'Hello, Claude!'
                    }
                },
                {
                    timestamp: '2024-01-01T10:00:01Z',
                    type: 'message',
                    message: {
                        role: 'assistant',
                        content: 'Hello! How can I help you?',
                        model: 'claude-3-opus-20240229'
                    }
                }
            ].map(entry => JSON.stringify(entry)).join('\n');
            
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            
            const result = await service.getConversationDetail('test-project', 'test-log');
            
            assert.strictEqual(result.conversationId, 'test-log');
            assert.strictEqual(result.startTime, '2024-01-01T10:00:00Z');
            assert.strictEqual(result.endTime, '2024-01-01T10:00:01Z');
            assert.strictEqual(result.entries.length, 2);
            
            assert.strictEqual(result.entries[0].type, 'user');
            assert.strictEqual(result.entries[0].content, 'Hello, Claude!');
            
            assert.strictEqual(result.entries[1].type, 'assistant');
            assert.strictEqual(result.entries[1].content, 'Hello! How can I help you?');
            assert.strictEqual(result.entries[1].model, 'claude-3-opus-20240229');
        });

        it('thinking付きのメッセージを正しく処理する', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['thinking-log.jsonl']);
            
            const mockContent = JSON.stringify({
                timestamp: '2024-01-01T10:00:00Z',
                type: 'message',
                message: {
                    role: 'assistant',
                    content: [
                        { type: 'thinking', thinking: 'Let me think about this...' },
                        { type: 'text', text: 'Here is my response.' }
                    ]
                }
            });
            
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            
            const result = await service.getConversationDetail('test-project', 'thinking-log');
            
            assert.strictEqual(result.entries.length, 1);
            assert.strictEqual(result.entries[0].content, 'Here is my response.');
            assert.strictEqual(result.entries[0].thinking, 'Let me think about this...');
        });

        it('ツール実行結果を正しく処理する', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['tool-log.jsonl']);
            
            const mockContent = [
                {
                    timestamp: '2024-01-01T10:00:00Z',
                    type: 'tool_result',
                    toolUseResult: 'Command executed successfully'
                },
                {
                    timestamp: '2024-01-01T10:00:01Z',
                    type: 'tool_result',
                    toolUseResult: { status: 'success', output: 'test output' }
                }
            ].map(entry => JSON.stringify(entry)).join('\n');
            
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            
            const result = await service.getConversationDetail('test-project', 'tool-log');
            
            assert.strictEqual(result.entries.length, 2);
            assert.strictEqual(result.entries[0].type, 'tool_result');
            assert.strictEqual(result.entries[0].content, 'Command executed successfully');
            
            assert.strictEqual(result.entries[1].type, 'tool_result');
            assert.ok(result.entries[1].content.includes('"status": "success"'));
        });

        it('summaryエントリを正しく処理する', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['summary-log.jsonl']);
            
            const mockContent = JSON.stringify({
                timestamp: '2024-01-01T10:00:00Z',
                type: 'summary',
                summary: 'This is a conversation summary'
            });
            
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            
            const result = await service.getConversationDetail('test-project', 'summary-log');
            
            assert.strictEqual(result.entries.length, 1);
            assert.strictEqual(result.entries[0].type, 'summary');
            assert.strictEqual(result.entries[0].content, 'This is a conversation summary');
        });

        it('メタ情報エントリを除外する', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['meta-log.jsonl']);
            
            const mockContent = [
                { isMeta: true, version: '1.0' },
                { timestamp: '2024-01-01T10:00:00Z', type: 'message', message: { role: 'user', content: 'test' } }
            ].map(entry => JSON.stringify(entry)).join('\n');
            
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            
            const result = await service.getConversationDetail('test-project', 'meta-log');
            
            assert.strictEqual(result.entries.length, 1);
            assert.strictEqual(result.entries[0].content, 'test');
        });

        it('不正なJSONを含む行をスキップする', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['invalid-log.jsonl']);
            
            const mockContent = [
                '{ invalid json',
                JSON.stringify({ timestamp: '2024-01-01T10:00:00Z', type: 'message', message: { role: 'user', content: 'valid' } }),
                'not json at all'
            ].join('\n');
            
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            
            const result = await service.getConversationDetail('test-project', 'invalid-log');
            
            assert.strictEqual(result.entries.length, 1);
            assert.strictEqual(result.entries[0].content, 'valid');
        });

        it('conversationIdを含むファイル名でも検索できる', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue([
                'session-abc-123.jsonl',
                'session-def-456.jsonl'
            ]);
            
            const mockContent = JSON.stringify({
                timestamp: '2024-01-01T10:00:00Z',
                type: 'message',
                message: { role: 'user', content: 'test' }
            });
            
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            
            const result = await service.getConversationDetail('test-project', 'abc');
            
            assert.strictEqual(result.conversationId, 'abc');
            assert.strictEqual(result.entries.length, 1);
        });
    });
});
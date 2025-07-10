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
    });
});
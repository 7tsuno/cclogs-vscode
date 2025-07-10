import * as path from 'path';
import * as fs from 'fs';

export interface ConversationInfo {
    conversationId: string;
    fileName: string;
    startTime: string;
    endTime: string;
    entriesCount: number;
    preview?: any[];
}

interface LogEntry {
    sessionId?: string;
    timestamp?: string;
    type?: string;
    [key: string]: any;
}

export class ConversationService {
    // ファイル内容のキャッシュ（sessionId配列のみ保持）
    private fileSessionIdCache = new Map<string, Set<string>>();

    /**
     * 統合された会話をフィルタリングする
     * 
     * @param conversations 会話情報のリスト
     * @param projectPath プロジェクトのパス
     * @returns フィルタリング後の会話リスト
     */
    public filterConsolidatedConversations(
        conversations: ConversationInfo[], 
        projectPath: string
    ): ConversationInfo[] {
        try {
            // キャッシュをクリア（新しい処理の開始）
            this.fileSessionIdCache.clear();
            
            // 1. 各ファイルのsessionIdを事前に収集
            const fileSessionIds = this.collectAllSessionIds(conversations, projectPath);
            
            // 2. 統合されたファイルを判定
            const consolidatedFiles = new Set<string>();
            
            conversations.forEach(convA => {
                const sessionIdA = convA.conversationId;
                
                // 他のファイルにこのsessionIdが含まれているかチェック
                conversations.forEach(convB => {
                    if (convA.conversationId === convB.conversationId) return;
                    
                    const sessionIdsInB = fileSessionIds.get(convB.conversationId);
                    if (sessionIdsInB && sessionIdsInB.has(sessionIdA)) {
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
        } finally {
            // メモリクリーンアップ
            this.fileSessionIdCache.clear();
        }
    }
    
    /**
     * 全ファイルのsessionIdを事前に収集
     */
    private collectAllSessionIds(
        conversations: ConversationInfo[], 
        projectPath: string
    ): Map<string, Set<string>> {
        const fileSessionIds = new Map<string, Set<string>>();
        
        conversations.forEach(conv => {
            const filePath = path.join(projectPath, conv.fileName);
            const sessionIds = this.extractSessionIdsFromFile(filePath);
            fileSessionIds.set(conv.conversationId, sessionIds);
        });
        
        return fileSessionIds;
    }
    
    /**
     * ファイルからsessionIdを抽出（キャッシュ付き）
     */
    private extractSessionIdsFromFile(filePath: string): Set<string> {
        // キャッシュをチェック
        if (this.fileSessionIdCache.has(filePath)) {
            return this.fileSessionIdCache.get(filePath)!;
        }
        
        const sessionIds = new Set<string>();
        
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line);
            
            lines.forEach(line => {
                try {
                    const entry: LogEntry = JSON.parse(line);
                    if (entry.sessionId) {
                        sessionIds.add(entry.sessionId);
                    }
                } catch {
                    // JSONパースエラーは無視
                }
            });
        } catch (error) {
            // ファイル読み込みエラーは無視
            console.debug(`Error reading file ${filePath}:`, error);
        }
        
        // キャッシュに保存
        this.fileSessionIdCache.set(filePath, sessionIds);
        return sessionIds;
    }
}

// シングルトンインスタンスとしてエクスポート
export const conversationService = new ConversationService();
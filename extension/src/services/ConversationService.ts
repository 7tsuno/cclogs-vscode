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
    // 統合済みファイルのキャッシュ（プロジェクトパス -> 統合済みconversationIdのSet）
    private consolidatedCache = new Map<string, Set<string>>();
    
    // ファイルのsessionIdキャッシュ（ファイルパス -> sessionIdのSet）
    // 統合済みファイルは変更されないため、永続的にキャッシュ可能
    private permanentSessionIdCache = new Map<string, Set<string>>();

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
            // キャッシュから既知の統合済みファイルを取得
            const cachedConsolidated = this.consolidatedCache.get(projectPath) || new Set<string>();
            
            // 既にキャッシュ済みの統合ファイルを最初に除外
            const activeConversations = conversations.filter(conv => !cachedConsolidated.has(conv.conversationId));
            
            // 全て除外済みの場合は早期リターン
            if (activeConversations.length === 0) {
                return activeConversations;
            }
            
            // ファイル内容のキャッシュ（このメソッド実行中のみ有効）
            const tempSessionIdCache = new Map<string, Set<string>>();
            
            // 1. アクティブな会話のsessionIdのみを収集（永続キャッシュも活用）
            const fileSessionIds = this.collectAllSessionIds(activeConversations, projectPath, tempSessionIdCache);
            
            // 2. 新たに統合されたファイルを判定
            const newConsolidatedFiles = new Set<string>();
            
            activeConversations.forEach(convA => {
                const sessionIdA = convA.conversationId;
                
                // 他のファイルにこのsessionIdが含まれているかチェック
                activeConversations.forEach(convB => {
                    if (convA.conversationId === convB.conversationId) return;
                    
                    const sessionIdsInB = fileSessionIds.get(convB.conversationId);
                    if (sessionIdsInB && sessionIdsInB.has(sessionIdA)) {
                        // sessionIdAが他のファイルのJSONエントリに含まれている場合、古い方を除外
                        const older = convA.endTime < convB.endTime ? convA : convB;
                        newConsolidatedFiles.add(older.conversationId);
                        
                        // 統合済みファイルのsessionIdを永続キャッシュに移動
                        const olderPath = path.join(projectPath, older.fileName);
                        if (tempSessionIdCache.has(olderPath)) {
                            this.permanentSessionIdCache.set(olderPath, tempSessionIdCache.get(olderPath)!);
                        }
                    }
                });
            });
            
            // キャッシュを更新（既存のキャッシュと新規の統合ファイルをマージ）
            const allConsolidated = new Set([...cachedConsolidated, ...newConsolidatedFiles]);
            this.consolidatedCache.set(projectPath, allConsolidated);
            
            // アクティブな会話から新たに統合されたものを除外
            return activeConversations.filter(conv => !newConsolidatedFiles.has(conv.conversationId));
        } catch (error) {
            console.error('Consolidation filter error:', error);
            return conversations; // エラー時は元のリストを返す
        }
    }
    
    /**
     * 全ファイルのsessionIdを事前に収集
     */
    private collectAllSessionIds(
        conversations: ConversationInfo[], 
        projectPath: string,
        fileSessionIdCache: Map<string, Set<string>>
    ): Map<string, Set<string>> {
        const fileSessionIds = new Map<string, Set<string>>();
        
        conversations.forEach(conv => {
            const filePath = path.join(projectPath, conv.fileName);
            const sessionIds = this.extractSessionIdsFromFile(filePath, fileSessionIdCache);
            fileSessionIds.set(conv.conversationId, sessionIds);
        });
        
        return fileSessionIds;
    }
    
    /**
     * ファイルからsessionIdを抽出（キャッシュ付き）
     */
    private extractSessionIdsFromFile(
        filePath: string,
        tempSessionIdCache: Map<string, Set<string>>
    ): Set<string> {
        // 永続キャッシュをチェック
        if (this.permanentSessionIdCache.has(filePath)) {
            return this.permanentSessionIdCache.get(filePath)!;
        }
        
        // 一時キャッシュをチェック
        if (tempSessionIdCache.has(filePath)) {
            return tempSessionIdCache.get(filePath)!;
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
        
        // 一時キャッシュに保存
        tempSessionIdCache.set(filePath, sessionIds);
        
        // このファイルが統合済みとして判定されたら、永続キャッシュに移動される
        return sessionIds;
    }
    
    /**
     * キャッシュをクリアする（テストやデバッグ用）
     */
    public clearCache(): void {
        this.consolidatedCache.clear();
        this.permanentSessionIdCache.clear();
    }
}

// シングルトンインスタンスとしてエクスポート
export const conversationService = new ConversationService();
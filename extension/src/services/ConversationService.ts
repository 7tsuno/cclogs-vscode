import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface ConversationInfo {
    conversationId: string;
    fileName: string;
    startTime: string;
    endTime: string;
    entriesCount: number;
    preview?: any[];
}

export interface ConversationEntry {
    id: string;
    timestamp: string;
    type: string;
    content: string;
    metadata?: any;
    model?: string;
    thinking?: string;
}

export interface ConversationDetail {
    conversationId: string;
    startTime: string;
    endTime: string;
    entries: ConversationEntry[];
}

interface LogEntry {
    sessionId?: string;
    timestamp?: string;
    type?: string;
    isMeta?: boolean;
    message?: {
        role?: string;
        content?: string | Array<{ type: string; text?: string; thinking?: string }>;
        model?: string;
    };
    toolUseResult?: any;
    summary?: string;
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
     * 指定された会話の詳細を取得する
     * @param projectId プロジェクトID
     * @param conversationId 会話ID
     * @returns 会話の詳細情報
     */
    public async getConversationDetail(projectId: string, conversationId: string): Promise<ConversationDetail> {
        const projectPath = path.join(os.homedir(), '.claude', 'projects', projectId);
        const files = fs.readdirSync(projectPath);
        const targetFile = files.find(file => 
            file.includes(conversationId) || file.replace('.jsonl', '') === conversationId
        );

        if (!targetFile) {
            throw new Error('ログファイルが見つかりません');
        }

        const filePath = path.join(projectPath, targetFile);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line);
        
        const entries: ConversationEntry[] = [];
        let startTime = '';
        let endTime = '';
        
        lines.forEach((line, index) => {
            try {
                const entry: LogEntry = JSON.parse(line);

                // メタ情報のエントリは除外
                if (entry.isMeta) {
                    return;
                }

                // タイムスタンプの更新
                if (entry.timestamp) {
                    if (!startTime || entry.timestamp < startTime) {
                        startTime = entry.timestamp;
                    }
                    if (!endTime || entry.timestamp > endTime) {
                        endTime = entry.timestamp;
                    }
                }

                // ツール実行結果のエントリ
                if (entry.toolUseResult) {
                    entries.push({
                        id: `${conversationId}-${index}`,
                        timestamp: entry.timestamp || "",
                        type: "tool_result",
                        content: typeof entry.toolUseResult === "string"
                            ? entry.toolUseResult
                            : JSON.stringify(entry.toolUseResult, null, 2),
                        metadata: entry,
                    });
                    return;
                }

                // messageフィールドがある場合はその内容を展開
                if (entry.message) {
                    let content = "";
                    let thinking = "";

                    // message.contentの処理
                    if (entry.message.content) {
                        if (typeof entry.message.content === "string") {
                            content = entry.message.content;
                        } else if (Array.isArray(entry.message.content)) {
                            // thinkingコンテンツを抽出
                            const thinkingContent = entry.message.content.find((c: any) => c.type === "thinking");
                            if (thinkingContent) {
                                thinking = thinkingContent.thinking || thinkingContent.text || "";
                            }

                            // tool_useの内容は別途metadataで保持し、ここでは表示しない
                            content = entry.message.content
                                .filter((c: any) => c.type === "text")
                                .map((c: any) => c.text || "")
                                .join("\n");
                        }
                    }

                    entries.push({
                        id: `${conversationId}-${index}`,
                        timestamp: entry.timestamp || "",
                        type: entry.message.role || entry.type || "unknown",
                        content: content,
                        metadata: entry,
                        model: entry.message.model || undefined,
                        thinking: thinking || undefined,
                    });
                    return;
                }

                // summaryフィールドがある場合
                if (entry.summary) {
                    entries.push({
                        id: `${conversationId}-${index}`,
                        timestamp: entry.timestamp || "",
                        type: "summary",
                        content: entry.summary,
                        metadata: entry,
                    });
                    return;
                }

                // その他のエントリ
                const entryContent = entry.content || entry.text || JSON.stringify(entry);
                const entryType = entry.type || 'unknown';

                entries.push({
                    id: `${conversationId}-${index}`,
                    timestamp: entry.timestamp || "",
                    type: entryType,
                    content: entryContent,
                    metadata: entry,
                });
            } catch (error) {
                console.error(`Failed to parse line ${index}:`, error);
                // パースエラーの場合はスキップ
            }
        });

        return {
            conversationId,
            startTime,
            endTime,
            entries
        };
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
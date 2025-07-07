// 開発環境用のモックAPI
import type { Project, Conversation, ConversationDetail } from "./vscode-api";

// モックデータ
const mockProjects: Project[] = [
  {
    id: "example-project",
    name: "example/project",
    conversationCount: 3,
    lastModified: new Date().toISOString(),
  },
  {
    id: "another-project",
    name: "another/project",
    conversationCount: 5,
    lastModified: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockConversations: Conversation[] = [
  {
    conversationId: "conv-123",
    fileName: "20240107_123456.jsonl",
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date().toISOString(),
    entriesCount: 10,
    preview: [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "user",
        content: "Claude Code Logsの使い方を教えてください。",
      },
      {
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        type: "assistant",
        content: "Claude Code Logsは、VS Code拡張機能として動作します...",
      },
    ],
  },
  {
    conversationId: "conv-123",
    fileName: "20240107_123456.jsonl",
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date().toISOString(),
    entriesCount: 10,
    preview: [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "user",
        content: "Claude Code Logsの使い方を教えてください。",
      },
      {
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        type: "assistant",
        content: "Claude Code Logsは、VS Code拡張機能として動作します...",
      },
    ],
  },
];

const mockConversationDetail: ConversationDetail = {
  conversationId: "conv-123",
  startTime: new Date(Date.now() - 3600000).toISOString(),
  endTime: new Date().toISOString(),
  entries: [
    {
      id: "entry-1",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: "user",
      content: "Claude Code Logsの使い方を教えてください。",
      metadata: {},
    },
    {
      id: "entry-2",
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      type: "assistant",
      content:
        "Claude Code Logsは、VS Code拡張機能として動作します。\n\n## 主な機能\n\n1. **プロジェクト一覧表示**\n2. **会話履歴の閲覧**\n3. **Markdownレンダリング**\n\n詳しい使い方は以下の通りです。",
      metadata: {},
      model: "claude-3-opus",
    },
    {
      id: "entry-3",
      timestamp: new Date(Date.now() - 3400000).toISOString(),
      type: "tool_result",
      content:
        'ファイルの読み込みに成功しました。\n\n```json\n{\n  "status": "success",\n  "files": 10\n}\n```',
      metadata: {},
    },
  ],
};

export class MockVSCodeAPI {
  async getProjects(): Promise<Project[]> {
    // 遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockProjects;
  }

  async getProjectLogs(projectId: string): Promise<Conversation[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockConversations;
  }

  async getLogDetail(
    projectId: string,
    logId: string
  ): Promise<ConversationDetail> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockConversationDetail;
  }

  async executeInTerminal(
    command: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Mock: Execute in terminal:", command);
    return {
      success: true,
      message: "モック: ターミナルコマンドを実行しました",
    };
  }
}

export const mockApi = new MockVSCodeAPI();

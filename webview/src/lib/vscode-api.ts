// VS Code APIとの通信を管理
const vscode = typeof window !== 'undefined' && window.acquireVsCodeApi 
  ? window.acquireVsCodeApi() 
  : null;

export interface Project {
  id: string;
  name: string;
  conversationCount: number;
  lastModified: string | null;
}

export interface Conversation {
  conversationId: string;
  fileName: string;
  startTime: string;
  endTime: string;
  entriesCount: number;
  preview: Array<{
    timestamp: string;
    type: string;
    content: string;
  }>;
}

export interface ConversationDetail {
  conversationId: string;
  startTime: string;
  endTime: string;
  entries: Array<{
    id: string;
    timestamp: string;
    type: string;
    content: string;
    metadata?: any;
    model?: string;
    thinking?: string;
  }>;
}

export type FileUpdateListener = (data: {
  eventType: 'create' | 'change' | 'delete';
  projectId: string;
  fileName: string;
}) => void;

class VSCodeAPI {
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private fileUpdateListeners: Set<FileUpdateListener> = new Set();

  constructor() {
    window.addEventListener('message', event => {
      const message = event.data;
      
      // ファイル更新イベントの処理
      if (message.command === 'fileUpdate') {
        this.fileUpdateListeners.forEach(listener => {
          listener({
            eventType: message.eventType,
            projectId: message.projectId,
            fileName: message.fileName
          });
        });
        return;
      }
      
      const handler = this.messageHandlers.get(message.command);
      if (handler) {
        handler(message);
      }
    });
  }

  async getProjects(): Promise<Project[]> {
    return new Promise((resolve, reject) => {
      if (!vscode) {
        reject(new Error('VS Code API not available'));
        return;
      }
      this.messageHandlers.set('projectsResponse', (data) => {
        this.messageHandlers.delete('projectsResponse');
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.projects);
        }
      });
      vscode.postMessage({ command: 'getProjects' });
    });
  }

  async getProjectLogs(projectId: string): Promise<Conversation[]> {
    return new Promise((resolve, reject) => {
      if (!vscode) {
        reject(new Error('VS Code API not available'));
        return;
      }
      this.messageHandlers.set('logsResponse', (data) => {
        this.messageHandlers.delete('logsResponse');
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.conversations);
        }
      });
      vscode.postMessage({ command: 'getProjectLogs', projectId });
    });
  }

  async getLogDetail(projectId: string, logId: string): Promise<ConversationDetail> {
    return new Promise((resolve, reject) => {
      if (!vscode) {
        reject(new Error('VS Code API not available'));
        return;
      }
      this.messageHandlers.set('logDetailResponse', (data) => {
        this.messageHandlers.delete('logDetailResponse');
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.conversation);
        }
      });
      vscode.postMessage({ command: 'getLogDetail', projectId, logId });
    });
  }

  async executeInTerminal(command: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      if (!vscode) {
        reject(new Error('VS Code API not available'));
        return;
      }
      this.messageHandlers.set('terminalExecuteResponse', (data) => {
        this.messageHandlers.delete('terminalExecuteResponse');
        resolve(data);
      });
      vscode.postMessage({ command: 'executeInTerminal', commandText: command });
    });
  }

  async searchLogs(projectId: string, filters: any): Promise<Conversation[]> {
    return new Promise((resolve, reject) => {
      if (!vscode) {
        reject(new Error('VS Code API not available'));
        return;
      }
      this.messageHandlers.set('searchLogsResponse', (data) => {
        this.messageHandlers.delete('searchLogsResponse');
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.conversations || []);
        }
      });
      vscode.postMessage({ command: 'searchLogs', projectId, filters });
    });
  }

  // ファイル更新リスナーの登録
  onFileUpdate(listener: FileUpdateListener): () => void {
    this.fileUpdateListeners.add(listener);
    // unsubscribe関数を返す
    return () => {
      this.fileUpdateListeners.delete(listener);
    };
  }
}

export const api = new VSCodeAPI();
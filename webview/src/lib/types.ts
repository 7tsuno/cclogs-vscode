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

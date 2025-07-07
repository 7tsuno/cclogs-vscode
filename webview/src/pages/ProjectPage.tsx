import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Conversation } from "../lib/vscode-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { ChevronLeft } from "lucide-react";
import { api } from "../lib/api";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.projectId) {
      fetchConversations(params.projectId);
    }
  }, [params.projectId]);

  const fetchConversations = async (projectId: string) => {
    try {
      const data = await api.getProjectLogs(projectId);
      setConversations(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPreviewText = (preview: any[]): string => {
    if (!preview || preview.length === 0) return "プレビューなし";
    const userMessage = preview.find((p) => p.type === "user");
    if (userMessage && userMessage.content) {
      return (
        userMessage.content.slice(0, 100) +
        (userMessage.content.length > 100 ? "..." : "")
      );
    }
    const firstContent = preview.find((p) => p.content);
    if (firstContent) {
      return (
        firstContent.content.slice(0, 100) +
        (firstContent.content.length > 100 ? "..." : "")
      );
    }
    return "プレビューなし";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">エラー: {error}</p>
        </div>
      </div>
    );
  }

  const projectName = params.projectId?.replace(/-/g, "/") || "";

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            プロジェクト一覧に戻る
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{projectName}</h1>
        <p className="text-muted-foreground mt-2">会話履歴</p>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-4 pr-4">
          {conversations.map((conversation) => (
            <Link
              key={conversation.conversationId}
              to={`/project/${params.projectId}/conversation/${conversation.conversationId}`}
            >
              <Card className="hover:bg-accent transition-colors cursor-pointer mt-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono">
                      {conversation.conversationId}
                    </CardTitle>
                    <Badge variant="secondary">
                      {conversation.entriesCount} メッセージ
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatDate(conversation.startTime)} -{" "}
                    {formatDate(conversation.endTime)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {getPreviewText(conversation.preview)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

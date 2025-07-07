import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { ConversationDetail } from "../lib/vscode-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  User,
  Bot,
  Wrench,
  Copy,
  Terminal,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "../lib/api";

export default function ConversationDetailPage() {
  const params = useParams<{ projectId: string; id: string }>();
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (params.id && params.projectId) {
      fetchConversation(params.projectId, params.id);
    }
  }, [params.id, params.projectId]);

  const fetchConversation = async (projectId: string, id: string) => {
    try {
      const data = await api.getLogDetail(projectId, id);
      setConversation(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const isRightAligned = (type: string) => {
    return type === "user";
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-5 w-5" />;
      case "assistant":
        return <Bot className="h-5 w-5" />;
      case "tool_result":
        return <Wrench className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const handleExecuteInTerminal = async () => {
    const command = `claude --resume ${params.id}`;
    try {
      const result = await api.executeInTerminal(command);
      if (result.success) {
        setNotificationMessage("コマンドをターミナルに送信しました");
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 3000);
      } else {
        console.error("Failed to execute in terminal:", result.error);
      }
    } catch (err) {
      console.error("Failed to execute in terminal:", err);
    }
  };

  // ツール結果コンポーネント
  const ToolResultContent = ({ content }: { content: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const shouldCollapse = content.length > 200;

    if (shouldCollapse) {
      return (
        <div className="space-y-2">
          <div className="whitespace-pre-wrap font-mono text-xs bg-muted p-3 rounded-md overflow-x-auto break-all">
            {isOpen ? content : content.slice(0, 200) + "..."}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start p-0 h-auto font-normal"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4 mr-1" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1" />
            )}
            <span className="text-sm text-muted-foreground">
              {isOpen ? "折りたたむ" : `続きを表示 (全${content.length}文字)`}
            </span>
          </Button>
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap font-mono text-xs bg-muted p-3 rounded-md overflow-x-auto break-all">
        {content}
      </div>
    );
  };

  // ツール呼び出しコンポーネント
  const ToolCallContent = ({ tool }: { tool: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toolInput = JSON.stringify(tool.input || {}, null, 2);
    const shouldCollapse = toolInput.length > 200;

    return (
      <Card className="bg-secondary/20">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-mono">
            {tool.name || "Unknown Tool"}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-3">
          {shouldCollapse ? (
            <div className="space-y-2">
              <pre className="text-xs overflow-x-auto">
                {isOpen ? toolInput : toolInput.slice(0, 200) + "..."}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto font-normal"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                <span className="text-xs text-muted-foreground">
                  {isOpen
                    ? "折りたたむ"
                    : `続きを表示 (全${toolInput.length}文字)`}
                </span>
              </Button>
            </div>
          ) : (
            <pre className="text-xs overflow-x-auto">{toolInput}</pre>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderContent = (
    content: string | undefined,
    type: string,
    metadata: any,
    thinking: string | undefined
  ) => {
    // アシスタントの返答の場合
    if (type === "assistant") {
      // ツール呼び出しを取得
      const toolUses =
        metadata?.message?.content?.filter((c: any) => c.type === "tool_use") ||
        [];
      const hasContent =
        (content && content.trim() !== "") ||
        (thinking && thinking.trim() !== "");

      return (
        <div className="space-y-4">
          {hasContent && (
            <div className="text-sm break-all space-y-2 [&_p]:leading-relaxed [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
          {toolUses.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                ツール呼び出し:
              </p>
              {toolUses.map((tool: any, index: number) => (
                <ToolCallContent key={index} tool={tool} />
              ))}
            </div>
          )}
          {thinking && (
            <div className="text-sm break-all space-y-2 text-muted-foreground">
              <p className="text-sm font-medium text-muted-foreground">
                thinking...
              </p>
              <ReactMarkdown>{thinking}</ReactMarkdown>
            </div>
          )}
          {!hasContent && toolUses.length === 0 && (
            <div className="text-muted-foreground text-sm italic">
              コンテンツなし
            </div>
          )}
        </div>
      );
    }

    // ツール結果の場合
    if (type === "tool_result") {
      return <ToolResultContent content={content || ""} />;
    }

    // その他は通常のテキストとして表示
    if (!content)
      return (
        <div className="text-muted-foreground text-sm italic">
          コンテンツなし
        </div>
      );

    return (
      <div className="whitespace-pre-wrap text-sm break-all">{content}</div>
    );
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

  if (error || !conversation) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">
            エラー: {error || "会話が見つかりません"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* カスタム通知 */}
      {showCopyNotification && (
        <div
          className="fixed top-4 right-4 z-50 rounded-lg shadow-lg p-4 animate-in slide-in-from-top-2 fade-in duration-200"
          style={{
            backgroundColor: "var(--vscode-notifications-background)",
            border: "1px solid var(--vscode-notifications-border)",
            color: "var(--vscode-notifications-foreground)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="rounded-full p-1"
              style={{
                backgroundColor:
                  "var(--vscode-notificationsInfoIcon-foreground)",
                color: "var(--vscode-notifications-background)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="text-sm">{notificationMessage}</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link to={`/project/${params.projectId}`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                会話一覧に戻る
              </Button>
            </Link>
            <h1 className="text-sm font-bold font-mono">
              {conversation.conversationId}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExecuteInTerminal}
              title="ターミナルで実行"
            >
              <Terminal className="h-3 w-3 mr-1" />
              ターミナルで再開
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(conversation.startTime).toLocaleString("ja-JP")} -{" "}
          {new Date(conversation.endTime).toLocaleString("ja-JP")}
        </p>
      </div>

      <Separator className="mb-4" />

      <div className="h-[calc(100vh-180px)] overflow-y-auto">
        <div className="space-y-4 px-4 pb-4">
          {conversation.entries.map((entry) => {
            const isRight = isRightAligned(entry.type);
            return (
              <div key={entry.id} className="space-y-1">
                {/* ヘッダー行（アイコン、日時、モデル名） */}
                <div
                  className={`flex items-center gap-2 text-xs text-muted-foreground ${
                    isRight ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isRight && (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                        {getIcon(entry.type)}
                      </div>
                      <span>{formatTimestamp(entry.timestamp)}</span>
                      {entry.type === "assistant" && entry.model && (
                        <span className="text-muted-foreground/70">
                          • {entry.model}
                        </span>
                      )}
                    </div>
                  )}
                  {isRight && (
                    <div className="flex items-center gap-2">
                      {entry.type === "assistant" && entry.model && (
                        <span className="text-muted-foreground/70">
                          {entry.model} •
                        </span>
                      )}
                      <span>{formatTimestamp(entry.timestamp)}</span>
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        {getIcon(entry.type)}
                      </div>
                    </div>
                  )}
                </div>

                {/* メッセージ内容 */}
                <div
                  className={`flex ${
                    isRight ? "justify-end" : "justify-start"
                  }`}
                >
                  <Card
                    className={`${
                      isRight
                        ? "bg-primary/5 max-w-[85%]"
                        : "bg-secondary/5 max-w-[85%]"
                    } overflow-hidden py-3`}
                  >
                    <CardContent className="px-4">
                      <div className="break-words">
                        {renderContent(
                          entry.content,
                          entry.type,
                          entry.metadata,
                          entry.thinking
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import type { ConversationDetail } from "../lib/vscode-api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Wrench,
  Terminal,
  Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "../lib/api";
import { FindInPageDialog } from "../components/FindInPageDialog";
import { scrollToMatch } from "../lib/highlight";

export default function ConversationDetailPage() {
  const params = useParams<{ projectId: string; id: string }>();
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (params.id && params.projectId) {
      fetchConversation(params.projectId, params.id);
      
      // ファイル更新リスナーの登録
      const unsubscribe = api.onFileUpdate((data) => {
        // 現在表示中の会話のファイルが更新された場合
        if (data.projectId === params.projectId && 
            params.id && data.fileName.includes(params.id)) {
          fetchConversation(params.projectId, params.id);
        }
        
        // 新しいファイルが現在表示中のファイルから派生した場合、自動遷移
        // eventTypeをchangeに変更（ファイルが完全に書き込まれた後に検出されるため）
        if (data.eventType === 'change' && 
            data.derivedFromFile === params.id && 
            data.projectId === params.projectId) {
          const newConversationId = data.fileName.replace('.jsonl', '');
          // React Routerで新しいファイルに遷移
          window.location.hash = `#/project/${params.projectId}/conversation/${newConversationId}`;
        }
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [params.id, params.projectId, autoScroll]);

  const fetchConversation = async (projectId: string, id: string) => {
    try {
      const data = await api.getLogDetail(projectId, id);
      setConversation(data);
      
      // 自動スクロールが有効な場合は最下部へ
      if (autoScroll && scrollAreaRef.current) {
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
          }
        }, 100);
      }
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
        setNotificationMessage("Command sent to terminal");
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 3000);
      }
    } catch (err) {
      // エラーは静かに処理
    }
  };

  // 検索機能
  const handleHighlight = useCallback(
    (text: string): number => {
      const isNewSearch = text !== searchTerm && text !== "";
      setSearchTerm(text);

      if (!text) {
        // 検索クリア時は即座に処理
        performHighlight(text, isNewSearch);
      } else {
        // 検索実行時はレンダリング後に処理
        requestAnimationFrame(() => {
          // さらに次のマイクロタスクで実行
          setTimeout(() => {
            performHighlight(text, isNewSearch);
          }, 0);
        });
      }

      return 0; // 一旦0を返す
    },
    [searchTerm]
  );

  const performHighlight = (text: string, isNewSearch: boolean) => {
    if (!contentRef.current) return 0;

    // すべての要素から既存のハイライトを削除
    // まずmark要素を持つspan要素を探す
    const allSpans = contentRef.current.querySelectorAll("span");
    allSpans.forEach((span) => {
      if (span.querySelector("mark")) {
        const parent = span.parentNode;
        if (parent) {
          const textNode = document.createTextNode(span.textContent || "");
          parent.replaceChild(textNode, span);
        }
      }
    });

    // 残っているmark要素も削除
    const existingMarks = contentRef.current.querySelectorAll("mark");
    existingMarks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(
          document.createTextNode(mark.textContent || ""),
          mark
        );
        parent.normalize();
      }
    });

    if (!text) {
      setTotalMatches(0);
      setCurrentMatchIndex(-1);
      return 0;
    }

    // 新しいハイライトを適用
    let totalMatches = 0;
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (
            parent &&
            (parent.tagName === "SCRIPT" || parent.tagName === "STYLE")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    const regex = new RegExp(
      `(${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );

    textNodes.forEach((textNode) => {
      const matches = textNode.textContent?.match(regex);
      if (matches && matches.length > 0) {
        totalMatches += matches.length;
        const span = document.createElement("span");
        span.innerHTML = textNode.textContent!.replace(
          regex,
          '<mark class="bg-yellow-300 text-black">$1</mark>'
        );
        textNode.parentNode?.replaceChild(span, textNode);
      }
    });

    setTotalMatches(totalMatches);
    // 新しい検索の場合のみインデックスをリセット
    if (isNewSearch) {
      setCurrentMatchIndex(totalMatches > 0 ? 0 : -1);
      // 初回スクロールはuseEffectに任せる（折りたたみ展開を待つため）
    }
    return totalMatches;
  };

  const handleNavigate = (direction: "next" | "prev") => {
    if (totalMatches === 0) return;

    let newIndex = currentMatchIndex;
    if (direction === "next") {
      newIndex = currentMatchIndex + 1;
      if (newIndex >= totalMatches) {
        newIndex = 0;
      }
    } else {
      newIndex = currentMatchIndex - 1;
      if (newIndex < 0) {
        newIndex = totalMatches - 1;
      }
    }

    setCurrentMatchIndex(newIndex);
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsFindOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 現在のマッチ位置にスクロール
  useEffect(() => {
    if (contentRef.current && totalMatches > 0 && currentMatchIndex >= 0) {
      // 折りたたみの展開が完了するのを待つ
      const timeoutId = setTimeout(() => {
        if (!contentRef.current) return;
        const marks = contentRef.current.querySelectorAll("mark");
        if (marks.length > currentMatchIndex) {
          scrollToMatch(contentRef.current, currentMatchIndex);
        }
      }, 150); // 折りたたみの展開アニメーションを待つ（少し長めに）

      return () => clearTimeout(timeoutId);
    }
  }, [currentMatchIndex, totalMatches, searchTerm]); // searchTermも依存配列に追加

  // ハイライト付きコンテンツをレンダリング
  const renderHighlightedContent = (text: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            // マッチした部分
            return (
              <mark key={index} className="bg-yellow-300 text-black">
                {part}
              </mark>
            );
          }
          return part;
        })}
      </>
    );
  };

  // ツール結果コンポーネント
  const ToolResultContent = ({ content }: { content: string }) => {
    const [isManuallyOpen, setIsManuallyOpen] = useState(false);
    const shouldCollapse = content.length > 200;

    // 検索中は強制的に展開、そうでなければ手動開閉に従う
    const isOpen = searchTerm ? true : isManuallyOpen;

    const displayContent = isOpen ? content : content.slice(0, 200) + "...";

    if (shouldCollapse) {
      return (
        <div className="space-y-2">
          <div className="whitespace-pre-wrap font-mono text-xs bg-muted p-3 rounded-md overflow-x-auto break-all">
            {renderHighlightedContent(displayContent)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start p-0 h-auto font-normal"
            onClick={() => setIsManuallyOpen(!isManuallyOpen)}
            disabled={!!searchTerm} // 検索中はボタンを無効化
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4 mr-1" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1" />
            )}
            <span className="text-sm text-muted-foreground">
              {isOpen ? "Collapse" : `Show more (${content.length} chars)`}
            </span>
          </Button>
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap font-mono text-xs bg-muted p-3 rounded-md overflow-x-auto break-all">
        {renderHighlightedContent(content)}
      </div>
    );
  };

  // ツール呼び出しコンポーネント
  const ToolCallContent = ({ tool }: { tool: any }) => {
    const [isManuallyOpen, setIsManuallyOpen] = useState(false);
    const toolInput = JSON.stringify(tool.input || {}, null, 2);
    const shouldCollapse = toolInput.length > 200;

    // 検索中は強制的に展開、そうでなければ手動開閉に従う
    const isOpen = searchTerm ? true : isManuallyOpen;

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
                onClick={() => setIsManuallyOpen(!isManuallyOpen)}
                disabled={!!searchTerm} // 検索中はボタンを無効化
              >
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                <span className="text-xs text-muted-foreground">
                  {isOpen
                    ? "Collapse"
                    : `Show more (${toolInput.length} chars)`}
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
                Tool calls:
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
              No content
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
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">
            Error: {error || "Conversation not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
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
                Back to conversations
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoScroll ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              title="Toggle auto-scroll"
            >
              {autoScroll ? (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Auto-scroll ON
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1 opacity-50" />
                  Auto-scroll OFF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFindOpen(true)}
              title="Search (Ctrl+F)"
            >
              <Search className="h-3 w-3 mr-1" />
              Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExecuteInTerminal}
              title="Execute in terminal"
            >
              <Terminal className="h-3 w-3 mr-1" />
              Resume in terminal
            </Button>
          </div>
        </div>
      </div>

      <div 
        className="h-[calc(100vh-180px)] overflow-y-auto" 
        ref={scrollAreaRef}
      >
        <div className="space-y-4 px-2 pb-4" ref={contentRef}>
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
                      <div className="w-6 h-6 flex items-center justify-center">
                        {getIcon(entry.type)}
                      </div>
                      <div>
                        <div>{formatTimestamp(entry.timestamp)}</div>
                        {entry.type === "assistant" && entry.model && (
                          <div className="text-muted-foreground/70">
                            {entry.model}
                          </div>
                        )}
                      </div>
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
                      <div className="w-6 h-6 flex items-center justify-center">
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
                      isRight ? "bg-primary/5" : "bg-secondary/5"
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

      <FindInPageDialog
        isOpen={isFindOpen}
        onClose={() => {
          setIsFindOpen(false);
          setSearchTerm("");
          setCurrentMatchIndex(0);
          setTotalMatches(0);
          handleHighlight(""); // Clear highlights
        }}
        onHighlight={handleHighlight}
        onNavigate={handleNavigate}
        currentMatch={currentMatchIndex + 1}
        matchCount={totalMatches}
      />
    </div>
  );
}

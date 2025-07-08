import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, ChevronUp, ChevronDown } from "lucide-react";

interface FindInPageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onHighlight: (searchText: string) => number;
  onNavigate: (direction: "next" | "prev") => void;
  currentMatch: number;
  matchCount: number;
}

export function FindInPageDialog({
  isOpen,
  onClose,
  onHighlight,
  onNavigate,
  currentMatch,
  matchCount,
}: FindInPageDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 枠外クリックの処理
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    // 少し遅延させて、開く時のクリックで閉じないようにする
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    // 日本語入力中でなければ検索実行
    if (!isComposing) {
      onHighlight(value);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    // 変換確定時に検索を実行
    const value = e.currentTarget.value;
    onHighlight(value);
  };

  const handleClose = () => {
    setSearchText("");
    onHighlight("");
    onClose();
  };

  const handleNext = () => {
    if (matchCount > 0) {
      onNavigate("next");
    }
  };

  const handlePrev = () => {
    if (matchCount > 0) {
      onNavigate("prev");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed top-4 right-4 z-50 bg-popover border rounded-lg shadow-lg p-3 animate-in slide-in-from-top-2 fade-in duration-200"
      style={{ minWidth: "320px" }}
    >
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          className="flex-1 h-8"
        />
        <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[60px]">
          {matchCount > 0 && (
            <>
              {currentMatch}/{matchCount}
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={matchCount === 0}
          title="Previous (Shift+Enter)"
          className="h-8 w-8 p-0"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={matchCount === 0}
          title="Next (Enter)"
          className="h-8 w-8 p-0"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          title="Close (Esc)"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
// Mock API for development environment
import type { Project, Conversation, ConversationDetail } from "./vscode-api";

// Mock data
const mockProjects: Project[] = [
  {
    id: "claude-code-logs",
    name: "claude-code-logs",
    conversationCount: 15,
    lastModified: new Date().toISOString(),
  },
  {
    id: "nextjs-app",
    name: "nextjs/app",
    conversationCount: 23,
    lastModified: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "react-components",
    name: "react/components",
    conversationCount: 8,
    lastModified: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "python-scripts",
    name: "python/scripts",
    conversationCount: 12,
    lastModified: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "docker-configs",
    name: "docker/configs",
    conversationCount: 5,
    lastModified: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "terraform-infra",
    name: "terraform/infra",
    conversationCount: 7,
    lastModified: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "golang-services",
    name: "golang/services",
    conversationCount: 19,
    lastModified: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "rust-wasm",
    name: "rust/wasm",
    conversationCount: 4,
    lastModified: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: "ml-experiments",
    name: "ml/experiments",
    conversationCount: 11,
    lastModified: new Date(Date.now() - 518400000).toISOString(),
  },
  {
    id: "vue-dashboard",
    name: "vue/dashboard",
    conversationCount: 6,
    lastModified: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: "android-app",
    name: "android/app",
    conversationCount: 9,
    lastModified: new Date(Date.now() - 691200000).toISOString(),
  },
  {
    id: "ios-framework",
    name: "ios/framework",
    conversationCount: 3,
    lastModified: new Date(Date.now() - 777600000).toISOString(),
  },
];

const mockConversations: Conversation[] = [
  {
    conversationId: "20240108-095432",
    fileName: "20240108_095432.jsonl",
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date().toISOString(),
    entriesCount: 15,
    preview: [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "user",
        content: "Please implement a search function for the project.",
      },
      {
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        type: "assistant",
        content:
          "I'll implement the search function. First, I'll create a search bar component...",
      },
    ],
  },
  {
    conversationId: "20240108-084521",
    fileName: "20240108_084521.jsonl",
    startTime: new Date(Date.now() - 7200000).toISOString(),
    endTime: new Date(Date.now() - 3700000).toISOString(),
    entriesCount: 23,
    preview: [
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: "user",
        content: "Please explain React's useState hook in detail.",
      },
      {
        timestamp: new Date(Date.now() - 7100000).toISOString(),
        type: "assistant",
        content:
          "useState is one of React's fundamental hooks, used to manage state in functional components.",
      },
    ],
  },
  {
    conversationId: "20240108-073215",
    fileName: "20240108_073215.jsonl",
    startTime: new Date(Date.now() - 10800000).toISOString(),
    endTime: new Date(Date.now() - 7300000).toISOString(),
    entriesCount: 8,
    preview: [
      {
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        type: "user",
        content: "Please teach me how to use generics in TypeScript.",
      },
      {
        timestamp: new Date(Date.now() - 10700000).toISOString(),
        type: "assistant",
        content:
          "TypeScript generics are a feature to enhance type reusability.",
      },
    ],
  },
  {
    conversationId: "20240107-195847",
    fileName: "20240107_195847.jsonl",
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 82800000).toISOString(),
    entriesCount: 12,
    preview: [
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: "user",
        content: "Please teach me how to develop VS Code extensions.",
      },
      {
        timestamp: new Date(Date.now() - 86300000).toISOString(),
        type: "assistant",
        content:
          "Developing VS Code extensions requires knowledge of Node.js and TypeScript.",
      },
    ],
  },
  {
    conversationId: "20240107-164532",
    fileName: "20240107_164532.jsonl",
    startTime: new Date(Date.now() - 100800000).toISOString(),
    endTime: new Date(Date.now() - 97200000).toISOString(),
    entriesCount: 19,
    preview: [
      {
        timestamp: new Date(Date.now() - 100800000).toISOString(),
        type: "user",
        content: "Please teach me Docker container best practices.",
      },
      {
        timestamp: new Date(Date.now() - 100700000).toISOString(),
        type: "assistant",
        content:
          "Docker container best practices include the following items...",
      },
    ],
  },
  {
    conversationId: "20240107-142318",
    fileName: "20240107_142318.jsonl",
    startTime: new Date(Date.now() - 108000000).toISOString(),
    endTime: new Date(Date.now() - 104400000).toISOString(),
    entriesCount: 7,
    preview: [
      {
        timestamp: new Date(Date.now() - 108000000).toISOString(),
        type: "user",
        content: "What is the difference between Git rebase and merge?",
      },
      {
        timestamp: new Date(Date.now() - 107900000).toISOString(),
        type: "assistant",
        content:
          "Git rebase and merge are both methods for integrating branches, but they handle history differently.",
      },
    ],
  },
  {
    conversationId: "20240107-115623",
    fileName: "20240107_115623.jsonl",
    startTime: new Date(Date.now() - 118800000).toISOString(),
    endTime: new Date(Date.now() - 115200000).toISOString(),
    entriesCount: 31,
    preview: [
      {
        timestamp: new Date(Date.now() - 118800000).toISOString(),
        type: "user",
        content: "How to optimize performance in large React applications",
      },
      {
        timestamp: new Date(Date.now() - 118700000).toISOString(),
        type: "assistant",
        content:
          "There are multiple approaches to optimizing performance in large React applications.",
      },
    ],
  },
  {
    conversationId: "20240107-093456",
    fileName: "20240107_093456.jsonl",
    startTime: new Date(Date.now() - 129600000).toISOString(),
    endTime: new Date(Date.now() - 126000000).toISOString(),
    entriesCount: 14,
    preview: [
      {
        timestamp: new Date(Date.now() - 129600000).toISOString(),
        type: "user",
        content: "Can you compare GraphQL and REST API?",
      },
      {
        timestamp: new Date(Date.now() - 129500000).toISOString(),
        type: "assistant",
        content:
          "GraphQL and REST API are both web API design approaches, but they have different characteristics.",
      },
    ],
  },
  {
    conversationId: "20240106-184321",
    fileName: "20240106_184321.jsonl",
    startTime: new Date(Date.now() - 172800000).toISOString(),
    endTime: new Date(Date.now() - 169200000).toISOString(),
    entriesCount: 9,
    preview: [
      {
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        type: "user",
        content: "Tell me about microservices architecture design principles",
      },
      {
        timestamp: new Date(Date.now() - 172700000).toISOString(),
        type: "assistant",
        content:
          "Microservices architecture is a design approach that divides applications into small, independent services.",
      },
    ],
  },
  {
    conversationId: "20240106-162109",
    fileName: "20240106_162109.jsonl",
    startTime: new Date(Date.now() - 180000000).toISOString(),
    endTime: new Date(Date.now() - 176400000).toISOString(),
    entriesCount: 22,
    preview: [
      {
        timestamp: new Date(Date.now() - 180000000).toISOString(),
        type: "user",
        content: "How do I build a CI/CD pipeline?",
      },
      {
        timestamp: new Date(Date.now() - 179900000).toISOString(),
        type: "assistant",
        content:
          "Building a CI/CD pipeline involves using tools like GitHub Actions or Jenkins.",
      },
    ],
  },
  {
    conversationId: "20240106-134758",
    fileName: "20240106_134758.jsonl",
    startTime: new Date(Date.now() - 190800000).toISOString(),
    endTime: new Date(Date.now() - 187200000).toISOString(),
    entriesCount: 11,
    preview: [
      {
        timestamp: new Date(Date.now() - 190800000).toISOString(),
        type: "user",
        content: "What are the security best practices for web applications?",
      },
      {
        timestamp: new Date(Date.now() - 190700000).toISOString(),
        type: "assistant",
        content:
          "Web application security requires measures across multiple layers.",
      },
    ],
  },
  {
    conversationId: "20240106-112543",
    fileName: "20240106_112543.jsonl",
    startTime: new Date(Date.now() - 201600000).toISOString(),
    endTime: new Date(Date.now() - 198000000).toISOString(),
    entriesCount: 16,
    preview: [
      {
        timestamp: new Date(Date.now() - 201600000).toISOString(),
        type: "user",
        content: "How to implement real-time communication using WebSocket",
      },
      {
        timestamp: new Date(Date.now() - 201500000).toISOString(),
        type: "assistant",
        content:
          "WebSocket is a protocol that enables bidirectional real-time communication between client and server.",
      },
    ],
  },
];

const mockConversationDetail: ConversationDetail = {
  conversationId: "20240108-095432",
  startTime: new Date(Date.now() - 3600000).toISOString(),
  endTime: new Date().toISOString(),
  entries: [
    {
      id: "entry-1",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: "user",
      content: "Please implement a search feature for the project.",
      metadata: {},
    },
    {
      id: "entry-2",
      timestamp: new Date(Date.now() - 3590000).toISOString(),
      type: "assistant",
      content:
        "I'll implement the search feature. First, I'll create a search bar component and add filtering functionality.\n\n## Implementation Steps\n\n1. **Create SearchBar component**\n2. **Implement filtering logic**\n3. **Display search results**",
      metadata: {},
      model: "claude-3-opus-20240229",
    },
    {
      id: "entry-3",
      timestamp: new Date(Date.now() - 3580000).toISOString(),
      type: "tool_result",
      content: `Created file 'src/components/SearchBar.tsx'.

Created the file with the following content:

\`\`\`tsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search..." }) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border rounded-lg">
      <Search className="w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 outline-none"
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Search
      </button>
    </form>
  );
};
\`\`\`

This component manages the search query and calls the callback function when search is executed.`,
      metadata: {},
    },
    {
      id: "entry-4",
      timestamp: new Date(Date.now() - 3570000).toISOString(),
      type: "user",
      content: "Add highlighting for the search results.",
      metadata: {},
    },
    {
      id: "entry-5",
      timestamp: new Date(Date.now() - 3560000).toISOString(),
      type: "assistant",
      content: "I'll add a highlighting feature for search results. Let me create a utility function to highlight matching text and update the search results display.",
      metadata: {},
      model: "claude-3-opus-20240229",
      thinking: "The user wants to add highlighting to search results. I should create a function that can wrap matching text in a span with a highlight class, and then use it in the search results component."
    },
    {
      id: "entry-6",
      timestamp: new Date(Date.now() - 3550000).toISOString(),
      type: "tool_result",
      content: `Created file 'src/utils/highlight.ts' with the following content:

\`\`\`typescript
export function highlightText(text: string, searchQuery: string): string {
  if (!searchQuery) return text;
  
  const regex = new RegExp(\`(\${searchQuery})\`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

export function highlightTextReact(text: string, searchQuery: string): React.ReactNode {
  if (!searchQuery) return text;
  
  const parts = text.split(new RegExp(\`(\${searchQuery})\`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}
\`\`\``,
      metadata: {},
    },
    {
      id: "entry-7",
      timestamp: new Date(Date.now() - 3540000).toISOString(),
      type: "user",
      content: "Now integrate this with the search results component.",
      metadata: {},
    },
    {
      id: "entry-8",
      timestamp: new Date(Date.now() - 3530000).toISOString(),
      type: "assistant",
      content: "I'll update the search results component to use the highlighting utility. Let me modify the SearchResults component to highlight matching text.",
      metadata: {},
      model: "claude-3-opus-20240229",
    },
    {
      id: "entry-9",
      timestamp: new Date(Date.now() - 3520000).toISOString(),
      type: "tool_result",
      content: `Updated file 'src/components/SearchResults.tsx':

\`\`\`diff
import React from 'react';
+ import { highlightTextReact } from '../utils/highlight';

interface SearchResultsProps {
  results: Array<{
    id: string;
    title: string;
    content: string;
    timestamp: string;
  }>;
+  searchQuery: string;
}

- export const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
+ export const SearchResults: React.FC<SearchResultsProps> = ({ results, searchQuery }) => {
  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div key={result.id} className="p-4 border rounded-lg hover:bg-gray-50">
-          <h3 className="text-lg font-semibold">{result.title}</h3>
+          <h3 className="text-lg font-semibold">
+            {highlightTextReact(result.title, searchQuery)}
+          </h3>
          <p className="text-gray-600 mt-2">
-            {result.content}
+            {highlightTextReact(result.content, searchQuery)}
          </p>
          <time className="text-sm text-gray-400 mt-2 block">
            {new Date(result.timestamp).toLocaleString()}
          </time>
        </div>
      ))}
    </div>
  );
};
\`\`\``,
      metadata: {},
    },
    {
      id: "entry-10",
      timestamp: new Date(Date.now() - 3510000).toISOString(),
      type: "user",
      content: "Great! Can you also add pagination to handle large result sets?",
      metadata: {},
    },
    {
      id: "entry-11",
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      type: "assistant",
      content: "I'll add pagination to handle large result sets. Let me create a pagination component and integrate it with the search results.",
      metadata: {},
      model: "claude-3-opus-20240229",
    },
    {
      id: "entry-12",
      timestamp: new Date(Date.now() - 3490000).toISOString(),
      type: "tool_result",
      content: `Created file 'src/components/Pagination.tsx':

\`\`\`tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  return (
    <nav className="flex items-center justify-center space-x-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded border disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={\`px-3 py-1 rounded \${
            page === currentPage
              ? 'bg-blue-500 text-white'
              : 'border hover:bg-gray-100'
          }\`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded border disabled:opacity-50"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};
\`\`\``,
      metadata: {},
    },
    {
      id: "entry-13",
      timestamp: new Date(Date.now() - 3480000).toISOString(),
      type: "user",
      content: "Perfect! Now let's add filtering options like date range and file type.",
      metadata: {},
    },
    {
      id: "entry-14",
      timestamp: new Date(Date.now() - 3470000).toISOString(),
      type: "assistant",
      content: "I'll create an advanced filtering component with date range and file type options. This will make the search functionality more powerful.",
      metadata: {},
      model: "claude-3-opus-20240229",
    },
    {
      id: "entry-15",
      timestamp: new Date(Date.now() - 3460000).toISOString(),
      type: "tool_result",
      content: `Created file 'src/components/SearchFilters.tsx':

\`\`\`tsx
import React, { useState } from 'react';
import { Calendar, FileText, Filter } from 'lucide-react';

interface SearchFiltersProps {
  onFiltersChange: (filters: {
    dateFrom?: string;
    dateTo?: string;
    fileTypes?: string[];
  }) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onFiltersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  const fileTypes = ['typescript', 'javascript', 'python', 'markdown', 'json'];
  
  const handleApply = () => {
    onFiltersChange({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      fileTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    });
    setIsOpen(false);
  };
  
  const toggleFileType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        Filters
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 p-4 bg-white border rounded-lg shadow-lg z-10">
          <h3 className="font-semibold mb-4">Filter Options</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-1 border rounded"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-1 border rounded"
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <FileText className="w-4 h-4" />
                File Types
              </label>
              <div className="flex flex-wrap gap-2">
                {fileTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFileType(type)}
                    className={\`px-3 py-1 rounded text-sm \${
                      selectedTypes.includes(type)
                        ? 'bg-blue-500 text-white'
                        : 'border hover:bg-gray-50'
                    }\`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSelectedTypes([]);
                onFiltersChange({});
                setIsOpen(false);
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
\`\`\``,
      metadata: {},
    },
    {
      id: "entry-16",
      timestamp: new Date(Date.now() - 3450000).toISOString(),
      type: "summary",
      content: "Implemented a comprehensive search feature with highlighting, pagination, and advanced filtering options including date range and file type filters.",
      metadata: {},
    },
    {
      id: "entry-17",
      timestamp: new Date(Date.now() - 3440000).toISOString(),
      type: "user",
      content: "Excellent work! Can you add keyboard shortcuts for the search functionality?",
      metadata: {},
    },
    {
      id: "entry-18",
      timestamp: new Date(Date.now() - 3430000).toISOString(),
      type: "assistant",
      content: "I'll add keyboard shortcuts to enhance the search functionality. Let me implement shortcuts for opening search (Cmd/Ctrl+K), navigating results, and clearing search.",
      metadata: {},
      model: "claude-3-opus-20240229",
    },
    {
      id: "entry-19",
      timestamp: new Date(Date.now() - 3420000).toISOString(),
      type: "tool_result",
      content: `Created file 'src/hooks/useKeyboardShortcuts.ts':

\`\`\`typescript
import { useEffect } from 'react';

interface ShortcutHandlers {
  onSearch?: () => void;
  onEscape?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onEnter?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Cmd/Ctrl + K: Open search
      if (modifierKey && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
      }
      
      // Escape: Close/clear search
      if (e.key === 'Escape') {
        handlers.onEscape?.();
      }
      
      // Arrow keys for navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handlers.onNext?.();
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlers.onPrevious?.();
      }
      
      // Enter to select
      if (e.key === 'Enter') {
        handlers.onEnter?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}
\`\`\`

Also updated SearchBar component to show keyboard shortcut hint:

\`\`\`diff
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border rounded-lg">
      <Search className="w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 outline-none"
      />
+     <kbd className="text-xs px-2 py-1 bg-gray-100 rounded">⌘K</kbd>
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Search
      </button>
    </form>
  );
\`\`\``,
      metadata: {},
    },
    {
      id: "entry-20",
      timestamp: new Date(Date.now() - 3410000).toISOString(),
      type: "user",
      content: "This is great! One last thing - can you add export functionality to save search results?",
      metadata: {},
    },
    {
      id: "entry-21",
      timestamp: new Date(Date.now() - 3400000).toISOString(),
      type: "assistant",
      content: "I'll add export functionality to save search results in multiple formats. Let me create an export component that supports JSON, CSV, and Markdown formats.",
      metadata: {},
      model: "claude-3-opus-20240229",
    },
    {
      id: "entry-22",
      timestamp: new Date(Date.now() - 3390000).toISOString(),
      type: "tool_result",
      content: `Created file 'src/components/ExportButton.tsx' and utilities:

\`\`\`tsx
import React, { useState } from 'react';
import { Download, FileJson, FileText, Table } from 'lucide-react';
import { exportToJSON, exportToCSV, exportToMarkdown } from '../utils/export';

interface ExportButtonProps {
  data: any[];
  filename?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = 'search-results',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleExport = (format: 'json' | 'csv' | 'markdown') => {
    switch (format) {
      case 'json':
        exportToJSON(data, filename);
        break;
      case 'csv':
        exportToCSV(data, filename);
        break;
      case 'markdown':
        exportToMarkdown(data, filename);
        break;
    }
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-white border rounded-lg shadow-lg z-10">
          <button
            onClick={() => handleExport('json')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded"
          >
            <FileJson className="w-4 h-4" />
            Export as JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded"
          >
            <Table className="w-4 h-4" />
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('markdown')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded"
          >
            <FileText className="w-4 h-4" />
            Export as Markdown
          </button>
        </div>
      )}
    </div>
  );
};
\`\`\`

Created file 'src/utils/export.ts':

\`\`\`typescript
export function exportToJSON(data: any[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, \`\${filename}.json\`, 'application/json');
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header =>
        JSON.stringify(row[header] ?? '')
      ).join(',')
    )
  ].join('\\n');
  
  downloadFile(csv, \`\${filename}.csv\`, 'text/csv');
}

export function exportToMarkdown(data: any[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const markdown = [
    '# Search Results',
    '',
    \`Generated on: \${new Date().toLocaleString()}\`,
    '',
    '| ' + headers.join(' | ') + ' |',
    '| ' + headers.map(() => '---').join(' | ') + ' |',
    ...data.map(row =>
      '| ' + headers.map(header =>
        String(row[header] ?? '').replace(/\\|/g, '\\\\|')
      ).join(' | ') + ' |'
    )
  ].join('\\n');
  
  downloadFile(markdown, \`\${filename}.md\`, 'text/markdown');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
\`\`\``,
      metadata: {},
    },
    {
      id: "entry-23",
      timestamp: new Date(Date.now() - 3380000).toISOString(),
      type: "user",
      content: "Perfect! The search feature is now complete with all the requested functionality. Thank you!",
      metadata: {},
    },
    {
      id: "entry-24",
      timestamp: new Date(Date.now() - 3370000).toISOString(),
      type: "assistant",
      content: "You're welcome! I've successfully implemented a comprehensive search feature with:\n\n✅ Search bar component with real-time search\n✅ Result highlighting for matched text\n✅ Pagination for handling large result sets\n✅ Advanced filtering (date range and file types)\n✅ Keyboard shortcuts (Cmd/Ctrl+K, arrow keys, Escape)\n✅ Export functionality (JSON, CSV, Markdown)\n\nThe search functionality is now fully integrated and ready for use. All components are modular and reusable, making it easy to maintain and extend in the future.",
      metadata: {},
      model: "claude-3-opus-20240229",
    },
  ],
};

export class MockVSCodeAPI {
  async getProjects(): Promise<Project[]> {
    // 遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockProjects;
  }

  async getProjectLogs(_projectId: string): Promise<Conversation[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockConversations;
  }

  async getLogDetail(
    _projectId: string,
    _logId: string
  ): Promise<ConversationDetail> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockConversationDetail;
  }

  async executeInTerminal(
    _command: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      message: "モック: ターミナルコマンドを実行しました",
    };
  }

  async searchLogs(_projectId: string, filters: any): Promise<Conversation[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Mock dataをフィルタリング
    return mockConversations.filter((conv) => {
      if (filters.content) {
        const hasContent = conv.preview.some((p) =>
          p.content.toLowerCase().includes(filters.content.toLowerCase())
        );
        if (!hasContent) return false;
      }
      return true;
    });
  }
}

export const mockApi = new MockVSCodeAPI();

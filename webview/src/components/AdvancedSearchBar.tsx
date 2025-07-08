import { useState } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface AdvancedSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  defaultFilters?: SearchFilters;
}

export interface SearchFilters {
  content: string;
  dateFrom: string;
  dateTo: string;
}

export function AdvancedSearchBar({ onSearch, defaultFilters }: AdvancedSearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    content: defaultFilters?.content || '',
    dateFrom: defaultFilters?.dateFrom || '',
    dateTo: defaultFilters?.dateTo || ''
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    const clearedFilters = { content: '', dateFrom: '', dateTo: '' };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasActiveFilters = filters.content || filters.dateFrom || filters.dateTo;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-3">
        <div>
          <Label htmlFor="content-search" className="text-sm font-medium mb-1.5">
            Search by content
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="content-search"
              type="text"
              placeholder="Search message content..."
              value={filters.content}
              onChange={(e) => setFilters({ ...filters, content: e.target.value })}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="date-from" className="text-sm font-medium mb-1.5">
              Start date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="date-to" className="text-sm font-medium mb-1.5">
              End date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSearch} size="sm" className="flex-1">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {hasActiveFilters && (
          <Button onClick={handleClear} size="sm" variant="outline">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
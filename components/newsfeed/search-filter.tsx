"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  onSearch: (filters: {
    search?: string;
    content_type?: string;
    date_from?: string;
    date_to?: string;
    has_media?: boolean;
  }) => void;
  onClear: () => void;
}

export function SearchFilter({ onSearch, onClear }: SearchFilterProps) {
  const [search, setSearch] = useState("");
  const [contentType, setContentType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [hasMedia, setHasMedia] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    const filters: any = {};
    
    if (search.trim()) filters.search = search.trim();
    if (contentType) filters.content_type = contentType;
    if (dateFrom) filters.date_from = dateFrom.toISOString();
    if (dateTo) filters.date_to = dateTo.toISOString();
    if (hasMedia !== "") filters.has_media = hasMedia === "true";

    onSearch(filters);
  };

  const handleClear = () => {
    setSearch("");
    setContentType("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setHasMedia("");
    onClear();
  };

  const hasActiveFilters = search || contentType || dateFrom || dateTo || hasMedia !== "";

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "h-10 px-3",
            showFilters && "bg-accent"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <div className="ml-2 h-2 w-2 bg-primary rounded-full"></div>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleSearch}
          className="h-10 px-4"
        >
          Search
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleClear}
            className="h-10 px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              Post Type
            </label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="poll">Poll</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              From Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              To Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              Media Attachments
            </label>
            <Select value={hasMedia} onValueChange={setHasMedia}>
              <SelectTrigger>
                <SelectValue placeholder="All posts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All posts</SelectItem>
                <SelectItem value="true">With media</SelectItem>
                <SelectItem value="false">Without media</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

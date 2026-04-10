'use client';

import { useJobStore } from '@/lib/store';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search } from 'lucide-react';

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Full Stack', 'AI/ML', 'Product'];

export default function FilterBar() {
  const { searchQuery, categoryFilter, setSearchQuery, setCategoryFilter } = useJobStore();

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search jobs by title, company, or skills..."
          className="pl-10 h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="w-full sm:w-[200px]">
        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'All')}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

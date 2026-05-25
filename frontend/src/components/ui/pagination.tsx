import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Pagination as PaginationType } from '@/types';

interface Props {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: Props) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} ({total} items)
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="size-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`d${i}`} className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <Button key={p} variant={p === page ? 'default' : 'outline'} size="icon" className="size-8 text-xs" onClick={() => onPageChange(p)}>
              {p}
            </Button>
          )
        )}
        <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="size-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

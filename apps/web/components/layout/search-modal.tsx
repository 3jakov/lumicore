'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, Loader2, Search, Users2, Box, X } from 'lucide-react';

import { useSearch } from '@/hooks/use-search';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SearchModal({ open, onClose }: Props): JSX.Element | null {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data, isFetching } = useSearch(query);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Cmd/Ctrl+K to open (handled by parent, but just in case)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) return; // parent handles opening
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  const hasResults =
    data && (data.projects.length > 0 || data.tasks.length > 0 || data.employees.length > 0);
  const showEmpty = query.trim().length >= 2 && !isFetching && !hasResults;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-0 shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          {isFetching
            ? <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-text-muted" />
            : <Search className="h-4 w-4 flex-shrink-0 text-text-muted" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск проектов, задач, сотрудников…"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden rounded-lg border border-border-subtle px-2 py-0.5 text-xs text-text-muted sm:inline">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {data && hasResults && (
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {data.projects.length > 0 && (
              <ResultGroup label="Проекты" icon={<FolderKanban className="h-3.5 w-3.5" />}>
                {data.projects.map((p) => (
                  <ResultItem
                    key={p.id}
                    primary={p.name}
                    secondary={p.display_id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  />
                ))}
              </ResultGroup>
            )}

            {data.tasks.length > 0 && (
              <ResultGroup label="Задачи" icon={<Box className="h-3.5 w-3.5" />}>
                {data.tasks.map((t) => (
                  <ResultItem
                    key={t.id}
                    primary={t.name}
                    secondary={t.status}
                    onClick={() => navigate(`/tasks/${t.id}`)}
                  />
                ))}
              </ResultGroup>
            )}

            {data.employees.length > 0 && (
              <ResultGroup label="Сотрудники" icon={<Users2 className="h-3.5 w-3.5" />}>
                {data.employees.map((e) => (
                  <ResultItem
                    key={e.id}
                    primary={e.full_name}
                    secondary={e.group}
                    onClick={() => navigate(`/team/people/${e.id}`)}
                  />
                ))}
              </ResultGroup>
            )}
          </div>
        )}

        {showEmpty && (
          <p className="px-4 py-8 text-center text-sm text-text-muted">
            Ничего не найдено по запросу «{query.trim()}»
          </p>
        )}

        {query.trim().length < 2 && (
          <p className="px-4 py-6 text-center text-xs text-text-muted">
            Введите минимум 2 символа
          </p>
        )}
      </div>
    </div>
  );
}

function ResultGroup({
  label, icon, children,
}: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultItem({
  primary, secondary, onClick,
}: { primary: string; secondary?: string | null; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition hover:bg-surface-1"
    >
      <span className="font-medium text-text-primary">{primary}</span>
      {secondary && <span className="ml-4 text-xs text-text-muted">{secondary}</span>}
    </button>
  );
}

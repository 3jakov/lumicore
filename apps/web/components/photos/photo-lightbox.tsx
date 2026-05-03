'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, MapPin, Clock, User, FolderKanban,
  MessageCircle, Send, Loader2,
} from 'lucide-react';

import { usePhotoDetail } from '@/hooks/use-photo-detail';
import { useAddPhotoComment } from '@/hooks/use-add-photo-comment';

type Props = {
  photoId: number | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <span
      className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

function fmtDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function PhotoLightbox({ photoId, onClose, onPrev, onNext, hasPrev, hasNext }: Props) {
  const { data: photo, isLoading } = usePhotoDetail(photoId);
  const { mutate: addComment, isPending: isCommenting } = useAddPhotoComment(photoId ?? 0);
  const [commentText, setCommentText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !photoId) return;
    addComment(text, { onSuccess: () => setCommentText('') });
  }

  if (!photoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/80"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-14 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/80 md:right-4"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main content */}
      <div className="flex h-full w-full max-w-6xl flex-col md:flex-row">
        {/* Photo */}
        <div className="relative flex flex-1 items-center justify-center p-4">
          {isLoading || !photo ? (
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.url}
              alt={photo.original_filename}
              className="max-h-[70vh] max-w-full rounded-2xl object-contain md:max-h-[90vh]"
            />
          )}
        </div>

        {/* Sidebar: meta + comments */}
        {photo && (
          <div className="flex w-full flex-col bg-surface-0 md:w-80 md:overflow-y-auto">
            {/* Meta */}
            <div className="space-y-3 border-b border-border-subtle p-4">
              <div className="flex items-center gap-2">
                <Avatar initials={photo.author_initials} color={photo.author_avatar_color} />
                <span className="text-sm font-medium text-text-primary">{photo.author_name}</span>
              </div>

              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  {fmtDatetime(photo.taken_at)}
                </div>

                {photo.project_name && (
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-3.5 w-3.5 flex-shrink-0" />
                    {photo.project_name}
                  </div>
                )}

                {photo.gps_lat !== null && photo.gps_lng !== null && (
                  <a
                    href={`https://maps.google.com/?q=${photo.gps_lat},${photo.gps_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-accent-600 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {photo.gps_lat.toFixed(5)}, {photo.gps_lng.toFixed(5)}
                  </a>
                )}

                {!photo.project_name && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <User className="h-3.5 w-3.5 flex-shrink-0" />
                    Без проекта
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
                <MessageCircle className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Комментарии ({photo.comments.length})
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {photo.comments.length === 0 && (
                  <p className="text-xs text-text-muted">Пока нет комментариев</p>
                )}
                {photo.comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar initials={c.author_initials} color={c.author_avatar_color} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary">{c.author_name}</p>
                      <p className="mt-0.5 text-xs text-text-secondary break-words">{c.text}</p>
                      <p className="mt-1 text-[11px] text-text-muted">{fmtDatetime(c.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <form onSubmit={handleSubmitComment} className="border-t border-border-subtle p-3">
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment(e);
                      }
                    }}
                    placeholder="Написать комментарий…"
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-border-subtle bg-surface-1 px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-300"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isCommenting}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-full bg-accent-600 text-white transition hover:bg-accent-700 disabled:opacity-40"
                  >
                    {isCommenting
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { Camera, ChevronLeft, ChevronRight, Loader2, MessageCircle, Upload } from 'lucide-react';
import type { PhotoSummary } from '@lumicore/shared-types';

import { usePhotos } from '@/hooks/use-photos';
import { useUploadPhoto } from '@/hooks/use-upload-photo';
import { PhotoLightbox } from './photo-lightbox';

type Props = {
  projectId?: number;
  title?: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function PhotoGrid({ projectId, title = 'Фото' }: Props) {
  const [page, setPage] = useState(1);
  const [activePhoId, setActivePhotoId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, refetch } = usePhotos({
    project_id: projectId,
    page,
    limit: 30,
  });

  const { mutate: upload, isPending: isUploading } = useUploadPhoto();

  const photos = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.ceil(total / (data?.meta.limit ?? 30));

  const activeIndex = activePhoId !== null ? photos.findIndex((p) => p.id === activePhoId) : -1;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upload({ file, project_id: projectId });
    e.target.value = '';
  }

  if (isLoading) {
    return (
      <div className="panel flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="panel flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm font-semibold text-text-primary">Не удалось загрузить фото</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="pill cursor-pointer text-sm hover:border-border-strong"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {total > 0 ? `${total} фото` : 'Нет фото'}
        </p>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="pill cursor-pointer gap-2 transition hover:border-accent-200 hover:bg-accent-50 hover:text-accent-700 disabled:opacity-50"
          >
            {isUploading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Upload className="h-3.5 w-3.5" />
            }
            {isUploading ? 'Загрузка…' : 'Загрузить фото'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="panel flex flex-col items-center gap-4 py-20 text-center">
          <Camera className="h-10 w-10 text-border-subtle" />
          <p className="text-sm text-text-muted">Фотографий пока нет</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="pill cursor-pointer gap-2 hover:border-accent-200 hover:bg-accent-50 hover:text-accent-700"
          >
            <Upload className="h-3.5 w-3.5" />
            Загрузить первое фото
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {photos.map((photo: PhotoSummary) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              onClick={() => setActivePhotoId(photo.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>{total} фото</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="pill disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="pill disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <PhotoLightbox
        photoId={activePhoId}
        onClose={() => setActivePhotoId(null)}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex < photos.length - 1}
        onPrev={() => activeIndex > 0 && setActivePhotoId(photos[activeIndex - 1].id)}
        onNext={() => activeIndex < photos.length - 1 && setActivePhotoId(photos[activeIndex + 1].id)}
      />
    </div>
  );
}

function PhotoTile({ photo, onClick }: { photo: PhotoSummary; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-2xl border border-border-subtle bg-surface-1"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.thumbnail_url ?? photo.url}
        alt={photo.original_filename}
        className="h-full w-full object-cover transition group-hover:scale-105"
      />
      {/* Overlay on hover */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-white">{photo.author_initials}</p>
        <p className="text-[11px] text-white/70">{fmtDate(photo.taken_at)}</p>
      </div>
      {/* Comment badge */}
      {photo.comment_count > 0 && (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          <MessageCircle className="h-2.5 w-2.5" />
          {photo.comment_count}
        </div>
      )}
    </button>
  );
}

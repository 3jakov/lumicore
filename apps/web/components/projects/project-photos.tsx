'use client';

import { AlertCircle, ImageIcon, Upload } from 'lucide-react';
import { useRef } from 'react';

import { usePhotos } from '@/hooks/use-photos';
import { useUploadPhoto } from '@/hooks/use-upload-photo';

type ProjectPhotosProps = Readonly<{
  projectId: number;
}>;

export function ProjectPhotos({ projectId }: ProjectPhotosProps): JSX.Element {
  const { data: photos, isLoading, isError, refetch } = usePhotos(projectId);
  const { isUploading, uploadError, uploadPhoto } = useUploadPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after an error
    event.target.value = '';
    await uploadPhoto(file, projectId);
  }

  if (isLoading) {
    return (
      <section className="panel p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-border-subtle" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="panel flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div>
          <p className="font-semibold text-text-primary">Failed to load photos</p>
          <p className="mt-1 text-sm text-text-secondary">Check your connection and try again.</p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="panel space-y-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Photos</h2>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Uploading…' : 'Upload photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      {uploadError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {uploadError}
        </p>
      ) : null}

      {photos && photos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-surface-1 py-16 text-center">
          <ImageIcon className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">No photos yet. Upload the first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos?.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-2xl bg-border-subtle"
              title={photo.original_filename}
            >
              <img
                src={photo.thumbnail_url ?? photo.url}
                alt={photo.original_filename}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

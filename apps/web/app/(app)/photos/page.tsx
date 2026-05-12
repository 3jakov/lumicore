import { PageHeader } from '@/components/layout/page-header';
import { PhotoGrid } from '@/components/photos/photo-grid';

export default function PhotosPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Галерея"
        title="Все фотографии"
        description="Фото со всех проектов и без привязки."
      />
      <PhotoGrid />
    </div>
  );
}

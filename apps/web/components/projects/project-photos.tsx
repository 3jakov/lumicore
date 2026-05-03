'use client';

import { PhotoGrid } from '@/components/photos/photo-grid';

type Props = Readonly<{ projectId: number }>;

export function ProjectPhotos({ projectId }: Props): JSX.Element {
  return <PhotoGrid projectId={projectId} />;
}

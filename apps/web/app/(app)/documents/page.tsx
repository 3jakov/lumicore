import { FolderOpen } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';

export default function DocumentsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Documents"
        title="Project documents"
        description="Documents are attached to individual projects."
      />

      <section className="panel p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="rounded-[1.25rem] bg-brand-50 p-4 text-brand-700">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Project documents</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-text-secondary">
              Open a project to view, upload, or manage its documents.
            </p>
          </div>
        </div>

        <Link
          href="/projects"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800"
        >
          Go to Projects
        </Link>
      </section>
    </div>
  );
}

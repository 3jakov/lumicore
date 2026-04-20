import { InternalDocumentsAdmin } from '@/components/doc-acknowledgement/internal-documents-admin';
import { PageHeader } from '@/components/layout/page-header';

export default function InternalDocumentsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Internal documents"
        description="Manage documents that require employee acknowledgement."
      />
      <InternalDocumentsAdmin />
    </div>
  );
}

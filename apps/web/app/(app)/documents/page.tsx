import { MyDocumentsInbox } from '@/components/doc-acknowledgement/my-documents-inbox';
import { PageHeader } from '@/components/layout/page-header';

export default function DocumentsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Documents"
        title="My documents"
        description="Review and acknowledge documents assigned to you."
      />
      <MyDocumentsInbox />
    </div>
  );
}

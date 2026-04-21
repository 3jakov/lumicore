'use client';

import { MyDocumentsInbox } from '@/components/doc-acknowledgement/my-documents-inbox';
import { PageHeader } from '@/components/layout/page-header';
import { useTranslation } from '@/hooks/use-translation';

export default function DocumentsPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('docAck.eyebrow')}
        title={t('docAck.title')}
        description={t('docAck.description')}
      />
      <MyDocumentsInbox />
    </div>
  );
}

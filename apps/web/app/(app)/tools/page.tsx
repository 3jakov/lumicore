'use client';

import { PlaceholderRoutePage } from '@/components/layout/placeholder-route-page';
import { useTranslation } from '@/hooks/use-translation';

export default function ToolsPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <PlaceholderRoutePage
      eyebrow={t('tools.title')}
      title={t('tools.scaffoldTitle')}
      description={t('tools.description')}
      panels={[
        {
          title: t('tools.integrationBoundaryTitle'),
          description: t('tools.integrationBoundaryDescription'),
        },
        {
          title: t('tools.implementationLaterTitle'),
          description: t('tools.implementationLaterDescription'),
        },
      ]}
    />
  );
}

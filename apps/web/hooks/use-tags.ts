'use client';

import type { TagSummary } from '@lumicore/shared-types';
import { TagEntityType } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

function useTagsByType(entityType: TagEntityType): UseQueryResult<TagSummary[]> {
  return useQuery({
    queryKey: queryKeys.settings.tagsFiltered(entityType),
    queryFn: () =>
      apiClient.get<TagSummary[]>('/settings/tags', {
        params: { entity_type: entityType },
      }),
  });
}

export function useProjectTags(): UseQueryResult<TagSummary[]> {
  return useTagsByType(TagEntityType.project);
}

export function useTaskTags(): UseQueryResult<TagSummary[]> {
  return useTagsByType(TagEntityType.task);
}

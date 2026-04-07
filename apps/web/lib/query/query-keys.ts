/**
 * Centralised React Query key factory.
 *
 * list(filters?) includes the filters object in the key so each unique
 * combination of params gets its own cache entry. undefined filters and
 * no-filters calls produce the same key: [..., undefined].
 *
 * Invalidation pattern:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
 *   → invalidates every projects cache entry (list + any future detail keys)
 */
type ListFilters = Record<string, unknown> | undefined;

export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: (filters?: ListFilters) => ['projects', 'list', filters] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (filters?: ListFilters) => ['tasks', 'list', filters] as const,
  },
  timeEntries: {
    all: ['time-entries'] as const,
    list: (filters?: ListFilters) => ['time-entries', 'list', filters] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (filters?: ListFilters) => ['employees', 'list', filters] as const,
  },
};

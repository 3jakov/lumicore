/**
 * Centralised React Query key factory.
 *
 * list(filters?) includes the filters object in the key so each unique
 * combination of params gets its own cache entry. undefined filters and
 * no-filters calls produce the same key: [..., undefined].
 *
 * Invalidation pattern:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists })
 *   → invalidates every projects list cache entry without touching detail keys
 */
type ListFilters = Record<string, unknown> | undefined;

export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: ['projects', 'list'] as const,
    list: (filters?: ListFilters) => ['projects', 'list', filters] as const,
    detail: (id: number) => ['projects', 'detail', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    lists: ['tasks', 'list'] as const,
    list: (filters?: ListFilters) => ['tasks', 'list', filters] as const,
    detail: (id: number) => ['tasks', 'detail', id] as const,
    templates: ['tasks', 'templates'] as const,
  },
  timeEntries: {
    all: ['time-entries'] as const,
    lists: ['time-entries', 'list'] as const,
    list: (filters?: ListFilters) => ['time-entries', 'list', filters] as const,
    detail: (id: number) => ['time-entries', 'detail', id] as const,
    praegu: ['time-entries', 'praegu'] as const,
    timesheets: ['time-entries', 'timesheet'] as const,
    timesheet: (filters?: ListFilters) => ['time-entries', 'timesheet', filters] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (filters?: ListFilters) => ['employees', 'list', filters] as const,
  },
};

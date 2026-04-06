export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: () => ['projects', 'list'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: () => ['tasks', 'list'] as const,
  },
  timeEntries: {
    all: ['time-entries'] as const,
    list: () => ['time-entries', 'list'] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: () => ['employees', 'list'] as const,
  },
} as const;

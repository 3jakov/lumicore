import { useQuery } from '@tanstack/react-query';
import type { PaginatedResponse, ProjectSummary, TaskSummary, EmployeeSummary } from '@lumicore/shared-types';
import { apiClient } from '@/lib/api-client';

type SearchResults = {
  projects: ProjectSummary[];
  tasks: TaskSummary[];
  employees: EmployeeSummary[];
};

export function useSearch(query: string) {
  const q = query.trim();

  return useQuery<SearchResults>({
    queryKey: ['search', q],
    queryFn: async () => {
      const [projects, tasks, employees] = await Promise.all([
        apiClient.get<PaginatedResponse<ProjectSummary>>('/projects', { params: { search: q, limit: 5 } }),
        apiClient.get<PaginatedResponse<TaskSummary>>('/tasks', { params: { search: q, limit: 5 } }),
        apiClient.get<PaginatedResponse<EmployeeSummary>>('/employees', { params: { search: q, limit: 5 } }),
      ]);
      return {
        projects: projects.data,
        tasks: tasks.data,
        employees: employees.data,
      };
    },
    enabled: q.length >= 2,
    staleTime: 10_000,
  });
}

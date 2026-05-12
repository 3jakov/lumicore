import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TimesheetSummary } from '@lumicore/shared-types';

function monthBounds(year: number, month: number) {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate(); // day-0 trick = last day of month
  const dd = String(lastDay).padStart(2, '0');
  return {
    date_from: `${year}-${mm}-01`,
    date_to: `${year}-${mm}-${dd}`,
  };
}

export function useTimesheet(year: number, month: number) {
  const { date_from, date_to } = monthBounds(year, month);
  return useQuery<TimesheetSummary>({
    queryKey: ['timesheet', year, month],
    queryFn: () =>
      apiClient.get<TimesheetSummary>(
        `/time-entries/timesheet?date_from=${date_from}&date_to=${date_to}`,
      ),
    staleTime: 60_000,
  });
}

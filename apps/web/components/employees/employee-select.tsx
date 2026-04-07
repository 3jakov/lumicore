'use client';

import type { EmployeeSummary } from '@lumicore/shared-types';

import { useEmployees } from '@/hooks/use-employees';

const selectCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

type EmployeeSelectProps = Readonly<{
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}>;

export function EmployeeSelect({
  id,
  value,
  onChange,
  disabled = false,
}: EmployeeSelectProps): JSX.Element {
  const { data, isLoading, isError } = useEmployees();
  const employees: EmployeeSummary[] = data?.data ?? [];

  function formatOptionLabel(employee: EmployeeSummary): string {
    return `${employee.full_name} - ${employee.group}`;
  }

  if (isLoading) {
    return (
      <select id={id} disabled className={selectCls}>
        <option value="">Loading employees...</option>
      </select>
    );
  }

  if (isError) {
    return (
      <select id={id} disabled className={selectCls}>
        <option value="">Failed to load employees</option>
      </select>
    );
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={selectCls}
    >
      <option value="">No project manager selected</option>
      {employees.map((employee) => (
        <option key={employee.id} value={String(employee.id)}>
          {formatOptionLabel(employee)}
        </option>
      ))}
    </select>
  );
}

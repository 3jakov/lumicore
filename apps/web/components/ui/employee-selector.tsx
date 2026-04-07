'use client';

import type { EmployeeSummary } from '@lumicore/shared-types';

import { useEmployees } from '@/hooks/use-employees';

const selectCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

type EmployeeSelectorProps = Readonly<{
  /** HTML id for the <select> element — pair with a <label htmlFor={id}> */
  id?: string;
  /**
   * Controlled value.
   * Empty string means "no selection" (maps to null in the API payload).
   * A stringified employee id, e.g. "12", means that employee is selected.
   */
  value: string;
  /** Called with a stringified employee id (e.g. "12") or "" for no selection. */
  onChange: (value: string) => void;
  disabled?: boolean;
}>;

/**
 * Reusable employee selector backed by GET /api/v1/employees.
 *
 * Renders as a <select> so it composes naturally with any form layout.
 * Loading and error states degrade gracefully without breaking the surrounding form.
 *
 * Serialisation contract:
 *   value === ""   → project_manager_id: null  (serialised by the form layer)
 *   value === "12" → project_manager_id: 12    (serialised by the form layer)
 */
export function EmployeeSelector({
  id,
  value,
  onChange,
  disabled = false,
}: EmployeeSelectorProps): JSX.Element {
  const { data, isLoading, isError } = useEmployees();

  const employees: EmployeeSummary[] = data?.data ?? [];

  if (isLoading) {
    return (
      <select id={id} disabled className={selectCls}>
        <option value="">Loading employees…</option>
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
      <option value="">— No manager —</option>
      {employees.map((employee) => (
        <option key={employee.id} value={String(employee.id)}>
          {employee.full_name}
        </option>
      ))}
    </select>
  );
}

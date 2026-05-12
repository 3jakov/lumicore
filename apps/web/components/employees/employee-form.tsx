'use client';

import {
  EmployeeGroup,
  EmployeeStatus,
  Language,
  TimeFormat,
  type CreateEmployeeDto,
  type EmployeeDetail,
  type UpdateEmployeeDto,
} from '@lumicore/shared-types';
import type { RoleSummary } from '@lumicore/shared-types';
import type { ChangeEvent } from 'react';

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

const textAreaCls = `${inputCls} min-h-28 resize-y`;

const groupOptions = [
  EmployeeGroup.Paigaldus,
  EmployeeGroup.Tootmine,
  EmployeeGroup.Kontor,
  EmployeeGroup.Ladu,
] as const;

const statusOptions = [EmployeeStatus.Aktiivne, EmployeeStatus.Arhiveeritud] as const;
const languageOptions = [Language.ET, Language.RU] as const;
const timeFormatOptions = [TimeFormat.H24, TimeFormat.H12] as const;

export type EmployeeFormState = {
  full_name: string;
  group: EmployeeGroup;
  status: EmployeeStatus;
  phone: string;
  email: string;
  work_schedule: string;
  norm_hours_per_week: string;
  project_access_all: boolean;
  language: Language;
  time_format: TimeFormat;
  hourly_rate: string;
  personal_id: string;
  birth_date: string;
  additional_info: string;
  role_ids: string[];
};

export const emptyEmployeeFormState: EmployeeFormState = {
  full_name: '',
  group: EmployeeGroup.Kontor,
  status: EmployeeStatus.Aktiivne,
  phone: '',
  email: '',
  work_schedule: '',
  norm_hours_per_week: '40',
  project_access_all: true,
  language: Language.ET,
  time_format: TimeFormat.H24,
  hourly_rate: '',
  personal_id: '',
  birth_date: '',
  additional_info: '',
  role_ids: [],
};

type ComparableEmployeeState = {
  full_name: string;
  group: EmployeeGroup;
  status: EmployeeStatus;
  phone: string | null;
  email: string | null;
  work_schedule: string | null;
  norm_hours_per_week: number;
  project_access_all: boolean;
  language: Language;
  time_format: TimeFormat;
  hourly_rate: string | null;
  personal_id: string | null;
  birth_date: string | null;
  additional_info: string | null;
  role_ids: number[];
};

type EmployeeFormFieldsProps = Readonly<{
  disabled: boolean;
  form: EmployeeFormState;
  onFieldChange: <K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]) => void;
  roles: RoleSummary[];
  showStatus?: boolean;
  showSensitiveFields?: boolean;
}>;

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toRoleIds(values: string[]): number[] {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function toComparableEmployeeState(state: EmployeeFormState): ComparableEmployeeState {
  return {
    full_name: state.full_name.trim(),
    group: state.group,
    status: state.status,
    phone: toNullableString(state.phone),
    email: toNullableString(state.email),
    work_schedule: toNullableString(state.work_schedule),
    norm_hours_per_week: toNumber(state.norm_hours_per_week, 40),
    project_access_all: state.project_access_all,
    language: state.language,
    time_format: state.time_format,
    hourly_rate: toNullableString(state.hourly_rate),
    personal_id: toNullableString(state.personal_id),
    birth_date: state.birth_date || null,
    additional_info: toNullableString(state.additional_info),
    role_ids: toRoleIds(state.role_ids),
  };
}

export function normalizeEmployeeFormState(employee: EmployeeDetail): EmployeeFormState {
  return {
    full_name: employee.full_name,
    group: employee.group,
    status: employee.status,
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    work_schedule: employee.work_schedule ?? '',
    norm_hours_per_week: String(employee.norm_hours_per_week),
    project_access_all: employee.project_access_all,
    language: employee.language,
    time_format: employee.time_format,
    hourly_rate: employee.hourly_rate ?? '',
    personal_id: employee.personal_id ?? '',
    birth_date: employee.birth_date ?? '',
    additional_info: employee.additional_info ?? '',
    role_ids: [],
  };
}

export function buildCreateEmployeePayload(state: EmployeeFormState): CreateEmployeeDto {
  const comparable = toComparableEmployeeState(state);

  return {
    full_name: comparable.full_name,
    group: comparable.group,
    phone: comparable.phone ?? undefined,
    email: comparable.email ?? undefined,
    work_schedule: comparable.work_schedule ?? undefined,
    norm_hours_per_week: comparable.norm_hours_per_week,
    project_access_all: comparable.project_access_all,
    language: comparable.language,
    time_format: comparable.time_format,
    hourly_rate: comparable.hourly_rate ?? undefined,
    personal_id: comparable.personal_id ?? undefined,
    birth_date: comparable.birth_date ?? undefined,
    additional_info: comparable.additional_info ?? undefined,
    role_ids: comparable.role_ids.length > 0 ? comparable.role_ids : undefined,
  };
}

export function buildUpdateEmployeePayload(
  initialState: EmployeeFormState,
  currentState: EmployeeFormState,
): UpdateEmployeeDto {
  const initialComparable = toComparableEmployeeState(initialState);
  const currentComparable = toComparableEmployeeState(currentState);
  const payload: UpdateEmployeeDto = {};

  if (initialComparable.full_name !== currentComparable.full_name) payload.full_name = currentComparable.full_name;
  if (initialComparable.group !== currentComparable.group) payload.group = currentComparable.group;
  if (initialComparable.status !== currentComparable.status) payload.status = currentComparable.status;
  if (initialComparable.phone !== currentComparable.phone) payload.phone = currentComparable.phone ?? undefined;
  if (initialComparable.email !== currentComparable.email) payload.email = currentComparable.email ?? undefined;
  if (initialComparable.work_schedule !== currentComparable.work_schedule) payload.work_schedule = currentComparable.work_schedule ?? undefined;
  if (initialComparable.norm_hours_per_week !== currentComparable.norm_hours_per_week) payload.norm_hours_per_week = currentComparable.norm_hours_per_week;
  if (initialComparable.project_access_all !== currentComparable.project_access_all) payload.project_access_all = currentComparable.project_access_all;
  if (initialComparable.language !== currentComparable.language) payload.language = currentComparable.language;
  if (initialComparable.time_format !== currentComparable.time_format) payload.time_format = currentComparable.time_format;
  if (initialComparable.hourly_rate !== currentComparable.hourly_rate) payload.hourly_rate = currentComparable.hourly_rate ?? undefined;
  if (initialComparable.personal_id !== currentComparable.personal_id) payload.personal_id = currentComparable.personal_id ?? undefined;
  if (initialComparable.birth_date !== currentComparable.birth_date) payload.birth_date = currentComparable.birth_date ?? undefined;
  if (initialComparable.additional_info !== currentComparable.additional_info) payload.additional_info = currentComparable.additional_info ?? undefined;
  if (JSON.stringify(initialComparable.role_ids) !== JSON.stringify(currentComparable.role_ids)) {
    payload.role_ids = currentComparable.role_ids;
  }

  return payload;
}

export function hasEmployeeFormChanges(
  initialState: EmployeeFormState,
  currentState: EmployeeFormState,
): boolean {
  return (
    JSON.stringify(toComparableEmployeeState(initialState)) !==
    JSON.stringify(toComparableEmployeeState(currentState))
  );
}

export function EmployeeFormFields({
  disabled,
  form,
  onFieldChange,
  roles,
  showStatus = false,
  showSensitiveFields = true,
}: EmployeeFormFieldsProps): JSX.Element {
  function handleRoleIdsChange(event: ChangeEvent<HTMLSelectElement>): void {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    onFieldChange('role_ids', values);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-full-name">
          Full name
        </label>
        <input
          id="employee-full-name"
          type="text"
          value={form.full_name}
          onChange={(event) => onFieldChange('full_name', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Employee full name"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-group">
          Group
        </label>
        <select
          id="employee-group"
          value={form.group}
          onChange={(event) => onFieldChange('group', event.target.value as EmployeeGroup)}
          disabled={disabled}
          className={inputCls}
        >
          {groupOptions.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      {showStatus ? (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-text-primary" htmlFor="employee-status">
            Status
          </label>
          <select
            id="employee-status"
            value={form.status}
            onChange={(event) => onFieldChange('status', event.target.value as EmployeeStatus)}
            disabled={disabled}
            className={inputCls}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-phone">
          Phone
        </label>
        <input
          id="employee-phone"
          type="tel"
          value={form.phone}
          onChange={(event) => onFieldChange('phone', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional phone number"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-email">
          Email
        </label>
        <input
          id="employee-email"
          type="email"
          value={form.email}
          onChange={(event) => onFieldChange('email', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional email address"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-work-schedule">
          Work schedule
        </label>
        <input
          id="employee-work-schedule"
          type="text"
          value={form.work_schedule}
          onChange={(event) => onFieldChange('work_schedule', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional work schedule"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-hours">
          Norm hours per week
        </label>
        <input
          id="employee-hours"
          type="number"
          min="0"
          value={form.norm_hours_per_week}
          onChange={(event) => onFieldChange('norm_hours_per_week', event.target.value)}
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-language">
          Language
        </label>
        <select
          id="employee-language"
          value={form.language}
          onChange={(event) => onFieldChange('language', event.target.value as Language)}
          disabled={disabled}
          className={inputCls}
        >
          {languageOptions.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-time-format">
          Time format
        </label>
        <select
          id="employee-time-format"
          value={form.time_format}
          onChange={(event) => onFieldChange('time_format', event.target.value as TimeFormat)}
          disabled={disabled}
          className={inputCls}
        >
          {timeFormatOptions.map((timeFormat) => (
            <option key={timeFormat} value={timeFormat}>
              {timeFormat}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 lg:col-span-2">
        <label className="inline-flex items-center gap-3 text-sm font-semibold text-text-primary">
          <input
            type="checkbox"
            checked={form.project_access_all}
            onChange={(event) => onFieldChange('project_access_all', event.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-border-subtle text-accent-600 focus:ring-accent-500"
          />
          Project access to all projects
        </label>
      </div>

      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-roles">
          Roles
        </label>
        <select
          id="employee-roles"
          multiple
          value={form.role_ids}
          onChange={handleRoleIdsChange}
          disabled={disabled}
          className={`${inputCls} min-h-40`}
        >
          {roles.map((role) => (
            <option key={role.id} value={String(role.id)}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {showSensitiveFields ? (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="employee-rate">
              Hourly rate
            </label>
            <input
              id="employee-rate"
              type="text"
              value={form.hourly_rate}
              onChange={(event) => onFieldChange('hourly_rate', event.target.value)}
              disabled={disabled}
              className={inputCls}
              placeholder="Optional hourly rate"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="employee-personal-id">
              Personal ID
            </label>
            <input
              id="employee-personal-id"
              type="text"
              value={form.personal_id}
              onChange={(event) => onFieldChange('personal_id', event.target.value)}
              disabled={disabled}
              className={inputCls}
              placeholder="Optional personal ID"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="employee-birth-date">
              Birth date
            </label>
            <input
              id="employee-birth-date"
              type="date"
              value={form.birth_date}
              onChange={(event) => onFieldChange('birth_date', event.target.value)}
              disabled={disabled}
              className={inputCls}
            />
          </div>
        </>
      ) : null}

      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="employee-notes">
          Additional info
        </label>
        <textarea
          id="employee-notes"
          value={form.additional_info}
          onChange={(event) => onFieldChange('additional_info', event.target.value)}
          disabled={disabled}
          className={textAreaCls}
          placeholder="Optional internal notes"
        />
      </div>
    </div>
  );
}

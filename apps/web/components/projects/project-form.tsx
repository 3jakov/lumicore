'use client';

import { ProjectStatus, type CreateProjectDto, type ProjectDetail, type UpdateProjectDto } from '@lumicore/shared-types';

import { EmployeeSelect } from '@/components/employees/employee-select';

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

const textAreaCls = `${inputCls} min-h-28 resize-y`;

const statusOptions = [
  ProjectStatus.Hinnapakkumises,
  ProjectStatus.Ettevalmistuses,
  ProjectStatus.Toos,
  ProjectStatus.Lopetatud,
] as const;

export type ProjectFormState = {
  name: string;
  status: ProjectStatus;
  description: string;
  start_date: string;
  end_date: string;
  location_address: string;
  contract_number: string;
  client_company_name: string;
  client_contact_name: string;
  client_phone: string;
  client_email: string;
  project_manager_id: string;
};

export const emptyProjectFormState: ProjectFormState = {
  name: '',
  status: ProjectStatus.Ettevalmistuses,
  description: '',
  start_date: '',
  end_date: '',
  location_address: '',
  contract_number: '',
  client_company_name: '',
  client_contact_name: '',
  client_phone: '',
  client_email: '',
  project_manager_id: '',
};

type ProjectFormFieldsProps = Readonly<{
  disabled: boolean;
  form: ProjectFormState;
  helperText: string;
  onFieldChange: <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => void;
}>;

type ComparableProjectState = {
  name: string;
  status: ProjectStatus;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location_address: string | null;
  contract_number: string | null;
  client_company_name: string | null;
  client_contact_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  project_manager_id: number | null;
};

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableDate(value: string): string | null {
  return value ? value : null;
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toComparableProjectState(state: ProjectFormState): ComparableProjectState {
  return {
    name: state.name.trim(),
    status: state.status,
    description: toNullableString(state.description),
    start_date: toNullableDate(state.start_date),
    end_date: toNullableDate(state.end_date),
    location_address: toNullableString(state.location_address),
    contract_number: toNullableString(state.contract_number),
    client_company_name: toNullableString(state.client_company_name),
    client_contact_name: toNullableString(state.client_contact_name),
    client_phone: toNullableString(state.client_phone),
    client_email: toNullableString(state.client_email),
    project_manager_id: toNullableNumber(state.project_manager_id),
  };
}

export function normalizeProjectFormState(project: Pick<
  ProjectDetail,
  | 'name'
  | 'status'
  | 'description'
  | 'start_date'
  | 'end_date'
  | 'location_address'
  | 'contract_number'
  | 'client_company_name'
  | 'client_contact_name'
  | 'client_phone'
  | 'client_email'
  | 'project_manager_id'
>): ProjectFormState {
  return {
    name: project.name,
    status: project.status,
    description: project.description ?? '',
    start_date: project.start_date ?? '',
    end_date: project.end_date ?? '',
    location_address: project.location_address ?? '',
    contract_number: project.contract_number ?? '',
    client_company_name: project.client_company_name ?? '',
    client_contact_name: project.client_contact_name ?? '',
    client_phone: project.client_phone ?? '',
    client_email: project.client_email ?? '',
    project_manager_id:
      project.project_manager_id !== null ? String(project.project_manager_id) : '',
  };
}

export function buildCreateProjectPayload(state: ProjectFormState): CreateProjectDto {
  const comparable = toComparableProjectState(state);

  return {
    name: comparable.name,
    status: comparable.status,
    description: comparable.description ?? undefined,
    start_date: comparable.start_date ?? undefined,
    end_date: comparable.end_date ?? undefined,
    location_address: comparable.location_address ?? undefined,
    contract_number: comparable.contract_number ?? undefined,
    client_company_name: comparable.client_company_name ?? undefined,
    client_contact_name: comparable.client_contact_name ?? undefined,
    client_phone: comparable.client_phone ?? undefined,
    client_email: comparable.client_email ?? undefined,
    project_manager_id: comparable.project_manager_id ?? undefined,
  };
}

export function buildUpdateProjectPayload(
  initialState: ProjectFormState,
  currentState: ProjectFormState,
): UpdateProjectDto {
  const initialComparable = toComparableProjectState(initialState);
  const currentComparable = toComparableProjectState(currentState);
  const payload: UpdateProjectDto = {};

  if (initialComparable.name !== currentComparable.name) {
    payload.name = currentComparable.name;
  }

  if (initialComparable.status !== currentComparable.status) {
    payload.status = currentComparable.status;
  }

  if (initialComparable.description !== currentComparable.description) {
    payload.description = currentComparable.description;
  }
  if (initialComparable.start_date !== currentComparable.start_date) {
    payload.start_date = currentComparable.start_date;
  }
  if (initialComparable.end_date !== currentComparable.end_date) {
    payload.end_date = currentComparable.end_date;
  }
  if (initialComparable.location_address !== currentComparable.location_address) {
    payload.location_address = currentComparable.location_address;
  }
  if (initialComparable.contract_number !== currentComparable.contract_number) {
    payload.contract_number = currentComparable.contract_number;
  }
  if (initialComparable.client_company_name !== currentComparable.client_company_name) {
    payload.client_company_name = currentComparable.client_company_name;
  }
  if (initialComparable.client_contact_name !== currentComparable.client_contact_name) {
    payload.client_contact_name = currentComparable.client_contact_name;
  }
  if (initialComparable.client_phone !== currentComparable.client_phone) {
    payload.client_phone = currentComparable.client_phone;
  }
  if (initialComparable.client_email !== currentComparable.client_email) {
    payload.client_email = currentComparable.client_email;
  }
  if (initialComparable.project_manager_id !== currentComparable.project_manager_id) {
    payload.project_manager_id = currentComparable.project_manager_id;
  }

  return payload;
}

export function hasProjectFormChanges(
  initialState: ProjectFormState,
  currentState: ProjectFormState,
): boolean {
  const initialComparable = toComparableProjectState(initialState);
  const currentComparable = toComparableProjectState(currentState);

  return Object.keys(initialComparable).some((key) => {
    const comparableKey = key as keyof ComparableProjectState;
    return initialComparable[comparableKey] !== currentComparable[comparableKey];
  });
}

export function ProjectFormFields({
  disabled,
  form,
  helperText,
  onFieldChange,
}: ProjectFormFieldsProps): JSX.Element {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="project-name">
          Project name
        </label>
        <input
          id="project-name"
          type="text"
          value={form.name}
          onChange={(event) => onFieldChange('name', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Example: Tartu maja aknad"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="project-status">
          Status
        </label>
        <select
          id="project-status"
          value={form.status}
          onChange={(event) => onFieldChange('status', event.target.value as ProjectStatus)}
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

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="project-manager-id">
          Project manager
        </label>
        <EmployeeSelect
          id="project-manager-id"
          value={form.project_manager_id}
          onChange={(value) => onFieldChange('project_manager_id', value)}
          disabled={disabled}
        />
        <p className="text-xs leading-5 text-text-muted">{helperText}</p>
      </div>

      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="project-description">
          Description
        </label>
        <textarea
          id="project-description"
          value={form.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          disabled={disabled}
          className={textAreaCls}
          placeholder="Optional notes about the job scope or context"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="project-start-date">
          Start date
        </label>
        <input
          id="project-start-date"
          type="date"
          value={form.start_date}
          onChange={(event) => onFieldChange('start_date', event.target.value)}
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="project-end-date">
          End date
        </label>
        <input
          id="project-end-date"
          type="date"
          value={form.end_date}
          onChange={(event) => onFieldChange('end_date', event.target.value)}
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="project-location">
          Location address
        </label>
        <input
          id="project-location"
          type="text"
          value={form.location_address}
          onChange={(event) => onFieldChange('location_address', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional address"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="contract-number">
          Contract number
        </label>
        <input
          id="contract-number"
          type="text"
          value={form.contract_number}
          onChange={(event) => onFieldChange('contract_number', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional contract reference"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="client-company">
          Client company
        </label>
        <input
          id="client-company"
          type="text"
          value={form.client_company_name}
          onChange={(event) => onFieldChange('client_company_name', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional company name"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="client-contact">
          Client contact
        </label>
        <input
          id="client-contact"
          type="text"
          value={form.client_contact_name}
          onChange={(event) => onFieldChange('client_contact_name', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional contact name"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="client-phone">
          Client phone
        </label>
        <input
          id="client-phone"
          type="tel"
          value={form.client_phone}
          onChange={(event) => onFieldChange('client_phone', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional phone number"
        />
      </div>

      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="client-email">
          Client email
        </label>
        <input
          id="client-email"
          type="email"
          value={form.client_email}
          onChange={(event) => onFieldChange('client_email', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional email address"
        />
      </div>
    </div>
  );
}

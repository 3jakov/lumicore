import { TagEntityType, EmployeeGroup } from './enums';

export interface RoleSummary {
  id: number;
  name: string;
  created_at: string;
}

export interface CreateRoleDto {
  name: string;
}

export interface UpdateRoleDto {
  name: string;
}

export interface GroupSummary {
  value: EmployeeGroup;
}

export interface TagSummary {
  id: number;
  name: string;
  color: string;
  entity_type: TagEntityType;
  created_at: string;
}

export interface CreateTagDto {
  name: string;
  entity_type: TagEntityType;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

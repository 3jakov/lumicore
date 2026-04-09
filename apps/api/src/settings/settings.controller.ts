import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { RoleSummary, TagSummary, GroupSummary } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ListTagsDto } from './dto/list-tags.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ─── Roles ────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/settings/roles
   * Returns all roles ordered by name.
   */
  @Get('roles')
  getRoles(): Promise<RoleSummary[]> {
    return this.settingsService.getRoles();
  }

  /**
   * POST /api/v1/settings/roles
   * Create a new role. Admin only.
   * Returns the created role (201).
   */
  @Post('roles')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  createRole(@Body() dto: CreateRoleDto): Promise<RoleSummary> {
    return this.settingsService.createRole(dto);
  }

  /**
   * PATCH /api/v1/settings/roles/:id
   * Update a role name. Admin only.
   * Returns the updated role (200).
   */
  @Patch('roles/:id')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleSummary> {
    return this.settingsService.updateRole(id, dto);
  }

  /**
   * DELETE /api/v1/settings/roles/:id
   * Hard delete a role (only if no employees assigned). Admin only.
   * Returns 204 No Content.
   */
  @Delete('roles/:id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  async deleteRole(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.settingsService.deleteRole(id);
  }

  // ─── Groups (read-only) ───────────────────────────────────────────────────

  /**
   * GET /api/v1/settings/groups
   * Returns fixed EmployeeGroup enum values.
   */
  @Get('groups')
  getGroups(): GroupSummary[] {
    return this.settingsService.getGroups();
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/settings/tags
   * Returns non-archived tags. Optional filter: ?entity_type=project|task
   */
  @Get('tags')
  getTags(@Query() dto: ListTagsDto): Promise<TagSummary[]> {
    return this.settingsService.getTags(dto.entity_type);
  }

  /**
   * POST /api/v1/settings/tags
   * Create a new tag. Admin only.
   * Returns the created tag (201).
   */
  @Post('tags')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  createTag(@Body() dto: CreateTagDto): Promise<TagSummary> {
    return this.settingsService.createTag(dto);
  }

  /**
   * PATCH /api/v1/settings/tags/:id
   * Update tag name/color. Admin only.
   * Returns the updated tag (200).
   */
  @Patch('tags/:id')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTagDto,
  ): Promise<TagSummary> {
    return this.settingsService.updateTag(id, dto);
  }

  /**
   * DELETE /api/v1/settings/tags/:id
   * Soft delete (sets archived_at). Admin only.
   * Returns 204 No Content.
   */
  @Delete('tags/:id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  async deleteTag(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.settingsService.deleteTag(id);
  }
}

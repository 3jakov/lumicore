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
import type { TaskDetail, TaskSummary, TaskTemplateSummary } from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TasksService } from './tasks.service';
import { ListTasksDto } from './dto/list-tasks.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ─── Templates (must be declared before :id route) ────────────────────────

  /**
   * GET /api/v1/tasks/templates
   * Returns all active task templates ordered by sort_order.
   * Plain array — not paginated.
   */
  @Get('templates')
  findAllTemplates(): Promise<TaskTemplateSummary[]> {
    return this.tasksService.findAllTemplates();
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/tasks
   * Paginated list of non-archived tasks.
   * Optional filters: ?project_id=1&status=Töös&priority=Kõrgeim&page=1&limit=20
   */
  @Get()
  findAll(@Query() dto: ListTasksDto): Promise<PaginatedResponse<TaskSummary>> {
    return this.tasksService.findAll(dto);
  }

  /**
   * GET /api/v1/tasks/:id
   * Full task detail including assignee_ids.
   * 404 if archived or not found.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TaskDetail> {
    return this.tasksService.findOne(id);
  }

  // ─── Mutations (any authenticated employee at baseline stage) ─────────────

  /**
   * POST /api/v1/tasks
   * Create a task, optionally assigning employees via assignee_ids.
   * Returns the full TaskDetail of the created record (201).
   */
  @Post()
  create(@Body() dto: CreateTaskDto): Promise<TaskDetail> {
    return this.tasksService.create(dto);
  }

  /**
   * PATCH /api/v1/tasks/:id
   * Partial update. Only provided fields are written.
   * assignee_ids: undefined = untouched; [] = clear all; [1,2] = replace.
   * Returns the full updated TaskDetail (200).
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskDetail> {
    return this.tasksService.update(id, dto);
  }

  // ─── Soft delete (Administraator only) ───────────────────────────────────

  /**
   * DELETE /api/v1/tasks/:id
   * Soft delete — sets archived_at.
   * Returns { id } so the frontend can evict the record from cache (200).
   */
  @Delete(':id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  archive(@Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    return this.tasksService.archive(id);
  }
}

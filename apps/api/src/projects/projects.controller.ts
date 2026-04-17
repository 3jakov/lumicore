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
import type { ProjectDetail, ProjectSummary } from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { ListProjectsDto } from './dto/list-projects.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ─── Read (all authenticated users) ──────────────────────────────────────

  /**
   * GET /api/v1/projects
   * Paginated list of active projects. Optional: ?status=Töös&page=1&limit=20
   */
  @Get()
  findAll(@Query() dto: ListProjectsDto): Promise<PaginatedResponse<ProjectSummary>> {
    return this.projectsService.findAll(dto);
  }

  /**
   * GET /api/v1/projects/:id
   * Full project detail.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProjectDetail> {
    return this.projectsService.findOne(id);
  }

  // ─── Mutations (Administraator only) ─────────────────────────────────────

  /**
   * POST /api/v1/projects
   * Create a new project. Returns the full ProjectDetail of the created record.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  create(@Body() dto: CreateProjectDto): Promise<ProjectDetail> {
    return this.projectsService.create(dto);
  }

  /**
   * PATCH /api/v1/projects/:id
   * Partial update. Only provided fields are written.
   * Returns the full updated ProjectDetail.
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectDetail> {
    return this.projectsService.update(id, dto);
  }

  /**
   * DELETE /api/v1/projects/:id
   * Soft delete — sets archived_at, project remains in DB for audit.
   * Returns { id } so the frontend can evict the record from cache.
   */
  @Delete(':id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  archive(@Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    return this.projectsService.archive(id);
  }
}

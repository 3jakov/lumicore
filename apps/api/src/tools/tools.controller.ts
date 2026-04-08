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
import type { ToolDetail, ToolSummary } from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ToolsService } from './tools.service';
import { ListToolsDto } from './dto/list-tools.dto';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@Controller('tools')
@UseGuards(JwtAuthGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  // ─── Read (all authenticated users) ──────────────────────────────────────

  /**
   * GET /api/v1/tools
   * Paginated list of active (non-archived) tools.
   * Optional: ?status=Töökorras&page=1&limit=20
   */
  @Get()
  findAll(@Query() dto: ListToolsDto): Promise<PaginatedResponse<ToolSummary>> {
    return this.toolsService.findAll(dto);
  }

  /**
   * GET /api/v1/tools/:id
   * Full tool detail. 404 if archived or not found.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ToolDetail> {
    return this.toolsService.findOne(id);
  }

  // ─── Mutations (Administraator only) ─────────────────────────────────────

  /**
   * POST /api/v1/tools
   * Create a new tool. Returns the full ToolDetail of the created record.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  create(@Body() dto: CreateToolDto): Promise<ToolDetail> {
    return this.toolsService.create(dto);
  }

  /**
   * PATCH /api/v1/tools/:id
   * Partial update. Only provided fields are written.
   * Returns the full updated ToolDetail.
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateToolDto,
  ): Promise<ToolDetail> {
    return this.toolsService.update(id, dto);
  }

  /**
   * DELETE /api/v1/tools/:id
   * Soft delete — sets archived_at, tool remains in DB for audit.
   * Returns { id } so the frontend can evict the record from cache.
   */
  @Delete(':id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  archive(@Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    return this.toolsService.archive(id);
  }
}

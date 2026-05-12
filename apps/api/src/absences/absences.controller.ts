// Absences module — employee absences/time-off management
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AbsenceSummary } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '@lumicore/shared-types';
import { AbsencesService } from './absences.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { ListAbsencesDto } from './dto/list-absences.dto';

@Controller('absences')
@UseGuards(JwtAuthGuard)
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  /** GET /api/v1/absences/my — current employee's own absences */
  @Get('my')
  findMine(@CurrentUserDecorator() user: CurrentUser): Promise<AbsenceSummary[]> {
    return this.absencesService.findMine(user.id);
  }

  /** GET /api/v1/absences — admin: list all (filterable) */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  findAll(@Query() dto: ListAbsencesDto): Promise<AbsenceSummary[]> {
    return this.absencesService.findAll(dto);
  }

  /** POST /api/v1/absences — admin: create absence record */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  create(
    @Body() dto: CreateAbsenceDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<AbsenceSummary> {
    return this.absencesService.create(dto, user.id);
  }

  /** DELETE /api/v1/absences/:id — admin: delete */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.absencesService.remove(id);
  }
}

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
  UseGuards,
} from '@nestjs/common';
import type {
  InternalDocumentSummary,
  DocAckAssignmentSummary,
  DocAcknowledgementRecord,
  DocumentStatusSummary,
  MyDocumentEntry,
  InternalDocUploadUrlResponse,
} from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '@lumicore/shared-types';
import { DocAcknowledgementService } from './doc-acknowledgement.service';
import { CreateInternalDocumentDto } from './dto/create-internal-document.dto';
import { UpdateInternalDocumentDto } from './dto/update-internal-document.dto';
import { AssignDocumentDto } from './dto/assign-document.dto';

@Controller('internal-documents')
@UseGuards(JwtAuthGuard)
export class DocAcknowledgementController {
  constructor(
    private readonly docAckService: DocAcknowledgementService,
  ) {}

  /**
   * POST /api/v1/internal-documents/upload-url
   * Get a presigned S3 PUT URL for uploading an internal document.
   * Admin only.
   */
  @Post('upload-url')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  getUploadUrl(): Promise<InternalDocUploadUrlResponse> {
    return this.docAckService.getUploadUrl();
  }

  /**
   * GET /api/v1/internal-documents/my
   * Employee: list my pending + acknowledged documents.
   */
  @Get('my')
  getMyDocuments(
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<MyDocumentEntry[]> {
    return this.docAckService.getMyDocuments(user.id);
  }

  /**
   * POST /api/v1/internal-documents
   * Admin: create a new internal document record.
   * Returns 201 with created document.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  create(
    @Body() dto: CreateInternalDocumentDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<InternalDocumentSummary> {
    return this.docAckService.create(dto, user.id);
  }

  /**
   * GET /api/v1/internal-documents
   * Admin: list all non-archived internal documents.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  findAll(): Promise<InternalDocumentSummary[]> {
    return this.docAckService.findAll();
  }

  /**
   * PATCH /api/v1/internal-documents/:id
   * Admin: update document metadata. New s3_key triggers version increment (BR-017).
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInternalDocumentDto,
  ): Promise<InternalDocumentSummary> {
    return this.docAckService.update(id, dto);
  }

  /**
   * DELETE /api/v1/internal-documents/:id
   * Admin: soft archive a document. Returns 204.
   */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  async archive(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.docAckService.archive(id);
  }

  /**
   * POST /api/v1/internal-documents/:id/assign
   * Admin: assign document to employees and/or groups.
   */
  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignDocumentDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<DocAckAssignmentSummary[]> {
    return this.docAckService.assign(id, dto, user.id);
  }

  /**
   * GET /api/v1/internal-documents/:id/status
   * Admin: get compliance matrix — who has acknowledged, who is pending/overdue.
   */
  @Get(':id/status')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  getDocumentStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DocumentStatusSummary> {
    return this.docAckService.getDocumentStatus(id);
  }

  /**
   * POST /api/v1/internal-documents/:id/acknowledge
   * Employee: acknowledge a document. Idempotent (BR-018).
   */
  @Post(':id/acknowledge')
  acknowledge(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<DocAcknowledgementRecord> {
    return this.docAckService.acknowledge(id, user.id);
  }
}

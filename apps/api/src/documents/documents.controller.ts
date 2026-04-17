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
import type { DocumentSummary, DocumentUploadUrlResponse } from '@lumicore/shared-types';
import type { CurrentUser } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { SaveDocumentDto } from './dto/save-document.dto';
import { GetDocumentsDto } from './dto/get-documents.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * POST /api/v1/documents/upload-url?filename=report.pdf
   * Returns a presigned S3 PUT URL and the s3_key to use in saveDocument.
   * Declared before :id routes to avoid route collision.
   */
  @Post('upload-url')
  @HttpCode(200)
  getUploadUrl(
    @Query('filename') filename: string,
  ): DocumentUploadUrlResponse {
    return this.documentsService.getUploadUrl(filename);
  }

  /**
   * POST /api/v1/documents
   * Save document metadata after the client has uploaded the file directly to S3.
   */
  @Post()
  saveDocument(
    @Body() dto: SaveDocumentDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<DocumentSummary> {
    return this.documentsService.saveDocument(dto, user.id);
  }

  /**
   * GET /api/v1/documents?project_id=1
   * List documents for a project, newest first.
   */
  @Get()
  findAll(@Query() dto: GetDocumentsDto): Promise<DocumentSummary[]> {
    return this.documentsService.findAll(dto.project_id);
  }

  /**
   * DELETE /api/v1/documents/:id
   * Hard delete (documents are not business entities — no soft delete).
   * 204 No Content on success.
   */
  @Delete(':id')
  @HttpCode(204)
  deleteDocument(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.documentsService.deleteDocument(id);
  }
}

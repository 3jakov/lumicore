import { Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentSummary, DocumentUploadUrlResponse } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import {
  generateS3Key,
  buildPresignedUploadUrl,
  buildSignedReadUrl,
} from '../common/s3.helper';
import { SaveDocumentDto } from './dto/save-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  getUploadUrl(filename: string): DocumentUploadUrlResponse {
    const s3Key = generateS3Key('documents', filename);
    return {
      upload_url: buildPresignedUploadUrl(s3Key),
      s3_key: s3Key,
    };
  }

  async saveDocument(
    dto: SaveDocumentDto,
    uploadedById: number,
  ): Promise<DocumentSummary> {
    const document = await this.prisma.document.create({
      data: {
        project_id: dto.project_id,
        s3_key: dto.s3_key,
        original_filename: dto.original_filename,
        mime_type: dto.mime_type,
        file_size_bytes: dto.file_size_bytes,
        uploaded_by_id: uploadedById,
      },
    });

    return this.toDocumentSummary(document);
  }

  async findAll(projectId: number): Promise<DocumentSummary[]> {
    const documents = await this.prisma.document.findMany({
      where: { project_id: projectId },
      orderBy: { uploaded_at: 'desc' },
    });

    return documents.map((d) => this.toDocumentSummary(d));
  }

  async deleteDocument(id: number): Promise<void> {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document #${id} not found`);
    }

    // TODO(E7): delete file from S3 using document.s3_key
    await this.prisma.document.delete({ where: { id } });
  }

  private toDocumentSummary(document: {
    id: number;
    project_id: number;
    s3_key: string;
    original_filename: string;
    mime_type: string;
    file_size_bytes: number;
    uploaded_by_id: number;
    uploaded_at: Date;
  }): DocumentSummary {
    return {
      id: document.id,
      project_id: document.project_id,
      s3_key: document.s3_key,
      original_filename: document.original_filename,
      mime_type: document.mime_type,
      file_size_bytes: document.file_size_bytes,
      uploaded_by_id: document.uploaded_by_id,
      uploaded_at: document.uploaded_at.toISOString(),
      download_url: buildSignedReadUrl(document.s3_key) as string,
    };
  }
}

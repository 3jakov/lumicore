import { Injectable, NotFoundException } from '@nestjs/common';
import type { PhotoSummary, PhotoUploadUrlResponse } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import {
  generateS3Key,
  buildPresignedUploadUrl,
  buildSignedReadUrl,
} from '../common/s3.helper';
import { SavePhotoDto } from './dto/save-photo.dto';
import { GetPhotosDto } from './dto/get-photos.dto';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  async getUploadUrl(filename: string): Promise<PhotoUploadUrlResponse> {
    const s3Key = generateS3Key('photos', filename);
    return {
      upload_url: await buildPresignedUploadUrl(s3Key),
      s3_key: s3Key,
    };
  }

  async savePhoto(dto: SavePhotoDto, authorId: number): Promise<PhotoSummary> {
    const photo = await this.prisma.photo.create({
      data: {
        s3_key: dto.s3_key,
        thumbnail_s3_key: null,
        project_id: dto.project_id ?? null,
        task_id: dto.task_id ?? null,
        author_id: authorId,
        gps_lat: dto.gps_lat ?? null,
        gps_lng: dto.gps_lng ?? null,
        gps_verified: false,
        taken_at: new Date(dto.taken_at),
        file_size_bytes: dto.file_size_bytes,
        original_filename: dto.original_filename,
        // TODO(E7): generate thumbnail via sharp
      },
    });

    return this.toPhotoSummary(photo);
  }

  async findAll(dto: GetPhotosDto): Promise<PhotoSummary[]> {
    const photos = await this.prisma.photo.findMany({
      where: {
        ...(dto.project_id !== undefined ? { project_id: dto.project_id } : {}),
        ...(dto.author_id !== undefined ? { author_id: dto.author_id } : {}),
        ...(dto.date_from !== undefined
          ? { uploaded_at: { gte: new Date(dto.date_from) } }
          : {}),
        ...(dto.date_to !== undefined
          ? { uploaded_at: { lte: new Date(dto.date_to) } }
          : {}),
      },
      orderBy: { uploaded_at: 'desc' },
    });

    return Promise.all(photos.map((photo) => this.toPhotoSummary(photo)));
  }

  private async toPhotoSummary(photo: {
    id: number;
    s3_key: string;
    thumbnail_s3_key: string | null;
    project_id: number | null;
    task_id: number | null;
    author_id: number;
    gps_lat: number | null;
    gps_lng: number | null;
    gps_verified: boolean;
    taken_at: Date;
    uploaded_at: Date;
    file_size_bytes: number;
    original_filename: string;
  }): Promise<PhotoSummary> {
    return {
      id: photo.id,
      s3_key: photo.s3_key,
      thumbnail_s3_key: photo.thumbnail_s3_key,
      project_id: photo.project_id,
      task_id: photo.task_id,
      author_id: photo.author_id,
      gps_lat: photo.gps_lat,
      gps_lng: photo.gps_lng,
      gps_verified: photo.gps_verified,
      taken_at: photo.taken_at.toISOString(),
      uploaded_at: photo.uploaded_at.toISOString(),
      file_size_bytes: photo.file_size_bytes,
      original_filename: photo.original_filename,
      url: (await buildSignedReadUrl(photo.s3_key)) as string,
      thumbnail_url: await buildSignedReadUrl(photo.thumbnail_s3_key),
    };
  }
}

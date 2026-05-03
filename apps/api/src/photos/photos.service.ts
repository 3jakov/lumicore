import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  PhotoSummary,
  PhotoDetail,
  PhotoCommentSummary,
  PhotoUploadUrlResponse,
  PhotoListResponse,
} from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import {
  generateS3Key,
  buildPresignedUploadUrl,
  buildSignedReadUrl,
} from '../common/s3.helper';
import { SavePhotoDto } from './dto/save-photo.dto';
import { GetPhotosDto } from './dto/get-photos.dto';
import { CreatePhotoCommentDto } from './dto/create-photo-comment.dto';

// ─── Prisma row types ─────────────────────────────────────────────────────────

type PhotoRow = {
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
  author: { full_name: string; initials: string; avatar_color: string };
  project: { name: string } | null;
  _count: { comments: number };
};

type CommentRow = {
  id: number;
  photo_id: number;
  author_id: number;
  text: string;
  created_at: Date;
  updated_at: Date;
  author: { full_name: string; initials: string; avatar_color: string };
};

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Upload URL ───────────────────────────────────────────────────────────

  async getUploadUrl(filename: string): Promise<PhotoUploadUrlResponse> {
    const s3Key = generateS3Key('photos', filename);
    return {
      upload_url: await buildPresignedUploadUrl(s3Key),
      s3_key: s3Key,
    };
  }

  // ─── Save photo after S3 upload ───────────────────────────────────────────

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
      },
      include: {
        author: { select: { full_name: true, initials: true, avatar_color: true } },
        project: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    });

    return this.toPhotoSummary(photo as PhotoRow);
  }

  // ─── List photos (paginated) ──────────────────────────────────────────────

  async findAll(dto: GetPhotosDto): Promise<PhotoListResponse> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 30;
    const skip = (page - 1) * limit;

    const where = {
      ...(dto.project_id !== undefined ? { project_id: dto.project_id } : {}),
      ...(dto.author_id !== undefined ? { author_id: dto.author_id } : {}),
      ...(dto.date_from !== undefined ? { taken_at: { gte: new Date(dto.date_from) } } : {}),
      ...(dto.date_to !== undefined ? { taken_at: { lte: new Date(dto.date_to) } } : {}),
    };

    const include = {
      author: { select: { full_name: true, initials: true, avatar_color: true } },
      project: { select: { name: true } },
      _count: { select: { comments: true } },
    };

    const [photos, total] = await this.prisma.$transaction([
      this.prisma.photo.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: { taken_at: 'desc' },
      }),
      this.prisma.photo.count({ where }),
    ]);

    const data = await Promise.all(photos.map((p) => this.toPhotoSummary(p as PhotoRow)));
    return { data, meta: { total, page, limit } };
  }

  // ─── Get single photo with comments ──────────────────────────────────────

  async findOne(id: number): Promise<PhotoDetail> {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
      include: {
        author: { select: { full_name: true, initials: true, avatar_color: true } },
        project: { select: { name: true } },
        _count: { select: { comments: true } },
        comments: {
          orderBy: { created_at: 'asc' },
          include: {
            author: { select: { full_name: true, initials: true, avatar_color: true } },
          },
        },
      },
    });

    if (!photo) throw new NotFoundException(`Photo #${id} not found`);

    const summary = await this.toPhotoSummary(photo as PhotoRow);
    const comments = (photo.comments as CommentRow[]).map(this.toCommentSummary);

    return { ...summary, comments };
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  async addComment(
    photoId: number,
    dto: CreatePhotoCommentDto,
    authorId: number,
  ): Promise<PhotoCommentSummary> {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException(`Photo #${photoId} not found`);

    const comment = await this.prisma.photoComment.create({
      data: { photo_id: photoId, author_id: authorId, text: dto.text },
      include: {
        author: { select: { full_name: true, initials: true, avatar_color: true } },
      },
    });

    return this.toCommentSummary(comment as CommentRow);
  }

  async getComments(photoId: number): Promise<PhotoCommentSummary[]> {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException(`Photo #${photoId} not found`);

    const comments = await this.prisma.photoComment.findMany({
      where: { photo_id: photoId },
      orderBy: { created_at: 'asc' },
      include: {
        author: { select: { full_name: true, initials: true, avatar_color: true } },
      },
    });

    return (comments as CommentRow[]).map(this.toCommentSummary);
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private async toPhotoSummary(photo: PhotoRow): Promise<PhotoSummary> {
    return {
      id: photo.id,
      s3_key: photo.s3_key,
      thumbnail_s3_key: photo.thumbnail_s3_key,
      project_id: photo.project_id,
      project_name: photo.project?.name ?? null,
      task_id: photo.task_id,
      author_id: photo.author_id,
      author_name: photo.author.full_name,
      author_initials: photo.author.initials,
      author_avatar_color: photo.author.avatar_color,
      gps_lat: photo.gps_lat,
      gps_lng: photo.gps_lng,
      gps_verified: photo.gps_verified,
      taken_at: photo.taken_at.toISOString(),
      uploaded_at: photo.uploaded_at.toISOString(),
      file_size_bytes: photo.file_size_bytes,
      original_filename: photo.original_filename,
      url: (await buildSignedReadUrl(photo.s3_key)) as string,
      thumbnail_url: await buildSignedReadUrl(photo.thumbnail_s3_key),
      comment_count: photo._count.comments,
    };
  }

  private toCommentSummary(comment: CommentRow): PhotoCommentSummary {
    return {
      id: comment.id,
      photo_id: comment.photo_id,
      author_id: comment.author_id,
      author_name: comment.author.full_name,
      author_initials: comment.author.initials,
      author_avatar_color: comment.author.avatar_color,
      text: comment.text,
      created_at: comment.created_at.toISOString(),
      updated_at: comment.updated_at.toISOString(),
    };
  }
}

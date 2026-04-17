import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PhotoSummary, PhotoUploadUrlResponse } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '@lumicore/shared-types';
import { PhotosService } from './photos.service';
import { SavePhotoDto } from './dto/save-photo.dto';
import { GetPhotosDto } from './dto/get-photos.dto';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  /**
   * POST /api/v1/photos/upload-url?filename=photo.jpg
   * Returns a presigned S3 PUT URL and the s3_key to use in savePhoto.
   * Declared before :id routes to avoid route collision.
   */
  @Post('upload-url')
  @HttpCode(200)
  getUploadUrl(
    @Query('filename') filename: string,
  ): PhotoUploadUrlResponse {
    return this.photosService.getUploadUrl(filename);
  }

  /**
   * POST /api/v1/photos
   * Save photo metadata after the client has uploaded the file directly to S3.
   */
  @Post()
  savePhoto(
    @Body() dto: SavePhotoDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<PhotoSummary> {
    return this.photosService.savePhoto(dto, user.id);
  }

  /**
   * GET /api/v1/photos
   * List photos with optional filters: project_id, author_id, date_from, date_to.
   */
  @Get()
  findAll(@Query() dto: GetPhotosDto): Promise<PhotoSummary[]> {
    return this.photosService.findAll(dto);
  }
}

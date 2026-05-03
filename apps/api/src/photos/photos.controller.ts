// Photos module — gallery, upload, comments
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  PhotoSummary,
  PhotoDetail,
  PhotoCommentSummary,
  PhotoUploadUrlResponse,
  PhotoListResponse,
} from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '@lumicore/shared-types';
import { PhotosService } from './photos.service';
import { SavePhotoDto } from './dto/save-photo.dto';
import { GetPhotosDto } from './dto/get-photos.dto';
import { CreatePhotoCommentDto } from './dto/create-photo-comment.dto';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  /** POST /api/v1/photos/upload-url?filename=photo.jpg */
  @Post('upload-url')
  @HttpCode(200)
  getUploadUrl(
    @Query('filename') filename: string,
  ): Promise<PhotoUploadUrlResponse> {
    return this.photosService.getUploadUrl(filename);
  }

  /** POST /api/v1/photos — save metadata after S3 upload */
  @Post()
  savePhoto(
    @Body() dto: SavePhotoDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<PhotoSummary> {
    return this.photosService.savePhoto(dto, user.id);
  }

  /** GET /api/v1/photos — paginated list with filters */
  @Get()
  findAll(@Query() dto: GetPhotosDto): Promise<PhotoListResponse> {
    return this.photosService.findAll(dto);
  }

  /** GET /api/v1/photos/:id — single photo with comments */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PhotoDetail> {
    return this.photosService.findOne(id);
  }

  /** GET /api/v1/photos/:id/comments */
  @Get(':id/comments')
  getComments(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PhotoCommentSummary[]> {
    return this.photosService.getComments(id);
  }

  /** POST /api/v1/photos/:id/comments */
  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePhotoCommentDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<PhotoCommentSummary> {
    return this.photosService.addComment(id, dto, user.id);
  }
}

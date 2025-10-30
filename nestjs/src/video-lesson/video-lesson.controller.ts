// src/video-lesson/video-lesson.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { VideoLessonService } from './video-lesson.service';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';

@Controller('video-lesson')
export class VideoLessonController {
  constructor(private readonly videoLessonService: VideoLessonService) {}

  // Tạo video lesson
  // POST /video-lesson/create
  @Post('create')
  @HttpCode(200)
  async createVideoLesson(@Body() body: CreateVideoLessonDto) {
    try {
      const videoLesson = await this.videoLessonService.createVideoLessonSv(body);
      return {
        status: 200,
        message: 'Tạo video lesson thành công',
        data: videoLesson,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: 'Error creating video lesson: ' + (err?.message || 'Unknown error'),
      };
    }
  }

  // Cập nhật video lesson
  // PUT /video-lesson/update/:id
  @Put('update/:id')
  @HttpCode(200)
  async updateVideoLesson(
    @Param('id') id: string,
    @Body() body: UpdateVideoLessonDto,
  ) {
    try {
      const videoLesson = await this.videoLessonService.updateVideoLessonSv(id, body);
      return {
        status: 200,
        message: 'Cập nhật video lesson thành công',
        data: videoLesson,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Cập nhật video lesson thất bại',
      };
    }
  }

  // Xóa video lesson
  // DELETE /video-lesson/delete/:id
  @Delete('delete/:id')
  @HttpCode(200)
  async deleteVideoLesson(@Param('id') id: string) {
    try {
      const result = await this.videoLessonService.deleteVideoLessonSv(id);
      return {
        status: 200,
        message: result.message,
        data: result.video,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Xóa video lesson thất bại',
      };
    }
  }

  // Lấy danh sách video lessons (phân trang + filter theo topicId)
  // GET /video-lesson/list?page=1&limit=10&topicId=...&search=...
  @Get('list')
  @HttpCode(200)
  async getVideoLessons(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('topicId') topicId?: string,
    @Query('search') search?: string,
  ) {
    try {
      // Nếu không truyền page/limit → để undefined (service tự hiểu là "lấy all")
      const pageNum = page ? parseInt(page, 10) : undefined;
      const limitNum = limit ? parseInt(limit, 10) : undefined;

      const data = await this.videoLessonService.getVideoLessonsSv(
        pageNum,
        limitNum,
        topicId,
        search,
      );

      return {
        status: 200,
        message: 'Lấy danh sách video lessons thành công',
        data,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy danh sách video lesson',
      };
    }
  }

  // Lấy chi tiết video lesson
  // GET /video-lesson/detail/:id
  @Get('detail/:id')
  @HttpCode(200)
  async getVideoLessonById(@Param('id') id: string) {
    try {
      const videoLesson = await this.videoLessonService.getVideoLessonByIdSv(id);
      return {
        status: 200,
        message: 'Lấy chi tiết video lesson thành công',
        data: videoLesson,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy chi tiết video lesson',
      };
    }
  }
}

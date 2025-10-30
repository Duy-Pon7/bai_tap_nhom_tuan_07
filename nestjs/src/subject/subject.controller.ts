import {
  Controller,
  Post,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Body,
  Put,
  Param,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectService } from './subject.service';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { memoryStorage } from 'multer';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  // POST /subject/create-subject
  @Post('create-subject')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image'))
  async createSubject(
    @Body() body: CreateSubjectDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const subject = await this.subjectService.createSubjectSv(body, file);
      return {
        status: 200,
        message: 'Tạo môn học thành công',
        data: subject,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: 'Error creating subject: ' + err.message,
      };
    }
  }

  // PUT /subject/update-subject/:_id
  @Put('update-subject/:_id')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async updateSubject(
    @Param('_id') _id: string,
    @Body() body: UpdateSubjectDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const subject = await this.subjectService.updateSubjectSv(_id, body, file);
      return {
        status: 200,
        message: 'Cập nhật môn học thành công',
        data: subject,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Cập nhật môn học thất bại',
      };
    }
  }

  // GET /subject/get-subjects
  @Get('get-subjects')
  @HttpCode(200)
  async getSubjects(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : undefined;
      const limitNum = limit ? parseInt(limit, 10) : undefined;

      const result = await this.subjectService.getSubjectsSv(
        pageNum,
        limitNum,
        search,
      );

      return {
        status: 200,
        message: 'Lấy danh sách môn học thành công',
        data: result,
      };
    } catch (err: any) {
      return { status: 400, message: err?.message || 'Lỗi lấy danh sách' };
    }
  }

  // DELETE /subject/delete-subject/:_id
  @Delete('delete-subject/:_id')
  @HttpCode(200)
  async deleteSubject(@Param('_id') _id: string) {
    try {
      const result = await this.subjectService.deleteSubjectSv(_id);
      return {
        status: 200,
        message: 'Xóa môn học thành công',
        data: result,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Xóa môn học thất bại',
      };
    }
  }

  // GET /subject/get-subject/:_id
  @Get('get-subjectById/:_id')
  @HttpCode(200)
  async getSubjectById(@Param('_id') _id: string) {
    try {
      const subject = await this.subjectService.getSubjectByIdSv(_id);
      return {
        status: 200,
        message: 'Lấy chi tiết môn học thành công',
        data: subject,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy chi tiết môn học',
      };
    }
  }
}

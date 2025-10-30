// src/question/question.controller.ts
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
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // Thêm câu hỏi
  // POST /question/create-question
  @Post('create-question')
  @HttpCode(200)
  async createQuestion(@Body() body: CreateQuestionDto) {
    try {
      const question = await this.questionService.createQuestionSv(body);
      return {
        status: 200,
        message: 'Thêm thành công',
        data: question,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Tạo câu hỏi thất bại',
      };
    }
  }

  // Sửa câu hỏi
  // PUT /question/update-question/:_id
  @Put('update-question/:_id')
  @HttpCode(200)
  async updateQuestion(
    @Param('_id') _id: string,
    @Body() body: UpdateQuestionDto,
  ) {
    try {
      const question = await this.questionService.updateQuestionSv(_id, body);
      return {
        status: 200,
        message: 'Cập nhật thành công',
        data: question,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Cập nhật câu hỏi thất bại',
      };
    }
  }

  // Xóa câu hỏi
  // DELETE /question/delete-question/:_id
  @Delete('delete-question/:_id')
  @HttpCode(200)
  async deleteQuestion(@Param('_id') _id: string) {
    try {
      const result = await this.questionService.deleteQuestionSv(_id);
      return {
        status: 200,
        message: 'Xóa thành công',
        data: result,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Xóa câu hỏi thất bại',
      };
    }
  }

  // Lấy danh sách câu hỏi (phân trang, lọc theo quiz nếu có)
  // GET /question/get-questions?page=1&limit=10&quizId=...
  @Get('get-questions')
  @HttpCode(200)
  async getQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('quizId') quizId?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      const result = await this.questionService.getQuestionsSv(
        pageNum,
        limitNum,
        quizId,
      );

      return {
        status: 200,
        message: 'Lấy danh sách thành công',
        data: result,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy danh sách câu hỏi',
      };
    }
  }

  // Lấy chi tiết câu hỏi
  // GET /question/get-question/:_id
  @Get('get-questionById/:_id')
  @HttpCode(200)
  async getQuestionById(@Param('_id') _id: string) {
    try {
      const question = await this.questionService.getQuestionByIdSv(_id);
      return {
        status: 200,
        message: 'Lấy chi tiết thành công',
        data: question,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy chi tiết câu hỏi',
      };
    }
  }
}

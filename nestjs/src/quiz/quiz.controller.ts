import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('create-quiz')
  @HttpCode(200)
  async createQuiz(@Body() body: CreateQuizDto) {
    try {
      const quiz = await this.quizService.createQuizSv(body);
      return { status: 200, message: 'Tạo quiz thành công', data: quiz };
    } catch (err: any) {
      return { status: 400, message: err?.message || 'Tạo quiz thất bại' };
    }
  }

  @Put('update-quiz/:_id')
  @HttpCode(200)
  async updateQuiz(@Param('_id') _id: string, @Body() body: UpdateQuizDto) {
    try {
      const quiz = await this.quizService.updateQuizSv(_id, body);
      return { status: 200, message: 'Cập nhật quiz thành công', data: quiz };
    } catch (err: any) {
      return { status: 400, message: err?.message || 'Cập nhật quiz thất bại' };
    }
  }

  @Delete('delete-quiz/:_id')
  @HttpCode(200)
  async deleteQuiz(@Param('_id') _id: string) {
    try {
      const result = await this.quizService.deleteQuizSv(_id);
      return { status: 200, message: result.message, data: result.quiz };
    } catch (err: any) {
      return { status: 400, message: err?.message || 'Xoá quiz thất bại' };
    }
  }

  @Get('get-quizById/:_id')
  @HttpCode(200)
  async getQuizById(@Param('_id') _id: string) {
    try {
      const quiz = await this.quizService.getQuizByIdSv(_id);
      return { status: 200, message: 'Lấy chi tiết quiz thành công', data: quiz };
    } catch (err: any) {
      return { status: 400, message: err?.message || 'Lỗi lấy chi tiết quiz' };
    }
  }

  // GET /quiz/get-quizzes?page=1&limit=10&topicId=xxx&search=react
  @Get('get-quizzes')
  @HttpCode(200)
  async getQuizzes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('topicId') topicId?: string,
    @Query('search') search?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : undefined;
      const limitNum = limit ? parseInt(limit, 10) : undefined;

      const data = await this.quizService.getQuizzesSv(
        pageNum,
        limitNum,
        topicId,
        search,
      );

      return {
        status: 200,
        message: 'Lấy danh sách quiz thành công',
        data,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy danh sách quiz',
      };
    }
  }
}

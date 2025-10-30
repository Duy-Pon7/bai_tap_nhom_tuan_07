import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Get,
  Query,
  HttpCode,
} from '@nestjs/common';
import { TopicService } from './topic.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Controller('topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post('create-topic')
  @HttpCode(200)
  async createTopic(@Body() body: CreateTopicDto) {
    try {
      const topic = await this.topicService.createTopicSv(body);
      return { status: 200, message: 'Tạo chủ đề thành công', data: topic };
    } catch (err: any) {
      return { status: 400, message: err.message };
    }
  }

  @Put('update-topic/:_id')
  @HttpCode(200)
  async updateTopic(
    @Param('_id') _id: string,
    @Body() body: UpdateTopicDto,
  ) {
    try {
      const topic = await this.topicService.updateTopicSv(_id, body);
      return { status: 200, message: 'Cập nhật chủ đề thành công', data: topic };
    } catch (err: any) {
      return { status: 400, message: err.message };
    }
  }

  @Delete('delete-topic/:_id')
  @HttpCode(200)
  async deleteTopic(@Param('_id') _id: string) {
    try {
      const result = await this.topicService.deleteTopicSv(_id);
      return { status: 200, message: result.message, data: result.topic };
    } catch (err: any) {
      return { status: 400, message: err.message };
    }
  }

  // GET /topic/get-topics?page=1&limit=10&subjectId=abc123&search=nodejs
  @Get('get-topics')
  @HttpCode(200)
  async getTopics(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('subjectId') subjectId?: string,
    @Query('search') search?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : undefined;
      const limitNum = limit ? parseInt(limit, 10) : undefined;

      const data = await this.topicService.getTopicsSv(
        pageNum,
        limitNum,
        subjectId,
        search,
      );

      return {
        status: 200,
        message: 'Lấy danh sách topic thành công',
        data,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy danh sách topic',
      };
    }
  }

  // GET /topic/get-topic/:_id
  @Get('get-topicById/:_id')
  @HttpCode(200)
  async getTopicById(@Param('_id') _id: string) {
    try {
      const topic = await this.topicService.getTopicByIdSv(_id);
      return {
        status: 200,
        message: 'Lấy chi tiết chủ đề thành công',
        data: topic,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy chi tiết chủ đề',
      };
    }
  }
}

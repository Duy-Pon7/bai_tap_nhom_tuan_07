import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ResultService } from './result.service';

@Controller('submisstion')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  // GET /result/get-results?page=1&limit=10
  @Get('get-all')
  @HttpCode(200)
  async getResults(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      const data = await this.resultService.getResultsSv(pageNum, limitNum);

      return {
        status: 200,
        message: 'Lấy danh sách thành công',
        data,
      };
    } catch (err: any) {
      return {
        status: 400,
        message: err?.message || 'Lỗi lấy danh sách kết quả',
      };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ResultDocument } from './entities/result.entity';

@Injectable()
export class ResultService {
  constructor(
    @InjectModel(Result.name)
    private readonly resultModel: Model<ResultDocument>,
  ) {}

  // Lấy danh sách kết quả (Result) với phân trang
  async getResultsSv(
    page: number,
    limit: number,
  ): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    data: any[];
  }> {
    const pageNum = page || 1;
    const limitNum = limit || 10;
    const skip = (pageNum - 1) * limitNum;

    const [results, total] = await Promise.all([
      this.resultModel
        .find()
        .populate('quiz', '-__v')
        .sort({ lastSubmissionAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v')
        .lean(),
      this.resultModel.countDocuments(),
    ]);

    return {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: results,
    };
  }
}

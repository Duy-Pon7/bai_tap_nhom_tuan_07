import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  // Thêm câu hỏi
  async createQuestionSv(data: CreateQuestionDto) {
    const quizObjectId = new Types.ObjectId(data.quiz);

    const question = await this.questionModel.create({
      text: data.text,
      quiz: quizObjectId,        // ✅ truyền ObjectId ở đây, không sửa DTO
      answers: data.answers,
      explanation: data.explanation,
    });

    await question.populate('quiz');
    return question.toObject({ versionKey: false });
  }


  // Sửa câu hỏi
  async updateQuestionSv(_id: string, updateData: UpdateQuestionDto) {
    if (!_id) throw new Error('ID câu hỏi không hợp lệ');

    const toUpdate: any = {
      text: updateData.text,
      answers: updateData.answers,
      explanation: updateData.explanation,
    };

    if (updateData.quiz) {
      toUpdate.quiz = new Types.ObjectId(updateData.quiz); // ✅ convert riêng
    }

    const question = await this.questionModel
      .findByIdAndUpdate(_id, { $set: toUpdate }, { new: true, runValidators: true })
      .populate('quiz', '-__v');

    if (!question) throw new Error('Câu hỏi không tồn tại');
    return question.toObject({ versionKey: false });
  }


  // Xóa câu hỏi
  async deleteQuestionSv(_id: string) {
    if (!_id) throw new Error('ID câu hỏi không hợp lệ');

    const question = await this.questionModel.findByIdAndDelete(_id);
    if (!question) throw new Error('Câu hỏi không tồn tại');

    return {
      message: 'Xóa câu hỏi thành công',
      question: question.toObject({ versionKey: false }),
    };
  }

  // Lấy danh sách câu hỏi (phân trang + filter theo quizId)
  async getQuestionsSv(
    page: number,
    limit: number,
    quizId?: string,
  ): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    data: any[];
  }> {
    const filter: any = {};
    if (quizId) filter.quiz = new Types.ObjectId(quizId);

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      this.questionModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ _id: -1 })
        .populate('quiz', '-__v')
        .select('-__v')
        .lean(),
      this.questionModel.countDocuments(filter),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: questions,
    };
  }

  // Lấy chi tiết câu hỏi theo ID
  async getQuestionByIdSv(_id: string) {
    if (!_id) throw new Error('ID câu hỏi không hợp lệ');

    const question = await this.questionModel
      .findById(_id)
      .populate('quiz', '-__v')
      .select('-__v')
      .lean();

    if (!question) throw new Error('Câu hỏi không tồn tại');
    return question;
  }
}

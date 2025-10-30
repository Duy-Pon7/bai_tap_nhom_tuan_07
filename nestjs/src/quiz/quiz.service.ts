import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument } from './entities/quiz.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { ElasticsearchService } from 'src/common/config/elasticsearch.config';
import { Topic } from 'src/topic/entities/topic.entity';
import { Subject } from 'src/subject/entities/subject.entity';

const QUIZ_INDEX = 'quiz';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
    private readonly es: ElasticsearchService,
  ) {}

  // Tạo quiz
  async createQuizSv(data: CreateQuizDto) {
    // Ép topic → ObjectId để lưu đúng kiểu trong Mongo
    const topicId =
      typeof data.topic === 'string'
        ? (Types.ObjectId.isValid(data.topic)
            ? new Types.ObjectId(data.topic)
            : (() => {
                throw new Error('topic không phải ObjectId hợp lệ');
              })())
        : data.topic;

    // Tạo quiz và lưu vào MongoDB
    const quiz = new this.quizModel({
      ...data,
      topic: topicId,
    });
    await quiz.save();

    // Populate topic → subject để trả dữ liệu đầy đủ
    await quiz.populate({
      path: 'topic',
      populate: {
        path: 'subject',
      },
    });

    // Sync lên Elasticsearch
    const quizId =
      quiz._id instanceof Types.ObjectId
        ? quiz._id.toHexString()
        : String(quiz._id);

    await this.syncOneQuizToES(quizId);

    // Gửi thông báo (tùy bạn có implement hay không)
    const topic = quiz.topic as Topic;
    const subject = (topic as any)?.subject as Subject;

    return quiz.toObject({ versionKey: false });
  }

  // Cập nhật quiz
  async updateQuizSv(id: string, updateData: UpdateQuizDto) {
    if (!id) throw new Error('ID quiz không hợp lệ');

    const toUpdate: any = { ...updateData };

    // Chuẩn hoá lastAttemptAt nếu client gửi ISO string
    if (toUpdate.lastAttemptAt) {
      toUpdate.lastAttemptAt = new Date(toUpdate.lastAttemptAt);
    }

    // Ép topic -> ObjectId nếu có gửi lên
    if (toUpdate.topic) {
      toUpdate.topic =
        typeof toUpdate.topic === 'string'
          ? (Types.ObjectId.isValid(toUpdate.topic)
              ? new Types.ObjectId(toUpdate.topic)
              : (() => {
                  throw new Error('topic không phải ObjectId hợp lệ');
                })())
          : toUpdate.topic;
    }

    const quiz = await this.quizModel
      .findByIdAndUpdate(id, { $set: toUpdate }, { new: true, runValidators: true })
      .populate({
        path: 'topic',
        populate: { path: 'subject' },
      });

    if (!quiz) throw new Error('Quiz không tồn tại');

    const quizId =
      quiz._id instanceof Types.ObjectId ? quiz._id.toHexString() : String(quiz._id);

    await this.syncOneQuizToES(quizId);

    return quiz.toObject({ versionKey: false });
  }


  // Xoá quiz
  async deleteQuizSv(id: string) {
    if (!id) throw new Error('ID quiz không hợp lệ');

    const deleted = await this.quizModel.findByIdAndDelete(id).populate('topic');
    if (!deleted) throw new Error('Quiz không tồn tại');

    await this.deleteOneQuizFromES(id);

    return {
      message: 'Xoá quiz thành công',
      quiz: deleted.toObject({ versionKey: false }),
    };
  }

  // Lấy chi tiết quiz
  async getQuizByIdSv(id: string) {
    if (!id) throw new Error('ID quiz không hợp lệ');

    const doc = await this.quizModel.findById(id).select('-__v');
    if (!doc) throw new Error('Quiz không tồn tại');

    await doc.populate('topic');
    return doc.toObject({ versionKey: false });
  }

  // Lấy danh sách quiz với phân trang + lọc + tìm kiếm
  async getQuizzesSv(
    page?: number,
    limit?: number,
    topicId?: string,
    search?: string,
  ): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    quizzes: Array<{ _id: string } & Record<string, any>>;
  }> {
    const filters: any[] = [];
    const must: any[] = [];

    // ✅ Lọc theo topicId (dạng keyword) → dùng term
    if (topicId && topicId.trim()) {
      filters.push({ term: { 'topic._id': topicId.trim() } });
    }

    // ✅ Tìm kiếm theo tiêu đề (text) → dùng match
    if (search && search.trim()) {
      must.push({
        match: {
          title: {
            query: search.trim(),
            operator: 'AND',
            fuzziness: 'AUTO',
            minimum_should_match: '75%',
          },
        },
      });
    }

    // ✅ Ghép query tổng
    const query =
      must.length
        ? { bool: { must, filter: filters } }
        : filters.length
        ? { bool: { filter: filters } }
        : { match_all: {} };

    // ✅ Nếu không truyền page/limit → lấy tất cả (tối đa 10k)
    if (!page || !limit) {
      const result = await this.es.client.search({
        index: QUIZ_INDEX,
        size: 10000,
        track_total_hits: true,
        query,
      });

      const total =
        typeof result.hits.total === 'number'
          ? result.hits.total
          : result.hits.total?.value || 0;

      const quizzes = (result.hits.hits as any[]).map((hit) => ({
        _id: hit._id,
        ...(hit._source || {}),
      }));

      return {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
        quizzes,
      };
    }

    // ✅ Có page/limit → phân trang
    const from = (page - 1) * limit;

    const result = await this.es.client.search({
      index: QUIZ_INDEX,
      from,
      size: limit,
      track_total_hits: true,
      query,
    });

    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

    const quizzes = (result.hits.hits as any[]).map((hit) => ({
      _id: hit._id,
      ...(hit._source || {}),
    }));

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      quizzes,
    };
  }

  // ----- Elasticsearch helpers -----
  private async syncOneQuizToES(quizId: string) {
    try {
      const quiz = await this.quizModel
        .findById(quizId)
        .populate({
          path: 'topic',
          populate: { path: 'subject' },
        })
        .lean<{
          _id: any;
          title: string;
          description?: string;
          duration: number;
          questionCount: number;
          uniqueUserCount?: number;
          favoriteCount?: number;
          lastAttemptAt?: Date | null;
          topic?: any;
        }>();

      if (!quiz) throw new Error('Quiz không tồn tại');

      const topic = quiz.topic as any;
      const subject = topic?.subject as any;

      const esDocument = {
        title: quiz.title,
        description: quiz.description || '',
        duration: quiz.duration,
        questionCount: quiz.questionCount ?? 0,
        uniqueUserCount: quiz.uniqueUserCount ?? 0,
        favoriteCount: quiz.favoriteCount ?? 0,
        lastAttemptAt: quiz.lastAttemptAt || null,
        topic: topic
          ? {
              _id: String(topic._id),
              name: topic.name || '',
              description: topic.description || '',
              // ✅ subject theo đúng entity Subject hiện có
              subject: subject
                ? {
                    _id: String(subject._id),
                    name: subject.name || '',
                    description: subject.description || '',
                    maxTopics: subject.maxTopics ?? 20,
                    image:
                      subject.image ||
                      'https://res.cloudinary.com/dglm2f7sr/image/upload/v1761400287/default_gdfbhs.png',
                  }
                : null,
            }
          : null,
      };

      await this.es.client.index({
        index: 'quiz', // hoặc QUIZ_INDEX nếu bạn đã định nghĩa hằng
        id: String(quizId),
        document: esDocument,
        refresh: 'wait_for',
      });

      console.log(`Quiz ${quizId} synced to Elasticsearch`);
    } catch (error) {
      console.error('Lỗi đồng bộ Quiz lên Elasticsearch:', error);
      throw error;
    }
  }



  private async deleteOneQuizFromES(quizId: string) {
    try {
      await this.es.client.delete({
        index: QUIZ_INDEX,
        id: quizId,
        refresh: 'wait_for',
      });
    } catch (error: any) {
      if (error?.meta?.statusCode === 404) {
        throw new Error('Quiz không tồn tại trong ES');
      }
      throw error;
    }
  }
}

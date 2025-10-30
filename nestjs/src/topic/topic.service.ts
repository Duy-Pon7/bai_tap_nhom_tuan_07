import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Topic, TopicDocument } from './entities/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ElasticsearchService } from 'src/common/config/elasticsearch.config';
import { Subject } from 'src/subject/entities/subject.entity';

const TOPIC_INDEX = 'topic';

@Injectable()
export class TopicService {
  constructor(
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    private readonly es: ElasticsearchService,
  ) {}

  async createTopicSv(data: CreateTopicDto) {
    // Ép subject -> ObjectId an toàn
    const subjectId =
      typeof data.subject === 'string'
        ? (Types.ObjectId.isValid(data.subject)
            ? new Types.ObjectId(data.subject)
            : (() => { throw new Error('subject không phải ObjectId hợp lệ'); })())
        : data.subject; // đã là ObjectId

    const topic = await this.topicModel.create({
      ...data,
      subject: subjectId, // 👉 đảm bảo lưu đúng ObjectId
    });

    await topic.populate('subject');

    const topicId =
      topic._id instanceof Types.ObjectId
        ? topic._id.toHexString()
        : String(topic._id);

    await this.syncOneTopicToES(topicId);

    const subject = topic.subject as any;
    console.log(`Notify: Topic "${topic.name}" mới được tạo trong Subject "${subject?.name}"`);

    return topic.toObject({ versionKey: false });
  }
  // Cập nhật chủ đề
  async updateTopicSv(id: string, data: UpdateTopicDto) {
    if (!id) throw new Error('ID topic không hợp lệ');

    const toUpdate: any = { ...data };

    if (data.subject) {
      toUpdate.subject =
        typeof data.subject === 'string'
          ? (Types.ObjectId.isValid(data.subject)
              ? new Types.ObjectId(data.subject)
              : (() => { throw new Error('subject không phải ObjectId hợp lệ'); })())
          : data.subject;
    }

    const updated = await this.topicModel
      .findByIdAndUpdate(id, { $set: toUpdate }, { new: true, runValidators: true })
      .populate('subject');

    if (!updated) throw new Error('Topic không tồn tại');

    await this.syncOneTopicToES(id);
    return updated.toObject({ versionKey: false });
  }

  // Xóa chủ đề
  async deleteTopicSv(id: string) {
    const deleted = await this.topicModel.findByIdAndDelete(id).populate('subject');
    if (!deleted) throw new Error('Topic không tồn tại');

    await this.deleteOneTopicFromES(id);

    return {
      message: 'Xóa chủ đề thành công',
      topic: deleted.toObject({ versionKey: false }),
    };
  }

  // Lấy danh sách Topic có phân trang + lọc + tìm kiếm
  async getTopicsSv(
    page?: number,
    limit?: number,
    subjectId?: string,
    search?: string,
  ): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    topics: Array<{ _id: string } & Record<string, any>>;
  }> {
    const must: any[] = [];
    const filters: any[] = [];

    // ✅ Lọc theo subject nếu có
    if (subjectId && subjectId.trim()) {
      filters.push({ term: { 'subject._id': subjectId.trim() } });
    }

    // ✅ Tìm kiếm theo tên (text)
    if (search && search.trim()) {
      must.push({
        match: {
          name: {
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
      must.length || filters.length
        ? { bool: { must: must.length ? must : [{ match_all: {} }], filter: filters } }
        : { match_all: {} };

    // ✅ Nếu không có page/limit → lấy tất cả (tối đa 10k)
    if (!page || !limit) {
      const result = await this.es.client.search({
        index: TOPIC_INDEX,
        size: 10000,
        track_total_hits: true,
        query,
      });

      const total =
        typeof result.hits.total === 'number'
          ? result.hits.total
          : result.hits.total?.value || 0;

      const topics = (result.hits.hits as any[]).map((hit) => ({
        _id: hit._id,
        ...(hit._source || {}),
      }));

      return {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
        topics,
      };
    }

    // ✅ Có page/limit → phân trang
    const from = (page - 1) * limit;

    const result = await this.es.client.search({
      index: TOPIC_INDEX,
      from,
      size: limit,
      track_total_hits: true,
      query,
    });

    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

    const topics = (result.hits.hits as any[]).map((hit) => ({
      _id: hit._id,
      ...(hit._source || {}),
    }));

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      topics,
    };
  }

  // Lấy chi tiết chủ đề
  async getTopicByIdSv(id: string) {
    if (!id) throw new Error('ID topic không hợp lệ');

    const doc = await this.topicModel.findById(id).select('-__v');
    if (!doc) throw new Error('Topic không tồn tại');

    await doc.populate('subject');
    return doc.toObject({ versionKey: false });
  }

  // Đồng bộ 1 topic lên Elasticsearch
  private async syncOneTopicToES(topicId: string) {
    const topic = await this.topicModel
      .findById(topicId)
      .populate('subject')
      .lean<{ name: string; description?: string; subject?: any }>();

    if (!topic) throw new Error('Topic không tồn tại');

    const subject = topic.subject as any;

    const esDocument = {
      name: topic.name,
      description: topic.description || '',
      subject: subject
        ? {
            _id: String(subject._id),
            name: subject.name || '',
            description: subject.description || '',
            image: subject.image || '',
          }
        : null,
    };

    await this.es.client.index({
      index: TOPIC_INDEX,
      id: topicId,
      document: esDocument,
      refresh: 'wait_for',
    });

    console.log(`Topic ${topicId} synced to Elasticsearch`);
  }

  // Xóa 1 topic khỏi Elasticsearch
  private async deleteOneTopicFromES(topicId: string) {
    try {
      await this.es.client.delete({
        index: TOPIC_INDEX,
        id: topicId,
        refresh: 'wait_for',
      });
    } catch (error: any) {
      if (error?.meta?.statusCode === 404) {
        throw new Error('Topic không tồn tại trong Elasticsearch');
      }
      throw error;
    }
  }
}

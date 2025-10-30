import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import cloudinary from '../common/config/cloudinary.config';              
import { ElasticsearchService } from '../common/config/elasticsearch.config'; 
import { Subject, SubjectDocument } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

const SUBJECT_INDEX = 'subject';

@Injectable()
export class SubjectService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    private readonly es: ElasticsearchService, 
  ) {}

  // Tạo môn học
  async createSubjectSv(data: CreateSubjectDto, file?: Express.Multer.File) {
    // Upload Cloudinary nếu có file
    if (file) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'Subject' },
          (error, result) => (error ? reject(error) : resolve(result)),
        );
        stream.end(file.buffer);
      });
      data.image = uploadResult.secure_url;
    }

    // Lưu MongoDB
    const subject = await this.subjectModel.create(data);

    // Sync lên Elasticsearch
    const subjectId =
      subject._id instanceof Types.ObjectId
        ? subject._id.toHexString()
        : String(subject._id);

    await this.syncOneSubjectToES(subjectId);

    return subject.toObject({ versionKey: false });
  }

  // Cập nhật môn học
  async updateSubjectSv(
    id: string,
    data: UpdateSubjectDto,
    file?: Express.Multer.File,
  ) {
    if (!id) throw new Error('ID subject không hợp lệ');

    // Nếu có file ảnh -> upload Cloudinary trước, set lại data.image
    if (file) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'Subject' },
          (error, result) => (error ? reject(error) : resolve(result)),
        );
        stream.end(file.buffer);
      });
      data.image = uploadResult.secure_url;
    }

    const updated = await this.subjectModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!updated) throw new Error('Subject không tồn tại');

    // Sync ES (chỉ up 4 trường như bản Express của bạn)
    await this.syncOneSubjectToES(id);

    // Trả về không có __v
    return updated.toObject({ versionKey: false });
  }

  // Xóa môn học
  async deleteSubjectSv(id: string) {
    if (!id) throw new Error('ID subject không hợp lệ');

    const deleted = await this.subjectModel.findByIdAndDelete(id);
    if (!deleted) throw new Error('Subject không tồn tại');

    // Xóa khỏi Elasticsearch
    await this.deleteOneSubjectFromES(id);

    return {
      message: 'Xóa subject thành công',
      subject: deleted.toObject({ versionKey: false }),
    };
  }

  // Lấy danh sách môn học với phân trang + tìm kiếm theo tên/mô tả/code
  async getSubjectsSv(
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    subjects: Array<{ _id: string } & Record<string, any>>;
  }> {
    const must: any[] = [];

    if (search && search.trim()) {
      must.push({
        multi_match: {
          query: search.trim(),
          fields: ['name^2', 'description', 'code'], // ưu tiên name
          operator: 'AND',
          fuzziness: 'AUTO',
          minimum_should_match: '75%',
        },
      });
    }

    const query = must.length ? { bool: { must } } : { match_all: {} };

    // Không truyền page/limit -> lấy tối đa 10k (giống Express)
    if (!page || !limit) {
      const result = await this.es.client.search({
        index: SUBJECT_INDEX,
        size: 10000,
        track_total_hits: true,
        query,
      });

      const total =
        typeof result.hits.total === 'number'
          ? result.hits.total
          : result.hits.total?.value || 0;

      const subjects = (result.hits.hits as any[]).map((hit) => ({
        _id: hit._id,
        ...(hit._source || {}),
      }));

      return {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
        subjects,
      };
    }

    // Có page/limit -> phân trang
    const from = (page - 1) * limit;

    const result = await this.es.client.search({
      index: SUBJECT_INDEX,
      from,
      size: limit,
      track_total_hits: true,
      query,
    });

    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

    const subjects = (result.hits.hits as any[]).map((hit) => ({
      _id: hit._id,
      ...(hit._source || {}),
    }));

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      subjects,
    };
  }

  // Lấy chi tiết môn học
  async getSubjectByIdSv(id: string) {
    if (!id) throw new Error('ID môn học không hợp lệ');

    const doc = await this.subjectModel.findById(id).select('-__v');
    if (!doc) throw new Error('Môn học không tồn tại');

    return doc.toObject({ versionKey: false });
  }

  // Xóa 1 subject khỏi ES (giống Express)
  private async deleteOneSubjectFromES(subjectId: string) {
    try {
      await this.es.client.delete({
        index: SUBJECT_INDEX,
        id: String(subjectId),
        refresh: 'wait_for',
      });
    } catch (error: any) {
      // Nếu document không có trong ES: báo giống Express (hoặc có thể bỏ qua)
      if (error?.meta?.statusCode === 404) {
        throw new Error('Subject không tồn tại trong ES');
      }
      throw error;
    }
  }

  // Đồng bộ 1 subject lên Elasticsearch
  private async syncOneSubjectToES(subjectId: string) {
    try {
      const subject = await this.subjectModel
        .findById(subjectId)
        .lean<{
          name: string;
          description?: string;
          image?: string;
          maxTopics?: number;
        }>();

      if (!subject) throw new Error('Subject không tồn tại');

      const esDocument = {
        name: subject.name,
        description: subject.description || '',
        maxTopics: subject.maxTopics ?? 20,
        image:
          subject.image ||
          'https://res.cloudinary.com/dglm2f7sr/image/upload/v1761400287/default_gdfbhs.png',
      };

      await this.es.client.index({
        index: 'subject',       
        id: String(subjectId),  
        document: esDocument,
        refresh: 'wait_for',    
      });

      console.log(`Subject ${subjectId} synced to Elasticsearch`);
    } catch (error) {
      console.error('Lỗi đồng bộ Subject lên Elasticsearch:', error);
      throw error;
    }
  }

}

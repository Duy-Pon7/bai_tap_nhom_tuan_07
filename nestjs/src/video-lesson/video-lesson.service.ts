// src/video-lesson/video-lesson.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VideoLesson, VideoLessonDocument } from './entities/video-lesson.entity';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';
import { convertToYoutubeEmbed } from '../common/utils/youtube.helper'

@Injectable()
export class VideoLessonService {
  constructor(
    @InjectModel(VideoLesson.name)
    private readonly videoModel: Model<VideoLessonDocument>,
  ) {}

  // Thêm video lesson
  async createVideoLessonSv(data: CreateVideoLessonDto) {
    // Convert URL sang embed nếu là YouTube
    const url = data.url ? convertToYoutubeEmbed(data.url) : data.url;

    // Ép topic -> ObjectId
    const topicObjectId =
      typeof data.topic === 'string' ? new Types.ObjectId(data.topic) : data.topic;

    const doc = await this.videoModel.create({
      title: data.title,
      url,
      duration: data.duration ?? undefined,
      topic: topicObjectId,
    });

    await doc.populate('topic', '-__v');
    return doc.toObject({ versionKey: false });
  }

  // Sửa video lesson
  async updateVideoLessonSv(_id: string, updateData: UpdateVideoLessonDto) {
    if (!_id) throw new Error('ID video lesson không hợp lệ');

    const toUpdate: any = {};

    if (typeof updateData.title !== 'undefined') toUpdate.title = updateData.title;
    if (typeof updateData.url !== 'undefined')
      toUpdate.url = convertToYoutubeEmbed(updateData.url);
    if (typeof updateData.duration !== 'undefined') toUpdate.duration = updateData.duration;

    if (updateData.topic) {
      toUpdate.topic =
        typeof updateData.topic === 'string'
          ? new Types.ObjectId(updateData.topic)
          : updateData.topic;
    }

    const updated = await this.videoModel
      .findByIdAndUpdate(_id, { $set: toUpdate }, { new: true, runValidators: true })
      .populate('topic', '-__v');

    if (!updated) throw new Error('Video lesson không tồn tại');

    return updated.toObject({ versionKey: false });
  }

  // Xóa video lesson
  async deleteVideoLessonSv(_id: string) {
    if (!_id) throw new Error('ID video lesson không hợp lệ');

    const deleted = await this.videoModel.findByIdAndDelete(_id);
    if (!deleted) throw new Error('Video lesson không tồn tại');

    return {
      message: 'Xóa thành công',
      video: deleted.toObject({ versionKey: false }),
    };
  }

  // Lấy danh sách theo phân trang (có filter theo topicId nếu cần) + search theo title
  async getVideoLessonsSv(
    page?: number,
    limit?: number,
    topicId?: string,
    search?: string,
  ): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    data: any[];
  }> {
    const filter: any = {};

    if (topicId) {
      filter.topic = new Types.ObjectId(topicId);
    }

    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' }; // tìm kiếm không phân biệt hoa thường
    }

    // Không truyền page/limit -> lấy tất cả
    if (!page || !limit) {
      const [videoLessons, total] = await Promise.all([
        this.videoModel
          .find(filter)
          .sort({ _id: -1 })
          .populate('topic', '-__v')
          .select('-__v')
          .lean(),
        this.videoModel.countDocuments(filter),
      ]);

      return {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
        data: videoLessons,
      };
    }

    // Có page/limit -> phân trang
    const pageNum = page ?? 1;
    const limitNum = limit ?? 10;
    const skip = (pageNum - 1) * limitNum;

    const [videoLessons, total] = await Promise.all([
      this.videoModel
        .find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort({ _id: -1 })
        .populate('topic', '-__v')
        .select('-__v')
        .lean(),
      this.videoModel.countDocuments(filter),
    ]);

    return {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: videoLessons,
    };
  }

  // Lấy chi tiết video lesson
  async getVideoLessonByIdSv(_id: string) {
    if (!_id) throw new Error('ID video lesson không hợp lệ');

    const doc = await this.videoModel.findById(_id).populate('topic').select('-__v').lean();
    if (!doc) throw new Error('Video lesson không tồn tại');

    return doc;
  }
}

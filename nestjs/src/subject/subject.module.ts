// src/subject/subject.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subject, SubjectSchema } from './entities/subject.entity';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';

@Module({
  imports: [
    // ✅ Đăng ký model vào module context này
    MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }]),
  ],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService], // nếu nơi khác cần dùng service này
})
export class SubjectModule {}

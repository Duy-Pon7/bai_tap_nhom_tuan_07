import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from './entities/topic.entity';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }])],
  controllers: [TopicController],
  providers: [TopicService],
  exports: [TopicService],
})
export class TopicModule {}

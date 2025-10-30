// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { checkRole } from './common/middleware/check-role.middleware';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from './common/config/multer.config';
import { SubjectModule } from './subject/subject.module';
import { ElasticsearchModule } from './common/config/elasticsearch.module';
import { TopicModule } from './topic/topic.module';
import { QuizModule } from './quiz/quiz.module';
import { QuestionModule } from './question/question.module';
import { VideoLessonModule } from './video-lesson/video-lesson.module';
import { ResultModule } from './result/result.module';
import { SubmissionModule } from './submission/submission.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    UserModule,
    MulterModule.register(multerConfig),
    SubjectModule,
    ElasticsearchModule,
    TopicModule,
    QuizModule,
    QuestionModule,
    VideoLessonModule,
    ResultModule,
    SubmissionModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Chỉ cho phép ADMIN truy cập vào API lấy danh sách người dùng
    consumer
      .apply(AuthMiddleware, checkRole('ADMIN'))
      .forRoutes(
        // path user
        { path: '/user/get-user-list', method: RequestMethod.GET },
        { path: '/user/create-user', method: RequestMethod.POST },
        { path: '/user/delete-user/:_id', method: RequestMethod.DELETE },
        { path: '/user/get-user/:_id', method: RequestMethod.GET },
        // path subject
        { path: '/subject/create-subject', method: RequestMethod.POST },
        { path: '/subject/update-subject/:_id', method: RequestMethod.PUT },
        { path: '/subject/delete-subject/:_id', method: RequestMethod.DELETE },
        // path topic
        {path: '/topic/create-topic', method: RequestMethod.POST },
        {path: '/topic/update-topic/:_id', method: RequestMethod.PUT },
        {path: '/topic/delete-topic/:_id', method: RequestMethod.DELETE },
        // path quiz
        {path: '/quiz/create-quiz', method: RequestMethod.POST },
        {path: '/quiz/update-quiz/:_id', method: RequestMethod.PUT },
        {path: '/quiz/delete-quiz/:_id', method: RequestMethod.DELETE },
        // path question
        {path: '/question/create-question', method: RequestMethod.POST },
        {path: '/question/update-question/:_id', method: RequestMethod.PUT },
        {path: '/question/delete-question/:_id', method: RequestMethod.DELETE },
        // path video
        {path: '/video-lesson/create', method: RequestMethod.POST },
        {path: '/video-lesson/update/:_id', method: RequestMethod.PUT },
        {path: '/video-lesson/delete/:_id', method: RequestMethod.DELETE },
        {path: '/video-lesson/detail/:_id', method: RequestMethod.GET },
      );
  }
}

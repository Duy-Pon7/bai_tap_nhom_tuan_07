import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './entities/quiz.entity';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }])],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}

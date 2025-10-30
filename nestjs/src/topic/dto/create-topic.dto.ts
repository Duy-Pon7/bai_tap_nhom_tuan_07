import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  subject: string;
}

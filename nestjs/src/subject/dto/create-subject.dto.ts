import { IsInt, IsOptional, IsString, Min, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // nếu gửi form-data, giá trị sẽ là string ⇒ dùng @Type để convert
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxTopics?: number;

  @IsOptional()
  @IsUrl()
  image?: string; // sẽ được overwrite sau khi upload Cloudinary
}

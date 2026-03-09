import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class AddNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @IsIn(['text', 'checklist', 'drawing'])
  type?: 'text' | 'checklist' | 'drawing';
}


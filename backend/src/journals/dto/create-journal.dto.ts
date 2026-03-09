import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { JournalMood } from '../journal.model';

export class CreateJournalDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsEnum(['happy', 'neutral', 'sad', 'stressed', 'excited', 'calm'], {
    message: 'mood must be happy, neutral, sad, stressed, excited, or calm',
  })
  mood?: JournalMood;

  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsOptional()
  @IsString()
  taskId?: string;
}

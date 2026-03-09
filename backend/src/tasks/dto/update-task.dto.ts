import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { TaskPriority, TaskStatus } from '../task.model';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'], {
    message: 'status must be todo, in_progress or done',
  })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], {
    message: 'priority must be low, medium or high',
  })
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}


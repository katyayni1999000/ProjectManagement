import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AddNoteDto } from './dto/add-note.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Request() req, @Query('projectId') projectId?: string) {
    return this.tasksService.findAllForUser(req.user.userId, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.userId, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tasksService.remove(id);
    return { success: true };
  }

  @Post(':id/notes')
  async addNote(@Param('id') id: string, @Body() dto: AddNoteDto) {
    return this.tasksService.addNote(id, dto);
  }

  @Delete(':id/notes/:noteId')
  async removeNote(@Param('id') id: string, @Param('noteId') noteId: string) {
    await this.tasksService.removeNote(id, noteId);
    return { success: true };
  }
}

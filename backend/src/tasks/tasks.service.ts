import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Task, TaskNote } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class TasksService implements OnModuleInit {
  private tasks: Task[] = [];
  private readonly tasksFilePath = join(process.cwd(), 'data', 'tasks.json');

  async onModuleInit() {
    await this.loadTasks();
  }

  private async loadTasks() {
    try {
      const file = await fs.readFile(this.tasksFilePath, 'utf-8');
      const parsed = JSON.parse(file) as Task[];
      if (Array.isArray(parsed)) {
        this.tasks = parsed;
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const nodeError = error as { code?: string };
        if (nodeError.code === 'ENOENT') {
          await this.ensureTasksFile();
          return;
        }
      }
      throw error;
    }
  }

  private async ensureTasksFile() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.tasksFilePath, JSON.stringify([], null, 2));
  }

  private async saveTasks() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.tasksFilePath, JSON.stringify(this.tasks, null, 2));
  }

  findAllForUser(userId: string, projectId?: string): Task[] {
    return this.tasks.filter((task) => {
      const matchesAssignee = !task.assigneeId || task.assigneeId === userId;
      const matchesProject = !projectId || task.projectId === projectId;
      return matchesAssignee && matchesProject;
    });
  }

  findOne(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: randomUUID(),
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? 'todo',
      priority: dto.priority ?? 'medium',
      assigneeId: dto.assigneeId ?? userId,
      dueDate: undefined,
      createdAt: now,
      updatedAt: now,
      notes: [],
    };
    this.tasks.push(task);
    await this.saveTasks();
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = this.findOne(id);
    if (dto.title !== undefined) {
      task.title = dto.title;
    }
    if (dto.description !== undefined) {
      task.description = dto.description;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }
    if (dto.assigneeId !== undefined) {
      task.assigneeId = dto.assigneeId;
    }
    task.updatedAt = new Date();
    await this.saveTasks();
    return task;
  }

  async remove(id: string): Promise<void> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new NotFoundException('Task not found');
    }
    this.tasks.splice(index, 1);
    await this.saveTasks();
  }

  async addNote(taskId: string, dto: AddNoteDto): Promise<TaskNote> {
    const task = this.findOne(taskId);
    const note: TaskNote = {
      id: randomUUID(),
      content: dto.content,
      type: dto.type || 'text',
      createdAt: new Date(),
    };
    task.notes.push(note);
    task.updatedAt = new Date();
    await this.saveTasks();
    return note;
  }

  async removeNote(taskId: string, noteId: string): Promise<void> {
    const task = this.findOne(taskId);
    const noteIndex = task.notes.findIndex((note) => note.id === noteId);
    if (noteIndex === -1) {
      throw new NotFoundException('Note not found');
    }

    task.notes.splice(noteIndex, 1);
    task.updatedAt = new Date();
    await this.saveTasks();
  }
}

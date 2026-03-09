import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { JournalEntry } from './journal.model';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@Injectable()
export class JournalsService implements OnModuleInit {
  private journals: JournalEntry[] = [];
  private readonly journalsFilePath = join(process.cwd(), 'data', 'journals.json');

  async onModuleInit() {
    await this.loadJournals();
  }

  private async loadJournals() {
    try {
      const file = await fs.readFile(this.journalsFilePath, 'utf-8');
      const parsed = JSON.parse(file) as JournalEntry[];
      if (Array.isArray(parsed)) {
        this.journals = parsed;
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const nodeError = error as { code?: string };
        if (nodeError.code === 'ENOENT') {
          await this.ensureJournalsFile();
          return;
        }
      }
      throw error;
    }
  }

  private async ensureJournalsFile() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.journalsFilePath, JSON.stringify([], null, 2));
  }

  private async saveJournals() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.journalsFilePath, JSON.stringify(this.journals, null, 2));
  }

  findAllForUser(ownerId: string): JournalEntry[] {
    return this.journals.filter((entry) => entry.ownerId === ownerId);
  }

  findOne(id: string, ownerId: string): JournalEntry {
    const entry = this.journals.find((journal) => journal.id === id && journal.ownerId === ownerId);
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return entry;
  }

  async create(ownerId: string, dto: CreateJournalDto): Promise<JournalEntry> {
    const now = new Date();
    const entryDate = dto.entryDate ? new Date(dto.entryDate) : now;
    const entry: JournalEntry = {
      id: randomUUID(),
      ownerId,
      title: dto.title,
      body: dto.body,
      mood: dto.mood ?? 'neutral',
      entryDate,
      taskId: dto.taskId,
      createdAt: now,
      updatedAt: now,
    };
    this.journals.push(entry);
    await this.saveJournals();
    return entry;
  }

  async update(id: string, ownerId: string, dto: UpdateJournalDto): Promise<JournalEntry> {
    const entry = this.findOne(id, ownerId);
    if (dto.title !== undefined) {
      entry.title = dto.title;
    }
    if (dto.body !== undefined) {
      entry.body = dto.body;
    }
    if (dto.mood !== undefined) {
      entry.mood = dto.mood;
    }
    if (dto.entryDate !== undefined) {
      entry.entryDate = new Date(dto.entryDate);
    }
    if (dto.taskId !== undefined) {
      entry.taskId = dto.taskId || undefined;
    }
    entry.updatedAt = new Date();
    await this.saveJournals();
    return entry;
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const index = this.journals.findIndex((entry) => entry.id === id && entry.ownerId === ownerId);
    if (index === -1) {
      throw new NotFoundException('Journal entry not found');
    }
    this.journals.splice(index, 1);
    await this.saveJournals();
  }
}

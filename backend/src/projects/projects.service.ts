import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Project } from './project.model';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ProjectsService implements OnModuleInit {
  private projects: Project[] = [];
  private readonly projectsFilePath = join(process.cwd(), 'data', 'projects.json');

  async onModuleInit() {
    await this.loadProjects();
  }

  private async loadProjects() {
    try {
      const file = await fs.readFile(this.projectsFilePath, 'utf-8');
      const parsed = JSON.parse(file) as Project[];
      if (Array.isArray(parsed)) {
        this.projects = parsed;
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const nodeError = error as { code?: string };
        if (nodeError.code === 'ENOENT') {
          await this.ensureProjectsFile();
          return;
        }
      }
      throw error;
    }
  }

  private async ensureProjectsFile() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.projectsFilePath, JSON.stringify([], null, 2));
  }

  private async saveProjects() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.projectsFilePath, JSON.stringify(this.projects, null, 2));
  }

  findAllForUser(ownerId: string): Project[] {
    return this.projects.filter((p) => p.ownerId === ownerId);
  }

  findOne(id: string, ownerId: string): Project {
    const project = this.projects.find((p) => p.id === id && p.ownerId === ownerId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      ownerId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.projects.push(project);
    return this.saveProjects().then(() => project);
  }

  async update(id: string, ownerId: string, dto: UpdateProjectDto): Promise<Project> {
    const project = this.findOne(id, ownerId);
    if (dto.name !== undefined) {
      project.name = dto.name;
    }
    if (dto.description !== undefined) {
      project.description = dto.description;
    }
    project.updatedAt = new Date();
    await this.saveProjects();
    return project;
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const index = this.projects.findIndex((p) => p.id === id && p.ownerId === ownerId);
    if (index === -1) {
      throw new NotFoundException('Project not found');
    }
    this.projects.splice(index, 1);
    await this.saveProjects();
  }
}

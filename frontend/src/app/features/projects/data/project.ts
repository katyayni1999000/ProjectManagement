import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Project {
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<ProjectData[]>('http://localhost:3000/projects');
  }

  getById(id: string) {
    return this.http.get<ProjectData>(`http://localhost:3000/projects/${id}`);
  }

  create(dto: CreateProjectDto) {
    return this.http.post<ProjectData>('http://localhost:3000/projects', dto);
  }

  update(id: string, dto: Partial<CreateProjectDto>) {
    return this.http.patch<ProjectData>(`http://localhost:3000/projects/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<{ success: boolean }>(`http://localhost:3000/projects/${id}`);
  }
}

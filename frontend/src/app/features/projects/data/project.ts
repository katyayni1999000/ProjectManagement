import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api-base-url';

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
    return this.http.get<ProjectData[]>(buildApiUrl('projects'));
  }

  getById(id: string) {
    return this.http.get<ProjectData>(buildApiUrl(`projects/${id}`));
  }

  create(dto: CreateProjectDto) {
    return this.http.post<ProjectData>(buildApiUrl('projects'), dto);
  }

  update(id: string, dto: Partial<CreateProjectDto>) {
    return this.http.patch<ProjectData>(buildApiUrl(`projects/${id}`), dto);
  }

  delete(id: string) {
    return this.http.delete<{ success: boolean }>(buildApiUrl(`projects/${id}`));
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type NoteType = 'text' | 'checklist' | 'drawing';

export interface TaskNote {
  id: string;
  content: string;
  type: NoteType;
  createdAt: Date;
}

export interface TaskData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  notes: TaskNote[];
}

export interface CreateTaskDto {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export interface AddNoteDto {
  content: string;
  type?: 'text' | 'checklist' | 'drawing';
}

@Injectable({
  providedIn: 'root',
})
export class Task {
  constructor(private http: HttpClient) {}

  getAll(projectId?: string) {
    let url = 'http://localhost:3000/tasks';
    if (projectId) {
      url += `?projectId=${projectId}`;
    }
    return this.http.get<TaskData[]>(url);
  }

  getById(id: string) {
    return this.http.get<TaskData>(`http://localhost:3000/tasks/${id}`);
  }

  create(dto: CreateTaskDto) {
    return this.http.post<TaskData>('http://localhost:3000/tasks', dto);
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.http.patch<TaskData>(`http://localhost:3000/tasks/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<{ success: boolean }>(`http://localhost:3000/tasks/${id}`);
  }

  addNote(taskId: string, dto: AddNoteDto) {
    return this.http.post<TaskNote>(`http://localhost:3000/tasks/${taskId}/notes`, dto);
  }

  deleteNote(taskId: string, noteId: string) {
    return this.http.delete<{ success: boolean }>(`http://localhost:3000/tasks/${taskId}/notes/${noteId}`);
  }
}

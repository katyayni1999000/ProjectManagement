import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api-base-url';

export type JournalMood = 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited' | 'calm';

export interface JournalData {
  id: string;
  title: string;
  body: string;
  mood: JournalMood;
  entryDate: Date;
  taskId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJournalDto {
  title: string;
  body: string;
  mood?: JournalMood;
  entryDate?: string;
  taskId?: string;
}

export interface UpdateJournalDto {
  title?: string;
  body?: string;
  mood?: JournalMood;
  entryDate?: string;
  taskId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Journal {
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<JournalData[]>(buildApiUrl('journals'));
  }

  getById(id: string) {
    return this.http.get<JournalData>(buildApiUrl(`journals/${id}`));
  }

  create(dto: CreateJournalDto) {
    return this.http.post<JournalData>(buildApiUrl('journals'), dto);
  }

  update(id: string, dto: UpdateJournalDto) {
    return this.http.patch<JournalData>(buildApiUrl(`journals/${id}`), dto);
  }

  delete(id: string) {
    return this.http.delete<{ success: boolean }>(buildApiUrl(`journals/${id}`));
  }
}

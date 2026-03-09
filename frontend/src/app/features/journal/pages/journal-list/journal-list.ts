import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { Journal as JournalService, JournalData, JournalMood } from '../../data/journal';
import { Task as TaskService, TaskData } from '../../../tasks/data/task';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './journal-list.html',
  styleUrl: './journal-list.scss',
})
export class JournalList implements OnInit {
  private readonly journalService = inject(JournalService);
  private readonly taskService = inject(TaskService);

  journals = signal<JournalData[]>([]);
  tasks = signal<TaskData[]>([]);
  loading = signal(false);
  loadingTasks = signal(false);
  creating = signal(false);
  deletingId = signal('');
  errorMessage = signal('');

  moods: Array<{ value: JournalMood; label: string; emoji: string }> = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'neutral', label: 'Neutral', emoji: '😌' },
    { value: 'sad', label: 'Sad', emoji: '😔' },
    { value: 'stressed', label: 'Stressed', emoji: '😵‍💫' },
    { value: 'excited', label: 'Excited', emoji: '🤩' },
    { value: 'calm', label: 'Calm', emoji: '🧘' },
  ];

  newEntry = {
    title: '',
    body: '',
    entryDate: '',
    mood: 'neutral' as JournalMood,
    taskId: '',
  };

  ngOnInit(): void {
    this.newEntry.entryDate = this.today();
    this.loadJournals();
    this.loadTasks();
  }

  loadJournals() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.journalService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (entries) => {
          this.journals.set([...entries].sort((a, b) => {
            const aDate = new Date(a.entryDate).getTime();
            const bDate = new Date(b.entryDate).getTime();
            return bDate - aDate;
          }));
        },
        error: () => {
          this.errorMessage.set('Could not load journal entries. Please try again.');
        },
      });
  }

  loadTasks() {
    this.loadingTasks.set(true);
    this.taskService
      .getAll()
      .pipe(finalize(() => this.loadingTasks.set(false)))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
        },
        error: () => {
          this.loadingTasks.set(false);
        },
      });
  }

  setMood(mood: JournalMood) {
    this.newEntry.mood = mood;
  }

  createEntry() {
    if (this.creating() || !this.newEntry.title.trim() || !this.newEntry.body.trim()) {
      return;
    }
    this.errorMessage.set('');
    this.creating.set(true);
    this.journalService
      .create({
        title: this.newEntry.title.trim(),
        body: this.newEntry.body.trim(),
        mood: this.newEntry.mood,
        entryDate: this.newEntry.entryDate,
        taskId: this.newEntry.taskId || undefined,
      })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (entry) => {
          if (entry?.id) {
            this.journals.update((existing) => [entry, ...existing]);
          } else {
            this.loadJournals();
          }
          this.resetForm();
        },
        error: () => {
          this.errorMessage.set('Could not save journal entry. Please try again.');
        },
      });
  }

  resetForm() {
    this.newEntry = {
      title: '',
      body: '',
      entryDate: this.today(),
      mood: 'neutral',
      taskId: '',
    };
  }

  deleteEntry(entryId: string) {
    if (!confirm('Delete this journal entry?')) {
      return;
    }
    this.deletingId.set(entryId);
    this.journalService.delete(entryId).subscribe({
      next: () => {
        this.journals.update((entries) => entries.filter((entry) => entry.id !== entryId));
        this.deletingId.set('');
      },
      error: () => {
        this.deletingId.set('');
      },
    });
  }

  getTaskTitle(taskId?: string) {
    if (!taskId) return '';
    return this.tasks().find((task) => task.id === taskId)?.title || '';
  }

  getMoodLabel(mood: JournalMood) {
    return this.moods.find((item) => item.value === mood)?.label ?? mood;
  }

  getMoodEmoji(mood: JournalMood) {
    return this.moods.find((item) => item.value === mood)?.emoji ?? '📝';
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}

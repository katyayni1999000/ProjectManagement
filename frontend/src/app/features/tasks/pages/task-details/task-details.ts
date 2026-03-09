import { Component, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { Task as TaskService, TaskData, TaskNote, NoteType } from '../../data/task';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './task-details.html',
  styleUrl: './task-details.scss',
})
export class TaskDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly taskService = inject(TaskService);

  task = signal<TaskData | null>(null);
  loading = signal(false);
  errorMessage = '';

  addingNote = false;
  deletingNoteId = '';
  editingNoteId = '';
  editingNoteContent = '';
  noteContent = '';
  noteType: NoteType = 'text';

  showDrawingModal = false;
  isDrawing = false;
  @ViewChild('drawingCanvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;
  private ctx?: CanvasRenderingContext2D | null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const taskId = params.get('id');
      if (taskId) {
        this.loadTask(taskId);
      }
    });
  }

  loadTask(taskId: string) {
    this.loading.set(true);
    this.errorMessage = '';
    this.taskService
      .getById(taskId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (task) => {
          this.task.set(task);
          this.noteType = 'text';
        },
        error: () => {
          this.errorMessage = 'Could not load task. Please try again.';
        },
      });
  }

  setNoteType(type: NoteType) {
    this.noteType = type;
  }

  addNote() {
    const task = this.task();
    if (!task) return;

    const type = this.noteType || 'text';

    if (type === 'drawing') {
      this.openDrawingModal();
      return;
    }

    let content = (this.noteContent || '').trim();
    if (!content) {
      if (type === 'checklist') {
        content = '[ ] New item';
      } else {
        return;
      }
    }

    if (type === 'checklist' && !content.match(/^\[[ x]\]/m)) {
      content = '[ ] ' + content;
    }

    this.addingNote = true;
    this.taskService.addNote(task.id, { content, type }).subscribe({
      next: (note) => {
        this.task.set({
          ...task,
          notes: [...(task.notes || []), note],
        });
        this.noteContent = '';
        this.addingNote = false;
      },
      error: () => {
        this.addingNote = false;
      },
    });
  }

  // Drawing Modal Methods
  openDrawingModal() {
    this.showDrawingModal = true;
    setTimeout(() => this.initCanvas(), 100);
  }

  closeDrawingModal() {
    this.showDrawingModal = false;
    this.ctx = null;
  }

  initCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
    }
  }

  startDrawing(event: MouseEvent) {
    this.isDrawing = true;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing || !this.ctx || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearCanvas() {
    if (!this.canvasRef || !this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  saveDrawing() {
    const task = this.task();
    if (!this.canvasRef || !task) return;
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');

    this.addingNote = true;
    this.taskService.addNote(task.id, { content: dataUrl, type: 'drawing' }).subscribe({
      next: (note) => {
        this.task.set({
          ...task,
          notes: [...(task.notes || []), note],
        });
        this.closeDrawingModal();
        this.addingNote = false;
      },
      error: () => {
        this.addingNote = false;
      },
    });
  }

  // Checklist Methods
  toggleChecklistItem(note: TaskNote, index: number) {
    const lines = note.content.split('\n');
    if (lines[index]) {
      if (lines[index].includes('[x]')) {
        lines[index] = lines[index].replace('[x]', '[ ]');
      } else {
        lines[index] = lines[index].replace('[ ]', '[x]');
      }
      note.content = lines.join('\n');
    }
  }

  parseChecklist(content: string): Array<{ checked: boolean; text: string }> {
    return content.split('\n').map((line) => {
      const match = line.match(/\[([ x])\]\s*(.*)/);
      if (match) {
        return { checked: match[1] === 'x', text: match[2] };
      }
      return { checked: false, text: line };
    });
  }

  startEditNote(note: TaskNote) {
    this.editingNoteId = note.id;
    this.editingNoteContent = note.content;
  }

  cancelEditNote() {
    this.editingNoteId = '';
    this.editingNoteContent = '';
  }

  saveEditNote(note: TaskNote) {
    const content = this.editingNoteContent.trim();
    if (!content || content === note.content) {
      this.cancelEditNote();
      return;
    }
    note.content = content;
    this.cancelEditNote();
  }

  confirmDeleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    this.deleteNote(noteId);
  }

  deleteNote(noteId: string) {
    const task = this.task();
    if (!task) return;
    this.deletingNoteId = noteId;
    this.taskService.deleteNote(task.id, noteId).subscribe({
      next: () => {
        this.task.set({
          ...task,
          notes: task.notes.filter((note) => note.id !== noteId),
        });
        this.deletingNoteId = '';
      },
      error: () => {
        this.deletingNoteId = '';
      },
    });
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const noteDate = new Date(date);
    const diffMs = now.getTime() - noteDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return noteDate.toLocaleDateString();
  }

  getCharacterCount(): string {
    const length = (this.noteContent || '').length;
    return `${length}/500`;
  }
}

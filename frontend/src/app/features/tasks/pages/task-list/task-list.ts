import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task as TaskService, TaskData, TaskNote, AddNoteDto, NoteType } from '../../data/task';
import { Project as ProjectService, ProjectData } from '../../../projects/data/project';
import { finalize } from 'rxjs';

interface Task extends TaskData {}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);

  tasks: Task[] = [];
  projects: ProjectData[] = [];
  loading = signal(false);
  loadingProjects = signal(false);
  creating = false;
  deletingNoteId = '';
  addingNoteFor: { [taskId: string]: boolean } = {};
  editingNoteId = '';
  editingNoteContent = '';
  errorMessage = '';
  noteContent: { [taskId: string]: string } = {};
  noteType: { [taskId: string]: NoteType } = {};
  showDrawingModal = false;
  currentDrawingTaskId = '';
  isDrawing = false;
  @ViewChild('drawingCanvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;
  private ctx?: CanvasRenderingContext2D | null;
  newTask = {
    projectId: '',
    title: '',
    description: '',
  };

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  loadProjects() {
    this.loadingProjects.set(true);
    this.projectService
      .getAll()
      .pipe(finalize(() => this.loadingProjects.set(false)))
      .subscribe({
        next: (projects) => {
          this.projects = projects;
          if (!this.newTask.projectId && this.projects.length > 0) {
            setTimeout(() => {
              if (!this.newTask.projectId && this.projects.length > 0) {
                this.newTask.projectId = this.projects[0].id;
              }
            });
          }
        },
        error: () => {
          this.errorMessage = 'Could not load projects. Please refresh.';
        },
      });
  }

  loadTasks() {
    this.loading.set(true);
    this.errorMessage = '';
    this.taskService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          // Initialize note types for each task
          this.tasks.forEach(task => {
            if (!this.noteType[task.id]) {
              this.noteType[task.id] = 'text';
            }
          });
        },
        error: () => {
          this.errorMessage = 'Could not load tasks. Please try again.';
        },
      });
  }

  createTask() {
    if (!this.newTask.projectId.trim() || !this.newTask.title.trim()) {
      return;
    }
    this.creating = true;
    this.taskService
      .create({
        projectId: this.newTask.projectId,
        title: this.newTask.title,
        description: this.newTask.description || undefined,
      })
      .subscribe({
        next: (task) => {
          this.tasks = [...this.tasks, task];
          this.newTask = {
            projectId: this.newTask.projectId,
            title: '',
            description: '',
          };
          this.creating = false;
        },
        error: () => {
          this.creating = false;
        },
      });
  }

  addNote(task: Task) {
    const type = this.noteType[task.id] || 'text';
    
    // For drawing type, open the drawing modal
    if (type === 'drawing') {
      this.openDrawingModal(task.id);
      return;
    }

    // For checklist, add default unchecked item if empty
    let content = (this.noteContent[task.id] || '').trim();
    if (!content) {
      if (type === 'checklist') {
        content = '[ ] New item';
      } else {
        return;
      }
    }

    // For checklist, ensure proper format
    if (type === 'checklist' && !content.match(/^\[[ x]\]/m)) {
      content = '[ ] ' + content;
    }

    this.addingNoteFor[task.id] = true;
    this.taskService
      .addNote(task.id, { content, type })
      .subscribe({
        next: (note) => {
          const target = this.tasks.find((t) => t.id === task.id);
          if (target) {
            target.notes = [...(target.notes || []), note];
          }
          this.noteContent[task.id] = '';
          this.addingNoteFor[task.id] = false;
        },
        error: () => {
          this.addingNoteFor[task.id] = false;
        },
      });
  }

  setNoteType(taskId: string, type: NoteType) {
    this.noteType[taskId] = type;
  }

  // Drawing Modal Methods
  openDrawingModal(taskId: string) {
    this.currentDrawingTaskId = taskId;
    this.showDrawingModal = true;
    setTimeout(() => this.initCanvas(), 100);
  }

  closeDrawingModal() {
    this.showDrawingModal = false;
    this.currentDrawingTaskId = '';
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
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    
    const task = this.tasks.find(t => t.id === this.currentDrawingTaskId);
    if (!task) return;

    this.addingNoteFor[task.id] = true;
    this.taskService
      .addNote(task.id, { content: dataUrl, type: 'drawing' })
      .subscribe({
        next: (note) => {
          const target = this.tasks.find((t) => t.id === task.id);
          if (target) {
            target.notes = [...(target.notes || []), note];
          }
          this.closeDrawingModal();
          this.addingNoteFor[task.id] = false;
        },
        error: () => {
          this.addingNoteFor[task.id] = false;
        },
      });
  }

  // Checklist Methods
  toggleChecklistItem(task: Task, note: TaskNote, index: number) {
    const lines = note.content.split('\n');
    if (lines[index]) {
      if (lines[index].includes('[x]')) {
        lines[index] = lines[index].replace('[x]', '[ ]');
      } else {
        lines[index] = lines[index].replace('[ ]', '[x]');
      }
      note.content = lines.join('\n');
      // In real app, update on backend
    }
  }

  parseChecklist(content: string): Array<{ checked: boolean; text: string }> {
    return content.split('\n').map(line => {
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

  saveEditNote(task: Task, note: TaskNote) {
    const content = this.editingNoteContent.trim();
    if (!content || content === note.content) {
      this.cancelEditNote();
      return;
    }
    // Update locally for immediate feedback
    note.content = content;
    this.cancelEditNote();
    // In a real app, you'd call an update endpoint here
  }

  confirmDeleteNote(task: Task, noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    this.deleteNote(task, noteId);
  }

  deleteNote(task: Task, noteId: string) {
    this.deletingNoteId = noteId;
    this.taskService.deleteNote(task.id, noteId).subscribe({
      next: () => {
        const target = this.tasks.find((t) => t.id === task.id);
        if (target) {
          target.notes = target.notes.filter((note) => note.id !== noteId);
        }
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

  getCharacterCount(taskId: string): string {
    const length = (this.noteContent[taskId] || '').length;
    return `${length}/500`;
  }
}

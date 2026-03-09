import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { Project as ProjectService, ProjectData } from '../../data/project';
import { Task as TaskService, TaskData, CreateTaskDto } from '../../../tasks/data/task';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './project-details.html',
  styleUrl: './project-details.scss',
})
export class ProjectDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);

  project = signal<ProjectData | null>(null);
  tasks = signal<TaskData[]>([]);
  loading = signal(true);
  creatingTask = false;
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskPriority: 'low' | 'medium' | 'high' = 'medium';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const projectId = params.get('id');
      if (projectId) {
        this.loadProject(projectId);
        this.loadTasks(projectId);
      }
    });
  }

  loadProject(id: string) {
    this.projectService.getById(id).subscribe({
      next: (project) => {
        this.project.set(project);
      },
      error: (err) => {
        console.error('Error loading project:', err);
      },
    });
  }

  loadTasks(projectId: string) {
    this.loading.set(true);
    this.taskService.getAll(projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.loading.set(false);
      },
    });
  }

  createTask() {
    if (!this.newTaskTitle?.trim() || !this.project()) {
      return;
    }

    const dto: CreateTaskDto = {
      projectId: this.project()!.id,
      title: this.newTaskTitle,
      description: this.newTaskDescription || undefined,
      priority: this.newTaskPriority,
      status: 'todo',
    };

    this.creatingTask = true;
    this.taskService.create(dto).subscribe({
      next: (task) => {
        this.tasks.set([...this.tasks(), task]);
        this.newTaskTitle = '';
        this.newTaskDescription = '';
        this.newTaskPriority = 'medium';
        this.creatingTask = false;
      },
      error: (err) => {
        console.error('Error creating task:', err);
        this.creatingTask = false;
      },
    });
  }

  updateTaskStatus(task: TaskData, newStatus: 'todo' | 'in_progress' | 'done') {
    this.taskService.update(task.id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.tasks.set(this.tasks().map((t) => (t.id === task.id ? updated : t)));
      },
      error: (err) => console.error('Error updating task:', err),
    });
  }

  deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.delete(taskId).subscribe({
        next: () => {
          this.tasks.set(this.tasks().filter((t) => t.id !== taskId));
        },
        error: (err) => console.error('Error deleting task:', err),
      });
    }
  }
}

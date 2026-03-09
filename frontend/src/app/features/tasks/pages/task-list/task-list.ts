import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Task as TaskService, TaskData } from '../../data/task';
import { Project as ProjectService, ProjectData } from '../../../projects/data/project';
import { finalize } from 'rxjs';

interface Task extends TaskData {}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  errorMessage = '';
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
}

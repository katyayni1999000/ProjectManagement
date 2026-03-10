import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project as ProjectService, ProjectData } from '../../data/project';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export class ProjectList implements OnInit {
  private readonly projectService = inject(ProjectService);

  projects: ProjectData[] = [];
  loading = signal(false);
  creating = signal(false);
  newName = '';
  newDescription = '';

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects() {
    this.loading.set(true);
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  createProject(event: Event) {
    event.preventDefault();
    if (!this.newName?.trim()) {
      return;
    }
    this.creating.set(true);
    this.projectService
      .create({
        name: this.newName,
        description: this.newDescription || undefined,
      })
      .subscribe({
        next: (project) => {
          this.projects = [...this.projects, project];
          this.newName = '';
          this.newDescription = '';
          this.creating.set(false);
        },
        error: () => {
          this.creating.set(false);
        },
      });
  }
}

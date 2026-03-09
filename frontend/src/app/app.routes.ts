import { Routes } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { ProjectList } from './features/projects/pages/project-list/project-list';
import { ProjectDetails } from './features/projects/pages/project-details/project-details';
import { TaskList } from './features/tasks/pages/task-list/task-list';
import { authGuard } from './core/guards/auth-guard';
import { TaskDetails } from './features/tasks/pages/task-details/task-details';
import { JournalList } from './features/journal/pages/journal-list/journal-list';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'auth',
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
    ],
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    children: [
      { path: '', component: ProjectList },
      { path: ':id', component: ProjectDetails },
    ],
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    children: [
      { path: '', component: TaskList },
      { path: ':id', component: TaskDetails },
    ],
  },
  {
    path: 'journal',
    canActivate: [authGuard],
    children: [{ path: '', component: JournalList }],
  },
  { path: '**', redirectTo: 'projects' },
];

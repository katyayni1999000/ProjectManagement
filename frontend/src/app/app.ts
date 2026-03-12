import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from './features/auth/data/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);

  get currentUser() {
    return this.authService.currentUser;
  }

  get showGuestNav(): boolean {
    return !this.currentUser() && !this.router.url.startsWith('/auth/');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../data/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error: string | null = null;

  submit() {
    this.loading.set(true);
    this.error = null;
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/auth/login');
      },
      error: (err) => {
        this.loading.set(false);
        this.error = err?.error?.message ?? 'Registration failed';
      },
    });
  }
}

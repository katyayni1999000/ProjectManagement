import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { buildApiUrl } from '../../../core/config/api-base-url';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly tokenKey = 'taskManagerToken';
  currentUser = signal<AuthUser | null>(null);

  constructor(private http: HttpClient) {
    if (this.isBrowser()) {
      const storedUser = localStorage.getItem('taskManagerUser');
      if (storedUser) {
        this.currentUser.set(JSON.parse(storedUser));
      }
    }
  }

  get token(): string | null {
    if (!this.isBrowser()) {
      return null;
    }
    return localStorage.getItem(this.tokenKey);
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(buildApiUrl('auth/login'), { email, password })
      .pipe(
        tap((res) => {
          if (this.isBrowser()) {
            localStorage.setItem(this.tokenKey, res.accessToken);
            localStorage.setItem('taskManagerUser', JSON.stringify(res.user));
          }
          this.currentUser.set(res.user);
        }),
      );
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<AuthUser>(buildApiUrl('auth/register'), { name, email, password })
      .pipe(
        tap((user) => {
          this.currentUser.set(user);
        }),
      );
  }

  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem('taskManagerUser');
    }
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}


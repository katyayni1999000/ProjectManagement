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
  private readonly userKey = 'taskManagerUser';
  currentUser = signal<AuthUser | null>(null);

  constructor(private http: HttpClient) {
    this.restoreSession();
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
          this.persistSession(res.accessToken, res.user);
        }),
      );
  }

  register(name: string, email: string, password: string) {
    return this.http.post<AuthUser>(buildApiUrl('auth/register'), { name, email, password });
  }

  logout() {
    this.clearStoredSession();
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private restoreSession() {
    if (!this.isBrowser()) {
      return;
    }

    const token = localStorage.getItem(this.tokenKey);
    const storedUser = localStorage.getItem(this.userKey);

    if (!token || !storedUser) {
      this.clearStoredSession();
      return;
    }

    try {
      this.currentUser.set(JSON.parse(storedUser) as AuthUser);
    } catch {
      this.clearStoredSession();
      this.currentUser.set(null);
    }
  }

  private persistSession(token: string, user: AuthUser) {
    if (this.isBrowser()) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    this.currentUser.set(user);
  }

  private clearStoredSession() {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}


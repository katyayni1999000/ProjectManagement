import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { Auth } from './auth';

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('restores a stored session only when token and user both exist', () => {
    localStorage.setItem('taskManagerToken', 'token-123');
    localStorage.setItem(
      'taskManagerUser',
      JSON.stringify({ id: '1', email: 'demo@example.com', name: 'Demo User' }),
    );

    const restored = TestBed.runInInjectionContext(() => TestBed.inject(Auth));

    expect(restored.token).toBe('token-123');
    expect(restored.currentUser()).toEqual({
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
    });
  });

  it('clears a stale stored user when the token is missing', () => {
    localStorage.setItem(
      'taskManagerUser',
      JSON.stringify({ id: '1', email: 'demo@example.com', name: 'Demo User' }),
    );

    const restored = TestBed.runInInjectionContext(() => TestBed.inject(Auth));

    expect(restored.token).toBeNull();
    expect(restored.currentUser()).toBeNull();
    expect(localStorage.getItem('taskManagerUser')).toBeNull();
  });

  it('persists token and user on login', () => {
    service.login('demo@example.com', 'password').subscribe();

    const request = httpMock.expectOne('http://localhost:3000/auth/login');
    request.flush({
      accessToken: 'jwt-token',
      user: { id: '1', email: 'demo@example.com', name: 'Demo User' },
    });

    expect(localStorage.getItem('taskManagerToken')).toBe('jwt-token');
    expect(service.currentUser()).toEqual({
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
    });
  });

  it('does not create a session on register', () => {
    service.register('Demo User', 'demo@example.com', 'password').subscribe();

    const request = httpMock.expectOne('http://localhost:3000/auth/register');
    request.flush({ id: '1', email: 'demo@example.com', name: 'Demo User' });

    expect(localStorage.getItem('taskManagerToken')).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { authInterceptor } from './auth-interceptor';
import { Auth } from '../../features/auth/data/auth';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: Auth;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(Auth);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('adds the bearer token when one is available', () => {
    localStorage.setItem('taskManagerToken', 'jwt-token');
    localStorage.setItem(
      'taskManagerUser',
      JSON.stringify({ id: '1', email: 'demo@example.com', name: 'Demo User' }),
    );

    http.get('/projects').subscribe();

    const request = httpMock.expectOne('/projects');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush([]);
  });

  it('logs out on unauthorized protected API responses', () => {
    localStorage.setItem('taskManagerToken', 'expired-token');
    localStorage.setItem(
      'taskManagerUser',
      JSON.stringify({ id: '1', email: 'demo@example.com', name: 'Demo User' }),
    );

    auth.currentUser.set({ id: '1', email: 'demo@example.com', name: 'Demo User' });

    http.get('/projects').subscribe({ error: () => undefined });

    const request = httpMock.expectOne('/projects');
    request.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('taskManagerToken')).toBeNull();
    expect(localStorage.getItem('taskManagerUser')).toBeNull();
  });
});

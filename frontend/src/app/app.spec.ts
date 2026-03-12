import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { Auth } from './features/auth/data/auth';

describe('App', () => {
  const authMock = {
    currentUser: () => null,
    logout: vi.fn(),
  };

  beforeEach(async () => {
    authMock.logout.mockReset();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: Auth, useValue: authMock }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Project Manager');
  });

  it('should hide the login link on auth routes for guests', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/auth/login');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(compiled.querySelectorAll('.app-nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(navLinks).not.toContain('Login');
  });
});

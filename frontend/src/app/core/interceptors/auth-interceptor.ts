import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../../features/auth/data/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.token;

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && !isAuthRequest(req.url)) {
        auth.logout();
      }

      return throwError(() => error);
    }),
  );
};

function isAuthRequest(url: string) {
  return /\/auth\/(login|register)(?:\?|$)/.test(url);
}

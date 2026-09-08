import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { StudioService } from '../../studio/services/studio.service';

export const studioSetupAccessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const studioService = inject(StudioService);
  const router = inject(Router);

  const studioId = authService.getRoleScopedProfileId();
  if (!studioId) {
    return router.parseUrl('/login');
  }

  // Fast path: token says completed, skip setup.
  if (authService.isProfileComplete()) {
    return router.parseUrl('/studio/dashboard');
  }

  // Fallback: verify against server in case token claim is stale.
  return studioService.getProfileCompletionStatus(studioId).pipe(
    map((res) => {
      const allStepsCompleted =
        (res.steps.length > 0 && res.steps.every((step) => step.isCompleted)) || res.percentage >= 100;

      return allStepsCompleted ? router.parseUrl('/studio/dashboard') : true;
    }),
    catchError(() => of(true))
  );
};

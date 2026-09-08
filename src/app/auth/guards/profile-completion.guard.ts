import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { StudioService } from '../../studio/services/studio.service';

export const profileCompletionGuard : CanActivateFn = () => {
        const authService = inject(AuthService);
        const studioService = inject(StudioService);
        const router = inject(Router);

        const studioId = authService.getRoleScopedProfileId();
        if (!studioId) {
            return router.parseUrl('/login');
        }

        // Fast path for already-updated tokens.
        if (authService.isProfileComplete()) return true;

        // Fallback to server truth when token claim is stale after profile updates.
        return studioService.getProfileCompletionStatus(studioId).pipe(
            map((res) => {
                const allStepsCompleted = res.steps.length > 0 && res.steps.every((step) => step.isCompleted);
                return allStepsCompleted || res.percentage >= 100 ? true : router.parseUrl('/studio/setup');
            }),
            catchError(() => of(router.parseUrl('/studio/setup')))
        );
}
import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/UserRole';

const ROLE_DASHBOARD: Record<UserRole, string> = {
  [UserRole.Cosnsumer]: '/consumer/dashboard',
  [UserRole.Studio]: '/studio',
  [UserRole.Admin]: '/admin',
};

export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  const role = authService.getRole();
  if (role === null) {
    authService.clearTokens();
    return router.parseUrl('/login');
  }

  const dashboardPath = ROLE_DASHBOARD[role];

  // Already heading to the correct dashboard — allow through
  if (state.url.startsWith(dashboardPath)) {
    return true;
  }

  // Wrong section for this role — redirect to their dashboard
  return router.parseUrl(dashboardPath);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RegistrationSuccessAccessService } from '../services/registration-success-access.service';

export const successCreationAccessGuard: CanActivateFn = () => {
  const accessService = inject(RegistrationSuccessAccessService);
  const router = inject(Router);

  if (accessService.hasAccess()) {
    accessService.consumeAccess();
    return true;
  }

  return router.parseUrl('/auth/user');
};

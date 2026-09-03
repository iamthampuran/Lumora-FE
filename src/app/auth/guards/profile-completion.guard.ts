import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

export const profileCompletionGuard : CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if(authService.isProfileComplete()) return true;

    return router.parseUrl('/studio/setup');
}
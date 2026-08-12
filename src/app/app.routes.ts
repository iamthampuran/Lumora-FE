import { Routes } from '@angular/router';
import { StudioRoutes } from './studio/studio.routes';
import { AuthRoutes } from './auth/auth.routes';
import { Login } from './auth/components/login/login';
import { authGuard } from './auth/guards/auth.guard';
import { loginGuard } from './auth/guards/login.guard';
import { ConsumerRoutes } from './consumer/consumer.routes';

export const routes: Routes = [
    {
        path: 'studio',
        canActivate: [authGuard],
        children: StudioRoutes,
    },
    {
        path: 'auth',
        children: AuthRoutes
    },
    {
        path: 'consumer',
        canActivate: [authGuard],
        children: ConsumerRoutes
    },
    {
        path: 'login',
        canActivate: [loginGuard],
        component: Login
    },
    {
        path: '**',
        redirectTo: '/login',
    }
];

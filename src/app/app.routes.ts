import { Routes } from '@angular/router';
import { StudioRoutes } from './studio/studio.routes';
import { AuthRoutes } from './auth/auth.routes';
import { Login } from './auth/components/login/login';

export const routes: Routes = [
    {
        path: 'studio',
        children: StudioRoutes,
    },
    {
        path: 'auth',
        children: AuthRoutes
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: '**',
        redirectTo: '/login',
    }
];

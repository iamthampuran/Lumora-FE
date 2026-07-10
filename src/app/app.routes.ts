import { Routes } from '@angular/router';
import { StudioRoutes } from './studio/studio.routes';

export const routes: Routes = [
    {
        path: 'studio',
        children: StudioRoutes,
    }
];

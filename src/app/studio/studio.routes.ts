import { Routes } from "@angular/router";
import { StudioDetails } from "./pages/studio-details/studio-details";
// import { ProfileSetup } from "./pages/profile-setup/profile-setup";
import { profileCompletionGuard } from "../auth/guards/profile-completion.guard";
import { studioSetupAccessGuard } from "../auth/guards/studio-setup-access.guard";
import { ProfileSetup } from "./components/profile-setup/profile-setup";
import { StudioDashboard } from "./components/studio-dashboard/studio-dashboard";
import { StudioLayout } from "./components/studio-layout/studio-layout";

export const StudioRoutes: Routes = [
    {
        // Setup gets no layout (full screen)
        path: 'setup',
        canActivate: [studioSetupAccessGuard],
        component: ProfileSetup, 
    },
    {
        // Everything inside here gets the sidebar
        path: '',
        component: StudioLayout, 
        canActivate: [profileCompletionGuard], 
        children: [
            {
                path: 'dashboard',
                component: StudioDashboard,
            },
            // Note: Add Inquiries, Galleries, and Settings routes here as you build them
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
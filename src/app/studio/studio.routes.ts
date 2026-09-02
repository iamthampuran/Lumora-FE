import { Routes } from "@angular/router";
import { StudioDetails } from "./pages/studio-details/studio-details";
// import { ProfileSetup } from "./pages/profile-setup/profile-setup";
import { profileCompletionGuard } from "../auth/guards/profile-completion.guard";
import { ProfileSetup } from "./components/profile-setup/profile-setup";

export const StudioRoutes : Routes = [
    {
        path: 'setup',
        component: ProfileSetup, 
    },
    {
        path: 'dashboard', // <-- Changed from ':studioId'
        canActivate: [profileCompletionGuard], 
        component: StudioDetails, // (You might want to rename this component to StudioDashboard eventually)
    },
    {
        path: '',
        redirectTo: 'dashboard', // <-- Default to dashboard (the guard will handle kicking them to setup if needed)
        pathMatch: 'full'
    }
]
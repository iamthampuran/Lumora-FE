import { Routes } from "@angular/router";
import { StudioDetails } from "./pages/studio-details/studio-details";

export const StudioRoutes : Routes = [
    {
        path: ':studioId',
        component: StudioDetails,
    }
]
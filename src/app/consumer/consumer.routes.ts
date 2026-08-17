import { Routes } from "@angular/router";
import { Dashboard } from "./components/dashboard/dashboard";
import { CreateEvent } from "./components/create-event/create-event";

export const ConsumerRoutes: Routes = [
    {
        "path": "dashboard",
        component: Dashboard
    },
    {
        "path": "create-event",
        component: CreateEvent
    }
]
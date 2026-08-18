import { Routes } from "@angular/router";
import { Dashboard } from "./components/dashboard/dashboard";
import { CreateEvent } from "./components/create-event/create-event";
import { EventDetails } from "./components/event-details/event-details";

export const ConsumerRoutes: Routes = [
    {
        "path": "dashboard",
        component: Dashboard
    },
    {
        "path": "create-event",
        component: CreateEvent
    },
    {
        "path": "events/:id",
        component: EventDetails
    }
]
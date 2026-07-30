import { Routes } from "@angular/router";
import { Signupcomponent } from "./components/signupcomponent/signupcomponent";
import { SuccessCreation } from "./components/success-creation/success-creation";
import { successCreationAccessGuard } from "./guards/success-creation-access.guard";

export const AuthRoutes: Routes = [
    {
        path: 'user',
        component: Signupcomponent
    },
    {
        path: 'success-creation',
        component: SuccessCreation,
        canActivate: [successCreationAccessGuard]
    },
]
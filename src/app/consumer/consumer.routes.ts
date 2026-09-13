import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { CreateEvent } from './components/create-event/create-event';
import { EventDetails } from './components/event-details/event-details';
import { ListEvents } from './components/list-events/list-events';
import { ConsumerLayout } from './components/consumer-layout/consumer-layout';
import { BrowseStudios } from './components/browse-studios/browse-studios';
import { ConsumerStudioDetails } from './components/consumer-studio-details/consumer-studio-details';

export const ConsumerRoutes: Routes = [
  {
    path: '',
    component: ConsumerLayout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'events/create',
        component: CreateEvent,
      },
      {
        path: 'events/:id',
        component: EventDetails,
      },
      {
        path: 'events/:id/studios',
        component: BrowseStudios,
      },
      {
        path: 'events/:eventId/studios/:studioId',
        component: ConsumerStudioDetails,
      },
      {
        path: 'events',
        component: ListEvents,
      },
    ],
  },
];

export interface EventDashboard{
    createdCount: number;
    activeCount: number;
    completedCount: number;
    eventDetails: EventDetails[];
}

export interface EventDetails{
    id: string;
    title: string;
    eventDate: Date;
    location: {latitude: number, longitude: number};
    duration: number;
    lastModifiedDate: Date;
}
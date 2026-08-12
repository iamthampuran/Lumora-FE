export interface EventDashboard{
    createdCount: number;
    activeCount: number;
    completedCount: number;
    eventDetails: EventDetails[];
}

export interface EventDetails{
    title: string;
    date: Date;
    location: {latitude: number, longitude: number};
    duration: number;
    lastModifiedDate: Date;
}
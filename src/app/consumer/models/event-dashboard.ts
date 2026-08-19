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
    locationName: string;
    duration: number;
    lastModifiedDate: Date;
    eventType: string;
    isPredefined: boolean;  
}
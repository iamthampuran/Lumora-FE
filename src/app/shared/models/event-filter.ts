export interface EventFilterPayload{
    eventTypes : string[] | null;
    fromDate : Date | null;
    toDate : Date | null;
    minBudget : number | null;
    maxBudget : number | null;
}
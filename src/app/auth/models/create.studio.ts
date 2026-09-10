export interface CreateStudio{
    userId: string;
    studioName: string;
    description: string | null;
    phoneNumber: string;
    website: string | null;
    locationName: string;
    serviceRadius: number;
    minPrice: number;
    maxPrice: number;
    latitude: number;
    longitude: number;
}
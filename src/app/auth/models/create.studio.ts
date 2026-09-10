export interface CreateStudio{
    userId: string;
    studioName: string;
    description: string | null;
    phoneNumber: string;
    website: string | null;
    locationName: string;
    serviceRadiusKm: number;
    minPrice: number;
    maxPrice: number;
    latitude: number;
    longitude: number;
}
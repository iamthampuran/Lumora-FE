export interface FindStudiosQueryResponse {
    studioId: string;
    name: string;
    rating: number;
    reviewCount: number;
    distanceKm: number;
    tags: string[];
    startingPrice: number;
    coverUrl: string;
}
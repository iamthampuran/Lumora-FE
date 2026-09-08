export interface StudioProfileModel{
    identity: StudioIdentityResponse;
    ratingStats: RatingStats;
    pricingDetails: PricingDetails;
    generalInformation: GeneralInformation;
    tags: TagDetails[];
    portfolioDetails: PortfolioDetails[];
    reviews: ReviewDetails[];
}

export interface StudioIdentityResponse {
    id: string;
    studioName: string;
    about?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
}

export interface RatingStats {
    averageRating: number;
    reviewCount: number;
    teamMembersCount: number;
    projectsCompleted: number;
}

export interface PricingDetails {
    minPrice: number;
    maxPrice: number;
}

export interface GeneralInformation {
    locationDetails: LocationDetails;
    phone: string;
    email: string;
}

export interface LocationDetails {
    city: string;
    latitude: number;
    longitude: number;
    serviceRadiusType: string;
    distance?: number | null;
}

export interface TagDetails {
    id: string;
    name: string;
}

export interface PortfolioDetails {
    id: string;
    imageUrl: string;
    title: string;
    displayOrder: number;
}

export interface ReviewDetails {
    id: string;
    reviewerName: string;
    rating: number;
    comment?: string | null;
    date: Date; // Serialized DateTime is typically an ISO 8601 string
}

export interface UpdateStudioTagsPayload{
    studioId: string;
    tagIds: string[];
    customTagDetails: string[];
}

export interface EmployeeDetail {
    name: string;
    phonenumber: string;
    email: string;
    role: string;
}

export interface AddTeamMembersPayload {
    studioId: string;
    employeeDetails: EmployeeDetail[];
}
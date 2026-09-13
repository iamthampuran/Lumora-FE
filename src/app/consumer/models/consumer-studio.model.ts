export interface ConsumerStudioDetailsResponse {
  identity: {
    id: string;
    studioName: string;
    about?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
  };
  ratingStats: {
    averageRating: number;
    reviewCount: number;
    teamMembersCount: number;
    projectsCompleted: number;
  };
  pricingDetails: {
    minPrice: number;
    maxPrice: number;
  };
  generalInformation: {
    locationDetails: {
      city: string;
      latitude: number;
      longitude: number;
      serviceRadiusType: string;
      distance?: number | null;
    };
    phone: string;
    email: string;
    websiteUrl?: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  portfolioDetails: Array<{
    id: string;
    imageUrl: string;
    title?: string | null;
    displayOrder: number;
  }>;
  reviews: Array<{
    id: string;
    reviewerName: string;
    rating: number;
    comment?: string | null;
    date: string;
  }>;
  isAvailableOnDate?: boolean | null;
}
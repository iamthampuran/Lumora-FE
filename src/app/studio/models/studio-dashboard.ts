export interface DashboardStats {
  totalInquiries: number;
  inquiriesGrowth: string;
  activeBookings: number;
  pendingApprovals: number;
  totalRevenue: number;
}

export interface RecentInquiry {
  id: string;
  clientName: string;
  initials: string;
  eventType: string;
  date: string;
  isNew: boolean;
}

export interface PendingGallery {
  id: string;
  title: string;
  coverUrl: string;
  photoCount: number;
  status: 'Waiting for Client' | 'Needs Selection' | string;
}

export interface DashboardReviewSummary {
  averageRating: number;
  totalReviews: number;
  recentReviewer: string;
  recentReviewerAvatar?: string | null;
  recentReviewDate: string;
  recentReviewText: string;
  recentReviewRating: number;
}

export interface StudioDashboardSummary {
  stats: DashboardStats;
  recentInquiries: RecentInquiry[];
  pendingGalleries: PendingGallery[];
  reviewsSummary: DashboardReviewSummary;
}
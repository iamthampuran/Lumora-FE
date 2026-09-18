import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { DashboardStats } from '../dashboard-stats/dashboard-stats';
import { DashboardInquiries } from '../dashboard-inquiries/dashboard-inquiries';
import { DashboardReviews } from '../dashboard-reviews/dashboard-reviews';
import { DashboardGalleries } from '../dashboard-galleries/dashboard-galleries';
import { StudioService } from '../../services/studio.service';
import { AuthService } from '../../../auth/services/auth.service';
import { DashboardReviewSummary, DashboardStats as StudioDashboardStats, StudioDashboardSummary } from '../../models/studio-dashboard';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-studio-dashboard',
  imports: [
    CommonModule, 
    LoaderComponent, 
    DashboardStats, 
    DashboardInquiries, 
    DashboardReviews, 
    DashboardGalleries],
  templateUrl: './studio-dashboard.html',
  styleUrl: './studio-dashboard.css',
})
export class StudioDashboard implements OnInit {
  private studioService = inject(StudioService);
  private authService = inject(AuthService);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  dashboardData = signal<StudioDashboardSummary | null>(null);

  studioName = signal<string>('Studio');

  private readonly emptyStats: StudioDashboardStats = {
    inquiriesCount: 0,
    inquiriesGrowth: '0%',
    activeBookings: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
  };

  private readonly emptyReviews: DashboardReviewSummary = {
    averageRating: 0,
    totalReviews: 0,
    recentReviewer: '',
    recentReviewerAvatar: null,
    recentReviewDate: '',
    recentReviewText: '',
    recentReviewRating: 0,
  };

  ngOnInit() {
    this.studioName.set(this.authService.getUserDetailsFromToken('unique_name') || 'Studio');
    this.fetchDashboard();
  }

  fetchDashboard() {
    const studioId = this.authService.getRoleScopedProfileId();
    if (!studioId) {
      this.isLoading.set(false);
      this.errorMessage.set('Studio profile not found. Please sign in again.');
      return;
    }

    this.isLoading.set(true);
    this.studioService.getDashboardSummary(studioId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.dashboardData.set(this.normalizeDashboardSummary(data)),
        error: () => this.errorMessage.set('Failed to load dashboard data. Please refresh.')
      });
  }

private normalizeDashboardSummary(data: any): StudioDashboardSummary {
    // Safely extract nested objects from the API response
    const statsData = data?.statsData || {};
    const ratingDetails = data?.ratingDetails || {};

    return {
      stats: {
        // Map backend stats keys to frontend interface
        inquiriesCount: statsData.inquiriesCount ?? this.emptyStats.inquiriesCount,
        inquiriesGrowth: statsData.percentageIncrease !== undefined ? `${statsData.percentageIncrease}%` : this.emptyStats.inquiriesGrowth,
        activeBookings: statsData.activeInquiriesCount ?? this.emptyStats.activeBookings,
        pendingApprovals: statsData.pendingInquiriesCount ?? this.emptyStats.pendingApprovals,
        totalRevenue: statsData.totalRevenueThisMonth ?? this.emptyStats.totalRevenue,
      },
      
      inquiryDetails: data?.inquiryDetails ?? [],
      
      // Map 'galleryDetails' from backend to 'pendingGalleries' on frontend
      pendingGalleries: data?.galleryDetails ?? [], 
      
      reviewsSummary: {
        ...this.emptyReviews,
        // Map 'ratingDetails' from backend to 'reviewsSummary' on frontend
        averageRating: ratingDetails.averageRating ?? this.emptyReviews.averageRating,
        totalReviews: ratingDetails.reviewCount ?? this.emptyReviews.totalReviews,
        
        // Note: You may need to map additional reviewerDetails fields here 
        // depending on what the backend populates when a review exists.
      },
    };
  }
}

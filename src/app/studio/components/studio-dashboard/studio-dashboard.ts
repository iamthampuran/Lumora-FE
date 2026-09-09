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
    totalInquiries: 0,
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

  private normalizeDashboardSummary(data: StudioDashboardSummary | null | undefined): StudioDashboardSummary {
    return {
      stats: {
        ...this.emptyStats,
        ...(data?.stats ?? {}),
      },
      recentInquiries: data?.recentInquiries ?? [],
      pendingGalleries: data?.pendingGalleries ?? [],
      reviewsSummary: {
        ...this.emptyReviews,
        ...(data?.reviewsSummary ?? {}),
      },
    };
  }
}

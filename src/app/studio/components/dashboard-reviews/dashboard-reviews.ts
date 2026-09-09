import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { DashboardReviewSummary } from '../../models/studio-dashboard';

@Component({
  selector: 'app-dashboard-reviews',
  imports: [CommonModule],
  templateUrl: './dashboard-reviews.html',
  styleUrl: './dashboard-reviews.css',
})
export class DashboardReviews {
  reviewData = input.required<DashboardReviewSummary>();
}

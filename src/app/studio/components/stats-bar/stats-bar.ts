import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stats-bar',
  imports: [],
  templateUrl: './stats-bar.html',
  styleUrl: './stats-bar.css',
})
export class StatsBar {
  @Input() statsBarDetails!: {
    ratingDetails: {
      averageRating: number;
      totalReviews: number;
    };
    completedEvents: number;
    memberCount: number;
    location: string;
  };

  stars = [0, 1, 2, 3, 4];

  getStarsFilled(startIndex: number): number {
    const rating = this.statsBarDetails.ratingDetails?.averageRating || 0;
    const fill = Math.max(0, Math.min(1, rating - startIndex));
    return fill*100;
  }
}

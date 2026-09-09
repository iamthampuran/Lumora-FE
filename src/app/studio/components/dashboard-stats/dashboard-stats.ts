import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import type { DashboardStats as StudioDashboardStats } from '../../models/studio-dashboard' ;


@Component({
  selector: 'app-dashboard-stats',
  imports: [CommonModule],
  templateUrl: './dashboard-stats.html',
  styleUrl: './dashboard-stats.css',
})
export class DashboardStats {
  stats = input.required<StudioDashboardStats>();
}

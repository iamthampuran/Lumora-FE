import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-stats-row',
  standalone: true,
  imports: [],
  templateUrl: './stats-row.html',
  styleUrl: './stats-row.css',
})
export class DashboardStatsRowComponent {
  readonly stats = input({ createdCount: 0, completedCount: 0, activeCount: 0 });
}

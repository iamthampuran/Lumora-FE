import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-stats-row',
  templateUrl: './stats-row.html',
  styleUrl: './stats-row.css',
})
export class DashboardStatsRow {
  readonly stats = input({ createdCount: 0, completedCount: 0, activeCount: 0 });
}

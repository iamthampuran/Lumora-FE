import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RecentInquiry } from '../../models/studio-dashboard';

@Component({
  selector: 'app-dashboard-inquiries',
  imports: [CommonModule],
  templateUrl: './dashboard-inquiries.html',
  styleUrl: './dashboard-inquiries.css',
})
export class DashboardInquiries {
  inquiries = input.required<RecentInquiry[]>();

  getInitials(name: string): string {
    if (!name) return '?';

    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }
}

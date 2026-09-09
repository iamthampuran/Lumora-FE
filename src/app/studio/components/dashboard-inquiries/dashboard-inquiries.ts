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
}

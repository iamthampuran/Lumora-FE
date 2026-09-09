import { Component, input } from '@angular/core';
import { PendingGallery } from '../../models/studio-dashboard';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-galleries',
  imports: [CommonModule],
  templateUrl: './dashboard-galleries.html',
  styleUrl: './dashboard-galleries.css',
})
export class DashboardGalleries {
  galleries = input.required<PendingGallery[]>();
}

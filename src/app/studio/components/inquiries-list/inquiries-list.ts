import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioService } from '../../services/studio.service';
import { AuthService } from '../../../auth/services/auth.service';
import { GetStudioInquiriesResponse, InquiryFilter } from '../../models/studio-inquiry';
import { finalize } from 'rxjs';
import { InquiryStatus } from '../../enums/inquiry-status';


@Component({
  selector: 'app-inquiries-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './inquiries-list.html',
  styleUrl: './inquiries-list.css',
})
export class InquiriesList {
  private studioService = inject(StudioService)
  private authService = inject(AuthService);

  activeTab = signal<InquiryStatus>(InquiryStatus.Submitted);
  isFilterOpen = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  
  inquiriesData = signal<GetStudioInquiriesResponse | null>(null);
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);
  activeFilters = signal<InquiryFilter | null>(null);
  inquiryTab = InquiryStatus;

  ngOnInit() {
    this.loadInquiries();
  }

  loadInquiries() {
    const studioId = this.authService.getRoleScopedProfileId();
    if (!studioId) return;

    this.isLoading.set(true);
    this.studioService.getStudioInquiries(
      this.activeTab(), 
      this.currentPage(), 
      this.pageSize(),
      this.activeFilters()
    )
    .pipe(finalize(() => this.isLoading.set(false)))
    .subscribe({
      next: (data) => this.inquiriesData.set(data),
      error: (err) => console.error('Error fetching inquiries', err)
    });
  }

  setTab(tab: InquiryStatus) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadInquiries();
  }

  toggleFilter() {
    this.isFilterOpen.update(v => !v);
  }

  clearFilters() {
    this.activeFilters.set(null);
    this.currentPage.set(1);
    this.isFilterOpen.set(false);
    this.loadInquiries();
  }

  setPage(page: number) {
    const totalPages = this.inquiriesData()?.inquiries.totalPages || 1;
    if (page >= 1 && page <= totalPages) {
      this.currentPage.set(page);
      this.loadInquiries();
      window.scrollTo(0, 0);
    }
  }

  getEventTypeClasses(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized.includes('wedding')) return 'bg-orange-50 text-[#CF6B4E]';
    if (normalized.includes('maternity')) return 'bg-pink-50 text-pink-600';
    if (normalized.includes('engagement')) return 'bg-orange-50 text-orange-600';
    if (normalized.includes('birthday')) return 'bg-purple-50 text-purple-600';
    if (normalized.includes('corporate')) return 'bg-teal-50 text-teal-600';
    if (normalized.includes('portrait')) return 'bg-indigo-50 text-indigo-600';
    return 'bg-blue-50 text-blue-600';
  }

  getRelativeTime(dateString: Date): string {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  }
}

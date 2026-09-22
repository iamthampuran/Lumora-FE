import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { StudioService } from '../../services/studio.service';
import { AuthService } from '../../../auth/services/auth.service';
import { GetStudioInquiriesResponse, InquiryFilter } from '../../models/studio-inquiry';
import { finalize } from 'rxjs';
import { InquiryStatus } from '../../enums/inquiry-status';
import { LookupService } from '../../../shared/services/lookup.service';
import { EventType } from '../../../shared/models/event-types';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inquiries-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inquiries-list.html',
  styleUrl: './inquiries-list.css',
})
export class InquiriesList implements OnInit {
  private studioService = inject(StudioService);
  private authService = inject(AuthService);
  private lookupService = inject(LookupService);
  private router = inject(Router);

  activeTab = signal<InquiryStatus>(InquiryStatus.Submitted);
  isFilterOpen = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  inquiriesData = signal<GetStudioInquiriesResponse | null>(null);
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);
  activeFilters = signal<InquiryFilter | null>(null);
  eventTypes = signal<EventType[]>([]);
  inquiryTab = InquiryStatus;

  // Filter Form Setup
  filterForm = new FormGroup({
    eventTypeIds: new FormControl<string[]>([]),
    startDate: new FormControl<string | null>(null),
    endDate: new FormControl<string | null>(null),
    location: new FormControl<string | null>(null),
    minAmount: new FormControl<number | null>(null),
    maxAmount: new FormControl<number | null>(null),
  });

  activeDatePreset = signal<'thisMonth' | 'nextMonth' | 'custom' | null>(null);

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

  // API is ONLY called when the panel is opened and hasn't been fetched yet
  toggleFilter() {
    this.isFilterOpen.update(v => !v);
    if (this.isFilterOpen() && this.eventTypes().length === 0) {
      this.fetchEventTypes();
    }
  }

  // Apply Filter Action
  applyFilters() {
    const raw = this.filterForm.getRawValue();
    this.activeFilters.set({
      eventTypes: raw.eventTypeIds && raw.eventTypeIds.length > 0 ? raw.eventTypeIds : undefined,
      fromDate: raw.startDate ? new Date(raw.startDate) : undefined,
      toDate: raw.endDate ? new Date(raw.endDate) : undefined,
      location: raw.location && raw.location.trim() !== '' ? raw.location.trim() : undefined,
      minAmount: raw.minAmount ?? undefined,
      maxAmount: raw.maxAmount ?? undefined
    });
    
    this.currentPage.set(1);
    this.isFilterOpen.set(false);
    this.loadInquiries();
  }

  // Clear Filter Action
  clearFilters() {
    this.filterForm.reset();
    this.filterForm.controls.eventTypeIds.setValue([]);
    this.activeDatePreset.set(null);
    this.activeFilters.set(null);
    this.currentPage.set(1);
    this.isFilterOpen.set(false);
    this.loadInquiries();
  }

  // Checkbox interactions
  toggleEventType(id: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentValues = this.filterForm.controls.eventTypeIds.value || [];
    if (isChecked) {
      this.filterForm.controls.eventTypeIds.setValue([...currentValues, id]);
    } else {
      this.filterForm.controls.eventTypeIds.setValue(currentValues.filter(val => val !== id));
    }
  }

  isEventTypeSelected(id: string): boolean {
    const currentValues = this.filterForm.controls.eventTypeIds.value || [];
    return currentValues.includes(id);
  }

  // Date Preset Logic
  setDatePreset(preset: 'thisMonth' | 'nextMonth' | 'custom') {
    this.activeDatePreset.set(preset);
    const today = new Date();
    
    if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      this.filterForm.patchValue({
        startDate: this.formatDateForInput(firstDay),
        endDate: this.formatDateForInput(lastDay)
      });
    } else if (preset === 'nextMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      this.filterForm.patchValue({
        startDate: this.formatDateForInput(firstDay),
        endDate: this.formatDateForInput(lastDay)
      });
    } else {
      this.filterForm.patchValue({ startDate: null, endDate: null });
    }
  }

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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

  fetchEventTypes() {
    this.lookupService.getEventTypes().subscribe({
      next: (eventTypes) => {
        this.eventTypes.set(eventTypes);
      },
      error: (err) => console.error('Error fetching event types', err)
    });
  }

  viewDetails(inquiryId: string){
    this.router.navigate([`/studio/inquiries/${inquiryId}`]);
  }
} 
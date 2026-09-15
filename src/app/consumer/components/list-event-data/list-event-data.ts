import { Component, computed, effect, ElementRef, HostListener, inject, input, signal, untracked } from '@angular/core';
import { EventStatus } from '../../enums/event.status.enum';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ConsumerService } from '../../services/consumer.service';
import { EventDetails } from '../../models/event-dashboard';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { EventFilterPayload } from '../../../shared/models/event-filter';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-list-event-data',
  imports: [LoaderComponent],
  templateUrl: './list-event-data.html',
  styleUrl: './list-event-data.css',
})
export class ListEventData {
  tabStatus = input.required<EventStatus>();
  searchQuery = input<string | null>();
  activeFilters = input<EventFilterPayload | null>();

  consumerId = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  // Pagination Signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalItems = signal<number>(0);

  eventsData = signal<EventDetails[]>([]);

  consumerService = inject(ConsumerService);
  authService = inject(AuthService);
  router = inject(Router);
  private eRef = inject(ElementRef);
  openMenuId = signal<string | null>(null);
  private snackBar = inject(MatSnackBar); // <-- Add this inject

  protected readonly Math = Math;

  eventToDelete = signal<{ id: string, title: string } | null>(null);
  isDeleting = signal<boolean>(false);

  constructor() {
    this.consumerId.set(this.authService.getRoleScopedProfileId());

    // Automatically fetch data whenever tabStatus or searchQuery changes
    effect(() => {
      const status = this.tabStatus();
      const query = this.searchQuery();
      const filters = this.activeFilters();

      // Untracked prevents currentPage changes from re-triggering this effect
      untracked(() => {
        this.currentPage.set(1);
        this.getEvents(status, query, filters);
      });
    });
  }

  mappedEvents = computed(() => {
    return this.eventsData().map(event => {
      const fullLocation = event.locationName || 'Location not specified';
      const truncatedLocation = fullLocation.length > 20 
        ? fullLocation.substring(0, 20) + '...' 
        : fullLocation;

      return {
        id: event.id,
        title: event.title,
        eventType: event.eventType || 'Custom',
        iconType: this.getIconType(event.eventType, event.isPredefined),
        dateLabel: this.formatDate(event.eventDate),
        locationLabel: truncatedLocation,
        fullLocationLabel: fullLocation,
        durationLabel: this.formatDuration(event.duration)
      };
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.openMenuId.set(null);
    }
  }

  toggleMenu(event: Event, eventId: string) {
    event.stopPropagation();
    this.openMenuId.update(id => id === eventId ? null : eventId);
  }

  editEvent(event: Event, eventId: string) {
    event.stopPropagation();
    this.openMenuId.set(null);
    this.router.navigate(['/consumer/events', eventId, 'edit']);
  }

  deleteEvent(event: Event, eventId: string) {
    event.stopPropagation();
    this.openMenuId.set(null);
    console.log('Delete event not yet implemented for:', eventId);
  }

  promptDeleteEvent(event: Event, eventId: string, eventTitle: string) {
    event.stopPropagation();
    this.openMenuId.set(null);
    this.eventToDelete.set({ id: eventId, title: eventTitle });
  }

  // <-- NEW: Close Modal
  cancelDelete() {
    this.eventToDelete.set(null);
  }

  // <-- NEW: Confirm Delete & Call API
  confirmDelete() {
    const target = this.eventToDelete();
    if (!target) return;

    this.isDeleting.set(true);
    this.consumerService.deleteEvent(target.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open(`Event deleted successfully`, 'Close', { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top' });
          this.eventToDelete.set(null);
          // Refresh the current page of data
          this.getEvents(this.tabStatus(), this.searchQuery(), this.activeFilters() ?? null);
        },
        error: (err) => {
          console.error('Failed to delete event:', err);
          this.snackBar.open('Failed to delete event. Please try again.', 'Close', { duration: 4000, horizontalPosition: 'right', verticalPosition: 'top' });
          this.eventToDelete.set(null);
        }
      });
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.getEvents(this.tabStatus(), this.searchQuery(), this.activeFilters() ?? null);
      window.scrollTo(0, 0); 
    }
  }

  changePageSize(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.currentPage.set(1); 
    this.getEvents(this.tabStatus(), this.searchQuery(), this.activeFilters() ?? null);
  }

  getEvents(status: EventStatus, query: string | null = null, filters: EventFilterPayload | null = null) {
    if (!this.consumerId()) return;
    
    this.isLoading.set(true);
    console.log('Fetching events with filters:', filters); // Debugging line
    this.consumerService.getConsumerEventDetails(
      this.consumerId()!,
      status,
      this.currentPage(),
      this.pageSize(),
      query || '',
      filters
    ).pipe(finalize(() => this.isLoading.set(false)))
    .subscribe({
      next: (data) => {
        this.eventsData.set(data.eventDetails?.data || []);
        this.totalItems.set(data.eventDetails?.pageCount || 0);

        if (status === EventStatus.Created) {
          this.totalItems.set(data.createdCount || 0);
        } else if (status === EventStatus.InProgress) {
          this.totalItems.set(data.activeCount || 0);
        } else if (status === EventStatus.Complete) {
          this.totalItems.set(data.completedCount || 0);
        }
      },
      error: (error) => {
        console.error('Error fetching events:', error);
        this.eventsData.set([]);
        this.totalItems.set(0);
      }
    });
  }

  viewEventDetails(eventId: string) {
    this.router.navigate(['/consumer/events', eventId]);
  }

  private getIconType(eventType: string, isPredefined: boolean): string {
    if (!isPredefined || !eventType) return 'default';
    const type = eventType.trim().toLowerCase();
    switch (type) {
      case 'wedding': return 'wedding';
      case 'birthday': return 'birthday';
      case 'corporate': return 'corporate';
      case 'engagement': return 'engagement';
      case 'anniversary': return 'anniversary';
      case 'pre-wedding': return 'prewedding';
      case 'graduation': return 'graduation';
      case 'haldi': return 'haldi';
      case 'housewarming': return 'housewarming';
      case 'maternity shoot': return 'maternity';
      case 'reception': return 'reception';
      case 'baby shower': return 'babyshower';
      default: return 'default';
    }
  }

  private formatDate(date: Date | string): string {
    if (!date) return '-';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  private formatDuration(duration: number): string {
    if (!duration) return '-';
    if (duration >= 8) return 'Full Day';
    if (duration === 4) return 'Half Day';
    return `${duration} Hours`;
  }
}

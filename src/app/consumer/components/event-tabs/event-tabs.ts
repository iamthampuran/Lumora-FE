import { Component, computed, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { EventStatus } from '../../enums/event.status.enum';
import { EventDetails } from '../../models/event-dashboard';
import { Router } from '@angular/router';
import { ConsumerService } from '../../services/consumer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-event-tabs',
  imports: [],
  templateUrl: './event-tabs.html',
  styleUrl: './event-tabs.css',
})
export class EventTabs {
  readonly activeTab = signal<EventStatus>(EventStatus.Created);
  readonly eventStatus = EventStatus;
  readonly actualEvents = input<EventDetails[]>([]);
  readonly statusChanged = output<EventStatus>();

  private router = inject(Router);
  private eRef = inject(ElementRef); // <-- Added for click-outside detection
  private consumerService = inject(ConsumerService);
  private snackBar = inject(MatSnackBar);

  // <-- NEW: State for dropdown menu
  openMenuId = signal<string | null>(null)
  eventToDelete = signal<{ id: string, title: string } | null>(null);
  isDeleting = signal<boolean>(false);

  promptDeleteEvent(event: Event, eventId: string, eventTitle: string) {
    event.stopPropagation();
    this.openMenuId.set(null);
    this.eventToDelete.set({ id: eventId, title: eventTitle });
  }

  cancelDelete() {
    this.eventToDelete.set(null);
  }

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
          // The cleanest way to refresh the dashboard is to re-emit the active tab
          this.statusChanged.emit(this.activeTab());
        },
        error: (err) => {
          console.error('Failed to delete event:', err);
          this.snackBar.open('Failed to delete event. Please try again.', 'Close', { duration: 4000, horizontalPosition: 'right', verticalPosition: 'top' });
          this.eventToDelete.set(null);
        }
      });
  }

 readonly mappedEvents = computed(() => {
    return this.actualEvents().slice(0, 3).map((event) => {
      const fullLocation = event.locationName || '-';
      const truncatedLocation = fullLocation.length > 20 
        ? fullLocation.substring(0, 20) + '...' 
        : fullLocation;

      return {
        id: event.id,
        title: event.title,
        dateLabel: this.formatDate(event.eventDate),
        locationLabel: truncatedLocation,
        fullLocationLabel: fullLocation,
        durationLabel: this.formatDuration(event.duration),
        updatedLabel: this.formatLastUpdated(event.lastModifiedDate),
      };
    });
  });

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
    // TODO: Connect this to the ConsumerService to actually delete
    console.log('Delete event clicked for:', eventId);
  }

  setActiveTab(tab: EventStatus): void {
    this.activeTab.set(tab);
    this.statusChanged.emit(tab);
  }

  isCreatedTab(): boolean {
    return this.activeTab() === EventStatus.Created;
  }

  isActiveTab(): boolean {
    return this.activeTab() === EventStatus.InProgress;
  }

  isCompletedTab(): boolean {
    return this.activeTab() === EventStatus.Complete;
  }

  getHeaderText(): string {
    if (this.isCreatedTab()) return "Events you're planning. Keep going!";
    if (this.isActiveTab()) return 'Events in progress. Track and manage your ongoing events.';
    return "Events you've successfully completed.";
  }

  getStatusLabel(): string {
    if (this.isCreatedTab()) return 'Created';
    if (this.isActiveTab()) return 'Active';
    return 'Completed';
  }

  getPrimaryActionLabel(): string {
    if (this.isCreatedTab()) return 'Continue Planning';
    if (this.isActiveTab()) return 'View Details';
    return 'View Summary';
  }

  getStatusBadgeClasses(): string {
    if (this.isCreatedTab()) return 'bg-orange-50 text-orange-700';
    if (this.isActiveTab()) return 'bg-green-50 text-green-700';
    return 'bg-purple-50 text-purple-700';
  }

  getPrimaryButtonClasses(): string {
    if (this.isCompletedTab()) {
      return 'border-purple-500 text-purple-600 hover:bg-purple-50';
    }

    return 'border-[#CF6B4E] text-[#CF6B4E] hover:bg-orange-50';
  }

  private formatDate(date: string | Date): string {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatDuration(duration: number): string {
    if (duration >= 8) return 'Full Day';
    if (duration === 4) return 'Half Day';
    return `${duration} Hours`;
  }

  private formatLastUpdated(lastModifiedDate: string | Date): string {
    const parsed = new Date(lastModifiedDate);
    if (isNaN(parsed.getTime())) return '-';

    const now = Date.now();
    const diffMs = Math.max(0, now - parsed.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;

    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1 week ago';
    return `${weeks} weeks ago`;
  }

  goToDetailsPage(eventId: string): void {
    console.log("eventId", eventId);
    this.router.navigate(['/consumer/events', eventId]);
  }
}

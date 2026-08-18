import { Component, computed, inject, input, output, signal } from '@angular/core';
import { EventStatus } from '../../enums/event.status.enum';
import { EventDetails } from '../../models/event-dashboard';
import { Router } from '@angular/router';

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

  readonly mappedEvents = computed(() => {
    return this.actualEvents().slice(0, 3).map((event) => ({
      id: event.id,
      title: event.title,
      dateLabel: this.formatDate(event.eventDate),
      locationLabel: this.formatLocation(event.location),
      durationLabel: this.formatDuration(event.duration),
      updatedLabel: this.formatLastUpdated(event.lastModifiedDate),
    }));
  });

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

  private formatLocation(location: EventDetails['location']): string {
    if (!location) return '-';
    if (typeof location === 'string') return location;
    return `${location.latitude}, ${location.longitude}`;
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

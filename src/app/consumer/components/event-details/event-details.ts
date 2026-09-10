import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { EventData } from '../../models/event-data';
import { ConsumerService } from '../../services/consumer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader';

@Component({
  selector: 'app-event-details',
  imports: [LoaderComponent],
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetails implements OnInit {
  eventData = signal<EventData | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  consumerService = inject(ConsumerService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  readonly eventInfo = computed(() => this.eventData()?.eventInformationDetails ?? null);
  readonly inquiryDetails = computed(() => this.eventData()?.inquiryDetails ?? []);
  readonly activeInquiriesCount = computed(() => this.inquiryDetails().length);

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.getEventDetails(eventId);
    } else {
      this.isLoading.set(false);
      this.errorMessage.set('Event ID was not found in the URL.');
      console.error('Event ID not found in route parameters.');
    }
  }

  getEventDetails(eventId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.consumerService.getEventDetails(eventId)
    .pipe(finalize(() => this.isLoading.set(false)))
    .subscribe({
      next: (data) => {
        this.eventData.set(data);

        if (!data?.eventInformationDetails) {
          this.errorMessage.set('Event details are unavailable for this event.');
        }
      },
      error: (error) => {
        this.errorMessage.set('Unable to load event details right now. Please try again.');
        console.error('Error fetching event details:', error);
      },
    });
  }


  formatEventDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatDuration(duration: number | null | undefined): string {
    if (duration == null) return '-';
    if (duration === 1) return '1 Hour';
    return `${duration} Hours`;
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return '-';
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }

  getEventStatusLabel(): string {
    const hasAccepted = this.inquiryDetails().some((item) => item.inquiryStatus === 'accepted');
    if (hasAccepted) return 'Accepted';
    return 'Searching';
  }

  getInquiryAgeLabel(date: Date | string): string {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'Updated recently';

    const diffMs = Math.max(0, Date.now() - parsed.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Responded today';
    if (days === 1) return 'Responded 1 day ago';
    return `Responded ${days} days ago`;
  }

  getInquiryBadgeClass(status: string): string {
    return status === 'accepted'
      ? 'bg-green-50 text-[#2a5940] border border-green-100'
      : 'bg-orange-100/50 text-[#CF6B4E] border border-orange-100';
  }

  getInquiryBadgeLabel(status: string): string {
    return status === 'accepted' ? 'Accepted' : 'Pending Response';
  }

  getInquiryCardClass(status: string): string {
    return status === 'accepted'
      ? 'bg-white border border-gray-200 border-l-[3px] border-l-[#2a5940]'
      : 'bg-[#FAF8F5] border border-transparent';
  }

  getInquiryLogoClass(status: string): string {
    return status === 'accepted' ? 'bg-gray-900 text-white' : 'bg-[#ECE5DA] text-gray-600';
  }

  browseStudios() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.router.navigate(['/consumer/events', eventId, 'studios']);
    }
  }

}

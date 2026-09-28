import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { EventData } from '../../models/event-data';
import { ConsumerService } from '../../services/consumer.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { CommonModule } from '@angular/common';
import { EventStatus } from '../../enums/event.status.enum';
import { PaymentModal } from '../payment-modal/payment-modal';

@Component({
  selector: 'app-event-details',
  imports: [LoaderComponent, CommonModule, RouterModule, PaymentModal],
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
  eventStatusEnum = EventStatus;

  readonly eventInfo = computed(() => this.eventData()?.eventInformationDetails ?? null);
  readonly inquiryDetails = computed(() => this.eventData()?.inquiryDetails ?? []);
  readonly activeInquiriesCount = computed(() => this.inquiryDetails().length);

  isPaymentModalOpen = signal<boolean>(false);
  selectedInquiryId = signal<string>('');

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.getEventDetails(eventId);
    } else {
      this.isLoading.set(false);
      this.errorMessage.set('Event ID was not found in the URL.');
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

  // --- Helpers for Formatting ---

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

  // Resolves the issue where tags come back as a Record<string, string> dictionary
  getTagsArray(tags: any): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'object') return Object.values(tags);
    return [];
  }

  // --- Inquiry Formatting (Matches Canva Exactly) ---

getEventStatusLabel(): string {
    const statuses = this.inquiryDetails().map(item => item.inquiryStatus?.toLowerCase());
    if (statuses.includes('confirmed')) return 'Confirmed';
    if (statuses.includes('accepted')) return 'Accepted';
    return 'Searching';
  }


  getInquiryAgeLabel(date: Date | string, status: string): string {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'Updated recently';
    const diffMs = Math.max(0, Date.now() - parsed.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const lowerStatus = status?.toLowerCase();
    let action = 'Sent';
    if (lowerStatus === 'accepted') action = 'Responded';
    if (lowerStatus === 'confirmed') action = 'Confirmed';

    if (days === 0) return `${action} today`;
    if (days === 1) return `${action} 1 day ago`;
    return `${action} ${days} days ago`;
  }

  // --- Navigation Actions ---

  editEvent() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.router.navigate(['/consumer/events', eventId, 'edit']);
    }
  }

  browseStudios() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.router.navigate(['/consumer/events', eventId, 'studios']);
    }
  }

  openPaymentModal(inquiryId: string): void {
    this.selectedInquiryId.set(inquiryId);
    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    this.isPaymentModalOpen.set(false);
  }

onPaymentSuccess(): void {
    // Refresh the event details to reflect the new "Paid" status
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // NOTE: Calling the existing getEventDetails function
      this.getEventDetails(id);
    }
  }
}
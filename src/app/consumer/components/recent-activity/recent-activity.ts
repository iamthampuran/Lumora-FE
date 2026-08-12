import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ConsumerService } from '../../services/consumer.service';
import { InquiryWidget } from '../../models/inquiry-widget';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-consumer-recent-activity',
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.css',
})
export class ConsumerRecentActivity implements OnInit {

  readonly consumerService = inject(ConsumerService);
  readonly authService = inject(AuthService);

  readonly inquiryDetails = signal<InquiryWidget[]>([]);
  readonly inquiryCards = computed(() =>
    this.inquiryDetails().map((item) => ({
      ...item,
      eventDateLabel: this.formatDate(item.eventDate),
      modifiedLabel: this.formatRelativeTime(item.lastModifiedAt),
    }))
  );
  readonly hasInquiries = computed(() => this.inquiryCards().length > 0);

  ngOnInit(): void {
    this.getInquiryDetails();
  }

  getInquiryDetails() {
    const consumerId = this.authService.getRoleScopedProfileId();
    if (!consumerId) {
      this.inquiryDetails.set([]);
      return;
    }

    this.consumerService.getInquiryWidgetDetails(consumerId).subscribe({
      next: (response) => {
        console.log('Inquiry Details:', response);
        this.inquiryDetails.set(response); // Store the fetched data in the component property
      },
      error: (error) => {
        console.error('Error fetching inquiry details:', error);
        this.inquiryDetails.set([]);
      }
    });
  }

  private formatDate(date: Date | string): string {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatRelativeTime(date: Date | string): string {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';

    const diffMs = Math.max(0, Date.now() - parsed.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }
}

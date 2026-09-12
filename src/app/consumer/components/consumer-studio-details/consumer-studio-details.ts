import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ConsumerService } from '../../services/consumer.service';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsumerStudioDetailsResponse } from '../../models/consumer-studio.model';
import { finalize } from 'rxjs';
import { SendInquiryModal } from '../send-inquiry-modal/send-inquiry-modal';
import { EventData } from '../../models/event-data';

@Component({
  selector: 'app-consumer-studio-details',
  imports: [CommonModule, LoaderComponent, SendInquiryModal],
  templateUrl: './consumer-studio-details.html',
  styleUrl: './consumer-studio-details.css',
})
export class ConsumerStudioDetails implements OnInit {
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consumerService = inject(ConsumerService);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  
  studioData = signal<ConsumerStudioDetailsResponse | null>(null);
  eventId = signal<string | null>(null);
  isModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    const studioId = this.route.snapshot.paramMap.get('studioId');
    const eventId = this.route.snapshot.paramMap.get('eventId');

    if (studioId && eventId) {
      this.eventId.set(eventId);
      this.fetchStudioDetails(studioId, eventId);
    } else {
      this.errorMessage.set('Invalid link. Missing studio or event information.');
      this.isLoading.set(false);
    }
  }

  fetchStudioDetails(studioId: string, eventId: string) {
    this.isLoading.set(true);
    this.consumerService.getStudioDetailsForEvent(studioId, eventId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.studioData.set(data),
        error: (err) => {
          console.error('Failed to load studio details', err);
          this.errorMessage.set('Could not load studio details at this time.');
        }
      });
  }

  goBack() {
    if (this.eventId()) {
      this.router.navigate(['/consumer/events', this.eventId(), 'studios']);
    } else {
      this.router.navigate(['/consumer/dashboard']);
    }
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  openInquiryModal() {
    this.isModalOpen.set(true);
  }

  closeInquiryModal() {
    this.isModalOpen.set(false);
  }

  handleInquirySubmission(payload: { message: string, proposedAmount: number | null }) {
    console.log('Submitting inquiry payload:', payload);
    // TODO: Finalize with ConsumerService API call
  }
} 

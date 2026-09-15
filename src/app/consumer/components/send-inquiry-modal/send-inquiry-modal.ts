import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { EventData } from '../../models/event-data';
import { ConsumerService } from '../../services/consumer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../auth/services/auth.service';
import { CreateInquiryPayload } from '../../models/create-inquiry';

@Component({
  selector: 'app-send-inquiry-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './send-inquiry-modal.html',
  styleUrl: './send-inquiry-modal.css',
})
export class SendInquiryModal {
  private consumerService = inject(ConsumerService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Modal Inputs
  isModalOpen = input.required<boolean>();
  eventId = input.required<string>();
  studioId = input.required<string>();
  studioName = input<string>('Lumina Lens Studios');
  studioLogo = input<string | null>(null);
  studioLocation = input<string>('Kochi, Kerala');

  // Outputs
  closeModal = output<void>();
  inquirySubmitted = output<void>();

  // State
  messageText = signal<string|null>(null);
  proposedAmount = signal<number | null>(null);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  eventData = signal<EventData | null>(null);
  isLoadingEvent = signal<boolean>(true);

  // Computed Properties
  eventType = computed(() => this.eventData()?.eventInformationDetails?.category || '-');
  eventDate = computed(() => {
    const dateStr = this.eventData()?.eventInformationDetails?.eventDate;
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });
  eventLocation = computed(() => this.eventData()?.eventInformationDetails?.location?.locationName || '-');

  ngOnInit() {
    this.fetchEventData();
  }

  fetchEventData() {
    this.isLoadingEvent.set(true);
    this.consumerService
      .getEventDetails(this.eventId())
      .pipe(finalize(() => this.isLoadingEvent.set(false)))
      .subscribe({
        next: (data) => this.eventData.set(data),
        error: (err) => console.error('Failed to load event details in modal', err),
      });
  }

  onCancel() {
    this.closeModal.emit();
  }

  onSend() {
    const consumerId = this.authService.getRoleScopedProfileId();
    if (!consumerId) {
      this.errorMessage.set('Consumer session expired. Please sign in again.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: CreateInquiryPayload = {
      eventId: this.eventId(),
      studioId: this.studioId(),
      consumerId: consumerId,
      message: this.messageText() ?? null ? this.messageText()!.trim() : null,
      quotedAmount: this.proposedAmount(),
    };

    this.consumerService
      .createInquiry(consumerId, payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Inquiry sent to studio successfully!', 'Close', {
            duration: 3500,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this.inquirySubmitted.emit();
        },
        error: (err) => {
          console.error('Failed to send inquiry:', err);
          const apiMsg = err?.error?.message;
          this.errorMessage.set(typeof apiMsg === 'string' ? apiMsg : 'Failed to send inquiry. Please try again.');
        },
      });
  }
}

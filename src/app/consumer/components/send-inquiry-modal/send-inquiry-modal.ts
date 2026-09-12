import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { EventData } from '../../models/event-data';
import { ConsumerService } from '../../services/consumer.service';

@Component({
  selector: 'app-send-inquiry-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './send-inquiry-modal.html',
  styleUrl: './send-inquiry-modal.css',
})
export class SendInquiryModal {
  private consumerService = inject(ConsumerService);

  // Modal State
  isModalOpen = input.required<boolean>();
  eventId = input.required<string>(); // <-- Receive the event ID

  // Dynamic Studio Data (Passed from parent, as it's already loaded)
  studioName = input<string>('Lumina Lens Studios');
  studioLogo = input<string | null>(null);
  studioLocation = input<string>('Kochi, Kerala');

  // Outputs
  closeModal = output<void>();
  submitInquiry = output<{ message: string, proposedAmount: number | null }>();

  // Form State
  messageText = signal<string>('');
  proposedAmount = signal<number | null>(null);
  isSubmitting = signal<boolean>(false);

  // Event Data State
  eventData = signal<EventData | null>(null);
  isLoadingEvent = signal<boolean>(true);

  // Computed Event Properties
  eventType = computed(() => this.eventData()?.eventInformationDetails.category || '-');
  
  eventDate = computed(() => {
    const dateStr = this.eventData()?.eventInformationDetails.eventDate;
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });
  
  eventLocation = computed(() => this.eventData()?.eventInformationDetails.location.locationName || '-');

  ngOnInit() {
    this.fetchEventData();
  }

  fetchEventData() {
    this.isLoadingEvent.set(true);
    this.consumerService.getEventDetails(this.eventId())
      .pipe(finalize(() => this.isLoadingEvent.set(false)))
      .subscribe({
        next: (data) => this.eventData.set(data),
        error: (err) => console.error('Failed to load event details in modal', err)
      });
  }

  onCancel() {
    this.closeModal.emit();
  }

  onSend() {
    this.isSubmitting.set(true);
    this.submitInquiry.emit({
      message: this.messageText(),
      proposedAmount: this.proposedAmount()
    });
    
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.closeModal.emit();
    }, 800);
  }
}

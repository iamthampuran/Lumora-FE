import { CommonModule } from '@angular/common';
import { Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../services/payment.service';
import { PaymentDetails } from '../../models/payment-details';

@Component({
  selector: 'app-payment-modal',
  imports: [CommonModule, LoaderComponent],
  templateUrl: './payment-modal.html',
  styleUrl: './payment-modal.css',
})
export class PaymentModal implements OnInit, OnDestroy {
  inquiryId = input.required<string>();
  close = output<void>();
  paymentSuccess = output<void>();

  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);
  private subs = new Subscription();

  // FIX: Properly typed to PaymentDetails to resolve HTML errors
  paymentData = signal<PaymentDetails | null>(null);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  paymentStatus = signal<'pending' | 'success' | 'failed'>('pending');

  // Timer State
  timeLeft = signal<number>(300); // 5 minutes in seconds
  private timerInterval: any;

  ngOnInit(): void {
    this.loadPaymentDetails();
    this.setupSignalR();
    this.startTimer();
  }

  loadPaymentDetails(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.subs.add(
      this.paymentService.initiatePayment(this.inquiryId()).subscribe({
        next: (res) => {
          this.paymentData.set(res);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err.error?.message || 'Failed to generate secure payment link.');
          this.isLoading.set(false);
          this.stopTimer();
        },
      }),
    );
  }

  setupSignalR(): void {
    this.paymentService.startSignalRConnection(this.inquiryId());

    this.subs.add(
      this.paymentService.paymentConfirmed$.subscribe(() => {
        this.paymentStatus.set('success');
        this.stopTimer();
      }),
    );

    this.subs.add(
      this.paymentService.paymentFailed$.subscribe((data: any) => {
        this.paymentStatus.set('failed');
        this.errorMessage.set(data?.reason || 'Payment was declined by your bank.');
        this.stopTimer();
      }),
    );
  }

  // --- Timer Logic ---
  startTimer(): void {
    this.timeLeft.set(300);
    this.timerInterval = setInterval(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.update((t) => t - 1);
      } else {
        this.handleTimeout();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  handleTimeout(): void {
    this.stopTimer();
    this.paymentStatus.set('failed');
    this.errorMessage.set('Payment session expired. Please try again.');
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.timeLeft() / 60);
    const seconds = this.timeLeft() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // --- Actions ---
  copyUpi(upiId: string): void {
    navigator.clipboard.writeText(upiId);
    this.snackBar.open('UPI ID copied to clipboard!', 'Close', {
      duration: 2000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  retryPayment(): void {
    this.paymentStatus.set('pending');
    this.loadPaymentDetails();
    this.startTimer();
  }

  onCancel(): void {
    this.close.emit();
  }

  onSuccessClose(): void {
    this.paymentSuccess.emit();
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.subs.unsubscribe();
    this.paymentService.stopSignalRConnection(this.inquiryId());
  }
}

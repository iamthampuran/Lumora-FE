import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioService } from '../../services/studio.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-update-payment',
  imports: [CommonModule, FormsModule],
  templateUrl: './update-payment.html',
  styleUrl: './update-payment.css',
})
export class UpdatePayment {
  private studioService = inject(StudioService);
  private snackBar = inject(MatSnackBar);

  // Standardized Selective Modal Pattern
  isModal = input<boolean>(false);
  close = output<void>();
  updated = output<void>();

  // State
  activeTab = signal<'upi' | 'qr'>('upi');
  upiId = signal<string>('');
  qrCodeFile = signal<File | null>(null);
  qrCodePreview = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  setTab(tab: 'upi' | 'qr') {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.qrCodeFile.set(file);
      
      const reader = new FileReader();
      reader.onload = () => this.qrCodePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  removeFile() {
    this.qrCodeFile.set(null);
    this.qrCodePreview.set(null);
  }

  onCancel() {
    this.close.emit();
  }

  onSave() {
    const currentTab = this.activeTab();
    const currentUpi = this.upiId().trim();
    const currentFile = this.qrCodeFile();

    if (currentTab === 'upi' && !currentUpi) {
      this.errorMessage.set('Please enter a valid UPI ID.');
      return;
    }

    if (currentTab === 'qr' && !currentFile) {
      this.errorMessage.set('Please upload a valid QR Code image.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payloadUpiId = currentTab === 'upi' ? currentUpi : null;
    const payloadFile = currentTab === 'qr' ? currentFile : null;

    this.studioService.updatePaymentInformation(payloadUpiId, payloadFile)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Payment method saved successfully!', 'Close', {
            duration: 3500,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this.updated.emit();
          this.close.emit();
        },
        error: (err) => {
          // Handle Angular's JSON parse error on empty 200/204 OK responses
          if (err.status === 200 || err.status === 204) {
            this.updated.emit();
            this.close.emit();
            return;
          }
          console.error('Failed to save payment method:', err);
          this.errorMessage.set('Failed to save payment method. Please try again.');
        },
      });
  }
}
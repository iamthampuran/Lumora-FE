import { Component, ElementRef, inject, input, output, QueryList, signal, ViewChildren } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-two-factor-wizard',
  imports: [CommonModule, FormsModule],
  templateUrl: './two-factor-wizard.html',
  styleUrl: './two-factor-wizard.css',
})
export class TwoFactorWizard {
  isModalOpen = input.required<boolean>();
  closeModal = output<void>();
  setupComplete = output<void>();

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  step = signal<number>(1);
  
  // Step 1 State
  password = signal<string>('');
  showPassword = signal<boolean>(false);
  
  // Step 2 State
  qrCodeUri = signal<string | null>(null);
  secret = signal<string | null>(null);
  
  // Step 3 State
  otpDigits = signal<string[]>(['', '', '', '', '', '']);
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Step 4 State
  recoveryCodes = signal<string[]>([]);
  savedCodes = signal<boolean>(false);

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Expose Math for template
  Math = Math;

  nextStep() {
    if (this.step() === 1) {
      this.initiateSetup();
    } else if (this.step() === 3) {
      this.verifyAndEnable();
    } else if (this.step() === 4) {
      this.setupComplete.emit();
      this.closeModal.emit();
    } else {
      this.step.update(s => Math.min(s + 1, 4));
    }
  }

  prevStep() {
    this.errorMessage.set(null);
    this.step.update(s => Math.max(s - 1, 1));
  }

  initiateSetup() {
    if (!this.password()) return;
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.initiate2Fa(this.password())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          this.secret.set(res.secret);
          this.qrCodeUri.set(res.qrCodeUri);
          this.step.set(2);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Invalid password or request failed.');
        }
      });
  }

  verifyAndEnable() {
    const code = this.otpDigits().join('');
    if (code.length !== 6 || !this.secret()) return;
    
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.verifyAndEnable2Fa(this.secret()!, code)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (codes) => {
          this.recoveryCodes.set(codes);
          this.step.set(4);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Invalid code. Please try again.');
          this.otpDigits.set(['', '', '', '', '', '']);
          this.otpInputs.first.nativeElement.focus();
        }
      });
  }

  // Auto-advance OTP logic
  onOtpInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    
    const newDigits = [...this.otpDigits()];
    newDigits[index] = value;
    this.otpDigits.set(newDigits);

    if (value && index < 5) {
      this.otpInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onOtpKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      this.otpInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onCancel() {
    this.closeModal.emit();
  }

  copyCodes() {
    navigator.clipboard.writeText(this.recoveryCodes().join('\n'));
    this.snackBar.open('Codes copied to clipboard!', 'Close', { duration: 2000 });
  }

  downloadCodes() {
    const blob = new Blob([this.recoveryCodes().join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lumora-recovery-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

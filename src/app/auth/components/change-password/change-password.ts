import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-change-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  passwordForm: FormGroup = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordsMatchValidator },
  );
  isSubmitting = signal<boolean>(false);

  // Visibility toggles
  showCurrent = signal<boolean>(false);
  showNew = signal<boolean>(false);
  showConfirm = signal<boolean>(false);

  // Modern Angular: Track form values as signals to reactively update the checklist
  private formValues = toSignal(this.passwordForm.valueChanges);

  newPwd = computed(() => this.formValues()?.newPassword || '');

  // Password Checklist Criteria
  hasLength = computed(() => this.newPwd().length >= 8);
  hasNumber = computed(() => /\d/.test(this.newPwd()));
  hasUpper = computed(() => /[A-Z]/.test(this.newPwd()));
  hasSpecial = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(this.newPwd()));

  isChecklistValid = computed(
    () => this.hasLength() && this.hasNumber() && this.hasUpper() && this.hasSpecial(),
  );

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPwd = control.get('newPassword')?.value;
    const confirmPwd = control.get('confirmPassword')?.value;
    if (newPwd && confirmPwd && newPwd !== confirmPwd) {
      return { mismatch: true };
    }
    return null;
  }

  isInvalid(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  hasMismatchError(): boolean {
    const control = this.passwordForm.get('confirmPassword');
    return !!(this.passwordForm.errors?.['mismatch'] && (control?.dirty || control?.touched));
  }

  toggleVisibility(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') this.showCurrent.update((v) => !v);
    if (field === 'new') this.showNew.update((v) => !v);
    if (field === 'confirm') this.showConfirm.update((v) => !v);
  }

  onCancel() {
    this.passwordForm.reset();
  }

  onSubmit() {
    if (this.passwordForm.invalid || !this.isChecklistValid()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
    };

    this.authService
      .changePassword(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Password updated successfully!', 'Close', { duration: 3000 });
          this.passwordForm.reset();
        },
        error: (err) => {
          this.snackBar.open(err.error?.detail || 'Failed to update password.', 'Close', {
            duration: 4000,
          });
        },
      });
  }
}

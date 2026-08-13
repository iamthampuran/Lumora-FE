import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, LoaderComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly isSubmitted = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isLoginSuccess = signal(false);

  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    rememberMe: new FormControl(false, {
      nonNullable: true,
    }),
  });

  // Signal to track password visibility
  showPassword = signal<boolean>(false);

  // Method to toggle the signal value
  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  goToSignup(): void {
    void this.router.navigate(['/auth/user']);
  }

  hasControlError(controlName: 'email' | 'password', errorName: string): boolean {
    const control = this.loginForm.controls[controlName];
    return (control.touched || this.isSubmitted()) && control.hasError(errorName);
  }

  loginUser(): void {
    this.isSubmitted.set(true);
    this.errorMessage.set(null);
    this.isLoginSuccess.set(false);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.controls.email.value.trim().toLowerCase();
    const password = this.loginForm.controls.password.value;
    const rememberMe = this.loginForm.controls.rememberMe.value;

    this.isSubmitting.set(true);

    this.authService
    .signInUser(email, password)
    .pipe(finalize(() => this.isSubmitting.set(false)))
    .subscribe({
      next: (response) => {
        this.authService.storeTokens(response.accessToken, response.refreshToken, rememberMe);
        this.isLoginSuccess.set(true);
        void this.router.navigate([this.authService.getRoleDashboardPath()]);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        return 'User not found';
      }

      if (error.status >= 400 && error.status < 500) {
        return 'Invalid credentials entered';
      }

      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }

      if (
        typeof error.error === 'object' &&
        error.error !== null &&
        'message' in error.error &&
        typeof error.error.message === 'string' &&
        error.error.message.trim().length > 0
      ) {
        return error.error.message;
      }

      if (typeof error.message === 'string' && error.message.trim().length > 0) {
        return error.message;
      }
    }

    return 'Unable to sign in. Please check your credentials and try again.';
  }
}

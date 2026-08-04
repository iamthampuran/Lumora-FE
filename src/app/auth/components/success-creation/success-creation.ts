import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-creation',
  imports: [],
  templateUrl: './success-creation.html',
  styleUrl: './success-creation.css',
})
export class SuccessCreation {
  private router = inject(Router);

  // Signal to hold the countdown value
  countdown = signal<number>(30);
  readonly showSuccessToast = signal(true);

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.toastTimeout = window.setTimeout(() => {
      this.showSuccessToast.set(false);
    }, 3500);

    // Start the countdown timer when the component loads
    this.timerInterval = window.setInterval(() => {
      this.countdown.update((val) => val - 1);

      if (this.countdown() === 0) {
        this.goToLogin();
      }
    }, 1000);
  }

  ngOnDestroy() {
    // Clean up the interval if the user leaves the page early
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  goToLogin() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }

    // Navigate to the login route
    void this.router.navigate(['/login']);
  }
}

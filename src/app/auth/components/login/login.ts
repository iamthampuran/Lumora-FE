import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);

  // Signal to track password visibility
  showPassword = signal<boolean>(false);

  // Method to toggle the signal value
  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  goToSignup(): void {
    void this.router.navigate(['/auth/user']);
  }
}

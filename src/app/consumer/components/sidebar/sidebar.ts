import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader';

@Component({
  selector: 'app-consumer-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  imports: [LoaderComponent]
})
export class ConsumerSidebar implements OnInit {
  readonly isProfileMenuOpen = signal(false);
  readonly isLoggingOut = signal(false);
  authService = inject(AuthService);
  router: Router = inject(Router);
  userName = signal<string | null>(null);

  ngOnInit(): void {
    this.userName.set(this.authService.getUserDetailsFromToken('unique_name'));
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((value) => !value);
  }

  logoutUser(): void{
    this.isLoggingOut.set(true);
    this.authService.logoutUser().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);
        this.authService.clearTokens();
        this.router.navigate(['/auth/login']); // Redirect to login page
      },
      error: (error) => {
        console.error('Error during logout:', error);
      }
    });
  }
}

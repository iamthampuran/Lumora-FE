import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consumer-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  imports: [LoaderComponent, RouterModule, CommonModule]
})
export class ConsumerSidebar implements OnInit {
  readonly isProfileMenuOpen = signal(false);
  readonly isLoggingOut = signal(false);
  authService = inject(AuthService);
  router: Router = inject(Router);
  userName = signal<string | null>(null);
  profileUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.userName.set(this.authService.getUserDetailsFromToken('unique_name'));
    this.profileUrl.set(this.authService.getUserDetailsFromToken('avatarUrl'));
    console.log('User Name:', this.userName());
    console.log('Profile URL:', this.profileUrl());
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((value) => !value);
  }

  logoutUser(): void{
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.authService.logoutUser().pipe(
      finalize(() => this.isLoggingOut.set(false))
    ).subscribe({
      next: () => {
        this.authService.clearTokens();
        void this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
      }
    });
  }

  goToEventsPage() : void{
    this.router.navigate(['/consumer/events']);
  }
}

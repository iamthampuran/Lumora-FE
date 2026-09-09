import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-studio-sidebar',
  imports: [RouterModule, CommonModule],
  templateUrl: './studio-sidebar.html',
  styleUrl: './studio-sidebar.css',
})
export class StudioSidebar {
  authService = inject(AuthService);
  router = inject(Router);

  studioName = signal<string>('Studio');
  profileUrl = signal<string | null>(null);

  ngOnInit() {
    this.studioName.set(this.authService.getUserDetailsFromToken('unique_name') || 'Studio');
    this.profileUrl.set(this.authService.getUserDetailsFromToken('avatarUrl'));
  }

  logoutUser(): void {
    this.authService.logoutUser().subscribe({
      next: () => {
        this.authService.clearTokens();
        void this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
      }
    });
  }
}

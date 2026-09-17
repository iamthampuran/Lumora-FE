import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TwoFactorWizard } from '../two-factor-wizard/two-factor-wizard';
import { AuthService } from '../../../auth/services/auth.service';
import { CurrentUserResponse } from '../../../auth/models/current-user-response';
import { finalize } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { ProfileInformation } from '../profile-information/profile-information';
import { ChangePassword } from '../../../auth/components/change-password/change-password';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, TwoFactorWizard, LoaderComponent, ProfileInformation, ChangePassword],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  activeTab = signal<'profile' | 'password' | 'notifications' | 'privacy'>('profile');

  private authService = inject(AuthService);
  // 2FA State
  isTwoFactorEnabled = signal<boolean>(false);
  isTwoFactorModalOpen = signal<boolean>(false);

  userData = signal<CurrentUserResponse | null>(null);
  isLoading = signal<boolean>(true);

  // In a real app, you would fetch this from the user's profile upon initialization.

  ngOnInit() {
    this.fetchUserData();
  }

  fetchUserData() {
    this.isLoading.set(true);
    this.authService.getCurrentUser()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.userData.set(data),
        error: (err) => console.error('Failed to fetch user data', err)
      });
  }

  openTwoFactorModal() {
    this.isTwoFactorModalOpen.set(true);
  }

  closeTwoFactorModal() {
    this.isTwoFactorModalOpen.set(false);
  }

  onTwoFactorSetupComplete() {
    // Optimistically update the local signal so the UI updates immediately
    this.userData.update(data => data ? { ...data, isTwoFactorEnabled: true } : null);
  }

  onProfileUpdated(updatedUser: CurrentUserResponse) {
    this.userData.set(updatedUser);
  }

  disableTwoFactor() {
    // TODO: Connect to your backend API to disable 2FA
    // this.authService.disable2Fa().subscribe(() => {
        this.userData.update(data => data ? { ...data, isTwoFactorEnabled: false } : null);
    // });
  }
}

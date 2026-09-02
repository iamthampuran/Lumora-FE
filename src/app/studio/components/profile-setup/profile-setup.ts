import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { StudioService } from '../../servies/studio.service';
import { ProfileCompletionResult, ProfileCompletionStep } from '../../models/profile-completion';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-profile-setup',
  imports: [CommonModule, LoaderComponent],
  templateUrl: './profile-setup.html',
  styleUrl: './profile-setup.css',
})
export class ProfileSetup implements OnInit {

  private authService = inject(AuthService);
  private studioService = inject(StudioService);
  private router = inject(Router);

  completionData = signal<ProfileCompletionResult | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    const studioId = this.authService.getRoleScopedProfileId();

    if (studioId){
      this.studioService.getProfileCompletionStatus(studioId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
          next: (res) => this.completionData.set(res),
          error: (err) => console.error('Error fetching completion status', err)
        });
    }
    else{
      this.isLoading.set(false);
    }
  }

  goToSettings(step: ProfileCompletionStep){
    this.router.navigate([`/studio/settings`]);
  }

  logoutUser(): void {
    this.authService.logoutUser().subscribe({
      next: () => {
        this.authService.clearTokens();
        void this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
      }
    });
  }

  getActionText(stepName: string): string {
    if (stepName.includes('Logo')) return 'Upload Logo';
    if (stepName.includes('Cover')) return 'Upload Cover';
    if (stepName.includes('Photos')) return 'Add Photos';
    if (stepName.includes('Styles')) return 'Add Styles';
    if (stepName.includes('Team')) return 'Add Team';
    if (stepName.includes('Service Area')) return 'Set Service Area';
    if (stepName.includes('Verify')) return 'Verify Now';
    return 'Complete Step';
  }

}

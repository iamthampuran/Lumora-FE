import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { StudioService } from '../../services/studio.service';
import { ProfileCompletionResult, ProfileCompletionStep } from '../../models/profile-completion';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { finalize } from 'rxjs';
import { UploadLogo } from '../upload-logo/upload-logo';
import { UploadCover } from '../upload-cover/upload-cover';
import { UploadPortfolio } from '../upload-portfolio/upload-portfolio';
import { ManageTags } from '../manage-tags/manage-tags';
import { ManageTeams } from '../manage-teams/manage-teams';

@Component({
  selector: 'app-profile-setup',
  imports: [CommonModule, LoaderComponent, UploadLogo, UploadCover, UploadPortfolio, ManageTags, ManageTeams],
  templateUrl: './profile-setup.html',
  styleUrl: './profile-setup.css',
})
export class ProfileSetup implements OnInit {
  private authService = inject(AuthService);
  private studioService = inject(StudioService);
  private router = inject(Router);

  completionData = signal<ProfileCompletionResult | null>(null);
  isLoading = signal<boolean>(true);
  activeModal = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProfileCompletionStatus();
  }

  protected loadProfileCompletionStatus(): void {
    const studioId = this.authService.getRoleScopedProfileId();
    if (studioId) {
      this.isLoading.set(true);
      this.studioService
        .getProfileCompletionStatus(studioId)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res) => {
            this.completionData.set(res);
            if (this.areAllStepsCompleted(res)) {
              this.activeModal.set(null);
              void this.router.navigate(['/studio/dashboard']);
            }
          },
          error: (err) => console.error('Error fetching completion status', err),
        });
      return;
    }
    this.isLoading.set(false);
  }

  private areAllStepsCompleted(data: ProfileCompletionResult): boolean {
    return (data.steps.length > 0 && data.steps.every((step) => step.isCompleted)) || data.percentage >= 100;
  }

goToSettings(step: ProfileCompletionStep) {
    if (step.title.includes('Logo')) this.activeModal.set('Logo');
    else if (step.title.includes('Cover')) this.activeModal.set('Cover');
    else if (step.title.includes('Photos')) this.activeModal.set('Photos');
    else if (step.title.includes('Styles')) this.activeModal.set('Styles');
    else if (step.title.includes('Team')) this.activeModal.set('Team'); // Add This Map
    else this.router.navigate(['/studio/settings']); 
  }

  logoutUser(): void {
    this.authService.logoutUser().subscribe({
      next: () => {
        this.authService.clearTokens();
        void this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
      },
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

  // NEW METHOD: Just close the modal and refresh!
  onLogoUploaded() {
    this.activeModal.set(null);
    this.loadProfileCompletionStatus();
  }

  onCoverUploaded() {
    this.activeModal.set(null);
    this.loadProfileCompletionStatus();
  }

  onPortfolioUpdated() {
    this.loadProfileCompletionStatus();
  }

  onTagsSaved() {
    this.activeModal.set(null);
    this.loadProfileCompletionStatus();
  }

  // Add the refresh handler
  onTeamUpdated() {
    this.activeModal.set(null);
    this.loadProfileCompletionStatus();
  }
}

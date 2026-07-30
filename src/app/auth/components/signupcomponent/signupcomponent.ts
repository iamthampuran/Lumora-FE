import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignupFormComponent } from '../signup-form/signup-form';
import { UserRole } from '../../enums/UserRole';
import { CreateconsumerComponent } from '../createconsumer.component/createconsumer.component';
import { CreatestudioComponent } from '../createstudio.component/createstudio.component';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { Router } from '@angular/router';
import { RegistrationSuccessAccessService } from '../../services/registration-success-access.service';

@Component({
  selector: 'app-signupcomponent',
  imports: [CommonModule, SignupFormComponent, CreateconsumerComponent, CreatestudioComponent],
  templateUrl: './signupcomponent.html',
  styleUrl: './signupcomponent.css',
})
export class Signupcomponent {
  private readonly router = inject(Router);
  private readonly registrationSuccessAccessService = inject(RegistrationSuccessAccessService);
  readonly UserRole = UserRole;
  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly selectedRole = signal<UserRole>(UserRole.Cosnsumer);
  readonly createdUserId = signal<string | null>(null);
  readonly isPageTransitionLoading = signal(false);
  readonly loaderComponent = LoaderComponent;

  readonly title = computed(() =>
    this.currentStep() === 1 ? 'Create your account' : 'Complete your profile'
  );

  readonly subtitle = computed(() =>
    this.currentStep() === 1
      ? "Let's start with your basic details."
      : 'Help clients discover you with a few more details.'
  );

  isStepActive(step: 1 | 2 | 3): boolean {
    return this.currentStep() === step;
  }

  isStepCompleted(step: 1 | 2 | 3): boolean {
    return this.currentStep() > step;
  }

  onAccountDetailsCompleted(event: { role: UserRole; email: string; createdUserId: string }): void {
    if (this.isPageTransitionLoading()) {
      return;
    }

    this.isPageTransitionLoading.set(true);
    this.selectedRole.set(event.role);
    this.createdUserId.set(event.createdUserId);

    window.setTimeout(() => {
      this.currentStep.set(2);
      this.isPageTransitionLoading.set(false);
    }, 450);
  }

  onProfileCreationCompleted(): void {
    this.currentStep.set(3);
    this.registrationSuccessAccessService.grantAccess();
    void this.router.navigate(['/auth/success-creation']);
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}

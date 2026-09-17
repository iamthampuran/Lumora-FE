import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CurrentUserResponse } from '../../../auth/models/current-user-response';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../auth/services/auth.service';
import { ConsumerService } from '../../services/consumer.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-profile-information',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-information.html',
  styleUrl: './profile-information.css',
})
export class ProfileInformation implements OnInit {
  userData = input.required<CurrentUserResponse>();
  userUpdated = output<CurrentUserResponse>();

  private fb = inject(FormBuilder);
  private consumerService = inject(ConsumerService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileForm!: FormGroup;
  isSaving = signal<boolean>(false);
  isUploadingAvatar = signal<boolean>(false);

  constructor() {
    effect(() => {
      const data = this.userData();
      if (data && this.profileForm) {
        this.resetFormToOriginalData();
      }
    });
  }

  ngOnInit(): void {
    const initialData = this.userData();
    this.profileForm = this.fb.group({
      fullName: [
        initialData?.fullName || '',
        [Validators.required, Validators.maxLength(100)],
      ],
      phoneNumber: [
        initialData?.phoneNumber || '',
        [
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern(/^(\+91|91)?[6-9]\d{9}$/),
        ],
      ],
      email: [{ value: initialData?.email || '', disabled: true }], 
      bio: [initialData?.bio || '', [Validators.maxLength(500)]],
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  resetFormToOriginalData() {
    const data = this.userData();
    this.profileForm.patchValue({
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      bio: data.bio
    });
    this.profileForm.markAsPristine();
  }

  // --- Reusable Logout Flow ---
  private executeLogoutFlow(message: string) {
    this.snackBar.open(message, 'Close', { duration: 4000 });
    
    this.authService.logoutUser().subscribe({
      next: () => {
        this.authService.clearTokens();
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearTokens();
        void this.router.navigate(['/login']);
      }
    });
  }

  onSubmitProfile() {
    if (this.profileForm.invalid) return;

    const consumerId = this.authService.getRoleScopedProfileId();
    if (!consumerId) return;

    this.isSaving.set(true);
    const updatedData = {
      fullName: this.profileForm.get('fullName')?.value,
      phoneNumber: this.profileForm.get('phoneNumber')?.value,
      bio: this.profileForm.get('bio')?.value
    };

    this.consumerService.updateProfileDetails(updatedData)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.profileForm.markAsPristine();
          this.executeLogoutFlow('Profile updated successfully! Please log in again.');
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to update profile.', 'Close', { duration: 3000 });
        }
      });
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (file.size > 1024 * 1024) {
        this.snackBar.open('File is too large. Maximum size is 1MB.', 'Close', { duration: 3000 });
        return;
      }

      this.uploadAvatar(file);
    }
    input.value = ''; 
  }

  uploadAvatar(file: File) {
    const consumerId = this.authService.getRoleScopedProfileId();
    if (!consumerId) return;

    this.isUploadingAvatar.set(true);
    
    this.consumerService.updateProfilePicture(consumerId, file)
      .pipe(finalize(() => this.isUploadingAvatar.set(false)))
      .subscribe({
        next: () => {
          this.executeLogoutFlow('Avatar updated successfully! Please log in again.');
        },
        error: (err) => {
          if (err.status === 200 || err.status === 204) {
            this.executeLogoutFlow('Avatar updated successfully! Please log in again.');
            return;
          }
          this.snackBar.open(err.error?.message || 'Failed to upload avatar.', 'Close', { duration: 3000 });
        }
      });
  }
}
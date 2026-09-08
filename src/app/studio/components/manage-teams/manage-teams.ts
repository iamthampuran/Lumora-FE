import { Component, inject, input, output, signal } from '@angular/core';
import { StudioService } from '../../services/studio.service';
import { AuthService } from '../../../auth/services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AddTeamMembersPayload } from '../../models/studio-profile-model';
import { CommonModule } from '@angular/common';


interface LocalTeamMember{
  fullName: string;
  phoneNumber: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-manage-teams',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-teams.html',
  styleUrl: './manage-teams.css',
})

export class ManageTeams {
  isModal = input<boolean>(false);
  close = output<void>();
  updated = output<void>();

  private studioService = inject(StudioService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Local State
  teamMembers = signal<LocalTeamMember[]>([]);
  isAdding = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  popularRoles = ['Photographer', 'Videographer', 'Editor', 'Assistant', 'Studio Manager'];

  // Avatar colors
  private colorClasses = [
    'bg-[#FFF5F0] text-[#CF6B4E]', 
    'bg-[#F0FDF4] text-[#166534]', 
    'bg-[#EFF6FF] text-[#1D4ED8]', 
    'bg-[#FAF5FF] text-[#6B21A8]', 
    'bg-[#FEF2F2] text-[#BE185D]', 
  ];

  memberForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['', [Validators.required, Validators.maxLength(50)]]
  });

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return this.colorClasses[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.colorClasses.length;
    return this.colorClasses[index];
  }

  openAddModal() {
    this.memberForm.reset();
    this.errorMessage.set(null);
    this.isAdding.set(true);
  }

  closeAddModal() {
    this.isAdding.set(false);
  }

  selectRole(role: string) {
    this.memberForm.controls['role'].setValue(role);
    this.memberForm.controls['role'].markAsTouched();
  }

  sanitizePhone(event: Event) {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\D/g, '').slice(0, 10);
    this.memberForm.controls['phoneNumber'].setValue(sanitized, { emitEvent: false });
    input.value = sanitized;
  }

  hasControlError(controlName: string, errorName: string): boolean {
    const control = this.memberForm.get(controlName);
    return !!(control?.hasError(errorName) && (control.touched || control.dirty));
  }

  // --- LOCAL STATE MANAGEMENT ---
  addMember() {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    const newMember: LocalTeamMember = {
      fullName: this.memberForm.value.fullName,
      phoneNumber: `+91${this.memberForm.value.phoneNumber}`,
      email: this.memberForm.value.email,
      role: this.memberForm.value.role
    };

    this.teamMembers.update(members => [...members, newMember]);
    this.isAdding.set(false);
    this.memberForm.reset();
  }

  // Changed to accept the array index instead of an ID
  removeMember(index: number) {
    this.teamMembers.update(members => {
      const copy = [...members];
      copy.splice(index, 1);
      return copy;
    });
  }

  // --- BATCH API SUBMISSION ---
  onSave() {
    const studioId = this.authService.getRoleScopedProfileId();
    if (!studioId) return;

    if (this.teamMembers().length === 0) {
      this.errorMessage.set('Add at least one employee before saving.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const payload: AddTeamMembersPayload = {
      studioId: studioId,
      employeeDetails: this.teamMembers().map(member => ({
        name: member.fullName,
        phonenumber: member.phoneNumber,
        email: member.email,
        role: member.role
      }))
    };

    this.studioService.addTeamMembers(studioId, payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.updated.emit(); 
        },
        error: (err) => {
          if (err.status === 200 || err.status === 204) {
            this.updated.emit();
            return;
          }
          this.errorMessage.set('Failed to save team members. Please try again.');
        }
      });
  }

  onCancel() {
    this.close.emit();
  }
}

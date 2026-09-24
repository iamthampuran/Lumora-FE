import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { InquiryData } from '../../models/inquiry-details';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { StudioService } from '../../services/studio.service';
import { TeamMember } from '../../models/inquiry-details';

@Component({
  selector: 'app-inquiry-details',
  imports: [CommonModule, FormsModule, RouterModule, LoaderComponent],
  templateUrl: './inquiry-details.html',
  styleUrl: './inquiry-details.css',
})
export class InquiryDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studioService = inject(StudioService);
  private snackBar = inject(MatSnackBar);

  // Component State Signals
  inquiryId = signal<string | null>(null);
  inquiry = signal<InquiryData | null>(null);
  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Team Assignment Modal State
  isAssignModalOpen = signal<boolean>(false);
  teamSearchQuery = signal<string>('');
  assignmentNotes = signal<string>('');
  selectedTeamMemberIds = signal<string[]>([]);
  isAcceptModalOpen = signal<boolean>(false);
  isDeclineModalOpen = signal<boolean>(false);
  declineReason = signal<string>('');

  // Available professionals list mock for assignment modal
  availableProfessionals = signal<TeamMember[]>([
    { id: 'prof-1', name: 'Julian Vane', role: 'Lead Photographer', location: 'London', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' },
    { id: 'prof-2', name: 'Sarah Chen', role: 'Retoucher', location: 'NYC', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150' },
    { id: 'prof-3', name: 'Rohan Kapoor', role: 'Videographer', location: 'Mumbai', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150' },
    { id: 'prof-4', name: 'Meera Nair', role: 'Coordinator', location: 'Kochi', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150' }
  ]);

  // Computed Helpers
  filteredProfessionals = computed(() => {
    const q = this.teamSearchQuery().toLowerCase().trim();
    if (!q) return this.availableProfessionals();
    return this.availableProfessionals().filter(
      p => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
    );
  });

  statusBadge = computed(() => {
    const status = this.inquiry()?.status?.toLowerCase();
    switch (status) {
      case 'accepted':
        return { label: 'PAYMENT PENDING', class: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'confirmed':
      case 'paid':
        return { label: 'PAYMENT CONFIRMED', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'rejected':
        return { label: 'DECLINED', class: 'bg-red-100 text-red-800 border-red-200' };
      default:
        return { label: 'NEW INQUIRY', class: 'bg-orange-100 text-[#CF6B4E] border-orange-200' };
    }
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('inquiryId');
    if (id) {
      this.inquiryId.set(id);
      this.fetchInquiryDetails(id);
    } else {
      this.isLoading.set(false);
      this.errorMessage.set('Inquiry ID is missing.');
    }
  }

  fetchInquiryDetails(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studioService.getInquiryDetails(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: InquiryData) => {
          this.inquiry.set(res);
        },
        error: (err) => {
          console.error('Error fetching inquiry details:', err);
          this.errorMessage.set('Failed to load inquiry details. Please try again.');
        }
      });
  }

  acceptInquiry(): void {
    this.processInquiryResponse(true);
  }

  declineInquiry(): void {
    this.processInquiryResponse(false);
  }

  // // --- Team Member Assignment Modal ---
  openAssignModal(): void {
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
    this.teamSearchQuery.set('');
    this.assignmentNotes.set('');
  }

  toggleTeamMember(memberId: string): void {
    const current = this.selectedTeamMemberIds();
    if (current.includes(memberId)) {
      this.selectedTeamMemberIds.set(current.filter(id => id !== memberId));
    } else {
      this.selectedTeamMemberIds.set([...current, memberId]);
    }
  }

  isMemberSelected(memberId: string): boolean {
    return this.selectedTeamMemberIds().includes(memberId);
  }

  confirmTeamAssignments(): void {
  //   const id = this.inquiryId();
  //   if (!id || this.selectedTeamMemberIds().length === 0) return;

  //   this.isActionLoading.set(true);
  //   const assignedMembers = this.availableProfessionals().filter(p => this.selectedTeamMemberIds().includes(p.id));

  //   this.studioService.assignTeamMembers(id, this.selectedTeamMemberIds(), this.assignmentNotes())
  //     .pipe(finalize(() => {
  //       this.isActionLoading.set(false);
  //       this.closeAssignModal();
  //     }))
  //     .subscribe({
  //       next: () => {
  //         this.snackBar.open('Team members assigned successfully!', 'Close', { duration: 3000 });
  //         // Optimistically update local view
  //         this.inquiry.update(data => data ? { ...data, teamAssignments: assignedMembers } : null);
  //       },
  //       error: () => {
  //         this.snackBar.open('Team members assigned locally.', 'Close', { duration: 3000 });
  //         this.inquiry.update(data => data ? { ...data, teamAssignments: assignedMembers } : null);
  //       }
  //     });
  }

  private processInquiryResponse(isAccepted: boolean, rejectedMessage?: string | null): void {
  const id = this.inquiryId();
  if (!id) return;

  this.isActionLoading.set(true);
  
  // Make sure your StudioService has the respondToInquiry method implemented
  this.studioService.respondToInquiry(id, isAccepted, rejectedMessage)
    .pipe(finalize(() => {
      this.isActionLoading.set(false);
      if (isAccepted) this.closeAcceptModal();
      else this.closeDeclineModal();
    }))
    .subscribe({
      next: () => {
        this.snackBar.open(isAccepted ? 'Inquiry accepted!' : 'Inquiry declined.', 'Close', { duration: 3000 });
        this.fetchInquiryDetails(id);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to update inquiry.', 'Close', { duration: 3000 });
      }
    });
}

  downloadReceipt(): void {
    this.snackBar.open('Downloading payment receipt...', 'Close', { duration: 2500 });
  }

  copyContact(text: string, type: string): void {
    navigator.clipboard.writeText(text);
    this.snackBar.open(`${type} copied to clipboard!`, 'Close', { duration: 2000 });
  }

  goBack(): void {
    this.router.navigate(['/studio/inquiries']);
  }

  openAcceptModal(): void {
  this.isAcceptModalOpen.set(true);
}

closeAcceptModal(): void {
  this.isAcceptModalOpen.set(false);
}

openDeclineModal(): void {
  this.declineReason.set(''); // Reset reason
  this.isDeclineModalOpen.set(true);
}

closeDeclineModal(): void {
  this.isDeclineModalOpen.set(false);
}

// --- Action Executions ---
confirmAccept(): void {
  this.processInquiryResponse(true);
}

confirmDecline(): void {
  const reason = this.declineReason().trim();
  this.processInquiryResponse(false, reason.length > 0 ? reason : null);
}
}